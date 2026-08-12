import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.game_sessions import GameStatus


class GameSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: GameStatus
    click_count: int
    score: int
    started_at: datetime
    ended_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
