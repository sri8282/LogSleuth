import React from 'react';
import { SeverityStats, InvestigationCase, PageView } from '../../types';
import { StatCard } from '../common/StatCard';
import { TelemetryChart } from './TelemetryChart';
import { LogUploadPanel } from './LogUploadPanel';
import {
  FileText,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Terminal,
  BrainCircuit,
  Database,
  ExternalLink,
  Info,
  Server,
  Zap,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  stats: SeverityStats;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  investigations: InvestigationCase[];
  onNavigate: (page: PageView) => void;
  onSelectInvestigation: (caseId: string) => void;
  onOpenUpload: () => void;
  onTriggerScan?: () => void;
  onProcessFiles: (files: File[]) => Promise<void>;
  onUseSampleLogs: () => void;
  isProcessing: boolean;
  scanCompletedInfo: {
    fileNames: string[];
    totalLines: number;
    timestamp: string;
    isSimulated: boolean;
  } | null;
  onClearUploadedData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  isDemoMode,
  onToggleDemoMode,
  investigations,
  onNavigate,
  onSelectInvestigation,
  onOpenUpload,
  onTriggerScan,
  onProcessFiles,
  onUseSampleLogs,
  isProcessing,
  scanCompletedInfo,
  onClearUploadedData,
}) => {
  const safeTotal = stats.total > 0 ? stats.total : 1;
  const criticalPct = Math.round((stats.critical / safeTotal) * 100);
  const errorPct = Math.round((stats.error / safeTotal) * 100);
  const warningPct = Math.round((stats.warning / safeTotal) * 100);
  const noticePct = Math.round((stats.notice / safeTotal) * 100);
  const infoPct = Math.max(0, 100 - (criticalPct + errorPct + warningPct + noticePct));

  const canScan = (stats.total > 0 || isDemoMode) && !isProcessing;

  return (
    <div className="space-y-6">
      {/* Top Academic Context & Simulation Banner */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-cyan-950/20 backdrop-blur-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/30 relative overflow-hidden"
      >
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shrink-0 shadow-md shadow-cyan-950/40">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
                LogSleuth AI Forensics Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                {scanCompletedInfo && !scanCompletedInfo.isSimulated
                  ? 'User Log Ingest (Active)'
                  : isDemoMode
                  ? 'Academic Benchmark (Sample)'
                  : 'Awaiting Stream Ingestion'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Evaluating Chain-of-Thought versus Few-Shot prompt architectures for automated Linux root cause analysis.
              {scanCompletedInfo && !scanCompletedInfo.isSimulated ? (
                <span className="text-emerald-300">
                  {' '}Analyzed user-provided files <code className="font-mono text-cyan-200">({scanCompletedInfo.fileNames.join(', ')})</code>.
                </span>
              ) : isDemoMode ? (
                <span className="text-slate-300">
                  {' '}Ingested reference telemetry from <code className="font-mono text-cyan-300">srv-edge-linux01</code> (auth.log, syslog, nginx, and auditd).
                </span>
              ) : (
                <span className="text-slate-300">
                  {' '}Workspace is empty. Drop files below or click "Use Sample Logs" to evaluate the dashboard.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 relative z-10">
          {onTriggerScan && (
            <button
              onClick={onTriggerScan}
              disabled={!canScan}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
                canScan
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-200 cursor-pointer'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
              <span>Run Model Scan</span>
            </button>
          )}

          <button
            onClick={onToggleDemoMode}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>{isDemoMode ? 'Clear to Empty State' : 'Load Sample Data'}</span>
          </button>
        </div>
      </motion.div>

      {/* Visible File Upload Area (Directly below page header, above metrics) */}
      <LogUploadPanel
        onProcessFiles={onProcessFiles}
        onUseSampleLogs={onUseSampleLogs}
        isDemoMode={isDemoMode}
        isProcessing={isProcessing}
        scanCompletedInfo={scanCompletedInfo}
        onClearUploadedData={onClearUploadedData}
      />

      {/* Primary Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Log Telemetry"
          value={stats.total}
          subtitle={
            scanCompletedInfo && !scanCompletedInfo.isSimulated
              ? `Ingested from ${scanCompletedInfo.fileNames.join(', ')}`
              : isDemoMode
              ? "Ingested from 3 sources"
              : "Awaiting input stream"
          }
          icon={FileText}
          variant="cyan"
          trend={stats.total > 0 ? `${stats.total} lines` : undefined}
        />
        <StatCard
          label="Syslog Errors"
          value={stats.error}
          subtitle={isDemoMode ? "Kernel & daemon faults" : "0 error events"}
          icon={AlertOctagon}
          variant={stats.error > 0 ? "error" : "default"}
          trend={stats.error > 0 ? "OOM Killer" : undefined}
        />
        <StatCard
          label="Security Warnings"
          value={stats.warning}
          subtitle={isDemoMode ? "SSH retries & 403 scans" : "0 warning anomalies"}
          icon={AlertTriangle}
          variant={stats.warning > 0 ? "warning" : "default"}
          trend={stats.warning > 0 ? "Rate exceeded" : undefined}
        />
        <StatCard
          label="Suspicious Events"
          value={stats.suspicious}
          subtitle={isDemoMode ? "Privilege & spray patterns" : "No active threats"}
          icon={ShieldAlert}
          variant={stats.suspicious > 0 ? "magenta" : "default"}
          trend={stats.suspicious > 0 ? "Action required" : undefined}
        />
      </div>

      {/* Multi-Stream Ingress Telemetry Chart */}
      <TelemetryChart hasData={stats.total > 0} />

      {/* Grid: Severity Distribution & Quick Action Starters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Severity Distribution Visualization (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md p-5 flex flex-col justify-between shadow-xl shadow-black/30 relative">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Syslog Severity Spectrum</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                  RFC-5424
                </span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {isDemoMode ? 'Verified Linux Ingest' : 'Unloaded'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Proportional distribution across standard Linux Syslog RFC severity classifications.
            </p>

            {stats.total > 0 ? (
              <div className="space-y-4">
                {/* Visual Multi-Segment Bar with Glow */}
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 flex overflow-hidden p-[1px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stats.critical > 0 ? 3 : 0, criticalPct)}%` }}
                    transition={{ duration: 0.6 }}
                    className="bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.7)]"
                    title={`Critical: ${stats.critical} (${criticalPct}%)`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stats.error > 0 ? 3 : 0, errorPct)}%` }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                    title={`Error: ${stats.error} (${errorPct}%)`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stats.warning > 0 ? 3 : 0, warningPct)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                    title={`Warning: ${stats.warning} (${warningPct}%)`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stats.notice > 0 ? 3 : 0, noticePct)}%` }}
                    transition={{ duration: 0.9, delay: 0.3 }}
                    className="bg-teal-400"
                    title={`Notice: ${stats.notice} (${noticePct}%)`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${infoPct}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="bg-cyan-600/70"
                    title={`Info: ${stats.info} (${infoPct}%)`}
                  />
                </div>

                {/* Tabular Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-950/20">
                    <span className="text-slate-400 text-[11px] block">Critical</span>
                    <span className="font-mono tabular-nums font-bold text-fuchsia-400 text-base">
                      {stats.critical}
                    </span>
                    <span className="text-[10px] text-fuchsia-400/80 block font-mono">
                      {criticalPct}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/20">
                    <span className="text-slate-400 text-[11px] block">Error</span>
                    <span className="font-mono tabular-nums font-bold text-rose-400 text-base">
                      {stats.error}
                    </span>
                    <span className="text-[10px] text-rose-400/80 block font-mono">
                      {errorPct}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/20">
                    <span className="text-slate-400 text-[11px] block">Warning</span>
                    <span className="font-mono tabular-nums font-bold text-amber-400 text-base">
                      {stats.warning}
                    </span>
                    <span className="text-[10px] text-amber-400/80 block font-mono">
                      {warningPct}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-950/20">
                    <span className="text-slate-400 text-[11px] block">Notice</span>
                    <span className="font-mono tabular-nums font-bold text-teal-300 text-base">
                      {stats.notice}
                    </span>
                    <span className="text-[10px] text-teal-400/80 block font-mono">
                      {noticePct}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
                    <span className="text-slate-400 text-[11px] block">Info</span>
                    <span className="font-mono tabular-nums font-bold text-cyan-300 text-base">
                      {stats.info}
                    </span>
                    <span className="text-[10px] text-cyan-400/80 block font-mono">
                      {infoPct}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <Server className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-300">No severity metrics to visualize</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Import Linux log files or switch to the sample scenario to generate the severity breakdown.
                </p>
                <button
                  onClick={onOpenUpload}
                  className="mt-3.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors"
                >
                  Upload First Log File
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Telemetrics: <span className="font-mono text-cyan-400">{isDemoMode ? 'syslog, auth.log, audit.log' : 'Awaiting Ingestion'}</span></span>
            <button
              onClick={() => onNavigate('analyzer')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors font-medium"
            >
              <span>Open Stream Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Workflows / Academic Modules (1 col) */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md p-5 flex flex-col justify-between shadow-xl shadow-black/30 relative">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Forensic Modules
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Academic methodology for prompt-guided root cause verification.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('analyzer')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/50 hover:bg-slate-850/80 hover:border-cyan-500/40 transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-200">
                      Inspect Log Telemetry
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 pl-9 leading-relaxed">
                  Filter authentication sprays, sudo escalations, and proxy scans.
                </p>
              </button>

              <button
                onClick={() => onNavigate('evaluation')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/50 hover:bg-slate-850/80 hover:border-cyan-500/40 transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-200">
                      Prompt Benchmarking Lab
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 pl-9 leading-relaxed">
                  Evaluate Chain-of-Thought versus Few-Shot hallucination resistance.
                </p>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/50 hover:bg-slate-850/80 hover:border-cyan-500/40 transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-fuchsia-950/70 border border-fuchsia-800/60 text-fuchsia-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-fuchsia-200">
                      NIST Forensic Briefs
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-fuchsia-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 pl-9 leading-relaxed">
                  Generate grounded forensic reports with chronological citations.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Research Lead: <span className="text-slate-300">S. Hari</span></span>
            <span className="text-cyan-400">2026-10-27</span>
          </div>
        </div>
      </div>

      {/* Recent Incident Activity & Dossiers Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md p-5 shadow-xl shadow-black/30 relative">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Correlated Incident Dossiers
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                · {investigations.length} {investigations.length === 1 ? 'case' : 'cases'} tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlated security incidents with evidence trails, MITRE ATT&CK techniques, and hypothesis trees.
            </p>
          </div>

          <button
            onClick={() => onNavigate('investigations')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            <span>View All Dossiers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {investigations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-3">Case ID</th>
                  <th className="py-3 px-3">Incident Title & Category</th>
                  <th className="py-3 px-3">Target Host</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Evidence Citations</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {investigations.map((item) => {
                  const severityBadge = {
                    critical: 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-800/60',
                    high: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
                    medium: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
                    low: 'text-slate-400 bg-slate-900 border-slate-800',
                  }[item.severity];

                  const statusColor = {
                    investigating: 'text-amber-400',
                    open: 'text-cyan-300',
                    resolved: 'text-emerald-400',
                  }[item.status];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-850/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectInvestigation(item.id)}
                    >
                      <td className="py-3 px-3 font-mono text-cyan-300 font-semibold whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-3 px-3 min-w-[280px]">
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-200 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {item.host}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${severityBadge}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] capitalize font-medium ${statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {item.evidenceCount} records
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInvestigation(item.id);
                          }}
                          className="px-3 py-1 text-[11px] font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:border-cyan-500/40 transition-all"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-300">No active forensic dossiers</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no open security cases. You can create a new investigation or inspect raw logs.
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <button
                onClick={() => onNavigate('analyzer')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors"
              >
                Go to Log Analyzer
              </button>
              <button
                onClick={onToggleDemoMode}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-cyan-300 transition-colors"
              >
                Load Sample Scenario
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
