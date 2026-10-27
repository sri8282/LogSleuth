import React, { useState } from 'react';
import { PromptBenchmark } from '../../types';
import {
  BrainCircuit,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';

interface PromptEvaluationViewProps {
  benchmarks: PromptBenchmark[];
}

export const PromptEvaluationView: React.FC<PromptEvaluationViewProps> = ({ benchmarks }) => {
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>(benchmarks[0]?.id || '');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<boolean>(true);

  const activeBenchmark = benchmarks.find((b) => b.id === selectedBenchmarkId) || benchmarks[0];

  const handleCopyPrompt = () => {
    if (activeBenchmark) {
      navigator.clipboard.writeText(activeBenchmark.samplePromptSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span>Academic Prompt Engineering Laboratory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical comparative benchmark evaluating Chain-of-Thought, Few-Shot, and Zero-Shot architectures for Linux root cause isolation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Research Objective:</span>
          <span className="font-mono text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
            Hallucination Elimination ≤ 2.0%
          </span>
        </div>
      </div>

      {/* Benchmark Strategy Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benchmarks.map((bench) => {
          const isSelected = bench.id === activeBenchmark?.id;

          return (
            <div
              key={bench.id}
              onClick={() => setSelectedBenchmarkId(bench.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs flex flex-col justify-between relative overflow-hidden shadow-lg shadow-black/30 ${
                isSelected
                  ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-slate-900/90'
                  : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-850/60 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_8px_#00F2FE]" />
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                    {bench.technique}
                  </span>
                  {bench.status === 'benchmark_gold' && (
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                      Gold Standard
                    </span>
                  )}
                  {bench.status === 'baseline' && (
                    <span className="text-[10px] text-slate-400 font-mono">Control Baseline</span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-sm leading-snug">
                  {bench.name}
                </h3>

                <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {bench.systemPromptSummary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block font-mono">Precision</span>
                  <span className="font-mono tabular-nums font-bold text-cyan-300">
                    {bench.evalMetrics.rootCausePrecision}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono">Hallucination Rate</span>
                  <span className="font-mono tabular-nums font-bold text-rose-400">
                    {bench.evalMetrics.hallucinationRate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Prompt Benchmarking Metrics Chart */}
      <div className="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md shadow-xl shadow-black/30 relative">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Comparative Benchmark Metrics Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            N=120 Linux Intrusion Datasets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {benchmarks.map((b) => {
            const isGold = b.status === 'benchmark_gold';
            const precisionVal = parseFloat(b.evalMetrics.rootCausePrecision);
            const hallucinationVal = parseFloat(b.evalMetrics.hallucinationRate);

            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border ${
                  isGold
                    ? 'border-cyan-500/30 bg-cyan-950/15'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-200 truncate">
                    {b.technique}
                  </span>
                  {isGold && (
                    <span className="text-[10px] text-cyan-400 font-mono">Active Model</span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* RCA Precision Meter */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-slate-400">RCA Precision</span>
                      <span className="text-cyan-300 font-bold">{b.evalMetrics.rootCausePrecision}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400"
                        style={{ width: `${precisionVal}%` }}
                      />
                    </div>
                  </div>

                  {/* Hallucination Resistance Meter */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-slate-400">Hallucination Risk</span>
                      <span className="text-rose-400 font-bold">{b.evalMetrics.hallucinationRate}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${Math.min(100, hallucinationVal * 6)}%` }}
                      />
                    </div>
                  </div>

                  {/* Token efficiency */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Efficiency:</span>
                    <span className="text-slate-300">{b.evalMetrics.averageTokens}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Benchmark Strategy Deconstruction Split */}
      {activeBenchmark && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Technique Mechanism & Step Protocol (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-950/80 backdrop-blur-md space-y-4 text-xs shadow-xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                    STRATEGY PROTOCOL
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                    {activeBenchmark.name}
                  </h3>
                </div>
                <span className="text-slate-400 text-xs font-mono">
                  {activeBenchmark.targetDomain}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Core Engineering Formulation
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {activeBenchmark.systemPromptSummary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Cognitive Step-by-Step Reasoning Protocol
                </h4>
                <div className="space-y-2">
                  {activeBenchmark.reasoningSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3"
                    >
                      <span className="font-mono text-cyan-400 font-bold text-[11px] shrink-0 mt-0.5">
                        Step {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Template Definition Viewer (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-slate-800/80 bg-[#070B14] overflow-hidden text-xs shadow-xl shadow-black/40">
              <div className="px-4 py-3 border-b border-slate-800 bg-[#0A0E1A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-200 text-xs">
                    System Prompt Template Definition
                  </span>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-[#070B14] font-mono text-xs text-cyan-300/90 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[460px]">
                {activeBenchmark.samplePromptSnippet}
              </div>

              <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Guardrail: Grounding line-citations only</span>
                <span className="text-emerald-400 font-semibold">Zero-Hallucination Invariant</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
