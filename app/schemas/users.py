import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.game_sessions import GameStatus


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    total_games: int
    best_score: int
    average_score: float
    global_rank: int | None = None

    model_config = ConfigDict(from_attributes=True)


class UserGameHistoryEntry(BaseModel):
    id: uuid.UUID
    status: GameStatus
    click_count: int
    score: int
    duration_seconds: int = 60
    started_at: datetime
    ended_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserGameHistoryResponse(BaseModel):
    total: int
    limit: int
    offset: int
    games: list[UserGameHistoryEntry]
