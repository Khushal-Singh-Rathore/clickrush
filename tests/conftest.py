import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal, engine
from app.limiter import limiter
from app.main import app

# Disable slowapi rate limiting and clear Turnstile secret during automated pytest test execution
limiter.enabled = False
settings.TURNSTILE_SECRET_KEY = ""


@pytest.fixture(scope="function")
def db_session():
    """Fixture providing a transactional database session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Fixture providing a FastAPI TestClient with database session override."""
    from app.database import get_db

    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
