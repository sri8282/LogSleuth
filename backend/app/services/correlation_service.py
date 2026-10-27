"""Deterministic evidence correlation service for LogSleuth AI.

Correlates parsed log events by IP, host, service, sequence, and security heuristics.
Preserves line numbers, event IDs, and source file citations without fabricating data.
"""

from collections import defaultdict
import re
from typing import Dict, List, Optional, Tuple
from app.schemas.investigation import CorrelatedFinding, EvidenceReference, TimelineEvent
from app.schemas.logs import ParsedLogEvent

# IPv4 regex matching valid IP octets
IP_REGEX = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"
)


class CorrelationService:
    """Provides transparent, rule-based correlation across parsed log events."""

    @staticmethod
    def extract_ip_address(text: str) -> Optional[str]:
        """Extract first valid IPv4 address from text, ignoring localhost."""
        matches = IP_REGEX.findall(text)
        for ip in matches:
            if not ip.startswith("127.") and ip != "0.0.0.0":
                return ip
        return matches[0] if matches else None

    @classmethod
    def correlate_events(
        cls, events: List[ParsedLogEvent]
    ) -> Tuple[List[CorrelatedFinding], List[TimelineEvent], List[str]]:
        """Analyze event stream to produce correlated findings, chronological timeline, and RAG queries."""
        findings: List[CorrelatedFinding] = []
        timeline: List[TimelineEvent] = []
        rag_search_topics: List[str] = []

        if not events:
            return findings, timeline, rag_search_topics

        # -------------------------------------------------------------------
        # 1. Build Timeline from timestamped events
        # -------------------------------------------------------------------
        for event in events:
            if event.timestamp:
                summary_text = event.message[:120] if len(event.message) > 120 else event.message
                timeline.append(
                    TimelineEvent(
                        timestamp=event.timestamp,
                        event_id=event.event_id,
                        file_name=event.file_name,
                        line_number=event.line_number,
                        service=event.service,
                        summary=summary_text,
                    )
                )

        # -------------------------------------------------------------------
        # 2. Pattern Correlator: Authentication & Brute Force
        # -------------------------------------------------------------------
        auth_failures: List[ParsedLogEvent] = []
        auth_successes: List[ParsedLogEvent] = []

        for e in events:
            raw_lower = e.raw_line.lower()
            if any(f.rule_id == "AUTH_BRUTE_FORCE" for f in e.suspicious_flags) or "failed password" in raw_lower:
                auth_failures.append(e)
            elif "accepted publickey" in raw_lower or "accepted password" in raw_lower or "session opened" in raw_lower:
                auth_successes.append(e)

        if auth_failures:
            # Check for repeated failures from same IP or account
            ip_counts = defaultdict(list)
            for f_event in auth_failures:
                ip = cls.extract_ip_address(f_event.raw_line) or f_event.host or "unknown-source"
                ip_counts[ip].append(f_event)

            for ip, ip_events in ip_counts.items():
                refs = [
                    EvidenceReference(
                        event_id=ev.event_id,
                        file_name=ev.file_name,
                        line_number=ev.line_number,
                        raw_snippet=ev.raw_line[:140],
                    )
                    for ev in ip_events[:8]
                ]

                # Check if this IP later succeeded
                succeeded = [s for s in auth_successes if (cls.extract_ip_address(s.raw_line) or s.host) == ip]
                if succeeded:
                    refs.extend(
                        EvidenceReference(
                            event_id=s_ev.event_id,
                            file_name=s_ev.file_name,
                            line_number=s_ev.line_number,
                            raw_snippet=s_ev.raw_line[:140],
                        )
                        for s_ev in succeeded[:2]
                    )
                    desc = (
                        f"Detected {len(ip_events)} authentication failure(s) from origin '{ip}' "
                        f"followed by successful session establishment. Warrants high-priority credential verification."
                    )
                else:
                    desc = (
                        f"Detected repeated authentication failure burst ({len(ip_events)} attempts) from origin '{ip}'. "
                        f"No corresponding successful login observed in provided telemetry."
                    )

                findings.append(
                    CorrelatedFinding(
                        finding_id=f"FIND-AUTH-{len(findings) + 1:02d}",
                        title=f"Authentication Failure Sequence ({ip})",
                        pattern_type="Authentication Anomaly",
                        description=desc,
                        evidence_references=refs,
                    )
                )

            rag_search_topics.append("OpenSSH authentication failures brute force repeated login attempts")

        # -------------------------------------------------------------------
        # 3. Pattern Correlator: Sudo & Privilege Escalation
        # -------------------------------------------------------------------
        sudo_events = [
            e for e in events
            if any(f.rule_id == "SUDO_PRIVILEGE_ABUSE" for f in e.suspicious_flags)
            or "not in sudoers" in e.raw_line.lower()
        ]

        if sudo_events:
            refs = [
                EvidenceReference(
                    event_id=se.event_id,
                    file_name=se.file_name,
                    line_number=se.line_number,
                    raw_snippet=se.raw_line[:140],
                )
                for se in sudo_events[:6]
            ]
            findings.append(
                CorrelatedFinding(
                    finding_id=f"FIND-SUDO-{len(findings) + 1:02d}",
                    title="Unauthorized Sudo Privilege Escalation Attempt",
                    pattern_type="Privilege Escalation",
                    description=(
                        f"Identified {len(sudo_events)} unauthorized attempt(s) to execute administrative commands via sudo. "
                        f"Accounts not in sudoers or entering incorrect credentials were recorded."
                    ),
                    evidence_references=refs,
                )
            )
            rag_search_topics.append("sudo privilege escalation user not in sudoers errors")

        # -------------------------------------------------------------------
        # 4. Pattern Correlator: Web Path Traversal & Probes
        # -------------------------------------------------------------------
        web_events = [
            e for e in events
            if any(f.rule_id in ("WEB_PATH_TRAVERSAL", "RECON_SCANNER_SIGNATURE") for f in e.suspicious_flags)
            or "/../" in e.raw_line
            or "/etc/passwd" in e.raw_line
        ]

        if web_events:
            refs = [
                EvidenceReference(
                    event_id=we.event_id,
                    file_name=we.file_name,
                    line_number=we.line_number,
                    raw_snippet=we.raw_line[:140],
                )
                for we in web_events[:6]
            ]
            findings.append(
                CorrelatedFinding(
                    finding_id=f"FIND-WEB-{len(findings) + 1:02d}",
                    title="Web Directory Traversal & Scanner Reconnaissance Probes",
                    pattern_type="Web Probing",
                    description=(
                        f"Recorded {len(web_events)} directory traversal request(s) or automated scanner signatures. "
                        f"Examine HTTP status codes to confirm whether requests were blocked (403/404) or allowed (200)."
                    ),
                    evidence_references=refs,
                )
            )
            rag_search_topics.append("web server path traversal probe etc passwd 403 404")

        # -------------------------------------------------------------------
        # 5. Pattern Correlator: Mandatory Access Control (AppArmor / SELinux)
        # -------------------------------------------------------------------
        mac_events = [
            e for e in events
            if any(f.rule_id == "MAC_ACCESS_DENIED" for f in e.suspicious_flags)
            or 'apparmor="denied"' in e.raw_line.lower()
            or "avc:  denied" in e.raw_line.lower()
        ]

        if mac_events:
            refs = [
                EvidenceReference(
                    event_id=me.event_id,
                    file_name=me.file_name,
                    line_number=me.line_number,
                    raw_snippet=me.raw_line[:140],
                )
                for me in mac_events[:6]
            ]
            findings.append(
                CorrelatedFinding(
                    finding_id=f"FIND-MAC-{len(findings) + 1:02d}",
                    title="Mandatory Access Control (MAC) Confinement Denials",
                    pattern_type="Defense Evasion / Confinement",
                    description=(
                        f"Detected {len(mac_events)} AppArmor / SELinux access restriction denial(s). "
                        f"Indicates confined process attempted unauthorized access to system resources."
                    ),
                    evidence_references=refs,
                )
            )
            rag_search_topics.append("AppArmor SELinux policy denials audit confinement")

        # -------------------------------------------------------------------
        # 6. Pattern Correlator: Kernel & OOM System Failures
        # -------------------------------------------------------------------
        kernel_events = [
            e for e in events
            if any(f.rule_id == "SYSTEM_PANIC_OOM" for f in e.suspicious_flags)
            or "out of memory" in e.raw_line.lower()
            or "segfault" in e.raw_line.lower()
        ]

        if kernel_events:
            refs = [
                EvidenceReference(
                    event_id=ke.event_id,
                    file_name=ke.file_name,
                    line_number=ke.line_number,
                    raw_snippet=ke.raw_line[:140],
                )
                for ke in kernel_events[:6]
            ]
            findings.append(
                CorrelatedFinding(
                    finding_id=f"FIND-SYS-{len(findings) + 1:02d}",
                    title="Kernel Segfault / Memory Resource Exhaustion Event",
                    pattern_type="System Availability",
                    description=(
                        f"Found {len(kernel_events)} kernel panic, segmentation fault, or Out-Of-Memory (OOM) killer "
                        f"process termination event(s)."
                    ),
                    evidence_references=refs,
                )
            )
            rag_search_topics.append("Linux kernel panic segfault out of memory killed process oom")

        # Default fallback finding if clean logs
        if not findings and events:
            sample_refs = [
                EvidenceReference(
                    event_id=ev.event_id,
                    file_name=ev.file_name,
                    line_number=ev.line_number,
                    raw_snippet=ev.raw_line[:140],
                )
                for ev in events[:3]
            ]
            findings.append(
                CorrelatedFinding(
                    finding_id="FIND-BASELINE-01",
                    title="Nominal Telemetry Stream Observed",
                    pattern_type="Baseline Activity",
                    description="No high-confidence adversary TTPs or critical resource exhaustion signatures were identified.",
                    evidence_references=sample_refs,
                )
            )

        return findings, timeline, rag_search_topics


correlation_service = CorrelationService()
