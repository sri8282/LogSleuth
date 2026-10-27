"""Tests for the health check endpoint."""

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /api/health returns 200 and expected status payload."""
    response = client.get(f"{settings.API_PREFIX}/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "logsleuth-ai-backend"
    assert data["version"] == settings.VERSION
    assert data["environment"] == settings.ENVIRONMENT
    assert "timestamp" in data


def test_root_endpoint():
    """Verify GET / returns 200 with service metadata."""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "operational"
    assert data["name"] == settings.PROJECT_NAME
    assert "health" in data
