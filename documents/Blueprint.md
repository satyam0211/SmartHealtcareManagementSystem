# Smart Healthcare Intelligence Platform
## Master Product Blueprint v1.0

## Executive Vision

Build a Healthcare Intelligence Platform that digitizes, automates, and optimizes the complete patient journey—from registration to recovery—while providing operational intelligence for hospital management and AI-assisted workflows for clinical staff.

---

# Part 1: Foundation

## 1. Product Overview
- Product Type: Hospital Information System (HIS)
- Platforms:
  - Android App (Patient) - Online-only with local UI cache
  - Android App (Doctor) - Online-only with local UI cache
  - Web Portal (Admin, Reception, Lab, Pharmacy, Billing)
- Goal:
  - Unified healthcare operations
  - Digital medical records
  - AI-assisted clinical workflows
  - Operational analytics

## 2. Problem Statement
### Patients
- Long waiting times
- Fragmented records
- Lost prescriptions
- Poor follow-up tracking

### Doctors
- Excessive documentation
- Incomplete patient history
- Inefficient workflows

### Hospitals
- Operational inefficiencies
- Revenue leakage
- Limited visibility into performance

---

# Part 2: Core Principles

## 3. Patient First
Every workflow should reduce patient effort.

## 4. Privacy by Design
Patient data is confidential and protected.

## 5. AI Assistive Only
AI supports decisions but never replaces medical professionals.

## 6. Operational Excellence
Measure and optimize every hospital workflow.

---

# Part 3: User Ecosystem

## 7. User Roles
### Patient
- Book appointments
- Access reports
- Manage health records (read-only consent log)
- Track queue status online

### Doctor
- Consult patients
- Create prescriptions (standard formulary)
- Review patient history
- Dictate session summaries for AI Scribe

### Receptionist
- Patient registration (UHID creation)
- Appointment scheduling
- Queue token generation and waitlist management

### Nurse
- Record patient vital signs during triage (OPD)
- Manage inpatient admission records, bed allocations, and room assignments (IPD)
- Log inpatient status changes and coordinate patient discharge

### Lab Staff
- Process test orders
- Upload digital reports

### Pharmacist
- View and fulfill digital prescriptions
- Manage local stock inventory (manual adjustments)

### Billing Officer
- Process consultation, lab, and procedure bills
- Log and track manual insurance claims

### Administrator
- Manage hospital-wide settings, departments, and staff accounts
- Monitor analytics dashboard

### Super Admin
- Manage platform-wide configuration settings and global parameters (multi-hospital metadata management is deferred to Phase 2)

---

# Part 4: Patient Lifecycle Engine

## 8. Lifecycle

Registration
→ Appointment
→ Queue Management & Token Call
→ Consultation
→ Diagnosis & Prescription
→ Lab Testing (optional)
→ Pharmacy Dispensing (optional)
→ Billing & Claim Logging
→ Follow-up Scheduling
→ Recovery & Care Plan Close

---

# Part 5: Registration & Identity

## 9. UHID System
Unique Hospital Identifier for every patient.

Example:
UHID-2026-000001

## 10. Patient Profile
### Personal
- Name
- DOB
- Gender
- Address

### Medical
- Blood Group
- Allergies
- Chronic Conditions

### Emergency
- Contact
- Notes

---

# Part 6: OPD Management

## 11. Appointment Management
- Book
- Reschedule
- Cancel
- Waitlist

## 12. Queue Management
- Token generation
- Live queue tracking (via 30s HTTP polling, not WebSockets, to avoid server overhead)
- Estimated waiting time (calculated dynamically as `(Patients Ahead) * 15 minutes`)

## 13. Consultation Workspace
- Patient history
- Notes
- Diagnosis
- Prescriptions (standard drug formulary search)
- Lab requests

---

# Part 7: IPD Management

## 14. Admission Management
- Admission records
- Room assignment
- Bed allocation

## 15. Bed Management
- ICU
- General Ward
- Private Rooms

## 16. Discharge Management
- Summary generation
- Billing closure
- Follow-up scheduling

---

# Part 8: Doctor Operating System

## 17. Doctor Dashboard
- Today's schedule
- Pending reports
- Follow-ups

## 18. Digital Prescription System
- Standard drug formulary search
- Dosage (structured fields)
- Duration
- Instructions

## 19. Treatment Progress Tracking
- Basic text progress notes
- Patient recovery status dropdown (e.g., Active, Recovered, Referred)

---

# Part 9: Laboratory Management

## 20. Lab Orders
Doctor-generated test requests.

## 21. Lab Workflow
Requested
→ Sample Collected
→ Processing
→ Completed
→ Uploaded

## 22. Report Repository
Permanent patient report archive.

---

# Part 10: Pharmacy Management

## 23. Prescription Fulfillment
View and fulfill doctor prescriptions digitally.

## 24. Inventory Tracking
- Medicine stock (standalone manual stock adjustment)
- Expiry tracking
- Reorder alerts
- *Note: External third-party pharmacy API integrations are out of scope for Phase 1.*

---

# Part 11: Billing & Insurance

## 25. Billing Engine
- Consultation charges
- Lab charges
- Procedure charges
- Invoice generation

## 26. Insurance Processing
- Manual claim logging (input claim details, policy number)
- Status tracking (Pending, Approved, Rejected)
- *Note: Direct automated insurance network/clearinghouse integrations are out of scope for Phase 1.*

## 27. Revenue Tracking
- Daily
- Monthly
- Department-wise

---

# Part 12: AI Layer

## 28. AI Symptom Assistant (Powered by Google Gemini API)
- Patient-facing symptom collection chatbot.
- Specialist recommendation (e.g., suggest consulting a Cardiologist).
- Urgency assessment triage (categorizes urgency as Low, Medium, High).
- *Boundary Guardrail*: Prompts must include hardcoded safety disclaimers stating that this is not a diagnostic tool and patients should seek immediate human medical care for emergencies.

## 29. AI Lab Report Explainer (Powered by Google Gemini API)
Convert uploaded PDF medical reports into simplified, patient-friendly summaries.

## 30. AI Medical Scribe (Powered by Google Gemini API)
- Convert doctor voice dictation (uploaded audio summary of the consultation) into structured clinical notes.
- *Note: Ambient multi-speaker conversation recording is out of scope for Phase 1.*

## 31. AI Risk Detection
Flag:
- High-risk patient profiles based on medical history
- Critical lab test values
- Readmission risks

## 32. AI Governance & Triage Boundary
AI Can:
- Explain medical terms
- Summarize patient notes/reports
- Suggest potential specialties

AI Cannot:
- Formulate a clinical diagnosis
- Prescribe medications or dosages
- Bypass or replace human clinician approval

---

# Part 13: Analytics & Intelligence

## 33. Executive Dashboard
- Revenue
- Occupancy
- Waiting times
- Patient volume

## 34. Doctor Analytics
- Utilization
- Consultation volume

## 35. Department Analytics
- Performance
- Revenue
- Growth

## 36. Predictive Analytics
- Bed demand forecasting
- Staffing forecasts
- Inventory forecasts

---

# Part 14: Security & Compliance

## 37. Authentication
- Patients: SMS OTP (using Firebase Authentication).
- Doctors & Staff: Email + Password with Session management and Role-Based Access Control (RBAC).

## 38. Encryption & Compliance
- Data at rest (AES-256)
- Data in transit (TLS 1.3)
- HIPAA and local data protection compliance auditing

## 39. Audit Trail
Track:
- Who accessed records
- What changed (pre- and post-modification logs)
- When changes occurred

## 40. Consent Management
- Simple global opt-in/opt-out consent form logged at registration.
- *Medical Retention Constraint*: In accordance with medical record retention regulations, finalized prescriptions, lab reports, and doctor clinical notes cannot be deleted or edited by patients.

---

# Part 15: Platform Architecture

## 41. Core Services
- User Service (Auth & Session)
- Patient Service
- Appointment & Queue Service
- Lab Service
- Pharmacy & Inventory Service
- Billing & Claims Service
- AI Service (Wrapper for Gemini API)

## 42. Database Entities (Relational Database Schema)
- `Users` (Staff accounts, metadata)
- `Patients` (Personal info, consent flag, UHID)
- `Doctors` (Specialties, roster info)
- `Appointments` (Date, status, time slot)
- `QueueTokens` (Token number, patient ID, status, estimated wait time)
- `Consultations` (Doctor ID, patient ID, notes, clinical summary)
- `Prescriptions` (Consultation ID, medicine list, instructions)
- `Medicines` (Formulary of drugs available)
- `InventoryLogs` (Stock count, reorder alerts, expiry date)
- `Rooms` & `Beds` (Room number, ward type, availability)
- `Admissions` (Patient ID, bed ID, admission date, discharge status)
- `Reports` (Lab orders, PDF links, status)
- `Invoices` & `Payments` (Invoice amount, items, payment status, claims log)
- `AuditLogs` (Action, user ID, timestamp, entity changed)

---

# Part 16: Future Roadmap

## Phase 2
- Telemedicine
- Online Payments
- Video Consultation

## Phase 3
- Pharmacy Integration
- Insurance Network Integration

## Phase 4
- Wearable Devices
- Remote Monitoring

## Phase 5
- Predictive Healthcare Intelligence
- Population Health Analytics

---

# Part 16.5: Scope Boundaries

## 43. Out of Scope for Phase 1
The following features are explicitly out of scope for Phase 1:
- **Online Payments**: Direct payment gateway integrations (deferred to Phase 2).
- **Telemedicine & Video Consultation**: Live virtual doctor calls (deferred to Phase 2).
- **Automated Pharmacy Integrations**: External drug databases/APIs (deferred to Phase 3).
- **Automated Insurance Networks**: Clearinghouse integrations and automated online claiming (deferred to Phase 3).
- **Ambient Scribing**: Real-time consultation audio recordings/transcription (only voice dictation is supported).
- **Offline Sync Engine**: Full offline database synchronization for mobile clients (mobile apps are online-only with local UI caching).
- **HR & Staff Roster Planning**: Dynamic scheduling and staff shift rotations.

---

# Part 17: Success Criteria

## Technical
- Secure data access
- Graceful handling of network timeouts and API errors (online-only apps cached locally for UI navigation)
- High availability

## Clinical
- Faster consultations
- Better record accessibility

## Operational
- Reduced wait times
- Improved revenue visibility

## Patient
- Better experience
- Improved follow-up compliance
