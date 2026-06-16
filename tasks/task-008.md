# Task 008: Doctor Dashboard and Consultation Workspace
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 14 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Doctor's active workflow interface. It covers the Doctor Dashboard, which displays a chronological roster of checked-in patient tokens, pending lab reports, and scheduled follow-up requests.

It also implements the Consultation Workspace. When the doctor opens a checked-in token, the workspace decodes the patient's historical medical records (if consent is active) and displays clinical notes, triage vitals, and diagnoses in reverse chronological order. Saving the consultation updates the database and marks the queue token status as "Completed".

## Document References

### PRD
- **Feature ID:** F-DOC-01 (Doctor Dashboard), F-DOC-02 (Consultation Workspace), F-DOC-04 (Treatment Progress Tracking)
- **User Story:**
  * As a Doctor, I want to view my schedule for the day, follow-ups, and pending reports so that I can plan my consultations.
  * As a Doctor, I want to consult a patient, review history, write notes, and diagnose.
  * As a Doctor, I want to record basic text progress notes and select patient recovery status from a dropdown.
- **Acceptance Criteria:**
  1. Dashboard displays Checked-In tokens showing Name, UHID, Token Number, and Status.
  2. Distinct section for "Pending Lab Reports" containing links to uploaded PDF reports.
  3. Dashboard shows "Follow-up Requests" section.
  4. Workspace opens from dashboard when token selected.
  5. Workspace displays complete historical consultations and lab reports in reverse chronological order.
  6. Workspace provides text areas for "Clinical Notes" and "Diagnosis" supporting rich text.
  7. Saving updates consultations table and sets token status to "Completed".
  8. Progress entry interface contains progress note and status dropdown (Active, Recovered, Referred).

### SRS
- **Requirement IDs:** FR-DOC-01-01 (Token Roster), FR-DOC-02-01 (History Timeline), FR-DOC-02-02 (Consent Check), FR-DOC-04-01 (Recovery Dropdown)
- **SHALL statements:**
  * The system SHALL check for active patient consent or active check-in token before revealing historical files to the doctor.
  * The system SHALL mark the queue token status as Completed upon consultation save.

### Architecture
- **Component(s):** User Service (Doctor sub-controller), Doctor Android App
- **Data Flow:** Doctor selects token -> check consent -> query timeline from `consultations` -> decrypt -> populate app UI. Save consult -> PUT `/api/consultations` -> write encrypted notes.

### Database
- **Tables:** `consultations`, `queue_tokens`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/consultations/active` (list checked-in tokens)
  * `GET /api/consultations/history/{patientId}` (fetch clinical history)
  * `POST /api/consultations` (save consult entry)
  * `PUT /api/consultations/{id}/progress` (update progress/status)
- **Auth/Role guard:** Doctor, Administrator (read-only audit).

### Security
- **Threats addressed:**
  * T-DOC-01 (Unauthorized viewing of patient history - mitigated by active consent verification check)
  * T-DOC-02 (Tampering with clinical records - database write block on finalized logs)
- **Data classifications:** `RESTRICTED` Clinical notes, diagnosis text.

### Design
- **Screen(s):** SCR-DR-02 (Doctor Dashboard), SCR-DR-03 (Consultation Workspace), SCR-DR-05 (Patient History Timeline)
- **Components used:** Navigation Tabs, Roster Cards, Rich Text Editors
- **Design tokens:** Primary Color, Typography Body-1

### Testing
- **Unit tests:** Patient consent verification logic tests
- **Integration tests:** IT-DOC-01 (Triage vitals population test in consultation workflow)
- **Security tests:** None
- **UAT scenarios:** UAT-DR-01 (Doctor completes patient OPD consultation)

## Acceptance Criteria
- [ ] Doctor Dashboard lists checked-in tokens showing Name, UHID, and Status in real-time.
- [ ] Workspace queries the database to verify active patient `consent_flag` or active check-in `QueueToken` today before showing historical records.
- [ ] Saving the consultation writes encrypted clinical notes and diagnoses to the database.
- [ ] Saving the consultation sets the corresponding queue token status to `Completed`.
- [ ] Dashboard displays pending lab reports for the doctor's active patient list.

## Dependencies
- task-007: Patient Triage and Vital Signs Recording (requires triage vital records structure)

## Implementation Approach
### Step-by-step Plan:
1. Implement consent checking utility verifying the `patients.consent_flag` or active `QueueToken` today.
2. Build consultation API endpoints (`GET /api/consultations/active`, `POST /api/consultations`) enforcing consent rules.
3. Integrate Vault KMS decryption on historical consultation retrieval and encryption on save.
4. Implement the Doctor Dashboard view in the Doctor App using Jetpack Compose.
5. Create the Consultation Workspace screen with Compose, including progress notes and recovery status selectors.

### Technical Considerations:
- Rich text formatted clinical notes must be serialized and stored securely as string payloads.
- Enforce check checks: prevent saving consultations for already completed tokens.

### Architecture/Design Notes:
- Governed by ADR-05 (Attending clinician access controls and audit enforcement).

## Files to Modify/Create
- `backend/src/modules/user/doctor.controller.ts` — Create doctor workspace endpoints
- `backend/src/modules/user/doctor.service.ts` — Implement consent checks and consultations save
- `android/app/src/main/java/com/ship/app/ui/doctor/ConsultationScreen.kt` — Build Consultation UI
- `android/app/src/main/java/com/ship/app/ui/doctor/DashboardScreen.kt` — Build Doctor Dashboard UI
