const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  // signToken() in the controller reads this at request-time, so setting it
  // here (before any request is made) is early enough.
  process.env.JWT_SECRET = 'test-jwt-secret';
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'StrongP@ss1',
};

describe('POST /api/auth/signup', () => {
  it('creates a user and returns a token for valid input', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);

    const savedUser = await User.findOne({ email: validUser.email });
    expect(savedUser).not.toBeNull();
    // The whole point of hashing: the stored value must never equal the raw password.
    expect(savedUser.passwordHash).not.toBe(validUser.password);
  });

  it('rejects a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validUser, password: 'weak' });

    expect(res.status).toBe(400);
  });

  it('rejects a missing name', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validUser, name: '' });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const res = await request(app).post('/api/auth/signup').send(validUser);

    expect(res.status).toBe(409);
  });
});
