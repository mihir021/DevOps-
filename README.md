# DevOps MERN Learning Project

[![CI](https://github.com/mihir021/DevOps-/actions/workflows/ci.yml/badge.svg)](https://github.com/mihir021/DevOps-/actions/workflows/ci.yml)

A deliberately small MERN app (signup, login, protected dashboard) used as a
vehicle for learning a real DevOps pipeline: testing, Docker, CI, CD, and
monitoring.

See [`devops-mern-project-plan.md`](./devops-mern-project-plan.md) for the
original plan and [`learning-roadmap.md`](./learning-roadmap.md) for the
step-by-step build log.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** JWT + bcrypt-style hashing (`bcryptjs`)
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- **Containers:** Docker + Docker Compose
- **CI:** GitHub Actions

## Running Locally (without Docker)

**Backend:**
```
cd server
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

**Frontend** (in a separate terminal):
```
cd client
cp .env.example .env   # fill in VITE_API_URL, e.g. http://localhost:5000/api
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

## Running with Docker Compose

```
docker compose up --build
```

This builds and starts both containers:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:8080`

The database is still your MongoDB Atlas cluster - `server/.env` is passed
into the container via `env_file` in `docker-compose.yml`, not baked into
the image.

## Testing

```
cd server && npm test
cd client && npm test
```

Backend tests use `mongodb-memory-server` (a temporary in-memory MongoDB),
so they never touch the real Atlas database. Frontend tests mock the API
layer, so they never make real network calls.

## Linting

```
cd server && npm run lint
cd client && npm run lint
```

## CI

Every push and pull request runs `.github/workflows/ci.yml`, which:
1. Lints and tests the backend
2. Lints, tests, and builds the frontend
3. Builds (but doesn't push) both Docker images
4. On any branch other than `main`, attempts a dummy merge with `main` to
   catch merge conflicts before you even open a PR
