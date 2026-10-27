"""Safe diagnostic tests for Gemini API connectivity, configuration, and error sanitization.

These tests verify:
1. Timeout settings are properly passed in milliseconds to the Google GenAI SDK (preventing ConnectTimeout).
2. httpx.ConnectTimeout and network timeouts are properly caught and sanitized.
3. Secrets (e.g. GEMINI_API_KEY) are NEVER exposed in error messages, exceptions, or payloads.
4. Live API connectivity (when configured) operates without leaking keys.
"""

from unittest.mock import MagicMock, patch
import httpx
import pytest
from app.config import settings
from app.schemas.logs import ParsedLogEvent
from app.services.gemini_service import GeminiAPIError, GeminiConfigError, gemini_service
from app.services.investigation_service import investigation_service


def test_gemini_timeout_converted_to_milliseconds():
    """Verify timeout is converted from seconds to milliseconds for Google GenAI SDK."""
    assert settings.GEMINI_TIMEOUT_SECONDS > 0
    # SDK HttpOptions.timeout expects milliseconds.
    # Passing raw seconds (e.g., 30) caused the SDK to calculate 30/1000 = 0.03s, causing ConnectTimeout.
    assert settings.gemini_timeout_ms == settings.GEMINI_TIMEOUT_SECONDS * 1000
    assert settings.gemini_timeout_ms >= 1000


def test_gemini_client_uses_millisecond_timeout(monkeypatch):
    """Verify GeminiService.get_client passes millisecond timeout to genai.Client."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-diagnostic-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.5-flash")

    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        gemini_service.get_client()
        assert mock_client_cls.called
        kwargs = mock_client_cls.call_args[1]
        assert "http_options" in kwargs
        # Ensure timeout is set to milliseconds (> 1000), not seconds (< 100)
        assert kwargs["http_options"].timeout == settings.gemini_timeout_ms
        assert kwargs["http_options"].timeout >= 1000


def test_investigation_connect_timeout_sanitization(monkeypatch):
    """Verify httpx.ConnectTimeout in investigation_service is sanitized without crashing."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy-diagnostic-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.5-flash")

    event = ParsedLogEvent(
        event_id="diag-evt-1",
        file_name="auth.log",
        line_number=1,
        timestamp="Oct 27 06:15:19",
        host="srv-1",
        service="sshd",
        severity="error",
        message="Failed password for invalid user root",
        raw_line="Oct 27 06:15:19 srv-1 sshd[123]: Failed password for invalid user root",
        parse_status="parsed",
    )

    with patch("app.services.gemini_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = httpx.ConnectTimeout(
            "The handshake operation timed out"
        )
        mock_client_cls.return_value = mock_client

        with pytest.raises(GeminiAPIError) as exc_info:
            investigation_service.analyze_investigation(events=[event])

        err_msg = str(exc_info.value)
        # Must be sanitized to explain timeout cleanly rather than leaking raw exception
        assert "timed out after" in err_msg
        assert "dummy-diagnostic-test-key" not in err_msg


def test_secrets_never_exposed_in_config_error(monkeypatch):
    """Verify secrets are never leaked when configuration validation fails."""
    secret_key = "AIzaSySecretDiagnosticKeyThatMustNeverBePrinted12345"
    monkeypatch.setattr(settings, "GEMINI_API_KEY", secret_key)
    monkeypatch.setattr(settings, "GEMINI_MODEL", "invalid-model-name-xyz")

    with pytest.raises(GeminiConfigError) as exc_info:
        gemini_service.validate_configuration()

    err_msg = str(exc_info.value)
    assert secret_key not in err_msg
    assert "is not supported" in err_msg


def test_live_gemini_diagnostics():
    """Safe live diagnostic test: validates live endpoint if configured without exposing secrets."""
    key = (settings.GEMINI_API_KEY or "").strip()
    if not key or key.startswith("YOUR_GEMINI_API_KEY"):
        pytest.skip("No live GEMINI_API_KEY configured; skipping live diagnostic check.")

    # Validate that key format looks plausible without logging it
    assert len(key) >= 20, "Configured GEMINI_API_KEY appears too short."

    # Test generation using gemini_service
    try:
        result = gemini_service.generate_test_response(prompt="Healthcheck: respond with OK")
        assert result.status == "success"
        assert len(result.text) > 0
    except GeminiAPIError as e:
        sanitized_err = str(e)
        # Guarantee that the API key value is never present in any part of the error message
        assert key not in sanitized_err, "CRITICAL: API key found in GeminiAPIError message!"
        # Log/report sanitized error cleanly as required by requirement 5
        print(f"Safe diagnostic test reported sanitized error: {sanitized_err}")
