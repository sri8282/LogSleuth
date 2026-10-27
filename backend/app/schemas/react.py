"""Pydantic schemas for controlled ReAct investigation agent and allowlisted tools."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.investigation import (
    CorrelatedFinding,
    KnowledgeReferenceSummary,
    RootCauseHypothesis,
)


class SearchLogEventsArgs(BaseModel):
    """Arguments for search_log_events tool."""
    model_config = ConfigDict(extra="forbid")

    keyword: Optional[str] = Field(None, max_length=100, description="Keyword substring to match in message or raw log")
    service: Optional[str] = Field(None, max_length=50, description="Service or daemon name filter")
    severity: Optional[str] = Field(None, max_length=20, description="Severity level filter (e.g., error, critical, warning)")
    ip: Optional[str] = Field(None, max_length=50, description="IPv4 or IPv6 address filter")
    source_ip: Optional[str] = Field(None, max_length=50, description="Source IP address filter")
    limit: int = Field(default=10, ge=1, le=50, description="Maximum number of events to return")


class CorrelateTimeWindowArgs(BaseModel):
    """Arguments for correlate_time_window tool."""
    model_config = ConfigDict(extra="forbid")

    target_event_id: Optional[str] = Field(None, max_length=100, description="Anchor event ID to correlate around")
    target_timestamp: Optional[str] = Field(None, max_length=50, description="Target timestamp string")
    window_seconds: int = Field(default=300, ge=10, le=3600, description="Time window in seconds (default 300s)")
    limit: int = Field(default=10, ge=1, le=50, description="Maximum number of nearby events to return")


class RetrieveRunbookArgs(BaseModel):
    """Arguments for retrieve_runbook tool."""
    model_config = ConfigDict(extra="forbid")

    query: str = Field(..., min_length=1, max_length=200, description="Technical search query for BM25 knowledge base")
    top_k: int = Field(default=2, ge=1, le=5, description="Maximum number of runbooks to retrieve")


class InspectEventEvidenceArgs(BaseModel):
    """Arguments for inspect_event_evidence tool."""
    model_config = ConfigDict(extra="forbid")

    event_id: str = Field(..., min_length=1, max_length=100, description="Exact event ID to inspect (e.g., evt-a1b2c3d4-L12)")


class ReActStep(BaseModel):
    """Auditable action and observation recorded during a ReAct loop iteration."""
    step_number: int = Field(..., description="Iteration sequence number (1-based)")
    action_description: str = Field(..., description="High-level description of why this tool was invoked")
    tool_name: str = Field(..., description="Name of allowlisted tool called")
    tool_input: Dict[str, Any] = Field(..., description="Validated tool arguments")
    tool_output_summary: str = Field(..., description="Concise summary of tool observation")
    evidence_event_ids: List[str] = Field(default_factory=list, description="Event IDs cited in this step")


class ReActInvestigationResponse(BaseModel):
    """Comprehensive response for a controlled ReAct investigation."""
    investigation_id: str = Field(..., description="Unique investigation identifier")
    status: str = Field(..., description="Investigation status ('completed', 'limit_reached', 'repeated_call', 'error')")
    stop_reason: str = Field(..., description="Detailed explanation of why the loop concluded")
    tool_calls_count: int = Field(..., description="Number of tool calls executed (≤ 5)")
    investigation_summary: str = Field(..., description="Investigation summary narrative")
    executive_summary: str = Field(..., description="Executive summary narrative")
    assessed_severity: str = Field(..., description="Severity rating ('critical', 'high', 'medium', 'low')")
    confidence_level: str = Field(..., description="Confidence rating ('high', 'medium', 'low')")
    findings: List[CorrelatedFinding] = Field(default_factory=list, description="Correlated findings with evidence citations")
    retrieved_knowledge: List[KnowledgeReferenceSummary] = Field(default_factory=list, description="Cited knowledge runbooks")
    audit_trail: List[ReActStep] = Field(default_factory=list, description="Transparent step-by-step tool action log")
    hypotheses: List[RootCauseHypothesis] = Field(default_factory=list, description="Ranked root cause hypotheses")
    recommended_actions: List[str] = Field(default_factory=list, description="Recommended remediation actions")
    limitations_and_uncertainty: List[str] = Field(default_factory=list, description="Explicit data gaps and limitations")
    model_used: str = Field(..., description="LLM model identifier used for reasoning")
    total_log_lines_analyzed: int = Field(..., description="Total source log lines in memory")
