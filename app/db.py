import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./saas.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401 (register models on Base.metadata)

    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()


def _run_lightweight_migrations() -> None:
    """Add newly-introduced columns to already-existing tables.

    create_all() only creates missing tables, never alters existing ones,
    so columns added after a table was first created (e.g. users.google_api_key)
    must be added by hand. Works for both SQLite (local) and Postgres (Neon).
    """
    inspector = inspect(engine)

    def _add_missing(table: str, expected: dict[str, str]) -> None:
        existing = {col["name"] for col in inspector.get_columns(table)}
        missing = {name: typ for name, typ in expected.items() if name not in existing}
        if missing:
            with engine.begin() as conn:
                for name, typ in missing.items():
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {typ}"))

    _add_missing(
        "users",
        {
            "google_api_key": "TEXT",
            "anthropic_api_key": "TEXT",
            "ai_provider": "VARCHAR(50)",
            "full_name": "VARCHAR(255)",
            "company_name": "VARCHAR(255)",
            "phone": "VARCHAR(50)",
            "smtp_host": "VARCHAR(255)",
            "smtp_port": "INTEGER",
            "smtp_username": "VARCHAR(255)",
            "smtp_password": "TEXT",
            "smtp_from_name": "VARCHAR(255)",
        },
    )
    _add_missing("leads", {"ai_pitch": "TEXT"})
