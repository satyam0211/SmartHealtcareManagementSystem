# Task 009: Digital Prescription System
**Status:** pending
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Digital Prescription System. When completing a consultation, the doctor can prescribe medications using an interactive search interface that queries the standard drug formulary database (the `medicines` table).

For each added medicine, the interface enforces structured entries for dosage (e.g., quantity/unit), duration (e.g., number of days), and ingestion instructions. Prescriptions are written to the database, linked to the active consultation, and made immediately visible in the pharmacist portal.

## Document References

### PRD
- **Feature ID:** F-DOC-03 (Digital Prescription System)
- **User Story:** As a Doctor, I want to search a standard drug formulary and generate a digital prescription with structured dosage, duration, and instructions so that the pharmacist can fulfill it.
- **Acceptance Criteria:**
  1. The prescription interface must provide a search box that queries the `Medicines` table.
  2. For each added medicine, enforce structured input fields: Dosage, Duration, and Instructions.
  3. Saving writes to `Prescriptions` table, links it to active `Consultation`, and makes it visible to the Pharmacist.

### SRS
- **Requirement IDs:** FR-DOC-03-01 (Formulary Query), FR-DOC-03-02 (Structured Fields), FR-DOC-03-03 (Retention Rule)
- **SHALL statements:**
  * The system SHALL query the standard medicines table.
  * The system SHALL enforce structured dosage input fields.

### Architecture
- **Component(s):** Doctor Service (Prescriptions sub-controller), Doctor Android App, Patient Android App
- **Data Flow:** Doctor searches medicines -> adds item with dosage -> submits prescription -> API Gateway -> writes to `prescriptions` and `prescription_items` tables -> notifies Pharmacist.

### Database
- **Tables:** `prescriptions`, `prescription_items`, `medicines`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/medicines` (search formulary)
  * `POST /api/prescriptions` (create prescription)
  * `GET /api/prescriptions/{id}` (fetch prescription details)
- **Auth/Role guard:** Doctor (Write), Pharmacist (Read), Patient (Own Read), Nurse (Read).

### Security
- **Threats addressed:**
  * T-DOC-03 (Unauthorized alteration of prescriptions - database checks prohibit patient updates)
- **Data classifications:** `RESTRICTED` Prescribed drugs, dosage instructions.

### Design
- **Screen(s):** SCR-DR-04 (Digital Prescription Form), SCR-PT-06 (Patient Prescription View)
- **Components used:** Search Bar, Medicine List Cards, Ingestion Option Badges
- **Design tokens:** Primary-variant Color, Typography Body-1

### Testing
- **Unit tests:** Prescription inputs structured data validation tests
- **Integration tests:** IT-DOC-02 (Standard drug search and write test)
- **Security tests:** None
- **UAT scenarios:** UAT-DR-02 (Doctor writes digital prescription)

## Acceptance Criteria
- [ ] Prescription search box filters the database `medicines` table in real-time.
- [ ] System blocks prescription submission if dosage, duration, or instructions fields are empty.
- [ ] Finalized prescriptions are saved linked to the consultation ID.
- [ ] Prescriptions database records are marked immutable; any update/delete requests from the Patient App return an error.
- [ ] Pharmacist and Patient App can query the prescription details immediately after save.

## Dependencies
- task-008: Doctor Dashboard and Consultation Workspace (prescriptions must link to active consultation)

## Implementation Approach
### Step-by-step Plan:
1. Write `prescription.controller.ts` exposing endpoints to search medicines and create prescriptions.
2. Implement validation rules checking that each prescription item has a valid FK linking to `medicines` and complete structured strings.
3. Build the prescription constructor UI in the Doctor Android App using Compose.
4. Build the patient prescription list viewer screen in the Patient App.
5. Create default triggers blocking updates or deletions on the `prescriptions` table.

### Technical Considerations:
- Ensure the standard drug search API (`GET /api/medicines`) has database index bindings to keep latency below 100ms.

### Architecture/Design Notes:
- Aligns with standard formulary rules defined in Blueprint Section 18.

## Files to Modify/Create
- `backend/src/modules/pharmacy/prescription.controller.ts` — Create prescription routing
- `backend/src/modules/pharmacy/prescription.service.ts` — Implement prescription insertion and formulary queries
- `android/app/src/main/java/com/ship/app/ui/doctor/PrescriptionScreen.kt` — Build Doctor prescription creation UI
- `android/app/src/main/java/com/ship/app/ui/patient/PrescriptionViewScreen.kt` — Build Patient prescription viewer UI
