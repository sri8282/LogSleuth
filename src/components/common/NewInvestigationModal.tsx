import React, { useState } from 'react';
import { X, ShieldAlert, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { InvestigationCase, InvestigationSeverity } from '../../types';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (newCase: InvestigationCase) => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onCreateCase,
}) => {
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('srv-edge-linux01');
  const [severity, setSeverity] = useState<InvestigationSeverity>('high');
  const [category, setCategory] = useState('Credential Access / Privilege Escalation');
  const [summary, setSummary] = useState('');
  const [initialHypothesis, setInitialHypothesis] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const newId = `INV-2026-00${Math.floor(Math.random() * 900 + 100)}`;
    const newCase: InvestigationCase = {
      id: newId,
      title: title.trim(),
      summary: summary.trim(),
      host: host.trim(),
      severity,
      status: 'open',
      createdAt: '2026-10-27 ' + new Date().toISOString().slice(11, 16) + ' UTC',
      updatedAt: '2026-10-27 ' + new Date().toISOString().slice(11, 16) + ' UTC',
      logCount: 1,
      suspiciousCount: 1,
      evidenceCount: 1,
      category,
      assignedTo: 'Security Response Unit',
      initialObservation: summary.trim(),
      hypotheses: [initialHypothesis.trim() || 'Attacker conducted initial telemetry probe prior to privilege escalation.'],
      keyIndicators: [host, 'status:open', `severity:${severity}`],
    };

    onCreateCase(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0A0F1D] shadow-2xl shadow-cyan-950/30 overflow-hidden text-xs relative"
      >
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="px-5 py-4 border-b border-slate-800 bg-[#0E1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Open New Forensic Dossier
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Incident Case Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unscheduled Sudo Access on Production Edge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Host Origin
              </label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assessed Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as InvestigationSeverity)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Category / Adversary Technique
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Incident Summary & Anomaly Observations
            </label>
            <textarea
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe anomalous observations from syslog or auth.log..."
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Initial Working Hypothesis
            </label>
            <input
              type="text"
              value={initialHypothesis}
              onChange={(e) => setInitialHypothesis(e.target.value)}
              placeholder="e.g. Credential stuffed from external IP targeting service account"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950 to-slate-900 hover:border-cyan-400 text-cyan-200 font-semibold transition-all shadow-sm"
            >
              Create Dossier
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
