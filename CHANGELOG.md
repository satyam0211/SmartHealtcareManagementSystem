# Changelog
All notable changes to this project will be documented in this file.

## How to Read This Changelog
- Each entry represents a completed task or significant change
- Entries include: what changed, why, which files, which spec documents satisfied
- Most recent changes are at the top

---

## [Unreleased]
### In Progress

---

## [0.8.0] - 2026-06-16
### Task: task-007 — Patient Triage and Vital Signs Recording
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 5 hours (estimated: 6 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-OPD-05 — Patient Vital Signs Recording (Triage)
- SRS Requirements: FR-OPD-05-01, FR-OPD-05-02
- API Endpoints implemented: [POST /v1/triage/vitals], [GET /v1/triage/vitals/:id], [GET /v1/triage/vitals/queue-token/:queueTokenId]
- DB Tables affected: vitals, audit_logs
- Screens implemented: SCR-NS-02, SCR-NS-03
- Security controls: Vault Transit FLE (GCM application-layer encryption) for vital signs parameters, input range checks
- Permissions enforced: Patient own read only, Nurse write/read, Doctor read, Admin read.
- Tests written: IT-OPD-02, UAT-NS-01

#### What Was Done
- Coded strict range checks for vitals (BP regex format, heart rate 30-250 bpm, temperature 90.0-110.0°F, weight 1.0-500.0 kg).
- Integrated Vault Transit engine to encrypt vitals fields at the application layer before saving to the DB.
- Implemented role-based read validation, ensuring only authorized roles (Nurse, Doctor, Admin, Patient own) can retrieve decrypted vitals.
- Created controller and router endpoints mapping POST and GET actions, and registered the vitals sub-router at `/v1/triage/vitals` in the main express app.

#### Why These Changes
- Streamlines the nurse triage process, protecting patient health indicators using Vault encryption while auto-populating patient vitals for doctors in the consultation panel.

#### Technical Decisions Made
- Converted vitals parameters (heart rate, temperature, weight) to base64 strings before transit KMS encryption, storing ciphertext in TEXT columns.

#### Files Modified/Created
- `backend/src/modules/patient/vitals.service.ts`
- `backend/src/modules/patient/vitals.controller.ts`
- `backend/src/modules/patient/vitals.router.ts`
- `backend/src/app.ts`
- `backend/tests/vitals.test.ts`

#### Spec Deviations
- None

#### This Task Unblocks
- task-008

---

## [0.7.0] - 2026-06-16
### Task: task-006 — OPD Appointment Scheduling and Queue Management
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 12 hours (estimated: 16 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-OPD-01 — Appointment Scheduling (Reception), F-OPD-02 — Patient Appointment Management (Patient App), F-OPD-03 — Queue Token Generation, F-OPD-04 — Dynamic Live Queue Tracking
- SRS Requirements: FR-OPD-01-01, FR-OPD-02-01, FR-OPD-03-01, FR-OPD-04-01, FR-OPD-04-02
- API Endpoints implemented: [POST /v1/appointments], [GET /v1/appointments], [PUT /v1/appointments/{id}/cancel], [POST /v1/queues/tokens], [GET /v1/queues/tokens/active], [GET /v1/queues/tokens/live], [PUT /v1/queues/tokens/{id}/status]
- DB Tables affected: appointments, queue_tokens, audit_logs
- Screens implemented: SCR-RC-04, SCR-RC-05, SCR-PT-03, SCR-PT-04
- Security controls: Transactional doctor write lock (`SELECT ... FOR UPDATE`), server-side 2-hour cancellation validation, 30s HTTP polling rate constraint
- Permissions enforced: Patient own only for appointments & waitlist, Receptionist write all, Doctor read all.
- Tests written: IT-OPD-01, UAT-PT-03

#### What Was Done
- Coded 15-minute grid validation check on appointment creation.
- Implemented transactional double-booking check utilizing PostgreSQL row-level locks on Doctor (`SELECT ... FOR UPDATE`) to block concurrent scheduling conflicts.
- Programmed server-side validation rejecting patient cancellations/reschedules within 2 hours of the slot start time.
- Developed checked-in patient check-in mechanism that generates sequential queue tokens daily per doctor (starting at `T-101`).
- Built live waitlist estimates calculating patients ahead and wait times dynamically (`Patients Ahead * 15`).
- Programmed Android Jetpack Compose `QueueTrackerScreen.kt` featuring teal glows, state badges, and a 30s coroutine-based HTTP polling system.

#### Why These Changes
- Establishes patient scheduling, receptionist triage check-in token assignment, and live queue status updates to streamline outpatient clinics.

#### Technical Decisions Made
- Chose row-level doctor locking instead of full appointments table locking to maximize database throughput.
- Enforced 30s polling via Kotlin Coroutines to conform with ADR-02 and avoid persistent WebSocket connection overhead.

#### Files Modified/Created
- `backend/src/modules/queue/queue.service.ts`
- `backend/src/modules/queue/queue.controller.ts`
- `backend/src/modules/queue/queue.router.ts`
- `backend/src/app.ts`
- `android/app/src/main/java/com/ship/app/ui/patient/QueueTrackerScreen.kt`
- `backend/tests/queue.test.ts`

#### Spec Deviations
- None

#### This Task Unblocks
- task-007

---

## [0.6.0] - 2026-06-16
### Task: task-005 — Patient Registration and Profile Management
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 9 hours (estimated: 10 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-REG-01 — Patient Registration and UHID Generation, F-REG-02 — Patient Profile Management
- SRS Requirements: FR-REG-01-01, FR-REG-02-01
- API Endpoints implemented: [POST /v1/patients], [GET /v1/patients/{id}], [PUT /v1/patients/{id}], [PUT /v1/patients/{id}/consent]
- DB Tables affected: patients, audit_logs
- Screens implemented: SCR-RC-02, SCR-PT-02
- Security controls: Database transactional row locks, Vault Transit Engine FLE (AES-256-GCM), encrypted pre/post audit logs
- Permissions enforced: Patient read own profile conditional, Receptionist/Admin write, delete forbidden
- Tests written: IT-REG-01, ST-SEC-04, UAT-PT-02

#### What Was Done
- Programmed locked sequential UHID generation (`UHID-YYYY-XXXXXX`) using transaction locks (`LOCK TABLE patients IN SHARE ROW EXCLUSIVE MODE`) to completely prevent duplicate IDs.
- Coded Vault transit-based demographic and medical profile encryption (FLE) for restricted fields before database write operations.
- Developed GET profile, PUT update profile, and PUT consent status API endpoints on the backend with access validation.
- Built patient profile viewer layout in Kotlin Compose `ProfileScreen.kt` featuring read-only sections and checkbox display for the consent flag.
- Integrated update operations with audit logging recording encrypted pre-state and post-state snapshots.

#### Why These Changes
- Establishes receptionist patient registration capability and allows patients to securely manage their digital consent and view their profiles with strict end-to-end data confidentiality.

#### Technical Decisions Made
- Decision 1: Acquired PostgreSQL share row exclusive locks to eliminate race conditions under concurrent client registration.
- Decision 2: Encrypted the pre-state and post-state audit log payload using Vault Transit KMS to prevent data leaks of patient details from logs.

#### Files Modified/Created
- `backend/src/modules/patient/patient.service.ts`
- `backend/src/modules/patient/patient.controller.ts`
- `backend/src/modules/patient/patient.router.ts`
- `backend/src/app.ts`
- `backend/src/modules/user/user.middleware.ts`
- `android/app/src/main/java/com/ship/app/ui/patient/ProfileScreen.kt`
- `backend/tests/patient.test.ts`
- `backend/tests/patient-auth.test.ts`

#### Spec Deviations
- None

#### This Task Unblocks
- task-006

#### Known Issues / Technical Debt
- None


### Planned
- task-006: OPD Appointment Scheduling and Queue Management (Priority: P0)
- task-007: Patient Triage and Vital Signs Recording (Priority: P0)
- task-008: Doctor Dashboard and Consultation Workspace (Priority: P0)
- task-009: Digital Prescription System (Priority: P0)
- task-010: Inpatient (IPD) Admission, Bed, and Discharge Management (Priority: P0)
- task-011: Lab Order and PDF Report Management (Priority: P0)
- task-012: Pharmacy Prescription Fulfillment and Inventory Management (Priority: P0)
- task-013: Invoicing, Billing Engine, and Manual Claims Logging (Priority: P0)
- task-014: Security Auditing and Data Access Audit Trail (Priority: P0)
- task-015: Hospital Configuration and Platform settings (Priority: P0)
- task-016: Executive Operational Analytics Dashboard (Priority: P0)

---

## [0.5.0] - 2026-06-16
### Task: task-004 — Patient Authentication and Firebase Integration
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 7 hours (estimated: 8 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-SEC-01 — Patient Authentication
- SRS Requirements: FR-SEC-01-01, FR-SEC-01-02, FR-SEC-01-03
- API Endpoints implemented: [POST /v1/auth/patients/login]
- DB Tables affected: patients, audit_logs
- Screens implemented: SCR-PT-01
- Security controls: Firebase ID token verification, 1-hour session token JWTs, SMS OTP validation
- Permissions enforced: Patient role access separation, Bearer token guard
- Tests written: IT-SEC-01, IT-SEC-02, UAT-PT-01

#### What Was Done
- Programmed Firebase Admin SDK configuration setup in `firebase.config.ts` with local development fallback parameters.
- Coded token verification service in `patient-auth.service.ts` decrypting phone numbers to lookup/auto-register patients.
- Developed backend sequential UHID generator (`UHID-YYYY-XXXXXX`) and default encrypted profile values insertion for self-registration.
- Programmed 1-hour expiration JWT session token generator and parser.
- Built Jetpack Compose `LoginScreen.kt` for Android mobile clients implementing outer margins, OutlinedTextFields, and error message state UI.
- Implemented `authenticatePatientToken` middleware.
- Enforced role boundaries, immediately rejecting patient tokens on staff portals, returning ACCESS_DENIED and writing security warnings under patient_id in AuditLogs.

#### Why These Changes
- Establishes the secure entry portal and session validation framework for patients to register and access their digital health records.

#### Technical Decisions Made
- Decision 1: Enabled automatic placeholder patient creation upon first Firebase SMS login to simplify user onboarding.
- Decision 2: Implemented a token-based JWT session mechanism for mobile devices to conform with ADR-02.

#### Files Modified/Created
- `android/app/src/main/java/com/ship/app/ui/patient/LoginScreen.kt`
- `backend/src/config/firebase.config.ts`
- `backend/src/modules/user/patient-auth.service.ts`
- `backend/src/modules/user/patient-auth.controller.ts`
- `backend/src/modules/user/patient-auth.router.ts`
- `backend/src/modules/user/user.middleware.ts`
- `backend/src/app.ts`
- `backend/tests/patient-auth.test.ts`
- `backend/tests/rbac.test.ts`

#### Spec Deviations
- None

#### This Task Unblocks
- task-005, task-017

#### Known Issues / Technical Debt
- None

---

## [0.4.0] - 2026-06-16
### Task: task-003 — Staff Authentication and Session Management
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 10 hours (estimated: 12 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-SEC-02 — Doctor & Staff Authentication & RBAC
- SRS Requirements: FR-SEC-02-01, FR-SEC-02-02, FR-SEC-02-03
- API Endpoints implemented: [POST /v1/auth/staff/login], [POST /v1/auth/staff/logout], [GET /v1/auth/staff/session]
- DB Tables affected: users, departments, audit_logs
- Screens implemented: SCR-RC-01, SCR-DR-01, SCR-NS-01, SCR-LS-01, SCR-PH-01, SCR-BO-01, SCR-AD-01
- Security controls: bcrypt hash verification (work factor 10), HTTP-only Secure SameSite=Strict cookies, idle/absolute timeouts, brute-force lockout
- Permissions enforced: Administrator audit-logs check, role restrictions per Permissions_Matrix.md
- Tests written: IT-SEC-02, ST-SEC-02, unit tests

#### What Was Done
- Coded user authentication service using bcrypt comparison (work factor 10) satisfying F-SEC-02 AC #1.
- Implemented secure HTTP-only cookies storing UUID sessionIds satisfying F-SEC-02 AC #2.
- Programmed idle timeout (15 mins) and absolute timeout (12 hours) session validations satisfying F-SEC-02 AC #3.
- Developed RBAC middleware guarding Express routing and immediately revoking session, clearing cookie, and logging security warning to `audit_logs` table upon privilege escalation attempts satisfying F-SEC-02 AC #4.
- Standardized non-hex UUIDs and corrected hash credentials in database seeds.

#### Why These Changes
- Establishes the secure login and session management system for hospital staff roles to safeguard healthcare information.

#### Technical Decisions Made
- Decision 1: Implemented in-memory UserSession cache for rapid verification and immediate revocation on RBAC mismatch.
- Decision 2: Standardized paths to versioned `/v1` prefix to comply with API_Spec.md routing rules.

#### Files Modified/Created
- `backend/src/modules/user/user.controller.ts`
- `backend/src/modules/user/user.middleware.ts`
- `backend/src/modules/user/user.router.ts`
- `backend/src/db/seeds/seed.sql`
- `backend/tests/auth.test.ts`
- `backend/tests/rbac.test.ts`

#### Spec Deviations
- None

#### This Task Unblocks
- task-005, task-010, task-015

#### Known Issues / Technical Debt
- None

---

## [0.3.0] - 2026-06-15
### Task: task-002 — Database Schema Creation, Migrations, and Seeding
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 6 hours (estimated: 6 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-REG-01 (UHID Database persistence foundation)
- SRS Requirements: FR-REG-01-01 (UHID Storage)
- DB Tables affected: departments, users, doctors, patients, appointments, queue_tokens, vitals, consultations, prescriptions, prescription_items, medicines, inventory_logs, rooms, beds, admissions, lab_orders, lab_reports, invoices, payments, insurance_claims, symptom_chats, scribe_sessions, audit_logs, platform_configurations
- Screens implemented: None
- Security controls: Database volume encryption verification (AES-256), FLE type structures
- Permissions enforced: PostgreSQL table constraints
- Tests written: IT-DB-01

#### What Was Done
- Coded SQL DDL schema migration script `20260615000000_create_tables.sql` generating all 24 tables, matching relations, custom triggers, and default indices.
- Coded SQL seeds script `seed.sql` populating Cardiology, Pediatrics, General Medicine, Radiology, Pathology, and Pharmacy departments, standard drugs formulary, global config constants, and default pre-hashed Super Admin account.
- Programmed Jest database integrity test suite (`db-integrity.test.ts`) validating check constraints and unique index blocks.

#### Why These Changes
- Establishing a verified physical database schema prevents schema drift, validates business check limits at the engine layer, and provides the foundation for patient profiling, OPD, IPD, and billing modules.

#### Technical Decisions Made
- Decision 1: Coded vitals fields (`heart_rate`, `temperature`, `weight`, `blood_pressure`) as TEXT in the migration scripts because their application values undergo Field-Level Encryption, storing ciphertext base64 strings rather than raw numbers.
- Decision 2: Resolved a gap in the spec by creating schemas for omitted tables `rooms`, `beds`, and `admissions` since they are required for IPD features in the PRD.

#### Files Modified/Created
- `backend/src/db/migrations/20260615000000_create_tables.sql`: Created DDL script
- `backend/src/db/migrations/20260615000000_create_tables.down.sql`: Created rollback script
- `backend/src/db/seeds/seed.sql`: Created seeds script
- `backend/tests/db-integrity.test.ts`: Created integration test suite

#### Spec Deviations
- Deviated from `Database_Schema.md` table definitions section to add IPD schemas (`rooms`, `beds`, and `admissions`) that were omitted.
- Deviated from `Database_Schema.md` column types for encrypted vitals fields (configured as `TEXT` instead of `INT` or `DECIMAL` to store ciphertext strings).

#### This Task Unblocks
- task-003, task-004

#### Known Issues / Technical Debt
- None

---

## [0.2.0] - 2026-06-15
### Task: task-001 — Infrastructure and Environment Setup
**Status:** ✅ Completed
**Priority:** P0
**Time Spent:** 8 hours (estimated: 8 hours)

#### Spec Requirements Satisfied
- PRD Feature: F-SEC-02 (Staff Authentication and RBAC foundations)
- SRS Requirements: NFR-SEC-01 (Transport Encryption), NFR-SEC-02 (Data at Rest Encryption)
- DB Tables affected: None
- Screens implemented: None
- Security controls: TLS 1.3 minimum handshake enforcement (ST-SEC-01), volume encryption planning
- Permissions enforced: N/A
- Tests written: ST-SEC-01

#### What Was Done
- Configured core Docker Compose services (PostgreSQL database, MinIO object store, and HashiCorp Vault dev server) to form the base SHIP workspace infrastructure (satisfying Technical_Requirements.md Section 1).
- Enforced TLS 1.3 protocol standards on NGINX default server to reject older secure protocol versions (satisfying NFR-SEC-01).
- Programmed Vault integration client (`vault.ts`) exposing Transit encryption/decryption keys (satisfying NFR-SEC-02).
- Programmed PostgreSQL connection pool (`database.ts`) with TLS/SSL verification parameters (satisfying NFR-SEC-02).
- Drafted `.env.example` configurations template mapping all variables.

#### Why These Changes
- Establishing a verified local container orchestration layer provides a consistent runtime environment for developers. Enforcing TLS 1.3 at the gateway prevents cleartext sniffing (T-AUTH-02) and encryption modules prevent offline data exposure.

#### Technical Decisions Made
- Decision 1: Implemented Vault in dev mode to automatically seed root tokens for local development speed, matching Architecture.md ADR-01.
- Decision 2: Disabled TLS 1.2 on NGINX to comply with strict transport security mandates in Security_Requirements.md Section 4.

#### Files Modified/Created
- `backend/docker-compose.yml`: Created service configurations
- `backend/nginx.conf`: Created reverse proxy rules
- `backend/src/config/vault.ts`: Created Vault integration client
- `backend/src/config/database.ts`: Created PostgreSQL connection pool
- `backend/.env.example`: Created env configuration template

#### Spec Deviations
- None

#### This Task Unblocks
- task-002, task-003, task-004

#### Known Issues / Technical Debt
- None

---

## [0.1.0] - 2026-06-15
### Project Initialized

**Action:** Task structure created from 13 spec documents
**By:** AI Assistant

#### Documents Read
- /documents/Blueprint.md ✓
- /documents/PRD.md ✓
- /documents/Technical_Requirements.md ✓
- /documents/Security_Requirements.md ✓
- /documents/Permissions_Matrix.md ✓
- /documents/SRS.md ✓
- /documents/Architecture.md ✓
- /documents/Database_Schema.md ✓
- /documents/API_Spec.md ✓
- /documents/Screens.md ✓
- /documents/Routes.md ✓
- /documents/Design.md ✓
- /documents/Testing_Strategy.md ✓

#### Task Breakdown Summary
- P0 (Critical) tasks: 16
- P1 (High) tasks: 4
- P2 (Medium) tasks: 0
- P3 (Low) tasks: 0
- Total estimated hours: 204

#### Files Created
- `tasks/tasks.json` — Master task registry
- `tasks/task-001.md` through `tasks/task-020.md` — Individual task specs
- `CHANGELOG.md` — This file

#### Next Steps
Start with task-001: Infrastructure and Environment Setup (Priority: P0)
