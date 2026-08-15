import uuid
from datetime import datetime, timezone

import pytest

from tests.test_games import get_auth_token


def test_password_hash_never_leaked(client):
    """Verify that password and password_hash are never returned in API responses."""
    # 1. Register
    reg_res = client.post(
        "/auth/register",
        json={
            "name": "Audit User",
            "email": "audit_privacy@example.com",
            "password": "supersecretpassword123",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "password" not in reg_data
    assert "password_hash" not in reg_data

    # 2. Login
    login_res = client.post(
        "/auth/login",
        json={
            "email": "audit_privacy@example.com",
            "password": "supersecretpassword123",
        },
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 3. Auth Me
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert "password" not in me_data
    assert "password_hash" not in me_data

    # 4. User Profile Stats
    user_me_res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert user_me_res.status_code == 200
    user_data = user_me_res.json()
    assert "password" not in user_data
    assert "password_hash" not in user_data


def test_invalid_uuid_handling(client):
    """Verify invalid UUID parameter format returns 422 Unprocessable Entity instead of 500 error."""
    token = get_auth_token(client, email="uuid_test@example.com")
    res = client.get("/games/invalid-uuid-string", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422


def test_timestamps_are_timezone_aware(client):
    """Verify timestamps returned in API responses are timezone-aware ISO format."""
    token = get_auth_token(client, email="tz_test@example.com")

    # Start game
    start_res = client.post("/games/start", headers={"Authorization": f"Bearer {token}"})
    assert start_res.status_code == 201
    started_at_str = start_res.json()["started_at"]

    # Parse ISO timestamp and check timezone
    parsed_dt = datetime.fromisoformat(started_at_str)
    assert parsed_dt.tzinfo is not None


def test_cross_user_isolation(client):
    """Verify strict user isolation for game sessions across REST endpoints."""
    token1 = get_auth_token(client, email="user_iso1@example.com", name="Iso User 1")
    token2 = get_auth_token(client, email="user_iso2@example.com", name="Iso User 2")

    # User 1 starts game
    start_res = client.post("/games/start", headers={"Authorization": f"Bearer {token1}"})
    game_id = start_res.json()["id"]

    # User 2 attempts to fetch User 1's game
    get_res = client.get(f"/games/{game_id}", headers={"Authorization": f"Bearer {token2}"})
    assert get_res.status_code == 403
    assert get_res.json()["detail"] == "You do not have permission to access this game session"


def test_health_check_endpoint(client):
    """Verify GET /health returns DB connectivity status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
