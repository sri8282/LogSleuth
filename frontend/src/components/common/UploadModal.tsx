import React, { useState } from 'react';
import { X, UploadCloud, FileText, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { RAW_SAMPLE_LOG_TEXT } from '../../data/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestLogs: (rawText: string, logSource: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onIngestLogs,
}) => {
  const [logText, setLogText] = useState(RAW_SAMPLE_LOG_TEXT);
  const [logSource, setLogSource] = useState('Linux syslog & auth.log (srv-edge-linux01)');

  if (!isOpen) return null;

  const handlePresetSelect = (preset: 'sample' | 'nginx' | 'clean') => {
    if (preset === 'sample') {
      setLogText(RAW_SAMPLE_LOG_TEXT);
      setLogSource('Linux syslog & auth.log (srv-edge-linux01)');
    } else if (preset === 'nginx') {
      setLogText(`Oct 27 06:20:14 srv-web01 nginx: 198.51.100.44 - - [27/Oct/2026:06:20:14] "GET /../../../../etc/passwd HTTP/1.1" 403 162 "-" "sqlmap/1.7"
Oct 27 06:20:15 srv-web01 nginx: 198.51.100.44 - - [27/Oct/2026:06:20:15] "GET /phpmyadmin/index.php HTTP/1.1" 404 153 "-" "sqlmap/1.7"
Oct 27 06:20:16 srv-web01 nginx: 198.51.100.44 - - [27/Oct/2026:06:20:16] "POST /api/v1/auth/login HTTP/1.1" 401 92 "-" "curl/7.88.1"
Oct 27 06:20:18 srv-web01 fail2ban.actions[774]: NOTICE [nginx-req-limit] Ban 198.51.100.44 for 3600 seconds`);
      setLogSource('Nginx Web & Reverse Proxy Logs');
    } else {
      setLogText('');
      setLogSource('Custom Linux Ingestion');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim()) return;
    onIngestLogs(logText, logSource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0A0F1D] shadow-2xl shadow-cyan-950/30 overflow-hidden text-xs relative"
      >
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0E1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Ingest Linux Telemetry & Log Stream
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Log Stream Origin / Host Identifier
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Load Preset:</span>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('sample')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] border border-cyan-500/30 font-mono"
                >
                  Auth & SSH
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('nginx')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-teal-300 text-[10px] border border-teal-500/30 font-mono"
                >
                  Nginx Probes
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('clean')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] border border-slate-800"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text"
              value={logSource}
              onChange={(e) => setLogSource(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Raw Log Stream (RFC 5424 / Syslog / Auth / Journald)
              </label>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {logText.split('\n').filter(Boolean).length} lines
              </span>
            </div>
            <textarea
              rows={10}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Paste raw log lines from /var/log/syslog, /var/log/auth.log, /var/log/secure, or nginx..."
              className="w-full p-3 rounded-xl bg-[#070B14] border border-slate-800 text-slate-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-none selection:bg-slate-800"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              LogSleuth AI parses standard RFC-5424 timestamps, process daemons, PIDs, and heuristic error patterns completely in-browser without sending system secrets to external servers.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!logText.trim()}
              className="px-4 py-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950 to-slate-900 hover:border-cyan-400 text-cyan-200 font-semibold transition-all disabled:opacity-40 shadow-sm"
            >
              Ingest & Parse Stream
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
