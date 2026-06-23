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
    existing_user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "google_api_key" not in existing_user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN google_api_key TEXT"))
