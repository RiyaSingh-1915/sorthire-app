# SortHire — AI Job Application Sorting Platform

An end-to-end app that ingests your resume, ingests job postings, and uses
embeddings + LLM reasoning to sort every job into **Apply (green)** or
**Skip (red)**, enriched with company, salary, and commute data.

This repo is a complete, working scaffold. The parsing, embedding-matching,
scoring, and API wiring are real and run locally. The three categories of
external paid APIs (LLM, Maps, Company/Image data) are wired through a single
adapter layer (`backend/app/services/*`) with clear `TODO(key)` markers —
drop your keys into `.env` and they go live; until then they fall back to
graceful mocked/partial responses so the app still runs end-to-end in dev.

---

## 1. Architecture

```
                      ┌────────────────────────┐
                      │   Next.js 15 Frontend   │
                      │  (TS, Tailwind, Shadcn) │
                      └───────────┬─────────────┘
                                  │ REST (fetch) + Supabase JS (auth/storage)
                                  ▼
                      ┌────────────────────────┐
                      │      FastAPI Backend    │
                      │  routers/ + services/   │
                      └──┬───────┬───────┬──────┘
                         │       │       │
             ┌───────────┘   ┌───┘   ┌───┘
             ▼               ▼       ▼
     Supabase Postgres  Sentence-   OpenAI/Claude
     (+ Storage for      Transformers  (ATS + resume
      resume files)      (local        advice + job
                          embeddings)   description parsing)
                                  │
                         Google Maps / Clearbit /
                         Wikipedia / Bing Images
                         (company + office enrichment)
```

**Clean-architecture layering (backend):**
- `routers/` — HTTP boundary only (validation via Pydantic, calls services)
- `services/` — all business logic, framework-agnostic, unit-testable
- `db/` — Supabase/Postgres access, isolated behind a repository-style client
- `models/` — Pydantic schemas shared across routers/services

This separation is what makes the "Future Ready: auto-apply" requirement
cheap later: auto-apply becomes a new `services/auto_apply.py` that consumes
the same `MatchResult` objects the dashboard already renders — no other
layer needs to change.

## 2. Tech stack (as specified)

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style components |
| Backend | FastAPI (Python 3.11+) |
| DB | Supabase Postgres (schema in `backend/app/db/schema.sql`) |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| AI reasoning | OpenAI or Anthropic (Claude) — pluggable via `LLM_PROVIDER` env var |
| Resume parsing | PyMuPDF (text extraction) + spaCy (NER for skills/edu/experience) |
| Job matching | `sentence-transformers` (`all-MiniLM-L6-v2`) cosine similarity |
| Maps | Google Maps Distance Matrix + Static Maps / Embed API |
| Company data | Clearbit Logo/Company API → Crunchbase → Wikipedia REST fallback chain |
| Images | Bing Image Search API (Google Custom Search as secondary) |

## 3. Setup

### 3.1 Supabase
1. Create a project at supabase.com.
2. Run `backend/app/db/schema.sql` in the SQL editor.
3. Enable **Google** provider under Authentication → Providers.
4. Create a Storage bucket named `resumes` (private).
5. Copy your `Project URL`, `anon` key, and `service_role` key.

### 3.2 Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env   # fill in the keys below
uvicorn app.main:app --reload --port 8000
```

### 3.3 Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

## 4. Environment variables

`backend/.env`
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=openai            # or "anthropic"
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
CLEARBIT_API_KEY=
BING_IMAGE_SEARCH_KEY=
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

`frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=
```

## 5. What's real vs. what's a plug point

| Feature | Status |
|---|---|
| Resume upload, permanent storage, replace-on-reupload | ✅ fully implemented |
| Resume parsing (skills/education/experience/projects) | ✅ real PyMuPDF + spaCy pipeline |
| Job CRUD (unlimited jobs) | ✅ fully implemented |
| Match score, skill match, missing skills | ✅ real embeddings + set-diff logic |
| Green/Red classification + reasoning | ✅ real, threshold configurable |
| ATS score + resume improvement suggestions | ⚙️ real pipeline, calls LLM adapter — needs your API key |
| Company profile (CEO, size, funding stage, culture ratings) | ⚙️ real fallback chain (Clearbit → Crunchbase → Wikipedia) — needs your keys; culture/ratings fields are sourced from a `company_overrides` table you can hand-curate or later wire to Glassdoor-style data (no public free API exists for this — see note in `company_info.py`) |
| Office / commute / nearest station / map | ⚙️ real Google Maps Distance Matrix call — needs your key |
| Workplace photos | ⚙️ real Bing Image Search call — needs your key |
| Analytics dashboard | ✅ fully implemented, computed from stored match results |
| Auth (Google + Email) | ✅ fully implemented via Supabase Auth |
| Dark/light glassmorphism UI, skeletons, filters | ✅ fully implemented |

## 6. Design system

- **Palette**: ink `#0B1020` / paper `#F6F4EF` bases, signal accent `#6C5CE7`
  (electric violet — "AI reasoning"), functional greens (`#1FB574` apply) and
  roses (`#F0455C` skip) that are semantic, not decorative.
- **Type**: Space Grotesk (display) + Inter (UI) + JetBrains Mono (scores/data).
- **Signature element**: the **Match Ring** — a circular radar-style gauge
  used everywhere a score is shown (dashboard cards, job detail, ATS score),
  so "matching" has one consistent visual language across the app.

## 7. Repo layout
```
frontend/   Next.js app
backend/    FastAPI app
backend/app/db/schema.sql   Postgres schema (run in Supabase SQL editor)
```
