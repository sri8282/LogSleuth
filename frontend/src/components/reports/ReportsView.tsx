import React, { useState } from 'react';
import { IncidentReport } from '../../types';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Clock,
  Server,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsViewProps {
  reports: IncidentReport[];
  onOpenNewReport: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports, onOpenNewReport }) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleCopyMarkdown = () => {
    if (!activeReport) return;
    const md = `# ${activeReport.title}
**Framework**: ${activeReport.framework}
**Generated**: ${activeReport.createdAt}
**Impact Level**: ${activeReport.impactLevel}
**Target Systems**: ${activeReport.targetSystems.join(', ')}

## Root Cause Analysis
${activeReport.rootCauseHypothesis}

## Incident Timeline
${activeReport.timeline.map((t) => `- **${t.time}**: ${t.event} [Ref: ${t.evidenceLogId || 'N/A'}]`).join('\n')}

## Recommended Mitigation Checklist
${activeReport.mitigationSteps.map((s, i) => `${i + 1}. [ ] ${s}`).join('\n')}

## Forensic Evidence Summary
${activeReport.evidenceSummary}
`;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1500);
  };

  const handleDownloadJSON = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport.id.toLowerCase()}-forensic-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Forensic Incident Documentation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evidence-grounded post-mortem and compliance briefs structured around NIST SP 800-61 Rev 2.
          </p>
        </div>

        <button
          onClick={onOpenNewReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-800 to-slate-850 hover:from-cyan-950 hover:to-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-100 transition-all self-start sm:self-auto shadow-sm"
        >
          <span>Generate Incident Brief</span>
        </button>
      </div>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Reports Catalog (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 font-mono">
              Available Dossiers ({reports.length})
            </div>

            {reports.map((rep) => {
              const isSelected = rep.id === activeReport?.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs relative overflow-hidden shadow-md shadow-black/20 ${
                    isSelected
                      ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-slate-900/80'
                      : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-850/60 hover:border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-teal-400 shadow-[0_0_8px_#00F2FE]" />
                  )}

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] text-cyan-300 font-bold">
                      {rep.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rep.framework}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-xs leading-snug">
                    {rep.title}
                  </h3>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Impact: <strong className="text-amber-400">{rep.impactLevel}</strong></span>
                    <span>{rep.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}

            {/* Framework Standards Reference Card */}
            <div className="p-4 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 text-xs space-y-2">
              <span className="font-semibold text-slate-200 block flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>NIST Compliance Assurance</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                LogSleuth AI reports map telemetry findings directly into standard incident phases: Preparation, Detection, Containment, and Post-Incident Eradication.
              </p>
            </div>
          </div>

          {/* Right: Active Report Viewer & Document Structure (8 cols) */}
          <div className="lg:col-span-8">
            {activeReport && (
              <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md overflow-hidden shadow-xl shadow-black/40 relative">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                {/* Document Action Bar */}
                <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0A0E1A] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-cyan-300">{activeReport.id}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{activeReport.framework}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Markdown</span>
                    </button>

                    <button
                      onClick={handleDownloadJSON}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedJson ? 'Downloaded' : 'Export JSON'}</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors flex items-center gap-1.5"
                      title="Print-friendly forensic brief"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Printable Document Body */}
                <div className="p-6 space-y-6 text-xs text-slate-300 leading-relaxed max-h-[640px] overflow-y-auto">
                  {/* Title & Metadata */}
                  <div className="border-b border-slate-800 pb-4">
                    <div className="text-[11px] font-mono text-cyan-400 mb-1">
                      OFFICIAL INCIDENT DOSSIER · CONFIDENTIAL FORENSICS
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">
                      {activeReport.title}
                    </h3>
                    <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block font-mono">Case Reference</span>
                        <span className="font-mono text-cyan-300">{activeReport.caseId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block font-mono">Date / Time</span>
                        <span className="font-mono text-slate-200">{activeReport.createdAt}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block font-mono">Assessed Impact</span>
                        <span className="font-medium text-amber-400">{activeReport.impactLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block font-mono">Forensic Analyst</span>
                        <span className="text-slate-200">{activeReport.author}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Executive Summary & Root Cause */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      1. Executive Summary & Root Cause Analysis
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                      {activeReport.rootCauseHypothesis}
                    </div>
                  </div>

                  {/* Section 2: Chronological Timeline & Evidence Citations */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      2. Incident Timeline & Invariant Citations
                    </h4>
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                            <th className="py-2.5 px-3 font-mono">Timestamp</th>
                            <th className="py-2.5 px-3">Correlated Forensic Event</th>
                            <th className="py-2.5 px-3 font-mono text-right">Log Citation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {activeReport.timeline.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                                {entry.time}
                              </td>
                              <td className="py-2.5 px-3 text-slate-200 font-sans">
                                {entry.event}
                              </td>
                              <td className="py-2.5 px-3 text-right text-cyan-400 text-[11px] whitespace-nowrap font-bold">
                                {entry.evidenceLogId ? `[ref:${entry.evidenceLogId}]` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Mitigation Checklist */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      3. Eradication & Remediation Action Items
                    </h4>
                    <div className="space-y-2">
                      {activeReport.mitigationSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
                        >
                          <input
                            type="checkbox"
                            defaultChecked={idx === 0}
                            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-slate-200 leading-normal">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Evidence Integrity */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      4. Evidence Grounding & Non-Repudiation Invariant
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {activeReport.evidenceSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
          <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300">No incident reports drafted yet</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Select an active investigation case or generate a new incident brief from verified log evidence.
          </p>
          <button
            onClick={onOpenNewReport}
            className="mt-3.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors"
          >
            Create Report from Investigation
          </button>
        </div>
      )}
    </div>
  );
};
