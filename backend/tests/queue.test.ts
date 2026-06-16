import request from 'supertest';
import app from '../src/app';
import { dbPool } from '../src/config/database';
import { sessionStore } from '../src/modules/user/user.service';
import { generatePatientSessionToken } from '../src/modules/user/patient-auth.service';

describe('OPD Appointment and Queue Waitlist Integration Tests', () => {
  const receptionistId = 'ab000000-0000-0000-0000-000000000001';
  const receptionistEmail = 'receptionist.queue@ship.local';
  const receptionistCookie = ['sessionId=receptionist-queue-session-123'];

  const doctorUserId = 'ab000000-0000-0000-0000-000000000002';
  const doctorEmail = 'doctor.queue@ship.local';
  const doctorCookie = ['sessionId=doctor-queue-session-123'];

  const patientIdA = 'ab000000-0000-0000-0000-00000000000a';
  const patientUhidA = 'UHID-2026-00000a';
  let patientTokenA: string;

  const patientIdB = 'ab000000-0000-0000-0000-00000000000b';
  const patientUhidB = 'UHID-2026-00000b';
  let patientTokenB: string;

  const passwordHash = '$2b$10$w/P39oV6y464wvdrxpurnuIsopHywhiu/LYq9mobwIQDLRvzMX5/G'; // 'temporary_pass'

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
         ($4, $5, $3, 'Doctor', 'Active')
         ON CONFLICT DO NOTHING`,
        [receptionistId, receptionistEmail, passwordHash, doctorUserId, doctorEmail]
      );

      // Create doctor
      await client.query(
        `INSERT INTO doctors (id, specialty) VALUES ($1, 'Cardiology') ON CONFLICT DO NOTHING`,
        [doctorUserId]
      );

      // Create patients (demographics are not FLE checked in standard index/constraints)
      await client.query(
        `INSERT INTO patients (id, uhid, name, dob, gender, address, phone, emergency_contact, emergency_phone) VALUES
         ($1, $2, 'Patient queue A', '1990-01-01', 'Male', 'Address A', '1111111111', 'Contact A', '1111111111'),
         ($3, $4, 'Patient queue B', '1995-05-05', 'Female', 'Address B', '2222222222', 'Contact B', '2222222222')
         ON CONFLICT DO NOTHING`,
        [patientIdA, patientUhidA, patientIdB, patientUhidB]
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
      await client.query('DELETE FROM queue_tokens WHERE doctor_id = $1 OR patient_id IN ($2, $3)', [doctorUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM appointments WHERE doctor_id = $1 OR patient_id IN ($2, $3)', [doctorUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM doctors WHERE id = $1', [doctorUserId]);
      await client.query('DELETE FROM patients WHERE id IN ($1, $2)', [patientIdA, patientIdB]);
      await client.query('DELETE FROM audit_logs WHERE user_id IN ($1, $2) OR patient_id IN ($3, $4)', [receptionistId, doctorUserId, patientIdA, patientIdB]);
      await client.query('DELETE FROM users WHERE id IN ($1, $2)', [receptionistId, doctorUserId]);
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
    sessionStore.createSession('receptionist-queue-session-123', {
      id: receptionistId,
      email: receptionistEmail,
      role: 'Receptionist',
      departmentId: null,
    });
    sessionStore.createSession('doctor-queue-session-123', {
      id: doctorUserId,
      email: doctorEmail,
      role: 'Doctor',
      departmentId: null,
    });
  });

  describe('POST /v1/appointments - 15-Minute Grid Booking & Concurrency', () => {
    test('Should reject booking if timeSlot is not matching the 15-minute grid', async () => {
      const response = await request(app)
        .post('/v1/appointments')
        .set('Cookie', receptionistCookie)
        .send({
          patientId: patientIdA,
          doctorId: doctorUserId,
          scheduledDate: '2026-06-25',
          timeSlot: '09:10', // Invalid slot
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_FAILED');
    });

    test('Should accept booking if timeSlot matches the 15-minute grid', async () => {
      const response = await request(app)
        .post('/v1/appointments')
        .set('Cookie', receptionistCookie)
        .send({
          patientId: patientIdA,
          doctorId: doctorUserId,
          scheduledDate: '2026-06-25',
          timeSlot: '09:15', // Valid slot
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.appointmentId).toBeDefined();
      expect(response.body.data.status).toBe('Booked');
    });

    test('Should block double-booking for the same slot', async () => {
      const response = await request(app)
        .post('/v1/appointments')
        .set('Cookie', receptionistCookie)
        .send({
          patientId: patientIdB,
          doctorId: doctorUserId,
          scheduledDate: '2026-06-25',
          timeSlot: '09:15', // Same slot
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT');
    });
  });

  describe('PUT /v1/appointments/:id/cancel - Cancellation Constraints & Re-Booking', () => {
    let apptIdToCancel: string;

    beforeEach(async () => {
      // Create a fresh appointment for tests
      const res = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, $4, 'Booked') RETURNING id`,
        [patientIdA, doctorUserId, '2026-06-26', '10:30:00']
      );
      apptIdToCancel = res.rows[0].id;
    });

    afterEach(async () => {
      await dbPool.query('DELETE FROM appointments WHERE id = $1', [apptIdToCancel]);
    });

    test('Should block patient from cancelling within 2 hours of slot', async () => {
      // Set the scheduled date/time slot to 1 hour from now
      const targetTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour ahead
      const dateStr = targetTime.toISOString().split('T')[0];
      const hours = String(targetTime.getHours()).padStart(2, '0');
      // Round minutes to 15-min interval
      const rawMin = targetTime.getMinutes();
      const roundedMin = rawMin < 15 ? '00' : rawMin < 30 ? '15' : rawMin < 45 ? '30' : '45';
      const timeStr = `${hours}:${roundedMin}`;

      const apptResult = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, $4, 'Booked') RETURNING id`,
        [patientIdA, doctorUserId, dateStr, timeStr]
      );
      const closeApptId = apptResult.rows[0].id;

      const response = await request(app)
        .put(`/v1/appointments/${closeApptId}/cancel`)
        .set('Authorization', `Bearer ${patientTokenA}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CANCELLATION_WINDOW_EXPIRED');

      // Clean up
      await dbPool.query('DELETE FROM appointments WHERE id = $1', [closeApptId]);
    });

    test('Should allow patient to cancel if more than 2 hours before slot', async () => {
      const response = await request(app)
        .put(`/v1/appointments/${apptIdToCancel}/cancel`)
        .set('Authorization', `Bearer ${patientTokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Cancelled');
    });

    test('Should allow receptionist to cancel within 2 hours', async () => {
      const targetTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour ahead
      const dateStr = targetTime.toISOString().split('T')[0];
      const hours = String(targetTime.getHours()).padStart(2, '0');
      const timeStr = `${hours}:00`;

      const apptResult = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, $4, 'Booked') RETURNING id`,
        [patientIdA, doctorUserId, dateStr, timeStr]
      );
      const closeApptId = apptResult.rows[0].id;

      const response = await request(app)
        .put(`/v1/appointments/${closeApptId}/cancel`)
        .set('Cookie', receptionistCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Cancelled');

      // Clean up
      await dbPool.query('DELETE FROM appointments WHERE id = $1', [closeApptId]);
    });

    test('Should immediately release slot and allow re-booking after cancellation', async () => {
      // 1. Create a slot
      const apptResult = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, '2026-06-27', '11:00:00', 'Booked') RETURNING id`
      , [patientIdA, doctorUserId]);
      const apptId = apptResult.rows[0].id;

      // 2. Cancel it
      await request(app)
        .put(`/v1/appointments/${apptId}/cancel`)
        .set('Cookie', receptionistCookie);

      // 3. Book the same slot for Patient B
      const response = await request(app)
        .post('/v1/appointments')
        .set('Cookie', receptionistCookie)
        .send({
          patientId: patientIdB,
          doctorId: doctorUserId,
          scheduledDate: '2026-06-27',
          timeSlot: '11:00',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Booked');

      // Clean up
      await dbPool.query('DELETE FROM appointments WHERE id IN ($1, $2)', [apptId, response.body.data.appointmentId]);
    });
  });

  describe('POST /v1/queues/tokens & GET /v1/queues/tokens/active - Queue Operations', () => {
    let apptIdA: string;
    let apptIdB: string;
    let tokenIdA: string;
    let tokenIdB: string;

    beforeAll(async () => {
      // Create appointments for today
      const todayStr = new Date().toISOString().split('T')[0];
      const resA = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, '14:00:00', 'Booked') RETURNING id`,
        [patientIdA, doctorUserId, todayStr]
      );
      apptIdA = resA.rows[0].id;

      const resB = await dbPool.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, '14:15:00', 'Booked') RETURNING id`,
        [patientIdB, doctorUserId, todayStr]
      );
      apptIdB = resB.rows[0].id;
    });

    test('Should check in Patient A and generate token T-101', async () => {
      const response = await request(app)
        .post('/v1/queues/tokens')
        .set('Cookie', receptionistCookie)
        .send({ appointmentId: apptIdA });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokenNumber).toBe('T-101');
      expect(response.body.data.status).toBe('Waiting');
      tokenIdA = response.body.data.tokenId;
    });

    test('Should check in Patient B and generate token T-102 (sequential)', async () => {
      const response = await request(app)
        .post('/v1/queues/tokens')
        .set('Cookie', receptionistCookie)
        .send({ appointmentId: apptIdB });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokenNumber).toBe('T-102');
      expect(response.body.data.status).toBe('Waiting');
      tokenIdB = response.body.data.tokenId;
      expect(tokenIdB).toBeDefined();
    });

    test('Should calculate wait time and active waitlist correctly for Patient A (Patients ahead: 0)', async () => {
      const response = await request(app)
        .get('/v1/queues/tokens/active')
        .set('Authorization', `Bearer ${patientTokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tokenNumber).toBe('T-101');
      expect(response.body.data[0].patientsAhead).toBe(0);
      expect(response.body.data[0].estimatedWaitTimeMinutes).toBe(0);
    });

    test('Should calculate wait time and active waitlist correctly for Patient B (Patients ahead: 1)', async () => {
      const response = await request(app)
        .get('/v1/queues/tokens/active')
        .set('Authorization', `Bearer ${patientTokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tokenNumber).toBe('T-102');
      expect(response.body.data[0].patientsAhead).toBe(1);
      expect(response.body.data[0].estimatedWaitTimeMinutes).toBe(15);
    });

    test('Should allow doctor to query all active tokens for their clinic', async () => {
      const response = await request(app)
        .get(`/v1/queues/tokens/active?doctorId=${doctorUserId}`)
        .set('Cookie', doctorCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].tokenNumber).toBe('T-101');
      expect(response.body.data[1].tokenNumber).toBe('T-102');
    });

    test('Should update token status and adjust patient wait time accordingly', async () => {
      // Doctor calls Patient A into consultation
      const callResponse = await request(app)
        .put(`/v1/queues/tokens/${tokenIdA}/status`)
        .set('Cookie', doctorCookie)
        .send({ status: 'In-Consultation' });

      expect(callResponse.status).toBe(200);
      expect(callResponse.body.success).toBe(true);
      expect(callResponse.body.data.status).toBe('In-Consultation');

      // Now query Patient B's wait time (Patient A is no longer in "Waiting" status)
      const response = await request(app)
        .get('/v1/queues/tokens/active')
        .set('Authorization', `Bearer ${patientTokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].patientsAhead).toBe(0);
      expect(response.body.data[0].estimatedWaitTimeMinutes).toBe(0);
    });
  });
});
