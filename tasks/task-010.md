# Task 010: Inpatient (IPD) Admission, Bed, and Discharge Management
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 14 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Inpatient Department (IPD) management workflow. It covers the creation of patient admission records, room assignment, and real-time bed allocation. It includes building a real-time bed occupancy dashboard color-coded by availability status (green for available, red for occupied, yellow for maintenance) across wards (ICU, General Wards, Private Rooms).

Finally, this task implements patient discharge tracking. When a patient is discharged, the system releases the assigned bed, triggers a status change to "Cleaning/Maintenance", and calculates the bed occupancy charges to generate a pending billing invoice automatically.

## Document References

### PRD
- **Feature ID:** F-IPD-01 (Inpatient Admission), F-IPD-02 (Bed Inventory), F-IPD-03 (Patient Discharge)
- **User Story:**
  * As a Nurse, I want to create admission records, assign rooms, and allocate beds to patients.
  * As a Nurse, I want to track availability of beds in ICU, Wards, and Rooms so that I know what is free.
  * As a Nurse, I want to update patient discharge status, generate summaries, and trigger billing closure.
- **Acceptance Criteria:**
  1. Admission screen allows selecting patient via UHID search and entering Admission Date/Time.
  2. Admission shows list of available beds filtered by ward type (ICU, General Ward, Private Room).
  3. Allocating bed updates status to "Occupied" and creates record in `Admissions` table.
  4. Bed dashboard displays real-time layout grouped by Ward Type.
  5. Color-coding: green for Available, red for Occupied, yellow for Cleaning/Maintenance.
  6. Clicking bed slot displays occupier's name, UHID, and admission date if occupied.
  7. Discharge screen displays inpatient summary, room charges, and length of stay.
  8. Saving sets status to "Discharged", bed availability to "Cleaning/Maintenance", and creates a pending billing invoice containing bed charges.
  9. Attending saves a "Discharge Summary" text field before finalizing.

### SRS
- **Requirement IDs:** FR-IPD-01-01 (Admission Record), FR-IPD-02-01 (Real-time Color Code), FR-IPD-03-01 (Release Bed), FR-IPD-03-02 (Billing Trigger)
- **SHALL statements:**
  * The system SHALL update bed occupancy status immediately.
  * The system SHALL calculate bed charges upon discharge.

### Architecture
- **Component(s):** IPD Service, Web Portal (Nurse console)
- **Data Flow:** Nurse allocates bed -> IPD Service -> write Postgres DB -> update bed status. Nurse discharge -> release bed -> notify Billing Service to compile room invoice.

### Database
- **Tables:** `admissions`, `rooms`, `beds`, `invoices`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/beds` (list beds by ward)
  * `POST /api/admissions` (admit patient)
  * `GET /api/admissions/{id}` (fetch admission details)
  * `PUT /api/admissions/{id}/discharge` (finalize discharge, calculate stay costs)
- **Auth/Role guard:** Nurse, Doctor, Billing Officer (Read), Administrator (Read).

### Security
- **Threats addressed:**
  * T-IPD-01 (Race condition booking the same bed - database transaction locking required)
  * T-IPD-02 (Tampering with admission dates - restricted to authorized nurse/doctor logins)
- **Data classifications:** `RESTRICTED` Admission details, clinical discharge summary.

### Design
- **Screen(s):** SCR-NS-04 (IPD Admissions Console), SCR-NS-05 (Real-time Bed Layout), SCR-NS-06 (Discharge Workspace)
- **Components used:** Ward grid layout, Color-coded status badges, Summary detail cards
- **Design tokens:** Success Color (Green), Error Color (Red), Warning Color (Yellow)

### Testing
- **Unit tests:** Length of stay charge calculation unit tests
- **Integration tests:** IT-IPD-01 (Concurrent bed booking collision test)
- **Security tests:** None
- **UAT scenarios:** UAT-NS-02 (Nurse admits patient, monitors bed, and discharges patient)

## Acceptance Criteria
- [ ] Concurrency locks prevent double allocation of the same bed.
- [ ] Bed dashboard displays real-time occupancy status color-coded by category.
- [ ] Bed details view shows active occupier name and UHID for occupied slots.
- [ ] Finalizing a discharge releases the bed and transitions status to `Cleaning/Maintenance`.
- [ ] Discharge creates a pending billing record containing calculated room charges (`Length of Stay * Room Rate`).

## Dependencies
- task-003: Staff Authentication and Session Management (requires Nurse RBAC validation)

## Implementation Approach
### Step-by-step Plan:
1. Write `ipd.service.ts` implementing `admitPatient()` using transactions to update the `beds` table and insert `admissions`.
2. Implement the bed stay cost calculation logic (`dischargePatient()`) based on date differences.
3. Build the real-time bed layouts and admissions console in the Web Portal using Vanilla JS.
4. Integrate billing triggers in the discharge flow to automatically construct invoice line items.

### Technical Considerations:
- Set up automated SQL triggers or scheduled cleanups to transition beds from "Cleaning/Maintenance" to "Available" after a set duration.

### Architecture/Design Notes:
- Follows inpatient configurations outlined in Architecture.md Section 1.

## Files to Modify/Create
- `backend/src/modules/ipd/ipd.controller.ts` — Create IPD route paths
- `backend/src/modules/ipd/ipd.service.ts` — Implement admissions, transfers, and cost calculation
- `backend/src/modules/ipd/ipd.router.ts` — Define IPD endpoints
