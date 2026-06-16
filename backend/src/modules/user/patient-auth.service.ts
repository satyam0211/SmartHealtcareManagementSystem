import { firebaseAdmin } from '../../config/firebase.config';
import { dbQuery } from '../../config/database';
import { encryptField, decryptField } from '../../config/vault';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ship_default_patient_jwt_secret_key_12345';

/**
 * Verifies Firebase ID Token cryptographically using Firebase Admin SDK
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; phoneNumber?: string }> {
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
    };
  } catch (error) {
    console.error('Firebase ID Token verification failed:', error);
    throw new Error('INVALID_CREDENTIALS');
  }
}

/**
 * Searches the database for a patient by decrypting phone numbers.
 * Creates a new sequential UHID and patient profile if not found.
 */
export async function findOrCreatePatientByPhone(phoneNumber: string): Promise<{ id: string; uhid: string }> {
  // 1. Fetch active patients
  const result = await dbQuery('SELECT id, uhid, phone FROM patients WHERE deleted_at IS NULL');
  
  for (const row of result.rows) {
    try {
      const decryptedPhone = await decryptField(row.phone);
      if (decryptedPhone === phoneNumber) {
        return { id: row.id, uhid: row.uhid };
      }
    } catch (decryptError) {
      console.warn(`Failed to decrypt phone for patient ${row.id}:`, decryptError);
    }
  }

  // 2. Patient not found, perform self-registration
  const currentYear = new Date().getFullYear();
  const prefix = `UHID-${currentYear}-`;

  const lastPatientResult = await dbQuery(
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
  const encName = await encryptField('Self-Registered Patient');
  const encDob = await encryptField('2000-01-01');
  const encAddress = await encryptField('Placeholder');
  const encPhone = await encryptField(phoneNumber);
  const encEmergContact = await encryptField('Self');
  const encEmergPhone = await encryptField(phoneNumber);

  const insertResult = await dbQuery(
    `INSERT INTO patients (
      uhid, name, dob, gender, address, phone,
      emergency_contact, emergency_phone, consent_flag
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, uhid`,
    [
      newUhid,
      encName,
      encDob,
      'Other',
      encAddress,
      encPhone,
      encEmergContact,
      encEmergPhone,
      false,
    ]
  );

  return {
    id: insertResult.rows[0].id,
    uhid: insertResult.rows[0].uhid,
  };
}

/**
 * Generates backend-signed session token (JWT) for mobile patient clients (1 hour duration)
 */
export function generatePatientSessionToken(patient: { id: string; uhid: string }): string {
  return jwt.sign(
    {
      patientId: patient.id,
      uhid: patient.uhid,
      role: 'Patient',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Verifies backend-signed session token (JWT)
 */
export function verifyPatientSessionToken(token: string): { patientId: string; uhid: string; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { patientId: string; uhid: string; role: string };
  } catch (error) {
    throw new Error('INVALID_CREDENTIALS');
  }
}
