const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

const credentials = {
  name: 'Dashboard Test User',
  email: 'dashboard-test@example.com',
  password: 'StrongP@ss1',
};

async function signupAndGetToken() {
  const res = await request(app).post('/api/auth/signup').send(credentials);
  return res.body.token;
}

describe('GET /api/dashboard', () => {
  it('returns user info with a valid token', async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'NotBearer sometoken');

    expect(res.status).toBe(401);
  });

  it('rejects an invalid/tampered token', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ userId: 'irrelevant' }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
