"""Curated knowledge base repository for Linux and application log troubleshooting.

Each document contains authoritative references, stable IDs, category metadata,
and locally authored educational explanations.
"""

from typing import Dict, List
from app.schemas.retrieval import DocumentSourceMetadata, KnowledgeSearchResult

# ---------------------------------------------------------------------------
# Knowledge Base Documents Collection
# ---------------------------------------------------------------------------
KNOWLEDGE_DOCUMENTS: List[Dict] = [
    {
        "doc_id": "KB-SSH-AUTH-001",
        "title": "OpenSSH Authentication Failures and Repeated Login Attempt Triage",
        "category": "Authentication & Access Control",
        "content": (
            "OpenSSH authentication failures typically manifest in syslog (/var/log/auth.log on Debian/Ubuntu "
            "or /var/log/secure on RHEL/CentOS) with signatures such as 'Failed password for invalid user <username>' "
            "or 'Failed password for <valid_user> from <IP> port <port> ssh2'. Repeated authentication failures within "
            "short intervals from external IP addresses commonly indicate automated dictionary brute-force attacks "
            "(MITRE ATT&CK T1110). Conversely, occasional failures followed by a successful login by a legitimate user "
            "typically represent mistyped credentials. Key forensic checks: verify if any attempt succeeded from the "
            "offending IP ('Accepted publickey' or 'Accepted password'), inspect the targeting of administrative accounts "
            "('root', 'admin'), and verify if MaxAuthTries was exceeded ('error: maximum authentication attempts exceeded'). "
            "Standard hardening recommendations include disabling password-based authentication (PasswordAuthentication no), "
            "restricting root login (PermitRootLogin no), enforcing public key authentication, and implementing automated "
            "temporary IP blocking via fail2ban or firewall rate-limiting."
        ),
        "source_metadata": {
            "document_id": "KB-SSH-AUTH-001",
            "references": [
                "OpenSSH sshd(8) Manual Pages",
                "Debian Security Guide: Securing OpenSSH",
                "NIST SP 800-123 Guide to General Server Security",
            ],
            "attribution": "Curated LogSleuth Educational Reference Guide",
            "version": "2026-10 / Rev 1.0",
        },
    },
    {
        "doc_id": "KB-SUDO-PRIV-002",
        "title": "Linux Sudo Privilege Escalation and Authorization Failures",
        "category": "Privilege Management",
        "content": (
            "Sudo authorization failures are recorded in system authentication logs (/var/log/auth.log or /var/log/secure) "
            "with messages such as '<user> : user NOT in sudoers ; TTY=<tty> ; PWD=<dir> ; USER=root ; COMMAND=<command>' "
            "or 'pam_unix(sudo:auth): authentication failure; logname=<user> uid=<uid>'. Sudo errors arise when a user account "
            "attempts to invoke administrative privileges without an entry in /etc/sudoers or /etc/sudoers.d/, or when the user "
            "enters an incorrect password ('3 incorrect password attempts'). In security investigations, determine whether the "
            "account is a human operator or a compromised service daemon (e.g., www-data, nobody, nginx). Service accounts "
            "attempting sudo commands often signify remote code execution or post-exploitation local privilege escalation "
            "(MITRE ATT&CK T1548.003). Forensics should cross-reference the working directory (PWD), terminal (TTY), executed "
            "command arguments, and auditd logs for preceding command history."
        ),
        "source_metadata": {
            "document_id": "KB-SUDO-PRIV-002",
            "references": [
                "Sudoers Manual (sudoers(5))",
                "Red Hat Enterprise Linux Security Guide: Managing Sudo",
                "MITRE ATT&CK Technique T1548.003 (Sudo and Sudo Caching)",
            ],
            "attribution": "Curated LogSleuth Educational Reference Guide",
            "version": "2026-10 / Rev 1.0",
        },
    },
    {
        "doc_id": "KB-WEB-TRAVERSAL-003",
        "title": "Web Server Path Traversal and Sensitive File Probe Investigation",
        "category": "Web Application Security",
        "content": (
            "Path traversal (directory traversal) vulnerabilities occur when an application accepts untrusted input containing "
            "dot-dot-slash sequence patterns ('../' or '..\\') to access files outside the intended web root directory. In Nginx "
            "and Apache access logs, indicators include URI requests containing '/../../../../etc/passwd', '/etc/shadow', "
            "'/proc/self/environ', or Windows equivalents ('win.ini', 'boot.ini'). Log analysis must focus on the HTTP response "
            "status code: a 400 or 403 Forbidden indicates the web server or web application firewall (WAF) successfully "
            "blocked the request; a 404 Not Found indicates the requested URI path was not found; while a 200 OK with significant "
            "byte response length warrants critical investigation for credential or system information disclosure (OWASP A01:2021). "
            "Automated reconnaissance scanner user agents (e.g., 'sqlmap', 'nikto', 'gobuster', 'dirbuster') frequently generate "
            "bursts of traversal probes across common default administrative endpoints."
        ),
        "source_metadata": {
            "document_id": "KB-WEB-TRAVERSAL-003",
            "references": [
                "OWASP Top 10: Path Traversal (A01:2021 - Broken Access Control)",
                "Nginx HTTP Core Module Security Documentation",
                "Apache HTTP Server Security Tips and Access Control Guide",
            ],
            "attribution": "Curated LogSleuth Educational Reference Guide",
            "version": "2026-10 / Rev 1.0",
        },
    },
    {
        "doc_id": "KB-MAC-DENIAL-004",
        "title": "AppArmor and SELinux Mandatory Access Control (MAC) Policy Denials",
        "category": "Mandatory Access Control",
        "content": (
            "Mandatory Access Control (MAC) frameworks restrict what system resources processes can access, even if the process "
            "runs with root privileges. AppArmor denials appear in /var/log/audit/audit.log or /var/log/syslog as: "
            "'apparmor=\"DENIED\" operation=\"open\" profile=\"<profile>\" name=\"<file_path>\" pid=<pid> comm=\"<cmd>\" requested_mask=\"r\"'. "
            "SELinux denials appear as: 'type=AVC msg=audit(...): avc: denied { <permission> } for pid=<pid> comm=\"<cmd>\" "
            "name=\"<file>\" dev=\"<dev>\" ino=<inode> scontext=<source_context> tcontext=<target_context> tclass=<class>'. "
            "When analyzing MAC denials, evaluate whether the denial represents a legitimate service following an unexpected update "
            "(misconfigured profile), or a security containment event where a confined process (e.g., web server or DNS daemon) "
            "attempted to read sensitive credential files or execute shell binaries (/bin/sh, /bin/bash). Tools such as aa-status "
            "and sealert assist in diagnosing confinement profiles without disabling system-wide enforcement."
        ),
        "source_metadata": {
            "document_id": "KB-MAC-DENIAL-004",
            "references": [
                "Linux Kernel Documentation: AppArmor Security Module",
                "Red Hat Enterprise Linux: SELinux Security Guide",
                "Ubuntu Server Guide: AppArmor Confinement",
            ],
            "attribution": "Curated LogSleuth Educational Reference Guide",
            "version": "2026-10 / Rev 1.0",
        },
    },
    {
        "doc_id": "KB-KERNEL-OOM-005",
        "title": "Linux Kernel Panic, Segfaults, and Out-of-Memory (OOM) Killer Events",
        "category": "Kernel & System Availability",
        "content": (
            "Kernel-level anomalies and service crashes are logged to /var/log/kern.log, /var/log/syslog, or captured via dmesg. "
            "The Out-Of-Memory (OOM) Killer is invoked when the Linux kernel cannot allocate physical memory or swap space, "
            "producing log messages such as 'Out of memory: Killed process <pid> (<process_name>) total-vm:<kb>, anon-rss:<kb>, "
            "file-rss:<kb>, shmem-rss:<kb>'. Segmentation faults ('segfault at <addr> ip <ip> sp <sp> error 4 in <binary>') "
            "occur when a program attempts to access unmapped or protected memory addresses, indicating software memory corruption "
            "or exploitation attempts. In incident investigations, determine whether memory exhaustion was caused by a sudden traffic "
            "spike, a software memory leak, or a deliberate Denial of Service (DoS) attack (MITRE ATT&CK T1499). Review "
            "/proc/sys/vm/overcommit_memory and swap settings, and analyze core dumps using coredumpctl or gdb for root-cause isolation."
        ),
        "source_metadata": {
            "document_id": "KB-KERNEL-OOM-005",
            "references": [
                "Linux Kernel Documentation: Virtual Memory Overcommit Accounting",
                "Linux coredumpctl(1) and systemd-coredump(8) Manual",
                "Linux System Administrator's Guide: Memory Management",
            ],
            "attribution": "Curated LogSleuth Educational Reference Guide",
            "version": "2026-10 / Rev 1.0",
        },
    },
]


def get_default_knowledge_documents() -> List[Dict]:
    """Return a fresh copy of the default knowledge base documents."""
    return [dict(doc) for doc in KNOWLEDGE_DOCUMENTS]
