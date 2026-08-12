from datetime import timedelta

import pytest
from app.utils.security import create_access_token


def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "testuser@example.com"
    assert "id" in data
    assert data["is_active"] is True
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    user_payload = {
        "name": "Original User",
        "email": "duplicate@example.com",
        "password": "password123",
    }
    first_res = client.post("/auth/register", json=user_payload)
    assert first_res.status_code == 201

    second_res = client.post("/auth/register", json=user_payload)
    assert second_res.status_code == 400
    assert second_res.json()["detail"] == "Email already registered"


def test_login_success(client):
    register_payload = {
        "name": "Login User",
        "email": "login@example.com",
        "password": "mypassword123",
    }
    client.post("/auth/register", json=register_payload)

    login_res = client.post(
        "/auth/login",
        json={
            "email": "login@example.com",
            "password": "mypassword123",
        },
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_incorrect_password(client):
    register_payload = {
        "name": "Wrong Password User",
        "email": "wrongpass@example.com",
        "password": "correctpassword",
    }
    client.post("/auth/register", json=register_payload)

    login_res = client.post(
        "/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "incorrectpassword",
        },
    )
    assert login_res.status_code == 401
    assert login_res.json()["detail"] == "Invalid credentials"


def test_login_nonexistent_email(client):
    login_res = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "anypassword",
        },
    )
    assert login_res.status_code == 401
    assert login_res.json()["detail"] == "Invalid credentials"


def test_get_me_success(client):
    register_res = client.post(
        "/auth/register",
        json={
            "name": "Profile User",
            "email": "profile@example.com",
            "password": "password123",
        },
    )
    user_id = register_res.json()["id"]

    login_res = client.post(
        "/auth/login",
        json={
            "email": "profile@example.com",
            "password": "password123",
        },
    )
    token = login_res.json()["access_token"]

    me_res = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["id"] == user_id
    assert data["email"] == "profile@example.com"
    assert data["name"] == "Profile User"


def test_get_me_without_token(client):
    me_res = client.get("/auth/me")
    assert me_res.status_code == 403 or me_res.status_code == 401


def test_get_me_invalid_token(client):
    me_res = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert me_res.status_code == 401
    assert me_res.json()["detail"] == "Could not validate credentials"


def test_get_me_expired_token(client):
    register_res = client.post(
        "/auth/register",
        json={
            "name": "Expired User",
            "email": "expired@example.com",
            "password": "password123",
        },
    )
    user_id = register_res.json()["id"]

    # Generate an expired token (-1 minute expiration)
    expired_token = create_access_token(user_id=user_id, expires_delta=timedelta(minutes=-1))

    me_res = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert me_res.status_code == 401
    assert me_res.json()["detail"] == "Token has expired"
