# Docker — Detailed Explanation

## What Is Docker?

Docker lets you **package your app + all its dependencies** into a single "container"
that runs the same way on any machine. Instead of "it works on my machine" problems,
Docker guarantees: if it works in the container, it works everywhere.

---

## Containers in This Project

| Container | Base Image | Purpose | Port |
| --- | --- | --- | --- |
| `devops-mern-server` | `node:22-alpine` | Express API (Node.js) | 5000 (internal) |
| `devops-mern-client` | `nginx:alpine` | React app + Reverse proxy | 80 (public) |
| `devops-mern-prometheus` | `prom/prometheus` | Metrics collection | 9090 |
| `devops-mern-grafana` | `grafana/grafana` | Metrics dashboards | 3000 |

---

## Server Dockerfile Explained

**File:** `server/Dockerfile`

```dockerfile
# ---- Stage 1: install production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```

**What's happening:**
- `FROM node:22-alpine AS deps` — Start from a tiny Linux image with Node.js 22
  - `alpine` = ~5MB base image (vs ~900MB for `node:22` full)
  - `AS deps` = name this stage "deps" so we can reference it later
- `WORKDIR /app` — All commands run inside `/app` directory
- `COPY package.json package-lock.json` — Copy only dependency files first
- `npm ci --omit=dev` — Install ONLY production dependencies (no jest, nodemon, etc.)
  - This is a separate stage so Docker can **cache** this layer
  - If you change only source code (not dependencies), Docker skips this step

```dockerfile
# ---- Stage 2: final runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 5000
```

**What's happening:**
- `FROM node:22-alpine AS runner` — Fresh image (no build artifacts from Stage 1)
- `COPY --from=deps` — Copy only `node_modules` from Stage 1 (not the entire filesystem)
- `USER node` — Run as non-root user (security: if the container is hacked, the attacker can't do root-level damage)
- `EXPOSE 5000` — Documents that this container listens on port 5000

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', ...)"
CMD ["node", "src/index.js"]
```

**What's happening:**
- `HEALTHCHECK` — Docker periodically checks if the app is alive
  - Every 30 seconds, it sends a GET request to `/health`
  - If it fails 3 times in a row → container is marked "unhealthy"
  - `start-period=10s` — Wait 10 seconds before first check (app needs time to start)
- `CMD` — The command that runs when the container starts

---

## Client Dockerfile Explained

**File:** `client/Dockerfile`

### Stage 1: Build the React App
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

- Installs ALL dependencies (including dev deps like Vite)
- Runs `vite build` → produces static HTML/CSS/JS in `/app/dist`
- This stage is only used for building — it's thrown away after

### Stage 2: Serve with Nginx
```dockerfile
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- Starts from a tiny Nginx image (~7MB)
- Copies the built React files from Stage 1
- Copies custom Nginx config (reverse proxy + SPA routing)
- **No Node.js in this image at all** — just a static file server

### Why Multi-Stage Builds?

```
Without multi-stage:          With multi-stage:
─────────────────            ─────────────────
node:22-alpine   250MB      nginx:alpine      25MB
+ npm install    +400MB     + HTML/CSS/JS      +1MB
+ source code    +5MB       ─────────────────
+ built files    +1MB       Total: ~26MB ✅
─────────────────
Total: ~656MB ❌
```

The final image is **~26x smaller** because it only contains what's needed to run.

---

## Docker Compose — Local Development

**File:** `docker-compose.yml`

```yaml
services:
  server:
    build: ./server                    # Build from local Dockerfile
    ports:
      - "${SERVER_PORT:-5000}:5000"    # Map host port to container port
    healthcheck: ...                   # Check /health endpoint

  client:
    build: ./client                    # Build from local Dockerfile
    ports:
      - "${CLIENT_PORT:-8080}:80"      # Map host:8080 → container:80
    depends_on:
      server:
        condition: service_healthy     # Wait until server is healthy

  prometheus:
    image: prom/prometheus:latest      # Pull pre-built image
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
```

**Key concepts:**
- `build: ./server` — Build Docker image from local source code
- `ports: "8080:80"` — Expose container's port 80 on your machine's port 8080
- `depends_on: condition: service_healthy` — Don't start client until server's healthcheck passes
- `volumes:` — Mount local files into the container (changes reflect without rebuild)
- `:ro` — Read-only mount (container can't modify the file)

---

## Docker Compose — Production

**File:** `docker-compose.prod.yml`

Key differences from local:

| Feature | Local (`docker-compose.yml`) | Production (`docker-compose.prod.yml`) |
| --- | --- | --- |
| Images | Built from source (`build:`) | Pulled from GHCR (`image:`) |
| Server port | Exposed publicly (`ports:`) | Internal only (`expose:`) |
| Client port | `8080:80` | `80:80` |
| Env vars | From `server/.env` file | From `~/app/.env` (created by CD) |
| Data | No persistence | Volumes for Prometheus + Grafana data |

```yaml
server:
  image: ghcr.io/mihir021/devops-mern-server:latest
  expose:
    - "5000"     # Only accessible to other containers, NOT from the internet
```

**`expose` vs `ports`:**
- `expose: "5000"` — Other containers can reach this port via Docker network
- `ports: "5000:5000"` — The port is open to the entire internet
- Production only uses `expose` for security — Nginx handles all public traffic

---

## Useful Docker Commands

```bash
# Build and start all containers
docker compose up --build

# Start in background (detached mode)
docker compose up -d

# View running containers
docker ps

# View logs of a specific container
docker logs devops-mern-server
docker logs devops-mern-client

# Stop all containers
docker compose down

# Stop and remove volumes (full cleanup)
docker compose down -v

# Rebuild a single service
docker compose build server

# Enter a running container's shell
docker exec -it devops-mern-server sh

# Check container health status
docker inspect --format='{{.State.Health.Status}}' devops-mern-server

# Clean up unused images
docker image prune -f

# Check disk space used by Docker
docker system df
```
