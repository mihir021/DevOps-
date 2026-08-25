# DevOps MERN Project — Complete Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Server (Backend)](#5-server-backend)
6. [Client (Frontend)](#6-client-frontend)
7. [Docker Setup](#7-docker-setup)
8. [CI Pipeline (ci.yml)](#8-ci-pipeline-ciyml)
9. [CD Pipeline (cd.yml)](#9-cd-pipeline-cdyml)
10. [Monitoring (Prometheus + Grafana)](#10-monitoring-prometheus--grafana)
11. [Nginx Reverse Proxy](#11-nginx-reverse-proxy)
12. [GitHub Secrets Required](#12-github-secrets-required)
13. [How to Run Locally](#13-how-to-run-locally)
14. [AWS EC2 Deployment](#14-aws-ec2-deployment)
15. [API Endpoints](#15-api-endpoints)

---

## 1. Project Overview

This is a **full-stack MERN (MongoDB, Express, React, Node.js) application** built as a
DevOps learning project. It demonstrates industry-standard practices including:

- Containerization with **Docker** (multi-stage builds)
- Automated **CI/CD** pipelines using **GitHub Actions**
- **Monitoring** with **Prometheus** (metrics collection) and **Grafana** (dashboards)
- **Nginx** as a reverse proxy (no hardcoded IPs, secure architecture)
- Deployment to **AWS EC2**

The app itself is a simple auth system: users can **sign up**, **log in**, and view a
**protected dashboard** page. The focus of this project is on the DevOps tooling and
infrastructure around the app, not the app's UI complexity.

---

## 2. Tech Stack

| Layer          | Technology                   | Purpose                                   |
| -------------- | ---------------------------- | ----------------------------------------- |
| **Frontend**   | React 19 + Vite              | Single Page Application (SPA)             |
| **Backend**    | Node.js 22 + Express 5       | REST API server                           |
| **Database**   | MongoDB Atlas                | Cloud-hosted NoSQL database               |
| **Auth**       | JWT + bcryptjs               | Stateless authentication                  |
| **Container**  | Docker + Docker Compose      | Containerization & orchestration          |
| **CI/CD**      | GitHub Actions               | Automated testing & deployment            |
| **Registry**   | GitHub Container Registry    | Docker image storage (ghcr.io)            |
| **Web Server** | Nginx                        | Static file serving + reverse proxy       |
| **Monitoring** | Prometheus + Grafana         | Metrics collection + visualization        |
| **Hosting**    | AWS EC2 (t3.small/medium)    | Cloud server running Docker containers    |

---

## 3. Folder Structure

```
DevOps-/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI: lint, test, build on every push
│       └── cd.yml                    # CD: build images → push to GHCR → deploy to EC2
├── client/                           # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance with /api base URL + JWT interceptor
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── Signup.jsx            # Signup page with client-side validation
│   │   │   └── Dashboard.jsx         # Protected dashboard page
│   │   ├── test/                     # Frontend tests (Vitest + Testing Library)
│   │   ├── App.jsx                   # React Router setup + ProtectedRoute component
│   │   └── main.jsx                  # App entry point
│   ├── Dockerfile                    # Multi-stage: npm build → Nginx serve
│   ├── nginx.conf                    # Nginx config with reverse proxy for /api/
│   ├── vite.config.js                # Vite config with dev proxy for /api
│   ├── package.json
│   └── .env                          # Local dev env (VITE_API_URL — not used in prod)
├── server/                           # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection (mongoose.connect)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Signup & Login logic (bcrypt + JWT)
│   │   │   └── dashboard.controller.js # Protected dashboard data
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT verification middleware (requireAuth)
│   │   │   └── validate.middleware.js # Input validation (email, password rules)
│   │   ├── metrics/
│   │   │   └── prometheus.js         # Prometheus metrics: request count + duration
│   │   ├── models/
│   │   │   └── User.js               # Mongoose User schema (name, email, passwordHash)
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # POST /api/auth/signup, POST /api/auth/login
│   │   │   └── dashboard.routes.js   # GET /api/dashboard (protected)
│   │   ├── app.js                    # Express app (routes, middleware, CORS)
│   │   └── index.js                  # Entry point: connect DB → start server
│   ├── tests/                        # Backend tests (Jest + Supertest)
│   ├── Dockerfile                    # Multi-stage: npm ci → Node.js runtime
│   ├── package.json
│   └── .env                          # Local dev secrets (MONGODB_URI, JWT_SECRET)
├── monitoring/
│   ├── prometheus.yml                # Prometheus scrape config → server:5000
│   └── grafana/
│       └── provisioning/
│           ├── datasources/
│           │   └── datasource.yml    # Auto-register Prometheus as Grafana data source
│           └── dashboards/
│               ├── dashboards.yml    # Dashboard provisioning config
│               └── devops-mern-dashboard.json  # Pre-built Grafana dashboard
├── docker-compose.yml                # Local development (builds from source)
├── docker-compose.prod.yml           # Production (pulls from GHCR)
└── .gitignore
```

---

## 4. Architecture Diagram

```
                        ┌─────────────────────────────────────────────────┐
                        │                 AWS EC2 Instance                │
                        │                                                 │
   Browser              │  ┌─────────────────────────────────────┐       │
   (User)               │  │         Docker Compose Network       │       │
     │                  │  │                                       │       │
     │  HTTP :80        │  │  ┌───────────┐     ┌───────────┐    │       │
     ├─────────────────►│──┤──│  Nginx    │────►│  Express  │    │       │
     │                  │  │  │  (client) │     │  (server) │    │       │
     │  /api/* ─────────│──┤──│  Port 80  │     │  Port 5000│    │       │
     │  /login, etc. ──►│──┤──│           │     │  (internal)│   │       │
     │                  │  │  └───────────┘     └─────┬─────┘    │       │
     │                  │  │                          │           │       │
     │                  │  │                          │           │       │
     │                  │  │  ┌───────────┐     ┌─────▼─────┐    │       │
     │                  │  │  │  Grafana  │◄────│ Prometheus │    │       │
     │  :3000  ────────►│──┤──│  Port 3000│     │  Port 9090 │   │       │
     │                  │  │  └───────────┘     └────────────┘    │       │
     │                  │  │                                       │       │
     │                  │  └─────────────────────────────────────┘       │
     │                  └─────────────────────────────────────────────────┘
     │                                          │
     │                                          │ MONGODB_URI
     │                                          ▼
     │                               ┌──────────────────┐
     │                               │  MongoDB Atlas    │
     │                               │  (Cloud Database) │
     │                               └──────────────────┘
```

**How requests flow:**
1. Browser sends all requests to **Nginx on port 80**
2. Nginx serves React static files (`/login`, `/signup`, `/dashboard`)
3. For `/api/*` requests, Nginx **reverse-proxies** to the Express server internally
4. Express talks to **MongoDB Atlas** over the internet
5. **Prometheus** scrapes metrics from Express every 5 seconds
6. **Grafana** reads from Prometheus and displays dashboards

---

## 5. Server (Backend)

### Entry Point: `server/src/index.js`
- Loads `.env` variables using `dotenv`
- Connects to MongoDB using `mongoose.connect()`
- Starts Express on the configured PORT (default: 5000)
- If MongoDB connection fails, the process exits (no fake "healthy" server)

### Express App: `server/src/app.js`
- **CORS** enabled (allows cross-origin requests from the frontend)
- **JSON parsing** for request bodies
- **Prometheus metrics middleware** on every request
- Routes:
  - `GET /health` — Health check (Docker, CI/CD, and monitoring use this)
  - `POST /api/auth/signup` — Create a new user account
  - `POST /api/auth/login` — Authenticate and get a JWT token
  - `GET /api/dashboard` — Protected route (requires valid JWT)
  - `GET /metrics` — Prometheus scrapes this for metric data

### Authentication Flow
1. **Signup**: User sends `{ name, email, password }`
   - Password is validated (8+ chars, uppercase, lowercase, number, special char)
   - Password is hashed with **bcrypt** (10 salt rounds)
   - User is saved to MongoDB
   - JWT token is returned (expires in 1 hour)

2. **Login**: User sends `{ email, password }`
   - Email is looked up in MongoDB
   - Password is compared with stored hash using **bcrypt.compare()**
   - Same error message for "no user" and "wrong password" (security: prevents email enumeration)
   - JWT token is returned

3. **Protected Routes**: Require `Authorization: Bearer <token>` header
   - `auth.middleware.js` verifies the JWT signature using `JWT_SECRET`
   - Attaches `req.userId` for the controller to use

### Database: MongoDB Atlas
- **User Schema** (Mongoose):
  - `name` (String, required, trimmed)
  - `email` (String, required, unique, lowercase, trimmed)
  - `passwordHash` (String, required)
  - `createdAt` / `updatedAt` (auto-generated)

---

## 6. Client (Frontend)

### Tech: React 19 + Vite + React Router

### Pages
| Page          | Route        | Auth Required | Description                          |
| ------------- | ------------ | ------------- | ------------------------------------ |
| Login         | `/login`     | No            | Email + password form                |
| Signup        | `/signup`    | No            | Name + email + password form         |
| Dashboard     | `/dashboard` | **Yes** (JWT) | Shows user info, logout button       |

### API Communication (`axios.js`)
- Uses **relative URL** `/api` as the base URL
- **In production**: Nginx reverse-proxies `/api/*` to the Express server
- **In local dev**: Vite dev server proxies `/api/*` to `localhost:5000`
- **JWT interceptor**: Automatically attaches `Authorization: Bearer <token>` header from localStorage to every request

### Client-Side Auth Flow
1. On signup/login success → store JWT token in `localStorage`
2. `ProtectedRoute` component checks if token exists in `localStorage`
3. If no token → redirect to `/login`
4. Dashboard fetches user data with the JWT → if 401 → remove token → redirect to login

---

## 7. Docker Setup

### Server Dockerfile (Multi-Stage)
```
Stage 1 (deps):   node:22-alpine → npm ci --omit=dev
Stage 2 (runner): node:22-alpine → copy node_modules + src → run as "node" user
```
- Only **production dependencies** are in the final image (no jest, nodemon, etc.)
- Runs as non-root `node` user (security best practice)
- Built-in **HEALTHCHECK** using `node -e` (no curl/wget needed)

### Client Dockerfile (Multi-Stage)
```
Stage 1 (build):  node:22-alpine → npm ci → vite build → static files in /app/dist
Stage 2 (runner): nginx:alpine → copy static files + nginx.conf
```
- Final image is **~25MB** (just Nginx + HTML/CSS/JS)
- No Node.js in the production image
- Built-in **HEALTHCHECK** using `wget --spider`

### docker-compose.yml (Local Development)
- Builds images from local source code
- Server on port 5000, Client on port 8080
- Prometheus on port 9090, Grafana on port 3000

### docker-compose.prod.yml (Production)
- Pulls pre-built images from **GHCR** (`ghcr.io/mihir021/devops-mern-*`)
- Server port 5000 is **NOT exposed publicly** (only via `expose:` for internal Docker network access)
- Client (Nginx) on port 80 — the only public-facing port
- Grafana on port 3000, Prometheus on port 9090
- Uses `.env` file for secrets (created by CD pipeline)

---

## 8. CI Pipeline (ci.yml)

**File:** `.github/workflows/ci.yml`
**Triggers:** Every push to any branch + every PR targeting `main`

### What It Does (4 Jobs):

```
┌──────────────────┐     ┌──────────────────┐
│  Server Job      │     │  Client Job      │
│  ────────────    │     │  ────────────    │
│  1. Checkout     │     │  1. Checkout     │
│  2. Setup Node22 │     │  2. Setup Node22 │
│  3. npm ci       │     │  3. npm ci       │
│  4. npm run lint │     │  4. npm run lint │
│  5. npm test     │     │  5. npm test     │
└────────┬─────────┘     │  6. npm run build│
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────┐
    │  Docker Build Job (no push)     │
    │  ──────────────────────────     │
    │  1. Build server image          │
    │  2. Build client image          │
    │  (Verifies Dockerfiles work)    │
    └─────────────────────────────────┘

    ┌─────────────────────────────────┐
    │  Merge Check Job                │
    │  (only on non-main branches)    │
    │  ──────────────────────────     │
    │  Does a dummy merge with main   │
    │  to detect conflicts early      │
    └─────────────────────────────────┘
```

### Purpose:
- **Catch bugs early**: Lint errors, test failures, and build failures are caught before merging
- **Docker build verification**: Ensures both Dockerfiles compile successfully
- **Merge conflict detection**: Warns you if your branch conflicts with main before you open a PR

---

## 9. CD Pipeline (cd.yml)

**File:** `.github/workflows/cd.yml`
**Triggers:** Only on pushes to `main` branch

### What It Does (2 Jobs):

```
┌─────────────────────────────────────────────────┐
│  Job 1: Build & Push Images to GHCR             │
│  ─────────────────────────────────              │
│  1. Checkout code                                │
│  2. Setup Docker Buildx                          │
│  3. Login to GitHub Container Registry           │
│  4. Build & push server image (tagged: latest    │
│     + commit SHA)                                │
│  5. Build & push client image (tagged: latest    │
│     + commit SHA)                                │
└──────────────────────┬──────────────────────────┘
                       │ (needs: build-and-push)
                       ▼
┌─────────────────────────────────────────────────┐
│  Job 2: Deploy to EC2                            │
│  ─────────────────────                           │
│  1. Checkout code                                │
│  2. SCP: Copy docker-compose.prod.yml +          │
│     monitoring/ folder to EC2 ~/app              │
│  3. SSH into EC2 and:                            │
│     a. Create .env file with secrets             │
│     b. docker compose pull (latest images)       │
│     c. docker compose up -d (restart containers) │
│     d. docker image prune -f (cleanup old images)│
└─────────────────────────────────────────────────┘
```

### Step-by-Step Breakdown:

1. **Build & Push** — Docker images are built and pushed to **GHCR** (GitHub Container Registry) at:
   - `ghcr.io/mihir021/devops-mern-server:latest`
   - `ghcr.io/mihir021/devops-mern-client:latest`
   - Also tagged with the exact git commit SHA for versioning

2. **Deploy** — Uses SSH to connect to the EC2 instance and:
   - Copies the compose file and monitoring configs
   - Creates a `.env` file with database credentials and secrets
   - Pulls the latest Docker images
   - Restarts all containers with `docker compose up -d`
   - Cleans up unused old images to save disk space

### Important: What Secrets Are Used

The CD pipeline reads these from **GitHub → Settings → Secrets → Actions**:

| Secret                   | Used In              | Purpose                              |
| ------------------------ | -------------------- | ------------------------------------ |
| `EC2_HOST`               | SCP + SSH steps      | EC2 public IP address                |
| `EC2_USER`               | SCP + SSH steps      | SSH username (usually `ubuntu`)      |
| `EC2_SSH_KEY`            | SCP + SSH steps      | Private SSH key for EC2 access       |
| `MONGODB_URI`            | .env on EC2          | MongoDB Atlas connection string      |
| `JWT_SECRET`             | .env on EC2          | Secret key for signing JWT tokens    |
| `GRAFANA_ADMIN_PASSWORD` | .env on EC2          | Grafana admin panel password         |
| `GITHUB_TOKEN`           | GHCR login           | Auto-provided by GitHub Actions      |

---

## 10. Monitoring (Prometheus + Grafana)

### Prometheus (`monitoring/prometheus.yml`)
- **Scrape interval**: Every 5 seconds
- **Target**: `server:5000` (Docker internal DNS resolves the container name)
- **Endpoint scraped**: `GET /metrics` on the Express server

### Metrics Collected (`server/src/metrics/prometheus.js`)
| Metric Name                       | Type      | Description                            |
| --------------------------------- | --------- | -------------------------------------- |
| `http_requests_total`             | Counter   | Total HTTP requests (method, route, status) |
| `http_request_duration_seconds`   | Histogram | Request duration in seconds (with buckets)  |
| Default Node.js process metrics   | Various   | CPU, memory (heap/RSS), event loop lag, etc. |

### Grafana (`monitoring/grafana/provisioning/`)
- **Datasource**: Auto-registered on startup (points to `http://prometheus:9090`)
- **Dashboard**: Pre-built JSON dashboard auto-loaded on startup
- **Access**: `http://<EC2-IP>:3000` → Login with `admin` / (your GRAFANA_ADMIN_PASSWORD)

---

## 11. Nginx Reverse Proxy

### How It Works (`client/nginx.conf`)

```
Browser Request           Nginx Decision              Where It Goes
─────────────────         ─────────────────           ──────────────────
GET /login           →    Static file (React)    →    /usr/share/nginx/html/index.html
GET /assets/*.js     →    Static file            →    /usr/share/nginx/html/assets/
POST /api/auth/login →    Reverse proxy          →    http://server:5000/api/auth/login
GET /health          →    Reverse proxy          →    http://server:5000/health
GET /metrics         →    Reverse proxy          →    http://server:5000/metrics
```

### Why This Matters
- **No port 5000 exposed to the internet** — more secure
- **No hardcoded IP addresses** — the frontend uses relative `/api` paths
- **No rebuilds needed when IP changes** — the Docker image works with ANY server
- **No CORS issues** — browser sees everything coming from the same origin (port 80)

---

## 12. GitHub Secrets Required

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

| Secret Name              | Example Value                                         |
| ------------------------ | ----------------------------------------------------- |
| `EC2_HOST`               | `54.166.198.31`                                       |
| `EC2_USER`               | `ubuntu`                                              |
| `EC2_SSH_KEY`            | (Your private key `.pem` file contents)               |
| `MONGODB_URI`            | `mongodb+srv://user:pass@cluster.mongodb.net/devops`  |
| `JWT_SECRET`             | `my-super-secret-key-change-this`                     |
| `GRAFANA_ADMIN_PASSWORD` | `securepassword123`                                   |

---

## 13. How to Run Locally

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)

### Option A: Without Docker (for development)

```bash
# Terminal 1: Start the backend
cd server
cp .env.example .env        # Edit .env with your MONGODB_URI and JWT_SECRET
npm install
npm run dev                  # Starts on http://localhost:5000

# Terminal 2: Start the frontend
cd client
npm install
npm run dev                  # Starts on http://localhost:5173
                             # Vite proxy forwards /api → localhost:5000
```

### Option B: With Docker Compose

```bash
# Make sure server/.env has MONGODB_URI and JWT_SECRET
docker compose up --build    # Builds + starts all 4 containers
                             # Client: http://localhost:8080
                             # Server: http://localhost:5000
                             # Prometheus: http://localhost:9090
                             # Grafana: http://localhost:3000 (admin/admin)
```

---

## 14. AWS EC2 Deployment

### How It's Deployed
1. Push code to `main` branch on GitHub
2. GitHub Actions CI runs (lint, test, build)
3. GitHub Actions CD runs:
   - Builds Docker images → pushes to GHCR
   - SSHs into EC2 → pulls images → restarts containers
4. App is live at `http://<EC2-PUBLIC-IP>`

### Containers Running on EC2
| Container                 | Port (Public) | Port (Internal) | Purpose               |
| ------------------------- | ------------- | --------------- | --------------------- |
| `devops-mern-client`      | **80**        | 80              | Nginx + React app     |
| `devops-mern-server`      | None          | 5000            | Express API           |
| `devops-mern-prometheus`  | **9090**      | 9090            | Metrics collection    |
| `devops-mern-grafana`     | **3000**      | 3000            | Metrics dashboards    |

### EC2 Security Group Rules Needed
| Type       | Port  | Source      | Purpose            |
| ---------- | ----- | ----------- | ------------------ |
| SSH        | 22    | Your IP     | SSH access         |
| HTTP       | 80    | 0.0.0.0/0   | Web app (Nginx)    |
| Custom TCP | 3000  | Your IP     | Grafana dashboard  |
| Custom TCP | 9090  | Your IP     | Prometheus UI      |

---

## 15. API Endpoints

| Method | Endpoint            | Auth     | Request Body                            | Response                              |
| ------ | ------------------- | -------- | --------------------------------------- | ------------------------------------- |
| GET    | `/health`           | None     | —                                       | `{ "status": "ok" }`                 |
| POST   | `/api/auth/signup`  | None     | `{ name, email, password }`             | `{ token, user: { id, name, email }}` |
| POST   | `/api/auth/login`   | None     | `{ email, password }`                   | `{ token, user: { id, name, email }}` |
| GET    | `/api/dashboard`    | Bearer   | —                                       | `{ message, user: { id, name, ... }}` |
| GET    | `/metrics`          | None     | —                                       | Prometheus text format                |

### Password Requirements (enforced on both client and server)
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

---

> **Last Updated:** August 25, 2026
