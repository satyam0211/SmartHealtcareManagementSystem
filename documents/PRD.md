# Product Requirements Document (PRD)
## Smart Healthcare Intelligence Platform v1.0

---

## 1. Executive Summary

### Problem Statement
The current healthcare delivery ecosystem suffers from structural inefficiencies affecting all major participants:
*   **Patients:** Face long clinic wait times, fragmented medical records, lost physical prescriptions, and a complete lack of transparent follow-up tracking.
*   **Doctors:** Face excessive documentation overhead, incomplete historical patient records, and inefficient consult room workflows.
*   **Hospitals:** Suffer from operational bottlenecks, revenue leakage across departments, and a lack of real-time visibility into overall hospital performance.

### Solution
The Smart Healthcare Intelligence Platform (SHIP) is a unified Hospital Information System (HIS) designed to digitize, automate, and optimize the complete patient lifecycle. The platform features three core user touchpoints:
1.  **Patient Android App:** For online booking, live queue tracking, and report retrieval.
2.  **Doctor Android App:** For schedules, digital history review, and voice-dictated clinical summary parsing.
3.  **Hospital Operations Web Portal:** For administrators, receptionists, lab technicians, pharmacists, and billing officers.

### Why Now
By introducing Google Gemini-powered AI clinical workflows (automated medical scribing, symptom triaging, and report explanation) alongside structured OPD/IPD operations and unified billing, SHIP optimizes clinical time and stops hospital revenue leakage while directly improving patient access and convenience.

---

## 2. User Personas

### Patient
*   **Description:** Individuals seeking outpatient or inpatient medical services who interact primarily via the Patient Android App.
*   **Job-to-be-Done:** Quickly find doctor availability, schedule appointments, view live waiting queue status remotely, and access digital lab reports.
*   **Pain Points:** Time wasted waiting in crowded waiting areas; losing physical paper prescriptions and lab printouts.
*   **Success Criteria:** Appointment booked in < 2 minutes; live wait time updates allow arriving at the clinic right when their token is called.

### Doctor
*   **Description:** Clinical professionals providing consultations, diagnostic assessments, and treatments in OPD and IPD.
*   **Job-to-be-Done:** Review patient histories, document clinical consultations, generate digital prescriptions, and order diagnostic tests.
*   **Pain Points:** Documenting consultations takes longer than the actual patient interaction; missing historical lab reports lead to repeat tests.
*   **Success Criteria:** Voice dictation translates to a complete clinical note draft in < 15 seconds; patient's full medical history is visible in a single tab.

### Receptionist
*   **Description:** Front-desk administrative staff executing patient check-ins and registration.
*   **Job-to-be-Done:** Register new patients, generate Unique Hospital Identifiers (UHIDs), book/modify appointments, and issue queue tokens.
*   **Pain Points:** Manual errors in data entry; double-booked time slots; handling patient complaints about opaque wait times.
*   **Success Criteria:** Patient registered and queue token generated in < 3 minutes; zero double-booked slots.

### Nurse
*   **Description:** Clinical support staff executing OPD triage and IPD ward management.
*   **Job-to-be-Done:** Record patient vital signs during triage; manage ward/bed allocations; track inpatient admission/discharge status.
*   **Pain Points:** Manually tracking bed availability on whiteboards; lagging communication during patient discharge.
*   **Success Criteria:** Bed occupancy updates instantly upon admission/discharge; triage vitals populate doctor's workspace in real-time.

### Lab Staff
*   **Description:** Diagnostics lab technicians.
*   **Job-to-be-Done:** Process doctor-generated test orders, collect samples, and upload digital PDF reports.
*   **Pain Points:** Misplaced physical order slips; no simple tool to communicate order status updates to doctors.
*   **Success Criteria:** Digital lab orders received instantly; PDF report upload immediately notifies ordering doctor and patient.

### Pharmacist
*   **Description:** Pharmacy dispensing and inventory staff.
*   **Job-to-be-Done:** Review and fulfill digital prescriptions; track local stock levels; manage expiries.
*   **Pain Points:** Deciphering illegible handwritten prescriptions; medicine stockouts; manually searching for expired drug batches.
*   **Success Criteria:** Immediate receipt of digital prescriptions; automatic stock decrement upon dispensing; automated reorder/expiry alerts.

### Billing Officer
*   **Description:** Financial operations personnel.
*   **Job-to-be-Done:** Aggregate consultation, lab, and procedure charges; generate invoices; log/track manual insurance claims.
*   **Pain Points:** Lost revenue due to unbilled services; tedious manual entry of insurance policies.
*   **Success Criteria:** Invoices automatically generated from clinical modules; manual claims tracked systematically.

### Administrator
*   **Description:** Hospital operations manager.
*   **Job-to-be-Done:** Manage departments, configure hospital settings, create staff accounts, and monitor performance analytics.
*   **Pain Points:** No real-time operational dashboard; high operational friction across departments.
*   **Success Criteria:** Real-time visibility of occupancy, wait times, and department revenues in a single dashboard.

### Super Admin
*   **Description:** Platform configuration owner.
*   **Job-to-be-Done:** Manage platform-wide system configurations, parameters, and global settings.
*   **Pain Points:** Lack of central control over global platform constants and parameters.
*   **Success Criteria:** Global platform variables and user roles configured from a single portal.

---

## 3. Feature Specifications

### Module: REG — Registration & Identity

#### F-REG-01: Patient Registration and UHID Generation
*   **Description:** Registration of new patients and generation of a Unique Hospital Identifier (UHID).
*   **User Story:** As a Receptionist, I want to register a new patient and generate a unique hospital identifier (UHID) so that they have a unified profile in the platform.
*   **Acceptance Criteria:**
    1.  The system must generate a unique, non-modifiable identifier matching the format `UHID-YYYY-XXXXXX` (where YYYY is the current calendar year and XXXXXX is a sequential 6-digit number starting at 000001).
    2.  Registration must block submission and display error messages if any of the following fields are empty: Name, Date of Birth, Gender, or Address.
    3.  Upon successful registration, the system must write the patient record to the database and display a "Registration Successful" modal containing the generated UHID.
*   **Priority:** P0
*   **Blueprint Reference:** Section 9 & 7 ("Patient registration (UHID creation)", "Unique Hospital Identifier for every patient. Example: UHID-2026-000001")
*   **Dependencies:** None

#### F-REG-02: Patient Profile Management
*   **Description:** Capturing and managing personal, medical, and emergency contact details.
*   **User Story:** As a Receptionist, I want to input and update a patient's personal, medical, and emergency contact details so that clinicians have access to comprehensive patient profiles.
*   **Acceptance Criteria:**
    1.  The profile details screen must display three distinct sections: Personal (Name, DOB, Gender, Address), Medical (Blood Group, Allergies, Chronic Conditions), and Emergency (Emergency Contact Name, Phone Number, Emergency Notes).
    2.  The "Gender" field must restrict inputs to a predefined list: Male, Female, Other.
    3.  The "Emergency Phone Number" field must validate that the input contains exactly 10 digits before allowing save.
    4.  Clinical notes, prescriptions, and lab reports must be linked to the patient's UHID and must not allow deletion by the patient.
*   **Priority:** P0
*   **Blueprint Reference:** Section 10 ("Patient Profile: Personal: Name, DOB, Gender, Address; Medical: Blood Group, Allergies, Chronic Conditions; Emergency: Contact, Notes")
*   **Dependencies:** F-REG-01

---

### Module: OPD — Outpatient Department Management

#### F-OPD-01: Appointment Scheduling (Reception)
*   **Description:** Receptionists schedule, reschedule, cancel appointments, and manage the waitlist.
*   **User Story:** As a Receptionist, I want to book, reschedule, or cancel patient appointments and manage the waitlist so that OPD schedules are organized.
*   **Acceptance Criteria:**
    1.  The scheduler must display available time slots for selected doctors based on a 15-minute interval grid.
    2.  The system must prevent double-booking: if a time slot is already booked, it must display as unavailable and reject manual bookings for that slot.
    3.  When a booking is cancelled, the system must set status to "Cancelled" in the database and release the slot immediately.
    4.  Waitlisted appointments must be displayed in a chronological list, and the system must allow a waitlisted patient to be promoted to an active slot if one becomes vacant.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 11 ("Appointment scheduling", "Appointment Management: - Book, - Reschedule, - Cancel, - Waitlist")
*   **Dependencies:** F-REG-01

#### F-OPD-02: Patient Appointment Management (Patient App)
*   **Description:** Patients book, reschedule, and cancel their appointments via the Patient App.
*   **User Story:** As a Patient, I want to book, reschedule, or cancel my appointments so that I can schedule my visits.
*   **Acceptance Criteria:**
    1.  The patient app must display available doctors, their specialties, and free time slots.
    2.  The app must allow selecting a date and time, confirming the appointment, and displaying it in a "My Appointments" section.
    3.  Patients must be able to cancel or reschedule up to 2 hours before the appointment time slot.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 11 ("Book appointments", "Appointment Management: - Book, - Reschedule, - Cancel")
*   **Dependencies:** F-SEC-01

#### F-OPD-03: Queue Token Generation
*   **Description:** Receptionists generate queue tokens for patients arriving at the clinic.
*   **User Story:** As a Receptionist, I want to generate a queue token for patients arriving at the clinic so that they are placed in the dynamic waitlist.
*   **Acceptance Criteria:**
    1.  The system must generate a sequential queue token number (e.g. T-101, T-102) linked to the patient's appointment and doctor.
    2.  The token record must include: Token Number, Patient ID (UHID), Doctor ID, Token Status (Waiting, In-Consultation, Completed, Cancelled).
    3.  Generating a token must automatically change the appointment status to "Checked-In" and append the token to the selected doctor's active queue list.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 12 ("Queue token generation and waitlist management", "Token generation")
*   **Dependencies:** F-OPD-01

#### F-OPD-04: Dynamic Live Queue Tracking
*   **Description:** Live queue tracking and wait time estimation for patients.
*   **User Story:** As a Patient, I want to view my live queue status and estimated waiting time on my mobile app so that I can manage my wait time.
*   **Acceptance Criteria:**
    1.  The Patient App must fetch the current queue status using HTTP polling at a fixed interval of exactly 30 seconds. WebSockets must not be used.
    2.  The estimated waiting time must be calculated dynamically and displayed on the app using the formula: `Estimated Wait Time = (Patients Ahead in Queue) * 15 minutes`.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 12 ("Track queue status online", "Live queue tracking (via 30s HTTP polling, not WebSockets, to avoid server overhead)", "Estimated waiting time (calculated dynamically as `(Patients Ahead) * 15 minutes`)")
*   **Dependencies:** F-SEC-01, F-OPD-03

#### F-OPD-05: Patient Vital Signs Recording (Triage)
*   **Description:** Nurses record patient vital signs during triage before consultation.
*   **User Story:** As a Nurse, I want to record vital signs during patient triage so that the consulting doctor has immediate access to current patient vitals.
*   **Acceptance Criteria:**
    1.  The triage screen must allow inputting Blood Pressure (systolic/diastolic as numbers), Heart Rate (bpm as integer), Temperature (°F or °C as decimal), and Weight (kg as decimal).
    2.  The system must save these vital signs linked to the active `QueueToken` or `Appointment` ID.
    3.  The saved vitals must immediately display in the Doctor's Consultation Workspace when the doctor opens the consultation.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 ("Record patient vital signs during triage (OPD)")
*   **Dependencies:** F-OPD-03

---

### Module: DOC — Doctor Operating System

#### F-DOC-01: Doctor Dashboard
*   **Description:** A dashboard for doctors to manage daily schedules, reports, and follow-ups.
*   **User Story:** As a Doctor, I want to view my schedule for the day, follow-ups, and pending lab reports so that I can plan my consultations.
*   **Acceptance Criteria:**
    1.  The dashboard must display a chronological list of checked-in patient tokens for the current date, showing Name, UHID, Token Number, and Status.
    2.  A distinct section must display "Pending Lab Reports" containing links to newly uploaded PDF reports for patients registered under this doctor.
    3.  The dashboard must show a "Follow-up Requests" section listing patients scheduled for recovery reviews.
*   **Priority:** P0
*   **Blueprint Reference:** Section 17 ("Doctor Dashboard: - Today's schedule, - Pending reports, - Follow-ups")
*   **Dependencies:** F-SEC-02

#### F-DOC-02: Consultation Workspace
*   **Description:** Clinical interface for doctors to review history, write notes, and diagnose.
*   **User Story:** As a Doctor, I want to consult a patient, review history, write consultation notes, and diagnose the patient so that their encounter is documented.
*   **Acceptance Criteria:**
    1.  The workspace must open from the Doctor Dashboard when a patient token is selected.
    2.  The screen must display the patient's complete historical consultations and lab reports sorted in reverse chronological order.
    3.  The workspace must provide text areas for "Clinical Notes" and "Diagnosis" that support rich text formatting.
    4.  Saving the consultation must update the `Consultations` database table and mark the queue token status as "Completed".
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 13 ("Consult patients", "Review patient history", "Consultation Workspace: Patient history, Notes, Diagnosis")
*   **Dependencies:** F-DOC-01

#### F-DOC-03: Digital Prescription System
*   **Description:** E-prescribing system using a standard drug formulary.
*   **User Story:** As a Doctor, I want to search a standard drug formulary and generate a digital prescription with structured dosage, duration, and instructions so that the pharmacist can fulfill it.
*   **Acceptance Criteria:**
    1.  The prescription interface must provide a search box that queries the `Medicines` table.
    2.  For each added medicine, the interface must enforce completion of structured input fields: Dosage (e.g. quantity/unit), Duration (e.g. number of days), and Instructions (e.g. "before food").
    3.  Saving the prescription must write it to the `Prescriptions` table, link it to the active `Consultation` record, and make it instantly visible in the Pharmacist portal.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 13 & 18 ("Create prescriptions (standard formulary)", "Prescriptions (standard drug formulary search)", "Digital Prescription System: Standard drug formulary search, Dosage (structured fields), Duration, Instructions")
*   **Dependencies:** F-DOC-02

#### F-DOC-04: Treatment Progress Tracking
*   **Description:** Log patient progress notes and recovery status.
*   **User Story:** As a Doctor, I want to record basic text progress notes and select patient recovery status from a dropdown list so that patient status is monitored.
*   **Acceptance Criteria:**
    1.  The system must display a progress entry interface containing a free-text field for "Progress Notes".
    2.  The system must provide a "Recovery Status" dropdown with values: "Active", "Recovered", "Referred".
    3.  Saving the progress entry must update the patient's recovery status in their clinical record and append the note to their history.
*   **Priority:** P0
*   **Blueprint Reference:** Section 19 ("Treatment Progress Tracking: - Basic text progress notes, - Patient recovery status dropdown (e.g., Active, Recovered, Referred)")
*   **Dependencies:** F-DOC-02

---

### Module: IPD — Inpatient Department Management

#### F-IPD-01: Inpatient Admission Management
*   **Description:** Nurse manages admissions, bed allocation, and room assignment.
*   **User Story:** As a Nurse, I want to create admission records, assign rooms, and allocate beds to patients requiring inpatient care so that they are admitted properly.
*   **Acceptance Criteria:**
    1.  The admission screen must allow selecting a patient (via UHID search) and entering an Admission Date/Time.
    2.  The screen must show a list of available beds filtered by ward type (ICU, General Ward, Private Room).
    3.  Allocating a bed must update the bed status to "Occupied" in the database and create a record in the `Admissions` table.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 14 ("Manage inpatient admission records, bed allocations, and room assignments (IPD)", "Admission Management: - Admission records, - Room assignment, - Bed allocation")
*   **Dependencies:** F-SEC-02

#### F-IPD-02: Bed Inventory Management
*   **Description:** Real-time bed occupancy tracking.
*   **User Story:** As a Nurse, I want to track availability of beds in the ICU, General Wards, and Private Rooms so that I know what beds are free.
*   **Acceptance Criteria:**
    1.  The bed dashboard must display the real-time layout/list of beds grouped by Ward Type: ICU, General Ward, Private Rooms.
    2.  Each bed slot must show status color-coding: green for "Available", red for "Occupied", yellow for "Cleaning/Maintenance".
    3.  Clicking a bed slot must display current occupier's name, UHID, and admission date if status is occupied.
*   **Priority:** P0
*   **Blueprint Reference:** Section 15 ("Bed Management: - ICU, - General Ward, - Private Rooms")
*   **Dependencies:** F-IPD-01

#### F-IPD-03: Patient Discharge Management
*   **Description:** Coordinate discharges, summary generation, and billing triggers.
*   **User Story:** As a Nurse, I want to update patient discharge status, generate discharge summaries, and trigger billing closure so that patients can be discharged.
*   **Acceptance Criteria:**
    1.  The discharge screen must display the patient's inpatient summary, room charges, and length of stay.
    2.  Saving the discharge must: set the `Admissions` status to "Discharged", set the allocated bed's availability status to "Cleaning/Maintenance", and create a pending billing invoice containing the bed charges.
    3.  The system must display a "Discharge Summary" text field for the nurse or attending physician to save before finalizing.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 16 ("Log inpatient status changes and coordinate patient discharge", "Discharge Management: - Summary generation, - Billing closure, - Follow-up scheduling")
*   **Dependencies:** F-IPD-01

---

### Module: LAB — Laboratory Management

#### F-LAB-01: Lab Order Generation
*   **Description:** Doctors request tests during consultation.
*   **User Story:** As a Doctor, I want to generate test requests during consultation so that lab staff can process them.
*   **Acceptance Criteria:**
    1.  The consultation workspace must include a "Lab Orders" section containing a search-and-add list of standard clinical tests.
    2.  Saving the consultation must generate records in the `Reports` table with status "Requested", linked to the patient's UHID and the doctor.
    3.  The generated lab order must immediately appear in the Lab Staff web portal.
*   **Priority:** P0
*   **Blueprint Reference:** Section 13 & 20 ("Lab requests", "Lab Orders: Doctor-generated test requests")
*   **Dependencies:** F-DOC-02

#### F-LAB-02: Lab Workflow Processing
*   **Description:** Process lab orders through lifecycle stages.
*   **User Story:** As a Lab Staff, I want to progress a lab order through statuses (Requested, Sample Collected, Processing, Completed, Uploaded) so that the order status is updated.
*   **Acceptance Criteria:**
    1.  The lab portal must list all pending lab orders.
    2.  For each order, the system must show a status-transition interface allowing the user to click to progress through: Requested → Sample Collected → Processing → Completed → Uploaded.
    3.  The system must log the timestamp and User ID of the lab staff member executing each status change.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 21 ("Process test orders", "Lab Workflow: Requested → Sample Collected → Processing → Completed → Uploaded")
*   **Dependencies:** F-LAB-01

#### F-LAB-03: Digital Report Archiving & Upload
*   **Description:** Uploading PDF reports.
*   **User Story:** As a Lab Staff, I want to upload lab reports so that they are archived and accessible to patients and doctors.
*   **Acceptance Criteria:**
    1.  The report upload interface must accept only PDF files up to a maximum size of 10MB.
    2.  Uploading a report must update the order status to "Uploaded", write the file's secure URL to the `Reports` table, and trigger an update on the Patient App and Doctor Dashboard.
    3.  Finalized and uploaded reports must not allow deletion or editing by the patient.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 22 ("Upload digital reports", "Report Repository: Permanent patient report archive", "Medical Retention Constraint: finalized prescriptions, lab reports, and doctor clinical notes cannot be deleted or edited by patients")
*   **Dependencies:** F-LAB-02

#### F-LAB-04: Patient Report Retrieval (Patient App)
*   **Description:** Patients download their reports via the Patient App.
*   **User Story:** As a Patient, I want to access my uploaded digital reports online so that I can review my lab results.
*   **Acceptance Criteria:**
    1.  The patient app must display a "My Reports" tab.
    2.  The list must show report name, date, ordering doctor, and a "Download/View PDF" button.
    3.  Clicking the button must load the PDF in a secure in-app viewer or system PDF downloader.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 ("Access reports")
*   **Dependencies:** F-SEC-01, F-LAB-03

---

### Module: PHR — Pharmacy Management

#### F-PHR-01: Prescription Fulfillment
*   **Description:** Pharmacists dispense prescribed medications.
*   **User Story:** As a Pharmacist, I want to view and fulfill digital prescriptions so that patients receive their prescribed medications.
*   **Acceptance Criteria:**
    1.  The pharmacist portal must display a list of pending prescriptions searchable by patient UHID or Name.
    2.  Clicking a prescription must show the medicine list, structured dosages, and instructions.
    3.  The pharmacist must be able to click a "Fulfill" button, which sets prescription status to "Dispensed" and automatically decrements the stock count in `InventoryLogs` for each dispensed item.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 23 ("View and fulfill digital prescriptions", "Prescription Fulfillment: View and fulfill doctor prescriptions digitally")
*   **Dependencies:** F-DOC-03

#### F-PHR-02: Local Stock Inventory Management
*   **Description:** Manual stock adjustments, expiry tracking, reorder alerts.
*   **User Story:** As a Pharmacist, I want to view stock counts, track expiry dates, manage reorder alerts, and make manual inventory adjustments so that medicine stock is maintained.
*   **Acceptance Criteria:**
    1.  The inventory screen must list all medicines, their stock counts, reorder thresholds, and expiry dates.
    2.  The screen must provide a "Manual Adjustment" interface to increase or decrease stock counts, requiring a text explanation for the adjustment.
    3.  The system must display a red warning icon next to any medicine batch where the current date is past the expiry date, or within 30 days of expiry.
    4.  The system must display a yellow alert icon next to medicines whose stock count is equal to or below their defined reorder threshold.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 24 ("Manage local stock inventory (manual adjustments)", "Inventory Tracking: - Medicine stock (standalone manual stock adjustment), - Expiry tracking, - Reorder alerts")
*   **Dependencies:** F-SEC-02

---

### Module: BIL — Billing & Insurance

#### F-BIL-01: Invoicing & Billing Engine
*   **Description:** Process consultation, lab, and procedure charges and generate invoice.
*   **User Story:** As a Billing Officer, I want to process consultation, lab, and procedure charges and generate invoices so that patient bills are settled.
*   **Acceptance Criteria:**
    1.  The billing screen must fetch all outstanding charges linked to a patient's UHID (consultation fees, lab test costs from `Reports`, bed charges from `Admissions`).
    2.  The system must generate a unified, itemized invoice with subtotal, taxes, and final total amount.
    3.  Saving the bill must generate a record in `Invoices` & `Payments` with payment status set to "Paid" (upon cash/card entry) or "Pending Insurance".
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 25 ("Process consultation, lab, and procedure bills", "Billing Engine: - Consultation charges, - Lab charges, - Procedure charges, - Invoice generation")
*   **Dependencies:** F-SEC-02

#### F-BIL-02: Manual Insurance Claim Logging
*   **Description:** Logging and tracking claims manually.
*   **User Story:** As a Billing Officer, I want to manually log insurance claims by inputting claim details and policy numbers, and track status so that insurance processes are recorded.
*   **Acceptance Criteria:**
    1.  The insurance section of the billing screen must provide text fields for: Policy Number, Insurance Provider Name, Claim Amount, and Claim Details.
    2.  The system must record these details in `Invoices` & `Payments` (claims log fields) and initialize the status to "Pending".
    3.  The system must display an interface to manually update the status of the logged claim to "Approved" or "Rejected" (requires entry of approval/rejection notes).
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 26 ("Log and track manual insurance claims", "Insurance Processing: Manual claim logging (input claim details, policy number), Status tracking (Pending, Approved, Rejected)")
*   **Dependencies:** F-BIL-01

---

### Module: AI — AI Layer (Google Gemini Integration)

#### F-AI-01: AI Symptom Assistant
*   **Description:** Gemini-powered chatbot for patient symptom triage and specialist recommendations.
*   **User Story:** As a Patient, I want to interact with a symptom collection chatbot that triages urgency and recommends specialists so that I know what to do next.
*   **Acceptance Criteria:**
    1.  The chatbot interface must use the Google Gemini API to parse patient-entered symptoms.
    2.  Every conversation session must initiate with a hardcoded, highly visible disclaimer stating: "This symptom assistant is not a diagnostic tool and does not replace human clinical judgment. For life-threatening emergencies, seek immediate human medical care."
    3.  The chat response must return a specific urgency assessment category: "Low", "Medium", or "High" and recommend a medical specialty (e.g. Cardiologist).
*   **Priority:** P1
*   **Blueprint Reference:** Section 28 ("AI Symptom Assistant (Powered by Google Gemini API)", "Patient-facing symptom collection chatbot.", "Specialist recommendation (e.g., suggest consulting a Cardiologist).", "Urgency assessment triage (categorizes urgency as Low, Medium, High).", "Boundary Guardrail: Prompts must include hardcoded safety disclaimers stating that this is not a diagnostic tool and patients should seek immediate human medical care for emergencies.")
*   **Dependencies:** F-SEC-01

#### F-AI-02: AI Lab Report Explainer
*   **Description:** Gemini-powered PDF summary of reports.
*   **User Story:** As a Patient, I want to get simplified, patient-friendly summaries of my uploaded PDF reports so that I can understand the results.
*   **Acceptance Criteria:**
    1.  The patient app must display an "Explain Report" button next to uploaded lab report PDFs.
    2.  Clicking the button must send the parsed text of the PDF to the Gemini API with a prompt to explain the metrics in simple language.
    3.  The response must display a simplified summary highlighting normal vs. abnormal findings, explicitly reminding the patient to consult their doctor for diagnosis.
*   **Priority:** P1
*   **Blueprint Reference:** Section 29 ("AI Lab Report Explainer (Powered by Google Gemini API)", "Convert uploaded PDF medical reports into simplified, patient-friendly summaries.")
*   **Dependencies:** F-LAB-04

#### F-AI-03: AI Medical Scribe
*   **Description:** Gemini-powered transcription of audio dictation into clinical notes.
*   **User Story:** As a Doctor, I want to dictate consultation voice summaries and have them transcribed and structured into clinical notes so that I save documentation time.
*   **Acceptance Criteria:**
    1.  The Consultation Workspace must provide an audio upload button to record/upload a doctor's voice summary.
    2.  The system must upload the audio file, send it to the Gemini API (using transcription/multimodal text extraction), and return structured SOAP notes (Subjective, Objective, Assessment, Plan).
    3.  The structured notes must be displayed in a text preview area, allowing the doctor to review, edit, and click "Accept" to populate the Clinical Notes field.
*   **Priority:** P1
*   **Blueprint Reference:** Section 7 & 30 ("Dictate session summaries for AI Scribe", "AI Medical Scribe (Powered by Google Gemini API)", "Convert doctor voice dictation (uploaded audio summary of the consultation) into structured clinical notes.")
*   **Dependencies:** F-DOC-02

#### F-AI-04: AI Clinical Risk Detection
*   **Description:** Flag readmission, critical lab values, and high-risk patients.
*   **User Story:** As a Doctor, I want to see system-generated flags for readmission risk, high-risk patient profiles, and critical lab values so that I can provide safer care.
*   **Acceptance Criteria:**
    1.  The Doctor Dashboard and Consultation Workspace must display an alert banner if a patient's historical diagnoses indicate a high-risk profile (e.g. chronic conditions like severe heart failure).
    2.  The system must display a red flag next to lab reports containing values that fall into a critical range (configured by lab settings).
    3.  The system must display a readmission warning badge if the patient was discharged from inpatient care within the last 30 days.
*   **Priority:** P1
*   **Blueprint Reference:** Section 31 ("AI Risk Detection: Flag: - High-risk patient profiles based on medical history - Critical lab test values - Readmission risks")
*   **Dependencies:** F-DOC-02, F-LAB-03, F-IPD-03

---

### Module: ANA — Analytics & Intelligence

#### F-ANA-01: Executive Operational Analytics Dashboard
*   **Description:** Operational dashboard for hospital metrics.
*   **User Story:** As an Administrator, I want to monitor hospital-wide KPIs, including revenue, occupancy, wait times, patient volume, and department performance so that I can oversee hospital operations.
*   **Acceptance Criteria:**
    1.  The dashboard must display real-time aggregate charts showing: Total Revenue (daily, monthly), Bed Occupancy Rate (percentage of occupied beds / total beds), Average Waiting Time (average time from queue token generation to consultation complete), and Patient Volume.
    2.  The charts must support filtering by Department (e.g. Cardiology, Pediatrics).
    3.  The dashboard must refresh its metrics on demand via a "Refresh" button, with data load completing in under 2 seconds.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 33 & 35 ("Monitor analytics dashboard", "Executive Dashboard: - Revenue, - Occupancy, - Waiting times, - Patient volume", "Department Analytics: - Performance, - Revenue, - Growth")
*   **Dependencies:** F-SEC-02

#### F-ANA-02: Doctor Analytics
*   **Description:** Tracking doctor utilization and consult volume.
*   **User Story:** As an Administrator, I want to track utilization and consultation volume for doctors so that I can optimize staffing.
*   **Acceptance Criteria:**
    1.  The doctor analytics screen must display a table listing all doctors, their department, total consultations completed in the selected date range, and doctor utilization percentage (calculated as `(Active Consultation Time) / (Scheduled Shift Time)`).
    2.  The table must allow sorting by consultation volume and utilization.
*   **Priority:** P1
*   **Blueprint Reference:** Section 34 ("Doctor Analytics: - Utilization, - Consultation volume")
*   **Dependencies:** F-ANA-01

#### F-ANA-03: Operational Predictive Analytics
*   **Description:** Forecasting bed demand, staffing, and inventory.
*   **User Story:** As an Administrator, I want to see forecasts for bed demand, staffing needs, and inventory stock so that I can plan resources in advance.
*   **Acceptance Criteria:**
    1.  The analytics screen must display a "Forecasts" tab showing 7-day predictive curves for Bed Demand, Staffing Needs, and Inventory Stock.
    2.  The forecasts must display a clear "Confidence Interval" band (shaded UI area).
*   **Priority:** P1
*   **Blueprint Reference:** Section 36 ("Predictive Analytics: - Bed demand forecasting, - Staffing forecasts, - Inventory forecasts")
*   **Dependencies:** F-ANA-01

---

### Module: SEC — Security & Compliance

#### F-SEC-01: Patient Authentication
*   **Description:** SMS OTP-based authentication using Firebase.
*   **User Story:** As a Patient, I want to log in using an SMS OTP code so that my personal details remain secure.
*   **Acceptance Criteria:**
    1.  The patient app login screen must contain a Phone Number input field.
    2.  Clicking "Send OTP" must trigger the Firebase Authentication SMS verification flow.
    3.  Upon receiving the OTP code, entering it must authenticate the user, create an active session, and navigate to the home dashboard.
*   **Priority:** P0
*   **Blueprint Reference:** Section 37 ("Authentication: - Patients: SMS OTP (using Firebase Authentication).")
*   **Dependencies:** None

#### F-SEC-02: Doctor & Staff Authentication & RBAC
*   **Description:** Email + Password authentication with session management and RBAC.
*   **User Story:** As a Doctor/Nurse/Staff member, I want to log in with my email and password so that I can securely perform my role-based duties.
*   **Acceptance Criteria:**
    1.  The staff login portal must authenticate users using Email and Password.
    2.  Successful login must create a secure HTTP-only cookie session.
    3.  The system must enforce Role-Based Access Control (RBAC): users with the role "Doctor" must be redirected to the Doctor Dashboard and blocked from accessing Billing, Lab, or Administrator panels, while "Lab Staff" must be restricted to Lab dashboards, etc.
*   **Priority:** P0
*   **Blueprint Reference:** Section 37 ("Authentication: - Doctors & Staff: Email + Password with Session management and Role-Based Access Control (RBAC).")
*   **Dependencies:** None

#### F-SEC-03: Data Access Auditing
*   **Description:** Detailed security audit trail of record access.
*   **User Story:** As an Administrator, I want to view audit trails of who accessed records, what changed, and when changes occurred so that we ensure security compliance.
*   **Acceptance Criteria:**
    1.  Every record read, write, or modification on Patient data must automatically generate a record in `AuditLogs`.
    2.  The audit log record must capture: Action Type (Read, Create, Edit, Delete), User ID, Timestamp, Entity Changed, and the Pre- and Post-modification states for all edits.
    3.  The administrator audit interface must allow searching logs by Patient UHID, User ID, and Date Range.
*   **Priority:** P0
*   **Blueprint Reference:** Section 39 ("Audit Trail: Track: - Who accessed records, - What changed (pre- and post-modification logs), - When changes occurred")
*   **Dependencies:** F-SEC-02

#### F-SEC-04: Consent Log and Deletion Lock
*   **Description:** Log patient consent at registration and enforce data retention rules.
*   **User Story:** As a Patient, I want to view my read-only consent log so that I can verify my data sharing status.
*   **Acceptance Criteria:**
    1.  During patient registration, a global "Opt-In/Opt-Out" consent checkbox must be presented and logged in the database (`Patients` table `consent_flag`).
    2.  The patient app must display a read-only screen showing their current consent status and a log of when it was set.
    3.  The system must block any deletion or edit requests from the Patient App targeting finalized prescriptions, clinical notes, or lab reports, returning a "Medical Record Retention Lock" error.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 40 ("Consent Management: Simple global opt-in/opt-out consent form logged at registration", "Medical Retention Constraint: In accordance with medical record retention regulations, finalized prescriptions, lab reports, and doctor clinical notes cannot be deleted or edited by patients", "Manage health records (read-only consent log)")
*   **Dependencies:** F-SEC-01

---

### Module: ADM — System Administration

#### F-ADM-01: Hospital-wide Configuration Settings
*   **Description:** Managing hospital settings, departments, and staff.
*   **User Story:** As an Administrator, I want to configure hospital settings, manage departments, and create staff accounts so that hospital operations run smoothly.
*   **Acceptance Criteria:**
    1.  The admin settings console must provide interfaces to Add/Edit/Disable hospital Departments.
    2.  The console must provide a User Management interface to create staff accounts, assign roles (Doctor, Receptionist, Nurse, Lab Staff, Pharmacist, Billing Officer, Administrator), and associate them with specific departments.
    3.  The system must save these staff details in the `Users` and/or `Doctors` tables.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 & 42 ("Manage hospital-wide settings, departments, and staff accounts", `Users`, `Doctors` entities).
*   **Dependencies:** F-SEC-02

#### F-ADM-02: Platform Configuration Settings
*   **Description:** Managing platform-wide parameters (Super Admin).
*   **User Story:** As a Super Admin, I want to manage platform-wide configuration settings and global parameters so that system settings are properly maintained.
*   **Acceptance Criteria:**
    1.  The platform management console must display options to manage system-wide settings, global variables, and roles.
    2.  The console must save global configurations in a platform-wide configuration table.
*   **Priority:** P0
*   **Blueprint Reference:** Section 7 ("Manage platform-wide configuration settings and global parameters (multi-hospital metadata management is deferred to Phase 2)").
*   **Dependencies:** F-SEC-02

---

## 4. MVP Scope

### Shipping in MVP (Phase 1 / v1.0)
*   **P0 Features (Core Operations):** F-REG-01, F-REG-02, F-OPD-01, F-OPD-02, F-OPD-03, F-OPD-04, F-OPD-05, F-DOC-01, F-DOC-02, F-DOC-03, F-DOC-04, F-IPD-01, F-IPD-02, F-IPD-03, F-LAB-01, F-LAB-02, F-LAB-03, F-LAB-04, F-PHR-01, F-PHR-02, F-BIL-01, F-BIL-02, F-SEC-01, F-SEC-02, F-SEC-03, F-SEC-04, F-ADM-01, F-ADM-02, F-ANA-01.
*   **P1 Features (AI & Auxiliary Analytics):** F-AI-01, F-AI-02, F-AI-03, F-AI-04, F-ANA-02, F-ANA-03.

### Deferred Features (Post-MVP / Phase 2+)
The following features are explicitly out of scope for the MVP:
*   **Online Payments (Phase 2):** Integrated credit card, net banking, or UPI checkouts.
*   **Telemedicine & Video Consultation (Phase 2):** In-app live video/audio calls with clinicians.
*   **Multi-Hospital Metadata Management (Phase 2):** Cross-tenant database partitions and multi-hospital setup consoles.
*   **Automated Pharmacy Integrations (Phase 3):** Direct linking with third-party drug networks or databases.
*   **Automated Insurance Networks (Phase 3):** Clearinghouse communication and automated claim processing.
*   **Ambient Scribing (Phase 3):** Continuous multi-speaker consult room audio analysis (only voice dictation is in-scope).
*   **Offline Sync Engine (Phase 4):** Full mobile offline databases (clients remain online-only with local UI caching).
*   **HR & Staff Roster Planning (Phase 4):** Shift schedules and rotation planning models.

---

## 5. Non-Functional Requirements

### Performance
*   **Web Portal Load Times:** All web pages (Admin, Reception, Billing, Lab, Pharmacy) must load in < 2.0 seconds under standard connection speeds (>= 10 Mbps).
*   **Mobile API Latency:** All API requests for patient queue checking, booking, and history fetching must respond in < 500ms.
*   **Analytics Compilation:** The executive dashboard must compile up to 10,000 historical billing/occupancy records and render charts in < 3.0 seconds.
*   **AI Scribe Processing:** Voice dictation transcription and structuring (audio files up to 2 minutes) must complete in < 15.0 seconds.

### Security & Compliance
*   **Data at Rest:** All clinical, patient, and system databases must be encrypted using AES-256.
*   **Data in Transit:** All network communication between clients and servers must be encrypted via TLS 1.3.
*   **Access Session Security:** Hospital portal sessions must automatically expire and log out the user after 15 minutes of idle time.
*   **Credential Storage:** Staff passwords must be hashed using bcrypt with a minimum work factor of 10.
*   **Auditing:** Audit trails for patient data modification must record the exact database field states before and after the change (pre- and post-modification logs).

### Availability & Reliability
*   **System Uptime:** The platform web backend must maintain a 99.9% availability target (excluding scheduled maintenance windows).
*   **API Error Rate:** The server API error rate must remain < 0.1% under standard peak loads (up to 100 concurrent requests).
*   **Mobile Resilience:** Patient and Doctor mobile apps must detect network dropouts and display a standard, friendly "Active Internet Connection Required" offline banner without crashing.

---

## 6. Assumptions and Risks

### Key Assumptions
1.  **Google Gemini API Availability:** The Google Gemini API is assumed to be consistently available, with sufficient rate limits and response times to support the AI Scribe and AI Lab Report Explainer.
2.  **Hospital Infrastructure:** Hospital facilities possess stable internet connection infrastructure to support the online-only HIS portals and apps.
3.  **Firebase Services:** Firebase Authentication's SMS infrastructure remains functional and compliant in the deployment regions.

### Critical Risks
1.  **Gemini API Latency/Timeouts:** Large audio files for AI Scribing could result in API timeouts. *Mitigation:* Limit dictation audio length in the UI to a maximum of 2 minutes.
2.  **Cellular Dead Zones:** Mobile patients inside concrete hospital structures may lose connection. *Mitigation:* Ensure local UI cache stores the last fetched queue tokens and active appointments for immediate static rendering.
3.  **Audit Log Database Bloat:** Storing full pre- and post-modification states for every record read/write can cause database tables to grow rapidly. *Mitigation:* Setup a rolling archive partition strategy for logs older than 90 days.

---

## 7. Open Questions

| Question | Owner | Deadline |
| :--- | :--- | :--- |
| **Q1:** Which specific Google Gemini model (e.g. Gemini 1.5 Flash vs. Gemini 1.5 Pro) will be deployed for the AI Scribe and Lab Explainer? | **[OWNER: Tech Lead]** | **[DEADLINE: 2026-07-01]** |
| **Q2:** Which PDF parser library (e.g., PDFbox, PyPDF2) will be used to extract text for the AI Lab Report Explainer? | **[OWNER: Tech Lead]** | **[DEADLINE: 2026-07-05]** |
| **Q3:** What SMS gateway plan configuration is required in Firebase to support production volume scaling? | **[OWNER: Project Manager]** | **[DEADLINE: 2026-07-10]** |
| **Q4:** Can patients toggle their consent status after registration, or is it a permanent selection? | **[OWNER: Product Owner]** | **[DEADLINE: 2026-06-30]** |
