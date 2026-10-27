"""Pydantic schemas for AI-assisted log investigations and root-cause reports."""

from typing import List, Optional
from pydantic import BaseModel, Field


class EvidenceReference(BaseModel):
    """Citation linking a claim directly to a verified source log event."""
    event_id: str = Field(..., description="Deterministic event ID (e.g., evt-a1b2c3d4-L12)")
    file_name: str = Field(..., description="Origin file name")
    line_number: int = Field(..., description="1-indexed line position in the source file")
    raw_snippet: str = Field(..., description="Exact raw text snippet from log")


class CorrelatedFinding(BaseModel):
    """Correlated security or system anomaly pattern."""
    finding_id: str = Field(..., description="Unique finding ID (e.g., FIND-01)")
    title: str = Field(..., description="Brief finding title")
    pattern_type: str = Field(..., description="Correlation pattern category")
    description: str = Field(..., description="Detailed description of the correlated sequence")
    evidence_references: List[EvidenceReference] = Field(default_factory=list, description="Citations to source log lines")


class TimelineEvent(BaseModel):
    """Timestamped event in chronological incident sequence."""
    timestamp: str = Field(..., description="Original or normalized timestamp string")
    event_id: str = Field(..., description="Associated event ID")
    file_name: str = Field(..., description="Source log file")
    line_number: int = Field(..., description="Line number in log file")
    service: Optional[str] = Field(None, description="Service daemon or process")
    summary: str = Field(..., description="Concise description of the event")


class RootCauseHypothesis(BaseModel):
    """Ranked working hypothesis for root cause isolation."""
    hypothesis_id: str = Field(..., description="Identifier (e.g., H1, H2)")
    title: str = Field(..., description="Hypothesis title")
    explanation: str = Field(..., description="Causal narrative explaining how the event occurred")
    supporting_evidence: List[str] = Field(default_factory=list, description="Evidence references supporting this hypothesis")
    contradicting_or_alternative_evidence: List[str] = Field(default_factory=list, description="Benign or alternative factors")
    verdict: str = Field(..., description="Assessment (e.g., 'likely', 'possible', 'unlikely')")


class KnowledgeReferenceSummary(BaseModel):
    """RAG reference cited in investigation analysis."""
    doc_id: str = Field(..., description="Stable knowledge document ID (e.g., KB-SSH-AUTH-001)")
    title: str = Field(..., description="Document title")
    category: str = Field(..., description="Topic category")
    relevance_summary: str = Field(..., description="Why this guidance applies to the observed telemetry")
    references: List[str] = Field(default_factory=list, description="Official authoritative sources")


class InvestigationReport(BaseModel):
    """Complete structured forensic investigation report."""
    investigation_id: str = Field(..., description="Unique incident investigation ID")
    created_at: str = Field(..., description="ISO-8601 report timestamp")
    prompt_strategy: str = Field(..., description="Prompt strategy applied ('grounded_analysis' or 'few_shot')")
    executive_summary: str = Field(..., description="Comprehensive executive summary of the incident")
    assessed_severity: str = Field(..., description="Incident severity ('critical', 'high', 'medium', 'low')")
    severity_justification: str = Field(..., description="Detailed reasoning for the chosen severity rating")
    confidence_level: str = Field(..., description="Confidence rating ('high', 'medium', 'low')")
    confidence_justification: str = Field(..., description="Reasoning for confidence rating and uncertainty")
    correlated_findings: List[CorrelatedFinding] = Field(default_factory=list, description="Correlated event clusters")
    timeline: List[TimelineEvent] = Field(default_factory=list, description="Chronological timeline of events")
    hypotheses: List[RootCauseHypothesis] = Field(default_factory=list, description="Ranked root cause hypotheses")
    retrieved_knowledge: List[KnowledgeReferenceSummary] = Field(default_factory=list, description="Grounding knowledge references")
    recommended_actions: List[str] = Field(default_factory=list, description="Immediate defensive and remediation steps")
    limitations_and_uncertainty: List[str] = Field(default_factory=list, description="Explicit data gaps and limitations")
    model_used: str = Field(..., description="LLM model identifier used for analysis")
    total_log_lines_analyzed: int = Field(..., description="Total count of source log lines processed")
    total_evidence_citations: int = Field(..., description="Count of distinct evidence line citations")
