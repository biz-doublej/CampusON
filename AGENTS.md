# Repository Guidelines

This guide explains how this repo is organized and how to build, test, and contribute effectively.

## Project Structure & Module Organization
- `frontend/` — Next.js app (pages, src/services, components, config). Env: `frontend/.env.local`.
- `backend/python-api/` — FastAPI services (parser, AI, RAG/FAISS, community v2). Env: `.env`.
- `backend/nodejs-api/` — Express/TypeScript auth and utility APIs.
- `backend/csharp-api/` — Optional .NET API sample.
- `database/`, `docker/`, `scripts/`, `docs/` — infra, helpers, and documentation.

## Build, Test, and Development Commands
- Frontend
  - `cd frontend && npm i && npm run dev` — run Next.js on port 3000.
- Python API
  - `cd backend/python-api && pip install -r requirements.txt`
  - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8001` — run FastAPI.
  - Optional: `OPENAI_API_KEY`, `GEMINI_API_KEY` enable AI/RAG features.
- Node API
  - `cd backend/nodejs-api && npm i && npm run dev` — run Express/TS on port 3001.

## Coding Style & Naming Conventions
- TypeScript/JS: prefer ESLint/Prettier defaults; use PascalCase for components, camelCase for vars.
- Python: PEP8 style; snake_case for modules/vars; keep functions small and typed where possible.
- Filenames: use kebab-case in `pages/` routes and snake_case for Python modules.

## Testing Guidelines
- Frontend: use Jest/React Testing Library where applicable (`npm test`).
- Python API: add tests in `backend/python-api/tests/` and run via `pytest`.
- Node API: `npm test` (Jest). Keep unit tests close to modules; name as `*.test.*`.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (e.g., "Add RAG query endpoint"), body for rationale.
- PRs: include purpose, linked issues, screenshots/logs, and test notes. Keep diffs focused and scoped.

## Security & Configuration Tips
- Do not commit secrets. Use `.env` files: `NEXT_PUBLIC_PARSER_API_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`.
- For local RAG: build index via `POST /api/ai/rag/build` after ingest.

## Agent-Specific Instructions
- Prefer minimal, surgical changes; follow existing patterns and directory layout.
- Validate long-running routes with redirects to avoid loops; normalize department paths under `frontend/pages/department/`.
