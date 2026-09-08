"""
Database Engine, Base Model, and Session Management.
Supports PostgreSQL + PostGIS and transparent SQLite fallback for zero-dependency local runs.
"""
import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings
from backend.app.core.logging import logger

# Ensure local data directory exists for SQLite fallback
os.makedirs("data", exist_ok=True)
os.makedirs(settings.CACHE_DIR, exist_ok=True)

database_url = settings.DATABASE_URL

# Check if using sqlite
is_sqlite = database_url.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        database_url,
        echo=False,
        future=True,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info(f"Connected to primary database: {database_url.split('@')[-1] if '@' in database_url else database_url}")
except Exception as e:
    logger.warning(f"Could not connect to configured DATABASE_URL ({e}). Falling back to SQLite local database.")
    fallback_url = f"sqlite:///./{settings.SQLITE_FALLBACK_DB}"
    database_url = fallback_url
    is_sqlite = True
    engine = create_engine(
        fallback_url,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_postgres() -> bool:
    return engine.dialect.name == "postgresql"
