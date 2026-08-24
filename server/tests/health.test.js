const request = require('supertest');
const app = require('../src/app');

// This is our "does the test harness even work" check.
// Supertest calls the Express app directly in-memory - no real port, no
// database needed - which is why it's safe as a first trivial test.
describe('GET /health', () => {
  it('responds with 200 and status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
