import request from 'supertest';
import app from '../src/app';
import { dbPool, dbQuery } from '../src/config/database';
import { sessionStore } from '../src/modules/user/user.service';
import { generatePatientSessionToken } from '../src/modules/user/patient-auth.service';

describe('Triage Vital Signs Integration and Encryption Tests', () => {
  const receptionistId = 'cb000000-0000-0000-0000-000000000001';
  const receptionistEmail = 'receptionist.vitals@ship.local';


  const nurseId = 'cb000000-0000-0000-0000-000000000002';
  const nurseEmail = 'nurse.vitals@ship.local';
  const nurseCookie = ['sessionId=nurse-vitals-session-123'];

  const doctorUserId = 'cb000000-0000-0000-0000-000000000003';
  const doctorEmail = 'doctor.vitals@ship.local';
  const doctorCookie = ['sessionId=doctor-vitals-session-123'];

  const billingUserId = 'cb000000-0000-0000-0000-000000000004';
  const billingEmail = 'billing.vitals@ship.local';
  const billingCookie = ['sessionId=billing-vitals-session-123'];

  const patientIdA = 'cb000000-0000-0000-0000-00000000000a';
  const patientUhidA = 'UHID-2026-00000a';
  let patientTokenA: string;

  const patientIdB = 'cb000000-0000-0000-0000-00000000000b';
  const patientUhidB = 'UHID-2026-00000b';
  let patientTokenB: string;

  const passwordHash = '$2b$10$w/P39oV6y464wvdrxpurnuIsopHywhiu/LYq9mobwIQDLRvzMX5/G'; // 'temporary_pass'
  let queueTokenId: string;
  let appointmentId: string;

  beforeAll(async () => {
    patientTokenA = generatePatientSessionToken({ id: patientIdA, uhid: patientUhidA });
    patientTokenB = generatePatientSessionToken({ id: patientIdB, uhid: patientUhidB });

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // Create users
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, status) VALUES
         ($1, $2, $3, 'Receptionist', 'Active'),
         ($4, $5, $3, 'Nurse', 'Active'),
         ($6, $7, $3, 'Doctor', 'Active'),
         ($8, $9, $3, 'Billing Officer', 'Active')
         ON CONFLICT DO NOTHING`,
        [
          receptionistId, receptionistEmail, passwordHash,
          nurseId, nurseEmail,
          doctorUserId, doctorEmail,
          billingUserId, billingEmail
        ]
      );

      // Create doctor
      await client.query(
        `INSERT INTO doctors (id, specialty) VALUES ($1, 'Pediatrics') ON CONFLICT DO NOTHING`,
        [doctorUserId]
      );

      // Create patients
      await client.query(
        `INSERT INTO patients (id, uhid, name, dob, gender, address, phone, emergency_contact, emergency_phone) VALUES
         ($1, $2, 'Patient vitals A', '1990-01-01', 'Male', 'Address A', '1111111111', 'Contact A', '1111111111'),
         ($3, $4, 'Patient vitals B', '1995-05-05', 'Female', 'Address B', '2222222222', 'Contact B', '2222222222')
         ON CONFLICT DO NOTHING`,
        [patientIdA, patientUhidA, patientIdB, patientUhidB]
      );

      // Create appointment for today
      const todayStr = new Date().toISOString().split('T')[0];
      const apptResult = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, '11:15:00', 'Booked') RETURNING id`,
        [patientIdA, doctorUserId, todayStr]
      );
      appointmentId = apptResult.rows[0].id;

      // Check in patient A to generate an active queue token
      const tokenResult = await client.query(
        `INSERT INTO queue_tokens (token_number, patient_id, doctor_id, appointment_id, status)
         VALUES ('T-101', $1, $2, $3, 'Waiting') RETURNING id`,
        [patientIdA, doctorUserId, appointmentId]
      );
      queueTokenId = tokenResult.rows[0].id;

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
      await client.query('DELETE FROM vitals WHERE patient_id IN ($1, $2)', [patientIdA, patientIdB]);
      await client.query('DELETE FROM queue_tokens WHERE doctor_id = $1 OR patient_id IN ($2, $3)', [doctorUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM appointments WHERE doctor_id = $1 OR patient_id IN ($2, $3)', [doctorUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM doctors WHERE id = $1', [doctorUserId]);
      await client.query('DELETE FROM patients WHERE id IN ($1, $2)', [patientIdA, patientIdB]);
      await client.query('DELETE FROM audit_logs WHERE user_id IN ($1, $2, $3, $4) OR patient_id IN ($5, $6)', [receptionistId, nurseId, doctorUserId, billingUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [receptionistId, nurseId, doctorUserId, billingUserId]);
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
    sessionStore.createSession('receptionist-vitals-session-123', { id: receptionistId, email: receptionistEmail, role: 'Receptionist', departmentId: null });
    sessionStore.createSession('nurse-vitals-session-123', { id: nurseId, email: nurseEmail, role: 'Nurse', departmentId: null });
    sessionStore.createSession('doctor-vitals-session-123', { id: doctorUserId, email: doctorEmail, role: 'Doctor', departmentId: null });
    sessionStore.createSession('billing-vitals-session-123', { id: billingUserId, email: billingEmail, role: 'Billing Officer', departmentId: null });
  });

  describe('POST /v1/triage/vitals - Save Vitals & Input Validations', () => {
    test('Should reject invalid Blood Pressure format', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120-80', // Invalid separator
          heartRate: 72,
          temperature: 98.6,
          weight: 70.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should reject out-of-bounds Heart Rate', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120/80',
          heartRate: 20, // Too low (limit: 30)
          temperature: 98.6,
          weight: 70.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should reject out-of-bounds Temperature', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 115.0, // Too high (limit: 110.0)
          weight: 70.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should reject out-of-bounds Weight', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          weight: 0.5, // Too low (limit: 1.0)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should block patients or other unauthorized staff roles from saving vitals', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Authorization', `Bearer ${patientTokenA}`)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          weight: 70.5,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');
    });

    let savedVitalsId: string;

    test('Should successfully save patient vitals as Nurse', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          weight: 70.5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vitalsId).toBeDefined();
      savedVitalsId = response.body.data.vitalsId;
    });

    test('Should reject duplicate vitals for the same queue token', async () => {
      const response = await request(app)
        .post('/v1/triage/vitals')
        .set('Cookie', nurseCookie)
        .send({
          patientId: patientIdA,
          queueTokenId,
          bloodPressure: '110/70',
          heartRate: 68,
          temperature: 97.9,
          weight: 70.5,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT');
    });

    test('Verify vitals data is encrypted in the raw database (FLE GCM)', async () => {
      const result = await dbQuery('SELECT * FROM vitals WHERE id = $1', [savedVitalsId]);
      expect(result.rows).toHaveLength(1);
      const row = result.rows[0];

      // Values must be stored as encrypted vault transit strings starting with vault:v1:
      expect(row.blood_pressure).toMatch(/^vault:v1:/);
      expect(row.heart_rate).toMatch(/^vault:v1:/);
      expect(row.temperature).toMatch(/^vault:v1:/);
      expect(row.weight).toMatch(/^vault:v1:/);
    });
  });

  describe('GET /v1/triage/vitals/:id & GET /v1/triage/vitals/queue-token/:queueTokenId - Access Control & Decryption', () => {
    let vitalsId: string;

    beforeAll(async () => {
      // Fetch the vitals row created in the previous tests
      const result = await dbQuery('SELECT id FROM vitals WHERE queue_token_id = $1', [queueTokenId]);
      vitalsId = result.rows[0].id;
    });

    test('Nurse should be allowed to retrieve and decrypt vitals', async () => {
      const response = await request(app)
        .get(`/v1/triage/vitals/${vitalsId}`)
        .set('Cookie', nurseCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bloodPressure).toBe('120/80');
      expect(response.body.data.heartRate).toBe(72);
      expect(response.body.data.temperature).toBe(98.6);
      expect(response.body.data.weight).toBe(70.5);
    });

    test('Doctor should be allowed to retrieve and decrypt vitals by queue token', async () => {
      const response = await request(app)
        .get(`/v1/triage/vitals/queue-token/${queueTokenId}`)
        .set('Cookie', doctorCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vitalsId);
      expect(response.body.data.bloodPressure).toBe('120/80');
    });

    test('Patient A should be allowed to retrieve their own decrypted vitals', async () => {
      const response = await request(app)
        .get(`/v1/triage/vitals/${vitalsId}`)
        .set('Authorization', `Bearer ${patientTokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bloodPressure).toBe('120/80');
    });

    test('Patient B should be BLOCKED from retrieving Patient A vitals', async () => {
      const response = await request(app)
        .get(`/v1/triage/vitals/${vitalsId}`)
        .set('Authorization', `Bearer ${patientTokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');
    });

    test('Billing Officer should be BLOCKED from retrieving patient vitals', async () => {
      const response = await request(app)
        .get(`/v1/triage/vitals/${vitalsId}`)
        .set('Cookie', billingCookie);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCESS_DENIED');
    });
  });
});
