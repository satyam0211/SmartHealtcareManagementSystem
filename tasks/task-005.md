# Task 005: Patient Registration and Profile Management
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 10 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Patient Registration and Profile Management modules. On the backend, it implements a sequential UHID generator (with format `UHID-YYYY-XXXXXX`) that executes inside a database transaction to prevent concurrency conflicts. It enforces field validations for name, DOB, gender, and address, and logs the patient's global opt-in/opt-out consent flag.

For the frontend, it includes building the receptionist registration form in the Web Portal and the profile management view in the Patient Android App. Crucially, the profile service layer must encrypt all restricted fields (Name, Address, DOB, Allergies, Chronic Conditions) before database insertion using Vault KMS keys.

## Document References

### PRD
- **Feature ID:** F-REG-01 (Patient Registration and UHID Generation), F-REG-02 (Patient Profile Management)
- **User Story:**
  * As a Receptionist, I want to register a new patient and generate a unique hospital identifier (UHID) so that they have a unified profile.
  * As a Receptionist, I want to input and update a patient's personal, medical, and emergency contact details so that clinicians have access to profiles.
- **Acceptance Criteria:**
  1. The system must generate a unique, non-modifiable identifier matching the format `UHID-YYYY-XXXXXX` (where YYYY is current calendar year and XXXXXX is sequential 6-digits starting at 000001).
  2. Registration must block submission and display error messages if Name, DOB, Gender, or Address are empty.
  3. Displays "Registration Successful" modal containing the generated UHID.
  4. Display three sections: Personal, Medical, and Emergency.
  5. Gender restricted to Male, Female, Other.
  6. Emergency Phone Number must validate that the input contains exactly 10 digits.
  7. Finalized clinical records cannot be deleted.

### SRS
- **Requirement IDs:** FR-REG-01-01 (UHID Generation), FR-REG-02-01 (Validation), FR-REG-02-02 (Gender Predefs)
- **SHALL statements:**
  * The system SHALL generate UHID-YYYY-XXXXXX.
  * The system SHALL reject empty fields.

### Architecture
- **Component(s):** Patient Service, Web Portal, Patient App
- **Data Flow:** Receptionist submits form -> Patient Service generates UHID -> encrypts PII via KMS -> saves in PostgreSQL.

### Database
- **Tables:** `patients`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/patients` (create patient)
  * `GET /api/patients/{uhid}` (retrieve profile)
  * `PUT /api/patients/{uhid}` (update profile)
  * `GET /api/patients/{uhid}/consent` (retrieve consent status)
- **Auth/Role guard:** Receptionist, Administrator, Doctor, Nurse (Read only). Patient (Own profile only).

### Security
- **Threats addressed:**
  * T-REG-01 (Data leaks of PII - mitigated by KMS encryption)
  * T-REG-02 (Unauthorized modification - mitigated by role-based update validation)
- **Data classifications:** `RESTRICTED` Patient Name, DOB, Address, Phone, Allergies, Chronic Conditions.

### Design
- **Screen(s):** SCR-RC-02 (Patient Registration), SCR-RC-03 (Patient Search), SCR-PT-02 (Patient Profile)
- **Components used:** Form Layouts, TextFields, Modals
- **Design tokens:** Surface-variant Color, Typography Header-2

### Testing
- **Unit tests:** UHID generator concurrency test suite
- **Integration tests:** IT-REG-01 (Duplicate registration validation test)
- **Security tests:** ST-SEC-04 (Cryptographic shredding verify check)
- **UAT scenarios:** UAT-PT-02 (Patient views profile on app)

## Acceptance Criteria
- [ ] UHID generation prevents duplicate sequential numbers under concurrent threads.
- [ ] Registration rejects forms lacking Name, DOB, Gender, or Address.
- [ ] Emergency contact numbers enforce exactly 10 digits validation.
- [ ] Patient PII/PHI fields (Name, DOB, Address, Allergies, Chronic Conditions) are stored encrypted in the database using AES-256-GCM.
- [ ] Patient profile screen displays the read-only global consent log status.
- [ ] System blocks any patient attempt to delete or edit their profile records once finalized.

## Dependencies
- task-003: Staff Authentication and Session Management (requires RBAC route validation)
- task-004: Patient Authentication and Firebase Integration

## Implementation Approach
### Step-by-step Plan:
1. Write `patient.service.ts` implementing `generateUhid()` inside a transaction with a database row lock.
2. Integrate Vault encryption calls in `patient.service.ts` to encrypt PII before writes and decrypt on reads.
3. Build the Receptionist Web Portal registration layout using Vanilla JS.
4. Implement the Patient App profile settings view using Jetpack Compose.
5. Setup DB auditing hooks to record registration actions in the `audit_logs` table.

### Technical Considerations:
- Ensure the database migration script index `idx_patients_uhid` is used during profiles retrieval.
- Handle cryptographic shredding: if a patient requests deletion and regulations permit, delete the key from Vault.

### Architecture/Design Notes:
- Follows ADR-03 (Field-Level Encryption for Patient PII and PHI records).

## Files to Modify/Create
- `backend/src/modules/patient/patient.controller.ts` — Create patient endpoints
- `backend/src/modules/patient/patient.service.ts` — Implement UHID and encryption
- `android/app/src/main/java/com/ship/app/ui/patient/ProfileScreen.kt` — Build Profile UI
