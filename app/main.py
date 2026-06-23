import csv
import io
import os
from datetime import datetime, timedelta

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db import get_db, init_db
from app.jobs import execute_run
from app.models import Lead, Run, User
from app.ai import generate_pitch
from app.email_send import send_email
from app.plans import PLANS, list_addons, list_plans, plan_quota
from app.schemas import (
    AnthropicKeyRequest,
    ApiKeyRequest,
    LeadResponse,
    LoginRequest,
    PlanSelectRequest,
    RunCreateRequest,
    RunResponse,
    SendEmailRequest,
    SignupRequest,
    SmtpSettingsRequest,
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

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        company_name=payload.company_name.strip(),
        phone=(payload.phone or "").strip(),
    )
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


@app.get("/addons")
def get_addons() -> list[dict]:
    """Public one-time add-ons (e.g. bring-your-own-API-key)."""
    return list_addons()


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


@app.put("/me/anthropic-key", response_model=UserResponse)
def save_anthropic_key(
    payload: AnthropicKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.anthropic_api_key = payload.api_key.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/me/anthropic-key", response_model=UserResponse)
def delete_anthropic_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.anthropic_api_key = None
    db.commit()
    db.refresh(current_user)
    return current_user


@app.put("/me/smtp", response_model=UserResponse)
def save_smtp(
    payload: SmtpSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.smtp_host = payload.smtp_host.strip()
    current_user.smtp_port = payload.smtp_port
    current_user.smtp_username = payload.smtp_username.strip()
    current_user.smtp_password = payload.smtp_password
    current_user.smtp_from_name = (payload.smtp_from_name or "").strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@app.delete("/me/smtp", response_model=UserResponse)
def delete_smtp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.smtp_host = None
    current_user.smtp_port = None
    current_user.smtp_username = None
    current_user.smtp_password = None
    current_user.smtp_from_name = None
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


# A scrape should never legitimately run this long; anything older that's
# still "running"/"pending" means the worker died (e.g. the host recycled the
# process mid-scrape) and the run is a zombie.
STUCK_RUN_TIMEOUT = timedelta(minutes=20)


def _fail_stuck_runs(db: Session, user_id: str) -> None:
    """Lazily mark zombie runs as failed whenever the dashboard loads."""
    cutoff = datetime.utcnow() - STUCK_RUN_TIMEOUT
    stuck = (
        db.query(Run)
        .filter(
            Run.user_id == user_id,
            Run.status.in_(["running", "pending"]),
            Run.created_at < cutoff,
        )
        .all()
    )
    if not stuck:
        return
    for run in stuck:
        run.status = "failed"
        run.error_message = (
            "Run timed out — the server may have restarted mid-scrape. "
            "Please try again, ideally with fewer search terms."
        )
        run.finished_at = datetime.utcnow()
    db.commit()


@app.get("/runs", response_model=list[RunResponse])
def list_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Run]:
    _fail_stuck_runs(db, current_user.id)
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


def _get_owned_lead(lead_id: str, db: Session, current_user: User) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    _get_owned_run(lead.run_id, db, current_user)  # enforces ownership
    return lead


@app.post("/leads/{lead_id}/pitch", response_model=LeadResponse)
def generate_lead_pitch(
    lead_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Lead:
    lead = _get_owned_lead(lead_id, db, current_user)
    if not current_user.has_ai_key:
        raise HTTPException(
            status_code=400,
            detail="Add your Anthropic API key in Settings to generate AI suggestions.",
        )
    try:
        lead.ai_pitch = generate_pitch(lead, current_user.anthropic_api_key)
    except Exception as exc:  # noqa: BLE001 - surface AI failures to the user
        raise HTTPException(status_code=502, detail=str(exc))
    db.commit()
    db.refresh(lead)
    return lead


@app.post("/leads/{lead_id}/email")
def email_lead(
    lead_id: str,
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    lead = _get_owned_lead(lead_id, db, current_user)
    # The scraped email column can hold several addresses ("a@x.com; b@y.com").
    to_address = (lead.email or "").split(";")[0].strip()
    try:
        send_email(current_user, to_address, payload.subject, payload.body)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"sent_to": to_address}


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
