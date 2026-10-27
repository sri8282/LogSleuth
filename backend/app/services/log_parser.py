"""Deterministic log ingestion, normalization, and security heuristic analysis engine.

Supports RFC-3164 Syslog, RFC-5424 Syslog, ISO-8601 application streams,
JSON/JSONL streams, and CSV formats. Preserves exact line numbers and raw strings.
"""

import csv
import hashlib
import io
import json
import re
from typing import List, Optional, Tuple
from app.schemas.logs import FileParseSummary, ParsedLogEvent, SuspiciousFlag

# Allowed file extensions
ALLOWED_EXTENSIONS = {".log", ".txt", ".json", ".csv", ".jsonl"}

# Maximum single file size: 25 MB
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

# Maximum total upload batch size: 100 MB
MAX_BATCH_SIZE_BYTES = 100 * 1024 * 1024

# Maximum events returned in a single API response
MAX_RESPONSE_EVENTS = 10000

# ---------------------------------------------------------------------------
# Heuristic Rules for Suspicious Pattern Detection
# ---------------------------------------------------------------------------
SUSPICIOUS_RULES = [
    {
        "rule_id": "AUTH_BRUTE_FORCE",
        "category": "Credential Access",
        "pattern": re.compile(r"(failed password for (invalid user\s+)?\w+|authentication failure|invalid user\s+\w+|failed login)", re.IGNORECASE),
        "description": "Failed authentication attempt indicating brute force or credential guessing",
        "indicator": "T1110 - Brute Force",
    },
    {
        "rule_id": "SUDO_PRIVILEGE_ABUSE",
        "category": "Privilege Escalation",
        "pattern": re.compile(r"(not in sudoers|incorrect password attempt.*sudo|sudo:.*authentication failure)", re.IGNORECASE),
        "description": "Unauthorized attempt to execute commands via sudo or root privilege escalation",
        "indicator": "T1548.003 - Sudo and Sudo Caching",
    },
    {
        "rule_id": "MAC_ACCESS_DENIED",
        "category": "Defense Evasion",
        "pattern": re.compile(r'(apparmor="denied"|avc:\s+denied|selinux.*denied)', re.IGNORECASE),
        "description": "Mandatory Access Control (AppArmor / SELinux) policy denial",
        "indicator": "AppArmor / SELinux Denial",
    },
    {
        "rule_id": "WEB_PATH_TRAVERSAL",
        "category": "Initial Access / Discovery",
        "pattern": re.compile(r'(\.\./|\.\.\\|/etc/passwd|/etc/shadow|/proc/self|win\.ini|boot\.ini)', re.IGNORECASE),
        "description": "Directory traversal or sensitive file access probe in request",
        "indicator": "T1083 - Path Traversal Probe",
    },
    {
        "rule_id": "RECON_SCANNER_SIGNATURE",
        "category": "Reconnaissance",
        "pattern": re.compile(r"(sqlmap|nikto|nmap|masscan|zgrab|gobuster|dirbuster|wfuzz)", re.IGNORECASE),
        "description": "Automated security vulnerability scanner User-Agent or payload detected",
        "indicator": "T1595 - Active Scanning",
    },
    {
        "rule_id": "SYSTEM_PANIC_OOM",
        "category": "System Availability",
        "pattern": re.compile(r"(segfault at|kernel panic|oom-killer|killed process\s+\d+|Out of memory: Killed process)", re.IGNORECASE),
        "description": "Critical system crash, kernel panic, or OOM killer invocation",
        "indicator": "T1499 - System Resource Exhaustion",
    },
    {
        "rule_id": "LOG_TAMPERING_INDICATOR",
        "category": "Defense Evasion",
        "pattern": re.compile(r"(auditd.*stopped|journalctl\s+--vacuum|rm\s+-rf\s+/var/log)", re.IGNORECASE),
        "description": "Potential log suppression, clearing, or tampering indicator",
        "indicator": "T1070 - Indicator Removal on Host",
    },
]

# ---------------------------------------------------------------------------
# Syslog & Log Regexes
# ---------------------------------------------------------------------------
# RFC 3164 Syslog: "Oct 27 06:15:19 hostname daemon[123]: message"
RFC3164_REGEX = re.compile(
    r"^([A-Z][a-z]{2}\s+\d+\s+[\d:]+)\s+([\w\.\-]+)\s+([\w\.\-]+)(?:\[(\d+)\])?:\s+(.*)$"
)

# RFC 5424 Syslog: "<165>1 2026-10-27T06:15:19.000Z hostname app 1234 ID47 - message"
RFC5424_REGEX = re.compile(
    r"^<(\d+)>[1-9]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(?:\[.*?\])?\s*(.*)$"
)

# ISO-8601 Timestamped Log: "2026-10-27 06:15:19,123 [ERROR] service: message"
ISO_LOG_REGEX = re.compile(
    r"^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[\.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(?:\[(.*?)\]\s+)?(?:([\w\.\-]+):\s+)?(.*)$"
)

# Nginx / Apache Combined Access Log:
COMBINED_ACCESS_REGEX = re.compile(
    r'^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3})\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"'
)


class LogParserService:
    """Provides file validation, decoding, log parsing, and security heuristics."""

    @staticmethod
    def validate_file_metadata(file_name: str, file_size: int) -> None:
        """Validate file extension and size bounds."""
        if not file_name or "." not in file_name:
            raise ValueError(f"File '{file_name or 'unknown'}' has no extension.")

        extension = "." + file_name.rsplit(".", 1)[-1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise ValueError(
                f"File '{file_name}' has unsupported extension '{extension}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
            )

        if file_size == 0:
            raise ValueError(f"File '{file_name}' is empty (0 bytes).")

        if file_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"File '{file_name}' exceeds maximum allowed size of 25 MB ({file_size} bytes)."
            )

    @staticmethod
    def safe_decode_text(raw_bytes: bytes) -> str:
        """Safely decode raw bytes using UTF-8 with fallback to Latin-1 and replace error handler."""
        try:
            return raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return raw_bytes.decode("latin-1")
            except Exception:
                return raw_bytes.decode("utf-8", errors="replace")

    @classmethod
    def evaluate_suspicious_patterns(cls, text: str) -> List[SuspiciousFlag]:
        """Evaluate rule-based heuristics against raw/message text."""
        flags: List[SuspiciousFlag] = []
        for rule in SUSPICIOUS_RULES:
            if rule["pattern"].search(text):
                flags.append(
                    SuspiciousFlag(
                        rule_id=rule["rule_id"],
                        category=rule["category"],
                        description=rule["description"],
                        indicator=rule["indicator"],
                    )
                )
        return flags

    @staticmethod
    def detect_severity(text: str, default: str = "info") -> str:
        """Heuristic severity level classification."""
        lower = text.lower()
        if any(k in lower for k in ("emerg", "fatal", "critical", "segfault", "panic")):
            return "critical"
        elif any(k in lower for k in ("error", "err", "failed", "failure", "exception")):
            return "error"
        elif any(k in lower for k in ("warn", "warning", "denied", " 403 ", " 401 ", " 500 ")):
            return "warning"
        elif any(k in lower for k in ("notice", "accepted", "ban")):
            return "notice"
        elif any(k in lower for k in ("debug", "trace")):
            return "debug"
        return default

    @classmethod
    def make_event_id(cls, file_name: str, line_number: int) -> str:
        """Generate a deterministic event identifier based on file name and line number."""
        h = hashlib.sha256(file_name.encode("utf-8")).hexdigest()[:8]
        return f"evt-{h}-L{line_number}"

    @classmethod
    def parse_json_content(
        cls, content: str, file_name: str, max_events: int
    ) -> Tuple[List[ParsedLogEvent], int, int, int]:
        """Attempt to parse content as a JSON array."""
        trimmed = content.strip()
        if not (trimmed.startswith("[") and trimmed.endswith("]")):
            return [], 0, 0, 0

        try:
            data = json.loads(trimmed)
            if not isinstance(data, list):
                return [], 0, 0, 0
        except Exception:
            return [], 0, 0, 0

        events: List[ParsedLogEvent] = []
        parsed = 0
        partial = 0
        unparsed = 0

        for idx, item in enumerate(data, start=1):
            if len(events) >= max_events:
                break

            line_num = idx
            event_id = cls.make_event_id(file_name, line_num)

            if isinstance(item, dict):
                raw = json.dumps(item)
                timestamp = str(item.get("timestamp") or item.get("time") or item.get("@timestamp") or "") or None
                host = str(item.get("host") or item.get("hostname") or "") or None
                service = str(item.get("service") or item.get("app") or item.get("daemon") or "") or None
                msg = str(item.get("message") or item.get("msg") or item.get("log") or raw)
                sev = cls.detect_severity(str(item.get("level") or item.get("severity") or msg))
                flags = cls.evaluate_suspicious_patterns(raw)

                events.append(
                    ParsedLogEvent(
                        event_id=event_id,
                        file_name=file_name,
                        line_number=line_num,
                        timestamp=timestamp,
                        host=host,
                        service=service,
                        severity=sev,
                        message=msg,
                        raw_line=raw,
                        parse_status="parsed",
                        suspicious_flags=flags,
                    )
                )
                parsed += 1
            else:
                raw = str(item)
                flags = cls.evaluate_suspicious_patterns(raw)
                sev = cls.detect_severity(raw)
                events.append(
                    ParsedLogEvent(
                        event_id=event_id,
                        file_name=file_name,
                        line_number=line_num,
                        severity=sev,
                        message=raw,
                        raw_line=raw,
                        parse_status="partial",
                        suspicious_flags=flags,
                    )
                )
                partial += 1

        return events, parsed, partial, unparsed

    @classmethod
    def parse_csv_content(
        cls, content: str, file_name: str, max_events: int
    ) -> Tuple[List[ParsedLogEvent], int, int, int]:
        """Attempt to parse file as CSV if extension is .csv or first line has standard headers."""
        if not file_name.lower().endswith(".csv"):
            return [], 0, 0, 0

        try:
            reader = csv.reader(io.StringIO(content))
            rows = list(reader)
        except Exception:
            return [], 0, 0, 0

        if not rows:
            return [], 0, 0, 0

        header = [col.strip().lower() for col in rows[0]]
        events: List[ParsedLogEvent] = []
        parsed = 0
        partial = 0
        unparsed = 0

        # Map header columns
        ts_idx = next((i for i, h in enumerate(header) if h in ("timestamp", "time", "date")), None)
        host_idx = next((i for i, h in enumerate(header) if h in ("host", "hostname", "server")), None)
        svc_idx = next((i for i, h in enumerate(header) if h in ("service", "app", "daemon", "component")), None)
        sev_idx = next((i for i, h in enumerate(header) if h in ("level", "severity", "status")), None)
        msg_idx = next((i for i, h in enumerate(header) if h in ("message", "msg", "log", "text")), None)

        for line_num, row in enumerate(rows[1:], start=2):
            if len(events) >= max_events:
                break
            if not any(row):
                continue

            raw = ",".join(row)
            event_id = cls.make_event_id(file_name, line_num)
            flags = cls.evaluate_suspicious_patterns(raw)

            timestamp = row[ts_idx] if ts_idx is not None and ts_idx < len(row) else None
            host = row[host_idx] if host_idx is not None and host_idx < len(row) else None
            service = row[svc_idx] if svc_idx is not None and svc_idx < len(row) else None
            msg = row[msg_idx] if msg_idx is not None and msg_idx < len(row) else raw
            sev_raw = row[sev_idx] if sev_idx is not None and sev_idx < len(row) else ""
            sev = cls.detect_severity(sev_raw or msg)

            status = "parsed" if msg_idx is not None else "partial"
            if status == "parsed":
                parsed += 1
            else:
                partial += 1

            events.append(
                ParsedLogEvent(
                    event_id=event_id,
                    file_name=file_name,
                    line_number=line_num,
                    timestamp=timestamp,
                    host=host,
                    service=service,
                    severity=sev,
                    message=msg,
                    raw_line=raw,
                    parse_status=status,
                    suspicious_flags=flags,
                )
            )

        return events, parsed, partial, unparsed

    @classmethod
    def parse_single_line(cls, line: str, file_name: str, line_number: int) -> ParsedLogEvent:
        """Parse an individual text line using standard syslog, ISO, JSONL, or web access formats."""
        raw = line
        event_id = cls.make_event_id(file_name, line_number)
        flags = cls.evaluate_suspicious_patterns(raw)

        # 1. Check for JSONL single line
        trimmed = line.strip()
        if trimmed.startswith("{") and trimmed.endswith("}"):
            try:
                obj = json.loads(trimmed)
                if isinstance(obj, dict):
                    timestamp = str(obj.get("timestamp") or obj.get("time") or obj.get("@timestamp") or "") or None
                    host = str(obj.get("host") or obj.get("hostname") or "") or None
                    service = str(obj.get("service") or obj.get("app") or obj.get("daemon") or "") or None
                    msg = str(obj.get("message") or obj.get("msg") or obj.get("log") or raw)
                    sev = cls.detect_severity(str(obj.get("level") or obj.get("severity") or msg))

                    return ParsedLogEvent(
                        event_id=event_id,
                        file_name=file_name,
                        line_number=line_number,
                        timestamp=timestamp,
                        host=host,
                        service=service,
                        severity=sev,
                        message=msg,
                        raw_line=raw,
                        parse_status="parsed",
                        suspicious_flags=flags,
                    )
            except Exception:
                pass

        # 2. RFC 3164 Syslog: Oct 27 06:15:19 host daemon[123]: msg
        match_3164 = RFC3164_REGEX.match(trimmed)
        if match_3164:
            ts, host, svc, pid, msg = match_3164.groups()
            service_label = f"{svc}[{pid}]" if pid else svc
            sev = cls.detect_severity(msg)
            return ParsedLogEvent(
                event_id=event_id,
                file_name=file_name,
                line_number=line_number,
                timestamp=ts,
                host=host,
                service=service_label,
                severity=sev,
                message=msg,
                raw_line=raw,
                parse_status="parsed",
                suspicious_flags=flags,
            )

        # 3. RFC 5424 Syslog: <165>1 2026-10-27T06:15:19.000Z host app 1234 ...
        match_5424 = RFC5424_REGEX.match(trimmed)
        if match_5424:
            pri, ts, host, app, pid, msgid, msg = match_5424.groups()
            sev = cls.detect_severity(msg)
            svc = f"{app}[{pid}]" if pid and pid != "-" else app
            return ParsedLogEvent(
                event_id=event_id,
                file_name=file_name,
                line_number=line_number,
                timestamp=ts if ts != "-" else None,
                host=host if host != "-" else None,
                service=svc if svc != "-" else None,
                severity=sev,
                message=msg or trimmed,
                raw_line=raw,
                parse_status="parsed",
                suspicious_flags=flags,
            )

        # 4. Web Access Log
        match_access = COMBINED_ACCESS_REGEX.match(trimmed)
        if match_access:
            ip, ts, req, code, size, referer, user_agent = match_access.groups()
            sev = "warning" if code.startswith(("4", "5")) else "info"
            return ParsedLogEvent(
                event_id=event_id,
                file_name=file_name,
                line_number=line_number,
                timestamp=ts,
                host=ip,
                service="web-access",
                severity=sev,
                message=f'"{req}" {code} {size} "{user_agent}"',
                raw_line=raw,
                parse_status="parsed",
                suspicious_flags=flags,
            )

        # 5. ISO Log format: 2026-10-27 06:15:19 [ERROR] service: message
        match_iso = ISO_LOG_REGEX.match(trimmed)
        if match_iso:
            ts, level_grp, svc_grp, msg_grp = match_iso.groups()
            sev = cls.detect_severity(level_grp or msg_grp)
            return ParsedLogEvent(
                event_id=event_id,
                file_name=file_name,
                line_number=line_number,
                timestamp=ts,
                host=None,
                service=svc_grp,
                severity=sev,
                message=msg_grp or trimmed,
                raw_line=raw,
                parse_status="parsed",
                suspicious_flags=flags,
            )

        # 6. Fallback line: classify partial / unparsed
        sev = cls.detect_severity(trimmed)
        status = "partial" if sev != "info" or flags else "unparsed"

        return ParsedLogEvent(
            event_id=event_id,
            file_name=file_name,
            line_number=line_number,
            timestamp=None,
            host=None,
            service=None,
            severity=sev,
            message=trimmed,
            raw_line=raw,
            parse_status=status,
            suspicious_flags=flags,
        )

    @classmethod
    def parse_file(
        cls, file_name: str, content_bytes: bytes, remaining_budget: int
    ) -> Tuple[FileParseSummary, List[ParsedLogEvent]]:
        """Process a single file and generate events up to remaining_budget limit."""
        size_bytes = len(content_bytes)
        text = cls.safe_decode_text(content_bytes)
        warnings: List[str] = []

        # 1. Try JSON Array parsing
        events, parsed, partial, unparsed = cls.parse_json_content(text, file_name, remaining_budget)
        if events:
            total_lines = len(events)
            suspicious = sum(1 for e in events if e.suspicious_flags)
            truncated = total_lines > len(events)
            summary = FileParseSummary(
                file_name=file_name,
                file_size_bytes=size_bytes,
                total_lines=total_lines,
                parsed_count=parsed,
                partial_count=partial,
                unparsed_count=unparsed,
                suspicious_count=suspicious,
                warnings=warnings,
                truncated=truncated,
            )
            return summary, events

        # 2. Try CSV parsing
        events, parsed, partial, unparsed = cls.parse_csv_content(text, file_name, remaining_budget)
        if events:
            total_lines = text.count("\n") + 1
            suspicious = sum(1 for e in events if e.suspicious_flags)
            truncated = len(events) >= remaining_budget and total_lines > len(events)
            summary = FileParseSummary(
                file_name=file_name,
                file_size_bytes=size_bytes,
                total_lines=total_lines,
                parsed_count=parsed,
                partial_count=partial,
                unparsed_count=unparsed,
                suspicious_count=suspicious,
                warnings=warnings,
                truncated=truncated,
            )
            return summary, events

        # 3. Line-by-line parsing (Syslog, ISO, JSONL, arbitrary text)
        lines = text.splitlines()
        total_lines = len(lines)
        events = []
        parsed = 0
        partial = 0
        unparsed = 0
        suspicious = 0

        for line_idx, line in enumerate(lines, start=1):
            if not line.strip():
                continue

            if len(events) >= remaining_budget:
                warnings.append(
                    f"Reached event ceiling of {MAX_RESPONSE_EVENTS}. Remainder of '{file_name}' truncated."
                )
                break

            event = cls.parse_single_line(line, file_name, line_idx)
            if event.parse_status == "parsed":
                parsed += 1
            elif event.parse_status == "partial":
                partial += 1
            else:
                unparsed += 1

            if event.suspicious_flags:
                suspicious += 1

            events.append(event)

        truncated = len(lines) > len(events)
        summary = FileParseSummary(
            file_name=file_name,
            file_size_bytes=size_bytes,
            total_lines=total_lines,
            parsed_count=parsed,
            partial_count=partial,
            unparsed_count=unparsed,
            suspicious_count=suspicious,
            warnings=warnings,
            truncated=truncated,
        )

        return summary, events


log_parser_service = LogParserService()
