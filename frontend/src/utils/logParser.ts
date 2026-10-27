import { LogEntry, LogLevel, SeverityStats } from '../types';

export function parseRawLogLines(
  rawText: string,
  defaultHost: string = 'srv-edge-linux01'
): {
  logs: LogEntry[];
  stats: SeverityStats;
} {
  if (!rawText || !rawText.trim()) {
    return {
      logs: [],
      stats: { total: 0, info: 0, notice: 0, warning: 0, error: 0, critical: 0, suspicious: 0 },
    };
  }

  let lines: string[] = [];

  // Check if entire text is a JSON array
  const trimmedText = rawText.trim();
  if (trimmedText.startsWith('[') && trimmedText.endsWith(']')) {
    try {
      const parsedArray = JSON.parse(trimmedText);
      if (Array.isArray(parsedArray)) {
        lines = parsedArray.map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const time = item.timestamp || item.time || item['@timestamp'] || new Date().toISOString();
            const host = item.hostname || item.host || defaultHost;
            const svc = item.service || item.daemon || item.app || 'app';
            const msg = item.message || item.msg || item.log || JSON.stringify(item);
            const lvl = item.level || item.severity || 'info';
            return `${time} ${host} ${svc}: [${lvl}] ${msg}`;
          }
          return String(item);
        });
      }
    } catch {
      // Fallback to line split if JSON parse fails
      lines = rawText.split('\n');
    }
  }

  // If not JSON array, parse line by line (could be JSONL, CSV, or standard log)
  if (lines.length === 0) {
    const rawLines = rawText.split('\n');
    lines = rawLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Check if line is JSONL
        if (line.startsWith('{') && line.endsWith('}')) {
          try {
            const obj = JSON.parse(line);
            const time = obj.timestamp || obj.time || obj['@timestamp'] || '';
            const host = obj.hostname || obj.host || defaultHost;
            const svc = obj.service || obj.daemon || obj.app || 'app';
            const msg = obj.message || obj.msg || obj.log || line;
            return time ? `${time} ${host} ${svc}: ${msg}` : `${host} ${svc}: ${msg}`;
          } catch {
            return line;
          }
        }
        return line;
      });
  }

  const logs: LogEntry[] = [];
  let info = 0;
  let notice = 0;
  let warning = 0;
  let error = 0;
  let critical = 0;
  let suspicious = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const id = `log-${Date.now()}-${index + 1}`;
    const lineNumber = index + 1;

    // Detect severity level
    let level: LogLevel = 'info';
    const lower = trimmed.toLowerCase();

    if (
      lower.includes('emergency') ||
      lower.includes('critical') ||
      lower.includes('not in sudoers') ||
      lower.includes('apparmor="denied"') ||
      lower.includes('segfault')
    ) {
      level = 'critical';
      critical++;
    } else if (
      lower.includes('error') ||
      lower.includes('fatal') ||
      lower.includes('killed process') ||
      lower.includes('oom') ||
      lower.includes('failed to start')
    ) {
      level = 'error';
      error++;
    } else if (
      lower.includes('warn') ||
      lower.includes('failed password') ||
      lower.includes('invalid user') ||
      lower.includes(' 403 ') ||
      lower.includes(' 401 ')
    ) {
      level = 'warning';
      warning++;
    } else if (lower.includes('notice') || lower.includes('accepted') || lower.includes('ban ')) {
      level = 'notice';
      notice++;
    } else {
      level = 'info';
      info++;
    }

    // Detect suspicious anomaly heuristics
    let isSuspicious = false;
    let suspicionReason: string | undefined = undefined;
    const indicators: string[] = [];

    if (lower.includes('failed password for invalid user')) {
      isSuspicious = true;
      suspicionReason = 'Authentication failure on non-existent user account';
      indicators.push('T1110 - Brute Force');
    } else if (lower.includes('not in sudoers')) {
      isSuspicious = true;
      suspicionReason = 'Unauthorized attempt to invoke root privileges via sudo';
      indicators.push('T1548.003 - Sudo Abuse');
    } else if (lower.includes('apparmor="denied"')) {
      isSuspicious = true;
      suspicionReason = 'Mandatory access control denial on security-sensitive file';
      indicators.push('AppArmor-Denied');
    } else if (lower.includes('etc/passwd') || lower.includes('etc/shadow')) {
      isSuspicious = true;
      suspicionReason = 'Path traversal or credential exfiltration pattern identified';
      indicators.push('Credential Access');
    } else if (lower.includes('sqlmap') || lower.includes('nikto')) {
      isSuspicious = true;
      suspicionReason = 'Automated security vulnerability scanner signature identified';
      indicators.push('Reconnaissance');
    }

    if (isSuspicious) {
      suspicious++;
    }

    // Syslog token extraction
    let timestamp = new Date().toISOString();
    let hostname = defaultHost;
    let service = 'system';
    let pid: number | undefined = undefined;
    let message = trimmed;

    // Match syslog standard: "Oct 27 06:15:19 host daemon[123]: message"
    const syslogRegex = /^([A-Z][a-z]{2}\s+\d+\s+[\d:]+)\s+([\w\.\-]+)\s+([\w\.\-]+)(?:\[(\d+)\])?:\s+(.*)$/;
    const match = trimmed.match(syslogRegex);

    if (match) {
      const [, timePart, hostPart, svcPart, pidPart, msgPart] = match;
      timestamp = `2026-10-27T${timePart.split(/\s+/)[2] || '00:00:00'}.000Z`;
      hostname = hostPart;
      service = svcPart;
      if (pidPart) pid = parseInt(pidPart, 10);
      message = msgPart;
    }

    logs.push({
      id,
      lineNumber,
      timestamp,
      hostname,
      service,
      pid,
      level,
      message,
      raw: trimmed,
      isSuspicious,
      suspicionReason,
      indicators: indicators.length > 0 ? indicators : undefined,
    });
  });

  return {
    logs,
    stats: {
      total: logs.length,
      info,
      notice,
      warning,
      error,
      critical,
      suspicious,
    },
  };
}
