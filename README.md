# 🚀 MERN Stack Production Starter Template

[![CI](https://github.com/mihir021/DevOps-/actions/workflows/ci.yml/badge.svg)](https://github.com/mihir021/DevOps-/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://www.docker.com/)
[![React 19](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![Node.js 22](https://img.shields.io/badge/node.js-22-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A production-grade, modular **MERN Stack Starter Template** equipped with automated CI/CD, Docker multi-stage containerization, Nginx reverse proxy, and optional Prometheus + Grafana observability.

---

## ✨ Features

- **⚡ Frontend:** React 19, Vite, React Router v7, Axios (pre-configured with JWT interceptors).
- **🛡️ Backend:** Node.js 22, Express 5, Mongoose 9 (MongoDB Atlas), bcryptjs password hashing, JWT stateless authentication.
- **🔄 Nginx Reverse Proxy:** Internal routing for `/api/*` requests on port 80 — no exposed backend port, no hardcoded IPs, zero CORS errors.
- **🐳 Multi-Stage Docker:** Ultra-slim Alpine images (~25MB client, ~150MB server) with automated healthchecks.
- **📊 Observability Stack (Toggleable):** Prometheus metric scraping (`/metrics`) and pre-configured Grafana dashboards on Docker Compose profiles.
- **🚀 Automated CI/CD:** GitHub Actions workflow for linting, testing, Docker image building (GHCR), and zero-downtime SSH deployment to AWS EC2.
- **🪄 60-Second Setup Script:** Interactive `./init-project.sh` to initialize and customize names, toggles, and secrets in seconds.

---

## 🏁 Quickstart

### 1. Create a Repository from this Template
1. Click the green **"Use this template"** button at the top of this GitHub repository → **"Create a new repository"**.
2. Clone your new repository to your local machine:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_PROJECT_NAME>.git
   cd <YOUR_PROJECT_NAME>
   ```

### 2. Initialize in 60 Seconds
Run the interactive initializer script:
```bash
./init-project.sh
```

The script will prompt you for:
1. **Project Slug Name** (e.g., `shop-ease`)
2. **GitHub Username / Org** (e.g., `mihir021`)
3. **App Title** (e.g., `ShopEase App`)
4. **Feature Toggles**:
   - `Enable CI?` (y/n) — lints and tests code on every push
   - `Enable CD?` (y/n) — builds GHCR images & deploys to EC2 on push to `main`
   - `Enable Monitoring?` (y/n) — activates Prometheus & Grafana profile

---

## 💻 Local Development

### Option A: Running with Docker Compose (Recommended)

```bash
# Standard mode (Frontend + Backend):
docker compose up --build

# With Prometheus & Grafana Monitoring enabled:
docker compose --profile monitoring up --build
```

| Service | Local URL | Notes |
|---|---|---|
| **Client (Nginx + React)** | [http://localhost:8080](http://localhost:8080) | Proxies `/api/*` to server internally |
| **Server (Express API)** | [http://localhost:5000](http://localhost:5000) | REST API & `/health` endpoint |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | *(if monitoring profile active)* |
| **Grafana** | [http://localhost:3000](http://localhost:3000) | *(if monitoring profile active, user: `admin`/`admin`)* |

### Option B: Running without Docker

```bash
# 1. Backend Server
cd server
npm install
npm run dev      # Starts on http://localhost:5000

# 2. Frontend Client (separate terminal)
cd client
npm install
npm run dev      # Starts on http://localhost:5173 (Vite proxies /api to :5000)
```

---

## 🧪 Testing & Quality Gates

```bash
# Run server tests (Jest + Supertest + in-memory MongoDB)
cd server && npm test

# Run client tests (Vitest + Testing Library)
cd client && npm test

# Run linters
cd server && npm run lint
cd client && npm run lint
```

---

## ☁️ Production Deployment (AWS EC2)

When code is pushed to `main`, GitHub Actions (`.github/workflows/cd.yml`) automatically builds production containers, pushes them to GitHub Container Registry (GHCR), and deploys to your EC2 instance over SSH.

### Required GitHub Secrets
Go to **Settings > Secrets and variables > Actions** in your GitHub repository and add:

| Secret Name | Description | Example |
|---|---|---|
| `EC2_HOST` | Public IPv4 address of your EC2 instance | `54.166.198.31` |
| `EC2_USER` | SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your private `.pem` SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `MONGODB_URI` | MongoDB Atlas production connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/app` |
| `JWT_SECRET` | Secret key used to sign JWT auth tokens | `random-32-byte-hex-string` |
| `GRAFANA_ADMIN_PASSWORD` | Password for Grafana dashboard access | `securepassword123` |

### EC2 Security Group Rules
| Type | Port | Source | Reason |
|---|---|---|---|
| **SSH** | `22` | Your IP | Admin shell access |
| **HTTP** | `80` | `0.0.0.0/0` | Web application (Nginx handles React + API) |
| **Custom TCP** | `3000` | Your IP | Grafana Dashboard *(optional)* |
| **Custom TCP** | `9090` | Your IP | Prometheus UI *(optional)* |

---

## 📚 Documentation

Detailed guides and architecture specifications are available in the [`docs/`](./docs) folder:
- [Architecture & System Diagrams](./docs/system-diagrams.md)
- [Complete Project Overview](./docs/project-overview.md)
- [CI Pipeline Explained](./docs/ci-pipeline-explained.md)
- [CD Pipeline Explained](./docs/cd-pipeline-explained.md)
- [Docker Architecture](./docs/docker-explained.md)
- [Prometheus & Grafana Monitoring](./docs/monitoring-explained.md)

---

## 📄 License
ISC © 2026
