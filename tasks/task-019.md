# Task 019: AI Medical Scribe
**Status:** pending
**Priority:** P1
**Complexity:** high
**Estimated Time:** 12 hours
**Tags:** [backend, frontend, testing]

## Description
This task implements the Google Gemini-powered AI Medical Scribe (F-AI-03). The doctor can upload a voice dictation summary of the consultation (up to 2 minutes in duration) recorded in the consult room.

The backend uploads this audio file to MinIO, transmits the audio stream to the Google Gemini API, and returns a structured clinical note in SOAP (Subjective, Objective, Assessment, Plan) format. The doctor reviews, edits, and clicks "Accept" to populate the clinical workspace notes. If the API is offline, the dictation is queued and the doctor can write notes manually.

## Document References

### PRD
- **Feature ID:** F-AI-03 (AI Medical Scribe)
- **User Story:** As a Doctor, I want to dictate consultation voice summaries and have them transcribed and structured into clinical notes so that I save documentation time.
- **Acceptance Criteria:**
  1. Consultation Workspace provides audio upload button to record/upload doctor's voice summary.
  2. Upload audio file, send to Gemini API (using transcription/multimodal text extraction), and return structured SOAP notes.
  3. Structured notes displayed in text preview area, allowing doctor to review, edit, and click "Accept" to populate Clinical Notes field.

### SRS
- **Requirement IDs:** FR-AI-03-01 (Audio Record Button), FR-AI-03-02 (Gemini SOAP Output), FR-AI-03-03 (Scribe Console UI)
- **SHALL statements:**
  * The system SHALL translate audio dictation summaries into structured SOAP notes.
  * The system SHALL limit audio length to 2 minutes.

### Architecture
- **Component(s):** AI Service Wrapper, Doctor Android App, Object Storage (MinIO)
- **Data Flow:** Doctor records audio -> uploads to POST `/api/ai/scribe/transcribe` -> Backend uploads file to MinIO -> sends audio binary to Gemini API -> extracts SOAP JSON -> returns text to App -> Doctor edits & accepts.

### Database
- **Tables:** `scribe_sessions`, `consultations`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/ai/scribe/transcribe` (accepts audio file, calls Gemini API, and returns SOAP structured JSON)
- **Auth/Role guard:** Doctor only.

### Security
- **Threats addressed:**
  * T-AI-03 (Data exposure of voice files - mitigated by SSL pinning and authenticated storage bounds)
- **Data classifications:** `RESTRICTED` Audio dictation files, SOAP notes content.

### Design
- **Screen(s):** SCR-DR-06 (AI Scribe Interface)
- **Components used:** Audio Record Button, Waveform Indicator, SOAP Preview Editor
- **Design tokens:** Primary Color, Error Color, Typography Body-1

### Testing
- **Unit tests:** Audio file format validation tests
- **Integration tests:** IT-AI-03 (Scribe audio translation and SOAP generation test)
- **Security tests:** None
- **UAT scenarios:** UAT-DR-03 (Doctor records and accepts SOAP clinical notes)

## Acceptance Criteria
- [ ] Doctor App restricts recording duration to exactly 2 minutes maximum.
- [ ] Audio files are uploaded in a supported format (`audio/wav` or `audio/mpeg`) checked by magic bytes.
- [ ] Gemini API prompt uses the `gemini-1.5-pro` model to structure transcripts into SOAP markdown format.
- [ ] Scribe UI displays an editable text editor containing the generated notes before saving.
- [ ] Attending doctor must click "Accept" to map notes to the Consultation record.

## Dependencies
- task-008: Doctor Dashboard and Consultation Workspace (scribe requires active consultation context)

## Implementation Approach
### Step-by-step Plan:
1. Implement the Android Audio Recorder SDK integration in the Doctor App.
2. Build `scribe.service.ts` to process multipart audio uploads, save them to a `scribe-dictations` bucket in MinIO, and submit them to the Google Gemini API.
3. Configure the Gemini prompt system instructions to enforce strict SOAP parsing.
4. Build the Scribe console and waveform indicator UI in the Doctor App using Compose.
5. Implement fallback triggers showing an alert if the upload fails or the API times out.

### Technical Considerations:
- Set up a cron task or cleanup rule to clear raw audio dictations from MinIO after 7 days to conserve space.

### Architecture/Design Notes:
- Follows dictation limits outlined in Blueprint Section 30.

## Files to Modify/Create
- `backend/src/modules/ai/scribe.service.ts` — Create audio transcription and SOAP note extraction service
- `android/app/src/main/java/com/ship/app/ui/doctor/ScribeScreen.kt` — Build Scribe Compose UI
- `backend/src/modules/ai/ai.router.ts` — Add scribe routes
