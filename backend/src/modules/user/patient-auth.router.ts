import { Router } from 'express';
import { patientLogin } from './patient-auth.controller';

const router = Router();

// Patient login via Firebase ID Token
router.post('/login', patientLogin);

export default router;
