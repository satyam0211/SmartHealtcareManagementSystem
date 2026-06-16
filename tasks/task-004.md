# Task 004: Patient Authentication and Firebase Integration
**Status:** pending
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [auth, frontend, backend]

## Description
This task implements SMS OTP-based authentication for patient clients using Firebase Authentication. It involves configuring the Firebase SDK on the Patient Android App to send verification codes to user-provided phone numbers and verify the OTP.

On the backend, this task implements a JWT validation filter to verify the cryptographically signed Firebase ID token sent by the mobile client on every API request. This establishes a secure, token-based session for patient accounts that expires 1 hour after issuance and requires refresh token swaps.

## Document References

### PRD
- **Feature ID:** F-SEC-01 (Patient Authentication)
- **User Story:** As a Patient, I want to log in using an SMS OTP code so that my personal details remain secure.
- **Acceptance Criteria:**
  1. The patient app login screen must contain a Phone Number input field.
  2. Clicking \"Send OTP\" must trigger the Firebase Authentication SMS verification flow.
  3. Upon receiving the OTP code, entering it must authenticate the user, create an active session, and navigate to the home dashboard.

### SRS
- **Requirement IDs:** FR-SEC-01-01 (SMS OTP Auth), FR-SEC-01-02 (JWT Validation), FR-SEC-01-03 (Token Expiry)
- **SHALL statements:**
  * The system SHALL authenticate patient app users using Firebase Authentication SMS OTP.
  * The system SHALL validate the patient's JWT ID Token on the backend on every API request.
  * The system SHALL restrict JWT validity to 1 hour.

### Architecture
- **Component(s):** Patient Android App, User & Auth Service
- **Data Flow:** Patient App -> request SMS OTP from Firebase -> enter OTP -> Firebase returns ID Token -> Patient App sends ID Token to Backend -> Backend validates and opens session.

### Database
- **Tables:** `patients`
- **Migrations:** None

### API
- **Endpoints:**
  * `POST /api/auth/patients` (verifies Firebase ID Token and returns local user info)
- **Auth/Role guard:** JWT Validator Filter

### Security
- **Threats addressed:**
  * T-AUTH-04 (Interception of credentials - mitigated by Firebase token signature checking and SMS verification)
- **Data classifications:** `RESTRICTED` Patient phone numbers.

### Design
- **Screen(s):** SCR-PT-01 (Login Screen)
- **Components used:** Input Fields, Button, OTP Input Grid
- **Design tokens:** Primary Hex, Typography Body-1

### Testing
- **Unit tests:** Firebase Token verification service tests
- **Integration tests:** IT-SEC-01 (JWT verification failure simulation)
- **Security tests:** None
- **UAT scenarios:** UAT-PT-01 (Patient logs in successfully)

## Acceptance Criteria
- [ ] Patient App provides a validated phone number field (rejects inputs that do not contain exactly 10 digits).
- [ ] Patient App initiates the Firebase SMS OTP verification flow when the user clicks "Send OTP".
- [ ] Backend monolith validates the cryptographic signature of the Firebase ID Token using Firebase Admin SDK public keys.
- [ ] Session is blocked if the Firebase ID Token has expired (expires 1 hour from issuance).
- [ ] Successful verification maps the Firebase UID to a patient record in the `patients` table, creating the patient session.

## Dependencies
- task-002: Database Schema Creation, Migrations, and Seeding (requires `patients` table)

## Implementation Approach
### Step-by-step Plan:
1. Register the Patient Android App in the Firebase Developer Console and download `google-services.json`.
2. Integrate Firebase Auth SDK in `android/app/build.gradle.kts` and write `LoginScreen.kt` using Jetpack Compose.
3. Set up the Firebase Admin SDK configuration in `backend/src/config/firebase.config.ts`.
4. Create `POST /api/auth/patients` endpoint in backend user controller to verify incoming tokens and return patient session details.

### Technical Considerations:
- Use Android Keystore to securely store keys if local credentials caching is required.
- Configure rate limits on the backend auth endpoint to prevent brute force token submissions.

### Architecture/Design Notes:
- Governed by ADR-02 (Token-based authentication for mobile client API calls).

## Files to Modify/Create
- `android/app/src/main/java/com/ship/app/ui/patient/LoginScreen.kt` — Create login UI
- `backend/src/config/firebase.config.ts` — Create Firebase admin initialization
- `backend/src/modules/user/patient-auth.service.ts` — Create token validation service

## Testing Requirements
Reference: /documents/Testing_Strategy.md

### Integration Tests (Part 2):
- [ ] IT-SEC-01: Send an expired or spoofed JWT token to `/api/auth/patients` and verify that the backend returns an `HTTP 401 Unauthorized` error.

### UAT Scenarios (Part 4):
- [ ] UAT-PT-01: Verifies that a patient entering a valid phone number, receiving the OTP code, and entering it is navigated to the home screen.
