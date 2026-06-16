import { dbPool, dbQuery } from '../../config/database';
import { encryptField, decryptField } from '../../config/vault';

/**
 * Validates and registers a new patient, generating a sequential locked UHID
 */
export async function createPatient(
  patientData: {
    name: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    address: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    emergencyNotes?: string | null;
    bloodGroup?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    consentFlag?: boolean;
  },
  operatorUserId: string | null,
  ipAddress: string
): Promise<{ id: string; uhid: string }> {
  // Input validations
  if (!patientData.name || !patientData.dob || !patientData.gender || !patientData.address || !patientData.phone || !patientData.emergencyContact || !patientData.emergencyPhone) {
    throw new Error('VALIDATION_FAILED');
  }

  if (!['Male', 'Female', 'Other'].includes(patientData.gender)) {
    throw new Error('VALIDATION_FAILED');
  }

  if (!/^\d{10}$/.test(patientData.emergencyPhone)) {
    throw new Error('VALIDATION_FAILED');
  }

  if (!/^\+?[1-9]\d{1,14}$/.test(patientData.phone)) {
    throw new Error('VALIDATION_FAILED');
  }

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    // Concurrency lock: Acquire share row exclusive lock to prevent duplicate UHIDs
    await client.query('LOCK TABLE patients IN SHARE ROW EXCLUSIVE MODE');

    const currentYear = new Date().getFullYear();
    const prefix = `UHID-${currentYear}-`;

    const lastPatientResult = await client.query(
      'SELECT uhid FROM patients WHERE uhid LIKE $1 ORDER BY uhid DESC LIMIT 1',
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (lastPatientResult.rows.length > 0) {
      const lastUhid = lastPatientResult.rows[0].uhid;
      const lastSeqStr = lastUhid.substring(prefix.length);
      const lastSeqVal = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeqVal)) {
        nextSeq = lastSeqVal + 1;
      }
    }

    const padSeq = String(nextSeq).padStart(6, '0');
    const newUhid = `${prefix}${padSeq}`;

    // Encrypt demographic and contact information
    const encName = await encryptField(patientData.name);
    const encDob = await encryptField(patientData.dob);
    const encAddress = await encryptField(patientData.address);
    const encPhone = await encryptField(patientData.phone);
    const encEmergContact = await encryptField(patientData.emergencyContact);
    const encEmergPhone = await encryptField(patientData.emergencyPhone);

    const encEmergNotes = patientData.emergencyNotes ? await encryptField(patientData.emergencyNotes) : null;
    const encBloodGroup = patientData.bloodGroup ? await encryptField(patientData.bloodGroup) : null;
    const encAllergies = patientData.allergies ? await encryptField(patientData.allergies) : null;
    const encChronicConditions = patientData.chronicConditions ? await encryptField(patientData.chronicConditions) : null;

    const insertResult = await client.query(
      `INSERT INTO patients (
        uhid, name, dob, gender, address, phone,
        emergency_contact, emergency_phone, emergency_notes,
        blood_group, allergies, chronic_conditions, consent_flag
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, uhid`,
      [
        newUhid,
        encName,
        encDob,
        patientData.gender,
        encAddress,
        encPhone,
        encEmergContact,
        encEmergPhone,
        encEmergNotes,
        encBloodGroup,
        encAllergies,
        encChronicConditions,
        patientData.consentFlag || false,
      ]
    );

    const newPatient = insertResult.rows[0];

    // Log registration in audit_logs inside transaction
    await client.query(
      'INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['REGISTER_PATIENT', operatorUserId, newPatient.id, 'Patients', ipAddress]
    );

    await client.query('COMMIT');
    return newPatient;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Retrieves a decrypted patient profile by ID
 */
export async function getPatientById(
  patientId: string,
  operatorUserId: string | null,
  ipAddress: string
): Promise<any> {
  const result = await dbQuery(
    'SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL',
    [patientId]
  );

  if (result.rows.length === 0) {
    throw new Error('PATIENT_NOT_FOUND');
  }

  const row = result.rows[0];

  // Decrypt FLE fields
  const name = await decryptField(row.name);
  const dob = await decryptField(row.dob);
  const address = await decryptField(row.address);
  const phone = await decryptField(row.phone);
  const emergencyContact = await decryptField(row.emergency_contact);
  const emergencyPhone = await decryptField(row.emergency_phone);

  const emergencyNotes = row.emergency_notes ? await decryptField(row.emergency_notes) : null;
  const bloodGroup = row.blood_group ? await decryptField(row.blood_group) : null;
  const allergies = row.allergies ? await decryptField(row.allergies) : null;
  const chronicConditions = row.chronic_conditions ? await decryptField(row.chronic_conditions) : null;

  // Log profile read in audit trail
  await dbQuery(
    'INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address) VALUES ($1, $2, $3, $4, $5)',
    ['READ_PATIENT_PROFILE', operatorUserId, patientId, 'Patients', ipAddress]
  );

  return {
    id: row.id,
    uhid: row.uhid,
    name,
    dob,
    gender: row.gender,
    address,
    phone,
    bloodGroup,
    allergies,
    chronicConditions,
    emergencyContact,
    emergencyPhone,
    emergencyNotes,
    consentFlag: row.consent_flag,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Modifies an existing patient profile details and records pre/post audit trail
 */
export async function updatePatient(
  patientId: string,
  updates: {
    name?: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    address?: string;
    phone?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    emergencyNotes?: string | null;
    bloodGroup?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
  },
  operatorUserId: string | null,
  ipAddress: string
): Promise<any> {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    const existingResult = await client.query(
      'SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [patientId]
    );

    if (existingResult.rows.length === 0) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    const oldRow = existingResult.rows[0];

    // Build pre-state decrypted view
    const oldDecrypted = {
      id: oldRow.id,
      uhid: oldRow.uhid,
      name: await decryptField(oldRow.name),
      dob: await decryptField(oldRow.dob),
      gender: oldRow.gender,
      address: await decryptField(oldRow.address),
      phone: await decryptField(oldRow.phone),
      bloodGroup: oldRow.blood_group ? await decryptField(oldRow.blood_group) : null,
      allergies: oldRow.allergies ? await decryptField(oldRow.allergies) : null,
      chronicConditions: oldRow.chronic_conditions ? await decryptField(oldRow.chronic_conditions) : null,
      emergencyContact: await decryptField(oldRow.emergency_contact),
      emergencyPhone: await decryptField(oldRow.emergency_phone),
      emergencyNotes: oldRow.emergency_notes ? await decryptField(oldRow.emergency_notes) : null,
      consentFlag: oldRow.consent_flag,
    };

    // Validation
    if (updates.name !== undefined && !updates.name) throw new Error('VALIDATION_FAILED');
    if (updates.dob !== undefined && !updates.dob) throw new Error('VALIDATION_FAILED');
    if (updates.address !== undefined && !updates.address) throw new Error('VALIDATION_FAILED');
    if (updates.gender !== undefined && !['Male', 'Female', 'Other'].includes(updates.gender)) {
      throw new Error('VALIDATION_FAILED');
    }
    if (updates.emergencyPhone !== undefined && !/^\d{10}$/.test(updates.emergencyPhone)) {
      throw new Error('VALIDATION_FAILED');
    }
    if (updates.phone !== undefined && !/^\+?[1-9]\d{1,14}$/.test(updates.phone)) {
      throw new Error('VALIDATION_FAILED');
    }

    // Encrypt fields
    const encName = updates.name !== undefined ? await encryptField(updates.name) : oldRow.name;
    const encDob = updates.dob !== undefined ? await encryptField(updates.dob) : oldRow.dob;
    const gender = updates.gender !== undefined ? updates.gender : oldRow.gender;
    const encAddress = updates.address !== undefined ? await encryptField(updates.address) : oldRow.address;
    const encPhone = updates.phone !== undefined ? await encryptField(updates.phone) : oldRow.phone;
    const encEmergContact = updates.emergencyContact !== undefined ? await encryptField(updates.emergencyContact) : oldRow.emergency_contact;
    const encEmergPhone = updates.emergencyPhone !== undefined ? await encryptField(updates.emergencyPhone) : oldRow.emergency_phone;

    const encEmergNotes = updates.emergencyNotes !== undefined
      ? (updates.emergencyNotes ? await encryptField(updates.emergencyNotes) : null)
      : oldRow.emergency_notes;

    const encBloodGroup = updates.bloodGroup !== undefined
      ? (updates.bloodGroup ? await encryptField(updates.bloodGroup) : null)
      : oldRow.blood_group;

    const encAllergies = updates.allergies !== undefined
      ? (updates.allergies ? await encryptField(updates.allergies) : null)
      : oldRow.allergies;

    const encChronicConditions = updates.chronicConditions !== undefined
      ? (updates.chronicConditions ? await encryptField(updates.chronicConditions) : null)
      : oldRow.chronic_conditions;

    const updateResult = await client.query(
      `UPDATE patients
       SET name = $1, dob = $2, gender = $3, address = $4, phone = $5,
           emergency_contact = $6, emergency_phone = $7, emergency_notes = $8,
           blood_group = $9, allergies = $10, chronic_conditions = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        encName,
        encDob,
        gender,
        encAddress,
        encPhone,
        encEmergContact,
        encEmergPhone,
        encEmergNotes,
        encBloodGroup,
        encAllergies,
        encChronicConditions,
        patientId,
      ]
    );

    const newRow = updateResult.rows[0];

    const newDecrypted = {
      id: newRow.id,
      uhid: newRow.uhid,
      name: await decryptField(newRow.name),
      dob: await decryptField(newRow.dob),
      gender: newRow.gender,
      address: await decryptField(newRow.address),
      phone: await decryptField(newRow.phone),
      bloodGroup: newRow.blood_group ? await decryptField(newRow.blood_group) : null,
      allergies: newRow.allergies ? await decryptField(newRow.allergies) : null,
      chronicConditions: newRow.chronic_conditions ? await decryptField(newRow.chronic_conditions) : null,
      emergencyContact: await decryptField(newRow.emergency_contact),
      emergencyPhone: await decryptField(newRow.emergency_phone),
      emergencyNotes: newRow.emergency_notes ? await decryptField(newRow.emergency_notes) : null,
      consentFlag: newRow.consent_flag,
    };

    // Encrypt states in audit logs
    const encPre = await encryptField(JSON.stringify(oldDecrypted));
    const encPost = await encryptField(JSON.stringify(newDecrypted));

    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, pre_state, post_state, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['UPDATE_PATIENT_PROFILE', operatorUserId, patientId, 'Patients', encPre, encPost, ipAddress]
    );

    await client.query('COMMIT');
    return newDecrypted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Updates a patient's opt-in/opt-out consent flag
 */
export async function updatePatientConsent(
  patientId: string,
  consentFlag: boolean,
  operatorUserId: string | null,
  ipAddress: string
): Promise<any> {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    const actualResult = await client.query(
      'SELECT id, consent_flag FROM patients WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [patientId]
    );

    if (actualResult.rows.length === 0) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    const oldRow = actualResult.rows[0];
    const oldState = { consentFlag: oldRow.consent_flag };
    const newState = { consentFlag };

    await client.query(
      'UPDATE patients SET consent_flag = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [consentFlag, patientId]
    );

    const encPre = await encryptField(JSON.stringify(oldState));
    const encPost = await encryptField(JSON.stringify(newState));

    await client.query(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, pre_state, post_state, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['UPDATE_PATIENT_CONSENT', operatorUserId, patientId, 'Patients', encPre, encPost, ipAddress]
    );

    await client.query('COMMIT');
    return { id: patientId, consentFlag };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
