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
  Fingerprint
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
                <div className="flex items-center justify-between gap-2 text-xs mb-1.5 font-mono">
                  <span className="text-cyan-300 font-bold">
                    {activeCase.id} · Host: {activeCase.host}
                  </span>
                  <span className="text-slate-400 text-[11px]">{activeCase.createdAt}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 leading-snug mt-1">
                  {activeCase.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {activeCase.summary}
                </p>
              </div>

              {/* Initial Observation & Category */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Initial Telemetry Anomaly</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-cyan-200 leading-relaxed font-mono">
                  {activeCase.initialObservation}
                </div>
              </div>

              {/* Working Hypotheses Tree */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Working Root Cause Hypotheses</span>
                </h4>
                <div className="space-y-2">
                  {activeCase.hypotheses.map((hyp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-start gap-3 text-xs"
                    >
                      <span className="font-mono text-cyan-400 font-bold text-[11px] shrink-0 mt-0.5">
                        H{idx + 1}.
                      </span>
                      <span className="text-slate-200 leading-relaxed">{hyp}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-800 to-slate-850 hover:from-cyan-950 hover:to-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
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
