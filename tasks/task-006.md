# Task 006: OPD Appointment Scheduling and Queue Management
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 16 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the core outpatient department (OPD) management workflows. It covers appointment scheduling on a 15-minute grid, double-booking prevention at the service layer, receptionist-side token generation when patients check in, and waitlist promotion.

For patients, this task builds the booking interface in the Patient App and the live queue tracking screen. Live queue updates must poll the API gateway every 30 seconds using standard HTTP polling (WebSockets are strictly forbidden to minimize server thread overhead). The estimated wait time is calculated dynamically as `(Patients Ahead) * 15 minutes`.

## Document References

### PRD
- **Feature ID:** F-OPD-01 (Appointment Scheduling), F-OPD-02 (Patient Booking), F-OPD-03 (Token Generation), F-OPD-04 (Live Queue Tracking)
- **User Story:**
  * As a Receptionist, I want to book/cancel appointments so that OPD schedules are organized.
  * As a Patient, I want to book, reschedule, or cancel my appointments.
  * As a Receptionist, I want to generate a queue token for patients arriving.
  * As a Patient, I want to view my live queue status and estimated wait time.
- **Acceptance Criteria:**
  1. Scheduler displays available slots based on a 15-minute grid.
  2. Prevent double-booking (reject duplicate writes).
  3. Releasing slots immediately upon cancellation.
  4. Display waitlisted list and allow promotion.
  5. Patient App shows doctor availability and bookings.
  6. Patients can cancel/reschedule up to 2 hours before the slot.
  7. Sequential token generation (e.g. T-101) linked to appointment.
  8. Token status: Waiting, In-Consultation, Completed, Cancelled.
  9. Patient App fetches status using HTTP polling at exactly 30 seconds.
  10. Wait time formula: `(Patients Ahead) * 15 minutes`.

### SRS
- **Requirement IDs:** FR-OPD-01-01 (Slot Grid), FR-OPD-02-01 (Reschedule Rule), FR-OPD-04-01 (Polling Rule)
- **SHALL statements:**
  * The system SHALL calculate wait times dynamically.
  * The system SHALL poll every 30 seconds.
  * The system SHALL enforce the 2-hour cancellation rule.

### Architecture
- **Component(s):** Queue & Appointment Service, Patient App, Web Portal
- **Data Flow:** App bookings -> Queue Service -> verify availability -> DB. Polling client -> GET `/api/queues/tokens/live` -> return current token indexes.

### Database
- **Tables:** `appointments`, `queue_tokens`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/appointments` (list slots)
  * `POST /api/appointments` (book slot)
  * `PUT /api/appointments/{id}/cancel` (cancel/reschedule)
  * `POST /api/queues/tokens` (check-in/generate token)
  * `GET /api/queues/tokens/live` (live queue tracking)
- **Auth/Role guard:** Patient (own bookings), Receptionist (write all), Doctor/Nurse (read all).

### Security
- **Threats addressed:**
  * T-OPD-01 (Bypassing cancellation restrictions - mitigated by server-side timestamp verification)
  * T-OPD-02 (Queue starvation or resource exhaustion - rate limit queue polling endpoints)
- **Data classifications:** `CONFIDENTIAL` Appointment dates, doctor assignments, token status.

### Design
- **Screen(s):** SCR-RC-04 (OPD Scheduler), SCR-RC-05 (Waitlist Console), SCR-PT-03 (Book Appointment), SCR-PT-04 (Queue Status)
- **Components used:** Calendar Grid, Token Badges, Live Status Indicator
- **Design tokens:** Secondary-variant Color, Typography Body-2

### Testing
- **Unit tests:** Appointment double-booking transaction validation tests
- **Integration tests:** IT-OPD-01 (Concurrent slot booking race test)
- **Security tests:** None
- **UAT scenarios:** UAT-PT-03 (Patient schedules appointment and tracks queue)

## Acceptance Criteria
- [ ] Concurrency transaction locks prevent two clients from booking the same 15-minute slot.
- [ ] Patient App cancels/reschedules are blocked and return an error if within 2 hours of the slot.
- [ ] Checking in a patient creates a sequential token and appends it to the doctor's queue.
- [ ] Patient App fetches queue data every 30 seconds via HTTP polling; WebSocket connection code is absent.
- [ ] Live queue screen renders the correct estimated waiting time based on `(Patients Ahead) * 15`.

## Dependencies
- task-005: Patient Registration and Profile Management (requires registered patient UHID)

## Implementation Approach
### Step-by-step Plan:
1. Write `queue.service.ts` implementing slot availability checks using PostgreSQL transactional write locks (`SELECT ... FOR UPDATE`).
2. Write appointment cancellation checks comparing the current time with the slot start timestamp.
3. Build the Receptionist scheduling dashboard in the Web Portal using Vanilla JS.
4. Implement the Patient App scheduling and dynamic tracking views in Compose.
5. Setup the 30-second polling timer in the Patient App utilizing Kotlin Coroutines.

### Technical Considerations:
- Ensure database indexes `idx_appointments_doctor_date` are optimized to prevent slow grid queries.
- Clean up inactive tokens on daily reset.

### Architecture/Design Notes:
- Governed by ADR-04 (Outpatient Queue polling mechanism and concurrency handling).

## Files to Modify/Create
- `backend/src/modules/queue/queue.controller.ts` — Create scheduling routes
- `backend/src/modules/queue/queue.service.ts` — Implement booking locking and token sequences
- `android/app/src/main/java/com/ship/app/ui/patient/QueueTrackerScreen.kt` — Build live queue UI
