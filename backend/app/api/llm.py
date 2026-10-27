"""LLM testing and integration endpoints for LogSleuth AI."""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.gemini_service import (
    gemini_service,
    GeminiConfigError,
    GeminiAPIError,
)

router = APIRouter(prefix="/llm", tags=["LLM Integration"])


class PromptTestRequest(BaseModel):
    """Payload for LLM test generation."""
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Short plain-text prompt for testing Gemini connectivity",
        json_schema_extra={"example": "Explain the role of /var/log/auth.log in Linux system security in one sentence."},
    )


class TokenUsageSchema(BaseModel):
    """Token consumption details."""
    prompt_tokens: Optional[int] = None
    candidates_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


class PromptTestResponse(BaseModel):
    """Structured response for LLM test generation."""
    status: str
    model: str
    response: str
    token_usage: Optional[TokenUsageSchema] = None


@router.post(
    "/test",
    response_model=PromptTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Test Gemini Connectivity",
    description="Sends a short test prompt to the configured Gemini model and returns the generated text with token usage.",
)
async def test_llm_prompt(payload: PromptTestRequest) -> PromptTestResponse:
    """Test LLM prompt generation without sending log datasets."""
    try:
        result = gemini_service.generate_test_response(payload.prompt)
    except GeminiConfigError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini configuration error: {str(e)}",
        )
    except GeminiAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini upstream error: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the LLM request.",
        )

    token_schema = None
    if result.token_usage:
        token_schema = TokenUsageSchema(
            prompt_tokens=result.token_usage.prompt_tokens,
            candidates_tokens=result.token_usage.candidates_tokens,
            total_tokens=result.token_usage.total_tokens,
        )

    return PromptTestResponse(
        status=result.status,
        model=result.model,
        response=result.text,
        token_usage=token_schema,
    )
