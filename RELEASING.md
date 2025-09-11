# Public Release Checklist

Use this checklist to prepare this repository for public, free distribution.

- License
  - The project is licensed under MIT. See `LICENSE`.

- Secrets and Config
  - Never commit real secrets. Use env templates and local `.env` files only.
  - Python API: copy `backend/python-api/.env.example` to `.env` and fill values.
  - Node API: copy `backend/nodejs-api/.env.example` to `.env` and fill values.

- Generated Artifacts
  - Do NOT commit generated files such as:
    - `backend/python-api/app.db` (SQLite DB)
    - `backend/python-api/app/data/faiss/*` (FAISS index/id files)
  - Build RAG indices and databases locally as needed.

- History Hygiene (recommended)
  - If any secrets were ever committed, rewrite history and rotate keys:
    - Prefer `git filter-repo` (https://github.com/newren/git-filter-repo)
    - Alternatively, use `git filter-branch` with care
  - After rewriting, force-push to a new public repo and rotate all affected credentials.

- Third-party Materials
  - Ensure documents, images, or datasets included in the repo are redistributable.
  - If not, remove them or replace with public domain/sample assets and update docs.

- Publishing
  - Create a new public repository (GitHub/GitLab, etc.).
  - Push the cleaned repository.
  - Add a release tag and changelog notes if desired.

