import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { sessionStore, UserSession } from './user.service';
import { dbQuery } from '../../config/database';
import { verifyPatientSessionToken } from './patient-auth.service';

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
  sessionId?: string;
}

export interface PatientAuthenticatedRequest extends Request {
  patient?: {
    id: string;
    uhid: string;
    role: string;
  };
}

/**
 * Helper function to log audit events into the database
 */
export async function logAuditEvent(
  action: string,
  userId: string | null,
  ipAddress: string,
  entityChanged: string,
  patientId: string | null = null
): Promise<void> {
  try {
    await dbQuery(
      'INSERT INTO audit_logs (action, user_id, entity_changed, ip_address, patient_id) VALUES ($1, $2, $3, $4, $5)',
      [action, userId, entityChanged, ipAddress, patientId]
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

/**
 * Middleware to authenticate staff sessions via HTTP-only secure cookie
 */
export function authenticateSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Support Bearer token for patients trying to access staff endpoints (privilege escalation check)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyPatientSessionToken(token);
      req.user = {
        id: payload.patientId,
        role: payload.role,
        email: `patient-${payload.uhid}@ship.local`,
        departmentId: null,
        createdAt: Date.now(),
        lastAccess: Date.now(),
      };
      // Set a dummy sessionId to satisfy the requireRoles check
      req.sessionId = 'patient_bearer_token';
      return next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
      });
      return;
    }
  }

  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    if (req.baseUrl.startsWith('/v1/patients') || req.path.startsWith('/v1/patients') || req.originalUrl.startsWith('/v1/patients')) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Unauthorized. No active session cookie found.',
    });
    return;
  }

  const session = sessionStore.getSession(sessionId);

  if (!session) {
    // Session is invalid or has expired (idle timeout / absolute timeout)
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(401).json({
      success: false,
      error: 'Session has expired or is invalid. Please log in again.',
    });
    return;
  }

  // Session is valid, attach user context to request
  req.user = session;
  req.sessionId = sessionId;
  next();
}

/**
 * Middleware to check user role permissions (RBAC)
 */
export function requireRoles(allowedRoles: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || !req.sessionId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Authenticated user required.',
      });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Role mismatch / Privilege Escalation Attempt detected:
    // 1. Immediately invalidate active session (if staff)
    if (req.sessionId && req.sessionId !== 'patient_bearer_token') {
      sessionStore.invalidateSession(req.sessionId);
    }

    // 2. Clear cookie
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 3. Log security warning to AuditLogs
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const isPatient = req.user.role === 'Patient';
    await logAuditEvent(
      'PRIVILEGE_ESCALATION_ATTEMPT',
      isPatient ? null : req.user.id,
      ipAddress,
      'RBAC',
      isPatient ? req.user.id : null
    );

    // 4. Return HTTP 403 response
    res.status(403).json({
      success: false,
      error: 'ACCESS_DENIED',
      message: 'Access denied. Unauthorized role. Active session terminated.',
    });
  };
}

/**
 * Middleware to authenticate patient session tokens (JWT)
 */
export function authenticatePatientToken(
  req: PatientAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
    });
    return;
  }

  try {
    const payload = verifyPatientSessionToken(token);
    req.patient = {
      id: payload.patientId,
      uhid: payload.uhid,
      role: payload.role,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
    });
  }
}
