const request = require('supertest');
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
  name: 'Login Test User',
  email: 'login-test@example.com',
  password: 'StrongP@ss1',
};

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create the account through the real signup route, so these tests
    // don't depend on the internal shape of a User document.
    await request(app).post('/api/auth/signup').send(credentials);
  });

  it('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(res.status).toBe(401);
  });

  it('rejects a request missing the password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email });

    expect(res.status).toBe(400);
  });
});
