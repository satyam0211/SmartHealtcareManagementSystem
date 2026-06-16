# Changelog
All notable changes to this project will be documented in this file.

## How to Read This Changelog
- Each entry represents a completed task or significant change
- Entries include: what changed, why, which files, which spec documents satisfied
- Most recent changes are at the top

---

## [Unreleased]
### In Progress
- task-003: Staff Authentication and Session Management

### Started: task-003 — Staff Authentication and Session Management
**Started:** 2026-06-15 19:40
**Priority:** P0
**Document Refs:** PRD: F-SEC-02 | SRS: FR-SEC-02-01 | API: [POST /v1/auth/staff/login, POST /v1/auth/staff/logout] | Screens: [SCR-RC-01, SCR-DR-01, SCR-NS-01, SCR-LS-01, SCR-PH-01, SCR-BO-01, SCR-AD-01]
Beginning work on staff email/password authentication, secure HttpOnly session cookies, idle timeout, and server-side RBAC guards.
Plan: Code password verification, session cookie manager, RBAC middleware check, and auth controllers.

### Planned
- task-003: Staff Authentication and Session Management (Priority: P0)
- task-004: Patient Authentication and Firebase Integration (Priority: P0)
- task-005: Patient Registration and Profile Management (Priority: P0)
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
