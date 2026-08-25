# CI Pipeline — Detailed Explanation

## File: `.github/workflows/ci.yml`

This document explains the **CI (Continuous Integration)** pipeline — what it does,
how it works, and why each job exists.

---

## What Is CI?

**CI = Continuous Integration**. It means: every time anyone pushes code to the repo,
automated checks run to verify the code is correct **before** it gets merged into
production. This catches bugs, lint errors, and broken builds early.

---

## When Does It Run?

```yaml
on:
  push:
    branches:
      - '**'        # Every push to ANY branch
  pull_request:
    branches:
      - main         # Every PR targeting main
```

Unlike the CD pipeline (which only runs on `main`), the CI pipeline runs on
**every branch** — so you catch issues even while working on a feature branch.

---

## The 4 Jobs

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ Server Job         │     │ Client Job         │     │ Merge Check Job    │
│ ───────────        │     │ ───────────        │     │ (non-main only)    │
│                    │     │                    │     │ ───────────────    │
│ 1. Checkout        │     │ 1. Checkout        │     │ Tries merging main │
│ 2. Setup Node 22   │     │ 2. Setup Node 22   │     │ into your branch   │
│ 3. npm ci          │     │ 3. npm ci          │     │ to detect conflicts│
│ 4. npm run lint    │     │ 4. npm run lint    │     │ before you PR.     │
│ 5. npm test (Jest) │     │ 5. npm test(Vitest)│     │                    │
│                    │     │ 6. npm run build   │     │                    │
└─────────┬──────────┘     └─────────┬──────────┘     └────────────────────┘
          │                          │
          ▼                          ▼
    ┌──────────────────────────────────────┐
    │ Docker Build Job (no push)           │
    │ ────────────────────────             │
    │ 1. Build server Dockerfile           │
    │ 2. Build client Dockerfile           │
    │ (Verifies images can be built,       │
    │  but does NOT push to any registry)  │
    └──────────────────────────────────────┘
```

---

## Job 1: Server — Lint & Test

```yaml
server:
  name: Server - Lint & Test
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: server
```

| Step | Command | Purpose |
| --- | --- | --- |
| Checkout | `actions/checkout@v4` | Download repo code |
| Setup Node | `actions/setup-node@v4` (node 22) | Install Node.js with npm cache |
| Install | `npm ci` | Clean install from lockfile (faster, deterministic) |
| Lint | `npm run lint` → `eslint .` | Check code style and potential errors |
| Test | `npm test` → `jest` | Run backend unit tests using Jest + Supertest |

**Why `npm ci` instead of `npm install`?**
- `npm ci` installs **exact versions** from `package-lock.json`
- Faster in CI (deletes `node_modules` first, no version resolution)
- Ensures everyone gets the same dependencies

**What the tests check:**
- API endpoints respond with correct status codes
- Authentication flows work (signup, login, invalid credentials)
- JWT tokens are generated and verified correctly
- Uses `mongodb-memory-server` (in-memory MongoDB, no real database needed)

---

## Job 2: Client — Lint, Test & Build

```yaml
client:
  name: Client - Lint, Test & Build
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: client
```

| Step | Command | Purpose |
| --- | --- | --- |
| Checkout | `actions/checkout@v4` | Download repo code |
| Setup Node | `actions/setup-node@v4` (node 22) | Install Node.js with npm cache |
| Install | `npm ci` | Clean install from lockfile |
| Lint | `npm run lint` → `eslint .` | Check React code style |
| Test | `npm test` → `vitest run` | Run frontend tests using Vitest + Testing Library |
| Build | `npm run build` → `vite build` | Build production bundle (catches import errors) |

**Why is `build` included in CI?**
- A successful `npm test` doesn't guarantee the production build works
- `vite build` can fail due to: missing imports, TypeScript errors, env variable issues
- Catching build failures in CI prevents broken deployments

---

## Job 3: Docker Build (No Push)

```yaml
docker-build:
  name: Docker build (no push)
  runs-on: ubuntu-latest
  needs: [server, client]    # Only runs if BOTH lint+test jobs pass
```

| Step | What It Does |
| --- | --- |
| Build server image | Builds `server/Dockerfile` with `push: false` |
| Build client image | Builds `client/Dockerfile` with `push: false` |

**Why build but NOT push?**
- This verifies the **Dockerfiles are valid** and the images can be built
- Pushing is only done in the **CD pipeline** (on `main` branch only)
- No point pushing an image from a feature branch

**`needs: [server, client]`** — This job only runs if both the server and client
lint+test jobs pass. No point building Docker images if the code has errors.

---

## Job 4: Merge Check (Non-Main Branches Only)

```yaml
merge-check:
  name: Check for merge conflicts with main
  runs-on: ubuntu-latest
  if: github.ref != 'refs/heads/main'    # Skip this on main itself
```

This job does a **"dummy merge"** — it tries to merge `main` into your current branch
(without actually committing anything) to detect merge conflicts early.

| Step | What It Does |
| --- | --- |
| Checkout (full history) | Gets the entire git history (`fetch-depth: 0`) |
| Configure git identity | Sets a throwaway name/email for the merge attempt |
| Fetch main | Gets the latest `main` branch |
| Attempt merge | Runs `git merge --no-commit --no-ff origin/main` |
| Report result | If conflict → shows which files conflict + fails the CI check |

**Why is this useful?**
- You find out about merge conflicts BEFORE opening a PR
- The conflicting files are listed in the GitHub Actions summary
- You can fix conflicts proactively instead of discovering them during review

---

## CI vs CD — Key Differences

| | CI (ci.yml) | CD (cd.yml) |
| --- | --- | --- |
| **When** | Every push to any branch + PRs | Only pushes to `main` |
| **Purpose** | Verify code quality | Deploy to production |
| **Docker** | Build only (no push) | Build AND push to GHCR |
| **Deployment** | None | SSH into EC2 + restart containers |
| **If it fails** | Code doesn't get merged | App doesn't get deployed |

---

## What a Typical Workflow Looks Like

```
1. Create feature branch: git checkout -b feature/new-page
2. Write code, commit, push
3. CI runs automatically:
   ✅ Server lint + test
   ✅ Client lint + test + build
   ✅ Docker build
   ✅ No merge conflicts with main
4. Open PR to main → reviewer approves
5. Merge PR into main
6. CD runs automatically:
   ✅ Build + push images to GHCR
   ✅ Deploy to EC2
7. App is live with your changes! 🎉
```
