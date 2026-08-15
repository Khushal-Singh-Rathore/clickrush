from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.schemas.users import UserGameHistoryEntry, UserGameHistoryResponse, UserProfileResponse

router = APIRouter(prefix="/users", tags=["User Profiles & History"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user profile with aggregate statistics",
)
def get_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    duration_seconds: int = Query(60, description="Filter statistics and rank by game duration (60 or 15)"),
) -> UserProfileResponse:
    """Return profile details, aggregate game stats (total games, best score, average score), and global rank for a specific game mode."""
    # Total games played for this mode (all statuses)
    total_games = (
        db.query(func.count(GameSession.id))
        .filter(
            GameSession.user_id == current_user.id,
            GameSession.duration_seconds == duration_seconds,
        )
        .scalar()
        or 0
    )

    # Best score and average score for completed games in this mode
    completed_stats = (
        db.query(
            func.max(GameSession.score),
            func.avg(GameSession.score),
        )
        .filter(
            GameSession.user_id == current_user.id,
            GameSession.status == GameStatus.COMPLETED,
            GameSession.duration_seconds == duration_seconds,
        )
        .first()
    )

    best_score = completed_stats[0] if (completed_stats and completed_stats[0] is not None) else 0
    average_score = round(float(completed_stats[1]), 2) if (completed_stats and completed_stats[1] is not None) else 0.0

    # User's best game session for this mode to determine exact leaderboard position
    best_session = (
        db.query(GameSession)
        .filter(
            GameSession.user_id == current_user.id,
            GameSession.status == GameStatus.COMPLETED,
            GameSession.duration_seconds == duration_seconds,
        )
        .order_by(
            GameSession.score.desc(),
            GameSession.click_count.desc(),
            GameSession.ended_at.asc(),
        )
        .first()
    )

    global_rank = None
    if best_session:
        # Count all completed sessions that rank higher than user's best session on the leaderboard table
        higher_sessions_count = (
            db.query(func.count(GameSession.id))
            .filter(
                GameSession.status == GameStatus.COMPLETED,
                GameSession.duration_seconds == duration_seconds,
                (
                    (GameSession.score > best_session.score)
                    | (
                        (GameSession.score == best_session.score)
                        & (GameSession.click_count > best_session.click_count)
                    )
                    | (
                        (GameSession.score == best_session.score)
                        & (GameSession.click_count == best_session.click_count)
                        & (GameSession.ended_at < best_session.ended_at)
                    )
                ),
            )
            .scalar()
            or 0
        )
        global_rank = higher_sessions_count + 1

    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        total_games=total_games,
        best_score=best_score,
        average_score=average_score,
        global_rank=global_rank,
    )


@router.get(
    "/me/games",
    response_model=UserGameHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user game history",
)
def get_user_game_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(20, ge=1, le=100, description="Maximum number of entries to return"),
    offset: int = Query(0, ge=0, description="Number of entries to skip"),
) -> UserGameHistoryResponse:
    """Retrieve recent completed or abandoned game sessions for the authenticated user."""
    base_query = db.query(GameSession).filter(GameSession.user_id == current_user.id)
    total_count = base_query.count()

    game_sessions = (
        base_query.order_by(GameSession.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    entries = [
        UserGameHistoryEntry(
            id=g.id,
            status=g.status,
            click_count=g.click_count,
            score=g.score,
            duration_seconds=g.duration_seconds,
            started_at=g.started_at,
            ended_at=g.ended_at,
        )
        for g in game_sessions
    ]

    return UserGameHistoryResponse(
        total=total_count,
        limit=limit,
        offset=offset,
        games=entries,
    )
