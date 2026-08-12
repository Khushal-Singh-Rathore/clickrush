import uuid

import pytest


def get_auth_token(client, email="player@example.com", name="Player One"):
    client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": "password123"},
    )
    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    return login_res.json()["access_token"]


def test_start_game_authenticated(client):
    token = get_auth_token(client, email="player1@example.com")
    res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["status"] == "ACTIVE"
    assert data["click_count"] == 0
    assert data["score"] == 0
    assert data["started_at"] is not None
    assert data["ended_at"] is None


def test_start_game_unauthenticated(client):
    res = client.post("/games/start")
    assert res.status_code in (401, 403)


def test_get_game_own_session(client):
    token = get_auth_token(client, email="player2@example.com")
    start_res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    game_id = start_res.json()["id"]

    get_res = client.get(
        f"/games/{game_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == game_id
    assert data["status"] == "ACTIVE"


def test_get_game_other_user_session(client):
    token1 = get_auth_token(client, email="owner@example.com", name="Owner")
    token2 = get_auth_token(client, email="intruder@example.com", name="Intruder")

    start_res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token1}"},
    )
    game_id = start_res.json()["id"]

    # Intruder attempts to fetch Owner's game session
    get_res = client.get(
        f"/games/{game_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert get_res.status_code == 403
    assert get_res.json()["detail"] == "You do not have permission to access this game session"


def test_get_game_nonexistent(client):
    token = get_auth_token(client, email="player3@example.com")
    random_uuid = str(uuid.uuid4())

    res = client.get(
        f"/games/{random_uuid}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Game session not found"
