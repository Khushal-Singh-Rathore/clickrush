from datetime import datetime, timedelta, timezone

import pytest

from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.utils.security import create_access_token, hash_password


@pytest.fixture(autouse=True)
def clean_database(db_session):
    """Clean database before each test in test_users.py."""
    db_session.query(GameSession).delete()
    db_session.query(User).delete()
    db_session.commit()


def create_test_user_with_games(db_session, name, email, scores_with_status):
    user = User(
        name=name,
        email=email,
        password_hash=hash_password("password123"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user.id)
    now = datetime.now(timezone.utc)

    for idx, (score, game_status) in enumerate(scores_with_status):
        game = GameSession(
            user_id=user.id,
            score=score,
            click_count=score,
            status=game_status,
            started_at=now - timedelta(minutes=10 - idx),
            ended_at=now - timedelta(minutes=9 - idx) if game_status == GameStatus.COMPLETED else None,
        )
        db_session.add(game)
    db_session.commit()

    return user, token


def test_user_endpoints_unauthenticated_rejected(client):
    res_me = client.get("/users/me")
    assert res_me.status_code in (401, 403)

    res_history = client.get("/users/me/games")
    assert res_history.status_code in (401, 403)


def test_get_user_profile_stats(client, db_session):
    # User B has higher score (100) -> Global Rank 1
    create_test_user_with_games(db_session, "User B", "b@example.com", [(100, GameStatus.COMPLETED)])

    # User A has 3 games: 30 (COMPLETED), 70 (COMPLETED), 0 (ACTIVE) -> Total 3 games, 2 completed (30, 70)
    # Best score = 70, Average score = (30 + 70)/2 = 50.0, Global Rank = 2
    _, token_a = create_test_user_with_games(
        db_session,
        "User A",
        "a@example.com",
        [(30, GameStatus.COMPLETED), (70, GameStatus.COMPLETED), (0, GameStatus.ACTIVE)],
    )

    res = client.get("/users/me", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    data = res.json()

    assert data["name"] == "User A"
    assert data["email"] == "a@example.com"
    assert data["total_games"] == 3
    assert data["best_score"] == 70
    assert data["average_score"] == 50.0
    assert data["global_rank"] == 2


def test_get_user_game_history(client, db_session):
    _, token = create_test_user_with_games(
        db_session,
        "History User",
        "history@example.com",
        [(10, GameStatus.COMPLETED), (20, GameStatus.COMPLETED), (30, GameStatus.ACTIVE)],
    )

    # Fetch page 1 (limit 2)
    res = client.get("/users/me/games?limit=2&offset=0", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["total"] == 3
    assert data["limit"] == 2
    assert data["offset"] == 0
    assert len(data["games"]) == 2

    # Verify game items order (most recent first)
    games = data["games"]
    assert games[0]["status"] == "ACTIVE"
    assert games[1]["score"] == 20
