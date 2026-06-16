import { Request, Response } from 'express';
import { verifyFirebaseIdToken, findOrCreatePatientByPhone, generatePatientSessionToken } from './patient-auth.service';
import { logAuditEvent } from './user.middleware';

/**
 * POST /v1/auth/patients/login
 */
export async function patientLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  if (!idToken) {
    res.status(400).json({
      success: false,
      error: 'Firebase ID Token is required.',
    });
    return;
  }

  try {
    // 1. Verify the Firebase ID Token
    const firebaseUser = await verifyFirebaseIdToken(idToken);
    
    if (!firebaseUser.phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'Phone number is required in Firebase ID Token.',
      });
      return;
    }

    // 2. Find or create the Patient record
    const patient = await findOrCreatePatientByPhone(firebaseUser.phoneNumber);

    // 3. Generate session token (JWT)
    const sessionToken = generatePatientSessionToken(patient);

    // 4. Log successful patient login audit event
    await logAuditEvent('PATIENT_LOGIN_SUCCESS', null, ipAddress, 'Patients', patient.id);

    res.status(200).json({
      success: true,
      data: {
        sessionToken,
        patient: {
          id: patient.id,
          uhid: patient.uhid,
        },
      },
    });
  } catch (error: any) {
    console.error('Patient login failed:', error);
    
    // Log failure event
    await logAuditEvent('PATIENT_LOGIN_FAILED', null, ipAddress, 'Patients');

    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
    });
  }
}
