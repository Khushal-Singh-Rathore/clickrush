import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game_sessions import GameSession, GameStatus
from app.models.users import User
from app.utils.security import decode_access_token

router = APIRouter(tags=["WebSocket Gameplay"])

GAME_DURATION_SECONDS = 60.0


@router.websocket("/ws/games/{game_id}")
async def game_websocket(
    websocket: WebSocket,
    game_id: uuid.UUID,
    token: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """WebSocket endpoint for 60-second real-time click gameplay."""
    await websocket.accept()

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return

    # Validate JWT Token
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            raise ValueError("Missing subject claim")
        user_id = uuid.UUID(sub)
    except (jwt.PyJWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
        return

    # Validate User
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found or inactive")
        return

    # Validate Game Session
    game_session = db.query(GameSession).filter(GameSession.id == game_id).first()
    if not game_session:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Game session not found")
        return

    if game_session.user_id != user.id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized access to game session")
        return

    if game_session.status != GameStatus.ACTIVE:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Game session is not active")
        return

    # Ensure started_at is timezone-aware
    started_at = game_session.started_at
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    elapsed = (now - started_at).total_seconds()

    # If 60 seconds already elapsed before connecting
    if elapsed >= GAME_DURATION_SECONDS:
        game_session.status = GameStatus.COMPLETED
        game_session.ended_at = started_at + timedelta(seconds=GAME_DURATION_SECONDS)
        db.commit()
        await websocket.send_json({
            "type": "game_complete",
            "game_id": str(game_session.id),
            "click_count": game_session.click_count,
            "score": game_session.score,
            "started_at": started_at.isoformat(),
            "ended_at": game_session.ended_at.isoformat(),
            "status": game_session.status.value,
        })
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        return

    click_count = game_session.click_count
    seconds_remaining = round(GAME_DURATION_SECONDS - elapsed, 2)

    # Notify client that game is active and ready
    await websocket.send_json({
        "type": "game_start",
        "game_id": str(game_session.id),
        "seconds_remaining": seconds_remaining,
        "click_count": click_count,
    })

    try:
        # Gameplay loop
        while True:
            raw_data = await websocket.receive_text()
            current_now = datetime.now(timezone.utc)
            current_elapsed = (current_now - started_at).total_seconds()

            if current_elapsed >= GAME_DURATION_SECONDS:
                # 60-second limit reached
                game_session.click_count = click_count
                game_session.score = click_count
                game_session.ended_at = current_now
                game_session.status = GameStatus.COMPLETED
                db.commit()
                await websocket.send_json({
                    "type": "game_complete",
                    "game_id": str(game_session.id),
                    "click_count": game_session.click_count,
                    "score": game_session.score,
                    "started_at": started_at.isoformat(),
                    "ended_at": game_session.ended_at.isoformat(),
                    "status": game_session.status.value,
                })
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
                break

            try:
                data = json.loads(raw_data)
            except Exception:
                data = {}

            msg_type = data.get("type")
            if msg_type == "click":
                click_count += 1
                sec_rem = max(0.0, round(GAME_DURATION_SECONDS - current_elapsed, 2))
                await websocket.send_json({
                    "type": "state",
                    "click_count": click_count,
                    "seconds_remaining": sec_rem,
                })
            elif msg_type == "finish":
                # Manual finish request by client
                game_session.click_count = click_count
                game_session.score = click_count
                game_session.ended_at = current_now
                game_session.status = GameStatus.COMPLETED
                db.commit()
                await websocket.send_json({
                    "type": "game_complete",
                    "game_id": str(game_session.id),
                    "click_count": game_session.click_count,
                    "score": game_session.score,
                    "started_at": started_at.isoformat(),
                    "ended_at": game_session.ended_at.isoformat(),
                    "status": game_session.status.value,
                })
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
                break
            else:
                await websocket.send_json({
                    "type": "error",
                    "detail": f"Unknown message type: {msg_type}",
                })

    except WebSocketDisconnect:
        current_now = datetime.now(timezone.utc)
        current_elapsed = (current_now - started_at).total_seconds()
        if game_session and game_session.status == GameStatus.ACTIVE:
            game_session.click_count = click_count
            game_session.score = click_count
            if current_elapsed >= GAME_DURATION_SECONDS:
                game_session.status = GameStatus.COMPLETED
                game_session.ended_at = current_now
            else:
                game_session.status = GameStatus.ABANDONED
                game_session.ended_at = current_now
            db.commit()
