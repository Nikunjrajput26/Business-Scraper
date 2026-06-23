import csv
import io
import os

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db import get_db, init_db
from app.jobs import execute_run
from app.models import Lead, Run, User
from app.plans import PLANS, list_plans, plan_quota
from app.schemas import (
    ApiKeyRequest,
    LeadResponse,
    LoginRequest,
    PlanSelectRequest,
    RunCreateRequest,
    RunResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from lead_generation_places import parse_user_prompt

app = FastAPI(title="Lead Scraper SaaS API")

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.post("/auth/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@app.get("/plans")
def get_plans() -> list[dict]:
    """Public pricing tiers, consumed by the marketing site and billing UI."""
    return list_plans()


@app.post("/me/plan", response_model=UserResponse)
def select_plan(
    payload: PlanSelectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    plan_id = payload.plan.strip().lower()
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan.")

    current_user.plan = plan_id
    current_user.monthly_lead_quota = plan_quota(plan_id)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.put("/me/api-key", response_model=UserResponse)
def save_api_key(
    payload: ApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.google_api_key = payload.api_key.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/me/api-key", response_model=UserResponse)
def delete_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.google_api_key = None
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/runs", response_model=RunResponse)
def create_run(
    payload: RunCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Run:
    terms = list(payload.search_terms)
    location = payload.location.strip()

    if payload.prompt.strip():
        parsed_term, parsed_location = parse_user_prompt(payload.prompt)
        if parsed_term and not terms:
            terms = [parsed_term]
        if parsed_location and not location:
            location = parsed_location

    if not terms:
        raise HTTPException(status_code=400, detail="Provide search_terms or a prompt.")
    if not location:
        raise HTTPException(status_code=400, detail="Location is required.")

    # Bring-your-own-key users scrape on their own Google billing, so the
    # plan quota is not enforced for them.
    has_own_key = current_user.has_own_api_key
    remaining_quota = max(current_user.monthly_lead_quota - current_user.leads_used_this_period, 0)
    if not has_own_key and remaining_quota <= 0:
        raise HTTPException(status_code=402, detail="Monthly lead quota exhausted. Upgrade your plan.")

    run = Run(
        user_id=current_user.id,
        search_terms=", ".join(terms),
        location_query=location,
        status="pending",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    requested_max = payload.max_records if has_own_key else min(payload.max_records, remaining_quota)
    background_tasks.add_task(execute_run, run.id, requested_max)

    return run


@app.get("/runs", response_model=list[RunResponse])
def list_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Run]:
    return (
        db.query(Run)
        .filter(Run.user_id == current_user.id)
        .order_by(Run.created_at.desc())
        .all()
    )


def _get_owned_run(run_id: str, db: Session, current_user: User) -> Run:
    run = db.get(Run, run_id)
    if not run or run.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Run not found.")
    return run


@app.get("/runs/{run_id}", response_model=RunResponse)
def get_run(run_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Run:
    return _get_owned_run(run_id, db, current_user)


@app.get("/runs/{run_id}/leads", response_model=list[LeadResponse])
def get_run_leads(
    run_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Lead]:
    run = _get_owned_run(run_id, db, current_user)
    return db.query(Lead).filter(Lead.run_id == run.id).all()


@app.get("/runs/{run_id}/export.csv")
def export_run_csv(
    run_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> StreamingResponse:
    run = _get_owned_run(run_id, db, current_user)
    leads = db.query(Lead).filter(Lead.run_id == run.id).all()

    buffer = io.StringIO()
    fieldnames = [
        "Business Name",
        "Phone Number",
        "Website",
        "Address",
        "Rating",
        "Total Reviews",
        "Category",
        "City",
        "Country",
        "Email",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for lead in leads:
        writer.writerow(
            {
                "Business Name": lead.business_name,
                "Phone Number": lead.phone_number,
                "Website": lead.website,
                "Address": lead.address,
                "Rating": lead.rating,
                "Total Reviews": lead.total_reviews,
                "Category": lead.category,
                "City": lead.city,
                "Country": lead.country,
                "Email": lead.email,
            }
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=run_{run.id}.csv"},
    )
