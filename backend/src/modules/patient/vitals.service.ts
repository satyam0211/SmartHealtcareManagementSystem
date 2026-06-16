import { dbPool, dbQuery } from '../../config/database';
import { encryptField, decryptField } from '../../config/vault';

/**
 * Validates range and format constraints for vital signs.
 */
function validateVitalsRanges(
  bloodPressure: string,
  heartRate: number,
  temperature: number,
  weight: number
): void {
  // Blood Pressure format check: e.g. "120/80"
  if (!/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
    throw new Error('VALIDATION_FAILED');
  }

  // Heart Rate range: 30 to 250 bpm (integer check)
  if (!Number.isInteger(heartRate) || heartRate < 30 || heartRate > 250) {
    throw new Error('VALIDATION_FAILED');
  }

  // Temperature range: 90.0 to 110.0°F
  if (typeof temperature !== 'number' || isNaN(temperature) || temperature < 90.0 || temperature > 110.0) {
    throw new Error('VALIDATION_FAILED');
  }

  // Weight range: 1.0 to 500.0 kg
  if (typeof weight !== 'number' || isNaN(weight) || weight < 1.0 || weight > 500.0) {
    throw new Error('VALIDATION_FAILED');
  }
}

/**
 * Saves triage patient vital signs with Vault FLE.
 */
export async function saveVitals(
  patientId: string,
  queueTokenId: string,
  bloodPressure: string,
  heartRate: number,
  temperature: number,
  weight: number,
  operatorUserId: string,
  ipAddress: string
): Promise<{ vitalsId: string }> {
  // 1. Perform range and format validations
  validateVitalsRanges(bloodPressure, heartRate, temperature, weight);

  // 2. Verify queue token exists and belongs to the patient
  const tokenResult = await dbQuery(
    'SELECT id, patient_id FROM queue_tokens WHERE id = $1 AND deleted_at IS NULL',
    [queueTokenId]
  );
  if (tokenResult.rows.length === 0) {
    throw new Error('QUEUE_TOKEN_NOT_FOUND');
  }

  const token = tokenResult.rows[0];
  if (token.patient_id !== patientId) {
    throw new Error('PATIENT_MISMATCH');
  }

  // 3. Check if vitals already recorded for this queue token
  const existingResult = await dbQuery(
    'SELECT id FROM vitals WHERE queue_token_id = $1 AND deleted_at IS NULL',
    [queueTokenId]
  );
  if (existingResult.rows.length > 0) {
    throw new Error('VITALS_ALREADY_RECORDED');
  }

  // 4. Encrypt PHI fields at application-layer using Vault Transit FLE
  const encBp = await encryptField(bloodPressure);
  const encHr = await encryptField(String(heartRate));
  const encTemp = await encryptField(String(temperature));
  const encWt = await encryptField(String(weight));

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    // Save vitals
    const insertResult = await client.query(
      `INSERT INTO vitals (patient_id, queue_token_id, blood_pressure, heart_rate, temperature, weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [patientId, queueTokenId, encBp, encHr, encTemp, encWt]
    );

    const vitalsId = insertResult.rows[0].id;

    // Log record action to audit trail
    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['RECORD_VITALS', operatorUserId, patientId, 'Vitals', ipAddress]
    );

    await client.query('COMMIT');
    return { vitalsId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validates if the requesting user has permission to read vitals of a patient.
 */
function checkReadPermission(patientId: string, reqUser: any): void {
  if (!reqUser) {
    throw new Error('UNAUTHORIZED');
  }

  // Allow: Patient (own only), Doctor, Nurse, Administrator
  const allowedRoles = ['Patient', 'Doctor', 'Nurse', 'Administrator'];
  if (!allowedRoles.includes(reqUser.role)) {
    throw new Error('ACCESS_DENIED');
  }

  if (reqUser.role === 'Patient' && reqUser.id !== patientId) {
    throw new Error('ACCESS_DENIED');
  }
}

/**
 * Normalizes vitals record by decrypting FLE fields.
 */
async function decryptVitalsRow(row: any): Promise<any> {
  const bloodPressure = await decryptField(row.blood_pressure);
  const heartRate = parseInt(await decryptField(row.heart_rate), 10);
  const temperature = parseFloat(await decryptField(row.temperature));
  const weight = parseFloat(await decryptField(row.weight));

  return {
    id: row.id,
    patientId: row.patient_id,
    queueTokenId: row.queue_token_id,
    bloodPressure,
    heartRate,
    temperature,
    weight,
    createdAt: row.created_at,
  };
}

/**
 * Fetches decrypted vitals by record ID.
 */
export async function getVitalsById(
  vitalsId: string,
  reqUser: any,
  ipAddress: string
): Promise<any> {
  const result = await dbQuery(
    'SELECT * FROM vitals WHERE id = $1 AND deleted_at IS NULL',
    [vitalsId]
  );
  if (result.rows.length === 0) {
    throw new Error('VITALS_NOT_FOUND');
  }

  const row = result.rows[0];

  // RBAC Permission Check
  checkReadPermission(row.patient_id, reqUser);

  const decrypted = await decryptVitalsRow(row);

  // Log read event in audit trail
  const operatorUserId = reqUser.role === 'Patient' ? null : reqUser.id;
  await dbQuery(
    `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    ['READ_VITALS', operatorUserId, row.patient_id, 'Vitals', ipAddress]
  );

  return decrypted;
}

/**
 * Fetches decrypted vitals by queue token ID.
 */
export async function getVitalsByQueueToken(
  queueTokenId: string,
  reqUser: any,
  ipAddress: string
): Promise<any> {
  const result = await dbQuery(
    'SELECT * FROM vitals WHERE queue_token_id = $1 AND deleted_at IS NULL',
    [queueTokenId]
  );
  if (result.rows.length === 0) {
    throw new Error('VITALS_NOT_FOUND');
  }

  const row = result.rows[0];

  // RBAC Permission Check
  checkReadPermission(row.patient_id, reqUser);

  const decrypted = await decryptVitalsRow(row);

  // Log read event in audit trail
  const operatorUserId = reqUser.role === 'Patient' ? null : reqUser.id;
  await dbQuery(
    `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    ['READ_VITALS', operatorUserId, row.patient_id, 'Vitals', ipAddress]
  );

  return decrypted;
}
