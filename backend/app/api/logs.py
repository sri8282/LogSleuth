"""Log upload and normalization API routes."""

from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from app.schemas.logs import FileParseSummary, LogParseResponse, ParsedLogEvent
from app.services.log_parser import (
    ALLOWED_EXTENSIONS,
    MAX_BATCH_SIZE_BYTES,
    MAX_FILE_SIZE_BYTES,
    MAX_RESPONSE_EVENTS,
    log_parser_service,
)

router = APIRouter(prefix="/logs", tags=["Log Ingestion & Parsing"])


@router.post(
    "/parse",
    response_model=LogParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload & Parse Log Files",
    description="Accepts multiple .log, .txt, .json, .csv, and .jsonl files. Normalizes events and applies security heuristics.",
)
async def upload_and_parse_logs(
    files: List[UploadFile] = File(..., description="Multipart list of log files (≤25 MB each)"),
) -> LogParseResponse:
    """Validate, decode, and parse multiple log streams into structured events."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Provide at least one valid log file.",
        )

    all_events: List[ParsedLogEvent] = []
    summaries: List[FileParseSummary] = []
    total_batch_bytes = 0

    for upload_file in files:
        raw_name = upload_file.filename or "unknown.log"
        # Sanitize filename (remove path components to prevent path traversal)
        safe_name = raw_name.replace("\\", "/").split("/")[-1].strip() or "unnamed.log"

        # Read content safely
        try:
            content_bytes = await upload_file.read()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded file '{safe_name}'.",
            )

        file_size = len(content_bytes)
        total_batch_bytes += file_size

        # Enforce batch size limit
        if total_batch_bytes > MAX_BATCH_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Total upload batch exceeds {MAX_BATCH_SIZE_BYTES // (1024 * 1024)} MB limit.",
            )

        # Validate extension, non-empty, and individual size
        try:
            log_parser_service.validate_file_metadata(safe_name, file_size)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(err),
            )

        # Parse file with event budget
        remaining_budget = max(0, MAX_RESPONSE_EVENTS - len(all_events))
        summary, file_events = log_parser_service.parse_file(safe_name, content_bytes, remaining_budget)

        summaries.append(summary)
        all_events.extend(file_events)

    total_suspicious = sum(s.suspicious_count for s in summaries)
    is_truncated = any(s.truncated for s in summaries)

    return LogParseResponse(
        status="success",
        total_files=len(summaries),
        total_events=len(all_events),
        total_suspicious=total_suspicious,
        summaries=summaries,
        events=all_events,
        is_truncated=is_truncated,
    )
