"""Database configuration and session management"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import JSONB
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Convert any async drivers to sync psycopg3 (Python 3.13 compatible)
if DATABASE_URL:
    # Replace asyncpg with psycopg
    if "postgresql+asyncpg://" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg://")
    # For Render.com PostgreSQL, convert postgres:// to postgresql+psycopg://
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    # Ensure we're using psycopg3 dialect for generic postgresql://
    elif DATABASE_URL.startswith("postgresql://") and "+" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    # Fallback to local PostgreSQL for development with psycopg3
    DATABASE_URL = "postgresql+psycopg://localhost/storyteller_db"
    print("⚠️  DATABASE_URL not set, using local database")

# Create sync engine (Python 3.13 compatible)
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    future=True,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20
)

# Session factory
SessionLocal = sessionmaker(
    engine,
    class_=Session,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database tables
def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

# Close database connection
def close_db():
    """Close database connection"""
    engine.dispose()
    print("✅ Database connection closed")
