import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.users import User


class GameStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    click_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        default=60,
        server_default="60",
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[GameStatus] = mapped_column(
        Enum(
            GameStatus,
            name="gamestatus",
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=GameStatus.ACTIVE,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="game_sessions",
    )

    __table_args__ = (
        Index(
            "ix_game_sessions_user_history",
            "user_id",
            text("started_at DESC"),
        ),
        Index(
            "ix_game_sessions_leaderboard_global",
            "status",
            "duration_seconds",
            text("score DESC"),
        ),
        Index(
            "ix_game_sessions_leaderboard_timeframe",
            "status",
            "duration_seconds",
            "started_at",
            text("score DESC"),
        ),
    )