import request from 'supertest';
import app from '../src/app';
import { sessionStore } from '../src/modules/user/user.service';
import { clearLockouts } from '../src/modules/user/user.controller';
import { dbPool } from '../src/config/database';

describe('Staff Authentication and Session Management API', () => {
  const testEmail = 'superadmin@ship.local';
  const testPassword = 'temporary_pass';

  beforeEach(() => {
    // Clear session store and lockout map before each test to guarantee isolation
    sessionStore.clearAll();
    clearLockouts();
  });

  afterAll(async () => {
    // Clean up and close DB connections
    await dbPool.end();
  });

  describe('POST /v1/auth/staff/login', () => {
    test('Should successfully login and set cookie with correct properties', async () => {
      const response = await request(app)
        .post('/v1/auth/staff/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.role).toBe('Super Admin');

      // Verify Set-Cookie header attributes
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThan(0);

      const sessionCookie = cookies[0];
      expect(sessionCookie).toContain('sessionId=');
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('SameSite=Strict');
    });

    test('Should reject invalid email format', async () => {
      const response = await request(app)
        .post('/v1/auth/staff/login')
        .send({
          email: 'invalid-email',
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email');
    });

    test('Should reject short passwords (< 8 chars)', async () => {
      const response = await request(app)
        .post('/v1/auth/staff/login')
        .send({
          email: testEmail,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at least 8 characters');
    });

    test('Should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/v1/auth/staff/login')
        .send({
          email: testEmail,
          password: 'wrong_password_123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('Should lockout account for 15 minutes after 5 consecutive failures', async () => {
      // Execute 4 failed attempts
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/v1/auth/staff/login')
          .send({ email: testEmail, password: 'wrong_password' });
        expect(res.status).toBe(401);
      }

      // 5th attempt triggers lockout
      const fifthRes = await request(app)
        .post('/v1/auth/staff/login')
        .send({ email: testEmail, password: 'wrong_password' });
      
      expect(fifthRes.status).toBe(423); // Locked
      expect(fifthRes.body.error).toContain('locked');

      // Subsequent attempt with correct credentials should still be locked
      const lockedRes = await request(app)
        .post('/v1/auth/staff/login')
        .send({ email: testEmail, password: testPassword });
      
      expect(lockedRes.status).toBe(423);
    });
  });

  describe('GET /v1/auth/staff/session', () => {
    test('Should return 401 if request has no session cookie', async () => {
      const response = await request(app).get('/v1/auth/staff/session');
      expect(response.status).toBe(401);
    });

    test('Should return user session details for valid cookie', async () => {
      // First log in to get session cookie
      const loginRes = await request(app)
        .post('/v1/auth/staff/login')
        .send({ email: testEmail, password: testPassword });

      const cookie = loginRes.headers['set-cookie'];

      const response = await request(app)
        .get('/v1/auth/staff/session')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
    });

    test('Should reject and clear expired sessions (idle timeout mock)', async () => {
      // Log in
      const loginRes = await request(app)
        .post('/v1/auth/staff/login')
        .send({ email: testEmail, password: testPassword });

      const cookie = loginRes.headers['set-cookie'];

      // Mock date 16 minutes in the future (idle timeout is 15 minutes)
      const originalNow = Date.now;
      Date.now = () => originalNow() + 16 * 60 * 1000;

      try {
        const response = await request(app)
          .get('/v1/auth/staff/session')
          .set('Cookie', cookie);

        expect(response.status).toBe(401);
        expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970'); // cleared
      } finally {
        Date.now = originalNow; // Restore original function
      }
    });
  });

  describe('POST /v1/auth/staff/logout', () => {
    test('Should destroy session and clear session cookie', async () => {
      const loginRes = await request(app)
        .post('/v1/auth/staff/login')
        .send({ email: testEmail, password: testPassword });

      const cookie = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/v1/auth/staff/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify session is invalidated
      const sessionRes = await request(app)
        .get('/v1/auth/staff/session')
        .set('Cookie', cookie);

      expect(sessionRes.status).toBe(401);
    });
  });
});
