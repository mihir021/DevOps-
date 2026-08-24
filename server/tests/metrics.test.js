const request = require('supertest');
const app = require('../src/app');

describe('GET /metrics', () => {
  it('exposes Prometheus-formatted metrics', async () => {
    // Make one request first, so we know at least one data point exists.
    await request(app).get('/health');

    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
