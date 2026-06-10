const { request, app, prisma, cleanDb } = require('./helpers/setup');
const bcrypt = require('bcryptjs');

let superadminToken, adminAlphaToken, adminBetaToken, memberAlphaToken, memberBetaToken;
let orgAlpha, orgBeta, projectAlpha, projectBeta;

beforeAll(async () => {
  await cleanDb();

  const hash = (p) => bcrypt.hash(p, 10);

  // ─── Superadmin ──────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'super@test.com',
      password: await hash('super123'),
      role: 'SUPERADMIN',
    },
  });

  // ─── Org Alpha ───────────────────────────────────────────────────────────
  orgAlpha = await prisma.organization.create({ data: { name: 'Org Alpha Test' } });

  await prisma.user.create({
    data: {
      email: 'admin@alpha.test',
      password: await hash('admin123'),
      role: 'ADMIN',
      organizationId: orgAlpha.id,
    },
  });

  projectAlpha = await prisma.project.create({
    data: { name: 'Project Alpha Test', organizationId: orgAlpha.id },
  });

  const memberAlpha = await prisma.user.create({
    data: {
      email: 'member@alpha.test',
      password: await hash('member123'),
      role: 'MEMBER',
      organizationId: orgAlpha.id,
    },
  });
  await prisma.projectMember.create({
    data: { userId: memberAlpha.id, projectId: projectAlpha.id },
  });

  // ─── Org Beta ────────────────────────────────────────────────────────────
  orgBeta = await prisma.organization.create({ data: { name: 'Org Beta Test' } });

  await prisma.user.create({
    data: {
      email: 'admin@beta.test',
      password: await hash('admin123'),
      role: 'ADMIN',
      organizationId: orgBeta.id,
    },
  });

  projectBeta = await prisma.project.create({
    data: { name: 'Project Beta Test', organizationId: orgBeta.id },
  });

  const memberBeta = await prisma.user.create({
    data: {
      email: 'member@beta.test',
      password: await hash('member123'),
      role: 'MEMBER',
      organizationId: orgBeta.id,
    },
  });
  await prisma.projectMember.create({
    data: { userId: memberBeta.id, projectId: projectBeta.id },
  });

  // ─── Acquire all tokens ───────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token;
  };

  superadminToken  = await login('super@test.com', 'super123');
  adminAlphaToken  = await login('admin@alpha.test', 'admin123');
  adminBetaToken   = await login('admin@beta.test', 'admin123');
  memberAlphaToken = await login('member@alpha.test', 'member123');
  memberBetaToken  = await login('member@beta.test', 'member123');
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// ─── SUPERADMIN ───────────────────────────────────────────────────────────────
describe('SUPERADMIN access', () => {
  test('can GET all organizations', async () => {
    const res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('can GET all projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });

  test('can GET Org Alpha by ID', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgAlpha.id}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });

  test('can GET Org Beta by ID', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgBeta.id}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });

  test('can GET projects within any org', async () => {
    const res = await request(app)
      .get(`/api/projects/org/${orgBeta.id}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── ADMIN ISOLATION ─────────────────────────────────────────────────────────
describe('ADMIN isolation', () => {
  test('cannot GET all organizations — 403', async () => {
    const res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('cannot GET all projects — 403', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('can GET their own org by ID', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgAlpha.id}`)
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(200);
  });

  test('cannot GET another org by ID — 403', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgBeta.id}`)
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('can GET projects within own org', async () => {
    const res = await request(app)
      .get(`/api/projects/org/${orgAlpha.id}`)
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(200);
  });

  test('cannot GET projects of another org — 403', async () => {
    const res = await request(app)
      .get(`/api/projects/org/${orgBeta.id}`)
      .set('Authorization', `Bearer ${adminAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('Admin Beta cannot access Org Alpha — 403', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgAlpha.id}`)
      .set('Authorization', `Bearer ${adminBetaToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── MEMBER ISOLATION ────────────────────────────────────────────────────────
describe('MEMBER isolation', () => {
  test('cannot GET all organizations — 403', async () => {
    const res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('cannot GET all projects — 403', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('cannot GET org-level projects — 403', async () => {
    const res = await request(app)
      .get(`/api/projects/org/${orgAlpha.id}`)
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('can GET their own project (is a member)', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectAlpha.id}`)
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(200);
  });

  test('cannot GET a project in another org — 403', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectBeta.id}`)
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(403);
  });

  test('Member Beta cannot GET Project Alpha — 403', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectAlpha.id}`)
      .set('Authorization', `Bearer ${memberBetaToken}`);
    expect(res.status).toBe(403);
  });

  test('Member Alpha cannot GET Project Beta — 403', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectBeta.id}`)
      .set('Authorization', `Bearer ${memberAlphaToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── UNAUTHENTICATED ─────────────────────────────────────────────────────────
describe('Unauthenticated requests', () => {
  test('returns 401 (not 403) on /organizations with no token', async () => {
    const res = await request(app).get('/api/organizations');
    expect(res.status).toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('returns 401 (not 403) on /projects with no token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('returns 401 on /auth/me with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
