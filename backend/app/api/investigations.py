"""Forensic investigation API endpoints combining log correlation, RAG, and LLM reasoning."""

from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from app.schemas.investigation import InvestigationReport
from app.schemas.logs import ParsedLogEvent
from app.services.gemini_service import GeminiAPIError, GeminiConfigError
from app.services.investigation_service import investigation_service
from app.services.log_parser import (
    MAX_BATCH_SIZE_BYTES,
    MAX_RESPONSE_EVENTS,
    log_parser_service,
)

router = APIRouter(prefix="/investigations", tags=["Investigations & AI Root Cause"])


@router.post(
    "/analyze",
    response_model=InvestigationReport,
    status_code=status.HTTP_200_OK,
    summary="Run AI Incident Investigation",
    description=(
        "Ingests log files, runs deterministic event correlation, retrieves relevant RAG runbooks, "
        "and executes evidence-grounded Gemini root-cause isolation. Returns a structured forensic dossier."
    ),
)
async def analyze_incident(
    files: List[UploadFile] = File(..., description="Multipart upload of raw log files to analyze"),
    strategy: str = Form("grounded_analysis", description="Prompt strategy: 'grounded_analysis' or 'few_shot'"),
    focus_query: Optional[str] = Form(None, description="Optional focus area or specific hypothesis to investigate"),
) -> InvestigationReport:
    """Ingest, correlate, and investigate logs using grounded AI analysis."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Provide at least one valid log file.",
        )

    all_events: List[ParsedLogEvent] = []
    total_bytes = 0

    # Ingest and parse files in memory using existing parser service rules
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
        report = investigation_service.analyze_investigation(
            events=all_events,
            strategy=strategy,
            focus_query=focus_query,
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
            detail="An unexpected error occurred during incident investigation.",
        )

    return report
