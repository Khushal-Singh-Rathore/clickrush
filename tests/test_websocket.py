import uuid
import pytest
from starlette.websockets import WebSocketDisconnect

from tests.test_games import get_auth_token


def test_ws_unauthenticated_rejected(client):
    game_id = str(uuid.uuid4())
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/games/{game_id}") as websocket:
            websocket.receive_json()
    assert exc_info.value.code == 1008


def test_ws_invalid_token_rejected(client):
    game_id = str(uuid.uuid4())
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/games/{game_id}?token=invalid.token.string") as websocket:
            websocket.receive_json()
    assert exc_info.value.code == 1008


def test_ws_unauthorized_game(client):
    token1 = get_auth_token(client, email="ws_user1@example.com", name="User 1")
    token2 = get_auth_token(client, email="ws_user2@example.com", name="User 2")

    start_res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token1}"},
    )
    game_id = start_res.json()["id"]

    # User 2 tries to connect to User 1's game
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/games/{game_id}?token={token2}") as websocket:
            websocket.receive_json()
    assert exc_info.value.code == 1008


def test_ws_successful_gameplay(client):
    token = get_auth_token(client, email="gamer@example.com", name="Gamer")
    start_res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    game_id = start_res.json()["id"]

    with client.websocket_connect(f"/ws/games/{game_id}?token={token}") as websocket:
        # Receive game_start message
        start_msg = websocket.receive_json()
        assert start_msg["type"] == "game_start"
        assert start_msg["game_id"] == game_id
        assert start_msg["click_count"] == 0
        assert start_msg["seconds_remaining"] > 0

        # Send 5 click messages
        for i in range(1, 6):
            websocket.send_json({"type": "click"})
            state_msg = websocket.receive_json()
            assert state_msg["type"] == "state"
            assert state_msg["click_count"] == i

        # Send finish message
        websocket.send_json({"type": "finish"})
        finish_msg = websocket.receive_json()
        assert finish_msg["type"] == "game_complete"
        assert finish_msg["game_id"] == game_id
        assert finish_msg["click_count"] == 5
        assert finish_msg["score"] == 5
        assert finish_msg["status"] == "COMPLETED"
        assert finish_msg["ended_at"] is not None

    # Verify database status via REST endpoint
    get_res = client.get(
        f"/games/{game_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_res.status_code == 200
    db_game = get_res.json()
    assert db_game["status"] == "COMPLETED"
    assert db_game["click_count"] == 5
    assert db_game["score"] == 5
    assert db_game["ended_at"] is not None


def test_ws_reconnect_to_completed_game_rejected(client):
    token = get_auth_token(client, email="reconnect@example.com", name="Reconnector")
    start_res = client.post(
        "/games/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    game_id = start_res.json()["id"]

    # Play and complete game
    with client.websocket_connect(f"/ws/games/{game_id}?token={token}") as websocket:
        websocket.receive_json()  # start
        websocket.send_json({"type": "finish"})
        websocket.receive_json()  # complete

    # Attempt to reconnect to already completed game
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/games/{game_id}?token={token}") as websocket:
            websocket.receive_json()
    assert exc_info.value.code == 1008
