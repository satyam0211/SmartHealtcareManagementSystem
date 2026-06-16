# Task 011: Lab Order and PDF Report Management
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 12 hours
**Tags:** [backend, frontend, database, security]

## Description
This task implements the Laboratory management system. It covers the creation of diagnostic lab orders by doctors during OPD/IPD consultations, the laboratory workflow status progression (from Requested, Sample Collected, Processing, to Completed), and the secure PDF report uploading.

The uploaded PDF reports must be saved in the local MinIO object storage bucket. The server must validate the uploaded files using magic-byte headers, run a basic malware check, and enforce a 10MB size limit. Patients can download their PDF reports directly via the Patient App.

## Document References

### PRD
- **Feature ID:** F-LAB-01 (Lab Order Generation), F-LAB-02 (Workflow Processing), F-LAB-03 (Digital Report Archiving & Upload), F-LAB-04 (Patient Report Retrieval)
- **User Story:**
  * As a Doctor, I want to generate test requests during consultation so that lab staff can process them.
  * As a Lab Staff, I want to progress a lab order through statuses so that the order status is updated.
  * As a Lab Staff, I want to upload lab reports so that they are archived and accessible to patients and doctors.
  * As a Patient, I want to access my uploaded digital reports online so that I can review my lab results.
- **Acceptance Criteria:**
  1. Consultation workspace includes a "Lab Orders" section.
  2. Generates records in `Reports` table with status "Requested" linked to UHID.
  3. Lab portal lists pending lab orders.
  4. Status transitions: Requested -> Sample Collected -> Processing -> Completed -> Uploaded.
  5. Logs timestamp and User ID of lab staff executing change.
  6. PDF upload accepts files up to 10MB only.
  7. Uploading updates status to "Uploaded", saves secure URL, and triggers update on Patient App/Doctor Dashboard.
  8. Finalized reports cannot be deleted/edited by patient.
  9. Patient App displays "My Reports" with name, date, doctor, and download button.
  10. Opens PDF in secure viewer.

### SRS
- **Requirement IDs:** FR-LAB-01-01 (Requested State), FR-LAB-02-01 (Transition Rules), FR-LAB-03-01 (PDF Constraint), FR-LAB-04-01 (Report UI)
- **SHALL statements:**
  * The system SHALL validate the file format using magic-byte headers.
  * The system SHALL store lab report PDFs in object storage.

### Architecture
- **Component(s):** Lab Service, Web Portal (Lab console), Patient Android App, Object Storage (MinIO)
- **Data Flow:** Doctor creates order -> Lab Service -> database. Lab uploads PDF -> MinIO storage -> save secure URL -> notify Patient/Doctor.

### Database
- **Tables:** `lab_orders`, `lab_reports`, `reports`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/lab/orders` (create test request)
  * `GET /api/lab/orders` (list pending tests)
  * `PUT /api/lab/orders/{id}/status` (transition status)
  * `POST /api/lab/reports/upload` (multipart upload PDF to MinIO)
  * `GET /api/lab/reports/{id}/download` (retrieve PDF binary stream)
- **Auth/Role guard:** Doctor (Write orders), Lab Staff (Read orders, update status, upload reports), Patient (Own Read), Nurse (Read).

### Security
- **Threats addressed:**
  * T-LAB-01 (Uploading malicious executable files as PDFs - mitigated by magic-byte check and malware scanning)
  * T-LAB-02 (Unauthorized access to patient PDF reports - mitigated by pre-signed URLs and authentication validation)
- **Data classifications:** `RESTRICTED` Lab orders metadata, lab report PDF files.

### Design
- **Screen(s):** SCR-LS-02 (Lab Orders Queue), SCR-LS-03 (Lab Upload Console), SCR-PT-05 (Patient Lab Reports Screen)
- **Components used:** Queue lists, File Upload Area, PDF Viewer Modal
- **Design tokens:** Primary Color, Typography Body-1

### Testing
- **Unit tests:** PDF magic-byte validation unit tests
- **Integration tests:** IT-LAB-01 (Lab workflow status progression and PDF upload integration test)
- **Security tests:** ST-SEC-05 (Verify malicious file upload rejection)
- **UAT scenarios:** UAT-LS-01 (Lab technician uploads patient report PDF)

## Acceptance Criteria
- [ ] Lab orders generated in OPD consultations populate the lab portal dashboard.
- [ ] Status updates log the executing user ID and timestamp in the `reports` audit trail.
- [ ] PDF upload handler rejects files exceeding 10MB or containing non-PDF magic bytes.
- [ ] Uploaded reports write secure URLs to the database and block modifications/deletions.
- [ ] Patient App retrieves and displays the uploaded PDFs for downloading.

## Dependencies
- task-008: Doctor Dashboard and Consultation Workspace (lab orders require active consultations)

## Implementation Approach
### Step-by-step Plan:
1. Write backend upload middleware utilizing `multer` and configuring a magic-byte checker checking file signature (`%PDF-`).
2. Integrate MinIO client in `backend/src/config/minio.ts` to store uploaded PDF buffers in a secure bucket.
3. Build the Lab Workflow manager and PDF uploader forms in the Web Portal using Vanilla JS.
4. Implement the PDF downloader and listing interfaces in the Patient Android App.
5. Apply security filters ensuring only authorized users can request report pre-signed download URLs.

### Technical Considerations:
- Run a background virus checker or shell check on the uploaded PDF buffer before saving to MinIO.

### Architecture/Design Notes:
- Governed by ADR-06 (Unstructured clinical files storage and PDF malware validation).

## Files to Modify/Create
- `backend/src/modules/lab/lab.controller.ts` — Create lab routes
- `backend/src/modules/lab/lab.service.ts` — Implement status transitions and MinIO upload actions
- `backend/src/config/minio.ts` — Create MinIO configuration
- `android/app/src/main/java/com/ship/app/ui/patient/ReportScreen.kt` — Build Patient Report list UI
