import React, { useState } from 'react';
import { InvestigationCase, InvestigationSeverity, InvestigationStatus } from '../../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Clock,
  Server,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  User,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  Layers,
  Fingerprint,
  BookOpen,
  Sparkles,
  Binary,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface InvestigationsViewProps {
  cases: InvestigationCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onOpenCreateCase: () => void;
  onNavigateToReports: () => void;
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenCreateCase,
  onNavigateToReports,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.host.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0] || null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Forensic Incident Dossiers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured incident cases correlated from anomalous Linux log evidence with hypothesis trees.
          </p>
        </div>

        <button
          onClick={onOpenCreateCase}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-800 to-slate-850 hover:from-cyan-950 hover:to-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-100 transition-all self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Investigation Case</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg shadow-black/30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search dossier by ID, title, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {['all', 'open', 'investigating', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors font-medium ${
                  statusFilter === st
                    ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Two Column Case List + Case Detail Locker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Case List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCases.length > 0 ? (
            filteredCases.map((item) => {
              const isSelected = activeCase?.id === item.id;
              const severityBadge = {
                critical: 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-800/60',
                high: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
                medium: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
                low: 'text-slate-400 bg-slate-900 border-slate-800',
              }[item.severity];

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCase(item.id)}
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
                    <span className="font-mono text-cyan-300 font-bold text-[11px]">
                      {item.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${severityBadge}`}>
                        {item.severity}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="capitalize text-slate-300 text-[11px] font-medium">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-400">{item.host}</span>
                    <span className="text-cyan-400 tabular-nums">{item.evidenceCount} evidence records</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 text-xs text-slate-400">
              No investigations match criteria.
            </div>
          )}
        </div>

        {/* Right: Detailed Dossier / Forensic Evidence Locker (7 cols) */}
        <div className="lg:col-span-7">
          {activeCase ? (
            <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md p-6 space-y-5 shadow-xl shadow-black/40 relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              {/* Dossier Header */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex items-center justify-between gap-2 text-xs mb-2 font-mono flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">
                      {activeCase.id}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">Host: {activeCase.host}</span>
                    {activeCase.analysisMode && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase border ${
                        activeCase.analysisMode === 'react'
                          ? 'text-teal-300 bg-teal-950/70 border-teal-800/80'
                          : 'text-cyan-300 bg-cyan-950/70 border-cyan-800/80'
                      }`}>
                        {activeCase.analysisMode === 'react' ? 'ReAct Multi-Turn' : 'Grounded Analysis'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCase.confidenceLevel && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        Confidence: <strong className="text-cyan-300 uppercase">{activeCase.confidenceLevel}</strong>
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px]">{activeCase.createdAt}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-100 leading-snug mt-1">
                  {activeCase.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {activeCase.summary}
                </p>

                {activeCase.stopReason && (
                  <div className="mt-2 text-[11px] font-mono text-cyan-400/90 bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                    Termination Reason: {activeCase.stopReason}
                  </div>
                )}
              </div>

              {/* Initial Observation & Category */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Initial Telemetry Anomaly / Justification</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-cyan-200 leading-relaxed font-mono">
                  {activeCase.initialObservation}
                </div>
              </div>

              {/* Correlated Findings with Verified Line Citations */}
              {activeCase.correlatedFindings && activeCase.correlatedFindings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Correlated Incident Findings & Line Citations ({activeCase.correlatedFindings.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {activeCase.correlatedFindings.map((finding) => (
                      <div
                        key={finding.finding_id}
                        className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-slate-100 font-mono text-[12px] flex items-center gap-1.5">
                            <span className="text-cyan-400">[{finding.finding_id}]</span> {finding.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                            {finding.pattern_type}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {finding.description}
                        </p>

                        {/* Evidence References */}
                        {finding.evidence_references && finding.evidence_references.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                              Verified Source Line Citations:
                            </span>
                            {finding.evidence_references.map((ref, rIdx) => (
                              <div
                                key={rIdx}
                                className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-cyan-400 font-bold shrink-0">
                                  {ref.file_name}:L{ref.line_number}
                                </span>
                                <span className="text-slate-500 shrink-0">[{ref.event_id}]</span>
                                <span className="text-slate-200 truncate">{ref.raw_snippet}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Working Hypotheses Tree */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Working Root Cause Hypotheses</span>
                </h4>
                <div className="space-y-2.5">
                  {activeCase.hypothesesList && activeCase.hypothesesList.length > 0 ? (
                    activeCase.hypothesesList.map((hyp) => (
                      <div
                        key={hyp.hypothesis_id}
                        className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-xs">
                            {hyp.hypothesis_id}. {hyp.title}
                          </span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                            hyp.verdict === 'likely'
                              ? 'text-emerald-300 bg-emerald-950/70 border-emerald-800/80'
                              : hyp.verdict === 'possible'
                              ? 'text-amber-300 bg-amber-950/70 border-amber-800/80'
                              : 'text-slate-400 bg-slate-900 border-slate-800'
                          }`}>
                            {hyp.verdict}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{hyp.explanation}</p>

                        {/* Supporting Evidence Citations */}
                        {hyp.supporting_evidence && hyp.supporting_evidence.length > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                            <span className="text-slate-500 block text-[10px] uppercase">Supporting Line Evidence:</span>
                            {hyp.supporting_evidence.map((s, sIdx) => (
                              <div key={sIdx} className="text-emerald-300 pl-2 border-l border-emerald-500/40">
                                • {s}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Contradicting / Alternative Evidence */}
                        {hyp.contradicting_or_alternative_evidence && hyp.contradicting_or_alternative_evidence.length > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                            <span className="text-slate-500 block text-[10px] uppercase">Benign Alternatives & Contradictions:</span>
                            {hyp.contradicting_or_alternative_evidence.map((c, cIdx) => (
                              <div key={cIdx} className="text-amber-300/90 pl-2 border-l border-amber-500/40">
                                • {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : activeCase.hypotheses.length > 0 ? (
                    activeCase.hypotheses.map((hyp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-start gap-3 text-xs"
                      >
                        <span className="font-mono text-cyan-400 font-bold text-[11px] shrink-0 mt-0.5">
                          H{idx + 1}.
                        </span>
                        <span className="text-slate-200 leading-relaxed">{hyp}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No root cause hypotheses formulated.
                    </div>
                  )}
                </div>
              </div>

              {/* Chronological Incident Timeline */}
              {activeCase.timeline && activeCase.timeline.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chronological Incident Timeline ({activeCase.timeline.length})</span>
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {activeCase.timeline.map((item, tIdx) => (
                      <div
                        key={tIdx}
                        className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs font-mono"
                      >
                        <span className="text-slate-400 text-[11px] tabular-nums shrink-0 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                        <span className="text-cyan-400 text-[11px] shrink-0">
                          {item.file_name}:L{item.line_number}
                        </span>
                        {item.service && (
                          <span className="text-teal-300 text-[11px] shrink-0 font-bold">
                            [{item.service}]
                          </span>
                        )}
                        <span className="text-slate-200 truncate flex-1 min-w-0">
                          {item.summary}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authoritative Retrieved Runbooks (RAG) */}
              {activeCase.retrievedKnowledge && activeCase.retrievedKnowledge.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Authoritative Knowledge Runbooks ({activeCase.retrievedKnowledge.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {activeCase.retrievedKnowledge.map((kb) => (
                      <div
                        key={kb.doc_id}
                        className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-cyan-300 font-mono text-[11px]">
                            [{kb.doc_id}] {kb.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                            {kb.category}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {kb.relevance_summary}
                        </p>
                        {kb.references && kb.references.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono pt-1">
                            Sources: {kb.references.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Autonomous ReAct Step-by-Step Audit Trail */}
              {activeCase.auditTrail && activeCase.auditTrail.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Binary className="w-3.5 h-3.5 text-teal-400" />
                    <span>ReAct Autonomous Audit Trail ({activeCase.auditTrail.length} Steps)</span>
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeCase.auditTrail.map((step) => (
                      <div
                        key={step.step_number}
                        className="p-3 rounded-xl border border-teal-500/20 bg-slate-950/80 text-xs space-y-1.5 font-mono"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-teal-400 font-bold text-[11px]">
                              Step {step.step_number}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950/80 border border-teal-700/60 text-teal-300 font-bold">
                              {step.tool_name}
                            </span>
                          </div>
                          {step.evidence_event_ids && step.evidence_event_ids.length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              Cited: {step.evidence_event_ids.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          <strong>Intent:</strong> {step.action_description}
                        </p>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 break-all leading-relaxed">
                          {step.tool_output_summary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {activeCase.recommendedActions && activeCase.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommended Remediation Actions</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 space-y-1">
                    {activeCase.recommendedActions.map((action, aIdx) => (
                      <div key={aIdx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">{aIdx + 1}.</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations & Uncertainty */}
              {activeCase.limitationsAndUncertainty && activeCase.limitationsAndUncertainty.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Forensic Data Boundaries & Uncertainty</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
                    {activeCase.limitationsAndUncertainty.map((lim, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span>{lim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forensic Indicators & MITRE TTPs */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>MITRE ATT&CK TTPs & Forensic Signatures</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeCase.keyIndicators.map((ind, i) => (
                    <span
                      key={i}
                      className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-cyan-300"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Case Actions Bar */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Assigned Unit: <span className="text-slate-200 font-semibold">{activeCase.assignedTo}</span>
                </span>

                <button
                  onClick={onNavigateToReports}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-800 to-slate-850 hover:from-cyan-950 hover:to-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-100 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Draft Incident Brief</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 text-xs text-slate-400">
              Select an investigation case to view dossier
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
