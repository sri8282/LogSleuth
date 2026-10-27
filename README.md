# LogSleuth AI

**AI-Powered Linux Log Analysis and Investigation Platform**

LogSleuth AI is a web-based log investigation platform designed to help analyze Linux and application logs, identify suspicious events, correlate related activity, retrieve relevant troubleshooting guidance, and generate evidence-grounded investigation reports.

The project combines deterministic log processing, retrieval-based knowledge lookup, and Large Language Model (LLM) analysis to make log investigations more structured and explainable.

## Features

- **Log ingestion and parsing:** Upload supported log files and normalize events into structured records.
- **Suspicious event detection:** Identify potentially suspicious authentication activity, errors, and other indicators.
- **AI-powered investigation:** Analyze log evidence and produce structured findings and recommendations.
- **ReAct investigation mode:** Use a controlled tool-based investigation workflow to inspect events and retrieve relevant evidence.
- **Knowledge retrieval (RAG-style):** Search curated troubleshooting runbooks for relevant technical guidance.
- **Evidence references:** Connect findings to source log files, event identifiers, and line numbers where available.
- **Investigation dashboard:** Review findings, timelines, recommendations, and investigation details.
- **Sample data:** Explore the interface using the included demonstration data.

> LogSleuth AI is a diagnostic aid. Findings are not proof of a security incident, and recommendations should be reviewed before being applied to production systems.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Motion and Lucide icons

### Backend
- Python
- FastAPI
- Pydantic
- Google GenAI SDK
- BM25-based lexical retrieval
- Pytest

### AI and Investigation Techniques
- Grounded prompting
- Few-shot prompting
- Retrieval-augmented investigation using curated runbooks
- Controlled ReAct-style tool use
- Deterministic log parsing and event correlation

## Project Structure

```text
LogSleuth/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── knowledge/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Python 3.11 or another version supported by the backend dependencies
- Node.js and npm versions compatible with the frontend project
- Git
- A Google Gemini API key for live AI investigation

Check your installed versions:

```bash
python3 --version
node --version
npm --version
```

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/sri8282/LogSleuth.git
cd LogSleuth
```

### 2. Configure the backend

Open a terminal in the project root and run:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create your local environment file:

```bash
cp .env.example .env
```

Open `backend/.env` in your editor and configure the required Gemini API key and other settings using the variable names documented in `backend/.env.example` and the backend configuration.

**Security:** Never commit your real `.env` file, API key, or other credentials. Keep secrets on your local machine or in a suitable secret manager.

### 3. Start the backend

From the `backend/` directory, with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend should be available at:

- API base: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/api/health`
- Interactive API documentation: `http://127.0.0.1:8000/api/docs`

Keep this terminal open.

### 4. Start the frontend

Open a **second terminal window**:

```bash
cd ~/Documents/LogSleuth/frontend
npm ci
npm run dev
```

Use the local URL printed by Vite in the terminal. The port may vary depending on your local configuration.

The frontend's development proxy should route `/api` requests to the backend at `http://127.0.0.1:8000`.

Keep both the frontend and backend running while using the application.

## How LogSleuth AI Works

### Step 1: Log ingestion

The user uploads supported log files through the frontend. The backend validates and parses the uploaded content into structured events.

### Step 2: Event normalization

Parsed records include available fields such as timestamps, severity, service, message, source file, line number, and event identifier.

### Step 3: Suspicious activity and correlation

Deterministic processing identifies relevant indicators and correlates related events. These signals help the investigation focus on evidence rather than relying solely on an LLM.

### Step 4: Knowledge retrieval

The backend searches curated troubleshooting runbooks using BM25 lexical retrieval. Relevant documents can provide technical context for the investigation.

### Step 5: AI investigation

The Standard AI Analysis workflow sends relevant evidence and instructions to the configured Gemini model to produce structured findings.

The ReAct workflow can use a controlled set of read-only investigation tools, such as searching events, correlating time windows, retrieving runbooks, and inspecting event evidence.

### Step 6: Investigation results

The frontend displays the returned findings, evidence references, timelines, relevant runbooks, recommendations, and uncertainty information where available.

Findings should be checked against the original logs. An AI-generated explanation is not automatically a verified fact.

## Running Tests

### Backend tests

From the project root:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

The tests cover
