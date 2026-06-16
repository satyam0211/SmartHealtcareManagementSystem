import { Response } from 'express';
import { AuthenticatedRequest } from '../user/user.middleware';
import * as vitalsService from './vitals.service';

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
      ['ACCESS_VIOLATION', isPatient ? null : (req.user?.id || null), isPatient ? (req.user?.id || null) : patientId, 'Patient Vitals', ipAddress]
    );
  } catch (error) {
    console.error('Audit logging access violation failed:', error);
  }
}

/**
 * POST /v1/triage/vitals
 * Logs patient vital signs during triage.
 */
export async function saveVitals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { patientId, queueTokenId, bloodPressure, heartRate, temperature, weight } = req.body;

    if (
      !patientId ||
      !queueTokenId ||
      !bloodPressure ||
      heartRate === undefined ||
      temperature === undefined ||
      weight === undefined
    ) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Patient ID, Queue Token ID, Blood Pressure, Heart Rate, Temperature, and Weight are required.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const operatorUserId = req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await vitalsService.saveVitals(
      patientId,
      queueTokenId,
      bloodPressure,
      Number(heartRate),
      Number(temperature),
      Number(weight),
      operatorUserId,
      ipAddress
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'VALIDATION_FAILED') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Invalid input fields or values out of acceptable ranges.',
      });
      return;
    }
    if (error.message === 'QUEUE_TOKEN_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'QUEUE_TOKEN_NOT_FOUND',
        message: 'Matching active queue token was not found.',
      });
      return;
    }
    if (error.message === 'PATIENT_MISMATCH') {
      res.status(400).json({
        success: false,
        error: 'PATIENT_MISMATCH',
        message: 'Queue token does not match the provided patient ID.',
      });
      return;
    }
    if (error.message === 'VITALS_ALREADY_RECORDED') {
      res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Vitals have already been recorded for this queue token.',
      });
      return;
    }
    console.error('Save vitals failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * GET /v1/triage/vitals/:id
 * Retrieves decrypted patient vitals by record ID.
 */
export async function getVitalsById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const vitalsId = req.params.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await vitalsService.getVitalsById(vitalsId, req.user, ipAddress);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'VITALS_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'VITALS_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'ACCESS_DENIED') {
      // Log access violation
      const patientId = req.user?.id || 'unknown';
      await logAccessViolation(req, patientId);
      res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
      });
      return;
    }
    console.error('Get vitals by ID failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * GET /v1/triage/vitals/queue-token/:queueTokenId
 * Retrieves decrypted patient vitals by queue token ID.
 */
export async function getVitalsByQueueToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const queueTokenId = req.params.queueTokenId;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await vitalsService.getVitalsByQueueToken(queueTokenId, req.user, ipAddress);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'VITALS_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'VITALS_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'ACCESS_DENIED') {
      // Log access violation
      const patientId = req.user?.id || 'unknown';
      await logAccessViolation(req, patientId);
      res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
      });
      return;
    }
    console.error('Get vitals by queue token failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}
