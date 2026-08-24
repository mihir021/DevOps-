const client = require('prom-client');

// A dedicated registry (rather than the global default) keeps this explicit
// about exactly which metrics we expose.
const register = new client.Registry();

// Default Node.js process metrics: CPU usage, memory (heap/RSS), event loop
// lag, active handles, etc. Free observability with one line.
client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Express middleware: times every request and records it under the route's
// *pattern* (e.g. "/api/auth/signup"), not the raw URL. Using the raw URL
// would create a new, ever-growing metric label for every unique value
// (e.g. every different user ID), which is a classic Prometheus mistake.
function metricsMiddleware(req, res, next) {
  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
}

module.exports = { register, metricsMiddleware };
