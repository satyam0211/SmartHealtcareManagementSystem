import { dbPool, dbQuery } from '../../config/database';

/**
 * Validates the time slot grid (15-minute intervals).
 */
function isValidTimeSlot(timeSlot: string): boolean {
  return /^(0[0-9]|1[0-9]|2[0-3]):(00|15|30|45)(:00)?$/.test(timeSlot);
}

/**
 * Normalizes date to YYYY-MM-DD string.
 */
function normalizeDate(scheduledDate: any): string {
  if (scheduledDate instanceof Date) {
    return scheduledDate.toISOString().split('T')[0];
  }
  return String(scheduledDate);
}

/**
 * Creates a new appointment with concurrency control via doctor row locking.
 */
export async function createAppointment(
  patientId: string,
  doctorId: string,
  scheduledDate: any,
  timeSlot: string,
  operatorUserId: string | null,
  ipAddress: string
): Promise<{ appointmentId: string; status: string }> {
  if (!isValidTimeSlot(timeSlot)) {
    throw new Error('VALIDATION_FAILED');
  }

  const dateStr = normalizeDate(scheduledDate);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error('VALIDATION_FAILED');
  }

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    // Concurrency Lock: lock the target doctor to serialize appointment allocations
    const docCheck = await client.query('SELECT id FROM doctors WHERE id = $1 FOR UPDATE', [doctorId]);
    if (docCheck.rows.length === 0) {
      throw new Error('DOCTOR_NOT_FOUND');
    }

    // Check if slot is occupied
    const slotCheck = await client.query(
      `SELECT id, status FROM appointments 
       WHERE doctor_id = $1 AND scheduled_date = $2 AND time_slot = $3`,
      [doctorId, dateStr, timeSlot]
    );

    let appointmentId: string;

    if (slotCheck.rows.length > 0) {
      const existing = slotCheck.rows[0];
      if (existing.status === 'Booked' || existing.status === 'Checked-In') {
        throw new Error('SLOT_OCCUPIED');
      } else if (existing.status === 'Cancelled') {
        // Reuse the cancelled slot: update to Booked
        const updateResult = await client.query(
          `UPDATE appointments 
           SET patient_id = $1, status = 'Booked', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 
           RETURNING id`,
          [patientId, existing.id]
        );
        appointmentId = updateResult.rows[0].id;
      } else {
        throw new Error('SLOT_OCCUPIED');
      }
    } else {
      // Create new appointment slot
      const insertResult = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_date, time_slot, status)
         VALUES ($1, $2, $3, $4, 'Booked')
         RETURNING id`,
        [patientId, doctorId, dateStr, timeSlot]
      );
      appointmentId = insertResult.rows[0].id;
    }

    // Write to audit trail
    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['REGISTER_APPOINTMENT', operatorUserId, patientId, 'Appointments', ipAddress]
    );

    await client.query('COMMIT');
    return { appointmentId, status: 'Booked' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Returns a paginated list of appointments with filters.
 */
export async function listAppointments(
  filters: {
    patientId?: string;
    doctorId?: string;
    date?: string;
    page?: number;
    limit?: number;
  },
  reqUser: any
): Promise<any> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, filters.limit || 20);
  const offset = (page - 1) * limit;

  // RBAC Filter own appointments for Patients
  if (reqUser.role === 'Patient') {
    if (filters.patientId && filters.patientId !== reqUser.id) {
      throw new Error('ACCESS_DENIED');
    }
    filters.patientId = reqUser.id;
  }

  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (filters.patientId) {
    queryParams.push(filters.patientId);
    whereClauses.push(`patient_id = $${queryParams.length}`);
  }
  if (filters.doctorId) {
    queryParams.push(filters.doctorId);
    whereClauses.push(`doctor_id = $${queryParams.length}`);
  }
  if (filters.date) {
    queryParams.push(normalizeDate(filters.date));
    whereClauses.push(`scheduled_date = $${queryParams.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total records count
  const countResult = await dbQuery(`SELECT COUNT(*) FROM appointments ${whereSql}`, queryParams);
  const totalRecords = parseInt(countResult.rows[0].count, 10);

  // Retrieve paginated records
  const queryParamsWithPagination = [...queryParams];
  queryParamsWithPagination.push(limit);
  const limitParam = `$${queryParamsWithPagination.length}`;
  queryParamsWithPagination.push(offset);
  const offsetParam = `$${queryParamsWithPagination.length}`;

  const selectQuery = `
    SELECT id, patient_id AS "patientId", doctor_id AS "doctorId", 
           scheduled_date AS "scheduledDate", time_slot AS "timeSlot", status
    FROM appointments
    ${whereSql}
    ORDER BY scheduled_date DESC, time_slot ASC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const rowsResult = await dbQuery(selectQuery, queryParamsWithPagination);

  const data = rowsResult.rows.map((row: any) => {
    return {
      id: row.id,
      patientId: row.patientId,
      doctorId: row.doctorId,
      scheduledDate: normalizeDate(row.scheduledDate),
      timeSlot: row.timeSlot,
      status: row.status,
    };
  });

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total_records: totalRecords,
      total_pages: totalPages,
    },
  };
}

/**
 * Cancels a booked appointment.
 */
export async function cancelAppointment(
  appointmentId: string,
  reqUser: any,
  operatorUserId: string | null,
  ipAddress: string
): Promise<{ id: string; status: string }> {
  const result = await dbQuery('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
  if (result.rows.length === 0) {
    throw new Error('APPOINTMENT_NOT_FOUND');
  }

  const appointment = result.rows[0];

  // Role validation
  if (reqUser.role === 'Patient') {
    if (appointment.patient_id !== reqUser.id) {
      throw new Error('ACCESS_DENIED');
    }

    // Verify 2-hour cancellation buffer
    const dateStr = normalizeDate(appointment.scheduled_date);
    const apptDateTime = new Date(`${dateStr}T${appointment.time_slot}`);
    const now = new Date();
    const diffMs = apptDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      throw new Error('CANCELLATION_WINDOW_EXPIRED');
    }
  } else if (reqUser.role !== 'Receptionist' && reqUser.role !== 'Administrator') {
    throw new Error('ACCESS_DENIED');
  }

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    // Set appointment status to Cancelled
    await client.query(
      `UPDATE appointments SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appointmentId]
    );

    // Cancel matching queue tokens if they are waiting
    await client.query(
      `UPDATE queue_tokens SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $1 AND status = 'Waiting'`,
      [appointmentId]
    );

    // Log cancellation in audit trail
    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['CANCEL_APPOINTMENT', operatorUserId, appointment.patient_id, 'Appointments', ipAddress]
    );

    await client.query('COMMIT');
    return { id: appointmentId, status: 'Cancelled' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Checks in a patient and generates a sequential token.
 */
export async function checkInPatientAndGenerateToken(
  appointmentId: string,
  operatorUserId: string,
  ipAddress: string
): Promise<{ tokenId: string; tokenNumber: string; status: string }> {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    const apptResult = await client.query(
      'SELECT * FROM appointments WHERE id = $1 FOR UPDATE',
      [appointmentId]
    );

    if (apptResult.rows.length === 0) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }

    const appointment = apptResult.rows[0];

    if (appointment.status !== 'Booked') {
      throw new Error('INVALID_APPOINTMENT_STATUS');
    }

    // Check if a token already exists
    const tokenCheck = await client.query(
      'SELECT id, token_number, status FROM queue_tokens WHERE appointment_id = $1',
      [appointmentId]
    );
    if (tokenCheck.rows.length > 0) {
      await client.query('COMMIT');
      return {
        tokenId: tokenCheck.rows[0].id,
        tokenNumber: tokenCheck.rows[0].token_number,
        status: tokenCheck.rows[0].status
      };
    }

    // Generate T-100 series sequential token number for this doctor TODAY
    const lastTokenResult = await client.query(
      `SELECT token_number FROM queue_tokens 
       WHERE doctor_id = $1 AND created_at::date = CURRENT_DATE 
       ORDER BY token_number DESC LIMIT 1 FOR UPDATE`,
      [appointment.doctor_id]
    );

    let nextSeq = 101;
    if (lastTokenResult.rows.length > 0) {
      const lastTokenNum = lastTokenResult.rows[0].token_number;
      const matches = lastTokenNum.match(/^T-(\d+)$/);
      if (matches) {
        const lastSeq = parseInt(matches[1], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    const tokenNumber = `T-${nextSeq}`;

    // Insert token record
    const insertResult = await client.query(
      `INSERT INTO queue_tokens (token_number, patient_id, doctor_id, appointment_id, status)
       VALUES ($1, $2, $3, $4, 'Waiting')
       RETURNING id, token_number, status`,
      [tokenNumber, appointment.patient_id, appointment.doctor_id, appointment.id]
    );

    const newToken = insertResult.rows[0];

    // Mark appointment as Checked-In
    await client.query(
      `UPDATE appointments SET status = 'Checked-In', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [appointment.id]
    );

    // Write to audit trail
    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['CHECK_IN_PATIENT', operatorUserId, appointment.patient_id, 'QueueTokens', ipAddress]
    );

    await client.query('COMMIT');
    return {
      tokenId: newToken.id,
      tokenNumber: newToken.token_number,
      status: newToken.status
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Queries active waitlist queue and estimates waiting times.
 */
export async function getActiveWaitlist(
  doctorId?: string,
  reqUser?: any
): Promise<any[]> {
  // Enforce Patient ownership constraints
  if (reqUser && reqUser.role === 'Patient') {
    const patientResult = await dbQuery(
      `SELECT id, token_number, patient_id, doctor_id, status, created_at 
       FROM queue_tokens 
       WHERE patient_id = $1 AND status IN ('Waiting', 'In-Consultation')
       ORDER BY created_at ASC`,
      [reqUser.id]
    );

    const list: any[] = [];
    for (const token of patientResult.rows) {
      let patientsAhead = 0;
      if (token.status === 'Waiting') {
        const aheadResult = await dbQuery(
          `SELECT COUNT(*) FROM queue_tokens 
           WHERE doctor_id = $1 AND status = 'Waiting' AND created_at < $2`,
          [token.doctor_id, token.created_at]
        );
        patientsAhead = parseInt(aheadResult.rows[0].count, 10);
      }

      list.push({
        tokenId: token.id,
        tokenNumber: token.token_number,
        patientsAhead,
        estimatedWaitTimeMinutes: patientsAhead * 15,
        status: token.status
      });
    }

    return list;
  }

  // Staff querying waitlist
  const queryParams: any[] = [];
  let querySql = `
    SELECT id, token_number, patient_id, doctor_id, status, created_at 
    FROM queue_tokens 
    WHERE status IN ('Waiting', 'In-Consultation')
  `;

  if (doctorId) {
    queryParams.push(doctorId);
    querySql += ` AND doctor_id = $${queryParams.length}`;
  }

  querySql += ` ORDER BY doctor_id ASC, created_at ASC`;

  const queueResult = await dbQuery(querySql, queryParams);

  const list: any[] = [];
  for (const token of queueResult.rows) {
    let patientsAhead = 0;
    if (token.status === 'Waiting') {
      const aheadResult = await dbQuery(
        `SELECT COUNT(*) FROM queue_tokens 
         WHERE doctor_id = $1 AND status = 'Waiting' AND created_at < $2`,
        [token.doctor_id, token.created_at]
      );
      patientsAhead = parseInt(aheadResult.rows[0].count, 10);
    }

    list.push({
      tokenId: token.id,
      tokenNumber: token.token_number,
      patientsAhead,
      estimatedWaitTimeMinutes: patientsAhead * 15,
      status: token.status
    });
  }

  return list;
}

/**
 * Changes queue token status (e.g. Call Patient).
 */
export async function updateTokenStatus(
  tokenId: string,
  status: 'Waiting' | 'In-Consultation' | 'Completed' | 'Cancelled',
  operatorUserId: string,
  ipAddress: string
): Promise<{ tokenId: string; status: string }> {
  const result = await dbQuery('SELECT * FROM queue_tokens WHERE id = $1', [tokenId]);
  if (result.rows.length === 0) {
    throw new Error('TOKEN_NOT_FOUND');
  }

  const token = result.rows[0];

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE queue_tokens SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, tokenId]
    );

    // Audit logs entry
    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['UPDATE_QUEUE_TOKEN_STATUS', operatorUserId, token.patient_id, 'QueueTokens', ipAddress]
    );

    await client.query('COMMIT');
    return { tokenId, status };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
