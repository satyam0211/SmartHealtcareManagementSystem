# Task 007: Patient Triage and Vital Signs Recording
**Status:** pending
**Priority:** P0
**Complexity:** low
**Estimated Time:** 6 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Nurse Triage workspace. When a patient arrives and check-in generates a token, the nurse takes the patient's vitals (blood pressure, heart rate, temperature, weight) and records them.

The collected vital signs populate the database and are linked to the queue token. This ensures that when the doctor subsequently pulls up the patient's consultation workspace, the vital metrics are instantly visible in the clinical panel. Crucially, the values must undergo application-layer encryption because they are classified as restricted health data.

## Document References

### PRD
- **Feature ID:** F-OPD-05 (Patient Vital Signs Recording)
- **User Story:** As a Nurse, I want to record vital signs during patient triage so that the consulting doctor has immediate access to current patient vitals.
- **Acceptance Criteria:**
  1. Triage screen allows inputting Blood Pressure, Heart Rate, Temperature, and Weight.
  2. Vitals signs are saved linked to the active `QueueToken` or `Appointment` ID.
  3. Saved vitals immediately display in the Doctor's Consultation Workspace when the doctor opens the consultation.

### SRS
- **Requirement IDs:** FR-OPD-05-01 (Vitals Fields), FR-OPD-05-02 (Vitals Auto-Populate)
- **SHALL statements:**
  * The system SHALL store blood pressure, heart rate, temperature, and weight.
  * The system SHALL display vitals in the doctor workspace.

### Architecture
- **Component(s):** Patient Service (Vitals sub-controller), Web Portal (Nurse console)
- **Data Flow:** Nurse submits vitals -> API Gateway -> Patient Service -> encrypts values via KMS -> writes to `vitals` table.

### Database
- **Tables:** `vitals`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/triage/vitals` (save vital metrics)
  * `GET /api/triage/vitals/{id}` (fetch vitals by ID)
- **Auth/Role guard:** Nurse (Write), Doctor (Read), Administrator (Read), Patient (Own only).

### Security
- **Threats addressed:**
  * T-OPD-03 (Intercepting or tampering with vitals data - mitigated by field-level encryption)
- **Data classifications:** `RESTRICTED` Vital signs values (BP, Heart Rate, Temp, Weight).

### Design
- **Screen(s):** SCR-NS-02 (Nurse Vitals Dashboard), SCR-NS-03 (Vitals Input Form)
- **Components used:** Form Layouts, Numerical Fields
- **Design tokens:** Surface Color, Typography Body-1

### Testing
- **Unit tests:** Range validation tests for vital metrics
- **Integration tests:** IT-OPD-02 (Vitals auto-population test)
- **Security tests:** None
- **UAT scenarios:** UAT-NS-01 (Nurse inputs patient vitals)

## Acceptance Criteria
- [ ] Vitals form enforces range checks (Heart Rate: 30 to 250, Temperature: 90.0 to 110.0, Weight: 1 to 500).
- [ ] Submitted vitals are written to the `vitals` table linked to the active `QueueToken` / `Appointment`.
- [ ] Vitals values are encrypted at the field level before database insertion.
- [ ] Vitals data is readable by authorized nurses and doctors, but returns an error for other staff roles.

## Dependencies
- task-006: OPD Appointment Scheduling and Queue Management (vitals must link to active queue token)

## Implementation Approach
### Step-by-step Plan:
1. Write validation rules for vitals numbers (reject negative numbers or out-of-bounds metrics).
2. Integrate Vault KMS encryption in the vitals service write logic.
3. Build the nurse triage form in the Web Portal using Vanilla JS.
4. Implement the vitals viewer block in the doctor consultation workspace.

### Technical Considerations:
- Ensure blood pressure is saved as distinct systolic and diastolic integers.

### Architecture/Design Notes:
- Follows encryption constraints outlined in Security_Requirements.md Section 4.

## Files to Modify/Create
- `backend/src/modules/patient/vitals.controller.ts` — Create vitals endpoint
- `backend/src/modules/patient/vitals.service.ts` — Implement vitals encryption & validation
- `backend/src/modules/patient/vitals.router.ts` — Define triage routes
