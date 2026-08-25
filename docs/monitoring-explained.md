# Monitoring — Prometheus & Grafana Explained

## What Is Monitoring?

Monitoring lets you **see what's happening inside your running application** in real-time:
- How many requests per second?
- What's the average response time?
- How much memory is the server using?
- Are there any errors?

This project uses two tools: **Prometheus** (collects metrics) and **Grafana** (visualizes them).

---

## How It Works — The Full Flow

```
┌────────────┐  every 5s    ┌──────────────┐  query   ┌───────────┐
│  Express   │◄─────────────│  Prometheus  │◄─────────│  Grafana  │
│  Server    │──────────────►│              │─────────►│           │
│            │  GET /metrics │  Stores data │  PromQL  │  Shows    │
│  Port 5000 │               │  Port 9090   │          │  graphs   │
└────────────┘               └──────────────┘          │  Port 3000│
                                                       └───────────┘
```

1. **Express server** exposes a `GET /metrics` endpoint with metric data
2. **Prometheus** scrapes (pulls) this endpoint every 5 seconds and stores the data
3. **Grafana** queries Prometheus using PromQL and displays beautiful dashboards

---

## Part 1: Metrics in Express Server

### File: `server/src/metrics/prometheus.js`

This file sets up what metrics the server tracks:

#### 1. Default Node.js Metrics (automatic)
```javascript
client.collectDefaultMetrics({ register });
```

This one line automatically tracks:
- **CPU usage** — How much CPU your Node.js process is using
- **Memory (heap/RSS)** — How much RAM is in use
- **Event loop lag** — If your server is falling behind processing requests
- **Active handles** — Open connections, file handles, etc.
- **Garbage collection** — How often and how long GC runs

#### 2. HTTP Request Duration (Histogram)
```javascript
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
```

- **Histogram** = records the distribution of values (not just the average)
- **Buckets** = groups response times: "How many requests took < 10ms? < 50ms? < 100ms?"
- **Labels** = categorize by method (GET/POST), route (/api/auth/login), and status (200/401/500)

#### 3. HTTP Request Count (Counter)
```javascript
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
```

- **Counter** = a number that only goes up (total requests served since server start)
- With labels, you can filter: "How many POST /api/auth/login returned 401?"

#### 4. Metrics Middleware
```javascript
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
```

This runs on **every request**:
1. Start a timer when the request arrives
2. When the response is sent (`finish` event):
   - Increment the request counter
   - Stop the timer and record the duration
3. Uses the **route pattern** (e.g., `/api/auth/login`) not the raw URL

---

## Part 2: Prometheus Configuration

### File: `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'devops-mern-server'
    static_configs:
      - targets: ['server:5000']
```

- **`scrape_interval: 5s`** — Pull metrics from the server every 5 seconds
- **`targets: ['server:5000']`** — The server container's hostname on the Docker network
  - `server` is resolved by Docker's internal DNS to the container's IP
  - This only works between containers (not from your browser)
- Prometheus sends `GET http://server:5000/metrics` every 5 seconds

### What the `/metrics` Endpoint Returns

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/api/auth/login",status_code="200"} 15
http_requests_total{method="POST",route="/api/auth/login",status_code="401"} 3
http_requests_total{method="GET",route="/api/dashboard",status_code="200"} 42

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",route="/api/auth/login",le="0.01"} 2
http_request_duration_seconds_bucket{method="POST",route="/api/auth/login",le="0.05"} 10
http_request_duration_seconds_bucket{method="POST",route="/api/auth/login",le="0.1"} 15

# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 2.34

# HELP nodejs_heap_size_used_bytes Process heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 25600000
```

---

## Part 3: Grafana Configuration

### Auto-Provisioned Datasource
**File:** `monitoring/grafana/provisioning/datasources/datasource.yml`

```yaml
datasources:
  - name: Prometheus
    uid: prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

- Automatically registers Prometheus as a data source when Grafana starts
- No need to manually add it through the Grafana UI
- `uid: prometheus` — Fixed ID so the dashboard JSON can reference it

### Pre-Built Dashboard
**File:** `monitoring/grafana/provisioning/dashboards/devops-mern-dashboard.json`

A JSON file that defines a complete Grafana dashboard with panels showing:
- Request rate (requests per second)
- Response time percentiles (p50, p90, p99)
- Error rates by endpoint
- Node.js memory usage
- CPU utilization

---

## How to Access Monitoring

### Prometheus UI
- **URL:** `http://<EC2-IP>:9090`
- Go to **Status → Targets** to see if the server is being scraped successfully
- Use **Graph** to write PromQL queries:
  - `rate(http_requests_total[5m])` — Requests per second over last 5 minutes
  - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` — 95th percentile response time

### Grafana UI
- **URL:** `http://<EC2-IP>:3000`
- **Login:** `admin` / (your GRAFANA_ADMIN_PASSWORD from GitHub Secrets)
- The pre-built dashboard should appear automatically

---

## Useful PromQL Queries

| What You Want to Know | PromQL Query |
| --- | --- |
| Total requests per second | `rate(http_requests_total[5m])` |
| Requests per second by endpoint | `sum by(route)(rate(http_requests_total[5m]))` |
| Error rate (5xx errors) | `rate(http_requests_total{status_code=~"5.."}[5m])` |
| 95th percentile response time | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| Average response time | `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])` |
| Memory usage (MB) | `nodejs_heap_size_used_bytes / 1024 / 1024` |
| CPU usage | `rate(process_cpu_user_seconds_total[5m])` |
