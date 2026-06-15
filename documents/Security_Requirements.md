# Security Requirements Document
## Smart Healthcare Intelligence Platform v1.0

---

## 1. Threat Model

### Adversary List
The system faces active threat vectors from the following adversaries:
1.  **External Cybercriminals / Ransomware Groups:** Motivated by financial gain. They attempt to exfiltrate RESTRICTED patient records (PII/PHI) to sell on the dark web or encrypt database storage volumes to extort ransom.
2.  **Malicious Insiders (Disgruntled Staff):** Motivated by personal grievances or financial fraud. They attempt to bypass role boundaries to view VIP patient records, modify inventory logs, or falsify billing/claims.
3.  **Compromised / Rogue Patients:** Motivated by convenience or illicit access. They attempt to intercept SMS codes, spoof other patients' profiles, alter prescription records to obtain controlled substances, or bypass invoicing.
4.  **Competitors / Corporate Spies:** Motivated by market intelligence. They attempt to query hospital analytics, bed demand forecasts, or department revenue to gain an competitive advantage.

### High-Value Targets
Targets are ranked by organizational impact if compromised:
1.  **Relational Database (`Consultations`, `Prescriptions`, `Reports`):** Contains clinical records and diagnostic summaries. Loss or disclosure leads to patient safety risks, reputational damage, and severe legal/compliance penalties.
2.  **Staff Authentication Credentials & Active Sessions:** Grants clinical and administrative access. Compromise bypasses all role-based constraints.
3.  **Billing & Insurance Claims Logs:** Contains policy details and payment transactions. Compromise leads to financial fraud and loss.
4.  **AI Integration Gateway (Google Gemini Wrapper):** Used for scribing and triage. Vulnerable to prompt injection and denial-of-service.

### Major Component Threats (STRIDE Analysis)

For each major system component, threats are mapped and rated:

| Component | S | T | R | I | D | E | Risk Rating |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth Service** | Yes | Yes | Yes | Yes | Yes | Yes | **CRITICAL:** Controls the keys to the kingdom. If authentication mechanisms are bypassed, all role restrictions fail. |
| **API Gateway/Backend** | Yes | Yes | Yes | Yes | Yes | Yes | **HIGH:** Exposes core endpoints. Vulnerable to BOLA (Broken Object Level Authorization) and injection. |
| **Relational Database** | No | Yes | Yes | Yes | Yes | Yes | **CRITICAL:** Stores all persistent patient data. Direct exfiltration results in catastrophic compliance violations. |
| **Mobile Client (Patient/Doctor)** | Yes | Yes | No | Yes | No | No | **HIGH:** Local caches can be targeted on rooted devices. SMS OTP codes are vulnerable to interception. |
| **Web Admin Portal** | Yes | Yes | Yes | Yes | Yes | Yes | **HIGH:** Primary staff interface. Vulnerable to Session Hijacking, Cross-Site Scripting (XSS), and CSRF. |

#### Specific Component Threats & Scenarios by User Role:
*   **Auth Service:**
    *   *Spoofing:* An attacker spoofs a **Patient**'s SMS OTP session or a **Doctor**'s email/password authentication.
    *   *Tampering:* An attacker tampers with JWT role claims to elevate privileges.
    *   *Elevation of Privilege:* A compromised **Receptionist** session modifies role parameters to gain **Administrator** privileges.
*   **API Gateway/Backend:**
    *   *Information Disclosure:* An attacker exploits BOLA (IDOR) to query consultation notes belonging to other patients.
    *   *Elevation of Privilege:* A **Patient** calls doctor-only prescription writing endpoints.
*   **Relational Database:**
    *   *Tampering:* SQL Injection attacks modifying clinical records or erasing the `AuditLogs` table.
    *   *Information Disclosure:* Reading raw unencrypted patient tables directly from compromised disk storage.
*   **Mobile Client:**
    *   *Information Disclosure:* An attacker extracts unencrypted cached diagnostic PDF files from the local storage of a **Doctor**'s Android device.
    *   *Spoofing:* Reverse-engineering the Patient App binary to run a modified client that bypasses client-side validation checks.
*   **Web Admin Portal:**
    *   *Tampering:* A compromised **Lab Staff** account uploads a malicious file acting as a PDF report to execute script injection (XSS) in a doctor's browser.
    *   *Information Disclosure:* A **Billing Officer** or **Pharmacist**'s active browser session is hijacked due to weak session cookie protections.
    *   *Repudiation:* A malicious **Super Admin** edits platform-wide settings and erases the audit logs to hide their actions.
    *   *Tampering:* A malicious **Nurse** alters bed assignments or IPD records to disrupt hospital operations.

---

## 2. Authentication and Session Management

### Patient Authentication (Firebase Auth / JWT)
1.  Patients MUST authenticate using SMS OTP via Firebase Authentication.
2.  The resulting Firebase ID Token (JWT) MUST be validated cryptographically on the server on every request.
3.  JWT ID Tokens MUST expire exactly 1 hour after issuance. Patients MUST use the secure Firebase Refresh Token to obtain new ID Tokens.
4.  The server MUST validate that the JWT signing key is active and matches the current Firebase public keys fetched dynamically.

### Staff Authentication (Email/Password & Session Cookies)
1.  Staff (Doctors, Nurses, Receptionists, Pharmacists, Lab Staff, Billing Officers, Administrators, Super Admins) MUST authenticate using Email and Password.
2.  Upon successful authentication, the server MUST generate a high-entropy, random Session ID and store it in a secure session store.
3.  The Session ID MUST be transmitted to the client web browser only via an HTTP-only, Secure, SameSite=Strict cookie to prevent access by JavaScript and mitigate Cross-Site Request Forgery (CSRF).
4.  Staff sessions MUST expire after exactly 12 hours from login.
5.  An idle timeout MUST automatically invalidate the staff session and delete the cookie after exactly 15 minutes of inactivity.

### Multi-Factor Authentication (MFA)
*   **Patient:** `NOT APPLICABLE` (SMS OTP serves as the primary MFA validation).
*   **Doctor / Nurse / Lab Staff / Pharmacist / Billing Officer:** `SHOULD` require a secondary MFA step (e.g. Email OTP) if logging in from a new IP address.
*   **Administrator / Super Admin:** `MUST` require TOTP-based Multi-Factor Authentication (e.g., Google Authenticator) for all logins.

### Device Binding
1.  The Doctor Android App MUST bind active login sessions to the device's hardware fingerprint (Android ID or FCM token).
2.  The server API MUST validate that the hardware fingerprint of the incoming request matches the device fingerprint bound to the session, immediately terminating the session if a mismatch occurs.

### SQLite Cache Security
1.  Any local SQLite database (e.g., Room DB) used as a UI cache on Patient or Doctor Android devices containing RESTRICTED data MUST be encrypted using SQLCipher.
2.  The encryption key for SQLCipher MUST be generated randomly and stored securely in the Android Keystore system.

---

## 3. Authorisation

### Server-Side Enforcement
1.  The server backend MUST enforce role-based access controls (RBAC) and object-level ownership constraints on all API endpoints.
2.  Client-side UI changes (such as hiding navigation menus or buttons) MUST be used for presentation purposes only and MUST NOT be relied upon for security validation.
3.  The backend API MUST verify that the authenticated user's ID matches the resource owner's ID (e.g. Patient ID on `/api/reports/{id}`) or matches the authorized staff role.

### Behaviour on Escalation Attempt
1.  If the server detects an unauthorized request attempting to bypass role permissions, the backend MUST:
    *   Immediately reject the request and return an `HTTP 403 Forbidden` response.
    *   Log the security event in `AuditLogs` containing the user ID, client IP, requested URI, request body, and timestamp.
    *   Immediately terminate the user's active session and delete session cookies/revoke JWT refresh tokens.
    *   Trigger a high-priority alert on the Administrator console.

---

## 4. Data Security

### Data Classification Table
All system data types defined in the PRD MUST be classified as follows:

| Data Type | Classification | Definition |
| :--- | :--- | :--- |
| **Personal Profile Data** | `RESTRICTED` | Patient PII (Name, DOB, Gender, Address, Phone Number). |
| **Medical Profile Data** | `RESTRICTED` | Patient medical history (Blood Group, Allergies, Chronic Conditions). |
| **Vitals / Triage Data** | `RESTRICTED` | Patient vital signs (BP, Heart Rate, Temp, Weight). |
| **Consultation Data** | `RESTRICTED` | Doctor clinical consultation notes and diagnoses. |
| **Prescription Data** | `RESTRICTED` | Prescribed drugs, dosages, and instructions. |
| **Lab Reports** | `RESTRICTED` | Diagnostic lab test orders and raw PDF results. |
| **Insurance Claim Data** | `RESTRICTED` | Insurance policy numbers, claim amounts, and notes. |
| **Audit Trail Logs** | `RESTRICTED` | Security change histories, pre/post states. |
| **AI Dictation Audio Files** | `RESTRICTED` | Uploaded audio summary records of consultations. |
| **AI Symptom Assistant Chats** | `RESTRICTED` | Patient triage conversations and symptoms details. |
| **Appointment Details** | `CONFIDENTIAL` | Dates, scheduled times, and doctor associations. |
| **Queue Tokens** | `CONFIDENTIAL` | Token sequences mapped to patient IDs and clinics. |
| **Billing / Invoice Data** | `CONFIDENTIAL` | Itemized charges and invoice payments status. |
| **Inventory Logs** | `INTERNAL` | Medicine stock counts and reorder thresholds. |
| **Global Platform Config** | `PUBLIC` | Public doctor directories, lists of departments. |

### Encryption at Rest
1.  All data classified as `CONFIDENTIAL` or `RESTRICTED` MUST be encrypted at the storage volume level using AES-256.
2.  Data fields classified as `RESTRICTED` (such as Patient Name, DOB, Allergies, Diagnoses, Prescriptions, and Insurance details) MUST be encrypted at the application layer before database writes using AES-256-GCM.
3.  Encryption keys for RESTRICTED fields MUST be managed by an external Key Management Service (KMS) with monthly key rotation policies.

### Encryption in Transit
1.  All network communications between clients (mobile, web) and the server backend MUST require HTTPS using TLS 1.3 as the minimum protocol version.
2.  The Patient and Doctor Android mobile applications MUST implement Certificate Pinning (SSL Pinning) against the server's public key certificate.

### PII Fields, Retention, and Deletion
1.  PII Fields include: Patient Name, Date of Birth, Address, Phone Number, and Policy Number.
2.  In accordance with medical record retention regulations, all patient PII/PHI records MUST be retained for a minimum of 10 years from the date of the last patient encounter.
3.  If deletion is requested and legally permitted, the database records MUST be hard-deleted from all active tables.
4.  If retention regulations prevent hard deletion, the patient's individual KMS key MUST be destroyed (cryptographic shredding), rendering the retained historical clinical data permanently unreadable.

---

## 5. Input Validation

### Validation Rules by Input Type
1.  **String Inputs (Names, Text Fields):** MUST be validated against a strict whitelist regex (e.g., `^[a-zA-Z\s\-\']{1,100}$` for names) to reject HTML tags, SQL symbols, and script injection payloads.
2.  **Integer and Decimal Inputs (Vitals, Counts):** MUST be validated as numeric types and checked against defined ranges (e.g. Heart Rate: 30 to 250 bpm; Temp: 90.0°F to 110.0°F).
3.  **Email Addresses:** MUST conform to standard RFC 5322 syntax validation.
4.  **File Uploads (PDF Reports and Audio Summaries):**
    *   The server MUST validate the file format using magic-byte headers, restricting uploads to `application/pdf` for reports and `audio/mpeg` or `audio/wav` for scribe audio.
    *   File uploads MUST be parsed for size limits, rejecting files > 10MB (for PDFs) and > 20MB (for Audio).
    *   All uploaded files MUST be scanned for malware in a isolated sandbox before write persistence.

### Attack Surface
1.  All user-controlled inputs (including query string parameters, JSON payloads, uploaded file headers, and patient symptom chat inputs) MUST be validated on entry at the server backend.
2.  All outputs rendered in the web portals or mobile applications MUST be HTML-escaped to prevent Cross-Site Scripting (XSS).
3.  All database queries MUST use parameterized inputs or Object-Relational Mapping (ORM) query parameters to prevent SQL Injection.

---

## 6. API Security

### Rate Limits
1.  Public API endpoints (e.g. Login, Triage Chat) MUST be restricted to a maximum of 10 requests per minute per IP address.
2.  Authenticated API endpoints (Appointments, Prescriptions) MUST be rate-limited to 60 requests per minute per authenticated user session.
3.  The Live Queue Polling API MUST enforce a rate limit of exactly 2 requests per 30 seconds per authenticated user, preventing malicious UI loops or script attacks from flooding the backend.

### Brute Force Protection
1.  Staff authentication endpoints MUST implement account lockout policies.
2.  The server MUST lock a staff account for exactly 15 minutes after 5 consecutive failed login attempts.
3.  IP-based rate limits MUST trigger CAPTCHA or absolute block limits if auth failures cross 20 requests per IP per minute.

### Response Sanitisation
1.  API responses targeting the **Patient App** MUST NOT contain any internal staff IDs, passwords, audit logs, or other patients' data.
2.  API responses targeting **Doctors and Staff** MUST NOT expose user password hashes or server-side private KMS encryption keys.
3.  API responses targeting **Lab Staff and Pharmacists** MUST NOT include clinical consultation summaries, diagnoses, or invoice card details.

---

## 7. Dependency Security

### Scan Cadence
1.  Static Application Security Testing (SAST) and software composition analysis (SCA) dependency scans MUST be executed automatically on every pull request.
2.  A full dependency vulnerability scan of the main code branches MUST run on a daily recurring schedule.

### CVE Response SLA
1.  Vulnerabilities discovered in third-party dependencies MUST be patched and deployed within the following SLAs based on CVSS v3 score:
    *   **CRITICAL (CVSS >= 9.0):** MUST be patched and deployed to production within 24 hours of disclosure.
    *   **HIGH (CVSS 7.0 - 8.9):** MUST be patched and deployed within 72 hours of disclosure.
    *   **MEDIUM (CVSS 4.0 - 6.9):** SHOULD be patched and deployed within 14 days.
    *   **LOW (CVSS < 4.0):** MAY be resolved in the next scheduled feature release.

---

## 8. Logging and Incident Response

### Event Logging Requirements
1.  The server backend MUST log the following events to the secure `AuditLogs` table:
    *   Successful and failed authentication attempts (IP address, user ID, timestamp).
    *   Read access to any patient's `RESTRICTED` data.
    *   Modifications to patient profiles, clinical notes, prescriptions, and lab orders (capturing the field states before and after change).
    *   Authorization failures (HTTP 403) and failed input validation attempts.
    *   KMS decryption errors.

2.  The application MUST NOT log the following details:
    *   Plaintext user passwords or security answers.
    *   Active session tokens (JWTs, refresh tokens, session cookies).
    *   Unencrypted PII or PHI patient details.

### Alerting Thresholds
1.  The system MUST raise a critical administrative alert if:
    *   A single IP address triggers more than 3 failed authentication events within 1 minute.
    *   A single user account triggers more than 5 authorization block events (HTTP 403) within 10 minutes.
    *   A database execution block occurs due to invalid query syntax (potential SQLi bypass attempt).

### Breach Notification Obligations
1.  In the event of a confirmed security breach exposing `RESTRICTED` patient records, the hospital administration MUST notify the national data protection authority and all affected patients within 72 hours, in compliance with HIPAA and local data protection regulations.
