# Task 003: Staff Authentication and Session Management
**Status:** in-progress
**Priority:** P0
**Complexity:** high
**Estimated Time:** 12 hours
**Tags:** [auth, security, backend]

## Description
This task implements the secure login and session management system for all hospital staff roles (Doctors, Nurses, Receptionists, Pharmacists, Lab Staff, Billing Officers, Administrators, and Super Admins). It covers email-and-password verification on the backend, password hashing with bcrypt, and session tracking.

Upon successful authentication, the server generates a high-entropy session ID stored in a secure session store and returned to the browser via an HTTP-only, Secure, SameSite=Strict cookie. The task also implements role-based access control (RBAC) middleware to guard routes and enforce idle session timeouts.

## Document References

### PRD
- **Feature ID:** F-SEC-02 (Doctor & Staff Authentication & RBAC)
- **User Story:** As a Doctor/Nurse/Staff member, I want to log in with my email and password so that I can securely perform my role-based duties.
- **Acceptance Criteria:**
  1. The staff login portal must authenticate users using Email and Password.
  2. Successful login must create a secure HTTP-only cookie session.
  3. The system must enforce Role-Based Access Control (RBAC): users with the role "Doctor" must be redirected to the Doctor Dashboard and blocked from accessing Billing, Lab, or Administrator panels, while "Lab Staff" must be restricted to Lab dashboards, etc.

### SRS
- **Requirement IDs:** FR-SEC-02-01 (Staff Credentials), FR-SEC-02-02 (Cookie Protections), FR-SEC-02-03 (Idle Timeout)
- **SHALL statements:**
  * The system SHALL authenticate staff users using email and password.
  * The system SHALL return the session ID inside an HTTP-only, Secure, SameSite=Strict cookie.
  * The system SHALL automatically invalidate the session cookie after 15 minutes of idle time.

### Architecture
- **Component(s):** User & Auth Service, API Gateway (NGINX)
- **Data Flow:** Clients submit credentials -> Gateway -> User Service validates and sets session cookie -> Client browser stores cookie.

### Database
- **Tables:** `users`, `departments`
- **Migrations:** None (uses schema created in Task 002)

### API
- **Endpoints:** 
  * `POST /api/auth/staff`
  * `POST /api/auth/logout`
  * `GET /api/auth/session`
- **Auth/Role guard:** None for login endpoint. Authentication required for Session and Logout.

### Security
- **Threats addressed:**
  * T-AUTH-01 (Spoofing - mitigated by bcrypt password verification)
  * T-AUTH-03 (Session Hijacking - mitigated by HTTP-only, Secure cookie attributes)
- **Data classifications:** `RESTRICTED` staff passwords (stored hashed).

### Design
- **Screen(s):** Web Portal login screens (integrated via UI mockups)
- **Components used:** Login Form, Button
- **Design tokens:** Primary Color, Surface Color

### Testing
- **Unit tests:** User Authentication service unit tests
- **Integration tests:** IT-SEC-02 (RBAC endpoint protection test)
- **Security tests:** ST-SEC-02 (Session Hijacking test check)
- **UAT scenarios:** UAT-AD-01 (Admin logs in and creates a user)

## Acceptance Criteria
- [ ] Password hashes in the database are processed using bcrypt with a minimum work factor of 10.
- [ ] Successful login returns a Session ID cookie configured with properties: `HttpOnly=true`, `Secure=true`, and `SameSite=Strict`.
- [ ] Active sessions automatically expire after 15 minutes of inactivity (idle timeout) or 12 hours absolute maximum duration.
- [ ] Route middleware rejects requests with `HTTP 403 Forbidden` if the authenticated user's role does not match the allowed roles defined in the Permissions Matrix.
- [ ] Any failed access attempt due to role mismatch terminates the active session immediately, logs a security warning in the audit trail, and returns an HTTP 403 response.

## Dependencies
- task-002: Database Schema Creation, Migrations, and Seeding (requires `users` table)

## Implementation Approach
### Step-by-step Plan:
1. Implement password hashing utility using bcrypt.
2. Build `UserService` exposing `authenticateStaff()`, `createSession()`, and `validateSession()` methods.
3. Write `AuthController` handling Express routing for staff authentication endpoints.
4. Implement `rbacGuard()` middleware interceptor checking user session status and role bounds.
5. Create frontend web login scripts linking forms to the `POST /api/auth/staff` API.

### Technical Considerations:
- Ensure sessions are stored in an active session manager (Redis or standard in-memory token store) to enable fast server-side revocation.
- SameSite=Strict cookies must not be bypassed by CORS; configure credentials sharing correctly.

### Architecture/Design Notes:
- Governed by ADR-02 (Session-based Authentication for Web Clients vs Token-based for Mobile Patients).

## Files to Modify/Create
- `backend/src/modules/user/user.controller.ts` — Create auth route handler
- `backend/src/modules/user/user.service.ts` — Create authentication logic
- `backend/src/modules/user/user.middleware.ts` — Create session & RBAC guards
- `backend/src/modules/user/user.router.ts` — Define auth routes

## Testing Requirements
Reference: /documents/Testing_Strategy.md

### Integration Tests (Part 2):
- [ ] IT-SEC-02: Test that requesting `/api/admin/audit-logs` as a user with role `Nurse` returns an `HTTP 403 Forbidden` error.

### Security Tests (Part 3):
- [ ] ST-SEC-02: Run a client script to verify that document.cookie cannot read the session cookie.
