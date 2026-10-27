import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { IncidentReport, InvestigationCase } from '../../types';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: InvestigationCase[];
  onCreateReport: (newReport: IncidentReport) => void;
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  cases,
  onCreateReport,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id || 'INV-2026-0042');
  const [framework, setFramework] = useState<'NIST SP 800-61 Rev 2' | 'SRE Root Cause Analysis (RCA)' | 'Executive Briefing'>('NIST SP 800-61 Rev 2');
  const [author, setAuthor] = useState('LogSleuth AI Academic Incident Lead');
  const [impactLevel, setImpactLevel] = useState<'High' | 'Moderate' | 'Low'>('Moderate');

  if (!isOpen) return null;

  const targetCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `REP-2026-0${Math.floor(Math.random() * 90 + 10)}`;
    const newReport: IncidentReport = {
      id: newId,
      caseId: selectedCaseId,
      title: `${framework}: ${targetCase ? targetCase.title : 'Incident Brief'}`,
      framework,
      createdAt: '2026-10-27 ' + new Date().toISOString().slice(11, 16) + ' UTC',
      author,
      impactLevel,
      targetSystems: targetCase ? [targetCase.host, 'Linux Daemon Telemetry'] : ['Linux srv-edge-linux01'],
      timeline: [
        { time: '06:14:02 UTC', event: 'Daemon initial initialization logged' },
        { time: '06:15:19 UTC', event: 'First suspicious anomaly pattern identified' },
        { time: '06:17:45 UTC', event: 'Policy enforcement containment trigger applied' },
      ],
      rootCauseHypothesis: targetCase
        ? `${targetCase.summary} Preliminary hypothesis: ${targetCase.hypotheses[0] || 'Unknown vector'}.`
        : 'Telemetry indicates credential probing followed by privilege escalation halt.',
      mitigationSteps: [
        'Enforce multi-factor verification on all shell gateway services.',
        'Review pam.d configurations and deny non-privileged sudoers command execution.',
        'Increase log retention period for forensic telemetry.',
      ],
      evidenceSummary: `Grounding verified across ${targetCase?.evidenceCount || 4} correlated syslog lines. No ungrounded conclusions introduced.`,
    };

    onCreateReport(newReport);
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
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              Generate Incident Brief & Forensic Report
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
              Select Correlated Investigation Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title.slice(0, 48)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Compliance Standard / Framework
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="NIST SP 800-61 Rev 2">NIST SP 800-61 Rev 2 (Computer Security Incident Handling)</option>
              <option value="SRE Root Cause Analysis (RCA)">SRE Root Cause Analysis (Post-Mortem & Timeline)</option>
              <option value="Executive Briefing">Executive Cybersecurity Briefing (High-Level Summary)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assessed Impact
              </label>
              <select
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
              >
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Forensic Analyst
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
              />
            </div>
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
              Generate Report
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
