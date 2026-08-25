# CD Pipeline — Detailed Line-by-Line Explanation

## File: `.github/workflows/cd.yml`

This document explains **every single line** of the CD (Continuous Deployment) pipeline.

---

## What Is CD?

**CD = Continuous Deployment** (or Continuous Delivery).
It means: every time you push code to the `main` branch, the app is **automatically
built, packaged, and deployed** to your production server (EC2) — without you doing
anything manually.

---

## The Complete Flow

```
You push to main
      │
      ▼
┌─────────────────────────────┐
│  Job 1: build-and-push      │
│  ─────────────────────      │
│  • Checkout code             │
│  • Login to GHCR             │
│  • Build server Docker image │
│  • Push server image to GHCR │
│  • Build client Docker image │
│  • Push client image to GHCR │
└──────────────┬──────────────┘
               │ (waits for Job 1 to finish)
               ▼
┌─────────────────────────────┐
│  Job 2: deploy               │
│  ─────────────               │
│  • SCP files to EC2          │
│  • SSH into EC2              │
│  • Write .env secrets        │
│  • Pull latest images        │
│  • Restart all containers    │
│  • Cleanup old images        │
└─────────────────────────────┘
               │
               ▼
         App is live! 🎉
```

---

## Line-by-Line Breakdown

### Lines 1–9: When Does This Pipeline Run?

```yaml
name: CD

on:
  push:
    branches:
      - main
```

- **`name: CD`** — The name shown in GitHub Actions UI
- **`on: push: branches: main`** — Only triggers when code is pushed to the `main` branch
  - Pushing to `feature/xyz` or `dev` does NOT trigger this
  - Only `main` = production-ready code

### Lines 11–13: Permissions

```yaml
permissions:
  contents: read
  packages: write
```

- **`contents: read`** — Allows the workflow to read your repo code (checkout)
- **`packages: write`** — Allows pushing Docker images to **GHCR** (GitHub Container Registry). Without this, the `docker push` would fail with "permission denied"

---

### Lines 15–52: Job 1 — Build & Push Images

#### Step 1: Checkout Code (Line 20–21)
```yaml
- name: Checkout code
  uses: actions/checkout@v4
```
Downloads your repo's source code into the GitHub Actions runner. Without this, there's no code to build from.

#### Step 2: Setup Docker Buildx (Line 23–24)
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```
Installs **Docker Buildx** — an advanced Docker build tool that supports:
- Multi-platform builds (ARM + x86)
- Better build caching
- Parallel stage building

#### Step 3: Login to GHCR (Lines 26–31)
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```
- **`ghcr.io`** — GitHub Container Registry (free Docker image hosting by GitHub)
- **`github.actor`** — Your GitHub username (auto-provided)
- **`secrets.GITHUB_TOKEN`** — Auto-generated token by GitHub Actions (no setup needed)

This is like doing `docker login ghcr.io` before `docker push`.

#### Step 4: Build & Push Server Image (Lines 33–40)
```yaml
- name: Build & push server image
  uses: docker/build-push-action@v6
  with:
    context: ./server
    push: true
    tags: |
      ghcr.io/mihir021/devops-mern-server:latest
      ghcr.io/mihir021/devops-mern-server:${{ github.sha }}
```
- **`context: ./server`** — Build using the `server/Dockerfile`
- **`push: true`** — Push the built image to GHCR
- **Two tags**:
  - `:latest` — Always points to the most recent build (used by `docker compose pull`)
  - `:${{ github.sha }}` — Tagged with the exact git commit hash (e.g., `:d5c6c25...`) for versioning/rollback

#### Step 5: Build & Push Client Image (Lines 42–52)
```yaml
- name: Build & push client image
  uses: docker/build-push-action@v6
  with:
    context: ./client
    push: true
    tags: |
      ghcr.io/mihir021/devops-mern-client:latest
      ghcr.io/mihir021/devops-mern-client:${{ github.sha }}
```
Same as the server, but builds the **client** Dockerfile (React → Nginx).

> **Note:** No `VITE_API_URL` build-arg is needed because the frontend uses a relative
> `/api` path. Nginx reverse-proxies it to the server container internally.

---

### Lines 54–94: Job 2 — Deploy to EC2

```yaml
deploy:
  name: Deploy to EC2
  runs-on: ubuntu-latest
  needs: build-and-push
```
- **`needs: build-and-push`** — This job WAITS for Job 1 to finish. It won't start until both images are pushed to GHCR.

#### Step 1: Checkout Code (Lines 58–60)
Same as before — needed to access `docker-compose.prod.yml` and `monitoring/` folder.

#### Step 2: Copy Files to EC2 via SCP (Lines 62–69)
```yaml
- name: Copy compose file + monitoring config to the server
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USER }}
    key: ${{ secrets.EC2_SSH_KEY }}
    source: 'docker-compose.prod.yml,monitoring'
    target: '~/app'
```
- **SCP** = Secure Copy Protocol (copies files over SSH)
- Copies `docker-compose.prod.yml` and the entire `monitoring/` directory to `~/app` on the EC2 server
- Uses your SSH key to authenticate

#### Step 3: SSH In, Write .env, and Deploy (Lines 71–94)
```yaml
- name: Write .env and redeploy over SSH
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USER }}
    key: ${{ secrets.EC2_SSH_KEY }}
    envs: MONGODB_URI,JWT_SECRET,GRAFANA_ADMIN_PASSWORD
    script: |
      set -e
      mkdir -p ~/app
      cd ~/app
      cat > .env <<EOF
      MONGODB_URI=$MONGODB_URI
      JWT_SECRET=$JWT_SECRET
      PORT=5000
      GRAFANA_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD
      EOF
      docker compose -f docker-compose.prod.yml pull
      docker compose -f docker-compose.prod.yml up -d
      docker image prune -f
```

Breaking down the SSH script:

| Command | What It Does |
| --- | --- |
| `set -e` | Stop immediately if any command fails (don't continue on errors) |
| `mkdir -p ~/app` | Create the app directory if it doesn't exist |
| `cd ~/app` | Enter the app directory |
| `cat > .env <<EOF...EOF` | Write the `.env` file with all the secrets (MONGODB_URI, JWT_SECRET, etc.) |
| `docker compose pull` | Pull the latest images from GHCR (the ones Job 1 just pushed) |
| `docker compose up -d` | Start/restart all containers in detached mode (background) |
| `docker image prune -f` | Delete unused old Docker images to free disk space |

The `env:` section at the bottom passes GitHub Secrets as environment variables to the SSH session:
```yaml
env:
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  GRAFANA_ADMIN_PASSWORD: ${{ secrets.GRAFANA_ADMIN_PASSWORD }}
```

---

## What Happens on the EC2 After Deployment

```
~/app/
├── docker-compose.prod.yml    ← Copied by SCP step
├── .env                       ← Created by SSH script
└── monitoring/                ← Copied by SCP step
    ├── prometheus.yml
    └── grafana/provisioning/
```

Docker Compose reads `docker-compose.prod.yml`, pulls images from GHCR,
creates containers, and connects them all on a shared Docker network.

---

## Summary: What Each Secret Does

| Secret | Where It's Used | Why |
| --- | --- | --- |
| `EC2_HOST` | SCP + SSH | To know which server to connect to |
| `EC2_USER` | SCP + SSH | SSH username (e.g., `ubuntu`) |
| `EC2_SSH_KEY` | SCP + SSH | Authentication (private key) |
| `MONGODB_URI` | .env file on EC2 | Server connects to MongoDB Atlas |
| `JWT_SECRET` | .env file on EC2 | Server signs/verifies JWT tokens |
| `GRAFANA_ADMIN_PASSWORD` | .env file on EC2 | Grafana login password |
| `GITHUB_TOKEN` | GHCR login | Auto-provided, no setup needed |
