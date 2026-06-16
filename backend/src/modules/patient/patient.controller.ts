import { Response } from 'express';
import { AuthenticatedRequest } from '../user/user.middleware';
import * as patientService from './patient.service';

/**
 * Helper to log privilege escalation warning to AuditLogs (mimics requireRoles behavior)
 */
async function logAccessViolation(req: AuthenticatedRequest, patientId: string): Promise<void> {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const isPatient = req.user?.role === 'Patient';
  const { dbQuery } = require('../../config/database');
  try {
    await dbQuery(
      `INSERT INTO audit_logs (action, user_id, patient_id, entity_changed, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['ACCESS_VIOLATION', isPatient ? null : (req.user?.id || null), isPatient ? (req.user?.id || null) : patientId, 'Patient Profile', ipAddress]
    );
  } catch (error) {
    console.error('Audit logging access violation failed:', error);
  }
}

/**
 * POST /v1/patients
 * Registers a patient profile and outputs a unique hospital ID.
 */
export async function createPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const operatorUserId = req.user?.id || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const newPatient = await patientService.createPatient(req.body, operatorUserId, ipAddress);

    res.status(201).json({
      success: true,
      data: {
        id: newPatient.id,
        uhid: newPatient.uhid,
      },
    });
  } catch (error: any) {
    if (error.message === 'VALIDATION_FAILED') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Name, DOB, Gender, Address, Phone, Emergency Contact, and Phone are required.',
      });
      return;
    }
    console.error('Create patient failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * GET /v1/patients/:id
 * Retrieves demographic and medical metadata for a patient.
 */
export async function getPatientById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const patientId = req.params.id;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    // RBAC Conditions
    const allowedRoles = ['Patient', 'Doctor', 'Nurse', 'Lab Staff', 'Pharmacist', 'Billing Officer', 'Administrator', 'Receptionist'];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    if (req.user.role === 'Patient' && req.user.id !== patientId) {
      await logAccessViolation(req, patientId);
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    const operatorUserId = req.user.role === 'Patient' ? null : req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const patient = await patientService.getPatientById(patientId, operatorUserId, ipAddress);

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    if (error.message === 'PATIENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'PATIENT_NOT_FOUND',
      });
      return;
    }
    console.error('Get patient failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * PUT /v1/patients/:id
 * Updates patient profile details.
 */
export async function updatePatient(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const patientId = req.params.id;
    const operatorUserId = req.user?.id || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const updatedPatient = await patientService.updatePatient(patientId, req.body, operatorUserId, ipAddress);

    res.status(200).json({
      success: true,
      data: updatedPatient,
    });
  } catch (error: any) {
    if (error.message === 'PATIENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'PATIENT_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'VALIDATION_FAILED') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
      });
      return;
    }
    console.error('Update patient failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * PUT /v1/patients/:id/consent
 * Updates patient opt-in/opt-out status.
 */
export async function updatePatientConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const patientId = req.params.id;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    // RBAC: Patient (own only), Receptionist, Administrator
    const allowedRoles = ['Patient', 'Receptionist', 'Administrator'];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    if (req.user.role === 'Patient' && req.user.id !== patientId) {
      await logAccessViolation(req, patientId);
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    const operatorUserId = req.user.role === 'Patient' ? null : req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const { consentFlag } = req.body;

    if (consentFlag === undefined || typeof consentFlag !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'consentFlag is required and must be a boolean.',
      });
      return;
    }

    const result = await patientService.updatePatientConsent(patientId, consentFlag, operatorUserId, ipAddress);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'PATIENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'PATIENT_NOT_FOUND',
      });
      return;
    }
    console.error('Update patient consent failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}
