# Technical Requirements Document
## Smart Healthcare Intelligence Platform v1.0

This document establishes the official technical specifications, runtime environments, development standards, deployment workflows, and engineering constraints for the Smart Healthcare Intelligence Platform (SHIP). All development and deployment activities MUST adhere strictly to the rules defined herein.

---

## 1. Platform and Runtime

### Target Platforms and Version Minimums
1. **Patient Android Application**:
   * **Minimum OS Version**: Android 8.0 (API Level 26 - Oreo) `MUST` be the minimum deployment target to leverage modern security APIs and Java 8 libraries.
   * **Target OS Version**: Android 14.0 (API Level 34) `MUST` be the target development version.
   * **Distribution**: Distributed via secure Google Play Store or private MDM enterprise channels.
2. **Doctor Android Application**:
   * **Minimum OS Version**: Android 8.0 (API Level 26 - Oreo) `MUST` be the minimum deployment target.
   * **Target OS Version**: Android 14.0 (API Level 34) `MUST` be the target development version.
   * **Hardware Requirements**: Attending devices `MUST` possess an integrated microphone array capable of capturing 16-bit PCM audio (at 16kHz or 44.1kHz sample rate) for the AI Scribe.
3. **Hospital Operations Web Portal**:
   * **Supported Browsers**: Chrome v115+, Firefox v115+, Safari v16+, and Edge v115+ `MUST` be supported.
   * **Responsive Resolutions**: The interface `MUST` render correctly on standard desktop terminals with resolutions of `1280x720` up to `1920x1080` (landscape).

### Runtime Environment Specifications
1. **API Gateway**: NGINX v1.25.x (Mainline) `MUST` be run as a containerized reverse proxy, configured to terminate TLS 1.3, enforce rate limiting, and block payload injections.
2. **Backend Application Monolith**:
   * **Runtime Engine**: Node.js v20.x LTS (minimum version 20.10.0) `MUST` be the standard execution runtime.
   * **Containerization**: Deployable inside Docker containers running on a base image of `node:20-alpine` to ensure a minimal vulnerability profile.
3. **Database Server**: PostgreSQL v16.x `MUST` be deployed. The containerized or VM-installed database `MUST` utilize standard storage volumes encrypted with AES-256.
4. **Local Object Storage**: MinIO RELEASE.2023-11-01 or later `MUST` be run locally to expose an AWS S3-compatible API for storing PDF reports and consultation audio summary files.
5. **Key Management Service (KMS)**: HashiCorp Vault v1.15.x `MUST` be deployed locally on the hospital intranet to manage cryptographic keys for Field-Level Encryption (FLE).

---

## 2. Technology Stack

Every layer of the platform is defined below, including specific versions and justifications tied directly to constraints in [Blueprint.md](file:///c:/Users/sm223/OneDrive/Desktop/Smart%20Healthcare%20Management%20System/documents/Blueprint.md).

| Layer | Technology | Pinned Version | Blueprint Constraint / Justification |
| :--- | :--- | :--- | :--- |
| **Patient Frontend** | Native Android Kotlin | Kotlin v1.9.20 | Matches **Blueprint Section 1 (Platforms)** requiring a native Android client to utilize local hardware capabilities and secure OS-level storage. |
| **Doctor Frontend** | Native Android Kotlin | Kotlin v1.9.20 | Matches **Blueprint Section 1 & Section 30 (Scribe)**, utilizing native recording SDK APIs for low-overhead audio capture. |
| **Mobile Local Cache** | SQLite (SQLCipher) | SQLCipher v4.5.x | Matches **Blueprint Section 1 & Section 4 ("Privacy by Design")**, ensuring the online-only app's local UI cache is fully encrypted on-disk. |
| **Staff Web Frontend** | HTML5 / Vanilla JS / CSS | ES2022 / CSS3 | Matches **Blueprint Section 1 & Section 6 ("Operational Excellence")**; bypasses heavy SPA framework dependencies to load in < 2.0s over local LAN networks. |
| **Backend Monolith** | Node.js (TypeScript) | TypeScript v5.2.x | Matches **Blueprint Section 41 (Core Services)**. TypeScript provides type-safe compile checks across modules in a single repository. |
| **Database Engine** | PostgreSQL | PostgreSQL v16.x | Matches **Blueprint Section 42 (Database Entities)**; provides transaction safety (ACID) for pharmacy stock adjustments and billing. |
| **Object Storage** | MinIO | S3 API v4 | Matches **Blueprint Section 22 (Report Repository)**; stores unstructured binary reports and audio files without database size bloat. |
| **Secrets & KMS** | HashiCorp Vault | Vault v1.15.x | Matches **Blueprint Section 38 (Encryption)**; manages the AES-256 keys required to perform Field-Level Encryption (FLE) on patient records. |

---

## 3. Third-Party Integrations

### Firebase Authentication (SMS OTP)
* **Purpose**: Primary identity authentication engine for Patient App logins, verifying physical ownership of mobile phone numbers.
* **Version & SDK**: Firebase Admin Node.js SDK v12.0.0 (Backend), Firebase Auth Android SDK v22.3.0 (Android Client).
* **Fallback Strategy**:
  * If Firebase Auth is unreachable or rate-limited, the Patient App `MUST` cache the login inputs locally, display an active network-retry status banner, and queue retry attempts using an exponential backoff algorithm.
  * In the event of a total system failure, patient registration `MUST` revert to manual validation via Receptionists using the Web Portal; online patient self-registration `MUST` remain blocked until Firebase returns to online status.
  * *Note: Firebase SMS OTP credentials MUST NEVER be bypassed in production.*

### Google Gemini API
* **Purpose**: Powers the AI Symptom Assistant (F-AI-01), AI Lab Report Explainer (F-AI-02), and AI Medical Scribe (F-AI-03).
* **Version & SDK**: Google Gen AI SDK (`@google/genai` v0.1.0 or `@google/generative-ai` v0.2.0 for Node.js), Google Gen AI Android SDK (`generativeai` v0.4.0 for Kotlin).
  * **Model Bindings**: Triage and summaries `MUST` utilize `gemini-1.5-flash` to optimize speed and cost. Clinical note translation (SOAP structure) `MUST` utilize `gemini-1.5-pro` for deep semantic reasoning.
* **Fallback Strategy**:
  * **AI Symptom Assistant**: If the API is offline, the Patient App chatbot interface `MUST` catch the API timeout/error and display a static list of available hospital departments, prompting: *"Symptom analysis is temporarily offline. If you are experiencing a medical emergency, please visit our ER or call a doctor immediately."*
  * **AI Lab Report Explainer**: If the API is offline, the UI `MUST` render the raw lab metrics directly without the summary block, displaying: *"AI Explanation is currently unavailable. Please consult your physician to interpret these results."*
  * **AI Medical Scribe**: If the API is offline, the system `MUST` store the recorded voice file securely in MinIO, display a status warning stating *"AI note translation queued"*, and present the doctor with a standard, editable blank text area to write consultation notes manually.

### Version Pinning Policy
1. All dependencies in the backend `package.json` `MUST` be locked to exact versions (e.g. `"express": "4.18.2"` instead of `"express": "^4.18.2"`).
2. The `package-lock.json` and `gradle.lockfile` files `MUST` be committed to version control.
3. Automated dependency updates `MUST NOT` be merged directly without passing the full integration test pipeline.

---

## 4. Development Standards

### Language Specifications
* **TypeScript (Backend)**: Enforce strict type checking by setting `"strict": true` in `tsconfig.json`. The use of `any` `MUST` be flagged by the linter as an error.
* **Kotlin (Android)**: Enforce Kotlin JVM Target 17. Use coroutines with structured concurrency (`viewModelScope`, `lifecycleScope`) to prevent memory leaks.

### Code Style Guides
* **TypeScript / JavaScript**:
  * Clean code formatting `MUST` be enforced using ESLint and Prettier.
  * Indentation `MUST` be exactly 2 spaces (no tabs).
  * Semicolons `MUST` be written at the end of every statement.
  * Variable and parameter declarations `MUST` prioritize `const` over `let`, and prohibit `var`.
* **Kotlin**:
  * Code formatting `MUST` adhere to the Kotlin Style Guide and `ktlint` rules.
  * Indentation `MUST` be exactly 4 spaces (no tabs).
  * Member properties `MUST` be declared at the top of classes; companion objects `MUST` be declared at the very bottom.

### Folder and Module Structure

The SHIP codebase uses a strict **Modular Monolith** structure in the backend repository and a clean **MVVM** layout in the Android repository.

```
Smart Healthcare Management System/
├── backend/                             # Core Backend Monolith (Node.js/TS)
│   ├── src/
│   │   ├── app.ts                       # Monolith Application Root
│   │   ├── config/                      # Global Configurations (DB, KMS, Firebase)
│   │   └── modules/                     # Modules with strictly defined boundaries
│   │       ├── user/                    # UserModule: Authentication, Session, RBAC
│   │       ├── patient/                 # PatientModule: UHID, Profiles, Consent
│   │       ├── queue/                   # QueueModule: Appointments, Tokens, Polling
│   │       ├── ipd/                     # IPDModule: Admissions, Beds, Discharges
│   │       ├── lab/                     # LabModule: Orders, Workflow, PDF uploads
│   │       ├── pharmacy/                # PharmacyModule: Prescriptions, Stock logs
│   │       ├── billing/                 # BillingModule: Invoicing, Insurance claims
│   │       └── ai/                      # AIModule: Gemini wrappers (Scribe, Chat)
│   ├── tests/                           # Global Integration and System Tests
│   ├── docker-compose.yml               # Local infra orchestration (Postgres, MinIO, Vault)
│   ├── package.json                     # Strict version pinned package dependencies
│   └── tsconfig.json                    # Strict compiler configuration
└── android/                             # Android App Workspace
    ├── app/
    │   ├── src/main/java/com/ship/app/
    │   │   ├── data/                    # Repository Layer, Local Cache, API clients
    │   │   │   ├── cache/               # SQLCipher Local Room DB Cache
    │   │   │   └── remote/              # Retrofit API clients
    │   │   ├── ui/                      # Presentation Layer (Jetpack Compose)
    │   │   │   ├── patient/             # Patient-facing UI screens
    │   │   │   └── doctor/              # Doctor-facing UI screens
    │   │   └── viewmodel/               # ViewModels (Business Logic State mapping)
    │   └── build.gradle.kts             # Native android build configuration
```

### Naming Conventions
* **Files**: TypeScript files `MUST` use `kebab-case.ts` (e.g. `audit-logger.ts`). Kotlin files `MUST` use `PascalCase.kt` matching the class name.
* **Classes**: `MUST` use `PascalCase` (e.g. `PatientRepository`, `BillingController`).
* **Interfaces**: `MUST` use `PascalCase` and be prefixed with a capital `I` (e.g. `IPatientService`).
* **Functions & Methods**: `MUST` use `camelCase` starting with a verb (e.g. `generateUniqueUhid()`, `allocateBed()`).
* **Variables & Properties**: `MUST` use `camelCase` (e.g. `patientBloodGroup`, `isConsentGiven`).
* **Database Tables**: `MUST` use pluralized `snake_case` (e.g. `patients`, `queue_tokens`).
* **Database Columns**: `MUST` use singular `snake_case` (e.g. `assigned_bed_id`, `created_at`).

### Git Workflow and Branching Model
* **Model**: Developers `MUST` follow the **GitFlow** branching model.
  * `main`: Represents stable production releases. Direct commits are strictly prohibited.
  * `develop`: Integration branch for active feature merges.
  * `feature/F-[MODULE]-[NUMBER]-[short-desc]`: Active feature development branch.
  * `bugfix/[ticket-id]-[short-desc]`: Hotfix or bug resolution branch.
* **Commit Message Format**: Commit messages `MUST` conform to the following template:
  `[MODULE] F-ID: Short imperative action description`
  * *Example*: `[REG] F-REG-01: Add sequential UHID validation and model constraints`
  * *Example*: `[SEC] F-SEC-02: Enforce Secure HttpOnly cookies for staff sessions`

### Pull Request (PR) Requirements
1. **Review Count**: A minimum of **2 approved peer reviews** `MUST` be logged before any merge to `develop` or `main`.
2. **CI Pipeline Pass**: The automated CI pipeline `MUST` pass with zero errors (covering Linter, SAST scanners, and compiler checks).
3. **Test Coverage Threshold**: Merge requests `MUST` maintain or exceed **80% line and branch coverage** across all modules.
4. **Mandatory PR Checklist**:
   - [ ] Verified that all sensitive fields (`RESTRICTED` data class) are handled via application field-level encryption (FLE).
   - [ ] Confirmed that all new database fields have corresponding audit logging rules (pre/post-states).
   - [ ] Validated that role authorization guards are active on all new controller endpoints.
   - [ ] Confirmed that no raw SQL queries are written without parameterized variable bindings to prevent SQL Injection.

---

## 5. Build and Deployment

### Local Setup (Day One Guide)
To set up a local development instance on a new machine, execute the following commands in order:

```powershell
# 1. Clone the project repository
git clone https://github.com/hospital-it/ship-platform.git
cd ship-platform/backend

# 2. Install pinned dependencies
npm ci

# 3. Spin up local database, MinIO object storage, and HashiCorp Vault KMS
docker-compose up -d

# 4. Verify that local infrastructure containers are running
docker ps

# 5. Initialize the database schema and execute migration scripts
npm run db:migrate

# 6. Seed the standard medicines formulary and default roles
npm run db:seed

# 7. Start the backend application dev server
npm run dev
```

### Build Pipeline Stages
All code changes committed to the remote repository `MUST` pass through these sequential CI stages:
1. **LINTING**: Runs `eslint` (backend) and `ktlint` (android) to verify syntax and styling compliance.
2. **SECURITY ANALYSIS (SAST)**: Runs automated vulnerability scanning (e.g., Snyk or Semgrep) on dependencies and code blocks.
3. **COMPILATION**: Builds the TypeScript source to JavaScript and compiles the Android App project.
4. **UNIT TESTING**: Executes all unit tests. Any failure immediately stops the pipeline.
5. **INTEGRATION TESTING**: Provisions an isolated database instance and runs endpoint suite tests (e.g., Supertest API integration tests).
6. **PACKAGING**: Builds production Docker images for the backend monolith and signs release `.aab` or `.apk` files for Android.

### Environment Matrix
Config, services, and data environments differ according to the following matrix:

| Aspect | Development (Dev) | Staging | Production (Prod) |
| :--- | :--- | :--- | :--- |
| **Config Source** | Local `.env` file | Consul / Vault Sandbox | Pinned Vault KMS Environment |
| **Database** | Local Postgres (non-TLS) | Isolated Cloud PostgreSQL | High-Availability Cluster (TLS 1.3 enforced) |
| **Storage** | Local filesystem folders | MinIO Staging Bucket | Local Hospital MinIO cluster with mirror backups |
| **Firebase Auth** | Firebase Local Emulator | Firebase Project Sandbox | Production Project with SMS gateway enabled |
| **Gemini API** | Mock AI client / Stub | Real Gemini API (low rate-limit) | Production Gemini API (Enterprise rate-limit) |
| **TLS Policy** | HTTPS Optional | TLS 1.2 Minimum | TLS 1.3 Enforced (with SSL Pinning on Android) |

### Release Versioning
The platform utilizes **Semantic Versioning (SemVer 2.0.0)**. Version tags follow the format `MAJOR.MINOR.PATCH` (e.g. `v1.2.3`):
* **MAJOR**: Incremented for incompatible API changes or core workflow architectural revisions (e.g. migrating from modular monolith to microservices).
* **MINOR**: Incremented for backward-compatible functional enhancements (e.g., adding a new module).
* **PATCH**: Incremented for backward-compatible bug resolutions and minor security updates.

---

## 6. Performance Requirements

These measurable service level agreements (SLAs) `MUST` be met and verified before shipping any release to production:

1. **Web Portal Load Times**: Any portal page (Admin, Reception, Lab, Billing, Pharmacy) `MUST` load in less than **2.0 seconds** under standard LAN connections (>= 10 Mbps).
2. **Mobile API Response Latency**: All endpoint requests initiated by the Patient or Doctor Android App (such as token queues, consult histories, and bookings) `MUST` return responses in less than **500ms** under normal network conditions.
3. **Analytics Dashboard Processing**: Aggregating up to 10,000 historical billing or room occupancy records to construct executive charts `MUST` compile and display in less than **3.0 seconds**.
4. **AI Scribe Note Generation**: The transcribing and SOAP formatting of dictation audio files (up to 2 minutes in duration) `MUST` complete in less than **15.0 seconds** from the time the file upload completes.
5. **Throughput and Capacity**: The API Gateway `MUST` handle up to **100 concurrent requests** with a server-side error rate of less than **0.1%** (HTTP 5xx status codes).

---

## 7. Dependency Policy

### Criteria for Adding a Dependency
No dependency `MAY` be added to any module of the application unless it meets the following criteria:
1. **Open Source License**: Must be licensed under MIT, Apache 2.0, or BSD. Copyleft licenses (GPL, AGPL) are strictly forbidden.
2. **Active Maintenance**: The library must have had at least two updates in the last 12 months and have no unresolved critical CVEs.
3. **Single Core Responsibility**: Small utility libraries (e.g. pad-left) are forbidden; helper functions must be implemented locally.
4. **Impact Assessment**: The package must not increase the compiled bundle size (Web Portal) or APK size (Android) by more than 2MB without explicit Tech Lead approval.

### Vulnerability Scan Cadence
* Dependency audit scans (e.g., `npm audit` or `Snyk`) `MUST` be run as part of the automated CI pipeline on every pull request.
* A full repository audit `MUST` be scheduled to run weekly in the main repository, generating automated alerts if any CVE score > 7.0 is detected.

---

## 8. Hard Constraints

The development and operations teams `MUST NOT` bypass the following architectural and security boundaries. Violation of these rules compromises system integrity, HIPAA compliance, and hospital operation stability.

1. **No Client-Side Deletion or Editing of Finalized Medical Records**: Attending prescriptions, clinical consultation notes, and uploaded lab report PDFs `MUST NOT` support any deletion or modification pathways after completion, enforcing legal medical record retention laws.
2. **No WebSockets for Live Queue Updates**: Live queue tracking `MUST` use HTTP polling at a fixed 30-second interval. WebSockets `MUST NOT` be implemented, to prevent server thread starvation under high concurrent patient loads.
3. **No Direct Inter-Module Database Access**: Code in one module (e.g., `BillingModule`) `MUST NOT` perform direct database queries on tables owned by another module (e.g., `PatientModule` PII details). Communication `MUST` go through the respective module's internal TypeScript interfaces/services.
4. **No Storage of Plaintext PII/PHI**: Patient names, addresses, phone numbers, vitals, and diagnoses `MUST` undergo application-layer Field-Level Encryption (FLE) before being written to disk. Key management `MUST` be handled exclusively via the external KMS.
5. **No Ambient Multi-Speaker Recording**: The AI Scribe `MUST` only accept explicit voice dictation summaries uploaded by a doctor. Real-time, multi-speaker ambient room conversation recording is strictly out of scope due to consent and privacy regulations.
6. **No Automated Third-Party Network Integration**: Pharmacy inventory management (F-PHR-02) and billing insurance claims (F-BIL-02) `MUST` remain manual interfaces. Direct automated integrations with external pharmacy databases or automated insurance clearinghouse networks `MUST NOT` be implemented in Phase 1.
7. **No Fallbacks to Insecure Protocols**: Non-HTTPS configurations, HTTP cleartext traffic, and TLS versions below 1.3 `MUST` be rejected at the API Gateway.
