from datetime import datetime, timezone

from app.crypto import decrypt
from app.db import SessionLocal
from app.models import Lead, Run, User
from lead_generation_places import run_pipeline


def execute_run(run_id: str, requested_max_records: int) -> None:
    """Runs the scraping pipeline for a Run row and persists results.

    Opens a separate short-lived DB session for each phase (start,
    finish) instead of holding one connection open across the whole
    scrape. The scrape itself can take several minutes of pure network
    I/O with no DB activity, and a long-idle connection gets dropped by
    Neon's auto-suspend, so it must not be held across that gap.
    """
    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        if not run:
            return

        run.status = "running"
        db.commit()

        user = db.get(User, run.user_id)
        # Bring-your-own-key users run on their own Google billing, so the
        # plan quota is not enforced and their key is used for the scrape.
        user_api_key = decrypt(user.google_api_key) if user.has_own_api_key else None
        if user_api_key:
            effective_max = requested_max_records
        else:
            remaining_quota = max(user.monthly_lead_quota - user.leads_used_this_period, 0)
            effective_max = min(requested_max_records, remaining_quota)
        terms = [t.strip() for t in run.search_terms.split(",") if t.strip()]
        location_query = run.location_query

        if effective_max <= 0:
            run.status = "failed"
            run.error_message = "Monthly lead quota exhausted."
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            return
    finally:
        db.close()

    try:
        records = run_pipeline(
            search_terms=terms,
            location_query=location_query,
            save_output=False,
            max_records=effective_max,
            include_email_scrape=True,
            api_key=user_api_key,
            progress_cb=None,
        )
    except Exception as exc:  # noqa: BLE001 - surface any pipeline failure to the user
        db = SessionLocal()
        try:
            run = db.get(Run, run_id)
            run.status = "failed"
            run.error_message = str(exc)
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
        finally:
            db.close()
        return

    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        user = db.get(User, run.user_id)

        for record in records:
            db.add(
                Lead(
                    run_id=run.id,
                    business_name=record.business_name,
                    phone_number=record.phone_number,
                    website=record.website,
                    address=record.address,
                    rating=record.rating,
                    total_reviews=record.total_reviews,
                    category=record.category,
                    city=record.city,
                    country=record.country,
                    email=record.email,
                )
            )

        run.record_count = len(records)
        run.status = "completed"
        run.finished_at = datetime.now(timezone.utc)
        user.leads_used_this_period += len(records)
        db.commit()
    except Exception as exc:  # noqa: BLE001 - surface any save failure to the user
        db.rollback()
        run.status = "failed"
        run.error_message = str(exc)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()
