import json
from fastapi import WebSocket, WebSocketDisconnect
from typing import DefaultDict
from collections import defaultdict


class ConnectionManager:
    """Manages per-document WebSocket rooms for real-time collaboration."""

    def __init__(self):
        # document_id -> list of active connections
        self.rooms: DefaultDict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, document_id: int):
        await websocket.accept()
        self.rooms[document_id].append(websocket)

    def disconnect(self, websocket: WebSocket, document_id: int):
        self.rooms[document_id].remove(websocket)
        if not self.rooms[document_id]:
            del self.rooms[document_id]

    async def broadcast(self, document_id: int, message: dict, exclude: WebSocket | None = None):
        payload = json.dumps(message)
        for connection in list(self.rooms.get(document_id, [])):
            if connection is not exclude:
                await connection.send_text(payload)

    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_text(json.dumps(message))


manager = ConnectionManager()


async def collaboration_endpoint(websocket: WebSocket, document_id: int, user: str = "anonymous"):
    """
    WebSocket endpoint for real-time document collaboration.
    Clients send JSON messages with a 'type' field:
      - cursor_move: { type, paragraph_id, offset }
      - text_change: { type, paragraph_id, original, new_text, change_type }
      - comment_added: { type, paragraph_id, content }
      - vote_cast: { type, paragraph_id, vote_type }
    """
    await manager.connect(websocket, document_id)
    await manager.broadcast(
        document_id,
        {"type": "user_joined", "user": user, "document_id": document_id},
        exclude=websocket,
    )
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_personal(websocket, {"type": "error", "detail": "Invalid JSON"})
                continue

            data["user"] = user
            data["document_id"] = document_id
            await manager.broadcast(document_id, data, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, document_id)
        await manager.broadcast(
            document_id,
            {"type": "user_left", "user": user, "document_id": document_id},
        )
