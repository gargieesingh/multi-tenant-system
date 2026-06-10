const { request, app, cleanDb, prisma } = require('./helpers/setup');

beforeAll(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// ─── REGISTER ────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  test('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  test('rejects missing email with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  test('rejects missing password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nopass@example.com',
    });
    expect(res.status).toBe(400);
  });

  test('rejects short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('rejects invalid email format with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@example.com',
      password: 'password123',
    });
  });

  test('returns JWT token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
  });

  test('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('rejects non-existent email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  test('rejects missing credentials with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ─── ME ──────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    token = loginRes.body.data.token;
  });

  test('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer tampered.jwt.token');
    expect(res.status).toBe(401);
  });

  test('returns 401 with malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'NotBearer abc');
    expect(res.status).toBe(401);
  });
});
