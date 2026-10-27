"""Automated tests for log upload, ingestion, parsing, and security heuristics.

Tests all supported formats (RFC 3164 Syslog, RFC 5424, ISO-8601, JSON Array,
JSONL, CSV, Web Access), validation boundaries (size, empty, extension),
deterministic event IDs, line numbers, and suspicious pattern flags.
"""

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_upload_rfc3164_syslog():
    """Verify RFC 3164 Syslog lines are normalized with timestamps, hosts, and services."""
    content = (
        "Oct 27 06:15:19 srv-edge-linux01 sshd[1234]: Accepted publickey for ubuntu from 192.168.1.50 port 54321 ssh2\n"
        "Oct 27 06:15:20 srv-edge-linux01 systemd[1]: Started User Manager for UID 1000.\n"
    )
    files = [("files", ("syslog.log", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_files"] == 1
    assert data["total_events"] == 2

    e1 = data["events"][0]
    assert e1["file_name"] == "syslog.log"
    assert e1["line_number"] == 1
    assert e1["host"] == "srv-edge-linux01"
    assert "sshd[1234]" in e1["service"]
    assert e1["parse_status"] == "parsed"
    assert e1["event_id"].startswith("evt-")
    assert "-L1" in e1["event_id"]


def test_upload_rfc5424_syslog():
    """Verify RFC 5424 Syslog line parsing."""
    content = "<165>1 2026-10-27T06:15:19.000Z srv-cloud app 4321 ID47 - An application event occurred"
    files = [("files", ("auth.log", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 1
    event = data["events"][0]
    assert event["host"] == "srv-cloud"
    assert event["service"] == "app[4321]"
    assert event["parse_status"] == "parsed"


def test_upload_json_array_format():
    """Verify JSON array file parsing and line mapping."""
    content = """[
        {"timestamp": "2026-10-27T06:15:19Z", "hostname": "srv-db01", "service": "postgres", "level": "error", "message": "Connection pool exhausted"},
        {"timestamp": "2026-10-27T06:15:20Z", "hostname": "srv-db01", "service": "postgres", "level": "info", "message": "Server restarted"}
    ]"""
    files = [("files", ("db_logs.json", io.BytesIO(content.encode("utf-8")), "application/json"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 2
    e1 = data["events"][0]
    assert e1["severity"] == "error"
    assert e1["service"] == "postgres"
    assert e1["host"] == "srv-db01"
    assert e1["line_number"] == 1


def test_upload_jsonl_format():
    """Verify JSON Lines (JSONL) single line object extraction."""
    content = (
        '{"time": "2026-10-27T06:20:10Z", "host": "srv-api", "service": "auth-svc", "level": "warn", "message": "Token expired"}\n'
        '{"time": "2026-10-27T06:20:11Z", "host": "srv-api", "service": "auth-svc", "level": "info", "message": "New session created"}\n'
    )
    files = [("files", ("stream.jsonl", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 2
    assert data["events"][0]["line_number"] == 1
    assert data["events"][1]["line_number"] == 2
    assert data["events"][0]["parse_status"] == "parsed"


def test_upload_csv_format():
    """Verify CSV log file parsing."""
    content = (
        "timestamp,host,service,level,message\n"
        "2026-10-27 06:15:19,srv-worker01,celery,error,Task failed with timeout\n"
        "2026-10-27 06:15:20,srv-worker01,celery,info,Worker ready\n"
    )
    files = [("files", ("events.csv", io.BytesIO(content.encode("utf-8")), "text/csv"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 2
    assert data["events"][0]["line_number"] == 2
    assert data["events"][0]["service"] == "celery"
    assert data["events"][0]["severity"] == "error"


def test_upload_web_access_format():
    """Verify Nginx / Apache web access log parsing."""
    content = '198.51.100.44 - - [27/Oct/2026:06:20:14 +0000] "GET /api/v1/status HTTP/1.1" 200 162 "-" "curl/7.88.1"\n'
    files = [("files", ("access.log", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 1
    assert data["events"][0]["host"] == "198.51.100.44"
    assert data["events"][0]["service"] == "web-access"


def test_suspicious_patterns_heuristics():
    """Verify rule-based flags for brute force, sudo abuse, path traversal, scanner, and OOM."""
    content = (
        "Oct 27 06:15:19 srv sshd[12]: Failed password for invalid user admin from 198.51.100.44 port 22\n"
        "Oct 27 06:15:20 srv sudo: guest : user NOT in sudoers ; TTY=pts/1 ; PWD=/home/guest ; USER=root\n"
        'Oct 27 06:15:21 srv kernel: audit: type=1400 apparmor="DENIED" operation="open" name="/etc/shadow"\n'
        'Oct 27 06:15:22 srv nginx: 198.51.100.44 - - "GET /../../../../etc/passwd HTTP/1.1" 403 162 "-" "sqlmap/1.7"\n'
        "Oct 27 06:15:23 srv kernel: Out of memory: Killed process 9999 (mysqld)\n"
    )
    files = [("files", ("anomalies.log", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_suspicious"] == 5

    rule_ids = [flag["rule_id"] for event in data["events"] for flag in event["suspicious_flags"]]
    assert "AUTH_BRUTE_FORCE" in rule_ids
    assert "SUDO_PRIVILEGE_ABUSE" in rule_ids
    assert "MAC_ACCESS_DENIED" in rule_ids
    assert "WEB_PATH_TRAVERSAL" in rule_ids
    assert "RECON_SCANNER_SIGNATURE" in rule_ids
    assert "SYSTEM_PANIC_OOM" in rule_ids


def test_unrecognized_lines_preserved_as_unparsed():
    """Verify unrecognized lines are preserved without being dropped."""
    content = (
        "Completely non-standard arbitrary telemetry line without timestamp or daemon\n"
        "Another random text line here\n"
    )
    files = [("files", ("raw.txt", io.BytesIO(content.encode("utf-8")), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 2
    assert data["events"][0]["parse_status"] == "unparsed"
    assert data["events"][0]["raw_line"] == "Completely non-standard arbitrary telemetry line without timestamp or daemon"
    assert data["summaries"][0]["unparsed_count"] == 2


def test_empty_file_rejected():
    """Verify empty file is rejected with 400 Bad Request."""
    files = [("files", ("empty.log", io.BytesIO(b""), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "is empty" in data["detail"].lower()


def test_unsupported_extension_rejected():
    """Verify unsupported file extensions are rejected with 400 Bad Request."""
    files = [("files", ("payload.exe", io.BytesIO(b"some content"), "application/octet-stream"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "unsupported extension" in data["detail"].lower()


def test_file_exceeding_size_limit_rejected():
    """Verify file exceeding 25 MB limit is rejected with 400 Bad Request."""
    too_large_bytes = b"x" * (25 * 1024 * 1024 + 1)
    files = [("files", ("massive.log", io.BytesIO(too_large_bytes), "text/plain"))]
    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "exceeds maximum allowed size" in data["detail"].lower()


def test_multiple_files_batch_upload():
    """Verify uploading multiple files returns per-file summaries and unified events."""
    f1 = ("files", ("auth.log", io.BytesIO(b"Oct 27 06:15:19 host sshd[1]: Session opened\n"), "text/plain"))
    f2 = ("files", ("app.jsonl", io.BytesIO(b'{"service": "web", "message": "HTTP 200 OK"}\n'), "text/plain"))

    response = client.post(f"{settings.API_PREFIX}/logs/parse", files=[f1, f2])

    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 2
    assert data["total_events"] == 2
    assert len(data["summaries"]) == 2
    assert data["summaries"][0]["file_name"] == "auth.log"
    assert data["summaries"][1]["file_name"] == "app.jsonl"
