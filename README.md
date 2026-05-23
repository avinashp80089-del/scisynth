# SciSynth

**AI-native scientific research synthesis platform.**

SciSynth helps researchers move from paper discovery to deep understanding at scale — combining arXiv integration, Claude-powered analysis, literature review generation, and RAG-based research chat into a single cohesive workflow.

---

## Features

| Feature | Description |
|---|---|
| **Paper Discovery** | Search arXiv and import papers into a persistent local library |
| **Deep Analysis** | Structured AI extraction of methods, findings, key contributions, and limitations |
| **Literature Review** | Multi-paper synthesis streamed as a thematic, structured review |
| **Research Chat** | Evidence-grounded Q&A over your library using TF-IDF retrieval + Claude |
| **Hypothesis Generation** | Novel, testable research directions surfaced from your corpus |

---

## Architecture

```
scisynth/
├── backend/            # FastAPI — Python 3.11
│   └── app/
│       ├── api/        # REST + streaming endpoints
│       ├── services/   # arXiv, Claude, retrieval
│       ├── models/     # Pydantic schemas
│       ├── database.py # aiosqlite persistence
│       └── main.py     # App entrypoint
├── frontend/           # React 18 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/      # Library, Analysis, Synthesis, Chat
│       ├── components/ # PaperCard, Layout
│       └── services/   # Typed API client with streaming support
├── docker-compose.yml
└── .github/workflows/ci.yml
```

**Key design choices:**

- **Prompt caching** on Claude's system prompt reduces latency and cost on repeated calls
- **Streaming responses** via `text/plain` chunked transfer for synthesis and chat
- **TF-IDF retrieval** (no external embedding API) ranks relevant papers for RAG context
- **SQLite + aiosqlite** for zero-dependency persistence suitable for local and edge deployment
- **Async throughout** — FastAPI lifespan, async DB layer, async HTTP to arXiv

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`. Interactive docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

### Docker

```bash
ANTHROPIC_API_KEY=sk-ant-... docker compose up --build
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/papers/search?q=` | Search arXiv |
| `POST` | `/papers/{arxiv_id}` | Add paper to library |
| `GET` | `/papers` | List library |
| `DELETE` | `/papers/{id}` | Remove from library |
| `POST` | `/analysis/{paper_id}` | Run AI analysis |
| `GET` | `/analysis/{paper_id}` | Fetch cached analysis |
| `POST` | `/analysis/hypotheses/generate` | Generate research hypotheses |
| `POST` | `/synthesis` | Stream literature review |
| `POST` | `/chat` | Stream research chat |

---

## Development

```bash
# Backend lint + type check
cd backend && pip install ruff mypy
ruff check app/ && mypy app/ --ignore-missing-imports

# Frontend type check
cd frontend && npx tsc --noEmit
```

CI runs on every push via GitHub Actions (`.github/workflows/ci.yml`).

---

## Roadmap

- [ ] PDF full-text extraction and chunked ingestion
- [ ] Semantic Scholar / PubMed integrations
- [ ] Persistent vector store (pgvector / Chroma) for larger corpora
- [ ] Collaborative libraries and shared workspaces
- [ ] Citation graph visualization
- [ ] Export reviews to LaTeX / Notion

---

## License

MIT
