# Task 017: AI Symptom Triage Chatbot
**Status:** pending
**Priority:** P1
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [backend, frontend, testing]

## Description
This task implements the Google Gemini-powered Patient Symptom Chatbot (F-AI-01). Patients interact with an automated symptom collection interface in their mobile app to triage urgency (categorizing it as Low, Medium, High) and get a specialty recommendation (e.g. consult a cardiologist).

Crucially, the prompt layout must inject a hardcoded safety disclaimer stating that this is not a diagnostic tool and patients should seek immediate human medical care for emergencies. If the Gemini API is unreachable, the system must fallback gracefully to rendering a static list of hospital departments and emergency contact numbers.

## Document References

### PRD
- **Feature ID:** F-AI-01 (AI Symptom Assistant)
- **User Story:** As a Patient, I want to interact with a symptom collection chatbot that triages urgency and recommends specialists so that I know what to do next.
- **Acceptance Criteria:**
  1. Chatbot interface must use Google Gemini API to parse patient-entered symptoms.
  2. Every session must initiate with a hardcoded, highly visible disclaimer stating: "This symptom assistant is not a diagnostic tool and does not replace human clinical judgment. For life-threatening emergencies, seek immediate human medical care."
  3. Chat response must return a specific urgency assessment category: "Low", "Medium", or "High" and recommend a medical specialty.

### SRS
- **Requirement IDs:** FR-AI-01-01 (Chat Interface), FR-AI-01-02 (Safety Disclaimer), FR-AI-01-03 (Triage Output)
- **SHALL statements:**
  * The system SHALL output "Low", "Medium", or "High" urgency flags.
  * The system SHALL display the safety disclaimer prominently.

### Architecture
- **Component(s):** AI Service Wrapper, Patient Android App
- **Data Flow:** Patient inputs text -> Patient App calls POST `/api/ai/symptoms/triage` -> AI Service injects system prompt guidelines -> calls Google Gemini API -> extracts JSON properties -> returns triage response.

### Database
- **Tables:** `symptom_chats`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/ai/symptoms/triage` (processes symptoms and returns JSON payload)
- **Auth/Role guard:** Patient only.

### Security
- **Threats addressed:**
  * T-AI-01 (Prompt injection attempting to force clinical diagnostics - mitigated by strict system prompt guidelines and output JSON validations)
- **Data classifications:** `RESTRICTED` Symptom chats text history.

### Design
- **Screen(s):** SCR-PT-07 (Symptom Chatbot Modal)
- **Components used:** Chat dialogue bubbles, Urgency warning banners
- **Design tokens:** Primary Color, Warning Color, Info Color

### Testing
- **Unit tests:** Gemini response parsing and JSON validation tests
- **Integration tests:** IT-AI-01 (Symptom triage output categorization test)
- **Security tests:** None
- **UAT scenarios:** UAT-PT-04 (Patient triages symptoms using the app)

## Acceptance Criteria
- [ ] Chat screen initiates with the mandatory safety disclaimer displayed at the top.
- [ ] Backend API queries the Google Gemini API using the `gemini-1.5-flash` model.
- [ ] System parses responses and returns structured properties: `urgency` (Low/Medium/High) and `recommended_specialty`.
- [ ] If Gemini API returns an error or timeout, the chatbot displays the static fallback contacts list.
- [ ] Chat records are saved to the `symptom_chats` database table.

## Dependencies
- task-004: Patient Authentication and Firebase Integration (chatbot requires logged-in patient)

## Implementation Approach
### Step-by-step Plan:
1. Set up the Google Gen AI SDK in `backend/src/modules/ai/symptom.service.ts`.
2. Construct the system instruction prompt declaring the boundaries (Safety disclaimer, output format, restrict to Low/Medium/High urgency).
3. Implement the `POST /api/ai/symptoms/triage` route parsing user inputs and returning structured responses.
4. Build the Chat interface screen in the Patient Android App using Jetpack Compose.
5. Write fallback handlers managing Gemini connection dropouts.

### Technical Considerations:
- Enforce strict JSON output parsing on Gemini API response using Schema constraint parameters.

### Architecture/Design Notes:
- Follows AI triage boundaries outlined in Blueprint Section 28 & 32.

## Files to Modify/Create
- `backend/src/modules/ai/symptom.service.ts` — Create symptom triage wrapper logic
- `backend/src/modules/ai/ai.controller.ts` — Create AI endpoint controller
- `android/app/src/main/java/com/ship/app/ui/patient/SymptomChatScreen.kt` — Build Symptom Chatbot Compose UI
