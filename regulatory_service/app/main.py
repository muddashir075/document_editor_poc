import os
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.document_router import router as document_router
from app.api.comment_router import router as comment_router
from app.api.vote_router import router as vote_router
from app.api.version_router import router as version_router
from app.api.change_router import router as change_router
from app.api.notification_router import router as notification_router
from app.websocket.collaboration_ws import collaboration_endpoint

app = FastAPI(title=settings.APP_TITLE, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(document_router, prefix="/api/v1")
app.include_router(comment_router, prefix="/api/v1")
app.include_router(vote_router, prefix="/api/v1")
app.include_router(version_router, prefix="/api/v1")
app.include_router(change_router, prefix="/api/v1")
app.include_router(notification_router, prefix="/api/v1")


# WebSocket endpoint for real-time collaboration
@app.websocket("/ws/collaborate/{document_id}")
async def ws_collaborate(websocket: WebSocket, document_id: int, user: str = "anonymous"):
    await collaboration_endpoint(websocket, document_id, user)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.APP_TITLE}


# Serve uploaded files from MEDIA_ROOT at MEDIA_URL
_media_path = Path(settings.MEDIA_ROOT)
_media_path.mkdir(parents=True, exist_ok=True)
app.mount(settings.MEDIA_URL, StaticFiles(directory=str(_media_path)), name="media")
