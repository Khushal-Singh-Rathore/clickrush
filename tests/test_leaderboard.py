from datetime import datetime, timedelta, timezone

import pytest

from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.utils.security import create_access_token, hash_password


@pytest.fixture(autouse=True)
def clean_database(db_session):
    """Clean database before each test in test_leaderboard.py."""
    db_session.query(GameSession).delete()
    db_session.query(User).delete()
    db_session.commit()


def create_completed_game(db_session, user_name, email, score, click_count, ended_at=None, status=GameStatus.COMPLETED):
    user = User(
        name=user_name,
        email=email,
        password_hash=hash_password("password123"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    now = datetime.now(timezone.utc)
    game = GameSession(
        user_id=user.id,
        score=score,
        click_count=click_count,
        status=status,
        started_at=now - timedelta(seconds=60),
        ended_at=ended_at or now,
    )
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    token = create_access_token(user.id)
    return user, game, token


def test_leaderboard_unauthenticated_rejected(client):
    res = client.get("/leaderboard")
    assert res.status_code in (401, 403)

    res_daily = client.get("/leaderboard/daily")
    assert res_daily.status_code in (401, 403)

    res_weekly = client.get("/leaderboard/weekly")
    assert res_weekly.status_code in (401, 403)


def test_global_leaderboard_ordering_and_rank(client, db_session):
    _, _, token1 = create_completed_game(db_session, "Player B", "b@example.com", score=50, click_count=50)
    create_completed_game(db_session, "Player A", "a@example.com", score=100, click_count=100)
    create_completed_game(db_session, "Player C", "c@example.com", score=75, click_count=75)

    res = client.get("/leaderboard", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    data = res.json()
    assert data["timeframe"] == "global"
    assert data["total"] == 3
    entries = data["entries"]
    assert len(entries) == 3

    assert entries[0]["user_name"] == "Player A"
    assert entries[0]["score"] == 100
    assert entries[0]["rank"] == 1
    assert "user_id" not in entries[0]
    assert "game_id" not in entries[0]

    assert entries[1]["user_name"] == "Player C"
    assert entries[1]["score"] == 75
    assert entries[1]["rank"] == 2

    assert entries[2]["user_name"] == "Player B"
    assert entries[2]["score"] == 50
    assert entries[2]["rank"] == 3


def test_leaderboard_excludes_incomplete_games(client, db_session):
    _, _, token = create_completed_game(db_session, "Completed Player", "comp@example.com", score=60, click_count=60, status=GameStatus.COMPLETED)
    create_completed_game(db_session, "Active Player", "active@example.com", score=80, click_count=80, status=GameStatus.ACTIVE)
    create_completed_game(db_session, "Abandoned Player", "abandoned@example.com", score=90, click_count=90, status=GameStatus.ABANDONED)

    res = client.get("/leaderboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["entries"][0]["user_name"] == "Completed Player"


def test_daily_leaderboard_filtering(client, db_session):
    now = datetime.now(timezone.utc)
    two_days_ago = now - timedelta(days=2)

    _, _, token = create_completed_game(db_session, "Today Player", "today@example.com", score=50, click_count=50, ended_at=now)
    create_completed_game(db_session, "Old Player", "old@example.com", score=100, click_count=100, ended_at=two_days_ago)

    res = client.get("/leaderboard/daily", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["timeframe"] == "daily"
    assert data["total"] == 1
    assert data["entries"][0]["user_name"] == "Today Player"


def test_weekly_leaderboard_filtering(client, db_session):
    now = datetime.now(timezone.utc)
    three_days_ago = now - timedelta(days=3)
    ten_days_ago = now - timedelta(days=10)

    _, _, token = create_completed_game(db_session, "Recent Player", "recent@example.com", score=40, click_count=40, ended_at=three_days_ago)
    create_completed_game(db_session, "Ancient Player", "ancient@example.com", score=90, click_count=90, ended_at=ten_days_ago)

    res = client.get("/leaderboard/weekly", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["timeframe"] == "weekly"
    assert data["total"] == 1
    assert data["entries"][0]["user_name"] == "Recent Player"


def test_leaderboard_pagination(client, db_session):
    tokens = []
    for i in range(1, 6):
        _, _, t = create_completed_game(db_session, f"Player {i}", f"player{i}@example.com", score=i * 10, click_count=i * 10)
        tokens.append(t)

    # Page 1
    res1 = client.get("/leaderboard?limit=2&offset=0", headers={"Authorization": f"Bearer {tokens[0]}"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1["entries"]) == 2
    assert data1["entries"][0]["rank"] == 1
    assert data1["entries"][0]["score"] == 50
    assert data1["entries"][1]["rank"] == 2
    assert data1["entries"][1]["score"] == 40

    # Page 2
    res2 = client.get("/leaderboard?limit=2&offset=2", headers={"Authorization": f"Bearer {tokens[0]}"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["entries"]) == 2
    assert data2["entries"][0]["rank"] == 3
    assert data2["entries"][0]["score"] == 30
    assert data2["entries"][1]["rank"] == 4
    assert data2["entries"][1]["score"] == 20
