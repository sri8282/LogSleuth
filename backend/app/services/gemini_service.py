"""Gemini AI Service Module for LogSleuth AI.

Handles client initialization, configuration validation, error normalization,
and isolated generation logic using the official Google GenAI Python SDK.
"""

from dataclasses import dataclass
from typing import Optional
import httpx
from google import genai
from google.genai import types
from google.genai import errors
from app.config import settings


class GeminiConfigError(Exception):
    """Raised when Gemini configuration (API key, model) is missing or invalid."""
    pass


class GeminiAPIError(Exception):
    """Raised when an upstream Gemini API call fails (auth, quota, timeout, etc.)."""
    pass


@dataclass
class TokenUsage:
    """Token consumption metadata."""
    prompt_tokens: Optional[int] = None
    candidates_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


@dataclass
class GeminiGenerationResult:
    """Normalized response payload from Gemini API."""
    text: str
    model: str
    status: str
    token_usage: Optional[TokenUsage] = None


class GeminiService:
    """Encapsulates interaction with the Google GenAI SDK."""

    @staticmethod
    def validate_configuration() -> None:
        """Validate API key presence and model support without making external calls."""
        key = (settings.GEMINI_API_KEY or "").strip()
        if not key or key.startswith("YOUR_GEMINI_API_KEY"):
            raise GeminiConfigError(
                "GEMINI_API_KEY is not configured. Set a valid API key in backend/.env"
            )

        model = (settings.GEMINI_MODEL or "").strip()
        if model not in settings.SUPPORTED_MODELS:
            raise GeminiConfigError(
                f"Configured model '{model}' is not supported. Supported models: {settings.SUPPORTED_MODELS}"
            )

    @classmethod
    def get_client(cls) -> genai.Client:
        """Instantiate and return a GenAI client with validated settings.
        
        Never logs, prints, or exposes the raw API key.
        """
        cls.validate_configuration()
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.gemini_timeout_ms),
        )

    @classmethod
    def generate_test_response(cls, prompt: str) -> GeminiGenerationResult:
        """Generate response for a test prompt with error boundary and bounded timeout.
        
        Args:
            prompt: Short plain-text test prompt.

        Returns:
            GeminiGenerationResult with generated text, model used, and token metrics.
        """
        prompt = (prompt or "").strip()
        if not prompt:
            raise ValueError("Prompt must not be empty.")

        client = cls.get_client()
        target_model = settings.GEMINI_MODEL

        try:
            config = types.GenerateContentConfig(
                max_output_tokens=1024,
                temperature=0.2,
                http_options=types.HttpOptions(timeout=settings.gemini_timeout_ms),
            )

            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config,
            )

        except errors.ClientError as e:
            # Handle client-side status codes: 400, 401/403 (auth), 404 (not found), 429 (quota)
            code = getattr(e, "code", None)
            msg = getattr(e, "message", str(e))
            if code in (401, 403) or "API_KEY_INVALID" in msg or "PERMISSION_DENIED" in msg:
                raise GeminiAPIError("Gemini API authentication failed. Verify that GEMINI_API_KEY is valid.")
            elif code == 429 or "RESOURCE_EXHAUSTED" in msg:
                raise GeminiAPIError("Gemini API quota or rate limit exceeded. Please retry later.")
            elif code == 404 or "NOT_FOUND" in msg:
                raise GeminiAPIError(f"Configured model '{target_model}' was not found or is unavailable.")
            else:
                raise GeminiAPIError(f"Gemini API client error ({code}): {msg}")

        except errors.ServerError as e:
            raise GeminiAPIError(
                f"Gemini server error ({getattr(e, 'code', 500)}). Google service is temporarily unavailable."
            )

        except errors.APIError as e:
            code = getattr(e, "code", "UNKNOWN")
            msg = getattr(e, "message", "API request failed.")
            raise GeminiAPIError(f"Gemini API error ({code}): {msg}")

        except (httpx.TimeoutException, TimeoutError):
            raise GeminiAPIError(
                f"Gemini API request timed out after {settings.GEMINI_TIMEOUT_SECONDS}s."
            )

        except (httpx.NetworkError, ConnectionError):
            raise GeminiAPIError("Network error while connecting to Gemini API endpoint.")

        except Exception as e:
            raise GeminiAPIError(f"Unexpected error communicating with Gemini API: {type(e).__name__}")

        # Validate that response contains valid text
        if not response or not response.text or not response.text.strip():
            raise GeminiAPIError("Gemini returned an empty or candidate-blocked response.")

        # Extract token usage metadata if available
        token_usage: Optional[TokenUsage] = None
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            meta = response.usage_metadata
            token_usage = TokenUsage(
                prompt_tokens=getattr(meta, "prompt_token_count", None),
                candidates_tokens=getattr(meta, "candidates_token_count", None),
                total_tokens=getattr(meta, "total_token_count", None),
            )

        return GeminiGenerationResult(
            text=response.text.strip(),
            model=target_model,
            status="success",
            token_usage=token_usage,
        )


gemini_service = GeminiService()
