"""Pydantic schemas for log ingestion and parsing."""

from typing import List, Optional
from pydantic import BaseModel, Field


class SuspiciousFlag(BaseModel):
    """Rule-based security anomaly indicator."""
    rule_id: str = Field(..., description="Deterministic heuristic identifier")
    category: str = Field(..., description="Security category (e.g. Auth, Privilege, Web)")
    description: str = Field(..., description="Human-readable rule match description")
    indicator: str = Field(..., description="Correlated MITRE ATT&CK TTP or indicator")


class ParsedLogEvent(BaseModel):
    """Normalized structured log record."""
    event_id: str = Field(..., description="Deterministic hash-based event ID (file + line)")
    file_name: str = Field(..., description="Source file name")
    line_number: int = Field(..., description="1-indexed line position in the source file")
    timestamp: Optional[str] = Field(None, description="ISO-8601 or normalized timestamp")
    host: Optional[str] = Field(None, description="Host origin identifier")
    service: Optional[str] = Field(None, description="Service / daemon name or process")
    severity: str = Field(..., description="Normalized severity (critical, error, warning, notice, info, debug)")
    message: str = Field(..., description="Cleaned message body")
    raw_line: str = Field(..., description="Original raw line string preserved for invariant auditing")
    parse_status: str = Field(..., description="'parsed', 'partial', or 'unparsed'")
    suspicious_flags: List[SuspiciousFlag] = Field(default_factory=list, description="Matched heuristic indicators")


class FileParseSummary(BaseModel):
    """Per-file ingestion and parsing breakdown."""
    file_name: str
    file_size_bytes: int
    total_lines: int
    parsed_count: int
    partial_count: int
    unparsed_count: int
    suspicious_count: int
    warnings: List[str] = Field(default_factory=list)
    truncated: bool = False


class LogParseResponse(BaseModel):
    """Overall response for multipart log upload and parsing."""
    status: str = "success"
    total_files: int
    total_events: int
    total_suspicious: int
    summaries: List[FileParseSummary]
    events: List[ParsedLogEvent]
    is_truncated: bool = False
