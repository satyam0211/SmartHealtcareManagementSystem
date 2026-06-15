# Permissions Matrix Document
## Smart Healthcare Intelligence Platform v1.0

---

## 1. Role Definitions

### 1. Patient (PT)
*   **Description:** Individuals receiving clinical medical treatment or scheduling consultations.
*   **Who Holds It:** Registered healthcare consumers.
*   **How Assigned:** Self-registered via the Patient mobile app, verified via Firebase SMS OTP.
*   **Coexistence:** No. A Patient account is strictly restricted and cannot possess clinical or staff privileges.

### 2. Doctor (DR)
*   **Description:** Medical practitioners conducting outpatient consultations, writing prescriptions, and requesting labs.
*   **Who Holds It:** Credentialed hospital physicians.
*   **How Assigned:** Provisioned by the Administrator via the hospital operations web portal.
*   **Coexistence:** No. A Doctor role cannot coexist with other operational roles (e.g. Pharmacist, Lab Staff) to enforce separation of duties.

### 3. Nurse (NS)
*   **Description:** Clinical support staff managing OPD triage vital collections and IPD admissions, bed allocation, and discharges.
*   **Who Holds It:** Ward and clinic nursing personnel.
*   **How Assigned:** Provisioned by the Administrator via the web portal.
*   **Coexistence:** No. A Nurse role cannot coexist with Doctor, Pharmacist, Lab Staff, or Billing Officer.

### 4. Receptionist (RC)
*   **Description:** Front-desk administrative staff managing registrations, scheduling, and queue token generation.
*   **Who Holds It:** Front desk receptionist staff.
*   **How Assigned:** Provisioned by the Administrator via the web portal.
*   **Coexistence:** No. A Receptionist role cannot coexist with clinical, billing, or pharmacy roles.

### 5. Lab Staff (LS)
*   **Description:** Lab technicians processing diagnostic test orders and uploading digital PDF reports.
*   **Who Holds It:** Laboratory technicians.
*   **How Assigned:** Provisioned by the Administrator via the web portal.
*   **Coexistence:** No. A Lab Staff role cannot coexist with Doctor, Pharmacist, or Billing roles.

### 6. Pharmacist (PH)
*   **Description:** Pharmacy personnel dispensing medications and managing local stock inventory.
*   **Who Holds It:** Registered hospital pharmacy staff.
*   **How Assigned:** Provisioned by the Administrator via the web portal.
*   **Coexistence:** No. A Pharmacist role cannot coexist with Doctor, Nurse, Lab Staff, or Billing roles.

### 7. Billing Officer (BO)
*   **Description:** Financial operations personnel processing invoices and manual claims.
*   **Who Holds It:** Financial accounts department staff.
*   **How Assigned:** Provisioned by the Administrator via the web portal.
*   **Coexistence:** No. A Billing Officer role cannot coexist with clinical or clinical-support roles.

### 8. Administrator (AD)
*   **Description:** Operational manager configuring settings, staff profiles, and monitoring hospital KPIs.
*   **Who Holds It:** Hospital management team.
*   **How Assigned:** Provisioned by the Super Admin via the web portal.
*   **Coexistence:** Yes, with Super Admin. Cannot coexist with Doctor, Nurse, or Pharmacist roles.

### 9. Super Admin (SA)
*   **Description:** System platform owner managing system-wide variables, global constants, and platform roles.
*   **Who Holds It:** IT system engineers.
*   **How Assigned:** Direct seeding in the database or command-line console provisioning.
*   **Coexistence:** Yes, with Administrator. Cannot coexist with any clinical or operational staff roles.

---

## 2. Permission Matrix

Legend: ✅ Allowed | ❌ Denied | ⚠️ Conditional (Defined in Section 3)

| Resource · Action | Patient | Doctor | Receptionist | Nurse | Lab Staff | Pharmacist | Billing Officer | Administrator | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Patient Profile — Create** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Patient Profile — Read** | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Patient Profile — Update** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Patient Profile — Delete** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Appointment — Create** | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Appointment — Read** | ⚠️ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Appointment — Update/Cancel** | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Queue Token — Create** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Queue Token — Read** | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Queue Token — Update (Triage/Call)** | ❌ | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vital Signs — Create/Update** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vital Signs — Read** | ⚠️ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Consultation Records — Create** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Consultation Records — Read** | ⚠️ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Consultation Records — Update/Delete** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Prescriptions — Create** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Prescriptions — Read** | ⚠️ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Prescriptions — Update/Fulfill** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Lab Orders — Create** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Lab Orders — Read** | ⚠️ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Lab Orders — Update (Workflow)** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Lab Reports (PDF) — Upload/Create** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Lab Reports (PDF) — Read** | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Lab Reports (PDF) — Delete** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Stock Inventory — Read** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Stock Inventory — Update/Adjust** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Invoices / Bills — Create** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Invoices / Bills — Read** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Invoices / Bills — Update/Pay** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Insurance Claims — Create** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Insurance Claims — Read** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Insurance Claims — Update** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **AI Symptom Chat — Interact** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Lab Explainer — Create/Read** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Scribe Audio — Upload/Dictate** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Scribe Notes — Read/Accept** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs — Read** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **User/Staff Accounts — Create/Update** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **User/Staff Accounts — Disable** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Platform Configurations — Read/Update** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Conditional Permission Definitions

### CP-01: Patient Profile — Read (Patient)
*   **Condition:** A patient can read only their own profile record.
*   **Enforcement Layer:** Service Layer & Database (queries parameterized to filter by current authenticated user's `patient_id` from the Firebase session token).

### CP-02: Appointment — Create (Patient)
*   **Condition:** A patient can book appointments only for themselves.
*   **Enforcement Layer:** Service Layer (verifies the patient ID in the request body matches the authenticated `patient_id` from the token).

### CP-03: Appointment — Read (Patient)
*   **Condition:** A patient can view only their own scheduled appointments.
*   **Enforcement Layer:** API Gateway & Service Layer (filters search results to return records where `patient_id` matches the session credential).

### CP-04: Appointment — Update/Cancel (Patient)
*   **Condition:** A patient can reschedule or cancel their own appointments up to exactly 2 hours before the scheduled time slot.
*   **Enforcement Layer:** Service Layer (validates user ownership and checks if the current database timestamp is >= 2 hours prior to the appointment slot start time).

### CP-05: Queue Token — Read (Patient)
*   **Condition:** A patient can view only their own active queue tokens.
*   **Enforcement Layer:** Service Layer (restricts SELECT queries to return token data linked to the caller's active `patient_id`).

### CP-06: Queue Token — Update (Doctor)
*   **Condition:** A doctor can only call or update tokens assigned to their own queue roster.
*   **Enforcement Layer:** Service Layer (checks that the token's assigned `doctor_id` matches the authenticated physician's `doctor_id`).

### CP-07: Vital Signs — Read (Patient)
*   **Condition:** A patient can read vital records captured only during their own check-in triage.
*   **Enforcement Layer:** Service Layer (validates record ownership).

### CP-08: Consultation Records — Read (Patient)
*   **Condition:** A patient can read only their own historical consultations.
*   **Enforcement Layer:** Service Layer & Database (enforced via row-level security).

### CP-09: Consultation Records — Read (Doctor)
*   **Condition:** A doctor can read patient consultation records only if the patient has given active consent or has checked in with an active appointment for that doctor today.
*   **Enforcement Layer:** Service Layer (queries the `Patients` table `consent_flag` or checks for an active `QueueToken` today linked to the doctor's ID).

### CP-10: Prescriptions — Read (Patient)
*   **Condition:** A patient can read only prescriptions issued under their own UHID.
*   **Enforcement Layer:** Service Layer & Database.

### CP-11: Lab Orders — Read (Patient)
*   **Condition:** A patient can read only lab orders requested under their own UHID.
*   **Enforcement Layer:** Service Layer.

### CP-12: Lab Reports (PDF) — Read (Patient)
*   **Condition:** A patient can read only lab reports matching their own UHID.
*   **Enforcement Layer:** API Gateway & Service Layer (generates a temporary, cryptographically signed download URL for the target PDF, checking ownership first).

### CP-13: Lab Reports (PDF) — Read (Doctor)
*   **Condition:** A doctor can read reports only for patients who have given active consent or have active appointments with them.
*   **Enforcement Layer:** Service Layer (validates consent/active token matches doctor ID).

### CP-14: Lab Reports (PDF) — Read (Nurse)
*   **Condition:** A nurse can read reports only for patients currently admitted to their ward (IPD) or checked in for active OPD triage.
*   **Enforcement Layer:** Service Layer (queries the database `Admissions` table to verify current status is "Admitted" or checks active check-in token).

### CP-15: Invoices / Bills — Read (Patient)
*   **Condition:** A patient can read only invoices issued to their own UHID.
*   **Enforcement Layer:** Service Layer.

### CP-16: Insurance Claims — Read (Patient)
*   **Condition:** A patient can read only claims logged under their own policy details.
*   **Enforcement Layer:** Service Layer.

### CP-17: AI Lab Explainer — Create/Read (Patient)
*   **Condition:** A patient can run the AI summary explainer only on PDF reports they own.
*   **Enforcement Layer:** Service Layer (verifies ownership of report record before routing document contents to the Gemini API wrapper service).

---

## 4. Ownership Rules

### Creator Ownership
*   **Clinical Records (`Consultations`, `Prescriptions`, `Reports`, `QueueTokens`, `Invoices`):** The Patient (represented by their UHID) is the primary owner of the record. The creating staff member (e.g. Doctor, Nurse, Lab Staff) is recorded as the permanent "Author" in the audit fields.
*   **Inventory Logs:** The hospital owns the stock log; the executing Pharmacist is recorded as the modifier.

### Transfer Conditions
*   Clinical records (Consultation notes, diagnoses, prescriptions) cannot have their ownership transferred. They are permanently locked to the original patient UHID.
*   Bed allocations (in `Admissions` records) can be transferred between beds by the Nurse. This action updates the `bed_id` field and writes a log to the database and audit trail.

### Shared Ownership
*   Shared ownership is not permitted. Records have single-patient ownership with shared *read* access granted to attending clinical staff (Doctors/Nurses) dynamically under active consent or active admission rules.
*   Shared *write* access is denied. Consultation notes and prescriptions can only be created/modified by the authoring Doctor.

---

## 5. Role Assignment and Escalation

### Role Granting
*   **Patient Role:** Automatically self-assigned upon Firebase SMS authentication. Hospital staff cannot grant the Patient role.
*   **Staff Roles (Doctor, Nurse, Receptionist, Lab Staff, Pharmacist, Billing Officer, Administrator):** Can only be granted by users possessing the `Administrator` role.
*   **Administrator Role:** Can only be granted by the `Super Admin`.
*   **Super Admin Role:** Fixed at system deployment; can only be provisioned directly in the database (or via console backend keys), not via the standard web UI.

### Role Revocation
*   **Staff Roles:** Can only be disabled (revoked) by the `Administrator`.
*   **Administrator Role:** Can only be revoked by the `Super Admin`.

### Break-Glass Mechanism
*   *Trigger:* In emergency situations where a patient is unconscious or unable to give consent, a Doctor can click a "Break Glass" button in the Consultation Workspace.
*   *Process:*
    1.  The system requires the Doctor to enter a text justification for the override before displaying the patient's restricted records.
    2.  The action is logged in `AuditLogs` as a `CRITICAL_EMERGENCY_OVERRIDE` event.
    3.  The system automatically sends an SMS notification to the patient's emergency contact and triggers an automated email notification to the hospital Administrator for mandatory manual compliance review within 24 hours.

---

## 6. Enforcement Layer Map

For sensitive operations, enforcement occurs across multiple security boundaries:

### 1. Operation: Accessing Patient PHI (Clinical Notes, Lab Reports)
*   **API Gateway Layer:** Validates incoming session credentials and routes requests.
*   **Client App Layer:** Hides clinical buttons and elements if the user's role is not clinical (Doctor/Nurse).
*   **Service Layer:** Checks the database for the patient's `consent_flag` or verifies an active `QueueToken` today matching the doctor's ID.
*   **Database Layer:** Applies Parameterized Queries restricting row retrieval, and Row-Level Security (RLS) policies enforce partition bounds.

### 2. Operation: Generating Prescriptions
*   **API Gateway Layer:** Blocks any POST requests to `/api/prescriptions` from non-Doctor tokens.
*   **Service Layer:** Validates doctor ID from session, verifies prescription items exist in the active `Medicines` table, and enforces structured formulary constraints.
*   **Database Layer:** Foreign key constraints verify the associated `consultation_id` exists and is owned by the submitting doctor.

### 3. Operation: Fulfilling Prescriptions
*   **API Gateway Layer:** Restricts POST requests to `/api/prescriptions/{id}/fulfill` to the "Pharmacist" role.
*   **Service Layer:** Validates that the target prescription is in "Pending" status and that inventory levels are sufficient.
*   **Database Layer:** Employs database transactions to commit the decrement to the `InventoryLogs` table, blocking execution if stock levels fall below zero (check constraint).

### 4. Operation: Accessing Audit Logs
*   **API Gateway Layer:** Blocks GET requests to `/api/audit-logs` from any user lacking the "Administrator" role.
*   **Service Layer:** Inspects querying parameters and limits log views to the administrator's authorized scope.
*   **Database Layer:** Restricts access to log tables using isolated database views accessible only via the admin service connection.
