import bcrypt from 'bcrypt';
import { dbQuery } from '../../config/database';

export interface UserSession {
  id: string;
  email: string;
  role: string;
  departmentId: string | null;
  createdAt: number;
  lastAccess: number;
}

// In-Memory Session Store (acting as the secure session storage engine for Phase 1)
class MemorySessionStore {
  private sessions = new Map<string, UserSession>();
  private idleTimeoutMs = 15 * 60 * 1000; // 15 minutes idle timeout (per Security_Requirements.md Section 2)
  private absoluteTimeoutMs = 12 * 60 * 60 * 1000; // 12 hours absolute timeout (per Security_Requirements.md Section 2)

  public createSession(sessionId: string, user: { id: string; email: string; role: string; departmentId: string | null }): UserSession {
    const session: UserSession = {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      createdAt: Date.now(),
      lastAccess: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    // 1. Check Idle Expiry
    if (now - session.lastAccess > this.idleTimeoutMs) {
      this.sessions.delete(sessionId);
      return null;
    }
    // 2. Check Absolute Expiry
    if (now - session.createdAt > this.absoluteTimeoutMs) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last access timestamp
    session.lastAccess = now;
    this.sessions.set(sessionId, session);
    return session;
  }

  public invalidateSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public clearAll(): void {
    this.sessions.clear();
  }
}

export const sessionStore = new MemorySessionStore();

/**
 * Validates staff credentials and returns user details.
 */
export async function authenticateStaffCredentials(email: string, rawPassword: string): Promise<any> {
  const result = await dbQuery('SELECT * FROM users WHERE email = $1 AND status = \'Active\' AND deleted_at IS NULL', [email]);
  
  if (result.rowCount === 0) {
    return null; // Email not found or inactive
  }

  const user = result.rows[0];
  
  // Verify bcrypt password hash (work factor of 10 was used to create the hash during seed)
  const isMatch = await bcrypt.compare(rawPassword, user.password_hash);
  if (!isMatch) {
    return null; // Password mismatch
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.department_id,
  };
}
