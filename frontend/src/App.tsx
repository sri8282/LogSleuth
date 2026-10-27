/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PageView,
  InvestigationCase,
  IncidentReport,
  LogEntry,
  SeverityStats,
  LogLevel,
  InvestigationSeverity,
} from './types';
import {
  SAMPLE_LOGS,
  DEMO_SEVERITY_STATS,
  EMPTY_SEVERITY_STATS,
  SAMPLE_INVESTIGATIONS,
  SAMPLE_PROMPT_BENCHMARKS,
  SAMPLE_REPORTS
} from './data/sampleData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { LogAnalyzerView } from './components/analyzer/LogAnalyzerView';
import { InvestigationsView } from './components/investigations/InvestigationsView';
import { PromptEvaluationView } from './components/evaluation/PromptEvaluationView';
import { ReportsView } from './components/reports/ReportsView';
import { UploadModal } from './components/common/UploadModal';
import { NewInvestigationModal } from './components/common/NewInvestigationModal';
import { NewReportModal } from './components/common/NewReportModal';
import { ScanProgressModal } from './components/common/ScanProgressModal';
import { LandingPage } from './components/landing/LandingPage';
import { parseRawLogLines } from './utils/logParser';
import { apiService, ApiError } from './services/api';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanCompletedInfo {
  fileNames: string[];
  totalLines: number;
  timestamp: string;
  isSimulated: boolean;
}

export default function App() {
  // Navigation & View state - starts at public landing page
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dataset Mode: Demo / Sample Scenario vs. Pristine Empty State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Application Data States
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const [stats, setStats] = useState<SeverityStats>(DEMO_SEVERITY_STATS);
  const [investigations, setInvestigations] = useState<InvestigationCase[]>(SAMPLE_INVESTIGATIONS);
  const [benchmarks] = useState(SAMPLE_PROMPT_BENCHMARKS);
  const [reports, setReports] = useState<IncidentReport[]>(SAMPLE_REPORTS);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(SAMPLE_INVESTIGATIONS[0]?.id || null);

  // Real Upload & Ingestion Tracking
  const [scanCompletedInfo, setScanCompletedInfo] = useState<ScanCompletedInfo | null>({
    fileNames: ['auth.log', 'syslog', 'audit.log'],
    totalLines: SAMPLE_LOGS.length,
    timestamp: 'Initial Ingest',
    isSimulated: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [isScanRunning, setIsScanRunning] = useState(false);

  // Toast / System Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = msg.startsWith('Error:') || msg.startsWith('Investigation error:') ? 5500 : 3500;
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, duration);
  };

  // Switch to Sample Logs
  const handleUseSampleLogs = () => {
    setIsDemoMode(true);
    setLogs(SAMPLE_LOGS);
    setStats(DEMO_SEVERITY_STATS);
    setInvestigations(SAMPLE_INVESTIGATIONS);
    setReports(SAMPLE_REPORTS);
    setSelectedCaseId(SAMPLE_INVESTIGATIONS[0]?.id || null);
    setScanCompletedInfo({
      fileNames: ['auth.log', 'syslog', 'audit.log (Benchmark)'],
      totalLines: SAMPLE_LOGS.length,
      timestamp: new Date().toLocaleTimeString(),
      isSimulated: true,
    });
    showToast('Loaded benchmark sample logs (srv-edge-linux01).');
  };

  // Clear Uploaded Telemetry Data
  const handleClearUploadedData = () => {
    setIsDemoMode(false);
    setLogs([]);
    setStats(EMPTY_SEVERITY_STATS);
    setInvestigations([]);
    setReports([]);
    setSelectedCaseId(null);
    setScanCompletedInfo(null);
    showToast('Cleared telemetry workspace. Workspace is now empty.');
  };

  // Toggle demo mode between populated scenario and pristine empty state
  const handleToggleDemoMode = () => {
    if (isDemoMode || logs.length > 0) {
      handleClearUploadedData();
    } else {
      handleUseSampleLogs();
    }
  };

  // Process Real Uploaded Files via Backend API
  const handleProcessFiles = async (
    files: File[],
    mode: 'standard' | 'react' = 'standard',
    focusQuery?: string
  ) => {
    setIsProcessing(true);
    setIsScanRunning(true);
    try {
      // 1. Ingest & parse log files via backend API
      const parseRes = await apiService.parseLogs(files);

      const mappedLogs: LogEntry[] = parseRes.events.map((ev) => ({
        id: ev.event_id,
        lineNumber: ev.line_number,
        timestamp: ev.timestamp || 'N/A',
        hostname: ev.host || 'srv-linux-host',
        service: ev.service || 'sys',
        level: (['critical', 'error', 'warning', 'notice', 'info'].includes(ev.severity.toLowerCase())
          ? ev.severity.toLowerCase()
          : 'info') as LogLevel,
        message: ev.message,
        raw: ev.raw_line,
        isSuspicious: ev.suspicious_flags.length > 0,
        suspicionReason: ev.suspicious_flags.map((f) => f.description).join('; ') || undefined,
        indicators: ev.suspicious_flags.map((f) => f.indicator),
        eventId: ev.event_id,
        fileName: ev.file_name,
      }));

      const newStats: SeverityStats = {
        total: mappedLogs.length,
        info: mappedLogs.filter((l) => l.level === 'info').length,
        notice: mappedLogs.filter((l) => l.level === 'notice').length,
        warning: mappedLogs.filter((l) => l.level === 'warning').length,
        error: mappedLogs.filter((l) => l.level === 'error').length,
        critical: mappedLogs.filter((l) => l.level === 'critical').length,
        suspicious: mappedLogs.filter((l) => l.isSuspicious).length,
      };

      setLogs(mappedLogs);
      setStats(newStats);
      setIsDemoMode(false); // real user data!
      setScanCompletedInfo({
        fileNames: files.map((f) => f.name),
        totalLines: mappedLogs.length,
        timestamp: new Date().toLocaleTimeString(),
        isSimulated: false,
      });

      // 2. Execute selected AI investigation endpoint
      let newCase: InvestigationCase;

      if (mode === 'react') {
        const reactRes = await apiService.reactInvestigation(files, {
          focusQuery,
          maxToolCalls: 5,
        });

        const primaryFinding = reactRes.findings[0];
        newCase = {
          id: reactRes.investigation_id,
          title: primaryFinding
            ? primaryFinding.title
            : focusQuery
            ? `Investigation: ${focusQuery}`
            : 'Autonomous ReAct Forensics Dossier',
          summary: reactRes.investigation_summary || reactRes.executive_summary,
          host: mappedLogs[0]?.hostname || 'srv-linux-host',
          severity: (['critical', 'high', 'medium', 'low'].includes(reactRes.assessed_severity.toLowerCase())
            ? reactRes.assessed_severity.toLowerCase()
            : 'medium') as InvestigationSeverity,
          status: 'open',
          createdAt: new Date().toLocaleTimeString(),
          updatedAt: new Date().toLocaleTimeString(),
          logCount: reactRes.total_log_lines_analyzed,
          suspiciousCount: newStats.suspicious,
          evidenceCount: reactRes.findings.reduce((acc, f) => acc + f.evidence_references.length, 0),
          category: primaryFinding?.pattern_type || 'ReAct Forensics',
          assignedTo: 'Autonomous ReAct Agent',
          initialObservation: reactRes.stop_reason || `Concluded with ${reactRes.tool_calls_count} tool call(s).`,
          hypotheses: reactRes.hypotheses.map((h) => `${h.title}: ${h.explanation}`),
          keyIndicators: reactRes.findings.map((f) => f.title),
          confidenceLevel: reactRes.confidence_level,
          correlatedFindings: reactRes.findings,
          retrievedKnowledge: reactRes.retrieved_knowledge,
          auditTrail: reactRes.audit_trail,
          hypothesesList: reactRes.hypotheses,
          recommendedActions: reactRes.recommended_actions,
          limitationsAndUncertainty: reactRes.limitations_and_uncertainty,
          toolCallsCount: reactRes.tool_calls_count,
          stopReason: reactRes.stop_reason,
          analysisMode: 'react',
          modelUsed: reactRes.model_used,
          totalLinesAnalyzed: reactRes.total_log_lines_analyzed,
        };
      } else {
        const reportRes = await apiService.analyzeInvestigation(files, {
          strategy: 'grounded_analysis',
          focusQuery,
        });

        const primaryFinding = reportRes.correlated_findings[0];
        newCase = {
          id: reportRes.investigation_id,
          title: primaryFinding
            ? primaryFinding.title
            : focusQuery
            ? `Investigation: ${focusQuery}`
            : 'Grounded Forensics Dossier',
          summary: reportRes.executive_summary,
          host: mappedLogs[0]?.hostname || 'srv-linux-host',
          severity: (['critical', 'high', 'medium', 'low'].includes(reportRes.assessed_severity.toLowerCase())
            ? reportRes.assessed_severity.toLowerCase()
            : 'medium') as InvestigationSeverity,
          status: 'open',
          createdAt: new Date(reportRes.created_at).toLocaleTimeString(),
          updatedAt: new Date().toLocaleTimeString(),
          logCount: reportRes.total_log_lines_analyzed,
          suspiciousCount: newStats.suspicious,
          evidenceCount: reportRes.total_evidence_citations,
          category: primaryFinding?.pattern_type || 'System Anomaly',
          assignedTo: 'LogSleuth AI Core',
          initialObservation: reportRes.severity_justification,
          hypotheses: reportRes.hypotheses.map((h) => `${h.title}: ${h.explanation}`),
          keyIndicators: reportRes.correlated_findings.map((f) => f.title),
          confidenceLevel: reportRes.confidence_level,
          confidenceJustification: reportRes.confidence_justification,
          correlatedFindings: reportRes.correlated_findings,
          timeline: reportRes.timeline,
          retrievedKnowledge: reportRes.retrieved_knowledge,
          hypothesesList: reportRes.hypotheses,
          recommendedActions: reportRes.recommended_actions,
          limitationsAndUncertainty: reportRes.limitations_and_uncertainty,
          analysisMode: 'standard',
          modelUsed: reportRes.model_used,
          totalLinesAnalyzed: reportRes.total_log_lines_analyzed,
        };
      }

      setInvestigations((prev) => [newCase, ...prev]);
      setSelectedCaseId(newCase.id);
      setCurrentPage('investigations');
      showToast(`Completed ${mode === 'react' ? 'ReAct' : 'AI'} investigation [${newCase.id}].`);
    } catch (err: any) {
      console.error('Failed to process log files:', err);
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to process files.';
      showToast(`Investigation error: ${msg}`);
      throw err;
    } finally {
      setIsProcessing(false);
      setIsScanRunning(false);
    }
  };

  // Log Ingestion Handler (for manual upload modal text paste)
  const handleIngestLogs = (rawText: string, logSource: string) => {
    const parsed = parseRawLogLines(rawText, logSource);
    setLogs(parsed.logs);
    setStats(parsed.stats);
    setIsDemoMode(false);
    setScanCompletedInfo({
      fileNames: [logSource],
      totalLines: parsed.logs.length,
      timestamp: new Date().toLocaleTimeString(),
      isSimulated: false,
    });
    setCurrentPage('analyzer');
    showToast(`Ingested and parsed ${parsed.logs.length} log lines from ${logSource}.`);
  };

  // Create Case Handler
  const handleCreateCase = (newCase: InvestigationCase) => {
    setInvestigations([newCase, ...investigations]);
    setSelectedCaseId(newCase.id);
    showToast(`Opened investigation case ${newCase.id}.`);
  };

  // Create Report Handler
  const handleCreateReport = (newReport: IncidentReport) => {
    setReports([newReport, ...reports]);
    setCurrentPage('reports');
    showToast(`Generated ${newReport.framework} report [${newReport.id}].`);
  };

  // Diagnostic scan complete
  const handleScanComplete = () => {
    setIsScanRunning(false);
    showToast(
      scanCompletedInfo && !scanCompletedInfo.isSimulated
        ? `Model scan complete: Ingested and parsed ${logs.length} entries from ${scanCompletedInfo.fileNames.join(', ')}.`
        : 'Diagnostic benchmark scan complete: 14 anomaly vectors correlated.'
    );
  };

  // Can the user run scan?
  const canScan = (logs.length > 0 || isDemoMode);

  // Dedicated Full-Screen Public Landing Page View
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchDashboard={() => setCurrentPage('dashboard')}
          onNavigateToPage={(page) => setCurrentPage(page)}
        />
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0C1222] ${
              toastMessage.startsWith('Error:') || toastMessage.startsWith('Investigation error:')
                ? 'border border-rose-500/50 shadow-rose-950/40 text-rose-200'
                : 'border border-cyan-500/40 shadow-black/60 text-slate-200'
            } shadow-2xl text-xs backdrop-blur-md`}
          >
            {toastMessage.startsWith('Error:') || toastMessage.startsWith('Investigation error:') ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-deep-canvas text-slate-200 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => setCurrentPage(page)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        investigationCount={investigations.length}
        suspiciousCount={stats.suspicious}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Ambient Glow Effect */}
        <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <Header
          currentPage={currentPage}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onOpenUpload={() => setIsUploadOpen(true)}
          onTriggerScan={() => setIsScanRunning(true)}
          canScan={canScan}
          isProcessing={isProcessing}
        />

        {/* Dynamic Content Viewport with Smooth Fade Transitions */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {currentPage === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={handleToggleDemoMode}
                  investigations={investigations}
                  onNavigate={(page) => setCurrentPage(page)}
                  onSelectInvestigation={(caseId) => {
                    setSelectedCaseId(caseId);
                    setCurrentPage('investigations');
                  }}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onTriggerScan={() => setIsScanRunning(true)}
                  onProcessFiles={handleProcessFiles}
                  onUseSampleLogs={handleUseSampleLogs}
                  isProcessing={isProcessing}
                  scanCompletedInfo={scanCompletedInfo}
                  onClearUploadedData={handleClearUploadedData}
                />
              )}

              {currentPage === 'analyzer' && (
                <LogAnalyzerView
                  logs={logs}
                  onUploadClick={() => setIsUploadOpen(true)}
                  onTriggerScan={() => setIsScanRunning(true)}
                  onAddToInvestigation={(log) => {
                    setIsNewCaseOpen(true);
                  }}
                />
              )}

              {currentPage === 'investigations' && (
                <InvestigationsView
                  cases={investigations}
                  selectedCaseId={selectedCaseId}
                  onSelectCase={(caseId) => setSelectedCaseId(caseId)}
                  onOpenCreateCase={() => setIsNewCaseOpen(true)}
                  onNavigateToReports={() => setCurrentPage('reports')}
                />
              )}

              {currentPage === 'evaluation' && (
                <PromptEvaluationView benchmarks={benchmarks} />
              )}

              {currentPage === 'reports' && (
                <ReportsView
                  reports={reports}
                  onOpenNewReport={() => setIsNewReportOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Upload & Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onIngestLogs={handleIngestLogs}
      />

      {/* New Investigation Case Modal */}
      <NewInvestigationModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onCreateCase={handleCreateCase}
      />

      {/* New Report Modal */}
      <NewReportModal
        isOpen={isNewReportOpen}
        onClose={() => setIsNewReportOpen(false)}
        cases={investigations}
        onCreateReport={handleCreateReport}
      />

      {/* Animated Diagnostic Scan Overlay */}
      <ScanProgressModal
        isOpen={isScanRunning}
        onClose={() => setIsScanRunning(false)}
        onComplete={handleScanComplete}
      />

      {/* Transient Action Confirmation Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0C1222] ${
            toastMessage.startsWith('Error:') || toastMessage.startsWith('Investigation error:')
              ? 'border border-rose-500/50 shadow-rose-950/40 text-rose-200'
              : 'border border-cyan-500/40 shadow-black/60 text-slate-200'
          } shadow-2xl text-xs backdrop-blur-md`}
        >
          {toastMessage.startsWith('Error:') || toastMessage.startsWith('Investigation error:') ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
