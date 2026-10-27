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
