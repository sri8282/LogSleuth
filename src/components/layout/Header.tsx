import React, { useState } from 'react';
import { PageView } from '../../types';
import {
  UploadCloud,
  CheckCircle2,
  Database,
  ChevronDown,
  Play,
  Cpu,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentPage: PageView;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenUpload: () => void;
  onTriggerScan: () => void;
  canScan?: boolean;
  isProcessing?: boolean;
}

const PAGE_METADATA: Record<PageView, { title: string; category: string; description: string }> = {
  landing: {
    title: 'Public Portal & Overview',
    category: 'LogSleuth AI',
    description: 'Intelligent Log Analysis and Incident Investigation Platform',
  },
  dashboard: {
    title: 'Operations & Ingress Telemetry',
    category: 'SRE & SecOps Console',
    description: 'System overview, threat distribution, and multi-channel telemetry',
  },
  analyzer: {
    title: 'Linux Stream & Lexical Parser',
    category: 'Stream Triage',
    description: 'Kernel ring buffer, auth.log, and web proxy access inspection',
  },
  investigations: {
    title: 'Incident Forensics & Dossiers',
    category: 'Active Cases',
    description: 'Correlated evidence lockers, hypothesis trees, and MITRE mapping',
  },
  evaluation: {
    title: 'Prompt Engineering Laboratory',
    category: 'Empirical Research',
    description: 'Side-by-side prompt benchmarks, hallucination guards, and CoT metrics',
  },
  reports: {
    title: 'Forensic Incident Documentation',
    category: 'NIST Standards',
    description: 'Post-mortem RCA, evidence chronology, and compliance briefs',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  isDemoMode,
  onToggleDemoMode,
  onOpenUpload,
  onTriggerScan,
  canScan = true,
  isProcessing = false,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const meta = PAGE_METADATA[currentPage];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090E1A]/90 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between gap-4 select-none shrink-0 sticky top-0 z-20">
      {/* Subtle bottom cyan hairline */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Zone 1: Breadcrumb & Contextual Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs font-medium text-slate-400 hidden sm:inline whitespace-nowrap">
          {meta.category}
        </span>
        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">/</span>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-100 truncate tracking-tight flex items-center gap-2">
            <span>{meta.title}</span>
          </h1>
        </div>
      </div>

      {/* Zone 2: Real System Status, Scan Action & Mode Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Run Diagnostic Scan Button (Animated Progress Trigger) */}
        <button
          onClick={onTriggerScan}
          disabled={!canScan || isProcessing}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
            canScan && !isProcessing
              ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:text-cyan-100 shadow-cyan-950/40 cursor-pointer'
              : 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
          }`}
          title={canScan ? 'Run Heuristic Analysis Pipeline on loaded logs' : 'Select or upload log files first'}
        >
          {isProcessing ? (
            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
          )}
          <span>{isProcessing ? 'Analyzing...' : 'Run Model Scan'}</span>
        </button>

        {/* Dataset Mode Toggle: Demo vs Pristine Empty */}
        <button
          onClick={onToggleDemoMode}
          title="Toggle between sample scenario and pristine empty state"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 text-slate-300 transition-colors shadow-sm"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline text-slate-400">Dataset:</span>
          <span className="font-medium text-slate-200">
            {isDemoMode ? 'Sample Linux Logs' : 'Empty State'}
          </span>
        </button>

        {/* Small System Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-slate-300">Parser: Online</span>
          <span className="text-slate-700">·</span>
          <span className="text-cyan-400 font-mono text-[11px]">Ready</span>
        </div>

        {/* Quick Ingest / Upload Action with Cyan Hover Accent */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-100 bg-gradient-to-r from-slate-800 to-slate-850 hover:from-cyan-950/80 hover:to-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-all shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ingest Logs</span>
        </button>

        {/* User / Profile Dropdown Placeholder */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 text-xs rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-300 font-mono shadow-sm">
              SH
            </div>
            <span className="hidden xl:inline text-slate-300 text-xs font-medium">SecOps Lead</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0D1322] border border-cyan-500/30 shadow-2xl py-2 text-xs text-slate-300 z-50 backdrop-blur-xl">
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <p className="font-semibold text-slate-100">Srihari (Lead Researcher)</p>
                <p className="text-[11px] text-cyan-400 font-mono truncate">srihari8286@gmail.com</p>
                <p className="text-[10px] text-slate-400 mt-1">Role: Prompt Architect & Forensic Analyst</p>
              </div>
              <div className="px-3.5 py-2 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Project Framework:</span>
                  <span className="text-slate-200 font-medium">Prompt Engineering</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Grounding Invariants:</span>
                  <span className="text-emerald-400 font-mono">Strict RFC-5424</span>
                </div>
              </div>
              <div className="border-t border-slate-800 px-3.5 pt-2">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left text-slate-400 hover:text-slate-200 py-1"
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
