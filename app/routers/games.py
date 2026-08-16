import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.limiter import limiter
from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.schemas.games import GameSessionResponse, GameStartRequest

router = APIRouter(prefix="/games", tags=["Game Lifecycle"])


@router.post(
    "/start",
    response_model=GameSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new game session",
)
@limiter.limit("20/minute")
def start_game(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[GameStartRequest | None, Body()] = None,
) -> GameSession:
    """Start a new game session (e.g. 60s classic or 15s speed blitz) for the authenticated user."""
    duration = payload.duration_seconds if payload else 60
    if duration not in (15, 60):
        duration = 60

    now = datetime.now(timezone.utc)
    game_session = GameSession(
        user_id=current_user.id,
        status=GameStatus.ACTIVE,
        click_count=0,
        score=0,
        duration_seconds=duration,
        started_at=now,
    )
    db.add(game_session)
    db.commit()
    db.refresh(game_session)
    return game_session


@router.get(
    "/{game_id}",
    response_model=GameSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a game session by ID",
)
def get_game(
    game_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GameSession:
    """Retrieve details of a game session owned by the authenticated user."""
    game_session = db.query(GameSession).filter(GameSession.id == game_id).first()
    if not game_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game session not found",
        )

    if game_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this game session",
        )

    return game_session
