import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, CheckCircle2, ShieldCheck, X, AlertTriangle } from 'lucide-react';

interface ScanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STAGES = [
  { label: 'Normalizing RFC-5424 Syslog Headers & Hostnames', detail: 'Parsing PID, daemons, and microsecond timestamps' },
  { label: 'Isolating High-Frequency Anomaly Windows', detail: 'Scanning authentication failures and 4xx status spikes' },
  { label: 'Mapping MITRE ATT&CK TTPs & Sub-techniques', detail: 'Evaluating T1110.001 (Brute Force) & T1548.003 (Sudo Abuse)' },
  { label: 'Synthesizing Evidence Citations & Invariants', detail: 'Verifying zero-hallucination line-number references' },
];

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        const next = prev + 3;
        if (next > 75) setCurrentStep(3);
        else if (next > 50) setCurrentStep(2);
        else if (next > 25) setCurrentStep(1);
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0A0F1D] shadow-2xl shadow-cyan-950/40 overflow-hidden text-xs relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Executing Heuristic Diagnostic Pipeline
              </h3>
              <p className="text-[11px] text-slate-400">
                Evaluating ingested Linux telemetry stream
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Body */}
        <div className="p-6 space-y-5">
          {/* Progress Bar with Cyan Glow */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-cyan-400 font-semibold tracking-wider">
                ANALYSIS PROGRESS
              </span>
              <span className="font-mono font-bold text-slate-200 tabular-nums">
                {progress}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-[1px]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Sequential Stage Indicators */}
          <div className="space-y-3">
            {STAGES.map((st, index) => {
              const isDone = currentStep > index || progress === 100;
              const isCurrent = currentStep === index && progress < 100;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                    isCurrent
                      ? 'border-cyan-500/40 bg-cyan-950/20'
                      : isDone
                      ? 'border-slate-800/80 bg-slate-900/40'
                      : 'border-transparent opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
                      </span>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${isCurrent ? 'text-cyan-200' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                      {st.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {st.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Invariants: Zero synthetic AI conclusions</span>
          <span className="font-mono text-cyan-400">Heuristic Engine Active</span>
        </div>
      </motion.div>
    </div>
  );
};
