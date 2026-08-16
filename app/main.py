from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.routers import auth, games, leaderboard, users, websocket

# Determine if production environment to disable API docs
is_production = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title="ClickRush API",
    description="60-Second Real-Time Click Challenge API",
    version="0.1.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

# Configure CORS middleware using settings from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(games.router)
app.include_router(websocket.router)
app.include_router(leaderboard.router)
app.include_router(users.router)


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    """Health check endpoint that verifies API uptime and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}",
        )
