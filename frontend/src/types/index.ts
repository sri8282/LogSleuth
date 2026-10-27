export type PageView = 'landing' | 'dashboard' | 'analyzer' | 'investigations' | 'evaluation' | 'reports';

export type LogLevel = 'info' | 'notice' | 'warning' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  lineNumber: number;
  timestamp: string;
  hostname: string;
  service: string;
  pid?: number;
  level: LogLevel;
  message: string;
  raw: string;
  isSuspicious?: boolean;
  suspicionReason?: string;
  indicators?: string[];
  eventId?: string;
  fileName?: string;
}

export interface SeverityStats {
  total: number;
  info: number;
  notice: number;
  warning: number;
  error: number;
  critical: number;
  suspicious: number;
}

export type InvestigationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type InvestigationStatus = 'open' | 'investigating' | 'resolved';

// ---------------------------------------------------------------------------
// Backend API Contracts & Data Transfer Objects (DTOs)
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
  gemini_configured: boolean;
}

export interface SuspiciousFlag {
  rule_id: string;
  category: string;
  description: string;
  indicator: string;
}

export interface ParsedLogEvent {
  event_id: string;
  file_name: string;
  line_number: number;
  timestamp: string | null;
  host: string | null;
  service: string | null;
  severity: string;
  message: string;
  raw_line: string;
  parse_status: string;
  suspicious_flags: SuspiciousFlag[];
}

export interface FileParseSummary {
  file_name: string;
  file_size_bytes: number;
  total_lines: number;
  parsed_count: number;
  partial_count: number;
  unparsed_count: number;
  suspicious_count: number;
  warnings: string[];
  truncated: boolean;
}

export interface LogParseResponse {
  status: string;
  total_files: number;
  total_events: number;
  total_suspicious: number;
  summaries: FileParseSummary[];
  events: ParsedLogEvent[];
  is_truncated: boolean;
}

export interface EvidenceReference {
  event_id: string;
  file_name: string;
  line_number: number;
  raw_snippet: string;
}

export interface CorrelatedFinding {
  finding_id: string;
  title: string;
  pattern_type: string;
  description: string;
  evidence_references: EvidenceReference[];
}

export interface TimelineEvent {
  timestamp: string;
  event_id: string;
  file_name: string;
  line_number: number;
  service?: string | null;
  summary: string;
}

export interface RootCauseHypothesis {
  hypothesis_id: string;
  title: string;
  explanation: string;
  supporting_evidence: string[];
  contradicting_or_alternative_evidence: string[];
  verdict: string;
}

export interface KnowledgeReferenceSummary {
  doc_id: string;
  title: string;
  category: string;
  relevance_summary: string;
  references: string[];
}

export interface InvestigationReport {
  investigation_id: string;
  created_at: string;
  prompt_strategy: string;
  executive_summary: string;
  assessed_severity: string;
  severity_justification: string;
  confidence_level: string;
  confidence_justification: string;
  correlated_findings: CorrelatedFinding[];
  timeline: TimelineEvent[];
  hypotheses: RootCauseHypothesis[];
  retrieved_knowledge: KnowledgeReferenceSummary[];
  recommended_actions: string[];
  limitations_and_uncertainty: string[];
  model_used: string;
  total_log_lines_analyzed: number;
  total_evidence_citations: number;
}

export interface ReActStep {
  step_number: number;
  action_description: string;
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output_summary: string;
  evidence_event_ids: string[];
}

export interface ReActInvestigationResponse {
  investigation_id: string;
  status: string; // 'completed' | 'limit_reached' | 'repeated_call' | 'error'
  stop_reason: string;
  tool_calls_count: number;
  investigation_summary: string;
  executive_summary: string;
  assessed_severity: string;
  confidence_level: string;
  findings: CorrelatedFinding[];
  retrieved_knowledge: KnowledgeReferenceSummary[];
  audit_trail: ReActStep[];
  hypotheses: RootCauseHypothesis[];
  recommended_actions: string[];
  limitations_and_uncertainty: string[];
  model_used: string;
  total_log_lines_analyzed: number;
}

// ---------------------------------------------------------------------------
// Frontend Domain Models
// ---------------------------------------------------------------------------

export interface InvestigationCase {
  id: string;
  title: string;
  summary: string;
  host: string;
  severity: InvestigationSeverity;
  status: InvestigationStatus;
  createdAt: string;
  updatedAt: string;
  logCount: number;
  suspiciousCount: number;
  evidenceCount: number;
  category: string;
  assignedTo: string;
  initialObservation: string;
  hypotheses: string[];
  keyIndicators: string[];
  // Rich Forensic & Backend Integration Fields
  confidenceLevel?: string;
  confidenceJustification?: string;
  correlatedFindings?: CorrelatedFinding[];
  timeline?: TimelineEvent[];
  hypothesesList?: RootCauseHypothesis[];
  retrievedKnowledge?: KnowledgeReferenceSummary[];
  recommendedActions?: string[];
  limitationsAndUncertainty?: string[];
  auditTrail?: ReActStep[];
  toolCallsCount?: number;
  stopReason?: string;
  analysisMode?: 'standard' | 'react';
  modelUsed?: string;
  totalLinesAnalyzed?: number;
}

export interface PromptBenchmark {
  id: string;
  name: string;
  technique: 'Zero-Shot Baseline' | 'Few-Shot Exemplars' | 'Chain-of-Thought (CoT)' | 'Self-Consistency Verification';
  targetDomain: string;
  systemPromptSummary: string;
  reasoningSteps: string[];
  intendedOutcome: string;
  evalMetrics: {
    rootCausePrecision: string;
    hallucinationRate: string;
    averageTokens: string;
    evidenceRecall: string;
  };
  samplePromptSnippet: string;
  status: 'baseline' | 'active_experiment' | 'benchmark_gold';
}

export interface IncidentReport {
  id: string;
  caseId: string;
  title: string;
  framework: 'NIST SP 800-61 Rev 2' | 'SRE Root Cause Analysis (RCA)' | 'Executive Briefing';
  createdAt: string;
  author: string;
  impactLevel: 'High' | 'Moderate' | 'Low';
  targetSystems: string[];
  timeline: { time: string; event: string; evidenceLogId?: string }[];
  rootCauseHypothesis: string;
  mitigationSteps: string[];
  evidenceSummary: string;
}
