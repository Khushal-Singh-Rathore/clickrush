from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeaderboardEntry(BaseModel):
    rank: int
    user_name: str
    score: int
    click_count: int
    duration_seconds: int
    ended_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardResponse(BaseModel):
    timeframe: str
    duration_seconds: int
    total: int
    limit: int
    offset: int
    entries: list[LeaderboardEntry]
