import React, { useState, useMemo } from 'react';
import { LogEntry, LogLevel } from '../../types';
import {
  Terminal,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldAlert,
  Info,
  Cpu,
  Play,
  RotateCcw,
  Code2,
  Binary
} from 'lucide-react';
import { motion } from 'motion/react';

interface LogAnalyzerViewProps {
  logs: LogEntry[];
  onUploadClick: () => void;
  onTriggerScan?: () => void;
  onAddToInvestigation?: (log: LogEntry) => void;
}

export const LogAnalyzerView: React.FC<LogAnalyzerViewProps> = ({
  logs,
  onUploadClick,
  onTriggerScan,
  onAddToInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(logs[1]?.id || logs[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'parsed' | 'hex' | 'mitre'>('parsed');

  // Filter logs based on search, level, and suspicious filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (onlySuspicious && !log.isSuspicious) return false;
      if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          log.raw.toLowerCase().includes(query) ||
          log.service.toLowerCase().includes(query) ||
          log.hostname.toLowerCase().includes(query) ||
          (log.suspicionReason && log.suspicionReason.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [logs, searchQuery, selectedLevel, onlySuspicious]);

  const selectedLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || null;
  }, [logs, selectedLogId]);

  const handleCopyRaw = (log: LogEntry) => {
    navigator.clipboard.writeText(log.raw);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportText = () => {
    const content = filteredLogs.map((l) => l.raw).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logsleuth-export-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'critical':
        return 'text-fuchsia-400 bg-fuchsia-950/60 border-fuchsia-800/80 font-semibold';
      case 'error':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80 font-semibold';
      case 'warning':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80 font-medium';
      case 'notice':
        return 'text-teal-300 bg-teal-950/60 border-teal-800/80';
      case 'info':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  // Convert raw string to pseudo-hex representation for forensic view
  const toHexDump = (str: string) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Linux Telemetry & Stream Analyzer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingestion, normalization, and lexical field extraction for Linux kernel and daemon streams.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onTriggerScan && (
            <button
              onClick={onTriggerScan}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
              <span>Simulate Scan</span>
            </button>
          )}

          <button
            onClick={handleExportText}
            disabled={filteredLogs.length === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export View ({filteredLogs.length})</span>
          </button>

          <button
            onClick={onUploadClick}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-100 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Upload New Log</span>
          </button>
        </div>
      </div>

      {/* Filter and Query Toolbar */}
      <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md space-y-3 shadow-lg shadow-black/30">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Grep search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search regex, IP, user, service (e.g. 'sshd', '198.51.100.44', 'shadow')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300 font-mono"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Filter Pill Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setSearchQuery('sshd')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 font-mono"
            >
              sshd
            </button>
            <button
              onClick={() => setSearchQuery('sudo')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 font-mono"
            >
              sudo
            </button>
            <button
              onClick={() => setSearchQuery('198.51.100.44')}
              className="px-2 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 font-mono"
            >
              IP:198.51...
            </button>

            {/* Suspicious only toggle */}
            <button
              onClick={() => setOnlySuspicious(!onlySuspicious)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl border transition-all whitespace-nowrap ${
                onlySuspicious
                  ? 'bg-fuchsia-950/50 border-fuchsia-500/60 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Suspicious Only</span>
            </button>
          </div>
        </div>

        {/* Severity level segmented buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 font-mono">
              <Filter className="w-3 h-3" />
              <span>LEVEL:</span>
            </span>
            {['all', 'critical', 'error', 'warning', 'notice', 'info'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-wider font-mono transition-all whitespace-nowrap ${
                  selectedLevel === lvl
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            Showing <strong className="text-cyan-400">{filteredLogs.length}</strong> of {logs.length} entries
          </div>
        </div>
      </div>

      {/* Main Terminal View + Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Terminal Log Stream (7 or 8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800/80 bg-[#070B14] overflow-hidden shadow-xl shadow-black/40">
          {/* Terminal Window Chrome */}
          <div className="px-4 py-2.5 border-b border-slate-800/90 bg-[#0A0E1A] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-slate-400 font-mono text-[11px] pl-2 border-l border-slate-800">
                /var/log/syslog · auth.log · auditd
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE INGESTION PARSED</span>
            </div>
          </div>

          {/* Log Lines Container */}
          <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-900/60 font-mono text-xs">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const isSelected = log.id === selectedLogId;

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-2.5 flex items-start gap-2.5 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-900/90 border-l-2 border-l-cyan-400 shadow-inner'
                        : log.isSuspicious
                        ? 'bg-fuchsia-950/10 hover:bg-fuchsia-950/20'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Line Number */}
                    <span className="text-[11px] text-slate-500 tabular-nums w-7 text-right shrink-0 select-none font-mono">
                      {log.lineNumber}
                    </span>

                    {/* Timestamp */}
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0 whitespace-nowrap font-mono">
                      {log.timestamp.slice(11, 19)}
                    </span>

                    {/* Daemon */}
                    <span className="text-[11px] text-cyan-300 font-medium shrink-0 w-24 truncate font-mono">
                      {log.service}
                      {log.pid ? `[${log.pid}]` : ''}
                    </span>

                    {/* Level */}
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border shrink-0 ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>

                    {/* Message Body */}
                    <span className="text-slate-200 text-xs break-all flex-1 min-w-0 font-mono">
                      {log.message}
                    </span>

                    {/* Suspicious Tag */}
                    {log.isSuspicious && (
                      <span className="shrink-0 text-fuchsia-400 flex items-center gap-1 text-[10px] font-mono bg-fuchsia-950/60 border border-fuchsia-800/80 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(217,70,239,0.3)]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>ANOMALY</span>
                      </span>
                    )}

                    {/* Copy action on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyRaw(log);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-300 transition-opacity shrink-0"
                      title="Copy raw log line"
                    >
                      {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-slate-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">No log entries matched your filter parameters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('all');
                    setOnlySuspicious(false);
                  }}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-mono"
                >
                  Reset search filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Log Inspector & Invariant Proof (4 or 5 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Record Inspector Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
                  Record Inspector
                </h3>
              </div>
              {selectedLog && (
                <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                  Line #{selectedLog.lineNumber}
                </span>
              )}
            </div>

            {/* Inspector Tabs */}
            <div className="flex items-center gap-1 mb-3 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setInspectorTab('parsed')}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  inspectorTab === 'parsed' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Parsed Fields
              </button>
              <button
                onClick={() => setInspectorTab('hex')}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  inspectorTab === 'hex' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hex Dump
              </button>
              <button
                onClick={() => setInspectorTab('mitre')}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  inspectorTab === 'mitre' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MITRE TTPs
              </button>
            </div>

            {selectedLog ? (
              <div className="space-y-3 text-xs">
                {inspectorTab === 'parsed' && (
                  <>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-mono">Timestamp</span>
                      <span className="font-mono text-slate-200 text-xs">
                        {selectedLog.timestamp}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 block font-mono">Host Origin</span>
                        <span className="font-mono text-cyan-300">{selectedLog.hostname}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block font-mono">Service / PID</span>
                        <span className="font-mono text-slate-200">
                          {selectedLog.service} {selectedLog.pid && `(${selectedLog.pid})`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block font-mono">Normalized Severity</span>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase border ${getLevelColor(selectedLog.level)}`}>
                        {selectedLog.level}
                      </span>
                    </div>

                    {selectedLog.isSuspicious && (
                      <div className="p-3 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/30 space-y-1.5 shadow-sm">
                        <span className="text-[11px] font-semibold text-fuchsia-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-400" />
                          Suspicious Telemetry Signature
                        </span>
                        <p className="text-xs text-slate-300 leading-snug">
                          {selectedLog.suspicionReason}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1 font-mono">Raw Syslog String</span>
                      <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all leading-relaxed">
                        {selectedLog.raw}
                      </div>
                    </div>
                  </>
                )}

                {inspectorTab === 'hex' && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1 font-mono">Hexadecimal Payload Stream</span>
                    <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800 font-mono text-[10px] text-cyan-400 break-all leading-relaxed max-h-48 overflow-y-auto">
                      {toHexDump(selectedLog.raw)}
                    </div>
                  </div>
                )}

                {inspectorTab === 'mitre' && (
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-500 block font-mono">Correlated Adversary Techniques</span>
                    {selectedLog.indicators && selectedLog.indicators.length > 0 ? (
                      selectedLog.indicators.map((ind, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center justify-between">
                          <span>{ind}</span>
                          <span className="text-[10px] text-slate-500">ATT&CK</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs py-3 text-center">
                        No malicious indicators flagged for this line.
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCopyRaw(selectedLog)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-750 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedId === selectedLog.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Raw Line</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Raw Line</span>
                      </>
                    )}
                  </button>

                  {onAddToInvestigation && (
                    <button
                      onClick={() => onAddToInvestigation(selectedLog)}
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-950/80 text-cyan-300 text-xs transition-colors"
                      title="Add this record as evidence to an incident case"
                    >
                      Attach
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Click any log line to inspect extracted parameters
              </div>
            )}
          </div>

          {/* AI Pipeline Architecture Placeholder */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md p-4 space-y-3 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Prompt Ingestion Pipeline</span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Stage 1 (Frontend Ingestion & Lexical Extraction) is verified. The prompt evaluation engine operates under strict zero-hallucination constraints without generating mock or synthetic model results.
            </p>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Lexical Tokenizer:</span>
                <span className="text-emerald-400 font-semibold">RFC-5424 Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">MITRE Heuristic:</span>
                <span className="text-emerald-400 font-semibold">TTP Tagging</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Model Inference:</span>
                <span className="text-cyan-400">Pipeline Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
