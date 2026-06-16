import request from 'supertest';
import app from '../src/app';
import { dbPool, dbQuery } from '../src/config/database';
import { sessionStore } from '../src/modules/user/user.service';
import { clearLockouts } from '../src/modules/user/user.controller';

describe('IT-SEC-02: Role-Based Access Control (RBAC) and Privilege Escalation Protection', () => {
  const nurseEmail = 'nurse.test@ship.local';
  const nursePassword = 'temporary_pass';
  // Hashed version of 'temporary_pass' using bcrypt (work factor 10)
  const passwordHash = '$2b$10$w/P39oV6y464wvdrxpurnuIsopHywhiu/LYq9mobwIQDLRvzMX5/G';
  const nurseId = 'fb000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    // Insert a test user with role 'Nurse'
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, department_id, status)
         VALUES ($1, $2, $3, 'Nurse', NULL, 'Active')
         ON CONFLICT (email) DO NOTHING`,
        [nurseId, nurseEmail, passwordHash]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    // Delete the test user and close pool
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM audit_logs WHERE user_id = $1', [nurseId]);
      await client.query('DELETE FROM users WHERE id = $1', [nurseId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      await dbPool.end();
    }
  });

  beforeEach(() => {
    sessionStore.clearAll();
    clearLockouts();
  });

  test('IT-SEC-02: Requesting /v1/admin/audit-logs as a user with role Nurse MUST return HTTP 403, immediately terminate the session, and log the attempt', async () => {
    // 1. Log in as Nurse to establish a valid session cookie
    const loginRes = await request(app)
      .post('/v1/auth/staff/login')
      .send({
        email: nurseEmail,
        password: nursePassword,
      });

    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers['set-cookie'];
    expect(cookie).toBeDefined();

    // Parse the sessionId from the cookie
    const match = cookie[0].match(/sessionId=([^;]+)/);
    const sessionId = match ? match[1] : null;
    expect(sessionId).not.toBeNull();

    // Verify session exists in memory store
    expect(sessionStore.getSession(sessionId!)).not.toBeNull();

    // 2. Make unauthorized request to /v1/admin/audit-logs (which is restricted to Administrator)
    const testRes = await request(app)
      .get('/v1/admin/audit-logs')
      .set('Cookie', cookie);

    // Assert access is blocked
    expect(testRes.status).toBe(403);
    expect(testRes.body.success).toBe(false);
    expect(testRes.body.error).toBe('ACCESS_DENIED');

    // 3. Verify session was immediately destroyed
    expect(sessionStore.getSession(sessionId!)).toBeNull();

    // 4. Verify cookie was cleared in response headers
    const clearCookieHeader = testRes.headers['set-cookie'];
    expect(clearCookieHeader).toBeDefined();
    expect(clearCookieHeader[0]).toContain('Expires=Thu, 01 Jan 1970');

    // 5. Verify the escalation attempt was written to the AuditLogs table
    const auditRes = await dbQuery(
      `SELECT * FROM audit_logs WHERE user_id = $1 AND action = 'PRIVILEGE_ESCALATION_ATTEMPT'`,
      [nurseId]
    );

    expect(auditRes.rowCount).toBe(1);
    expect(auditRes.rows[0].entity_changed).toBe('RBAC');
  });
});
