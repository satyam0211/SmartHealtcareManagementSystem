import { Router } from 'express';
import { authenticateSession, requireRoles } from '../user/user.middleware';
import * as queueController from './queue.controller';

const router = Router();

// POST /v1/appointments - Books a new OPD consultation slot
router.post(
  '/appointments',
  authenticateSession,
  requireRoles(['Patient', 'Receptionist']),
  queueController.createAppointment
);

// GET /v1/appointments - Lists scheduled appointments with filters
router.get(
  '/appointments',
  authenticateSession,
  requireRoles(['Patient', 'Doctor', 'Nurse', 'Receptionist', 'Billing Officer', 'Administrator']),
  queueController.listAppointments
);

// PUT /v1/appointments/:id/cancel - Cancels a booked appointment
router.put(
  '/appointments/:id/cancel',
  authenticateSession,
  requireRoles(['Patient', 'Receptionist']),
  queueController.cancelAppointment
);

// POST /v1/queues/tokens - Generates a waitlist token on check-in
router.post(
  '/queues/tokens',
  authenticateSession,
  requireRoles(['Receptionist']),
  queueController.checkInPatientAndGenerateToken
);

// GET /v1/queues/tokens/active - Queries the active waitlist queue
router.get(
  '/queues/tokens/active',
  authenticateSession,
  requireRoles(['Patient', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Billing Officer', 'Administrator']),
  queueController.getActiveWaitlist
);

// GET /v1/queues/tokens/live - Alias for the live waitlist queue
router.get(
  '/queues/tokens/live',
  authenticateSession,
  requireRoles(['Patient', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Billing Officer', 'Administrator']),
  queueController.getActiveWaitlist
);

// PUT /v1/queues/tokens/:id/status - Updates queue token status (e.g. Call Patient)
router.put(
  '/queues/tokens/:id/status',
  authenticateSession,
  requireRoles(['Doctor', 'Nurse', 'Receptionist']),
  queueController.updateTokenStatus
);

export default router;
