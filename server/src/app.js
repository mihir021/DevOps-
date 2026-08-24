const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { register, metricsMiddleware } = require('./metrics/prometheus');

// The Express "app" holds all our routes and middleware.
// We keep it separate from the file that actually starts the server (src/index.js)
// so that later, our tests (Jest + Supertest) can import `app` directly
// without needing a real network port to be open.
const app = express();

// Allow the frontend (running on a different port, e.g. Vite's :5173) to call this API.
app.use(cors());

// Parse incoming JSON request bodies (needed for signup/login endpoints)
app.use(express.json());

// Records request count + duration for every route below this line.
app.use(metricsMiddleware);

// Health check route.
// Purpose: lets Docker, CI/CD, and monitoring tools ask "is this container alive?"
// It intentionally does nothing fancy - just confirms the process is up and responding.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Prometheus scrapes this endpoint on a timer (see monitoring/prometheus.yml)
// to pull the latest metric values.
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = app;
