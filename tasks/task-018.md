# Task 018: AI Lab Report Explainer
**Status:** pending
**Priority:** P1
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [backend, frontend, testing]

## Description
This task implements the AI Lab Report Explainer (F-AI-02). Patients can request simplified, patient-friendly summaries of their uploaded lab reports. The backend extracts text from the PDF file archived in MinIO, sends it to the Google Gemini API with a summary instruction, and returns a structured analysis.

The analysis highlights normal vs. abnormal findings in non-clinical language and includes a disclaimer directing the patient to consult their doctor for diagnostics. If the Gemini API is unreachable, the system falls back to displaying the raw PDF without the AI summary block.

## Document References

### PRD
- **Feature ID:** F-AI-02 (AI Lab Report Explainer)
- **User Story:** As a Patient, I want to get simplified, patient-friendly summaries of my uploaded PDF reports so that I can understand the results.
- **Acceptance Criteria:**
  1. Patient app displays an "Explain Report" button next to uploaded lab report PDFs.
  2. Clicking button sends parsed PDF text to Gemini API with prompt to explain metrics in simple language.
  3. Response displays simplified summary highlighting normal vs. abnormal findings, explicitly reminding patient to consult doctor.

### SRS
- **Requirement IDs:** FR-AI-02-01 (Explain Button), FR-AI-02-02 (PDF Parsing), FR-AI-02-03 (Consult Reminder)
- **SHALL statements:**
  * The system SHALL extract text from the PDF report.
  * The system SHALL output patient-friendly summaries with doctor consultation reminders.

### Architecture
- **Component(s):** AI Service Wrapper, Patient Android App, Object Storage (MinIO)
- **Data Flow:** Patient clicks Explain -> App calls POST `/api/ai/reports/{id}/explain` -> Backend downloads PDF from MinIO -> parses text -> calls Gemini API -> returns text summary -> App displays summary.

### Database
- **Tables:** `reports`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/ai/reports/{id}/explain` (extracts, summarizes, and returns PDF report explanations)
- **Auth/Role guard:** Patient (Own reports only).

### Security
- **Threats addressed:**
  * T-AI-02 (Exposing patient reports during AI transmission - mitigated by TLS 1.3 encryption and server-to-server Gemini API communication)
- **Data classifications:** `RESTRICTED` Lab reports metadata, lab report PDF files.

### Design
- **Screen(s):** SCR-PT-05 (Patient Lab Reports Screen)
- **Components used:** Report list cards, Explanation cards
- **Design tokens:** Surface-variant Color, Typography Body-1

### Testing
- **Unit tests:** PDF text extraction unit tests
- **Integration tests:** IT-AI-02 (PDF extraction and summary integration test)
- **Security tests:** None
- **UAT scenarios:** UAT-PT-05 (Patient reads AI lab report explanation)

## Acceptance Criteria
- [ ] Patient App renders the "Explain Report" action button next to uploaded PDF reports.
- [ ] Backend extracts text from PDF lab reports using a secure PDF parsing library.
- [ ] Summary prompt binds to the `gemini-1.5-flash` model.
- [ ] Output displays a clear consultation reminder block.
- [ ] If Gemini API times out, the uploader returns an error stating "Explanation service offline", displaying the raw PDF details safely.

## Dependencies
- task-011: Lab Order and PDF Report Management (requires uploaded PDF reports in MinIO)

## Implementation Approach
### Step-by-step Plan:
1. Integrate a PDF parsing library (e.g. `pdf-parse` or `pdfbox`) in the backend.
2. Write `explainer.service.ts` to retrieve the PDF buffer from MinIO, parse its text, and structure the Gemini API prompt.
3. Build the "Explain Report" UI modal in the Patient Android App.
4. Implement error catch filters to hide the AI block if the service returns connection timeouts.

### Technical Considerations:
- Ensure parsed PDF text is sanitized to prevent prompt injections during Gemini processing.

### Architecture/Design Notes:
- Follows report extraction boundaries outlined in Blueprint Section 29.

## Files to Modify/Create
- `backend/src/modules/ai/explainer.service.ts` — Create PDF text summarization service
- `backend/src/modules/ai/ai.router.ts` — Add explain route path
- `android/app/src/main/java/com/ship/app/ui/patient/ReportScreen.kt` — Add explanation UI blocks
