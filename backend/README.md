# LogSleuth AI — Python FastAPI Backend

This is the backend service for **LogSleuth AI**, an AI-powered Linux and application log investigation platform.

## Architecture & Layout

```
backend/
├── app/
│   ├── __init__.py             # App package descriptor
│   ├── main.py                 # FastAPI entry point & router aggregation
│   ├── config.py               # Pydantic Settings & environment variables
│   ├── api/
│   │   ├── __init__.py         # API routes package
│   │   ├── health.py           # Health check endpoint (GET /api/health)
│   │   ├── llm.py              # LLM connectivity endpoint (POST /api/llm/test)
│   │   ├── logs.py             # Log ingestion endpoint (POST /api/logs/parse)
│   │   ├── knowledge.py        # BM25 knowledge search endpoint (POST /api/knowledge/search)
│   │   ├── investigations.py   # AI incident investigation endpoint (POST /api/investigations/analyze)
│   │   └── react.py            # Controlled ReAct investigation endpoint (POST /api/investigations/react)
│   ├── knowledge/
│   │   ├── __init__.py         # Curated knowledge base package
│   │   └── repository.py       # Sourced runbooks (SSH, sudo, web, MAC, kernel OOM)
│   ├── schemas/
│   │   ├── __init__.py         # Pydantic schemas package
│   │   ├── logs.py             # Log events and parsing summary schemas
│   │   ├── retrieval.py        # Knowledge query and search result schemas
│   │   ├── investigation.py    # Forensic investigation and hypothesis schemas
│   │   └── react.py            # ReAct tool args, audit steps & investigation schemas
│   └── services/
│       ├── __init__.py         # Services package
│       ├── gemini_service.py   # Isolated Google GenAI client & generation logic
│       ├── log_parser.py       # Deterministic log parser & heuristic security engine
│       ├── retrieval_service.py # Deterministic Okapi BM25 lexical retrieval engine
│       ├── correlation_service.py # Entity grouping, timeline & pattern detection
│       ├── investigation_service.py # Grounded prompt synthesis & Gemini orchestration
│       └── react_agent.py      # Controlled ReAct loop orchestrator & sandboxed tools
├── tests/
│   ├── __init__.py             # Test package
│   ├── test_health.py          # Automated tests for health and root endpoints
│   ├── test_llm.py             # Mocked tests for LLM validation & error handling
│   ├── test_logs.py            # Automated tests for all log formats & heuristics
│   ├── test_knowledge.py       # Automated tests for BM25 ranking & source metadata
│   ├── test_investigations.py  # Automated tests for correlation, RAG & AI investigation
│   └── test_react.py           # Automated tests for ReAct tools, loop limits & safety
├── .env.example                # Environment variables template
├── .gitignore                  # Backend gitignore (.env, .venv, caches)
├── requirements.txt            # Python dependencies (FastAPI, google-genai, etc.)
└── README.md                   # Backend documentation
```

---

## Getting Started (Local Development)

### 1. Prerequisites
- Python 3.10+ (Python 3.11+ recommended)

### 2. Set Up a Virtual Environment

Always use an isolated virtual environment rather than installing packages globally:

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment named .venv
python3 -m venv .venv

# Activate the virtual environment
# On macOS / Linux:
source .venv/bin/activate

# On Windows (PowerShell):
# .venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

With the virtual environment activated, install dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to configure your Gemini settings:

```dotenv
# Server configuration
HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=info

# Security / CORS Configuration (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173

# Google Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=30
```

> [!IMPORTANT]
> **Quota Notice:** Real API requests to Google Gemini consume your API quota. Keep test prompts concise.
>
> **Security:** Never commit `.env` or paste live API keys into public repositories. `.env` is strictly excluded by `.gitignore`.

#### Supported Models
The configured `GEMINI_MODEL` must be one of:
- `gemini-2.5-flash` *(default)*
- `gemini-2.5-pro`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

---

## 5. Run the Backend Server

Start the development server with live reload:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 6. API Endpoints & Testing

### Interactive Documentation (Swagger UI)
Visit [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs) to explore and interactively test endpoints.

### 1. Health Check (`GET /api/health`)
Returns backend operational status and service metadata.
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

### 2. LLM Connectivity Test (`POST /api/llm/test`)
Tests isolated communication with the configured Gemini model using a bounded prompt. Does not transmit uploaded user logs.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/llm/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain the role of /var/log/auth.log in Linux system security in one sentence."}'
```

### 3. Log Upload & Normalization (`POST /api/logs/parse`)
Uploads and parses multiple `.log`, `.txt`, `.json`, `.csv`, or `.jsonl` files (up to 25 MB each). Returns structured events with source line numbers, severity, and rule-based suspicious indicator flags.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/logs/parse \
  -F "files=@/var/log/auth.log" \
  -F "files=@app_events.jsonl"
```

**Example Response:**
```json
{
  "status": "success",
  "total_files": 2,
  "total_events": 142,
  "total_suspicious": 3,
  "summaries": [
    {
      "file_name": "auth.log",
      "file_size_bytes": 14502,
      "total_lines": 120,
      "parsed_count": 120,
      "partial_count": 0,
      "unparsed_count": 0,
      "suspicious_count": 3,
      "warnings": [],
      "truncated": false
    }
  ],
  "events": [
    {
      "event_id": "evt-7a3b4c12-L1",
      "file_name": "auth.log",
      "line_number": 1,
      "timestamp": "Oct 27 06:15:19",
      "host": "srv-edge-linux01",
      "service": "sshd[1234]",
      "severity": "warning",
      "message": "Failed password for invalid user admin from 198.51.100.44 port 22",
      "raw_line": "Oct 27 06:15:19 srv-edge-linux01 sshd[1234]: Failed password for invalid user admin from 198.51.100.44 port 22",
      "parse_status": "parsed",
      "suspicious_flags": [
        {
          "rule_id": "AUTH_BRUTE_FORCE",
          "category": "Credential Access",
          "description": "Failed authentication attempt indicating brute force or credential guessing",
          "indicator": "T1110 - Brute Force"
        }
      ]
    }
  ],
  "is_truncated": false
}
```

### 4. Knowledge Base Search & RAG References (`POST /api/knowledge/search`)
Performs deterministic **Okapi BM25** lexical retrieval over curated Linux runbooks without external vector databases or embedding APIs. Returns ranked passages with stable document IDs and authoritative source citations.

**Supported Topics:**
- `KB-SSH-AUTH-001`: OpenSSH authentication failures and brute force login triage.
- `KB-SUDO-PRIV-002`: Sudo privilege escalation and authorization failures.
- `KB-WEB-TRAVERSAL-003`: Web server path traversal and sensitive file probe investigation.
- `KB-MAC-DENIAL-004`: AppArmor and SELinux Mandatory Access Control (MAC) denials.
- `KB-KERNEL-OOM-005`: Linux kernel panic, segfaults, and Out-of-Memory (OOM) killer events.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "SSH failed password brute force login attempts", "top_k": 3}'
```

**Example Response:**
```json
{
  "status": "success",
  "query": "SSH failed password brute force login attempts",
  "total_matched": 1,
  "results": [
    {
      "doc_id": "KB-SSH-AUTH-001",
      "title": "OpenSSH Authentication Failures and Repeated Login Attempt Triage",
      "category": "Authentication & Access Control",
      "content": "OpenSSH authentication failures typically manifest in syslog (/var/log/auth.log...",
      "score": 4.1205,
      "source_metadata": {
        "document_id": "KB-SSH-AUTH-001",
        "references": [
          "OpenSSH sshd(8) Manual Pages",
          "Debian Security Guide: Securing OpenSSH",
          "NIST SP 800-123 Guide to General Server Security"
        ],
        "attribution": "Curated LogSleuth Educational Reference Guide",
        "version": "2026-10 / Rev 1.0"
      }
    }
  ]
}
```

> [!NOTE]
> **Guidance & Attribution:** Knowledge base documents provide educational reference material. Retrieved runbooks do not independently prove that an intrusion occurred; evidence must be substantiated by exact lines from ingested logs.

### 5. AI Incident Investigation & Root Cause Dossier (`POST /api/investigations/analyze`)
Combines in-memory log parsing, deterministic evidence correlation, BM25 RAG runbook retrieval, and low-temperature Gemini reasoning to generate a structured incident investigation report.

**API Contract:**
- **Request Type:** Multipart Form Data (`multipart/form-data`)
  - `files`: One or more raw log files (`.log`, `.txt`, `.json`, `.csv`, `.jsonl` up to 25 MB each).
  - `strategy`: Prompt strategy (`"grounded_analysis"` [default] or `"few_shot"`).
  - `focus_query`: (Optional) Targeted hypothesis or focus area.
- **Prompt Strategies:**
  - `grounded_analysis` (v1): Four-phase structured reasoning protocol (Correlation $\rightarrow$ RAG runbook grounding $\rightarrow$ Alternative benign explanations $\rightarrow$ Line citation verification).
  - `few_shot` (v1): Role/persona prompting with explicit incident analysis exemplars.
- **Security & Prompt Injection Invariant:**
  - Raw log strings are strictly encapsulated within `<UNTRUSTED_CORRELATED_LOGS>` boundary tags.
  - The model is instructed under strict system instructions that log messages are unverified external telemetry and must never be interpreted as commands or prompt instructions.
  - No shell commands are executed, and uploaded files are processed strictly in memory.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/investigations/analyze \
  -F "files=@/var/log/auth.log" \
  -F "strategy=grounded_analysis" \
  -F "focus_query=Investigate root privilege escalation"
```

**Example Response:**
```json
{
  "investigation_id": "inv-8c2f1a09",
  "created_at": "2026-10-28T00:25:00.000Z",
  "prompt_strategy": "grounded_analysis",
  "executive_summary": "Correlated telemetry indicates repeated authentication failures from 198.51.100.44 followed by an unauthorized sudo invocation by user 'guest'.",
  "assessed_severity": "high",
  "severity_justification": "External brute-force activity coincided with unauthorized root command execution attempts.",
  "confidence_level": "high",
  "confidence_justification": "Evidence is directly supported by RFC-3164 syslog entries in auth.log.",
  "correlated_findings": [
    {
      "finding_id": "FIND-AUTH-01",
      "title": "Authentication Failure Sequence (198.51.100.44)",
      "pattern_type": "Authentication Anomaly",
      "description": "Detected 8 authentication failure(s) from origin '198.51.100.44'.",
      "evidence_references": [
        {
          "event_id": "evt-7a3b4c12-L1",
          "file_name": "auth.log",
          "line_number": 1,
          "raw_snippet": "Oct 27 06:15:19 srv sshd[123]: Failed password for invalid user admin"
        }
      ]
    }
  ],
  "timeline": [
    {
      "timestamp": "Oct 27 06:15:19",
      "event_id": "evt-7a3b4c12-L1",
      "file_name": "auth.log",
      "line_number": 1,
      "service": "sshd[123]",
      "summary": "Failed password for invalid user admin from 198.51.100.44 port 22"
    }
  ],
  "hypotheses": [
    {
      "hypothesis_id": "H1",
      "title": "External Reconnaissance & Internal Escalation Attempt",
      "explanation": "Adversary probed SSH, and an unprivileged local account attempted sudo access.",
      "supporting_evidence": ["Line 1: Failed password", "Line 3: not in sudoers"],
      "contradicting_or_alternative_evidence": ["No Accepted login recorded for the external IP."],
      "verdict": "likely"
    }
  ],
  "retrieved_knowledge": [
    {
      "doc_id": "KB-SSH-AUTH-001",
      "title": "OpenSSH Authentication Failures and Repeated Login Attempt Triage",
      "category": "Authentication & Access Control",
      "relevance_summary": "OpenSSH authentication failures typically manifest in syslog...",
      "references": ["OpenSSH sshd(8) Manual Pages", "Debian Security Guide"]
    }
  ],
  "recommended_actions": [
    "Block IP 198.51.100.44 at the firewall level.",
    "Verify user 'guest' account credentials and review bash history."
  ],
  "limitations_and_uncertainty": [
    "Process accounting (auditd) and bash history files were not included in the provided log stream."
  ],
  "model_used": "gemini-2.5-flash",
  "total_log_lines_analyzed": 3,
  "total_evidence_citations": 3
}
```

### 6. Controlled ReAct Autonomous Investigation (`POST /api/investigations/react`)
Executes an autonomous, evidence-grounded **ReAct (Observe $\rightarrow$ Action $\rightarrow$ Observation $\rightarrow$ Final Answer)** reasoning loop. The model methodically inspects anomalous telemetry using a strict allowlist of sandboxed read-only tools before producing a final forensic dossier.

#### ReAct Loop Lifecycle & State Machine
1. **Initial Observation:** Correlates uploaded log telemetry deterministically, clusters anomaly candidates, and pre-seeds relevant knowledge base runbooks.
2. **Action Turn:** Model selects an allowlisted tool with strictly validated arguments, or outputs a `final_answer` concluding the investigation.
3. **Execution & Containment:** The backend validates tool arguments via Pydantic schemas (`extra="forbid"`), runs the read-only in-memory tool, and wraps observations in `<UNTRUSTED_OBSERVATION>` delimiters.
4. **Safety & Loop Guards:**
   - **Maximum Budget:** Enforces a hard limit of **at most 5 tool calls** per investigation.
   - **Repeated Call Detection:** Identifies identical tool invocations and immediately halts with status `repeated_call` to prevent infinite loops and token waste.
   - **Prompt Injection Defense:** Model is instructed under invariant rules that log lines and tool observations are untrusted telemetry and must never be interpreted as instructions.
   - **Auditability:** Hidden chain-of-thought traces are never recorded or exposed. Only concise action descriptions, validated tool inputs, observation summaries, and cited event IDs are saved in the transparent audit trail.

#### Safe Read-Only Allowlisted Tools
All tools operate exclusively on in-memory parsed log events and the local BM25 index. Arbitrary filesystem access, shell execution, code evaluation, and outbound network calls are strictly prohibited.

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_log_events` | `keyword`, `service`, `severity`, `ip`, `source_ip`, `limit` (1–50) | Filters in-memory parsed log events by keyword, service, severity level, or source IP address. |
| `correlate_time_window` | `target_event_id`, `target_timestamp`, `window_seconds` (10–3600), `limit` (1–50) | Correlates and returns events occurring within a bounded time window around an anchor event or timestamp. |
| `retrieve_runbook` | `query` (1–200 chars), `top_k` (1–5) | Searches the local Okapi BM25 index for authoritative Linux troubleshooting and incident runbooks. |
| `inspect_event_evidence` | `event_id` (e.g., `evt-7a3b4c12-L1`) | Retrieves the exact raw log line, original file, line number, and triggered security heuristic flags for a specific event. |

#### Request Contract
- **Method:** `POST /api/investigations/react`
- **Request Type:** Multipart Form Data (`multipart/form-data`)
  - `files`: One or more raw log files (`.log`, `.txt`, `.json`, `.csv`, `.jsonl` up to 25 MB each, max 100 MB batch).
  - `focus_query`: (Optional) Focused investigation question or hypothesis.
  - `max_tool_calls`: (Optional) Budget limit for tool executions (default `5`, max `5`).

#### Response Contract (`ReActInvestigationResponse`)
```json
{
  "investigation_id": "react-8c2f1a09",
  "status": "completed",
  "stop_reason": "Agent completed evidence gathering and concluded at step 3.",
  "tool_calls_count": 2,
  "investigation_summary": "ReAct agent confirmed external SSH credential stuffing followed by unauthorized sudo invocation.",
  "executive_summary": "ReAct agent confirmed external SSH credential stuffing followed by unauthorized sudo invocation.",
  "assessed_severity": "high",
  "confidence_level": "high",
  "findings": [
    {
      "finding_id": "FIND-AUTH-01",
      "title": "Authentication Failure Sequence (198.51.100.44)",
      "pattern_type": "Authentication Anomaly",
      "description": "Detected 8 authentication failure(s) from origin '198.51.100.44'.",
      "evidence_references": [
        {
          "event_id": "evt-7a3b4c12-L1",
          "file_name": "auth.log",
          "line_number": 1,
          "raw_snippet": "Oct 27 06:15:19 srv sshd[123]: Failed password for invalid user admin"
        }
      ]
    }
  ],
  "retrieved_knowledge": [
    {
      "doc_id": "KB-SSH-AUTH-001",
      "title": "OpenSSH Authentication Failures and Repeated Login Attempt Triage",
      "category": "Authentication & Access Control",
      "relevance_summary": "OpenSSH authentication failures typically manifest in syslog...",
      "references": ["OpenSSH sshd(8) Manual Pages", "Debian Security Guide"]
    }
  ],
  "audit_trail": [
    {
      "step_number": 1,
      "action_description": "Search log events for SSH authentication failures",
      "tool_name": "search_log_events",
      "tool_input": {
        "keyword": "Failed password",
        "limit": 5
      },
      "tool_output_summary": "Found 2 match(es), returning top 2:\n[evt-auth-L1] L1 Oct 27 06:15:19 sshd: Failed password...",
      "evidence_event_ids": ["evt-auth-L1", "evt-auth-L2"]
    },
    {
      "step_number": 2,
      "action_description": "Retrieve authoritative runbook for SSH brute force mitigation",
      "tool_name": "retrieve_runbook",
      "tool_input": {
        "query": "SSH authentication brute force failed password",
        "top_k": 1
      },
      "tool_output_summary": "Retrieved 1 runbook(s):\n[KB-SSH-AUTH-001] OpenSSH Authentication Failures...",
      "evidence_event_ids": ["KB-SSH-AUTH-001"]
    }
  ],
  "hypotheses": [
    {
      "hypothesis_id": "H1",
      "title": "Brute Force and Unauthorized Privilege Escalation Attempt",
      "explanation": "External IP 198.51.100.44 attempted dictionary attacks against admin/root, and attacker attempted sudo.",
      "supporting_evidence": ["Line 1-2: Failed passwords", "Line 3: sudo denial"],
      "contradicting_or_alternative_evidence": ["No evidence of successful login"],
      "verdict": "likely"
    }
  ],
  "recommended_actions": [
    "Block IP 198.51.100.44 using iptables/nftables.",
    "Revoke unprivileged shell access for user 'attacker'."
  ],
  "limitations_and_uncertainty": [
    "Analysis bounded strictly to in-memory uploaded log files."
  ],
  "model_used": "gemini-2.5-flash",
  "total_log_lines_analyzed": 3
}
```

#### Reliability & Cost Controls
- **Gemini Configuration:** Reuses the centralized, secure `gemini_service` and `GEMINI_MODEL` setting.
- **Budget Enforced:** Hard cap of at most 5 tool calls and 1500 maximum tokens per turn.
- **Timeouts:** All Gemini API invocations are bounded by `GEMINI_TIMEOUT_SECONDS`.
- **Failure Transparency:** Missing API keys return HTTP `503`, upstream quota/rate limits return HTTP `502`, and malformed model outputs return HTTP `502`. A model or tool failure never silently reports success.

---

## Running Automated Tests

The test suite uses `pytest` with deterministic mocked Gemini responses, in-memory log fixtures, and BM25 tests. **A live Gemini API key is not required to run automated tests.**

```bash
# Make sure virtual environment is active
pytest -v
```

The 55 automated unit and integration tests verify:
- Health and root endpoint behavior (200).
- Input validation (empty prompts and prompt-length limits).
- Missing `GEMINI_API_KEY` configuration error handling (503).
- Unsupported model detection (503).
- Successful generation with token usage extraction (200).
- Upstream quota and authentication error handling (502).
- Network and request timeouts (502).
- Multi-format log ingestion (RFC-3164, RFC-5424, ISO-8601, JSON, JSONL, CSV, Web Access).
- Security heuristics (Brute Force, Sudo Abuse, MAC Denial, Path Traversal, Scanners, OOM).
- Deterministic BM25 retrieval for SSH, sudo, web, MAC, and kernel topics.
- BM25 ranking ordering and query validation bounds.
- Empty knowledge base behavior and stable source attribution.
- Deterministic event correlation and exact line citations.
- Grounded analysis and few-shot prompt strategy switching (`POST /api/investigations/analyze`).
- Full AI incident investigation report generation.
- ReAct read-only tool behaviors (`search_log_events`, `correlate_time_window`, `retrieve_runbook`, `inspect_event_evidence`).
- Strict ReAct tool validation, unknown tool rejection, and forbidden extra arguments.
- ReAct loop budget enforcement (max 5 tool calls) and `limit_reached` handling.
- Repeated identical tool call detection and safe loop termination (`repeated_call`).
- Evidence citation integrity, event ID preservation, and explicit uncertainty declarations.
- Prompt-injection defense handling for adversarial log inputs.
- Graceful Gemini quota and malformed JSON error handling across both endpoints.
- End-to-end multi-step ReAct investigation execution (`POST /api/investigations/react`).
