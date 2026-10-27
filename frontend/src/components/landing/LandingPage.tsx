import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fingerprint,
  ArrowRight,
  ShieldAlert,
  Terminal,
  BrainCircuit,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Cpu,
  Layers,
  Search,
  Zap,
  Lock,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Activity,
  Award,
  Database,
  Radio,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onNavigateToPage?: (page: 'dashboard' | 'analyzer' | 'investigations' | 'evaluation' | 'reports') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDashboard,
  onNavigateToPage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'stream' | 'timeline' | 'graph' | 'dossier'>('stream');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-deep-canvas text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background light orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[400px] bg-rose-500/3 blur-[140px] pointer-events-none rounded-full" />

      {/* =========================================================================
          1. PUBLIC TOP NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 h-16 border-b border-slate-800/80 bg-[#080D18]/90 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Subtle bottom cyan hairline */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50 group">
            <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
            <Fingerprint className="w-5 h-5 text-cyan-400 relative z-10 transition-transform group-hover:scale-105" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-100">
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
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('prompt-engineering')}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Prompt Engineering
          </button>
          <button
            onClick={() => scrollToSection('trust-limitations')}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Trust & Limitations
          </button>
        </nav>

        {/* Primary Action Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchDashboard}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-800 bg-[#0B101D] px-6 py-4 space-y-3 text-xs"
          >
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-slate-300 hover:text-cyan-300"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-slate-300 hover:text-cyan-300"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('prompt-engineering')}
              className="block w-full text-left py-2 text-slate-300 hover:text-cyan-300"
            >
              Prompt Engineering
            </button>
            <button
              onClick={() => scrollToSection('trust-limitations')}
              className="block w-full text-left py-2 text-slate-300 hover:text-cyan-300"
            >
              Trust & Limitations
            </button>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onLaunchDashboard}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          2. HERO SECTION
      ========================================================================= */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headlines & Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold">Academic Prompt Engineering Project</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-400">Linux & SecOps</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-[1.15] text-balance">
              Turn Raw Logs Into Actionable Intelligence.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Investigate suspicious activity, connect evidence across system logs, and generate grounded incident reports with AI-powered analysis.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onLaunchDashboard}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Start Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:border-slate-700 transition-colors shadow-sm"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="font-mono text-cyan-400 font-bold text-sm block">RFC-5424</span>
                <span className="text-[11px] text-slate-400">Syslog Parser</span>
              </div>
              <div>
                <span className="font-mono text-teal-400 font-bold text-sm block">MITRE TTPs</span>
                <span className="text-[11px] text-slate-400">ATT&CK Mapping</span>
              </div>
              <div>
                <span className="font-mono text-rose-400 font-bold text-sm block">Zero-Spurious</span>
                <span className="text-[11px] text-slate-400">Citation Invariant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Original Interactive Workflow Simulation */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0C1222] to-[#070B14] p-5 shadow-2xl shadow-cyan-950/20 relative overflow-hidden backdrop-blur-xl">
              {/* Subtle top light strip */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              {/* Simulation Chrome Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] pl-2 border-l border-slate-800">
                    srv-edge-linux01 · Investigation Workspace
                  </span>
                </div>

                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  Interactive Preview
                </span>
              </div>

              {/* Workflow View Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 my-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveWorkflowTab('stream')}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    activeWorkflowTab === 'stream'
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Raw Ingress
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('timeline')}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    activeWorkflowTab === 'timeline'
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Timeline
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('graph')}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    activeWorkflowTab === 'graph'
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3. Evidence
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('dossier')}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    activeWorkflowTab === 'dossier'
                      ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4. Dossier
                </button>
              </div>

              {/* Tab 1: Raw Telemetry Stream */}
              {activeWorkflowTab === 'stream' && (
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] leading-relaxed">
                    <span className="text-slate-500">01 </span>
                    <span className="text-cyan-400">Oct 27 06:15:19 </span>
                    <span className="text-slate-300">sshd[14220]: </span>
                    <span className="text-rose-400">Failed password for invalid user admin from 198.51.100.44</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] leading-relaxed">
                    <span className="text-slate-500">02 </span>
                    <span className="text-cyan-400">Oct 27 06:16:11 </span>
                    <span className="text-slate-300">sshd[14280]: </span>
                    <span className="text-teal-300">Accepted publickey for deployer from 192.168.10.88</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[11px] leading-relaxed">
                    <span className="text-slate-500">03 </span>
                    <span className="text-cyan-400">Oct 27 06:17:45 </span>
                    <span className="text-slate-300">sudo[14312]: </span>
                    <span className="text-rose-400 font-semibold">deployer : user NOT in sudoers ; COMMAND=/usr/bin/cat /etc/shadow</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] leading-relaxed">
                    <span className="text-slate-500">04 </span>
                    <span className="text-cyan-400">Oct 27 06:18:02 </span>
                    <span className="text-slate-300">kernel: </span>
                    <span className="text-amber-300">apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/shadow"</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Chronological Timeline */}
              {activeWorkflowTab === 'timeline' && (
                <div className="space-y-3 py-1 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1 shrink-0 shadow-[0_0_8px_#00F2FE]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-300 font-bold text-[11px]">06:15:19 UTC</span>
                        <span className="text-[10px] text-slate-500 font-mono">T1110.001</span>
                      </div>
                      <p className="text-slate-300 text-xs">Automated SSH credential spraying from external IP 198.51.100.44</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0 shadow-[0_0_8px_#F43F5E]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-rose-400 font-bold text-[11px]">06:17:45 UTC</span>
                        <span className="text-[10px] text-slate-500 font-mono">T1548.003</span>
                      </div>
                      <p className="text-slate-300 text-xs">Privilege escalation attempt: unauthorized sudo cat /etc/shadow</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 mt-1 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-teal-300 font-bold text-[11px]">06:20:18 UTC</span>
                        <span className="text-[10px] text-slate-500 font-mono">FAIL2BAN</span>
                      </div>
                      <p className="text-slate-300 text-xs">Host containment: firewall drop rule applied for 3600 seconds</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Connected Evidence Graph */}
              {activeWorkflowTab === 'graph' && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Correlated Entities</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                      IP: 198.51.100.44
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300">
                      Target: /etc/shadow
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-teal-950/70 border border-teal-500/40 text-teal-300">
                      User: deployer
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                      Session #42
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300">
                      AppArmor: Denied
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono">
                    Grounding Invariant: 4 citations verified across syslog RFC 5424
                  </div>
                </div>
              )}

              {/* Tab 4: Formulated Dossier */}
              {activeWorkflowTab === 'dossier' && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-300 font-bold">INV-2026-0042</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800">
                      CRITICAL
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-100">
                    Multi-Vector SSH Spraying & Sudo Privilege Escalation Attempt
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Attacker identified exposed port 22, executed dictionary probes, and attempted to read shadow credentials before being contained by AppArmor.
                  </p>
                </div>
              )}

              {/* Bottom Interactive Link */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Dataset: <span className="text-cyan-300 font-mono">Linux auth & web telemetry</span></span>
                <button
                  onClick={onLaunchDashboard}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Full Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURE SECTION
      ========================================================================= */}
      <section id="features" className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Built for Systematic Forensic Investigation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Eliminate alert fatigue and hallucinated root causes with structured prompt architectures tailored for Linux telemetric workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-xl shadow-black/20 hover:border-cyan-500/40 transition-all group">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 w-fit mb-4 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Intelligent Log Analysis
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect and categorize Linux and application logs across syslog, auth.log, systemd journald, and web proxy streams. Normalize messages according to standard RFC-5424 severity tiers with instantaneous regex and indicator filtering.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-xl shadow-black/20 hover:border-cyan-500/40 transition-all group">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <div className="p-3 rounded-xl bg-teal-950/70 border border-teal-800/60 text-teal-400 w-fit mb-4 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Evidence-Grounded Investigation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect findings to actual log entries and retrieved documentation. Maintain an immutable forensic chain of custody where every flagged indicator references verified line numbers, daemons, and exact UTC timestamps.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-xl shadow-black/20 hover:border-cyan-500/40 transition-all group">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 w-fit mb-4 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Root Cause Exploration
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Distinguish observed facts from possible explanations. Construct structured hypothesis trees (H₁, H₂, H₃) that guide analysts through systematic elimination of benign failure modes before concluding malicious intent.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-xl shadow-black/20 hover:border-cyan-500/40 transition-all group">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
            <div className="p-3 rounded-xl bg-fuchsia-950/70 border border-fuchsia-800/60 text-fuchsia-400 w-fit mb-4 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              Prompt Evaluation Lab
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare prompt versions and measure their performance. Benchmark Chain-of-Thought versus Few-Shot and Zero-Shot baselines, quantifying reasoning accuracy, token consumption, and hallucination suppression.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS
      ========================================================================= */}
      <section id="how-it-works" className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-400 uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Investigation Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            How LogSleuth AI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            A transparent 4-stage pipeline translating unstructured server dumps into verified, compliant incident documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/50">
                  STEP 01
                </span>
                <UploadCloud className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1.5">
                Upload Logs
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingest telemetry via the visible drag-and-drop workspace supporting .log, .txt, .json, .csv, and .jsonl files, or start with pre-packaged reference logs.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/60 text-[11px] font-mono text-cyan-400">
              Multi-file Ingestion
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-950 border border-teal-800/50">
                  STEP 02
                </span>
                <Terminal className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1.5">
                Parse Events
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RFC-5424 normalization isolates process identifiers, timestamps, priority tiers, and high-frequency anomaly bursts without sending raw credentials off-premises.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/60 text-[11px] font-mono text-teal-400">
              Deterministic Normalization
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-fuchsia-400 px-2 py-0.5 rounded bg-fuchsia-950 border border-fuchsia-800/50">
                  STEP 03
                </span>
                <BrainCircuit className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1.5">
                Investigate With AI
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute structured prompt workflows that trace MITRE ATT&CK techniques, evaluate working hypotheses, and isolate true incidents from dev noise.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/60 text-[11px] font-mono text-fuchsia-400">
              Chain-of-Thought Triage
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/50">
                  STEP 04
                </span>
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-1.5">
                Evidence-Based Report
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate official post-mortem dossiers compliant with NIST SP 800-61 Rev 2, complete with chronology tables, mitigation checklists, and JSON/MD export.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/60 text-[11px] font-mono text-emerald-400">
              NIST SP 800-61 Rev 2
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PROMPT ENGINEERING SECTION
      ========================================================================= */}
      <section id="prompt-engineering" className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Research Framework</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Prompt Engineering for High-Stakes Cybersecurity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              As an academic research project, LogSleuth AI systematically investigates how prompt design affects model reliability, reasoning fidelity, and hallucination resistance in system telemetry analysis.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-slate-200 block">Methodological Evaluation Note</span>
              <p className="text-[11px] leading-relaxed">
                Rather than presuming model accuracy, the platform provides a rigorous benchmark framework to evaluate candidate prompts against controlled ground-truth datasets, tracking precision, false-positive rates, and invariant citations.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tech 1 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold text-[11px]">ROLE / PERSONA</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <h4 className="font-bold text-slate-100">Role/Persona Prompting</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Defines explicit behavioral boundaries for senior forensic investigators, enforcing strict epistemic honesty where unknown root causes are formally stated rather than fabricated.
              </p>
            </div>

            {/* Tech 2 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-teal-300 font-bold text-[11px]">RETRIEVAL (RAG)</span>
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              <h4 className="font-bold text-slate-100">Retrieval-Augmented Generation</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Grounds diagnostic inference against Linux man pages, RFC specifications, and MITRE ATT&CK technique databases to contextualize cryptic error codes.
              </p>
            </div>

            {/* Tech 3 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-300 font-bold text-[11px]">REACT REASONING</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <h4 className="font-bold text-slate-100">Controlled ReAct Investigation</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Structures model execution into transparent Thought → Action → Observation loops, ensuring every step in a diagnosis is verifiable and falsifiable.
              </p>
            </div>

            {/* Tech 4 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-fuchsia-300 font-bold text-[11px]">BENCHMARK LAB</span>
                <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              </div>
              <h4 className="font-bold text-slate-100">Baseline-vs-Improved Evaluation</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Evaluates prompt candidates side-by-side with Zero-Shot baselines, providing measurable comparisons of token overhead and hallucination frequency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. TRUST AND LIMITATIONS
      ========================================================================= */}
      <section id="trust-limitations" className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0A0F1D] to-[#070B14] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Trust, Verification & Responsible AI</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              An Investigative Assistant, Not An Autonomous System.
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Security investigations require rigorous epistemic discipline. LogSleuth AI is designed as a powerful <strong>investigative assistant for human analysts</strong>, not an autonomous incident containment agent.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <span className="font-semibold text-slate-200 block">Evidence Grounding</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    All formulated hypotheses are strictly anchored to visible log lines. The system will not assert facts absent from supplied telemetry.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <span className="font-semibold text-slate-200 block">Root Cause Uncertainty</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    When logs are incomplete or ambiguous, the model is instructed to present uncertainty intervals rather than fabricated explanations.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <span className="font-semibold text-slate-200 block">Human Expert Review</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Generated remediation checklists and incident reports serve as advisory drafts requiring review by qualified SecOps personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CALL TO ACTION
      ========================================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to Investigate Telemetry With Grounded AI?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            Launch the interactive operations dashboard, inspect real Linux syslog benchmarks, or upload your own system log streams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onLaunchDashboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
      ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-[#080D18] py-12 px-4 md:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-300 text-sm">LogSleuth AI</span>
              <p className="text-[11px] text-slate-500">
                Academic Prompt Engineering & Incident Investigation Research
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-cyan-300 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-cyan-300 transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('prompt-engineering')} className="hover:text-cyan-300 transition-colors">
              Prompt Engineering
            </button>
            <button onClick={() => scrollToSection('trust-limitations')} className="hover:text-cyan-300 transition-colors">
              Trust & Ethics
            </button>
            <button onClick={onLaunchDashboard} className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Dashboard
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Lead Researcher: S. Hari · October 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
