# DevOps MERN — Learning Roadmap (Step-by-Step)

> Derived from `devops-mern-project-plan.md`. This version breaks every phase into
> **small, single-purpose steps**. We do ONE step at a time:
> 1. I explain what the step is and (if you want) help you build it.
> 2. You implement/run it.
> 3. I give you a way to **test/verify** it works.
> 4. You confirm "done" → we move to the next step.

## MongoDB Connection String — SECURITY NOTE

**Never write real connection strings, passwords, or API keys in this file (or any
committed file).** This file is committed to a public GitHub repo, so anything
written here is public.

Rules going forward:
- Real secrets only ever go in `server/.env` (gitignored, never committed).
- Committed files (`.env.example`, this roadmap, docs) only ever contain the
  variable *name*, never the value.
- The database is named `devops` (not `bharmani_diamonds` — we never touch that data).
- If a real secret is ever accidentally committed and pushed, treat it as compromised
  immediately: rotate/change it right away, don't just remove it from the file (git
  history still has it, and public repos get scraped by bots within minutes).

---

## Phase 0 — App Setup (build it, run it locally)

- [x] **0.1** Project scaffolding: root folder, `client/` + `server/` dirs, git init, root `.gitignore`
- [x] **0.2** Backend hello-world: Express server + `/health` route, runs with `npm run dev`
- [x] **0.3** Connect backend to MongoDB Atlas (`devops` db) via `.env` + Mongoose
- [x] **0.4** `User` model (Mongoose schema: name, email, passwordHash)
- [x] **0.5** `POST /api/auth/signup` — validation + bcrypt hashing + save user
- [x] **0.6** `POST /api/auth/login` — verify password + issue JWT
- [x] **0.7** Auth middleware (verify JWT) + `GET /api/dashboard` protected route
- [x] **0.8** Frontend scaffold: Vite + React, basic routing (`react-router-dom`)
- [x] **0.9** Signup page (form + client-side validation + axios call)
- [x] **0.10** Login page (form + store JWT + redirect)
- [x] **0.11** Dashboard page (protected route, fetches `/api/dashboard`, redirects to login if no token)

## Phase 1 — Testing

- [x] **1.1** Backend test setup: Jest + Supertest config, one trivial passing test
- [x] **1.2** Signup route tests (valid input, weak password rejected, duplicate email rejected)
- [x] **1.3** Login route tests (correct creds, wrong password, unknown user)
- [x] **1.4** Dashboard route tests (valid token, missing token, invalid token)
- [x] **1.5** Frontend test setup: Vitest + React Testing Library, one trivial passing test
- [x] **1.6** Form validation tests (Signup/Login components)

## Phase 2 — Dockerize

- [ ] **2.1** `server/Dockerfile` (multi-stage) — build + run backend in a container
- [ ] **2.2** `client/Dockerfile` — build static assets + serve
- [ ] **2.3** `docker-compose.yml` — run client + server together (Atlas stays external)
- [ ] **2.4** Add `HEALTHCHECK` to both Dockerfiles

## Phase 3 — CI (GitHub Actions)

- [ ] **3.1** `.github/workflows/ci.yml` — checkout + install + lint (server job)
- [ ] **3.2** Add backend test step to CI
- [ ] **3.3** Add frontend job (install + lint + test + build)
- [ ] **3.4** Add Docker build step (no push) to CI
- [ ] **3.5** Add status badge to README

## Phase 4 — CD (Deployment)

- [ ] **4.1** Decide target (Docker Hub + Render/Railway vs VPS) — discuss tradeoffs
- [ ] **4.2** Add GitHub Secrets (Docker Hub creds, Mongo URI, JWT secret)
- [ ] **4.3** `.github/workflows/cd.yml` — build & push images on merge to `main`
- [ ] **4.4** Deploy step (PaaS deploy hook OR SSH + `docker compose pull/up`)

## Phase 5 — Monitoring

- [ ] **5.1** Add `prom-client`, expose `/metrics`
- [ ] **5.2** `prometheus` service in compose + `monitoring/prometheus.yml` scrape config
- [ ] **5.3** `grafana` service, connect Prometheus as data source
- [ ] **5.4** Build a basic dashboard (request rate, latency, error rate)
- [ ] **5.5** (Stretch) Alert rule for error rate

## Phase 6 — Polish

- [ ] **6.1** Morgan + Winston logging
- [ ] **6.2** `express-rate-limit` on auth routes
- [ ] **6.3** Nginx reverse proxy (prod)
- [ ] **6.4** Image tagging strategy (git SHA)
- [ ] **6.5** (Stretch) Kubernetes manifests
- [ ] **6.6** (Stretch) Terraform for infra

---

## How We'll Work

- I present ONE numbered step at a time with clear instructions.
- You tell me if you want me to **write the code** for that step, or if you want to **write it yourself** with me reviewing/explaining.
- After you implement it, I give you exact commands/checks to verify it works.
- You reply "done" (or paste errors) → we move to the next numbered step.
