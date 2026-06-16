# Task 014: Security Auditing and Data Access Audit Trail
**Status:** pending
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [security, database, backend]

## Description
This task implements the system-wide security auditing framework. It covers tracking all user actions targeting restricted patient PII/PHI records. The audit log must record the exact database field states before and after any change (pre- and post-modification logs), the user ID, client IP, action type (Create, Read, Edit, Delete), and timestamp.

Additionally, this task covers building the administrative audit trail viewer. If a database transaction write to the audit log fails, the entire primary transactional query (e.g. medical note save) must fail and rollback to prevent untracked actions.

## Document References

### PRD
- **Feature ID:** F-SEC-03 (Data Access Auditing)
- **User Story:** As an Administrator, I want to view audit trails of who accessed records, what changed, and when changes occurred so that we ensure security compliance.
- **Acceptance Criteria:**
  1. Every record read, write, or modification on Patient data must automatically generate a record in `AuditLogs`.
  2. The audit log record must capture: Action Type, User ID, Timestamp, Entity Changed, and the Pre- and Post-modification states for all edits.
  3. The administrator audit interface must allow searching logs by Patient UHID, User ID, and Date Range.

### SRS
- **Requirement IDs:** FR-SEC-03-01 (Pre/Post Log), FR-SEC-03-02 (Audit Failure Rollback)
- **SHALL statements:**
  * The system SHALL log pre- and post-modification database states for all edits.
  * The system SHALL roll back the primary transaction if writing to the audit log fails.

### Architecture
- **Component(s):** User Service (Audit middleware), Web Portal (Admin panel)
- **Data Flow:** Any module API call -> Audit middleware intercepts -> executes log transaction -> inserts record to `audit_logs` in Postgres -> return data.

### Database
- **Tables:** `audit_logs`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/admin/audit-logs` (query security history)
- **Auth/Role guard:** Administrator only.

### Security
- **Threats addressed:**
  * T-AUD-01 (Repudiation - mitigated by absolute transactional logs of all changes)
  * T-AUD-02 (Log tempering - database level read-only constraints on audit tables)
- **Data classifications:** `RESTRICTED` Audit trail logs.

### Design
- **Screen(s):** SCR-AD-03 (Audit Logs Console)
- **Components used:** Log entry grids, query filters
- **Design tokens:** Primary Color, Typography Body-2

### Testing
- **Unit tests:** None
- **Integration tests:** None
- **Security tests:** ST-SEC-03 (Audit rollback verification test)
- **UAT scenarios:** None

## Acceptance Criteria
- [ ] Every patient read, write, or update API call generates a row in the `audit_logs` table.
- [ ] Database updates write JSON payloads showing field changes before and after the modification.
- [ ] Primary write transactions roll back completely if the database fails to write to the `audit_logs` table.
- [ ] Audit logs database records are read-only; update/delete operations on the `audit_logs` table are blocked.
- [ ] Only users authenticated with the `Administrator` role can query the audit logs.

## Dependencies
- task-002: Database Schema Creation, Migrations, and Seeding (requires `audit_logs` table)

## Implementation Approach
### Step-by-step Plan:
1. Write `audit.service.ts` implementing `writeAuditEntry()` that wraps queries inside active database transactions.
2. Build global Express middleware (`audit.middleware.ts`) that intercepts controller responses and logs access.
3. Configure PostgreSQL triggers or rule constraints blocking UPDATE/DELETE actions on the `audit_logs` table.
4. Build the administrative Audit Logs view in the Web Portal using Vanilla JS.

### Technical Considerations:
- Stringify state payloads before database writes using standard serialization libraries.

### Architecture/Design Notes:
- Governed by ADR-05 (Attending clinician access controls and audit enforcement).

## Files to Modify/Create
- `backend/src/modules/user/audit.service.ts` — Create audit logger service
- `backend/src/modules/user/audit.middleware.ts` — Create request interceptor middleware
- `backend/src/modules/user/admin.controller.ts` — Create audit queries controller path
