import { Router } from 'express';
import { authenticateSession, requireRoles } from '../user/user.middleware';
import * as vitalsController from './vitals.controller';

const router = Router();

// POST /v1/triage/vitals - Logs patient triage vital signs
router.post(
  '/',
  authenticateSession,
  requireRoles(['Nurse']),
  vitalsController.saveVitals
);

// GET /v1/triage/vitals/:id - Retrieves decrypted patient vitals by ID
router.get(
  '/:id',
  authenticateSession,
  requireRoles(['Patient', 'Doctor', 'Nurse', 'Administrator']),
  vitalsController.getVitalsById
);

// GET /v1/triage/vitals/queue-token/:queueTokenId - Retrieves decrypted patient vitals by queue token ID
router.get(
  '/queue-token/:queueTokenId',
  authenticateSession,
  requireRoles(['Patient', 'Doctor', 'Nurse', 'Administrator']),
  vitalsController.getVitalsByQueueToken
);

export default router;
