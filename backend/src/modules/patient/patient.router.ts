import { Router } from 'express';
import { authenticateSession, requireRoles } from '../user/user.middleware';
import * as patientController from './patient.controller';

const router = Router();

// POST /v1/patients - Registers new patient & generates UHID
router.post(
  '/',
  authenticateSession,
  requireRoles(['Receptionist', 'Administrator']),
  patientController.createPatient
);

// GET /v1/patients/:id - Retrieves patient demographic & PHI
router.get(
  '/:id',
  authenticateSession,
  patientController.getPatientById
);

// PUT /v1/patients/:id - Updates patient profile details
router.put(
  '/:id',
  authenticateSession,
  requireRoles(['Receptionist', 'Administrator']),
  patientController.updatePatient
);

// PUT /v1/patients/:id/consent - Updates patient opt-in/opt-out status
router.put(
  '/:id/consent',
  authenticateSession,
  patientController.updatePatientConsent
);

export default router;
