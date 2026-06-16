import { Request, Response } from 'express';
import crypto from 'crypto';
import { authenticateStaffCredentials, sessionStore } from './user.service';
import { AuthenticatedRequest, logAuditEvent } from './user.middleware';

// Brute Force Lockout Map: email -> { failedCount, lockedUntil }
interface LockoutInfo {
  failedCount: number;
  lockedUntil: number;
}
const lockoutMap = new Map<string, LockoutInfo>();

export function clearLockouts(): void {
  lockoutMap.clear();
}

const LOCKOUT_LIMIT = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Validates basic email formatting
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /v1/auth/staff/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  // 1. Basic validation
  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required.',
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email address format.',
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long.',
    });
    return;
  }

  // 2. Lockout check
  const lockout = lockoutMap.get(email);
  if (lockout) {
    if (lockout.lockedUntil > Date.now()) {
      res.status(423).json({
        success: false,
        error: 'Account locked due to consecutive login failures. Try again in 15 minutes.',
      });
      return;
    } else if (lockout.lockedUntil > 0) {
      // Lockout expired, reset map entry
      lockoutMap.delete(email);
    }
  }

  // 3. Authenticate credentials
  const user = await authenticateStaffCredentials(email, password);

  if (!user) {
    // Increment failed attempts
    const currentLockout = lockoutMap.get(email) || { failedCount: 0, lockedUntil: 0 };
    currentLockout.failedCount += 1;

    if (currentLockout.failedCount >= LOCKOUT_LIMIT) {
      currentLockout.lockedUntil = Date.now() + LOCKOUT_TIME_MS;
      lockoutMap.set(email, currentLockout);
      
      // Log failed auth warning
      await logAuditEvent('STAFF_LOGIN_LOCKOUT', null, ipAddress, 'users');

      res.status(423).json({
        success: false,
        error: 'Account locked due to consecutive login failures. Try again in 15 minutes.',
      });
      return;
    } else {
      lockoutMap.set(email, currentLockout);
    }

    // Log audit log event for failure
    await logAuditEvent('STAFF_LOGIN_FAILED', null, ipAddress, 'users');

    res.status(401).json({
      success: false,
      error: 'Invalid email or password.',
    });
    return;
  }

  // Authentication Succeeded
  // Clear lockout count
  lockoutMap.delete(email);

  // Generate Session ID
  const sessionId = crypto.randomUUID();

  // Create session in Memory store
  sessionStore.createSession(sessionId, user);

  // Set Cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours absolute maximum duration
  });

  // Log successful login
  await logAuditEvent('STAFF_LOGIN_SUCCESS', user.id, ipAddress, 'users');

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    },
  });
}

/**
 * POST /v1/auth/staff/logout
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const sessionId = req.sessionId;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  if (sessionId) {
    sessionStore.invalidateSession(sessionId);
    await logAuditEvent('STAFF_LOGOUT', req.user?.id || null, ipAddress, 'users');
  }

  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

/**
 * GET /v1/auth/staff/session
 */
export function getSessionInfo(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. No active session.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email,
        departmentId: req.user.departmentId,
      },
    },
  });
}
