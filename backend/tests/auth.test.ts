import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import { OTP } from 'otplib';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const unique = Date.now();
const totp = new OTP({ strategy: 'totp' });
// Dedicated accounts rather than the seeded admin@example.com. The MFA tests
// switch `mfaSecret` on and off, and `node --test` runs test files
// concurrently — sharing the seeded admin with api.test.ts would let its
// login land inside that window and receive an `mfaRequired` challenge
// instead of tokens.
const adminEmail = `auth-admin-${unique}@example.com`;
const adminPassword = 'AuthAdmin!2026x';
const staffEmail = `auth-staff-${unique}@example.com`;
const staffPassword = 'AuthStaff!2026x';
const createdUserIds: number[] = [];
let staffId = 0;

async function login(email: string, password: string) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  return { agent, response };
}

describe('auth', () => {
  before(async () => {
    const admin = await prisma.user.create({
      data: {
        name: `Auth Admin ${unique}`,
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'ADMIN',
      },
    });
    const staff = await prisma.user.create({
      data: {
        name: `Auth Staff ${unique}`,
        email: staffEmail,
        passwordHash: await bcrypt.hash(staffPassword, 12),
        role: 'STAFF',
      },
    });

    staffId = staff.id;
    createdUserIds.push(admin.id, staff.id);
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  it('does not reveal whether an email exists', async () => {
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: `nobody-${unique}@example.com`, password: 'WrongPassword!1' });
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: staffEmail, password: 'WrongPassword!1' });

    assert.equal(unknown.status, 401);
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknown.body.error, wrongPassword.body.error);
  });

  it('answers an invalid or absent refresh token with 401, not 500', async () => {
    const missing = await request(app).post('/api/auth/refresh').send({});
    assert.equal(missing.status, 401);

    const garbage = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=not.a.jwt', 'csrfToken=abc'])
      .set('X-CSRF-Token', 'abc')
      .send({});
    assert.equal(garbage.status, 401);
  });

  it('rejects an admin-only route for a staff account', async () => {
    const { response } = await login(staffEmail, staffPassword);
    assert.equal(response.status, 200);

    const users = await request(app).get('/api/users').set('Authorization', `Bearer ${response.body.accessToken}`);
    assert.equal(users.status, 403);
  });

  it('rotates the access token on refresh while the session is valid', async () => {
    const { agent, response } = await login(staffEmail, staffPassword);
    assert.equal(response.status, 200);

    const refreshed = await agent
      .post('/api/auth/refresh')
      .set('X-CSRF-Token', response.body.csrfToken)
      .send({});

    assert.equal(refreshed.status, 200);
    assert.ok(refreshed.body.accessToken);

    const items = await request(app).get('/api/items').set('Authorization', `Bearer ${refreshed.body.accessToken}`);
    assert.equal(items.status, 200);
  });

  it('invalidates outstanding tokens when the password changes', async () => {
    const { agent, response } = await login(staffEmail, staffPassword);
    assert.equal(response.status, 200);
    const staffToken = response.body.accessToken;

    const admin = await login(adminEmail, adminPassword);
    const changed = await admin.agent
      .patch(`/api/users/${staffId}`)
      .set('Authorization', `Bearer ${admin.response.body.accessToken}`)
      .set('X-CSRF-Token', admin.response.body.csrfToken)
      .send({ password: `Rotated!${unique}aB` });
    assert.equal(changed.status, 200);

    // Both the access token and the refresh token issued before the bump are dead.
    const withOldAccess = await request(app).get('/api/items').set('Authorization', `Bearer ${staffToken}`);
    assert.equal(withOldAccess.status, 401);

    const withOldRefresh = await agent
      .post('/api/auth/refresh')
      .set('X-CSRF-Token', response.body.csrfToken)
      .send({});
    assert.equal(withOldRefresh.status, 401);
  });

  it('completes a TOTP MFA challenge', async () => {
    const secret = totp.generateSecret();
    await prisma.user.update({ where: { email: adminEmail }, data: { mfaSecret: secret } });

    try {
      const { agent, response } = await login(adminEmail, adminPassword);

      // An MFA-enabled account gets a challenge instead of tokens.
      assert.equal(response.status, 200);
      assert.equal(response.body.mfaRequired, true);
      assert.ok(response.body.pendingToken);
      assert.equal(response.body.accessToken, undefined);

      const wrongCode = await agent
        .post('/api/auth/login/mfa')
        .send({ pendingToken: response.body.pendingToken, code: '000000' });
      assert.equal(wrongCode.status, 401);

      const completed = await agent.post('/api/auth/login/mfa').send({
        pendingToken: response.body.pendingToken,
        code: await totp.generate({ secret }),
      });

      assert.equal(completed.status, 200);
      assert.ok(completed.body.accessToken);
      assert.equal(completed.body.user.email, adminEmail);

      const items = await request(app).get('/api/items').set('Authorization', `Bearer ${completed.body.accessToken}`);
      assert.equal(items.status, 200);
    } finally {
      await prisma.user.update({ where: { email: adminEmail }, data: { mfaSecret: null } });
    }
  });

  it('rejects an MFA challenge token that was not issued for this flow', async () => {
    const secret = totp.generateSecret();
    await prisma.user.update({ where: { email: adminEmail }, data: { mfaSecret: secret } });

    try {
      const { response } = await login(adminEmail, adminPassword);
      const forged = await request(app)
        .post('/api/auth/login/mfa')
        .send({ pendingToken: 'forged.pending.token', code: await totp.generate({ secret }) });

      assert.equal(response.body.mfaRequired, true);
      assert.equal(forged.status, 401);
    } finally {
      await prisma.user.update({ where: { email: adminEmail }, data: { mfaSecret: null } });
    }
  });
});
