import React from 'react';
import { PageView } from '../../types';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Terminal,
  ShieldAlert,
  BrainCircuit,
  FileText,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Radio,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageView;
  onSelectPage: (page: PageView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  investigationCount: number;
  suspiciousCount: number;
}

interface NavItem {
  id: PageView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badgeLabel?: string;
  category: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  investigationCount,
  suspiciousCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      category: 'Overview',
    },
    {
      id: 'analyzer',
      label: 'Log Analyzer',
      icon: Terminal,
      count: suspiciousCount > 0 ? suspiciousCount : undefined,
      badgeLabel: 'stream',
      category: 'Triage',
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: ShieldAlert,
      count: investigationCount > 0 ? investigationCount : undefined,
      category: 'Forensics',
    },
    {
      id: 'evaluation',
      label: 'Prompt Evaluation',
      icon: BrainCircuit,
      badgeLabel: 'AI Lab',
      category: 'Research',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      category: 'Compliance',
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800/80 bg-[#080D18]/95 backdrop-blur-xl transition-all duration-300 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-68'
      }`}
    >
      {/* Subtle Right Ambient Highlight */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/30 via-slate-800 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800/80 flex items-center justify-between px-4">
        <button
          onClick={() => onSelectPage('landing')}
          className="flex items-center gap-3 overflow-hidden text-left cursor-pointer group"
          title="Return to Public Landing Page"
        >
          {/* Custom Futuristic Radar-Iris Brand Icon */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50 group-hover:border-cyan-400 transition-colors">
            <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
            <Fingerprint className="w-5 h-5 text-cyan-400 relative z-10 transition-transform group-hover:scale-105" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-100 group-hover:text-cyan-200 transition-colors">
                  LogSleuth
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider truncate uppercase font-medium">
                Incident Forensics
              </span>
            </div>
          )}
        </button>

        {/* Collapse button with smooth hover */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/70 border border-transparent hover:border-slate-700 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Academic Project Badge */}
      {!isCollapsed && (
        <div className="px-3.5 pt-3.5 pb-1">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-950/30 to-slate-900/60 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <div className="flex items-center gap-1">
                <span className="text-cyan-300 font-semibold text-[11px]">Academic Prompt Project</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Grounding & Invariant Investigation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group whitespace-nowrap text-left ${
                isActive
                  ? 'text-cyan-100 bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-slate-900/40 border border-cyan-500/35 shadow-md shadow-cyan-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-teal-400 shadow-[0_0_10px_#00F2FE]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-all ${
                  isActive
                    ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className={`truncate ${isActive ? 'font-semibold text-slate-100' : ''}`}>
                    {item.label}
                  </span>

                  {item.count !== undefined && (
                    <span className="ml-2 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-800/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                      {item.count}
                    </span>
                  )}

                  {item.badgeLabel && item.count === undefined && (
                    <span className="ml-2 text-[10px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors">
                      {item.badgeLabel}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Technical System Specs */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Kernel Support:</span>
              <span className="font-mono text-slate-300">Linux 6.x / eBPF</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Standard:</span>
              <span className="font-mono text-cyan-400">NIST SP 800-61</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900">
              <span>Grounding: 100% Citable</span>
              <span className="font-mono text-emerald-400">Online</span>
            </div>
            <button
              onClick={() => onSelectPage('landing')}
              className="mt-2 w-full py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-[11px] font-medium transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>Public Landing Page</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-colors" />
            </button>
          </div>
        ) : (
          <div className="text-center font-mono text-[10px] text-cyan-400">
            6.1
          </div>
        )}
      </div>
    </aside>
  );
};
