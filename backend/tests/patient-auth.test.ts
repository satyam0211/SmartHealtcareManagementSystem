import request from 'supertest';
import app from '../src/app';
import { dbPool, dbQuery } from '../src/config/database';
import jwt from 'jsonwebtoken';

const mockVerifyIdToken = jest.fn();
const mockAuthInstance = {
  verifyIdToken: mockVerifyIdToken,
};

jest.mock('../src/config/firebase.config', () => {
  return {
    firebaseAdmin: {
      auth: () => mockAuthInstance,
    },
  };
});

describe('Patient Authentication and Session Integration API', () => {
  const testPhone = '+1555019922';
  let firstPatientId: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Delete any test patient rows created
    await dbQuery("DELETE FROM patients WHERE phone IN (SELECT phone FROM patients) AND name LIKE '%Self-Registered%'");
    await dbPool.end();
  });

  describe('POST /v1/auth/patients/login', () => {
    test('Should successfully login a new patient (auto-register) and return 1-hour session token', async () => {
      // 1. Mock firebase token signature validation success
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-test-123',
        phone_number: testPhone,
      });

      const response = await request(app)
        .post('/v1/auth/patients/login')
        .send({
          idToken: 'mock-valid-firebase-jwt-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionToken).toBeDefined();
      expect(response.body.data.patient.id).toBeDefined();
      expect(response.body.data.patient.uhid).toContain('UHID-');

      firstPatientId = response.body.data.patient.id;

      // Verify patient was inserted in database
      const dbResult = await dbQuery('SELECT * FROM patients WHERE id = $1', [response.body.data.patient.id]);
      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].uhid).toBe(response.body.data.patient.uhid);

      // Verify JWT properties (role Patient, 1-hour expiration)
      const decoded: any = jwt.decode(response.body.data.sessionToken);
      expect(decoded.role).toBe('Patient');
      expect(decoded.patientId).toBe(response.body.data.patient.id);
      expect(decoded.uhid).toBe(response.body.data.patient.uhid);
      
      const expectedExpiration = Math.floor(Date.now() / 1000) + 3600;
      expect(Math.abs(decoded.exp - expectedExpiration)).toBeLessThanOrEqual(5); // Expire within 5s of now
    });

    test('Should map to existing patient if phone number already exists', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-test-456',
        phone_number: testPhone, // Uses the same phone number as the previous test
      });

      const response = await request(app)
        .post('/v1/auth/patients/login')
        .send({
          idToken: 'mock-valid-firebase-jwt-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify no duplicate patient was created by checking returned patient ID
      expect(response.body.data.patient.id).toBe(firstPatientId);
    });

    test('Should return 401 for invalid or expired Firebase token', async () => {
      // Mock verification throw
      mockVerifyIdToken.mockRejectedValue(new Error('Firebase token expired'));

      const response = await request(app)
        .post('/v1/auth/patients/login')
        .send({
          idToken: 'mock-expired-firebase-jwt-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('Should return 400 for missing idToken', async () => {
      const response = await request(app)
        .post('/v1/auth/patients/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ID Token is required');
    });
  });

  describe('GET /v1/patients/:id (Token Validation Guard)', () => {
    test('Should access endpoint successfully using valid Patient session JWT', async () => {
      // Log in to get session token
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-test-789',
        phone_number: '+1555987654',
      });

      const loginRes = await request(app)
        .post('/v1/auth/patients/login')
        .send({ idToken: 'mock-valid-token' });

      const token = loginRes.body.data.sessionToken;
      const patientId = loginRes.body.data.patient.id;

      const response = await request(app)
        .get(`/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.uhid).toBeDefined();
      expect(response.body.data.id).toBe(patientId);
    });

    test('Should fail to access endpoint with expired session JWT', async () => {
      const expiredToken = jwt.sign(
        {
          patientId: 'some-patient-id',
          uhid: 'UHID-2026-999999',
          role: 'Patient',
        },
        process.env.JWT_SECRET || 'ship_default_patient_jwt_secret_key_12345',
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const response = await request(app)
        .get('/v1/patients/some-patient-id')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('Should fail to access endpoint with missing Authorization header', async () => {
      const response = await request(app).get('/v1/patients/some-patient-id');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Permissions Enforcement (IT-SEC-01 / Test 2)', () => {
    test('Should block Patient session token from accessing Admin audit logs', async () => {
      // 1. Log in to get Patient session token
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-test-000',
        phone_number: '+1555111222',
      });

      const loginRes = await request(app)
        .post('/v1/auth/patients/login')
        .send({ idToken: 'mock-valid-token' });

      const token = loginRes.body.data.sessionToken;

      // 2. Try to access Admin-only /v1/admin/audit-logs
      const response = await request(app)
        .get('/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');

      // Verify that privilege escalation audit trail was logged
      const auditResult = await dbQuery(
        "SELECT * FROM audit_logs WHERE action = 'PRIVILEGE_ESCALATION_ATTEMPT' AND patient_id = $1 ORDER BY created_at DESC LIMIT 1",
        [loginRes.body.data.patient.id]
      );
      expect(auditResult.rows.length).toBe(1);
    });
  });
});
