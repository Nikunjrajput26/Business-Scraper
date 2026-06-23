import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    plan: Mapped[str] = mapped_column(String(50), default="free")
    monthly_lead_quota: Mapped[int] = mapped_column(Integer, default=200)
    leads_used_this_period: Mapped[int] = mapped_column(Integer, default=0)
    # Bring-your-own Google Places API key. When set, scrapes run on this
    # key and the monthly lead quota is no longer enforced (Enterprise).
    google_api_key: Mapped[str] = mapped_column(Text, nullable=True)
    # Bring-your-own AI key for lead suggestions. The column is named
    # anthropic_api_key for historical reasons but holds the key for whichever
    # provider is selected in ai_provider (anthropic | openai | gemini).
    anthropic_api_key: Mapped[str] = mapped_column(Text, nullable=True)
    ai_provider: Mapped[str] = mapped_column(String(50), default="anthropic")
    # Per-user outbound email (SMTP / Gmail). Used to send outreach to leads.
    smtp_host: Mapped[str] = mapped_column(String(255), nullable=True)
    smtp_port: Mapped[int] = mapped_column(Integer, nullable=True)
    smtp_username: Mapped[str] = mapped_column(String(255), nullable=True)
    smtp_password: Mapped[str] = mapped_column(Text, nullable=True)
    smtp_from_name: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    runs: Mapped[list["Run"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    @property
    def has_own_api_key(self) -> bool:
        return bool(self.google_api_key and self.google_api_key.strip())

    @property
    def has_smtp(self) -> bool:
        return bool(self.smtp_host and self.smtp_username and self.smtp_password)

    @property
    def has_ai_key(self) -> bool:
        return bool(self.anthropic_api_key and self.anthropic_api_key.strip())


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    search_terms: Mapped[str] = mapped_column(Text, nullable=False)
    location_query: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|running|completed|failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    finished_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="runs")
    leads: Mapped[list["Lead"]] = relationship(back_populates="run", cascade="all, delete-orphan")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), default="")
    phone_number: Mapped[str] = mapped_column(String(50), default="")
    website: Mapped[str] = mapped_column(String(500), default="")
    address: Mapped[str] = mapped_column(String(500), default="")
    rating: Mapped[str] = mapped_column(String(20), default="")
    total_reviews: Mapped[str] = mapped_column(String(20), default="")
    category: Mapped[str] = mapped_column(String(255), default="")
    city: Mapped[str] = mapped_column(String(255), default="")
    country: Mapped[str] = mapped_column(String(255), default="")
    email: Mapped[str] = mapped_column(Text, default="")
    # AI-generated "what services could you sell this business" suggestions.
    ai_pitch: Mapped[str] = mapped_column(Text, nullable=True)
    # Lightweight CRM tracking: new | contacted | replied | won | lost
    status: Mapped[str] = mapped_column(String(20), default="new")
    emailed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    run: Mapped["Run"] = relationship(back_populates="leads")

    @property
    def run_search_terms(self) -> str:
        return self.run.search_terms if self.run else ""

    @property
    def run_location(self) -> str:
        return self.run.location_query if self.run else ""
