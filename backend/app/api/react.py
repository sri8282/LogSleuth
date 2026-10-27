"""API route for controlled ReAct autonomous log investigations."""

from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from app.schemas.logs import ParsedLogEvent
from app.schemas.react import ReActInvestigationResponse
from app.services.gemini_service import GeminiAPIError, GeminiConfigError
from app.services.log_parser import (
    MAX_BATCH_SIZE_BYTES,
    MAX_RESPONSE_EVENTS,
    log_parser_service,
)
from app.services.react_agent import MAX_TOOL_CALLS, react_agent_service

router = APIRouter(prefix="/investigations", tags=["ReAct Autonomous Investigation"])


@router.post(
    "/react",
    response_model=ReActInvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Run Autonomous ReAct Log Investigation",
    description=(
        "Ingests log files and initiates a controlled, bounded ReAct (Observe-Action-Observation) "
        "reasoning loop using allowlisted read-only tools: search_log_events, correlate_time_window, "
        "retrieve_runbook, and inspect_event_evidence. Enforces a maximum of 5 tool calls, "
        "detects repeated calls, grounds findings with event IDs and line numbers, and records an auditable step trace."
    ),
)
async def react_investigate(
    files: List[UploadFile] = File(..., description="Multipart upload of raw log files to investigate"),
    focus_query: Optional[str] = Form(None, description="Optional focus area or incident question to investigate"),
    max_tool_calls: int = Form(MAX_TOOL_CALLS, ge=1, le=MAX_TOOL_CALLS, description="Maximum tool call budget (≤ 5)"),
) -> ReActInvestigationResponse:
    """Execute bounded ReAct investigation with allowlisted read-only tools."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Provide at least one valid log file.",
        )

    all_events: List[ParsedLogEvent] = []
    total_bytes = 0

    # Ingest and parse files in memory safely using existing parser service rules
    for upload_file in files:
        raw_name = upload_file.filename or "unknown.log"
        safe_name = raw_name.replace("\\", "/").split("/")[-1].strip() or "unnamed.log"

        try:
            content_bytes = await upload_file.read()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded file '{safe_name}'.",
            )

        file_size = len(content_bytes)
        total_bytes += file_size

        if total_bytes > MAX_BATCH_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Batch size exceeds maximum limit of {MAX_BATCH_SIZE_BYTES // (1024 * 1024)} MB.",
            )

        try:
            log_parser_service.validate_file_metadata(safe_name, file_size)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(err),
            )

        remaining_budget = max(0, MAX_RESPONSE_EVENTS - len(all_events))
        _, file_events = log_parser_service.parse_file(safe_name, content_bytes, remaining_budget)
        all_events.extend(file_events)

    if not all_events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded files contained no parseable log events.",
        )

    try:
        response = react_agent_service.run_investigation(
            events=all_events,
            focus_query=focus_query,
            max_iterations=max_tool_calls,
        )
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
            detail="An unexpected error occurred during autonomous ReAct investigation.",
        )

    return response
