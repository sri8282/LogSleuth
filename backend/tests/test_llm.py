"""Automated tests for Gemini LLM integration endpoint.

Tests validation, configuration guards, and upstream error handling using
mocked Gemini client responses without requiring live API keys or network calls.
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from google.genai import errors
from app.main import app
from app.config import settings

client = TestClient(app)


def test_llm_test_validation_empty_prompt():
    """Verify empty prompt is rejected with 422 Unprocessable Entity."""
    response = client.post(
        f"{settings.API_PREFIX}/llm/test",
        json={"prompt": ""},
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_llm_test_validation_too_long_prompt():
    """Verify prompt exceeding 2000 characters is rejected with 422."""
    long_prompt = "A" * 2001
    response = client.post(
        f"{settings.API_PREFIX}/llm/test",
        json={"prompt": long_prompt},
    )
    assert response.status_code == 422


def test_llm_test_missing_api_key(monkeypatch):
    """Verify 503 is returned when GEMINI_API_KEY is not configured."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    response = client.post(
        f"{settings.API_PREFIX}/llm/test",
        json={"prompt": "Test prompt without key"},
    )
    assert response.status_code == 503
    data = response.json()
    assert "Gemini configuration error" in data["detail"]
    assert "GEMINI_API_KEY is not configured" in data["detail"]


def test_llm_test_unsupported_model(monkeypatch):
    """Verify 503 is returned when configured model is not in SUPPORTED_MODELS."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "unsupported-model-v99")
    response = client.post(
        f"{settings.API_PREFIX}/llm/test",
        json={"prompt": "Test prompt with bad model"},
    )
    assert response.status_code == 503
    data = response.json()
    assert "is not supported" in data["detail"]


def test_llm_test_mocked_success(monkeypatch):
    """Verify successful generation using mocked Gemini response."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    # Create mock response object
    mock_response = MagicMock()
    mock_response.text = "Linux auth.log records user authentication attempts and privilege escalations."
    mock_response.usage_metadata.prompt_token_count = 14
    mock_response.usage_metadata.candidates_token_count = 18
    mock_response.usage_metadata.total_token_count = 32

    # Patch genai.Client in gemini_service
    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        response = client.post(
            f"{settings.API_PREFIX}/llm/test",
            json={"prompt": "Explain auth.log in one sentence."},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["model"] == "gemini-2.5-flash"
        assert "auth.log" in data["response"]
        assert data["token_usage"] is not None
        assert data["token_usage"]["prompt_tokens"] == 14
        assert data["token_usage"]["candidates_tokens"] == 18
        assert data["token_usage"]["total_tokens"] == 32


def test_llm_test_mocked_quota_error(monkeypatch):
    """Verify 429 quota error from Gemini is mapped to 502 with clear explanation."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Simulate 429 ClientError
        mock_err = errors.ClientError(429, {"error": {"message": "RESOURCE_EXHAUSTED: Rate limit exceeded"}})
        mock_client.models.generate_content.side_effect = mock_err
        mock_client_cls.return_value = mock_client

        response = client.post(
            f"{settings.API_PREFIX}/llm/test",
            json={"prompt": "Quota test"},
        )

        assert response.status_code == 502
        data = response.json()
        assert "quota or rate limit exceeded" in data["detail"].lower()


def test_llm_test_mocked_auth_error(monkeypatch):
    """Verify 401/403 invalid key error from Gemini is mapped to 502 without exposing key."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_err = errors.ClientError(403, {"error": {"message": "API_KEY_INVALID"}})
        mock_client.models.generate_content.side_effect = mock_err
        mock_client_cls.return_value = mock_client

        response = client.post(
            f"{settings.API_PREFIX}/llm/test",
            json={"prompt": "Auth test"},
        )

        assert response.status_code == 502
        data = response.json()
        assert "authentication failed" in data["detail"].lower()
        # Verify dummy-test-key is never leaked
        assert "dummy-test-key" not in str(data)


def test_llm_test_mocked_timeout_error(monkeypatch):
    """Verify network timeout is mapped to 502 with timeout details."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = TimeoutError("Connection timed out")
        mock_client_cls.return_value = mock_client

        response = client.post(
            f"{settings.API_PREFIX}/llm/test",
            json={"prompt": "Timeout test"},
        )

        assert response.status_code == 502
        data = response.json()
        assert "timed out" in data["detail"].lower()
