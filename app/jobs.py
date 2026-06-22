from datetime import datetime, timezone

from app.db import SessionLocal
from app.models import Lead, Run, User
from lead_generation_places import run_pipeline


def execute_run(run_id: str, requested_max_records: int) -> None:
    """Runs the scraping pipeline for a Run row and persists results.

    Executed in a background thread, so it opens its own DB session
    rather than reusing the request-scoped one from app.db.get_db.
    """
    db = SessionLocal()
    try:
        run = db.get(Run, run_id)
        if not run:
            return

        run.status = "running"
        db.commit()

        user = db.get(User, run.user_id)
        remaining_quota = max(user.monthly_lead_quota - user.leads_used_this_period, 0)
        effective_max = min(requested_max_records, remaining_quota)
        if effective_max <= 0:
            run.status = "failed"
            run.error_message = "Monthly lead quota exhausted."
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            return

        try:
            terms = [t.strip() for t in run.search_terms.split(",") if t.strip()]
            records = run_pipeline(
                search_terms=terms,
                location_query=run.location_query,
                save_output=False,
                max_records=effective_max,
                include_email_scrape=True,
                progress_cb=None,
            )
        except Exception as exc:  # noqa: BLE001 - surface any pipeline failure to the user
            run.status = "failed"
            run.error_message = str(exc)
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            return

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
    finally:
        db.close()
