import request from 'supertest';
import app from '../src/app';
import { dbPool, dbQuery } from '../src/config/database';
import { sessionStore } from '../src/modules/user/user.service';
import { clearLockouts } from '../src/modules/user/user.controller';
import { generatePatientSessionToken } from '../src/modules/user/patient-auth.service';

describe('Patient Profile Integration and Concurrency Tests', () => {
  const receptionistEmail = 'receptionist.test@ship.local';
  const doctorEmail = 'doctor.test@ship.local';
  // Hashed version of 'temporary_pass' using bcrypt (work factor 10)
  const passwordHash = '$2b$10$w/P39oV6y464wvdrxpurnuIsopHywhiu/LYq9mobwIQDLRvzMX5/G';
  
  const receptionistId = 'fb000000-0000-0000-0000-000000000003';
  const doctorId = 'fb000000-0000-0000-0000-000000000004';

  const receptionistCookie = ['sessionId=receptionist-session-id-123'];
  const doctorCookie = ['sessionId=doctor-session-id-123'];
  let createdPatientId: string;
  let createdPatientUhid: string;

  beforeAll(async () => {
    // 1. Set up staff accounts
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, department_id, status)
         VALUES ($1, $2, $3, 'Receptionist', NULL, 'Active')
         ON CONFLICT (email) DO NOTHING`,
        [receptionistId, receptionistEmail, passwordHash]
      );
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, department_id, status)
         VALUES ($1, $2, $3, 'Doctor', NULL, 'Active')
         ON CONFLICT (email) DO NOTHING`,
        [doctorId, doctorEmail, passwordHash]
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
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      // Clean up audit logs first
      await client.query('DELETE FROM audit_logs WHERE user_id IN ($1, $2) OR patient_id IN (SELECT id FROM patients WHERE name LIKE $3)', [receptionistId, doctorId, 'vault:v1:%']);
      // Clean up patients (our mock patient name field encrypts to vault:v1:...)
      await client.query('DELETE FROM patients WHERE name LIKE $1', ['vault:v1:%']);
      // Clean up users
      await client.query('DELETE FROM users WHERE id IN ($1, $2)', [receptionistId, doctorId]);
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
    // Re-establish sessions
    sessionStore.createSession('receptionist-session-id-123', { id: receptionistId, email: receptionistEmail, role: 'Receptionist', departmentId: null });
    sessionStore.createSession('doctor-session-id-123', { id: doctorId, email: doctorEmail, role: 'Doctor', departmentId: null });
  });

  describe('POST /v1/patients (Registration & Input Validation)', () => {
    test('Should reject if required fields are missing', async () => {
      const response = await request(app)
        .post('/v1/patients')
        .set('Cookie', receptionistCookie)
        .send({
          name: 'Jane Doe',
          dob: '1995-10-10',
          gender: 'Female',
          // address, phone, emergencyContact, emergencyPhone are missing
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should reject if emergencyPhone contains other than exactly 10 digits', async () => {
      const response = await request(app)
        .post('/v1/patients')
        .set('Cookie', receptionistCookie)
        .send({
          name: 'Jane Doe',
          dob: '1995-10-10',
          gender: 'Female',
          address: '123 Health St',
          phone: '+15551234',
          emergencyContact: 'John Doe',
          emergencyPhone: '12345', // Invalid (not 10 digits)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should successfully register patient, generate UHID, and store fields encrypted', async () => {
      const patientData = {
        name: 'Jane Doe',
        dob: '1995-10-10',
        gender: 'Female' as const,
        address: '123 Health St',
        phone: '+15551234',
        emergencyContact: 'John Doe',
        emergencyPhone: '1234567890',
        emergencyNotes: 'No allergies',
      };

      const response = await request(app)
        .post('/v1/patients')
        .set('Cookie', receptionistCookie)
        .send(patientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.uhid).toBeDefined();

      createdPatientId = response.body.data.id;
      createdPatientUhid = response.body.data.uhid;

      // Verify database storage has FLE values (starts with vault:v1:)
      const dbResult = await dbQuery('SELECT * FROM patients WHERE id = $1', [createdPatientId]);
      expect(dbResult.rows.length).toBe(1);
      const row = dbResult.rows[0];

      expect(row.name).toMatch(/^vault:v1:.+$/);
      expect(row.dob).toMatch(/^vault:v1:.+$/);
      expect(row.address).toMatch(/^vault:v1:.+$/);
      expect(row.phone).toMatch(/^vault:v1:.+$/);
      expect(row.emergency_contact).toMatch(/^vault:v1:.+$/);
      expect(row.emergency_phone).toMatch(/^vault:v1:.+$/);
      expect(row.emergency_notes).toMatch(/^vault:v1:.+$/);
      expect(row.gender).toBe('Female'); // Unencrypted check
    });

    test('Should prevent duplicate sequential UHIDs under heavy concurrent registration requests', async () => {
      const generateRequests = Array.from({ length: 5 }).map((_, index) => {
        return request(app)
          .post('/v1/patients')
          .set('Cookie', receptionistCookie)
          .send({
            name: `Concurrent Patient ${index}`,
            dob: '1990-01-01',
            gender: 'Other',
            address: 'Concurrent Address',
            phone: `+1555200${index}`,
            emergencyContact: 'Emergency Guy',
            emergencyPhone: '1029384756',
          });
      });

      const results = await Promise.all(generateRequests);

      // All requests must succeed
      results.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      // Assert all generated UHIDs are unique
      const uhids = results.map((res) => res.body.data.uhid);
      const uniqueUhids = new Set(uhids);
      expect(uniqueUhids.size).toBe(5);

      // Verify they are sequential without assuming response order
      const sortedUhids = [...uhids].sort();
      const sequences = sortedUhids.map(u => parseInt(u.split('-')[2], 10));
      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i]).toBe(sequences[i - 1] + 1);
      }
    });
  });

  describe('GET /v1/patients/:id (Profile Retrieval & RBAC)', () => {
    test('Receptionist should be allowed to view patient details', async () => {
      const response = await request(app)
        .get(`/v1/patients/${createdPatientId}`)
        .set('Cookie', receptionistCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe'); // Decrypted
      expect(response.body.data.dob).toBe('1995-10-10'); // Decrypted
      expect(response.body.data.address).toBe('123 Health St'); // Decrypted
    });

    test('Doctor should be allowed to view patient details', async () => {
      const response = await request(app)
        .get(`/v1/patients/${createdPatientId}`)
        .set('Cookie', doctorCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe');
    });

    test('Patient should be allowed to view their own profile details via Bearer JWT', async () => {
      const patientToken = generatePatientSessionToken({ id: createdPatientId, uhid: createdPatientUhid });

      const response = await request(app)
        .get(`/v1/patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe');
    });

    test('Patient should be BLOCKED from viewing another patient profile details', async () => {
      // Create another patient
      const anotherRecep = await request(app)
        .post('/v1/patients')
        .set('Cookie', receptionistCookie)
        .send({
          name: 'Other Patient',
          dob: '1980-05-05',
          gender: 'Male',
          address: 'Other Address',
          phone: '+15558888',
          emergencyContact: 'Contact',
          emergencyPhone: '9998887776',
        });
      const otherId = anotherRecep.body.data.id;

      // Authenticate as original patient
      const patientToken = generatePatientSessionToken({ id: createdPatientId, uhid: createdPatientUhid });

      const response = await request(app)
        .get(`/v1/patients/${otherId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');

      // Verify access violation was logged
      const auditResult = await dbQuery(
        "SELECT * FROM audit_logs WHERE action = 'ACCESS_VIOLATION' AND patient_id = $1",
        [createdPatientId]
      );
      expect(auditResult.rows.length).toBe(1);
    });
  });

  describe('PUT /v1/patients/:id (Profile Updates)', () => {
    test('Receptionist can update patient details and logs pre/post state encrypted', async () => {
      const response = await request(app)
        .put(`/v1/patients/${createdPatientId}`)
        .set('Cookie', receptionistCookie)
        .send({
          name: 'Jane Smith',
          address: '456 New St',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Smith');
      expect(response.body.data.address).toBe('456 New St');

      // Verify that audit log records are written with encrypted pre/post state
      const auditResult = await dbQuery(
        "SELECT * FROM audit_logs WHERE action = 'UPDATE_PATIENT_PROFILE' AND patient_id = $1 ORDER BY created_at DESC LIMIT 1",
        [createdPatientId]
      );
      expect(auditResult.rows.length).toBe(1);
      const auditRow = auditResult.rows[0];
      expect(auditRow.pre_state).toMatch(/^vault:v1:.+$/);
      expect(auditRow.post_state).toMatch(/^vault:v1:.+$/);
    });

    test('Patient cannot update their own profile details', async () => {
      const patientToken = generatePatientSessionToken({ id: createdPatientId, uhid: createdPatientUhid });

      const response = await request(app)
        .put(`/v1/patients/${createdPatientId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Hacked Name',
        });

      // Role check should block Patient role from profile updates
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');
    });
  });

  describe('PUT /v1/patients/:id/consent (Consent opt-in/opt-out status)', () => {
    test('Patient can update their own consent flag', async () => {
      const patientToken = generatePatientSessionToken({ id: createdPatientId, uhid: createdPatientUhid });

      const response = await request(app)
        .put(`/v1/patients/${createdPatientId}/consent`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consentFlag: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.consentFlag).toBe(true);

      // Check DB
      const dbResult = await dbQuery('SELECT consent_flag FROM patients WHERE id = $1', [createdPatientId]);
      expect(dbResult.rows[0].consent_flag).toBe(true);
    });

    test('Patient cannot update other patients consent flag', async () => {
      // Create another patient
      const anotherRecep = await request(app)
        .post('/v1/patients')
        .set('Cookie', receptionistCookie)
        .send({
          name: 'Another Patient',
          dob: '1980-05-05',
          gender: 'Male',
          address: 'Other Address',
          phone: '+15554444',
          emergencyContact: 'Contact',
          emergencyPhone: '9998887776',
        });
      const otherId = anotherRecep.body.data.id;

      const patientToken = generatePatientSessionToken({ id: createdPatientId, uhid: createdPatientUhid });

      const response = await request(app)
        .put(`/v1/patients/${otherId}/consent`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          consentFlag: true,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');
    });
  });
});
