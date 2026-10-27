"""Health check and status API endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: str


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Returns backend health status, service metadata, and server timestamp.",
)
async def get_health() -> HealthResponse:
    """Return application health status."""
    return HealthResponse(
        status="ok",
        service="logsleuth-ai-backend",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
