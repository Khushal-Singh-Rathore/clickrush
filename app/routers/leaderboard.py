from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["Leaderboards"])


def _build_leaderboard_query(
    db: Session,
    duration_seconds: int = 60,
    start_time: datetime | None = None,
):
    query = (
        db.query(GameSession, User)
        .join(User, GameSession.user_id == User.id)
        .filter(
            GameSession.status == GameStatus.COMPLETED,
            GameSession.duration_seconds == duration_seconds,
        )
    )
    if start_time:
        query = query.filter(GameSession.ended_at >= start_time)

    return query.order_by(
        GameSession.score.desc(),
        GameSession.click_count.desc(),
        GameSession.ended_at.asc(),
    )


@router.get(
    "",
    response_model=LeaderboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get global all-time leaderboard",
)
def get_global_leaderboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    duration_seconds: int = Query(60, description="Game duration filter (60 or 15)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
) -> LeaderboardResponse:
    """Retrieve global all-time leaderboard ordered by top score (Requires Authentication)."""
    query = _build_leaderboard_query(db, duration_seconds=duration_seconds)
    total_count = query.count()
    results = query.offset(offset).limit(limit).all()

    entries = [
        LeaderboardEntry(
            rank=offset + idx + 1,
            user_name=user.name,
            score=game.score,
            click_count=game.click_count,
            duration_seconds=game.duration_seconds,
            ended_at=game.ended_at,
        )
        for idx, (game, user) in enumerate(results)
    ]

    return LeaderboardResponse(
        timeframe="global",
        duration_seconds=duration_seconds,
        total=total_count,
        limit=limit,
        offset=offset,
        entries=entries,
    )


@router.get(
    "/daily",
    response_model=LeaderboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get daily leaderboard for the current UTC day",
)
def get_daily_leaderboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    duration_seconds: int = Query(60, description="Game duration filter (60 or 15)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
) -> LeaderboardResponse:
    """Retrieve daily leaderboard for games completed during the current UTC day (Requires Authentication)."""
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    query = _build_leaderboard_query(db, duration_seconds=duration_seconds, start_time=start_of_day)
    total_count = query.count()
    results = query.offset(offset).limit(limit).all()

    entries = [
        LeaderboardEntry(
            rank=offset + idx + 1,
            user_name=user.name,
            score=game.score,
            click_count=game.click_count,
            duration_seconds=game.duration_seconds,
            ended_at=game.ended_at,
        )
        for idx, (game, user) in enumerate(results)
    ]

    return LeaderboardResponse(
        timeframe="daily",
        duration_seconds=duration_seconds,
        total=total_count,
        limit=limit,
        offset=offset,
        entries=entries,
    )


@router.get(
    "/weekly",
    response_model=LeaderboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get weekly leaderboard for the last 7 days",
)
def get_weekly_leaderboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    duration_seconds: int = Query(60, description="Game duration filter (60 or 15)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
) -> LeaderboardResponse:
    """Retrieve weekly leaderboard for games completed in the last 7 days (UTC) (Requires Authentication)."""
    now = datetime.now(timezone.utc)
    start_of_week = now - timedelta(days=7)

    query = _build_leaderboard_query(db, duration_seconds=duration_seconds, start_time=start_of_week)
    total_count = query.count()
    results = query.offset(offset).limit(limit).all()

    entries = [
        LeaderboardEntry(
            rank=offset + idx + 1,
            user_name=user.name,
            score=game.score,
            click_count=game.click_count,
            duration_seconds=game.duration_seconds,
            ended_at=game.ended_at,
        )
        for idx, (game, user) in enumerate(results)
    ]

    return LeaderboardResponse(
        timeframe="weekly",
        duration_seconds=duration_seconds,
        total=total_count,
        limit=limit,
        offset=offset,
        entries=entries,
    )
