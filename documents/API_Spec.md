# API Specification Document
## Smart Healthcare Intelligence Platform v1.0

---

## 1. API Summary Table

All endpoints are versioned with the prefix `/v1`.

| Method | Path | Description | Auth | Roles Allowed | Rate Limit |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **POST** | `/v1/auth/patients/login` | Authenticates Patient via Firebase token | None | Patient | 10 req / min / IP |
| **POST** | `/v1/auth/staff/login` | Authenticates Staff via credentials | None | All Staff | 10 req / min / IP |
| **POST** | `/v1/auth/staff/logout` | Invalidates active staff session | Required | All Staff | 60 req / min / User |
| **POST** | `/v1/patients` | Registers new patient & generates UHID | Required | Receptionist, Administrator | 60 req / min / User |
| **GET** | `/v1/patients/{id}` | Retrieves patient demographic & PHI | Required | Patient (own), Doctor, Nurse, Lab, Pharmacist, Billing, Admin | 60 req / min / User |
| **PUT** | `/v1/patients/{id}` | Updates patient profile details | Required | Receptionist, Administrator | 60 req / min / User |
| **PUT** | `/v1/patients/{id}/consent` | Updates patient opt-in/opt-out status | Required | Patient (own), Receptionist, Admin | 60 req / min / User |
| **POST** | `/v1/appointments` | Books a new OPD consultation slot | Required | Patient (own), Receptionist | 60 req / min / User |
| **GET** | `/v1/appointments` | Lists scheduled appointments with filters | Required | Patient (own), Doctor, Nurse, Receptionist, Billing, Admin | 60 req / min / User |
| **PUT** | `/v1/appointments/{id}/cancel` | Cancels a booked appointment | Required | Patient (own), Receptionist | 60 req / min / User |
| **POST** | `/v1/queues/tokens` | Generates a waitlist token on check-in | Required | Receptionist | 60 req / min / User |
| **GET** | `/v1/queues/tokens/active` | Queries the active waitlist queue | Required | Patient (own), Doctor, Nurse, Receptionist, Pharmacist, Billing, Admin | 120 req / min / User |
| **PUT** | `/v1/queues/tokens/{id}/status` | Updates token status (e.g. Call Patient) | Required | Doctor, Nurse, Receptionist | 60 req / min / User |
| **POST** | `/v1/triage/vitals` | Logs patient vital signs during triage | Required | Nurse | 60 req / min / User |
| **GET** | `/v1/consultations/{id}` | Retrieves clinical consultation details | Required | Patient (own), Doctor, Nurse, Admin | 60 req / min / User |
| **POST** | `/v1/consultations` | Creates diagnosis and clinical notes | Required | Doctor | 60 req / min / User |
| **GET** | `/v1/medicines` | Queries the standard drug formulary | Required | Doctor, Pharmacist, Administrator | 60 req / min / User |
| **POST** | `/v1/prescriptions` | Generates a digital prescription | Required | Doctor | 60 req / min / User |
| **POST** | `/v1/pharmacy/prescriptions/{id}/fulfill` | Dispenses drugs & decrements stock count | Required | Pharmacist | 60 req / min / User |
| **GET** | `/v1/pharmacy/inventory` | Queries stock levels, alerts, expiries | Required | Pharmacist, Administrator | 60 req / min / User |
| **POST** | `/v1/pharmacy/inventory/adjustments` | Manually adjusts stock counts | Required | Pharmacist | 60 req / min / User |
| **POST** | `/v1/lab/orders` | Orders lab tests during consultation | Required | Doctor | 60 req / min / User |
| **PUT** | `/v1/lab/orders/{id}/status` | Transitions lab order processing status | Required | Lab Staff | 60 req / min / User |
| **POST** | `/v1/lab/reports/upload` | Uploads PDF report file and saves link | Required | Lab Staff | 60 req / min / User |
| **GET** | `/v1/lab/reports` | Lists report records & download URLs | Required | Patient (own), Doctor, Nurse, Lab, Admin | 60 req / min / User |
| **GET** | `/v1/billing/patients/{uhid}/charges` | Aggregates consultation & lab charges | Required | Billing Officer, Administrator | 60 req / min / User |
| **POST** | `/v1/billing/invoices` | Generates a itemized billing invoice | Required | Billing Officer | 60 req / min / User |
| **POST** | `/v1/billing/claims` | Logs a manual insurance claim | Required | Billing Officer | 60 req / min / User |
| **POST** | `/v1/ai/symptoms/triage` | Feeds symptom assistant chat details | Required | Patient | 10 req / min / User |
| **POST** | `/v1/ai/lab-reports/{id}/explain` | Requests Gemini PDF report explainer | Required | Patient | 10 req / min / User |
| **POST** | `/v1/ai/scribe/sessions/{id}/transcribe` | Transcribes audio and structures notes | Required | Doctor | 10 req / min / User |
| **GET** | `/v1/ai/patients/{id}/risk-flags` | Retrieves patient risk flags | Required | Doctor | 60 req / min / User |
| **GET** | `/v1/analytics/executive` | Compiles dashboard aggregate metrics | Required | Administrator | 20 req / min / User |
| **GET** | `/v1/analytics/doctors` | Compiles doctor utilization analytics | Required | Administrator | 20 req / min / User |
| **GET** | `/v1/analytics/forecasts` | Generates bed/staffing demand forecasts | Required | Administrator | 20 req / min / User |
| **GET** | `/v1/admin/audit-logs` | Queries security audit trail records | Required | Administrator | 20 req / min / User |
| **POST** | `/v1/admin/staff` | Provisions a new staff account | Required | Administrator | 20 req / min / User |
| **PUT** | `/v1/admin/config` | Modifies platform configuration keys | Required | Super Admin | 10 req / min / User |

---

## 2. Endpoint Specifications

### POST /v1/auth/patients/login
*   **Description:** Validates Firebase mobile ID token and starts a Patient session.
*   **Auth:** None
*   **Roles:** Patient
*   **Rate Limit:** 10 requests / 60 seconds / per IP
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "idToken": { "type": "string" }
          },
          "required": ["idToken"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "sessionToken": "jwt_token_string",
            "patient": {
              "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
              "uhid": "UHID-2026-000001"
            }
          }
        }
        ```
    *   *Errors:*
        *   `401 Unauthorized`: Token invalid or expired.
*   **Side Effects:** Checks database; creates patient session log in `AuditLogs`.
*   **DB Tables:** `Patients`, `AuditLogs`

---

### POST /v1/auth/staff/login
*   **Description:** Verifies credentials and sets HTTP-only session cookie for staff.
*   **Auth:** None
*   **Roles:** All Staff roles
*   **Rate Limit:** 5 requests / 60 seconds / per IP (lockout on 5 failures)
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "email": { "type": "string", "format": "email" },
            "password": { "type": "string", "minLength": 8 }
          },
          "required": ["email", "password"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "email": "doctor.smith@hospital.com",
          "password": "SecurePassword123!"
        }
        ```
*   **Response:**
    *   *200 OK:* (Sets `Set-Cookie: sessionId=...; HttpOnly; Secure; SameSite=Strict`)
        ```json
        {
          "success": true,
          "data": {
            "user": {
              "id": "a3b04752-9b2f-410a-8bf8-2b81098670df",
              "role": "Doctor",
              "email": "doctor.smith@hospital.com"
            }
          }
        }
        ```
    *   *Errors:*
        *   `401 Unauthorized`: Invalid email or password.
        *   `423 Locked`: Account locked for 15 minutes.
*   **Side Effects:** Verifies password hash; creates log in `AuditLogs`.
*   **DB Tables:** `Users`, `AuditLogs`

---

### POST /v1/auth/staff/logout
*   **Description:** Invalidate session on server and clear the session cookie.
*   **Auth:** Required
*   **Roles:** All Staff roles
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:** None
*   **Response:**
    *   *200 OK:* (Clears Cookie)
        ```json
        {
          "success": true,
          "message": "Logout successful"
        }
        ```
*   **Side Effects:** Invalidates Session ID in active session store.
*   **DB Tables:** `AuditLogs`

---

### POST /v1/patients
*   **Description:** Registers a patient profile and outputs a unique hospital ID.
*   **Auth:** Required
*   **Roles:** Receptionist, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "name": { "type": "string", "maxLength": 255 },
            "dob": { "type": "string", "format": "date" },
            "gender": { "type": "string", "enum": ["Male", "Female", "Other"] },
            "address": { "type": "string" },
            "phone": { "type": "string", "pattern": "^\\+?[1-9]\\d{1,14}$" },
            "emergencyContact": { "type": "string" },
            "emergencyPhone": { "type": "string" },
            "emergencyNotes": { "type": "string" }
          },
          "required": ["name", "dob", "gender", "address", "phone", "emergencyContact", "emergencyPhone"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "name": "Jane Doe",
          "dob": "1990-05-15",
          "gender": "Female",
          "address": "123 Health Ave, Medical City",
          "phone": "+15550199",
          "emergencyContact": "John Doe",
          "emergencyPhone": "+15550100",
          "emergencyNotes": "Allergic to penicillin"
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "id": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
            "uhid": "UHID-2026-000002"
          }
        }
        ```
    *   *Errors:*
        *   `400 Bad Request`: Missing fields or validation failure.
        *   `409 Conflict`: Phone number or UHID sequence conflict.
*   **Side Effects:** Generates sequence UHID, encrypts restricted fields (name, dob, address, phone) via KMS, writes patient row. Logs creation in audit table.
*   **DB Tables:** `Patients`, `AuditLogs`

---

### GET /v1/patients/{id}
*   **Description:** Retrieves demographic and medical metadata for a patient.
*   **Auth:** Required
*   **Roles:** Patient (own profile only), Doctor, Nurse, Lab Staff, Pharmacist, Billing Officer, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Patient identifier | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "id": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
            "uhid": "UHID-2026-000002",
            "name": "Jane Doe",
            "dob": "1990-05-15",
            "gender": "Female",
            "address": "123 Health Ave, Medical City",
            "phone": "+15550199",
            "bloodGroup": "O+",
            "allergies": "Penicillin",
            "chronicConditions": "None",
            "emergencyContact": "John Doe",
            "emergencyPhone": "+15550100",
            "emergencyNotes": "Allergic to penicillin",
            "consentFlag": true
          }
        }
        ```
    *   *Errors:*
        *   `403 Forbidden`: Patient attempts to read other patient profile, or consent checks fail.
        *   `404 Not Found`: Patient ID does not exist.
*   **Side Effects:** Reads encrypted fields, decrypts via KMS, logs access.
*   **DB Tables:** `Patients`, `AuditLogs`

---

### PUT /v1/patients/{id}/consent
*   **Description:** Updates the patient's global opt-in/opt-out consent flag.
*   **Auth:** Required
*   **Roles:** Patient (own profile only), Receptionist, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Patient identifier | Required
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "consentFlag": { "type": "boolean" }
          },
          "required": ["consentFlag"]
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "id": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
            "consentFlag": false
          }
        }
        ```
*   **Side Effects:** Modifies `consent_flag` in patient table, logs modification pre/post state.
*   **DB Tables:** `Patients`, `AuditLogs`

---

### POST /v1/appointments
*   **Description:** Books a new OPD consultation slot.
*   **Auth:** Required
*   **Roles:** Patient (own profile only), Receptionist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "patientId": { "type": "string", "format": "uuid" },
            "doctorId": { "type": "string", "format": "uuid" },
            "scheduledDate": { "type": "string", "format": "date" },
            "timeSlot": { "type": "string", "pattern": "^(0[0-9]|1[0-9]|2[0-3]):(00|15|30|45)$" }
          },
          "required": ["patientId", "doctorId", "scheduledDate", "timeSlot"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
          "doctorId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
          "scheduledDate": "2026-06-20",
          "timeSlot": "09:30"
        }
        ```
*   **Response:**
    *   *210 Created:*
        ```json
        {
          "success": true,
          "data": {
            "appointmentId": "f7d79b9b-cf39-4d69-906d-49110b9dbdcd",
            "status": "Booked"
          }
        }
        ```
    *   *Errors:*
        *   `409 Conflict`: The doctor is already booked for this specific date/time.
*   **Side Effects:** Writes appointment row, logs booking.
*   **DB Tables:** `Appointments`, `AuditLogs`

---

### GET /v1/appointments
*   **Description:** Returns a paginated list of appointments with filters.
*   **Auth:** Required
*   **Roles:** Patient (own only), Doctor, Nurse, Receptionist, Billing Officer, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `patientId` | string | UUID filter | None | Optional
        *   `doctorId` | string | UUID filter | None | Optional
        *   `date` | string | Date filter | None | Optional
        *   `page` | integer | Page index | 1 | Optional
        *   `limit` | integer | Page size | 20 | Optional
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "id": "f7d79b9b-cf39-4d69-906d-49110b9dbdcd",
              "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
              "doctorId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
              "scheduledDate": "2026-06-20",
              "timeSlot": "09:30:00",
              "status": "Booked"
            }
          ],
          "pagination": {
            "page": 1,
            "limit": 20,
            "total_records": 1,
            "total_pages": 1
          }
        }
        ```
*   **Side Effects:** Read operations logged.
*   **DB Tables:** `Appointments`, `AuditLogs`

---

### PUT /v1/appointments/{id}/cancel
*   **Description:** Sets appointment status to Cancelled, freeing the slot.
*   **Auth:** Required
*   **Roles:** Patient (own only), Receptionist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Appointment ID | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "id": "f7d79b9b-cf39-4d69-906d-49110b9dbdcd",
            "status": "Cancelled"
          }
        }
        ```
    *   *Errors:*
        *   `400 Bad Request`: Cancel requested less than 2 hours before scheduled slot.
*   **Side Effects:** Updates appointment status, logs cancellation.
*   **DB Tables:** `Appointments`, `AuditLogs`

---

### POST /v1/queues/tokens
*   **Description:** Checked-in reception check-in token generator.
*   **Auth:** Required
*   **Roles:** Receptionist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "appointmentId": { "type": "string", "format": "uuid" }
          },
          "required": ["appointmentId"]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "tokenId": "3c988b08-8e6d-4950-8bde-d51d95393fff",
            "tokenNumber": "T-101",
            "status": "Waiting"
          }
        }
        ```
*   **Side Effects:** Updates appointment status to Checked-In, inserts queue token record, logs waitlist change.
*   **DB Tables:** `QueueTokens`, `Appointments`, `AuditLogs`

---

### GET /v1/queues/tokens/active
*   **Description:** Fetches active waitlist details (used for 30s mobile client polling).
*   **Auth:** Required
*   **Roles:** Patient (own only), Doctor, Nurse, Receptionist, Pharmacist, Billing, Admin
*   **Rate Limit:** 120 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `doctorId` | string | Filter queue by Doctor ID | None | Optional
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "tokenId": "3c988b08-8e6d-4950-8bde-d51d95393fff",
              "tokenNumber": "T-101",
              "patientsAhead": 2,
              "estimatedWaitTimeMinutes": 30,
              "status": "Waiting"
            }
          ]
        }
        ```
*   **Side Effects:** None.
*   **DB Tables:** `QueueTokens`

---

### PUT /v1/queues/tokens/{id}/status
*   **Description:** Changes queue token status (e.g. Doctor calling patient).
*   **Auth:** Required
*   **Roles:** Doctor, Nurse, Receptionist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Token ID | Required
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "status": { "type": "string", "enum": ["Waiting", "In-Consultation", "Completed", "Cancelled"] }
          },
          "required": ["status"]
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "tokenId": "3c988b08-8e6d-4950-8bde-d51d95393fff",
            "status": "In-Consultation"
          }
        }
        ```
*   **Side Effects:** Modifies token status, logs queue updates.
*   **DB Tables:** `QueueTokens`, `AuditLogs`

---

### POST /v1/triage/vitals
*   **Description:** Logs patient triage vital signs.
*   **Auth:** Required
*   **Roles:** Nurse
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "patientId": { "type": "string", "format": "uuid" },
            "queueTokenId": { "type": "string", "format": "uuid" },
            "bloodPressure": { "type": "string", "pattern": "^\\d{2,3}/\\d{2,3}$" },
            "heartRate": { "type": "integer", "minimum": 30, "maximum": 250 },
            "temperature": { "type": "number", "minimum": 90.0, "maximum": 110.0 },
            "weight": { "type": "number", "minimum": 1.0, "maximum": 500.0 }
          },
          "required": ["patientId", "queueTokenId", "bloodPressure", "heartRate", "temperature", "weight"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
          "queueTokenId": "3c988b08-8e6d-4950-8bde-d51d95393fff",
          "bloodPressure": "120/80",
          "heartRate": 72,
          "temperature": 98.6,
          "weight": 70.5
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "vitalsId": "4d6d9b9b-cf39-4d69-906d-49110b9dbdce"
          }
        }
        ```
*   **Side Effects:** Encrypts vital fields via KMS, writes vitals record.
*   **DB Tables:** `Vitals`, `AuditLogs`

---

### POST /v1/consultations
*   **Description:** Doctor submits consultation notes, diagnosis, and recovery status.
*   **Auth:** Required
*   **Roles:** Doctor
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "doctorId": { "type": "string", "format": "uuid" },
            "patientId": { "type": "string", "format": "uuid" },
            "queueTokenId": { "type": "string", "format": "uuid" },
            "notes": { "type": "string" },
            "diagnosis": { "type": "string" },
            "recoveryStatus": { "type": "string", "enum": ["Active", "Recovered", "Referred"] }
          },
          "required": ["doctorId", "patientId", "queueTokenId", "notes", "diagnosis", "recoveryStatus"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "doctorId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
          "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
          "queueTokenId": "3c988b08-8e6d-4950-8bde-d51d95393fff",
          "notes": "Patient presents with dry cough and mild fever.",
          "diagnosis": "Acute Bronchitis",
          "recoveryStatus": "Active"
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "consultationId": "8c889b9b-cf39-4d69-906d-49110b9dbdcf"
          }
        }
        ```
*   **Side Effects:** Encrypts notes/diagnosis, inserts consultation row, transitions token status to Completed, logs clinical write.
*   **DB Tables:** `Consultations`, `QueueTokens`, `AuditLogs`

---

### GET /v1/medicines
*   **Description:** Queries the formulary database list of medicines.
*   **Auth:** Required
*   **Roles:** Doctor, Pharmacist, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `search` | string | Fuzzy drug search | None | Optional
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "id": "1b179b9b-cf39-4d69-906d-49110b9dbdc0",
              "name": "Amoxicillin 500mg"
            }
          ]
        }
        ```
*   **Side Effects:** Read query cached for 24h.
*   **DB Tables:** `Medicines`

---

### POST /v1/prescriptions
*   **Description:** Generates digital prescription items linked to consultation.
*   **Auth:** Required
*   **Roles:** Doctor
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "consultationId": { "type": "string", "format": "uuid" },
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "medicineId": { "type": "string", "format": "uuid" },
                  "dosage": { "type": "string" },
                  "duration": { "type": "string" },
                  "instructions": { "type": "string" }
                },
                "required": ["medicineId", "dosage", "duration"]
              }
            }
          },
          "required": ["consultationId", "items"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "consultationId": "8c889b9b-cf39-4d69-906d-49110b9dbdcf",
          "items": [
            {
              "medicineId": "1b179b9b-cf39-4d69-906d-49110b9dbdc0",
              "dosage": "1 tablet twice daily",
              "duration": "5 days",
              "instructions": "Take after meals"
            }
          ]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "prescriptionId": "9d999b9b-cf39-4d69-906d-49110b9dbdd0"
          }
        }
        ```
*   **Side Effects:** Encrypts item instructions/dosage details via KMS, creates prescription record, inserts items into items table. Logs creation.
*   **DB Tables:** `Prescriptions`, `PrescriptionItems`, `AuditLogs`

---

### POST /v1/pharmacy/prescriptions/{id}/fulfill
*   **Description:** Pharmacist dispenses drugs, updates status, and decrements stock.
*   **Auth:** Required
*   **Roles:** Pharmacist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Path params:* `id` | UUID | Prescription ID | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "message": "Prescription fulfilled successfully"
        }
        ```
    *   *Errors:*
        *   `422 Unprocessable Entity`: Stock insufficient in inventory counts.
*   **Side Effects:** Decrements stock counts in `InventoryLogs` for each prescription item, updates status in `Prescriptions` to 'Dispensed', logs changes.
*   **DB Tables:** `Prescriptions`, `InventoryLogs`, `PrescriptionItems`, `AuditLogs`

---

### GET /v1/pharmacy/inventory
*   **Description:** Queries medicine stock counts, alert status, and expirations.
*   **Auth:** Required
*   **Roles:** Pharmacist, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `page` | integer | Page index | 1 | Optional
        *   `limit` | integer | Page size | 20 | Optional
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "medicineId": "1b179b9b-cf39-4d69-906d-49110b9dbdc0",
              "name": "Amoxicillin 500mg",
              "currentStock": 450,
              "expiryDate": "2026-12-01",
              "alertStatus": "Normal"
            }
          ],
          "pagination": { "page": 1, "limit": 20, "total_records": 1, "total_pages": 1 }
        }
        ```
*   **Side Effects:** None.
*   **DB Tables:** `InventoryLogs`, `Medicines`

---

### POST /v1/pharmacy/inventory/adjustments
*   **Description:** Executes manual stock level adjustments.
*   **Auth:** Required
*   **Roles:** Pharmacist
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "medicineId": { "type": "string", "format": "uuid" },
            "quantityDelta": { "type": "integer" },
            "expiryDate": { "type": "string", "format": "date" },
            "reason": { "type": "string" }
          },
          "required": ["medicineId", "quantityDelta", "expiryDate", "reason"]
        }
        ```
    *   *Example request:*
        ```json
        {
          "medicineId": "1b179b9b-cf39-4d69-906d-49110b9dbdc0",
          "quantityDelta": 100,
          "expiryDate": "2026-12-01",
          "reason": "Restocked drug delivery"
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "logId": "2c988b08-8e6d-4950-8bde-d51d95393ffe",
            "newStockCount": 550
          }
        }
        ```
*   **Side Effects:** Inserts adjustment row in inventory table, updates aggregate counts, logs operation.
*   **DB Tables:** `InventoryLogs`, `AuditLogs`

---

### POST /v1/lab/orders
*   **Description:** Places diagnostic lab orders.
*   **Auth:** Required
*   **Roles:** Doctor
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "consultationId": { "type": "string", "format": "uuid" },
            "patientId": { "type": "string", "format": "uuid" },
            "doctorId": { "type": "string", "format": "uuid" },
            "testName": { "type": "string" }
          },
          "required": ["consultationId", "patientId", "doctorId", "testName"]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "orderId": "7a79b9b-cf39-4d69-906d-49110b9dbd01",
            "status": "Requested"
          }
        }
        ```
*   **Side Effects:** Inserts record into lab order tables, logs request.
*   **DB Tables:** `LabOrders`, `AuditLogs`

---

### PUT /v1/lab/orders/{id}/status
*   **Description:** Transitions order status (e.g. Sample Collected, Processing).
*   **Auth:** Required
*   **Roles:** Lab Staff
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Order ID | Required
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "status": { "type": "string", "enum": ["Requested", "Sample Collected", "Processing", "Completed"] }
          },
          "required": ["status"]
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "orderId": "7a79b9b-cf39-4d69-906d-49110b9dbd01",
            "status": "Sample Collected"
          }
        }
        ```
*   **Side Effects:** Updates order status column, logs modifications.
*   **DB Tables:** `LabOrders`, `AuditLogs`

---

### POST /v1/lab/reports/upload
*   **Description:** Uploads PDF diagnostic file and links to lab order.
*   **Auth:** Required
*   **Roles:** Lab Staff
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body:* Multipart file upload payload (`file` parameter, PDF format, <= 10MB) + `labOrderId` text parameter.
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "reportId": "8b999b9b-cf39-4d69-906d-49110b9dbdd2",
            "status": "Uploaded"
          }
        }
        ```
*   **Side Effects:** Scans PDF, writes file to Object storage, encrypts secure file path, inserts report row, transitions lab order status to "Uploaded", logs upload.
*   **DB Tables:** `LabReports`, `LabOrders`, `AuditLogs`

---

### GET /v1/lab/reports
*   **Description:** Lists reports for a patient with pre-signed secure download URLs.
*   **Auth:** Required
*   **Roles:** Patient (own only), Doctor, Nurse, Lab Staff, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `patientId` | string | Filter reports by patient | None | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "reportId": "8b999b9b-cf39-4d69-906d-49110b9dbdd2",
              "testName": "Complete Blood Count",
              "uploadedAt": "2026-06-15T12:00:00Z",
              "downloadUrl": "https://storage.hospital.com/reports/abc.pdf?signature=xyz"
            }
          ]
        }
        ```
*   **Side Effects:** Decrypts file paths via KMS, generates transient signed download URLs (5 min TTL), logs reads.
*   **DB Tables:** `LabReports`, `LabOrders`, `AuditLogs`

---

### GET /v1/billing/patients/{uhid}/charges
*   **Description:** Aggregates outstanding consultation fees and lab test costs.
*   **Auth:** Required
*   **Roles:** Billing Officer, Administrator
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `uhid` | string | Patient UHID | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "patientId": "e6628b08-8e6d-4950-8bde-d51d95393ff8",
            "outstandingItems": [
              { "type": "Consultation", "description": "General OPD Fee", "amount": 150.00 },
              { "type": "Lab Test", "description": "Complete Blood Count", "amount": 80.00 }
            ],
            "totalOutstanding": 230.00
          }
        }
        ```
*   **Side Effects:** None.
*   **DB Tables:** `Patients`, `Consultations`, `LabOrders`

---

### POST /v1/billing/invoices
*   **Description:** Generates payment invoice.
*   **Auth:** Required
*   **Roles:** Billing Officer
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "patientId": { "type": "string", "format": "uuid" },
            "totalAmount": { "type": "number" },
            "paymentMethod": { "type": "string", "enum": ["Cash", "Card", "Pending Insurance"] }
          },
          "required": ["patientId", "totalAmount", "paymentMethod"]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "invoiceId": "5c988b08-8e6d-4950-8bde-d51d95393ffd",
            "status": "Paid"
          }
        }
        ```
*   **Side Effects:** Inserts rows into `Invoices` and `Payments` tables, logs billing checkouts.
*   **DB Tables:** `Invoices`, `Payments`, `AuditLogs`

---

### POST /v1/billing/claims
*   **Description:** Logs a manual insurance claim policy details.
*   **Auth:** Required
*   **Roles:** Billing Officer
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "invoiceId": { "type": "string", "format": "uuid" },
            "policyNumber": { "type": "string" },
            "providerName": { "type": "string" },
            "claimAmount": { "type": "number" },
            "claimDetails": { "type": "string" }
          },
          "required": ["invoiceId", "policyNumber", "providerName", "claimAmount"]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "claimId": "6c988b08-8e6d-4950-8bde-d51d95393ffa",
            "status": "Pending"
          }
        }
        ```
*   **Side Effects:** Encrypts policy number and claim details via KMS, writes claim record, sets invoice status to "Pending Insurance", logs modifications.
*   **DB Tables:** `InsuranceClaims`, `Invoices`, `AuditLogs`

---

### POST /v1/ai/symptoms/triage
*   **Description:** Triages patient-entered symptom text using Google Gemini.
*   **Auth:** Required
*   **Roles:** Patient
*   **Rate Limit:** 10 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "symptomText": { "type": "string", "maxLength": 1000 }
          },
          "required": ["symptomText"]
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "urgencyLevel": "Medium",
            "recommendedSpecialty": "Cardiologist",
            "analysis": "Symptom logs indicate potential cardiorespiratory tracking needs.",
            "disclaimer": "This symptom assistant is not a diagnostic tool and does not replace human clinical judgment. For life-threatening emergencies, seek immediate human medical care."
          }
        }
        ```
*   **Side Effects:** Feeds chat transcript to Gemini API, saves chat row.
*   **DB Tables:** `SymptomChats`

---

### POST /v1/ai/lab-reports/{id}/explain
*   **Description:** Explains PDF lab report metrics in simple language.
*   **Auth:** Required
*   **Roles:** Patient
*   **Rate Limit:** 10 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Lab Report ID | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "summary": "Your hemoglobin level is 14.2 g/dL, which is inside normal ranges. White blood cell count is slightly elevated.",
            "disclaimer": "This summary is AI-generated. Consult your doctor for an official clinical diagnosis."
          }
        }
        ```
*   **Side Effects:** Fetches PDF report, extracts text, routes queries to Gemini wrapper.
*   **DB Tables:** `LabReports`

---

### POST /v1/ai/scribe/sessions/{id}/transcribe
*   **Description:** Processes doctor dictation audio, transcribing into structured clinical notes.
*   **Auth:** Required
*   **Roles:** Doctor
*   **Rate Limit:** 10 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Path params:* `id` | UUID | Consultation ID | Required
    *   *Body:* Multipart form file payload (`audio` parameter, wav/mp3 format, <= 20MB).
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "soapNotes": "Subjective: Patient has cough...\nObjective: Normal heart sounds...\nAssessment: Bronchitis...\nPlan: Prescribe antibiotics..."
          }
        }
        ```
*   **Side Effects:** Uploads audio to object storage, passes audio binary to Gemini, encrypts generated SOAP text, inserts scribe session log.
*   **DB Tables:** `ScribeSessions`, `Consultations`, `AuditLogs`

---

### GET /v1/ai/patients/{id}/risk-flags
*   **Description:** Queries risk alert badges (readmissions, chronic, critical vitals).
*   **Auth:** Required
*   **Roles:** Doctor
*   **Rate Limit:** 60 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Path params:* `id` | UUID | Patient ID | Required
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "readmissionRisk": true,
            "chronicConditionsFlag": true,
            "criticalLabValues": false,
            "alerts": ["Discharged from ward within last 30 days"]
          }
        }
        ```
*   **Side Effects:** Evaluates historical DB rows.
*   **DB Tables:** `Patients`, `Consultations`, `Admissions`, `LabOrders`

---

### GET /v1/analytics/executive
*   **Description:** Compiles hospital dashboard aggregate metrics.
*   **Auth:** Required
*   **Roles:** Administrator
*   **Rate Limit:** 20 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:** None
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "dailyRevenue": 15450.00,
            "bedOccupancyRate": 78.5,
            "averageWaitTimeMinutes": 22.4,
            "patientVolume": 142
          }
        }
        ```
*   **Side Effects:** Reads aggregated database tables.
*   **DB Tables:** `Invoices`, `Admissions`, `QueueTokens`

---

### GET /v1/analytics/doctors
*   **Description:** Compiles doctor shift utilization metrics.
*   **Auth:** Required
*   **Roles:** Administrator
*   **Rate Limit:** 20 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:** None
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "doctorId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
              "doctorName": "Dr. Smith",
              "totalConsultations": 18,
              "utilizationRate": 75.0
            }
          ]
        }
        ```
*   **Side Effects:** None.
*   **DB Tables:** `Doctors`, `Consultations`

---

### GET /v1/analytics/forecasts
*   **Description:** Compiles 7-day predictive curves for beds, staffing, and inventory.
*   **Auth:** Required
*   **Roles:** Administrator
*   **Rate Limit:** 20 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:** None
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": {
            "bedDemandForecast": [12, 14, 15, 13, 11, 12, 14],
            "staffingForecast": [8, 8, 9, 8, 7, 8, 9],
            "inventoryForecast": [980, 950, 920, 890, 860, 830, 800]
          }
        }
        ```
*   **Side Effects:** Reads historical aggregates.
*   **DB Tables:** `Admissions`, `QueueTokens`, `InventoryLogs`

---

### GET /v1/admin/audit-logs
*   **Description:** Queries security audit trail records.
*   **Auth:** Required
*   **Roles:** Administrator
*   **Rate Limit:** 20 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Query params:*
        *   `patientId` | string | Filter logs by patient ID | None | Optional
        *   `page` | integer | Page index | 1 | Optional
        *   `limit` | integer | Page size | 50 | Optional
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "data": [
            {
              "logId": 12054,
              "action": "Edit",
              "userId": "a3b04752-9b2f-410a-8bf8-2b81098670df",
              "entityChanged": "Patients",
              "timestamp": "2026-06-15T13:30:00Z"
            }
          ],
          "pagination": { "page": 1, "limit": 50, "total_records": 1, "total_pages": 1 }
        }
        ```
*   **Side Effects:** Reads audit log table.
*   **DB Tables:** `AuditLogs`

---

### POST /v1/admin/staff
*   **Description:** Registers a new staff user profile.
*   **Auth:** Required
*   **Roles:** Administrator
*   **Rate Limit:** 20 requests / 60 seconds / per User
*   **Idempotent:** No
*   **Request:**
    *   *Body (JSON schema):*
        ```json
        {
          "type": "object",
          "properties": {
            "email": { "type": "string", "format": "email" },
            "password": { "type": "string", "minLength": 8 },
            "role": { "type": "string", "enum": ["Doctor", "Nurse", "Receptionist", "Lab Staff", "Pharmacist", "Billing Officer", "Administrator"] },
            "departmentId": { "type": "string", "format": "uuid" }
          },
          "required": ["email", "password", "role"]
        }
        ```
*   **Response:**
    *   *201 Created:*
        ```json
        {
          "success": true,
          "data": {
            "userId": "d6c88b08-8e6d-4950-8bde-d51d95393ffd"
          }
        }
        ```
*   **Side Effects:** Hashes password with bcrypt, inserts user row, logs account registration.
*   **DB Tables:** `Users`, `AuditLogs`

---

### PUT /v1/admin/config
*   **Description:** Modifies system global variables.
*   **Auth:** Required
*   **Roles:** Super Admin
*   **Rate Limit:** 10 requests / 60 seconds / per User
*   **Idempotent:** Yes
*   **Request:**
    *   *Body:*
        ```json
        {
          "type": "object",
          "properties": {
            "configKey": { "type": "string" },
            "configValue": { "type": "string" }
          },
          "required": ["configKey", "configValue"]
        }
        ```
*   **Response:**
    *   *200 OK:*
        ```json
        {
          "success": true,
          "message": "Configuration updated successfully"
        }
        ```
*   **Side Effects:** Updates config table, purges evicted cache keys, logs settings update.
*   **DB Tables:** `PlatformConfigurations`, `AuditLogs`

---

## 3. Global Error Envelope Format

All API errors MUST return the standard JSON envelope structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of the error.",
    "details": {}
  }
}
```

### Standard Error Codes
*   `INVALID_CREDENTIALS`: Login verification failed (401).
*   `ACCESS_DENIED`: RBAC or object-level authorization check failed (403).
*   `RESOURCE_NOT_FOUND`: Target entity ID does not exist in tables (404).
*   `RESOURCE_CONFLICT`: Slot booked or token conflict (409).
*   `VALIDATION_FAILED`: Fields failed JSON schema check (400).
*   `OUT_OF_STOCK`: Insufficient stock delta (422).
*   `RATE_LIMIT_EXCEEDED`: API calls limit exceeded (429).
*   `INTERNAL_SERVER_ERROR`: Uncaught database or backend exception (500).

---

## 4. Authentication Flow

### 1. Obtain Token (Patient Login)
*   **Request:** `POST /v1/auth/patients/login` containing verified Firebase ID Token.
*   **Response:** returns `sessionToken` (JWT access token, 1 hour TTL).

### 2. Use Token
*   For subsequent calls, Patient App passes the token in the HTTP Authorization header:
    `Authorization: Bearer <sessionToken>`

### 3. Refresh Token
*   Patient App calls the Firebase SDK refresh function to obtain a new Firebase ID Token, then dispatches it to `/v1/auth/patients/login` to get a new session access token.

### 4. Revoke Token (Logout)
*   Patient App calls Firebase SDK sign-out; subsequent API calls using the local cached access token will be rejected by the server Gateway once it expires (1 hour maximum).

---

## 5. Pagination Contract

*   **Request Parameter:** Query string parameters `page` (default 1) and `limit` (default 20, absolute maximum 100).
*   **Response Envelope:** Paginated results MUST return lists wrapped inside a `data` list, accompanied by a metadata `pagination` envelope:
    ```json
    {
      "success": true,
      "data": [ ... ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total_records": 142,
        "total_pages": 8
      }
    }
    ```

---

## 6. API Versioning Strategy

*   **URL Versioning:** Versioning MUST be implemented via the path prefix, prefixed with `/v1` (e.g. `/v1/patients`, `/v1/appointments`).
*   **Deprecation:** When `/v2` API changes are introduced in Phase 2, `/v1` endpoints MUST remain active alongside `/v2` for a 6-month deprecation grace window.
