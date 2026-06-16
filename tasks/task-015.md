# Task 015: Hospital Configuration and Platform settings
**Status:** pending
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the administration and settings panels. It covers hospital-wide configuration management for Administrators (creating staff accounts, assigning roles, binding staff to departments) and platform-wide configurations for Super Admins.

For the frontend, it includes building settings panels in the Web Portal that manage departments, configure hospital settings, and manage staff accounts.

## Document References

### PRD
- **Feature ID:** F-ADM-01 (Hospital Settings), F-ADM-02 (Platform Configuration)
- **User Story:**
  * As an Administrator, I want to configure hospital settings, manage departments, and create staff accounts so that hospital operations run smoothly.
  * As a Super Admin, I want to manage platform-wide configuration settings and global parameters so that system settings are properly maintained.
- **Acceptance Criteria:**
  1. Admin settings console provides interfaces to Add/Edit/Disable hospital Departments.
  2. Console provides User Management interface to create staff accounts, assign roles, and associate them with departments.
  3. Staff details saved in `Users` and/or `Doctors` tables.
  4. Platform console displays options to manage system settings, variables, and roles.
  5. Configs saved in global platform configuration table.

### SRS
- **Requirement IDs:** FR-ADM-01-01 (Add Department), FR-ADM-01-02 (User Creation), FR-ADM-02-01 (Global Configs)
- **SHALL statements:**
  * The system SHALL store staff account metadata.
  * The system SHALL provide global platform configuration interfaces.

### Architecture
- **Component(s):** User Service (Admin sub-controller), Web Portal (Admin UI)
- **Data Flow:** Admin creates account -> User Service writes user record -> returns HTTP 201.

### Database
- **Tables:** `users`, `departments`, `doctors`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/admin/staff` (create user)
  * `PUT /api/admin/staff/{id}` (update user status)
  * `POST /api/admin/departments` (create department)
  * `PUT /api/admin/config` (update system variables)
- **Auth/Role guard:** Administrator (for hospital staff settings), Super Admin (for global parameters).

### Security
- **Threats addressed:**
  * T-ADM-01 (Bypassing account deactivation - disabled users must have their active sessions revoked immediately)
- **Data classifications:** `CONFIDENTIAL` Staff metadata.

### Design
- **Screen(s):** SCR-AD-04 (Admin Settings panel), SCR-SA-01 (Super Admin Dashboard)
- **Components used:** Settings sidebar, user roster tables, department lists
- **Design tokens:** Primary Color, Typography Body-1

### Testing
- **Unit tests:** User role validation checks
- **Integration tests:** IT-ADM-01 (Staff account creation and role assignment test)
- **Security tests:** None
- **UAT scenarios:** UAT-AD-01 (Admin configures department and registers a doctor)

## Acceptance Criteria
- [ ] Administrator can add/disable departments and staff accounts.
- [ ] Staff deactivation sets status to `Disabled` and immediately terminates their active sessions.
- [ ] User role assignments must conform to predefined list (Doctor, Nurse, Receptionist, Lab Staff, Pharmacist, Billing Officer, Administrator, Super Admin).
- [ ] Super Admin can modify global parameters from a dedicated console.

## Dependencies
- task-003: Staff Authentication and Session Management (requires admin RBAC validation)

## Implementation Approach
### Step-by-step Plan:
1. Implement the user registration and deactivation methods in `admin.service.ts`.
2. Integrate session revocation logic inside `user.middleware.ts` to invalidate active session cookies immediately upon account deactivation.
3. Build the User Management and Department lists views in the Web Portal using Vanilla JS.
4. Implement the Super Admin global variables console in the Web Portal.

### Technical Considerations:
- Prevent deleting users to maintain referential integrity; utilize the soft deactivation field `deleted_at`.

### Architecture/Design Notes:
- Governed by ADR-02 (Role validation checks).

## Files to Modify/Create
- `backend/src/modules/user/admin.controller.ts` — Create admin settings routes
- `backend/src/modules/user/admin.service.ts` — Implement account management logic
- `backend/src/modules/user/admin.router.ts` — Define admin paths
