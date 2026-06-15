# Testing Strategy Document
## Smart Healthcare Intelligence Platform v1.0

Traceability pre-check complete: No testing gaps found. Every P0/P1 feature has a corresponding unit, integration, and UAT test plan. Every endpoint in `API_Spec.md` has an integration test case. Every CRITICAL/HIGH threat in `Security_Requirements.md` has a security test case.

---

## Part 1 — Unit Tests

### 1. Unique Hospital Identifier (UHID) Generator
*   **Module:** `PatientModule`
*   **Business Rule:** UHID MUST follow the sequential format `UHID-YYYY-XXXXXX` (where YYYY is current year and XXXXXX is sequential 6-digit number).
*   **Test Cases:**
    *   *Happy Path:* Inputs current year `2026` and counter `1` $\rightarrow$ Outputs `"UHID-2026-000001"`.
    *   *Boundary:* Inputs current year `2026` and max counter `999999` $\rightarrow$ Outputs `"UHID-2026-999999"`.
    *   *Invalid:* Input counter `-1` $\rightarrow$ Throws `InvalidArgumentException`. Input counter `1000000` $\rightarrow$ Throws `OutOfRangeCounterException`.
    *   *Business-Rule Edge Case:* Clock changes to new year `2027` mid-run $\rightarrow$ Resets counter back to `1`, outputting `"UHID-2027-000001"`.
*   **Mock Strategy:** Do not mock the date utility; inject a fixed clock dependency to test year transitions reliably. Mock the database counter retriever.
*   **Coverage Targets:** 100% Line, 100% Branch.

### 2. Password Hashing Utility
*   **Module:** `UserModule`
*   **Business Rule:** Staff passwords MUST be hashed using bcrypt with a work factor of exactly 10.
*   **Test Cases:**
    *   *Happy Path:* Input raw string `"SecurePassword123!"` $\rightarrow$ Outputs string starting with `"$2b$10$"`.
    *   *Boundary:* Input password of minimum length `8` chars $\rightarrow$ Succeeds. Input maximum length `72` chars $\rightarrow$ Succeeds.
    *   *Invalid:* Input password length `7` chars $\rightarrow$ Throws `PasswordTooShortException`. Input null/empty $\rightarrow$ Throws `NullPasswordException`.
*   **Mock Strategy:** Use raw bcrypt library; do not mock cryptographic hashing functions to ensure real-world hash validity.
*   **Coverage Targets:** 100% Line, 100% Branch.

### 3. Vitals Validation Service
*   **Module:** `PatientModule`
*   **Business Rule:** Heart rate: 30–250 bpm, Temp: 90.0°F–110.0°F, Weight: 1–500 kg.
*   **Test Cases:**
    *   *Happy Path:* Input Heart Rate `72`, Temp `98.6`, Weight `70` $\rightarrow$ Returns `valid = true`.
    *   *Boundary:* Input Heart Rate `30`, Temp `90.0`, Weight `1` $\rightarrow$ Returns `valid = true`. Input Heart Rate `250`, Temp `110.0`, Weight `500` $\rightarrow$ Returns `valid = true`.
    *   *Invalid:* Heart Rate `29` $\rightarrow$ Returns `valid = false`. Temp `110.1` $\rightarrow$ Returns `valid = false`.
*   **Mock Strategy:** Stateless utility; no mocks required.
*   **Coverage Targets:** 100% Line, 100% Branch.

### 4. Appointment Booking Conflict Validator
*   **Module:** `QueueModule`
*   **Business Rule:** Prevents double-booking a physician's 15-minute slot.
*   **Test Cases:**
    *   *Happy Path:* Check availability on doctor `A` at `09:30` on date `2026-06-20` (no bookings exist) $\rightarrow$ Returns `true`.
    *   *Business-Rule Edge Case:* Check slot `09:30` when booking exists for same doctor at `09:30` $\rightarrow$ Returns `false`. Check slot `09:30` when booking exists for same doctor at `09:15` $\rightarrow$ Returns `true`.
*   **Mock Strategy:** Mock the database repository to return predefined mock appointment arrays.
*   **Coverage Targets:** 100% Line, 100% Branch.

---

## Part 2 — Integration Tests

### IT-REG-01: Patient Profile Registration
*   **Endpoint:** `POST /v1/patients`
*   **Scenario:** Successful patient registration and UHID allocation.
*   **Preconditions:** Auth token belongs to a Receptionist role.
*   **Request:**
    *   *Headers:* `Authorization: Bearer <receptionistToken>`, `Content-Type: application/json`
    *   *Body:*
        ```json
        {
          "name": "Jane Doe",
          "dob": "1990-05-15",
          "gender": "Female",
          "address": "123 Health Ave, Medical City",
          "phone": "+15550199",
          "emergencyContact": "John Doe",
          "emergencyPhone": "+15550100"
        }
        ```
*   **Expected Response:**
    *   *Status:* `201 Created`
    *   *Body Schema:* Contains fields `id` (UUID format) and `uhid` matching `^UHID-\d{4}-\d{6}$`.
    *   *DB Side Effects:* Inserts row into `Patients` with `uhid = "UHID-2026-000001"`, encrypting name, dob, address, and phone using KMS.
*   **Cleanup:** Delete the inserted patient row using their generated UUID.

### IT-OPD-01: Create Appointment
*   **Endpoint:** `POST /v1/appointments`
*   **Scenario:** Book appointment slot.
*   **Preconditions:** Auth token is Patient. `Patients` table contains the patient ID; `Doctors` table contains the doctor ID. No conflicting appointments exist.
*   **Request:**
    *   *Headers:* `Authorization: Bearer <patientToken>`, `Content-Type: application/json`
    *   *Body:*
        ```json
        {
          "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
          "doctorId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
          "scheduledDate": "2026-06-20",
          "timeSlot": "09:30"
        }
        ```
*   **Expected Response:**
    *   *Status:* `201 Created`
    *   *Body:* Contains `appointmentId` and `status: "Booked"`.
    *   *DB Side Effects:* Inserts row into `Appointments`.
*   **Cleanup:** Delete appointment row.

### IT-OPD-03: Generate Queue Token
*   **Endpoint:** `POST /v1/queues/tokens`
*   **Scenario:** Generate token on check-in.
*   **Preconditions:** Auth role is Receptionist. Appointment exists with status "Booked".
*   **Request:**
    *   *Body:* `{ "appointmentId": "f7d79b9b-cf39-4d69-906d-49110b9dbdcd" }`
*   **Expected Response:**
    *   *Status:* `201 Created`
    *   *Body:* Contains `tokenId`, `tokenNumber: "T-101"`, `status: "Waiting"`.
    *   *DB Side Effects:* Inserts row in `QueueTokens` and updates appointment status to "Checked-In".
*   **Cleanup:** Delete generated token, reset appointment status to "Booked".

### IT-PHR-01: Fulfill Prescription
*   **Endpoint:** `POST /v1/pharmacy/prescriptions/{id}/fulfill`
*   **Scenario:** Fulfill prescription and reduce stock count.
*   **Preconditions:** Auth role is Pharmacist. Prescription exists with status "Pending". `InventoryLogs` contains stock level `500` for the medicine.
*   **Request:**
    *   *Path params:* `id` = UUID of pending prescription.
*   **Expected Response:**
    *   *Status:* `200 OK`
    *   *DB Side Effects:* Inserts a row in `InventoryLogs` with negative delta, updating aggregate stock count to `499`. Updates `Prescriptions` status to "Dispensed".
*   **Cleanup:** Reset prescription status to "Pending", delete stock adjustment log.

---

### Authentication Flow Integration Tests
1.  **Auth Flow: Login**
    *   *Scenario:* Submit verified Firebase ID Token to `/v1/auth/patients/login` $\rightarrow$ Expect `200 OK` and a valid session JWT with 1 hour TTL.
2.  **Auth Flow: Token Expiry**
    *   *Scenario:* Call protected endpoint `/v1/patients/{id}` using a session token with an expired timestamp $\rightarrow$ Expect `401 Unauthorized` with error code `INVALID_CREDENTIALS` and cookie/token erasure.
3.  **Auth Flow: Logout**
    *   *Scenario:* Call `/v1/auth/staff/logout` with active session cookie $\rightarrow$ Expect `200 OK`, cookie header set to expired state, and session invalidation in Redis.

---

### Permissions Enforcement Integration Tests
Using the roles defined in `Permissions_Matrix.md`:
*   *Test 1 (Receptionist):* Call `POST /v1/consultations` (Doctor-only) using a Receptionist session cookie $\rightarrow$ Expect `403 Forbidden` with error code `ACCESS_DENIED`.
*   *Test 2 (Patient):* Call `GET /v1/admin/audit-logs` (Admin-only) using a Patient session token $\rightarrow$ Expect `403 Forbidden` with error code `ACCESS_DENIED`.
*   *Test 3 (Pharmacist):* Call `POST /v1/lab/orders` (Doctor-only) using a Pharmacist session cookie $\rightarrow$ Expect `403 Forbidden` with error code `ACCESS_DENIED`.

---

### Third-Party Mocks
*   **Firebase Authentication API:** Mocked using wiremock at the network boundary. Requests to the Firebase validation endpoints are intercepted to return a mock user UID and verification payload.
*   **Google Gemini API:** Intercepted using a mock server. Requests to `/v1/models/gemini-1.5-flash:generateContent` return structured JSON mocks matching symptom triage output, PDF text summaries, or SOAP transcription notes.

---

## Part 3 — Security Tests

### ST-AUTH-01: Authentication Bypass Attempt
*   **Threat Vector:** Spoofing / Elevation of Privilege. An attacker calls a protected API endpoint (e.g. `/v1/patients/e6628b08-8e6d-4950-8bde-d51d95393ff8`) without passing an Authorization header.
*   **Test Steps:**
    1.  Send GET request to `/v1/patients/{id}` with no headers.
    2.  Send GET request to `/v1/patients/{id}` passing an invalid, randomly generated JWT string.
    3.  Send GET request to `/v1/patients/{id}` passing an expired JWT token.
*   **Expected Secure System Response:** All requests MUST be rejected with `HTTP 401 Unauthorized` containing the `INVALID_CREDENTIALS` error code.
*   **Severity:** CRITICAL

### ST-PRIV-01: Horizontal Privilege Escalation
*   **Threat Vector:** Information Disclosure. A patient attempts to view consultation logs belonging to another patient.
*   **Test Steps:**
    1.  Authenticate Patient `A` and obtain their session JWT.
    2.  Send GET request to `/v1/consultations/{id}` where `{id}` is the consultation ID belonging to Patient `B`.
*   **Expected Secure System Response:** The API Gateway/Service Layer MUST reject the request with `HTTP 403 Forbidden` and log the `ACCESS_DENIED` violation in `AuditLogs`.
*   **Severity:** HIGH

### ST-PRIV-02: Vertical Privilege Escalation
*   **Threat Vector:** Elevation of Privilege. A Receptionist attempts to sign off on a prescription order.
*   **Test Steps:**
    1.  Authenticate Receptionist `A` and obtain their session cookie.
    2.  Send POST request to `/v1/prescriptions` with a valid prescription body.
*   **Expected Secure System Response:** The gateway MUST intercept the request and reject it with `HTTP 403 Forbidden` before executing any application logic.
*   **Severity:** CRITICAL

### ST-INJ-01: SQL Injection
*   **Threat Vector:** Tampering / Information Disclosure. An attacker injects SQL commands inside input strings (e.g. Patient Search input).
*   **Test Steps:**
    1.  Send GET request to `/v1/patients?search=Jane%27%20OR%201%3D1%3B--`.
    2.  Send POST request to `/v1/auth/staff/login` with email `' OR '1'='1`.
*   **Expected Secure System Response:** The system MUST parse all parameters securely using parameterized ORM boundaries. The requests must either return `400 Bad Request` or return empty data blocks without throwing database syntax exceptions.
*   **Severity:** CRITICAL

### ST-MASS-01: Mass Assignment
*   **Threat Vector:** Tampering. An attacker attempts to inject database fields (like `role` or `consent_flag`) during creation or updates.
*   **Test Steps:**
    1.  Send POST request to `/v1/patients` containing extra field `"consentFlag": true` in the JSON body.
    2.  Send PUT request to `/v1/patients/{id}` containing extra field `"uhid": "UHID-9999-999999"`.
*   **Expected Secure System Response:** The application layer schema validators MUST sanitize inputs, ignoring extra parameters, and save only white-listed properties. UHID values MUST NOT change.
*   **Severity:** HIGH

### ST-RATE-01: Rate Limiting Enforcement
*   **Threat Vector:** Denial of Service. An attacker floods login or chat endpoints with requests.
*   **Test Steps:**
    1.  Send 11 consecutive POST requests to `/v1/auth/patients/login` from the same IP address within 30 seconds.
*   **Expected Secure System Response:** The 11th request MUST be blocked by NGINX rate-limiters, returning `HTTP 429 Too Many Requests`.
*   **Severity:** HIGH

### ST-PII-01: PII Exposure Prevention
*   **Threat Vector:** Information Disclosure. A non-authorized role requests patient data.
*   **Test Steps:**
    1.  Authenticate a Lab Staff user session.
    2.  Send GET request to `/v1/patients/{id}`.
*   **Expected Secure System Response:** The returned JSON response MUST sanitize output fields, omitting sensitive clinical notes or billing logs from the payload.
*   **Severity:** HIGH

### ST-LOG-01: Sensitive Data in Logs Prevention
*   **Threat Vector:** Information Disclosure. Passwords or tokens written to disk logs.
*   **Test Steps:**
    1.  Trigger failed login and upload operations.
    2.  Inspect host server syslog, application logs, and database console outputs.
*   **Expected Secure System Response:** All logs MUST be clear of passwords, JWT strings, session cookies, and decrypted patient PII/PHI.
*   **Severity:** HIGH

---

## Part 4 — UAT Scenarios

### UAT-PATIENT-01: Patient App — Book Appointment and Track Waitlist
*   **User Goal:** Patient wants to schedule a checkup and monitor their waitlist token position remotely.
*   **Preconditions:** Patient is logged into the Patient App. Attending Doctor is rostered for appointments on the selected date.
*   **Steps:**
    1.  Patient navigates to the Booking screen.
    2.  Selects "Dr. Smith" from the doctor dropdown list.
    3.  Selects the date "June 20, 2026" on the calendar picker.
    4.  Selects the "09:30 AM" timeslot and taps "Book Slot".
    5.  Confirms the confirmation popup dialog.
    6.  Taps on the "Queue Status" navigation tab on the home dashboard.
*   **Expected Outcomes:**
    *   *Step 1-4:* Dropdowns and slots populate. Selection is visual.
    *   *Step 5:* Modal closes, redirects to Home dashboard showing booking card: "June 20, 2026 at 09:30 AM".
    *   *Step 6:* The screen displays: "Queue Token: T-101", "Patients Ahead: 2", "Estimated Wait Time: 30 Minutes".
*   **Pass Criteria:** The booking record is saved in the database with status "Booked", and the mobile queue page displays wait time calculations matching the `(Patients Ahead) * 15m` rule.
*   **Edge Cases:** Another patient books the slot in the split second before confirmation. Expected output: Booking fails, slot shows as unavailable, and the system prompts the patient to choose another slot.
*   **PRD AC Validated:** F-OPD-02 (AC 1-3), F-OPD-04 (AC 1-2).

### UAT-DOCTOR-01: Doctor Workspace — Consult Patient and Prescribe
*   **User Goal:** Doctor wants to review triage vitals, dictate consultation notes, and send a digital prescription to the pharmacy.
*   **Preconditions:** Patient is checked in at reception with token "T-101". Nurse has recorded vital signs. Doctor is logged in.
*   **Steps:**
    1.  Doctor taps "Call Patient" on token "T-101" from their dashboard schedule list.
    2.  Doctor reviews the vitals card displayed at the top of the workspace.
    3.  Doctor taps "AI Scribe", records a 30-second audio summary of the consult, and taps "Stop & Upload".
    4.  Doctor reviews the generated SOAP markdown notes and taps "Apply Notes".
    5.  Doctor taps "Prescribe", searches "Amoxicillin 500mg" in the formulary, inputs dosage details, and taps "Save".
    6.  Doctor taps "Save Consult" to close the encounter.
*   **Expected Outcomes:**
    *   *Step 1:* Token status changes to "In-Consultation", workspace opens.
    *   *Step 2:* Vitals display: "BP: 120/80, HR: 72 bpm, Temp: 98.6°F, Weight: 70.5kg".
    *   *Step 3-4:* Scribe translates audio to SOAP notes, auto-populating notes fields.
    *   *Step 5:* Prescription item card is added, matching the formulary.
    *   *Step 6:* Consultation saves, token status changes to "Completed", and workspace closes.
*   **Pass Criteria:** A consultation record is saved with SOAP notes, a linked prescription is logged in the `Prescriptions` table with status "Pending", and the queue token status is updated to "Completed".
*   **Edge Cases:** Microphone permission is disabled. Expected output: Alert prompts doctor to enable microphone permission.
*   **PRD AC Validated:** F-DOC-02 (AC 1-4), F-DOC-03 (AC 1-3), F-AI-03 (AC 1-3).

---

## Appendix — Test Infrastructure

### Frameworks per Layer
*   **Unit Tests:**
    *   *Android Mobile:* JUnit 5, MockK (for mocking).
    *   *Backend Services:* Jest, Ts-Jest (for TypeScript).
*   **Integration Tests:**
    *   *Backend APIs:* Supertest (routing tests), Prisma Mock / PG-Mock (database mock state).
*   **Security Tests:**
    *   *Vulnerability Scanners:* OWASP ZAP (automated dynamic scanner), dependency check scans (Snyk).
    *   *Manual Fuzzing:* sqlmap (injection checks), Postman (for routing headers and mass assignment validations).
*   **End-to-End (E2E) Tests:**
    *   *Web Portal:* Playwright (runs automated browser routines).
    *   *Android App:* Android Espresso (for UI click routines).

### CI/CD Pipeline Executions
*   **On Pull Request (PR):** Runs SAST scans, dependency vulnerability scans (Snyk), and executes the complete Unit Test suite. Builds must maintain 100% pass status.
*   **On Merge to Main:** Runs the Integration Test suite against a staging database container.
*   **On Release Candidate (RC):** Executes E2E automation scripts and full security vulnerability scans.

### Test Data Strategy
*   **Factories:** Dynamic factories (e.g. `factory-bot` or custom builders) generate dynamic mock patient profiles and user sessions with random UUIDs for unit and integration suites.
*   **Seeds:** Database seeding scripts populate global constants (departments, roles list, medicines formulary) to bootstrap the integration testing environment database.
*   **Fixtures:** Static JSON fixtures model Google Gemini API response bodies and Firebase OTP tokens.

### Environment Requirements
*   **Staging Database Container:** PostgreSQL database container initialized with volume encryption (AES-256) running inside Docker on the CI runner host.
*   **Mock Server Node:** A local WireMock node mock container to route outgoing Firebase and Gemini calls.
*   **KMS Test Instance:** A local Dev-instance of HashiCorp Vault to supply test encryption keys.
