import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import staffAuthRouter from './modules/user/user.router';
import patientAuthRouter from './modules/user/patient-auth.router';
import patientRouter from './modules/patient/patient.router';
import queueRouter from './modules/queue/queue.router';
import vitalsRouter from './modules/patient/vitals.router';
import { authenticateSession, requireRoles } from './modules/user/user.middleware';
import { getSessionInfo } from './modules/user/user.controller';

const app = express();

// Enable CORS with credentials support for session cookies
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Mock endpoint to fulfill IT-SEC-02: verify RBAC protection on admin audit logs
app.get('/v1/admin/audit-logs', authenticateSession, requireRoles(['Administrator']), (_req, res) => {
  res.status(200).json({ success: true, message: 'Access granted to audit logs.' });
});

// Mount Authentication Router
app.use('/v1/auth/staff', staffAuthRouter);
app.use('/v1/auth/patients', patientAuthRouter);
app.use('/v1/patients', patientRouter);
app.use('/v1', queueRouter);
app.use('/v1/triage/vitals', vitalsRouter);

// Alias route to match GET /v1/auth/session
app.get('/v1/auth/session', authenticateSession, getSessionInfo);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'UP' });
});

export default app;

// Start server if not running in Jest tests
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Smart Healthcare Intelligence Platform backend listening on port ${PORT}`);
  });
}
