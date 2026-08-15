import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.game_sessions import GameStatus


class GameStartRequest(BaseModel):
    duration_seconds: int = Field(60, description="Game duration in seconds, e.g. 60 or 15")


class GameSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: GameStatus
    click_count: int
    score: int
    duration_seconds: int
    started_at: datetime
    ended_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
