# System Architecture Diagrams

This document contains all the system diagrams for the DevOps MERN project.

---

## 1. Complete System Overview

This shows how **every component** connects — from your laptop to the live app.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DEVELOPER MACHINE                                       │
│                                                                                             │
│   ┌──────────┐    git push     ┌──────────────────────────────────────────────────────────┐ │
│   │  VS Code │ ──────────────► │                    GitHub Repository                     │ │
│   │  + Code  │                 │                    (mihir021/DevOps-)                     │ │
│   └──────────┘                 │                                                          │ │
│                                │   ┌─────────────┐              ┌─────────────┐           │ │
│                                │   │  ci.yml     │              │  cd.yml     │           │ │
│                                │   │  (CI pipe)  │              │  (CD pipe)  │           │ │
│                                │   └──────┬──────┘              └──────┬──────┘           │ │
│                                └──────────┼────────────────────────────┼───────────────────┘ │
└────────────────────────────────────────────┼────────────────────────────┼─────────────────────┘
                                             │                            │
                                             ▼                            ▼
                            ┌────────────────────────────┐  ┌──────────────────────────────┐
                            │   GitHub Actions Runner    │  │   GitHub Actions Runner      │
                            │   ──────────────────────   │  │   ──────────────────────     │
                            │   • npm ci                 │  │   • docker build & push      │
                            │   • npm run lint           │  │   • SCP files to EC2         │
                            │   • npm test               │  │   • SSH → deploy             │
                            │   • docker build (no push) │  │                              │
                            └────────────────────────────┘  └──────┬────────┬──────────────┘
                                                                   │        │
                                                          push     │        │ SSH + SCP
                                                          images   │        │
                                                                   ▼        │
                            ┌──────────────────────────────────┐   │
                            │  GitHub Container Registry       │   │
                            │  (ghcr.io)                       │   │
                            │                                  │   │
                            │  ghcr.io/mihir021/               │   │
                            │    devops-mern-server:latest     │   │
                            │    devops-mern-client:latest     │   │
                            └───────────────┬──────────────────┘   │
                                            │                      │
                                docker pull │                      │
                                            ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AWS EC2 Instance (t3.small)                                    │
│                              Region: us-east-1                                              │
│                              Public IP: 54.166.198.31                                       │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          Docker Compose Network (bridge)                               │  │
│  │                                                                                       │  │
│  │                                                                                       │  │
│  │   ┌─────────────────────────────────────────────────────────┐                         │  │
│  │   │                    Nginx (client)                        │                         │  │
│  │   │                    Port 80 ◄── PUBLIC                   │                         │  │
│  │   │                                                         │                         │  │
│  │   │  Browser Request        Action                          │                         │  │
│  │   │  ─────────────────      ──────────────────────────      │                         │  │
│  │   │  GET /login         →   Serve React static files        │                         │  │
│  │   │  GET /assets/*.js   →   Serve static JS bundle          │                         │  │
│  │   │  POST /api/auth/*   →   Reverse proxy to server:5000 ──┼────┐                    │  │
│  │   │  GET /health        →   Reverse proxy to server:5000 ──┼────┤                    │  │
│  │   │  GET /metrics       →   Reverse proxy to server:5000 ──┼────┤                    │  │
│  │   └─────────────────────────────────────────────────────────┘    │                    │  │
│  │                                                                  │                    │  │
│  │                                                                  ▼                    │  │
│  │   ┌─────────────────────────────────────────────────────────┐                         │  │
│  │   │                 Express (server)                         │                         │  │
│  │   │                 Port 5000 ◄── INTERNAL ONLY              │                         │  │
│  │   │                                                         │                         │  │
│  │   │  Endpoints:                                             │                         │  │
│  │   │    POST /api/auth/signup    → Create user               │                         │  │
│  │   │    POST /api/auth/login     → Authenticate              │                         │  │
│  │   │    GET  /api/dashboard      → Protected data            │                         │  │
│  │   │    GET  /health             → Health check              │                         │  │
│  │   │    GET  /metrics            → Prometheus metrics  ◄─────┼────┐                    │  │
│  │   └──────────────────────────────────┬──────────────────────┘    │                    │  │
│  │                                      │                           │                    │  │
│  │                                      │ mongoose.connect()        │ scrape every 5s    │  │
│  │                                      │                           │                    │  │
│  │   ┌──────────────────────────────────┼───────────────────────────┼────────────────┐   │  │
│  │   │              Monitoring Stack    │                           │                │   │  │
│  │   │                                  │                           │                │   │  │
│  │   │   ┌──────────────────────────────┼──┐   ┌───────────────────┴──┐              │   │  │
│  │   │   │        Grafana              │  │   │     Prometheus       │              │   │  │
│  │   │   │        Port 3000 ◄── PUBLIC │  │   │     Port 9090       │              │   │  │
│  │   │   │                             │  │   │                      │              │   │  │
│  │   │   │   Queries Prometheus ───────┼──┼──►│   Stores time-series │              │   │  │
│  │   │   │   Shows dashboards          │  │   │   metric data        │              │   │  │
│  │   │   │                             │  │   │                      │              │   │  │
│  │   │   └─────────────────────────────┘  │   └──────────────────────┘              │   │  │
│  │   │                                    │                                          │   │  │
│  │   └────────────────────────────────────┼──────────────────────────────────────────┘   │  │
│  │                                        │                                              │  │
│  └────────────────────────────────────────┼──────────────────────────────────────────────┘  │
│                                           │                                                 │
│  Security Group Rules:                    │                                                 │
│    Port 22  (SSH)  ← Your IP only         │                                                 │
│    Port 80  (HTTP) ← 0.0.0.0/0           │                                                 │
│    Port 3000 (Grafana) ← Your IP         │                                                 │
│    Port 9090 (Prometheus) ← Your IP      │                                                 │
└───────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                            │
                                            │ MONGODB_URI (encrypted connection)
                                            ▼
                              ┌──────────────────────────┐
                              │     MongoDB Atlas         │
                              │     (Cloud Database)      │
                              │                           │
                              │  Cluster: cluster0        │
                              │  Database: devops         │
                              │  Collection: users        │
                              │                           │
                              │  User Document:           │
                              │  {                        │
                              │    name: "Mihir",         │
                              │    email: "mihir@...",    │
                              │    passwordHash: "$2b...",│
                              │    createdAt: Date,       │
                              │    updatedAt: Date        │
                              │  }                        │
                              └──────────────────────────┘
```

---

## 2. CI/CD Pipeline Flow

```
                    ┌──────────────────┐
                    │   Developer      │
                    │   pushes code    │
                    └────────┬─────────┘
                             │
                             │ git push
                             ▼
                    ┌──────────────────┐
                    │   GitHub Repo    │
                    │   (main branch)  │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │   CI Pipeline     │     │   CD Pipeline     │
    │   (ci.yml)        │     │   (cd.yml)        │
    │                   │     │                   │
    │   Runs on ALL     │     │   Runs on MAIN    │
    │   branches        │     │   branch ONLY     │
    └─────────┬─────────┘     └─────────┬─────────┘
              │                         │
              ▼                         │
    ┌─────────────────────────┐         │
    │  STAGE 1: Quality Gates │         │
    │  ───────────────────    │         │
    │                         │         │
    │  ┌────────┐ ┌────────┐  │         │
    │  │ Server │ │ Client │  │         │
    │  │  Job   │ │  Job   │  │         │
    │  │        │ │        │  │         │
    │  │ lint ✓ │ │ lint ✓ │  │         │
    │  │ test ✓ │ │ test ✓ │  │         │
    │  │        │ │ build ✓│  │         │
    │  └───┬────┘ └───┬────┘  │         │
    │      │          │       │         │
    │      └────┬─────┘       │         │
    │           ▼             │         │
    │  ┌─────────────────┐    │         │
    │  │ Docker Build    │    │         │
    │  │ (verify only)   │    │         │
    │  │ push: false     │    │         │
    │  └─────────────────┘    │         │
    │                         │         │
    │  ┌─────────────────┐    │         │
    │  │ Merge Check     │    │         │
    │  │ (non-main only) │    │         │
    │  └─────────────────┘    │         │
    └─────────────────────────┘         │
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │  STAGE 2: Build &     │
                            │  Push Images          │
                            │  ─────────────────    │
                            │                       │
                            │  Build server image   │
                            │  Build client image   │
                            │       │               │
                            │       │ docker push   │
                            │       ▼               │
                            │  ┌──────────┐         │
                            │  │  GHCR    │         │
                            │  │ (ghcr.io)│         │
                            │  └──────────┘         │
                            └───────────┬───────────┘
                                        │
                                        │ needs: build-and-push
                                        ▼
                            ┌───────────────────────┐
                            │  STAGE 3: Deploy      │
                            │  ─────────────────    │
                            │                       │
                            │  1. SCP files to EC2  │
                            │  2. SSH into EC2      │
                            │  3. Write .env        │
                            │  4. docker pull       │
                            │  5. docker up -d      │
                            │  6. image prune       │
                            └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │   ✅ APP IS LIVE!     │
                            │   http://<EC2-IP>     │
                            └───────────────────────┘
```

---

## 3. Request Flow — What Happens When a User Logs In

```
┌──────────┐                  ┌──────────┐                 ┌──────────┐              ┌─────────┐
│  Browser │                  │  Nginx   │                 │ Express  │              │ MongoDB │
│  (React) │                  │ (port 80)│                 │(port 5000)│             │  Atlas  │
└────┬─────┘                  └────┬─────┘                 └────┬─────┘              └────┬────┘
     │                             │                            │                         │
     │  1. User opens              │                            │                         │
     │     http://54.166.198.31    │                            │                         │
     │ ─────────────────────────►  │                            │                         │
     │                             │                            │                         │
     │  2. Nginx serves            │                            │                         │
     │     index.html + JS bundle  │                            │                         │
     │  ◄───────────────────────── │                            │                         │
     │                             │                            │                         │
     │  3. React app loads,        │                            │                         │
     │     shows Login form        │                            │                         │
     │                             │                            │                         │
     │  4. User clicks "Log In"    │                            │                         │
     │     POST /api/auth/login    │                            │                         │
     │     {email, password}       │                            │                         │
     │ ─────────────────────────►  │                            │                         │
     │                             │  5. Nginx sees /api/       │                         │
     │                             │     Reverse proxy to       │                         │
     │                             │     server:5000            │                         │
     │                             │ ─────────────────────────► │                         │
     │                             │                            │                         │
     │                             │                            │  6. User.findOne({email})│
     │                             │                            │ ────────────────────────►│
     │                             │                            │                         │
     │                             │                            │  7. Return user document │
     │                             │                            │ ◄────────────────────────│
     │                             │                            │                         │
     │                             │                            │  8. bcrypt.compare()     │
     │                             │                            │     password matches!    │
     │                             │                            │                         │
     │                             │                            │  9. jwt.sign({userId})   │
     │                             │                            │     → generate JWT token │
     │                             │                            │                         │
     │                             │  10. Return 200 OK         │                         │
     │                             │      {token, user}         │                         │
     │                             │ ◄───────────────────────── │                         │
     │                             │                            │                         │
     │  11. Return response        │                            │                         │
     │      to browser             │                            │                         │
     │ ◄───────────────────────── │                            │                         │
     │                             │                            │                         │
     │  12. React stores JWT       │                            │                         │
     │      in localStorage        │                            │                         │
     │      Navigates to           │                            │                         │
     │      /dashboard             │                            │                         │
     │                             │                            │                         │
     │  13. GET /api/dashboard     │                            │                         │
     │      Authorization:         │                            │                         │
     │      Bearer <JWT>           │                            │                         │
     │ ─────────────────────────►  │                            │                         │
     │                             │ ─────────────────────────► │                         │
     │                             │                            │  14. jwt.verify(token)   │
     │                             │                            │      → userId extracted  │
     │                             │                            │                         │
     │                             │                            │  15. User.findById()     │
     │                             │                            │ ────────────────────────►│
     │                             │                            │ ◄────────────────────────│
     │                             │                            │                         │
     │                             │  16. Return dashboard data │                         │
     │  ◄──────────────────────────┼────────────────────────────│                         │
     │                             │                            │                         │
     │  17. React renders          │                            │                         │
     │      "Welcome back, Mihir!" │                            │                         │
     │                             │                            │                         │
```

---

## 4. Docker Container Network

```
                    ┌─────────────────────────────────┐
                    │       Docker Bridge Network      │
                    │       (auto-created by compose)  │
                    │                                  │
                    │    DNS Resolution:                │
                    │    "server"     → 172.18.0.2     │
                    │    "client"     → 172.18.0.3     │
                    │    "prometheus" → 172.18.0.4     │
                    │    "grafana"    → 172.18.0.5     │
                    │                                  │
  Port 80           │    ┌────────────────────────┐    │
  (PUBLIC) ═════════╪═══►│  client (Nginx)        │    │
                    │    │  172.18.0.3             │    │
                    │    │                         │    │
                    │    │  /api/* ───────────────►├────┼──┐
                    │    └────────────────────────┘    │  │
                    │                                  │  │
                    │    ┌────────────────────────┐    │  │
  NOT exposed       │    │  server (Express)      │◄───┼──┘
  to public  ───────╪──X │  172.18.0.2            │    │
                    │    │  Port 5000 (internal)  │    │
                    │    │                         │    │
                    │    │  /metrics ◄────────────►├────┼──┐
                    │    └────────────────────────┘    │  │
                    │                                  │  │
  Port 9090         │    ┌────────────────────────┐    │  │
  (PUBLIC) ═════════╪═══►│  prometheus            │◄───┼──┘
                    │    │  172.18.0.4             │    │
                    │    │  Scrapes server:5000    │    │
                    │    │  every 5 seconds        │    │
                    │    └──────────┬─────────────┘    │
                    │               │                  │
  Port 3000         │    ┌──────────▼─────────────┐    │
  (PUBLIC) ═════════╪═══►│  grafana               │    │
                    │    │  172.18.0.5             │    │
                    │    │  Reads from prometheus  │    │
                    │    │  Shows dashboards       │    │
                    │    └────────────────────────┘    │
                    │                                  │
                    └─────────────────────────────────┘

  ═══► = Port is mapped to the host (accessible from internet)
  ───► = Internal Docker network traffic only
  ──X  = Port is NOT exposed to the host/internet
```

---

## 5. Monitoring Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Express Server                            │
│                                                              │
│  ┌─────────────┐                                             │
│  │ Middleware   │  On every request:                          │
│  │ (metrics)   │  1. Start timer                             │
│  │             │  2. When response sent:                      │
│  │             │     - Increment http_requests_total          │
│  │             │     - Record http_request_duration_seconds   │
│  └──────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────┐                │
│  │  Prometheus Registry                      │                │
│  │                                           │                │
│  │  Metrics stored in memory:                │                │
│  │  ┌─────────────────────────────────────┐  │                │
│  │  │ http_requests_total                 │  │                │
│  │  │   {POST, /api/auth/login, 200}: 15  │  │                │
│  │  │   {POST, /api/auth/login, 401}: 3   │  │                │
│  │  │   {GET, /api/dashboard, 200}: 42    │  │                │
│  │  └─────────────────────────────────────┘  │                │
│  │  ┌─────────────────────────────────────┐  │                │
│  │  │ http_request_duration_seconds       │  │                │
│  │  │   bucket{le=0.01}: 5               │  │                │
│  │  │   bucket{le=0.05}: 12              │  │                │
│  │  │   bucket{le=0.1}:  15              │  │                │
│  │  └─────────────────────────────────────┘  │                │
│  │  ┌─────────────────────────────────────┐  │                │
│  │  │ Default Node.js metrics             │  │                │
│  │  │   process_cpu_user_seconds_total    │  │                │
│  │  │   nodejs_heap_size_used_bytes       │  │                │
│  │  │   nodejs_eventloop_lag_seconds      │  │                │
│  │  └─────────────────────────────────────┘  │                │
│  └──────────────────────┬────────────────────┘                │
│                         │                                    │
│  GET /metrics           │  Returns all metrics as text       │
│  ◄──────────────────────┘                                    │
└──────────┬───────────────────────────────────────────────────┘
           │
           │ Scraped every 5 seconds
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Prometheus                                │
│                                                              │
│  Time-Series Database:                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  timestamp          metric                    value    │  │
│  │  ─────────────────  ────────────────────────  ─────── │  │
│  │  2026-08-25 10:00   http_requests_total       100     │  │
│  │  2026-08-25 10:05   http_requests_total       115     │  │
│  │  2026-08-25 10:10   http_requests_total       130     │  │
│  │  2026-08-25 10:00   nodejs_heap_size_bytes    25MB    │  │
│  │  2026-08-25 10:05   nodejs_heap_size_bytes    26MB    │  │
│  │  ...                ...                       ...     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  PromQL Query Engine:                                        │
│    rate(http_requests_total[5m]) → 3 req/sec                 │
│    histogram_quantile(0.95, ...) → 45ms p95                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ PromQL queries
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     Grafana                                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Dashboard: DevOps MERN Server                         │  │
│  │                                                        │  │
│  │  ┌──────────────────┐  ┌──────────────────┐            │  │
│  │  │  Request Rate    │  │  Response Time   │            │  │
│  │  │  ▄▄▄█████▄▄▄    │  │  ▂▃▄▅▆▇█▇▆▅▄    │            │  │
│  │  │  3.2 req/sec     │  │  p95: 45ms       │            │  │
│  │  └──────────────────┘  └──────────────────┘            │  │
│  │                                                        │  │
│  │  ┌──────────────────┐  ┌──────────────────┐            │  │
│  │  │  Memory Usage    │  │  Error Rate      │            │  │
│  │  │  ████████░░░░    │  │  ▁▁▁▁▁▁▂▁▁▁▁    │            │  │
│  │  │  26MB / 2GB      │  │  0.5%            │            │  │
│  │  └──────────────────┘  └──────────────────┘            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                             │
│  Layer 1: AWS Security Group (Network Firewall)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ALLOWED:                     BLOCKED:                 │ │
│  │  ✅ Port 22  (SSH)            ❌ Port 5000 (Express)   │ │
│  │  ✅ Port 80  (HTTP/Nginx)     ❌ All other ports       │ │
│  │  ✅ Port 3000 (Grafana)                                │ │
│  │  ✅ Port 9090 (Prometheus)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 2: Docker Network Isolation                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express server is NOT port-mapped to host             │ │
│  │  Only Nginx can reach it via Docker internal DNS       │ │
│  │  (expose: 5000, NOT ports: 5000:5000)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 3: Nginx Reverse Proxy                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  All traffic enters through port 80 (Nginx)            │ │
│  │  /api/* requests are proxied internally                │ │
│  │  Server IP/port never exposed to the browser           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 4: Application Security                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Passwords hashed with bcrypt (10 salt rounds)       │ │
│  │  • JWT tokens expire after 1 hour                      │ │
│  │  • Same error for wrong email/password (no enumeration)│ │
│  │  • Input validation on both client AND server          │ │
│  │  • Container runs as non-root "node" user              │ │
│  │  • .env files excluded from Docker images              │ │
│  │  • Secrets stored in GitHub Secrets (encrypted)        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 5: MongoDB Atlas Security                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • IP Access List (only EC2 IP can connect)            │ │
│  │  • Encrypted connections (mongodb+srv://)              │ │
│  │  • Database user with specific permissions             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. File Ownership — What Creates What

```
┌────────────────────────────┬─────────────────────────────────────────┐
│  Created By                │  Files                                   │
├────────────────────────────┼─────────────────────────────────────────┤
│  Developer (you)           │  All source code in /client and /server │
│                            │  docker-compose.yml                      │
│                            │  docker-compose.prod.yml                 │
│                            │  Dockerfiles                             │
│                            │  .github/workflows/*.yml                 │
│                            │  monitoring/ configs                     │
├────────────────────────────┼─────────────────────────────────────────┤
│  GitHub Actions CI         │  Lint reports (in Actions logs)          │
│                            │  Test results (in Actions logs)          │
│                            │  Docker images (build only, not pushed)  │
├────────────────────────────┼─────────────────────────────────────────┤
│  GitHub Actions CD         │  Docker images on GHCR                   │
│                            │  ~/app/.env on EC2                       │
│                            │  ~/app/docker-compose.prod.yml on EC2    │
│                            │  ~/app/monitoring/ on EC2                │
├────────────────────────────┼─────────────────────────────────────────┤
│  Docker Compose on EC2     │  Running containers                      │
│                            │  Docker volumes (prometheus-data,        │
│                            │                  grafana-data)           │
│                            │  Docker bridge network                   │
├────────────────────────────┼─────────────────────────────────────────┤
│  MongoDB Atlas             │  "users" collection in "devops" database │
├────────────────────────────┼─────────────────────────────────────────┤
│  Prometheus                │  Time-series metric data (in volume)     │
├────────────────────────────┼─────────────────────────────────────────┤
│  Grafana                   │  Dashboard configurations (in volume)    │
└────────────────────────────┴─────────────────────────────────────────┘
```
