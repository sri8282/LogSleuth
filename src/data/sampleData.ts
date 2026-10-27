import { LogEntry, InvestigationCase, PromptBenchmark, IncidentReport, SeverityStats } from '../types';

export const SAMPLE_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    lineNumber: 1,
    timestamp: '2026-10-27T06:14:02.112Z',
    hostname: 'srv-edge-linux01',
    service: 'sshd',
    pid: 14201,
    level: 'info',
    message: 'Server listening on 0.0.0.0 port 22.',
    raw: 'Oct 27 06:14:02 srv-edge-linux01 sshd[14201]: Server listening on 0.0.0.0 port 22.',
  },
  {
    id: 'log-002',
    lineNumber: 2,
    timestamp: '2026-10-27T06:15:19.450Z',
    hostname: 'srv-edge-linux01',
    service: 'sshd',
    pid: 14220,
    level: 'warning',
    message: 'Failed password for invalid user admin from 198.51.100.44 port 49152 ssh2',
    raw: 'Oct 27 06:15:19 srv-edge-linux01 sshd[14220]: Failed password for invalid user admin from 198.51.100.44 port 49152 ssh2',
    isSuspicious: true,
    suspicionReason: 'Authentication failure on non-existent account from external untrusted IP.',
    indicators: ['T1110.001 - Password Guessing', 'IP:198.51.100.44'],
  },
  {
    id: 'log-003',
    lineNumber: 3,
    timestamp: '2026-10-27T06:15:22.091Z',
    hostname: 'srv-edge-linux01',
    service: 'sshd',
    pid: 14223,
    level: 'warning',
    message: 'Failed password for invalid user oracle from 198.51.100.44 port 49158 ssh2',
    raw: 'Oct 27 06:15:22 srv-edge-linux01 sshd[14223]: Failed password for invalid user oracle from 198.51.100.44 port 49158 ssh2',
    isSuspicious: true,
    suspicionReason: 'Rapid credential spraying detected (< 3s interval).',
    indicators: ['T1110.003 - Password Spraying', 'IP:198.51.100.44'],
  },
  {
    id: 'log-004',
    lineNumber: 4,
    timestamp: '2026-10-27T06:15:25.882Z',
    hostname: 'srv-edge-linux01',
    service: 'sshd',
    pid: 14228,
    level: 'warning',
    message: 'Failed password for invalid user test from 198.51.100.44 port 49164 ssh2',
    raw: 'Oct 27 06:15:25 srv-edge-linux01 sshd[14228]: Failed password for invalid user test from 198.51.100.44 port 49164 ssh2',
    isSuspicious: true,
    suspicionReason: 'High frequency brute-force threshold exceeded.',
    indicators: ['T1110.001 - Brute Force', 'IP:198.51.100.44'],
  },
  {
    id: 'log-005',
    lineNumber: 5,
    timestamp: '2026-10-27T06:16:11.319Z',
    hostname: 'srv-edge-linux01',
    service: 'sshd',
    pid: 14280,
    level: 'notice',
    message: 'Accepted publickey for deployer from 192.168.10.88 port 51230 ssh2: RSA SHA256:d8a9...b1e2',
    raw: 'Oct 27 06:16:11 srv-edge-linux01 sshd[14280]: Accepted publickey for deployer from 192.168.10.88 port 51230 ssh2: RSA SHA256:d8a9...b1e2',
  },
  {
    id: 'log-006',
    lineNumber: 6,
    timestamp: '2026-10-27T06:16:12.004Z',
    hostname: 'srv-edge-linux01',
    service: 'systemd-logind',
    pid: 890,
    level: 'info',
    message: 'New session 42 of user deployer.',
    raw: 'Oct 27 06:16:12 srv-edge-linux01 systemd-logind[890]: New session 42 of user deployer.',
  },
  {
    id: 'log-007',
    lineNumber: 7,
    timestamp: '2026-10-27T06:17:45.610Z',
    hostname: 'srv-edge-linux01',
    service: 'sudo',
    pid: 14312,
    level: 'critical',
    message: 'deployer : user NOT in sudoers ; TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow',
    raw: 'Oct 27 06:17:45 srv-edge-linux01 sudo[14312]: deployer : user NOT in sudoers ; TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow',
    isSuspicious: true,
    suspicionReason: 'Unauthorized privilege escalation attempt targeting credential file /etc/shadow.',
    indicators: ['T1548.003 - Sudo Abuse', 'T1003.008 - Shadow File Read', 'Host:srv-edge-linux01'],
  },
  {
    id: 'log-008',
    lineNumber: 8,
    timestamp: '2026-10-27T06:18:02.190Z',
    hostname: 'srv-edge-linux01',
    service: 'kernel',
    pid: undefined,
    level: 'error',
    message: 'audit: type=1400 audit(1793110682.190:82): apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/shadow" pid=14330 comm="curl" requested_mask="r" denied_mask="r" fsuid=1001',
    raw: 'Oct 27 06:18:02 srv-edge-linux01 kernel: audit: type=1400 audit(1793110682.190:82): apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/shadow" pid=14330 comm="curl" requested_mask="r" denied_mask="r" fsuid=1001',
    isSuspicious: true,
    suspicionReason: 'AppArmor mandatory access denial: process attempted unauthorized read of shadow credentials.',
    indicators: ['T1068 - Exploitation for Privilege Escalation', 'AppArmor-Denied'],
  },
  {
    id: 'log-009',
    lineNumber: 9,
    timestamp: '2026-10-27T06:20:14.502Z',
    hostname: 'srv-edge-linux01',
    service: 'nginx',
    pid: 14450,
    level: 'warning',
    message: '198.51.100.44 - - "GET /../../../../etc/passwd HTTP/1.1" 403 162 "-" "sqlmap/1.7#stable"',
    raw: 'Oct 27 06:20:14 srv-edge-linux01 nginx: 198.51.100.44 - - [27/Oct/2026:06:20:14 +0000] "GET /../../../../etc/passwd HTTP/1.1" 403 162 "-" "sqlmap/1.7#stable"',
    isSuspicious: true,
    suspicionReason: 'Path traversal pattern and automated security scanner user-agent detected.',
    indicators: ['T1190 - Exploit Public-Facing Application', 'Tool:sqlmap', 'Path-Traversal'],
  },
  {
    id: 'log-010',
    lineNumber: 10,
    timestamp: '2026-10-27T06:20:18.991Z',
    hostname: 'srv-edge-linux01',
    service: 'fail2ban.actions',
    pid: 774,
    level: 'notice',
    message: '[sshd] Ban 198.51.100.44 for 3600 seconds',
    raw: 'Oct 27 06:20:18 srv-edge-linux01 fail2ban.actions[774]: NOTICE [sshd] Ban 198.51.100.44',
  },
  {
    id: 'log-011',
    lineNumber: 11,
    timestamp: '2026-10-27T06:25:30.120Z',
    hostname: 'srv-edge-linux01',
    service: 'systemd',
    pid: 1,
    level: 'info',
    message: 'Started Daily apt download activities.',
    raw: 'Oct 27 06:25:30 srv-edge-linux01 systemd[1]: Started Daily apt download activities.',
  },
  {
    id: 'log-012',
    lineNumber: 12,
    timestamp: '2026-10-27T06:31:05.419Z',
    hostname: 'srv-edge-linux01',
    service: 'kernel',
    pid: undefined,
    level: 'error',
    message: 'Out of memory: Killed process 14510 (worker_pool) total-vm:4194304kB, anon-rss:3670016kB',
    raw: 'Oct 27 06:31:05 srv-edge-linux01 kernel: [ 4812.910281] Out of memory: Killed process 14510 (worker_pool) total-vm:4194304kB, anon-rss:3670016kB',
    isSuspicious: false,
    suspicionReason: 'System memory exhaustion; kernel OOM killer triggered on batch worker.',
  },
];

export const DEMO_SEVERITY_STATS: SeverityStats = {
  total: 1284,
  info: 842,
  notice: 284,
  warning: 112,
  error: 38,
  critical: 8,
  suspicious: 14,
};

export const EMPTY_SEVERITY_STATS: SeverityStats = {
  total: 0,
  info: 0,
  notice: 0,
  warning: 0,
  error: 0,
  critical: 0,
  suspicious: 0,
};

export const SAMPLE_INVESTIGATIONS: InvestigationCase[] = [
  {
    id: 'INV-2026-0042',
    title: 'Multi-Vector SSH Spraying & Sudo Privilege Escalation Attempt',
    summary: 'External IP 198.51.100.44 executed automated SSH credential stuffing, followed by an unauthorized sudo /etc/shadow attempt from local session 42.',
    host: 'srv-edge-linux01',
    severity: 'critical',
    status: 'investigating',
    createdAt: '2026-10-27 06:18 UTC',
    updatedAt: '2026-10-27 07:45 UTC',
    logCount: 1284,
    suspiciousCount: 14,
    evidenceCount: 6,
    category: 'Credential Access / Privilege Escalation',
    assignedTo: 'Security Response Team',
    initialObservation: 'Failed login spikes triggered fail2ban ban rule; concurrent sudoers denial recorded for user deployer.',
    hypotheses: [
      'Attacker obtained valid SSH private key for user deployer after automated spray attempts failed.',
      'Deployer account was compromised or misconfigured with excessive shell permissions.',
      'AppArmor policy successfully blocked file access to /etc/shadow, preventing immediate hash exfiltration.',
    ],
    keyIndicators: ['198.51.100.44', 'user:deployer', 'target:/etc/shadow', 'command:cat', 'MITRE:T1548.003'],
  },
  {
    id: 'INV-2026-0041',
    title: 'Nginx Directory Traversal & Automated Scanner Probes',
    summary: 'Series of URL-encoded path traversal attacks (/../../../../etc/passwd) flagged by web proxy filtering.',
    host: 'srv-web-gateway02',
    severity: 'high',
    status: 'open',
    createdAt: '2026-10-27 04:30 UTC',
    updatedAt: '2026-10-27 05:10 UTC',
    logCount: 520,
    suspiciousCount: 8,
    evidenceCount: 3,
    category: 'Initial Access / Reconnaissance',
    assignedTo: 'SecOps Tier 1',
    initialObservation: 'sqlmap and nikto signatures matched in reverse proxy access logs with HTTP 403 responses.',
    hypotheses: [
      'Broad automated vulnerability scanning with no successful origin compromise.',
      'WAF rules properly dropped malicious payloads prior to upstream microservices.',
    ],
    keyIndicators: ['User-Agent:sqlmap', 'Path:etc/passwd', 'Status:403'],
  },
  {
    id: 'INV-2026-0038',
    title: 'Kernel Out-Of-Memory Killer Cascade on Worker Nodes',
    summary: 'Batch telemetry processor exceeded cgroup allocation limits, triggering SIGKILL on core worker tasks.',
    host: 'srv-compute-node-b',
    severity: 'medium',
    status: 'resolved',
    createdAt: '2026-10-26 19:15 UTC',
    updatedAt: '2026-10-26 21:00 UTC',
    logCount: 3120,
    suspiciousCount: 0,
    evidenceCount: 4,
    category: 'System Reliability / Denial of Service',
    assignedTo: 'SRE Infrastructure',
    initialObservation: 'Systemd service worker_pool.service terminated unexpectedly with exit-code 137.',
    hypotheses: [
      'Memory leak in log parser batch queue under elevated load spike.',
      'Cgroup memory.max set too low for unbuffered stream ingest.',
    ],
    keyIndicators: ['oom-killer', 'anon-rss:3670016kB', 'exit-code:137'],
  },
];

export const SAMPLE_PROMPT_BENCHMARKS: PromptBenchmark[] = [
  {
    id: 'bench-001',
    name: 'CoT-RootCause: Chain-of-Thought Syslog Reasoner',
    technique: 'Chain-of-Thought (CoT)',
    targetDomain: 'Linux Syslog & Systemd Journald',
    systemPromptSummary: 'Guides the model through an explicit step-by-step diagnostic reasoning chain: (1) Time synchronisation, (2) Process hierarchy, (3) Anomaly isolation, (4) MITRE ATT&CK mapping, (5) Evidence verification.',
    reasoningSteps: [
      'Parse timestamp delta and identify burst windows',
      'Filter out scheduled cron jobs and known daemon heartbeats',
      'Correlate authentication failures with subsequent privileged commands',
      'Extract explicit file paths, users, IP addresses, and syscall exit codes',
      'Formulate falsifiable root cause hypotheses with log line citations',
    ],
    intendedOutcome: 'High precision on complex multi-stage attacks; low false positive rate on noisy dev systems.',
    evalMetrics: {
      rootCausePrecision: '94.2%',
      hallucinationRate: '1.4%',
      averageTokens: '482 tokens/query',
      evidenceRecall: '96.8%',
    },
    samplePromptSnippet: `You are LogSleuth AI, an expert Linux security engineer. Analyze the attached logs step-by-step:
1. State the observed anomaly with exact line numbers.
2. Trace the originating PID and execution context.
3. Eliminate benign failure modes (e.g., misconfigured SSH keys, network timeouts).
4. Identify suspicious intent citing MITRE ATT&CK techniques.
5. Provide a deterministic conclusion. Do not speculate beyond evidence provided in the logs.`,
    status: 'benchmark_gold',
  },
  {
    id: 'bench-002',
    name: 'FewShot-AuthParser: Linux Auth & PAM Exemplar',
    technique: 'Few-Shot Exemplars',
    targetDomain: 'auth.log / secure / auditd',
    systemPromptSummary: 'Supplies 3 paired input-output exemplars of common Linux auth patterns (failed ssh brute-force, legitimate sudo, unauthorized su) with strict JSON output schemas.',
    reasoningSteps: [
      'Pattern match log against established auth schemas',
      'Map auth outcome (SUCCESS / FAILURE / DENIED)',
      'Emit structured evidence JSON without conversational narrative',
    ],
    intendedOutcome: 'High-speed ingestion and structured parsing with strict schema compliance.',
    evalMetrics: {
      rootCausePrecision: '88.6%',
      hallucinationRate: '0.8%',
      averageTokens: '215 tokens/query',
      evidenceRecall: '91.0%',
    },
    samplePromptSnippet: `### EXAMPLE 1
Input: "sshd[1200]: Failed password for invalid user admin from 10.0.0.1"
Output: {"event":"AUTH_FAIL","user":"admin","source_ip":"10.0.0.1","risk":"MEDIUM"}

### YOUR TASK
Given the following auth log slice, parse all entries using this exact JSON format.`,
    status: 'active_experiment',
  },
  {
    id: 'bench-003',
    name: 'ZeroShot-Baseline: Raw Incident Triage',
    technique: 'Zero-Shot Baseline',
    targetDomain: 'General Unstructured Logs',
    systemPromptSummary: 'Baseline unguided prompt asking the model to find errors and suggest what went wrong without prompt engineering guardrails or few-shot examples.',
    reasoningSteps: [
      'Direct inference without step-by-step instruction',
      'Ad-hoc summary of noticeable errors',
    ],
    intendedOutcome: 'Baseline measurement against which prompt-engineered methods are evaluated.',
    evalMetrics: {
      rootCausePrecision: '62.4%',
      hallucinationRate: '11.8%',
      averageTokens: '680 tokens/query',
      evidenceRecall: '68.5%',
    },
    samplePromptSnippet: `Review these logs and tell me if anything is broken or hacked, and what should be fixed.`,
    status: 'baseline',
  },
];

export const SAMPLE_REPORTS: IncidentReport[] = [
  {
    id: 'REP-2026-088',
    caseId: 'INV-2026-0042',
    title: 'Evidence-Based Incident Brief: SSH Spraying & Privilege Escalation Attempt',
    framework: 'NIST SP 800-61 Rev 2',
    createdAt: '2026-10-27 08:00 UTC',
    author: 'LogSleuth AI Academic Benchmark Engine',
    impactLevel: 'Moderate',
    targetSystems: ['srv-edge-linux01 (192.168.1.100)', 'OpenSSH 8.9p1', 'Linux 6.1.0'],
    timeline: [
      { time: '06:14:02 UTC', event: 'sshd daemon reloaded on port 22', evidenceLogId: 'log-001' },
      { time: '06:15:19 UTC', event: 'First invalid user login probe (admin) from 198.51.100.44', evidenceLogId: 'log-002' },
      { time: '06:15:25 UTC', event: 'Multi-account spray threshold reached; 3 failures in 6 seconds', evidenceLogId: 'log-004' },
      { time: '06:16:11 UTC', event: 'Legitimate or compromised publickey authentication accepted for user deployer', evidenceLogId: 'log-005' },
      { time: '06:17:45 UTC', event: 'Unauthorized attempt to inspect /etc/shadow via sudo rejected', evidenceLogId: 'log-007' },
      { time: '06:18:02 UTC', event: 'AppArmor enforcement profile trapped and denied auxiliary read on /etc/shadow', evidenceLogId: 'log-008' },
      { time: '06:20:18 UTC', event: 'Fail2ban firewall rule applied against 198.51.100.44 for 3600s', evidenceLogId: 'log-010' },
    ],
    rootCauseHypothesis: 'External scanning identified exposed SSH port. An attacker attempted dictionary attacks on default accounts before or concurrently with accessing the pre-existing deployer credential. Privilege escalation was halted by sudo policy and AppArmor containment.',
    mitigationSteps: [
      'Rotate deployer SSH public key and verify authorized_keys integrity across all edge hosts.',
      'Enforce IP allowlisting for SSH gateway port 22 via iptables / ufw.',
      'Audit /etc/sudoers and pam configuration for unexpected wildcards.',
      'Increase fail2ban maxretry penalty duration from 3600s to 86400s for repeated attackers.',
    ],
    evidenceSummary: 'Derived from 12 contiguous log records on srv-edge-linux01. Audit verification confirms no modifications to /etc/shadow or /etc/passwd took place.',
  },
];

export const RAW_SAMPLE_LOG_TEXT = `Oct 27 06:14:02 srv-edge-linux01 sshd[14201]: Server listening on 0.0.0.0 port 22.
Oct 27 06:15:19 srv-edge-linux01 sshd[14220]: Failed password for invalid user admin from 198.51.100.44 port 49152 ssh2
Oct 27 06:15:22 srv-edge-linux01 sshd[14223]: Failed password for invalid user oracle from 198.51.100.44 port 49158 ssh2
Oct 27 06:15:25 srv-edge-linux01 sshd[14228]: Failed password for invalid user test from 198.51.100.44 port 49164 ssh2
Oct 27 06:16:11 srv-edge-linux01 sshd[14280]: Accepted publickey for deployer from 192.168.10.88 port 51230 ssh2: RSA SHA256:d8a9...b1e2
Oct 27 06:16:12 srv-edge-linux01 systemd-logind[890]: New session 42 of user deployer.
Oct 27 06:17:45 srv-edge-linux01 sudo[14312]: deployer : user NOT in sudoers ; TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
Oct 27 06:18:02 srv-edge-linux01 kernel: audit: type=1400 audit(1793110682.190:82): apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/shadow" pid=14330 comm="curl" requested_mask="r" denied_mask="r" fsuid=1001
Oct 27 06:20:14 srv-edge-linux01 nginx: 198.51.100.44 - - [27/Oct/2026:06:20:14 +0000] "GET /../../../../etc/passwd HTTP/1.1" 403 162 "-" "sqlmap/1.7#stable"
Oct 27 06:20:18 srv-edge-linux01 fail2ban.actions[774]: NOTICE [sshd] Ban 198.51.100.44
Oct 27 06:25:30 srv-edge-linux01 systemd[1]: Started Daily apt download activities.
Oct 27 06:31:05 srv-edge-linux01 kernel: [ 4812.910281] Out of memory: Killed process 14510 (worker_pool) total-vm:4194304kB, anon-rss:3670016kB`;
