import { Router } from 'express';
import { login, logout, getSessionInfo } from './user.controller';
import { authenticateSession } from './user.middleware';

const router = Router();

// Staff Login (unauthenticated)
router.post('/login', login);

// Staff Logout (requires active session)
router.post('/logout', authenticateSession, logout);

// Get current Staff session (requires active session)
router.get('/session', authenticateSession, getSessionInfo);

export default router;
