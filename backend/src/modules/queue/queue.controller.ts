import { Response } from 'express';
import { AuthenticatedRequest } from '../user/user.middleware';
import * as queueService from './queue.service';

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
      ['ACCESS_VIOLATION', isPatient ? null : (req.user?.id || null), isPatient ? (req.user?.id || null) : patientId, 'Queue / Appointment', ipAddress]
    );
  } catch (error) {
    console.error('Audit logging access violation failed:', error);
  }
}

/**
 * POST /v1/appointments
 * Books a new OPD consultation slot.
 */
export async function createAppointment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { patientId, doctorId, scheduledDate, timeSlot } = req.body;

    if (!patientId || !doctorId || !scheduledDate || !timeSlot) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Patient ID, Doctor ID, Scheduled Date, and Time Slot are required.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    // Patient own booking check
    if (req.user.role === 'Patient' && req.user.id !== patientId) {
      await logAccessViolation(req, patientId);
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    const operatorUserId = req.user.role === 'Patient' ? null : req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await queueService.createAppointment(
      patientId,
      doctorId,
      scheduledDate,
      timeSlot,
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
        message: 'Invalid input fields or timeSlot is not matching the 15-minute grid (e.g. 09:30).',
      });
      return;
    }
    if (error.message === 'DOCTOR_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'DOCTOR_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'SLOT_OCCUPIED') {
      res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'The doctor is already booked for this specific date/time.',
      });
      return;
    }
    console.error('Create appointment failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * GET /v1/appointments
 * Returns a list of appointments with filters.
 */
export async function listAppointments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { patientId, doctorId, date, page, limit } = req.query;

    const filters = {
      patientId: patientId ? String(patientId) : undefined,
      doctorId: doctorId ? String(doctorId) : undefined,
      date: date ? String(date) : undefined,
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
    };

    const result = await queueService.listAppointments(filters, req.user);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error.message === 'ACCESS_DENIED') {
      res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
      });
      return;
    }
    console.error('List appointments failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * PUT /v1/appointments/:id/cancel
 * Cancels a booked appointment.
 */
export async function cancelAppointment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const appointmentId = req.params.id;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const operatorUserId = req.user.role === 'Patient' ? null : req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await queueService.cancelAppointment(
      appointmentId,
      req.user,
      operatorUserId,
      ipAddress
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'APPOINTMENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'APPOINTMENT_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'ACCESS_DENIED') {
      res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
      });
      return;
    }
    if (error.message === 'CANCELLATION_WINDOW_EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'CANCELLATION_WINDOW_EXPIRED',
        message: 'Cancel requested less than 2 hours before scheduled slot.',
      });
      return;
    }
    console.error('Cancel appointment failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * POST /v1/queues/tokens
 * Generates waitlist token on check-in.
 */
export async function checkInPatientAndGenerateToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Appointment ID is required.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const operatorUserId = req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await queueService.checkInPatientAndGenerateToken(
      appointmentId,
      operatorUserId,
      ipAddress
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'APPOINTMENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'APPOINTMENT_NOT_FOUND',
      });
      return;
    }
    if (error.message === 'INVALID_APPOINTMENT_STATUS') {
      res.status(400).json({
        success: false,
        error: 'INVALID_APPOINTMENT_STATUS',
        message: 'Appointment is not in Booked status.',
      });
      return;
    }
    console.error('Check-in patient failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * GET /v1/queues/tokens/active
 * GET /v1/queues/tokens/live
 * Queries the active waitlist queue.
 */
export async function getActiveWaitlist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const doctorId = req.query.doctorId ? String(req.query.doctorId) : undefined;
    const result = await queueService.getActiveWaitlist(doctorId, req.user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get active waitlist failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}

/**
 * PUT /v1/queues/tokens/:id/status
 * Updates queue token status.
 */
export async function updateTokenStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tokenId = req.params.id;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Status is required.',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const operatorUserId = req.user.id;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const result = await queueService.updateTokenStatus(
      tokenId,
      status,
      operatorUserId,
      ipAddress
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'TOKEN_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'TOKEN_NOT_FOUND',
      });
      return;
    }
    console.error('Update token status failed:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
    });
  }
}
