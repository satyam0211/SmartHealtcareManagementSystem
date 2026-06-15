# UI Prompts Document
## Smart Healthcare Intelligence Platform v1.0

This document contains generation prompts for every screen, global component, and design token format. Platforms: **Android Mobile** (for Patients and Doctors, using Material You / Material Design 3 tokens) and **Web React** (for Reception, Nurse, Lab, Pharmacy, Billing, Admin, and Super Admin).

---

## 1. Patient App Screens (Android Mobile)

### SCR-PT-01 — Patient Login (Firebase OTP)

#### Figma AI
```text
Screen: SCR-PT-01 Patient Login
Platform: Android Mobile (Material You / MD3)
Purpose: SMS OTP verification for patients.
Layout: Vertical stack layout, 16dp outer gutters. Centered branding text at top. Two inputs vertically stacked in center: 1. Phone number text input with standard validation, 2. OTP Code numeric input. Buttons stacked at bottom: "Send OTP" (outlined button style) and "Login" (filled button style, height 48dp).
Color Tokens: primary (#006874), secondary (#4a6267), background (#f1f5f9), surface (#f8fafc), on-primary (#ffffff), on-surface (#0f172a), error (#ba1a1a).
Typography Tokens: Display Large (Outfit, 32sp, weight 700, line height 40sp) for branding title; Label Large (Roboto, 14sp, weight 500, line height 20sp) for buttons and inputs.
Spacing: space-sm (8dp) between inputs, space-lg (24dp) before buttons stack.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/PatientLoginScreen.kt
interface PatientLoginProps {
  onSendOtp: (phoneNumber: string) => Promise<boolean>;
  onLoginConfirm: (otpCode: string) => Promise<boolean>;
  isLoading: boolean;
  errorMsg?: string;
}
// Calls: Firebase SDK Verification and POST /v1/auth/patients/login
// Returns: { success: boolean, data: { sessionToken: string, patient: { id: string, uhid: string } } }
// Color Tokens: primary = "#006874", background = "#f1f5f9", error = "#ba1a1a"
// Accessibility: Enforce contentDescription on buttons, label associations on input fields.
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-01 Patient Login screen. A clean, high-contrast Material You dark-teal primary header reads "SHIP Mobile". In the center, a numeric phone entry field reads "+1 555-0199". Below it, an OTP entry field shows placeholder dots. At the bottom, a primary filled button reads "Login" (teal #006874 background with white text). High-density, professional clean clinical design.
```

---

### SCR-PT-02 — Patient Home Dashboard

#### Figma AI
```text
Screen: SCR-PT-02 Patient Home Dashboard
Platform: Android Mobile (Material You / MD3)
Purpose: Patient home dashboard listing appointments and action shortcuts.
Layout: Bottom Navigation Bar with 4 tabs (Home, Queue, Reports, Chat). Main page header displaying greeting and current patient name. Below header: a highlighted Card containing the next upcoming appointment details (Doctor name, specialty, date, and time). Below the card: a 2x2 grid of action shortcut Buttons (Book Appointment, Triage Chat, View Reports, Token Queue).
Color Tokens: primary (#006874), secondary (#4a6267), background (#f1f5f9), surface (#f8fafc), on-surface (#0f172a), primary-variant (#004f59).
Typography Tokens: Headline Medium (Outfit, 24sp) for patient greeting; Body Medium (Roboto, 14sp) for card content and summaries.
Spacing: space-md (16dp) gutters and margins, space-sm (8dp) for grid gaps.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/PatientDashboardScreen.kt
interface PatientDashboardProps {
  patientName: string;
  upcomingAppointment?: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
  };
  onNavigateTo: (route: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/appointments
// Returns: List of appointment objects
// Colors: primary = "#006874", surface = "#f8fafc"
// Accessibility: Dynamic type scaling up to 200%; aria-labeled shortcuts.
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-02 Patient Home Dashboard. Header greeting reads "Welcome, Jane Doe". Underneath, a rounded slate-teal card (#f8fafc card surface) outlines an appointment: "Dr. Smith - Cardiology, June 20 at 09:30 AM". Below it are four clean shortcut tiles (Teal outlines on slate gray). A bottom navigation bar displays four distinct MD3 navigation tabs.
```

---

### SCR-PT-03 — Book Appointment

#### Figma AI
```text
Screen: SCR-PT-03 Book Appointment
Platform: Android Mobile
Purpose: Select doctor and book appointment slot.
Layout: Vertical scrolling list. Top: Select Doctor dropdown menu. Below: Calendar Date Picker (horizontal grid showing days of current month). Bottom: 15-minute slot grid (3 columns, showing available timeslots). Sticky bottom floating button reads "Book Appointment".
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), error (#ba1a1a).
Typography Tokens: Title Medium (Roboto, 18sp) for headers; Label Large (Roboto, 14sp) for slots and CTA.
Spacing: space-sm (8dp) slots gap, space-md (16dp) margins.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/BookAppointmentScreen.kt
interface BookAppointmentProps {
  doctorsList: Array<{ id: string, name: string, specialty: string }>;
  availableSlots: Array<{ time: string, isAvailable: boolean }>;
  onDateChange: (date: string) => void;
  onConfirmBooking: (doctorId: string, date: string, slot: string) => Promise<boolean>;
  isLoading: boolean;
}
// Calls: GET /v1/appointments, POST /v1/appointments
// Returns: { success: boolean, data: { appointmentId: string, status: string } }
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-03 Book Appointment screen. Top dropdown shows "Dr. Smith (Cardiology)". Underneath, a clean row selector highlights "June 20". A grid of timeslots shows "09:30 AM" selected in solid teal (#006874), and other booked slots are grayed out. Sticky bottom button reads "Book Appointment".
```

---

### SCR-PT-04 — Live Queue Tracking

#### Figma AI
```text
Screen: SCR-PT-04 Live Queue Tracking
Platform: Android Mobile
Purpose: Remote live queue wait time tracking.
Layout: Centered layout. Displays a large Card containing: 1. Token number (large bold digits), 2. Waitlist counter: "Patients Ahead of You: [count]", 3. Dynamic waiting time counter: "[time] minutes estimated". Pull-to-refresh is enabled.
Color Tokens: primary (#006874), surface (#f8fafc), secondary (#4a6267), warning (#e28704).
Typography Tokens: Display Large (Outfit, 32sp) for token digits; Headline Medium (Outfit, 24sp) for minutes.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/LiveQueueScreen.kt
interface LiveQueueProps {
  tokenNumber: string;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  onPullToRefresh: () => Promise<void>;
  isOffline: boolean;
}
// Calls: GET /v1/queues/tokens/active (HTTP Polling, no WebSockets, 30s interval)
// Returns: { tokenId: string, tokenNumber: string, patientsAhead: number, estimatedWaitTimeMinutes: number, status: string }
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-04 Live Queue Tracking. In the center, a large card with a glowing teal outline displays a prominent token number "T-101". Below it, text reads: "Patients Ahead: 2" and "30 Minutes Estimated". A pull-down refresh arrow indicator is visible at the top.
```

---

### SCR-PT-05 — Lab Reports List

#### Figma AI
```text
Screen: SCR-PT-05 Lab Reports List
Platform: Android Mobile
Purpose: Lists patient's diagnostic PDF reports.
Layout: Simple vertical list. Each row displays an icon representing PDF, the Report Name, the Upload date, and two actions buttons: "Download" (outlined button) and "Explain" (filled button).
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), info (#0284c7).
Typography Tokens: Title Medium (Roboto, 18sp) for row title; Body Small (Roboto, 12sp) for date.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/LabReportsListScreen.kt
interface LabReportsListProps {
  reports: Array<{ id: string, testName: string, uploadedAt: string }>;
  onDownloadReport: (reportId: string) => void;
  onExplainReport: (reportId: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/lab/reports
// Returns: List of report objects with signed URLs
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-05 Lab Reports List. A vertical feed displays rows: "Complete Blood Count - June 15, 2026" with a red PDF icon and two clean buttons: "Download" and a highlighted "Explain" button.
```

---

### SCR-PT-06 — AI Symptom Chatbot

#### Figma AI
```text
Screen: SCR-PT-06 AI Symptom Chatbot
Platform: Android Mobile
Purpose: Symptom triage assistant chatbot interface.
Layout: Scrollable chat layout. Top: Sticky header warning disclaimer card. Center: Messages balloon logs (alternating light-gray background for patient messages, teal background for AI recommendations). Bottom: Input text field with Send button.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), warning (#e28704).
Typography Tokens: Body Medium (Roboto, 14sp) for messages.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/SymptomChatScreen.kt
interface SymptomChatProps {
  chatLogs: Array<{ sender: 'patient' | 'ai', message: string }>;
  onSendMessage: (text: string) => Promise<void>;
  isWaitingResponse: boolean;
}
// Calls: POST /v1/ai/symptoms/triage
// Returns: { urgencyLevel: string, recommendedSpecialty: string, analysis: string, disclaimer: string }
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-PT-06 AI Symptom Chatbot. A yellow warning banner at the top reads: "This is not a diagnostic tool...". Below is a chat dialogue showing a patient message "Chest pressure when climbing stairs" and a detailed teal AI response bubble recommending a "Cardiologist".
```

---

### SCR-PT-07 — AI Lab Report Explainer Modal

#### Figma AI
```text
Screen: SCR-PT-07 AI Lab Report Explainer Modal
Platform: Android Mobile (Modal Sheet Overlay)
Purpose: Show simplified Gemini-generated report summary.
Layout: Bottom sheet slide-up overlay covering 80% screen height. Contains: 1. Close icon top right, 2. Text layout showing simplified medical explanations, 3. Highlighted warning disclaimer at bottom.
Color Tokens: surface (#f8fafc), primary (#006874), secondary (#4a6267), warning (#e28704).
Typography Tokens: Title Medium (Roboto, 18sp) for headers; Body Medium (Roboto, 14sp) for text.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/LabReportExplainerModal.kt
interface LabReportExplainerModalProps {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
  explainSummary?: string;
  isLoading: boolean;
  errorMsg?: string;
}
// Calls: POST /v1/ai/lab-reports/{id}/explain
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame with a slide-up bottom sheet overlay covering the report screen. The modal reads "AI Report Summary" and displays text: "Your hemoglobin level is 14.2 g/dL, which is normal...". At the bottom, a prominent warning disclaimer is outlined.
```

---

## 2. Doctor App Screens (Android Mobile)

### SCR-DR-01 — Staff Login Portal

#### Figma AI
```text
Screen: SCR-DR-01 Staff Login Portal
Platform: Android Mobile (and responsive web variant)
Purpose: Secure gateway credentials login for all hospital staff.
Layout: Centered card layout. Display Large title "SHIP Portal". Inputs stacked vertically in center: Email and Password (masked). Primary filled Button "Sign In" at bottom of card.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), on-surface (#0f172a), error (#ba1a1a).
Typography Tokens: Display Large (Outfit, 32sp) for title; Label Large (Roboto, 14sp) for inputs/buttons.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android / Web Responsive React
// File Path: components/StaffLogin.tsx
interface StaffLoginProps {
  onSignInSubmit: (email: string, pass: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string;
}
// Calls: POST /v1/auth/staff/login
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop browser preview showing SCR-DR-01 Staff Login Portal. In the center of a slate-gray background, a clean white card displays "SHIP Portal". It features an email input, password input, and a dark-teal button reading "Sign In". High security, sterile, clinical layout.
```

---

### SCR-DR-02 — Doctor Schedule Dashboard

#### Figma AI
```text
Screen: SCR-DR-02 Doctor Schedule Dashboard
Platform: Android Mobile
Purpose: Daily schedule waitlist queue dashboard.
Layout: Header displaying Doctor name and roster info. Main list showing today's appointments. Each row displays Token number, Patient Name, appointment slot time, and a highlighted "Call" button (primary filled style).
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), success (#0f766e).
Typography Tokens: Headline Medium (Outfit, 24sp) for header; Label Large (Roboto, 14sp) for list rows.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/DoctorDashboardScreen.kt
interface DoctorDashboardProps {
  doctorName: string;
  activeQueue: Array<{ tokenId: string, tokenNumber: string, patientName: string, timeSlot: string, status: string }>;
  onCallToken: (tokenId: string) => Promise<void>;
  isLoading: boolean;
}
// Calls: GET /v1/queues/tokens/active, PUT /v1/queues/tokens/{id}/status
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-DR-02 Doctor Dashboard. Header reads "Dr. Smith". A table of patient entries lists "T-101 - Jane Doe - 09:30 AM" with a prominent green "Call" button on the right side of the row. Clean, functional, grid-aligned.
```

---

### SCR-DR-03 — Patient Medical Search

#### Figma AI
```text
Screen: SCR-DR-03 Patient Medical Search
Platform: Android Mobile
Purpose: Search patient directories.
Layout: Top sticky Search Input field with filter chips below (OPD, IPD). Main list below displaying search results (Name, Gender, DOB, and UHID).
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/PatientSearchScreen.kt
interface PatientSearchProps {
  onSearchQuery: (query: string) => Promise<Array<{ id: string, name: string, uhid: string, dob: string }>>;
  onSelectPatient: (patientId: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/patients/{id} (using directory filter queries)
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-DR-03 Patient Search screen. A search bar at the top displays the query text "Jane". Below, search result list cards display patient summaries: "Jane Doe (UHID-2026-000001, DOB: 1990-05-15)".
```

---

### SCR-DR-04 — Consultation Workspace

#### Figma AI
```text
Screen: SCR-DR-04 Consultation Workspace
Platform: Android Mobile
Purpose: Clinical record notes, diagnoses, and workflows.
Layout: Multi-section form. 1. Vitals card at top (BP, HR, Weight, Temp), 2. Notes text area (clinical notes), 3. Diagnosis text input, 4. Recovery Status dropdown list. Sticky bottom buttons stack: "AI Scribe", "Prescribe", and "Save Consult".
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), secondary (#4a6267).
Typography Tokens: Title Medium (Roboto, 18sp) for sections; Body Medium (Roboto, 14sp) for notes.
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/ConsultationWorkspaceScreen.kt
interface ConsultationWorkspaceProps {
  patientId: string;
  vitals: { bp: string, hr: number, temp: number, weight: number };
  onSaveConsultation: (notes: string, diagnosis: string, status: string) => Promise<boolean>;
  onLaunchScribe: () => void;
  onLaunchPrescription: () => void;
  isLoading: boolean;
}
// Calls: POST /v1/consultations
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-DR-04 Consultation Workspace. Top card shows triage vitals: "BP: 120/80, HR: 72 bpm". Underneath are structured text entry fields for clinical notes and diagnosis, with prominent action buttons at the bottom for "AI Scribe" and "Prescribe".
```

---

### SCR-DR-05 — Prescription Writer Form

#### Figma AI
```text
Screen: SCR-DR-05 Prescription Writer Form
Platform: Android Mobile
Purpose: Build drug orders from standard formulary.
Layout: Dynamic itemized form. Top: Medicine search box with autocomplete suggestions. For each added drug card: dosage field, duration field, instructions text field, and delete icon. Bottom: "Save Prescription" button.
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/PrescriptionWriterScreen.kt
interface PrescriptionWriterProps {
  consultationId: string;
  onSearchMedicines: (query: string) => Promise<Array<{ id: string, name: string }>>;
  onSavePrescription: (items: Array<{ medicineId: string, dosage: string, duration: string, instructions: string }>) => Promise<boolean>;
  isLoading: boolean;
}
// Calls: GET /v1/medicines, POST /v1/prescriptions
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-DR-05 Prescription Writer Form. Autocomplete dropdown list displays "Amoxicillin 500mg". Below is a card with structured input fields: "Dosage: 1 twice daily", "Duration: 5 days", and "Instructions: After food".
```

---

### SCR-DR-06 — AI Scribe Dictation Modal

#### Figma AI
```text
Screen: SCR-DR-06 AI Scribe Dictation Modal
Platform: Android Mobile (Modal overlay)
Purpose: Capture clinical dictations and review generated SOAP notes.
Layout: Modal sheet covering 85% height. Top: Close icon. Center: large microphone record button with standard waveform graphic. Bottom: text preview area displaying generated SOAP markdown text, with primary filled button "Apply Notes" at bottom.
Color Tokens: surface (#f8fafc), primary (#006874), error (#ba1a1a), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/ScribeModal.kt
interface ScribeModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadAudio: (audioUri: string) => Promise<string>; // returns SOAP text
  onApplySoapNotes: (soapText: string) => void;
  isLoading: boolean;
}
// Calls: POST /v1/ai/scribe/sessions/{id}/transcribe
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame with a slide-up modal overlay showing SCR-DR-06. In the center is a glowing red microphone recording button with a pulsing soundwave graphic. Below, a text box displays generated SOAP clinical notes in structured paragraphs.
```

---

### SCR-DR-07 — Patient Risk Flags View

#### Figma AI
```text
Screen: SCR-DR-07 Patient Risk Flags View
Platform: Android Mobile
Purpose: Read-only clinical alerts view.
Layout: Card deck. Displays a list of risk cards: 1. Readmission risk card (highlighted in error red if yes), 2. Chronic condition flags, 3. Critical lab value indicators.
Color Tokens: background (#f1f5f9), surface (#f8fafc), error (#ba1a1a), warning (#e28704).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: Android (Kotlin / Jetpack Compose)
// File Path: app/src/main/java/com/ship/ui/screens/RiskFlagsScreen.kt
interface RiskFlagsProps {
  patientId: string;
  riskFlags?: {
    readmissionRisk: boolean;
    chronicConditionsFlag: boolean;
    criticalLabValues: boolean;
    alerts: Array<string>;
  };
  isLoading: boolean;
}
// Calls: GET /v1/ai/patients/{id}/risk-flags
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Android phone frame showing SCR-DR-07 Risk Flags View. A prominent red warning card at the top reads: "WARNING: Readmission Risk. Patient discharged from inpatient care within the last 30 days." Clean, high-impact clinical alert design.
```

---

## 3. Web Portal Screens (Web React / Vanilla CSS)

### SCR-RC-01 — Reception Dashboard

#### Figma AI
```text
Screen: SCR-RC-01 Reception Dashboard
Platform: Web Responsive Desktop (1440px grid)
Purpose: Schedule tracking, check-ins, and registration entry-point.
Layout: Top navigation header with staff metadata and sign-out. Left sidebar menu. Main body: 1. Top row stats widgets, 2. Large grid table displaying today's appointments (Name, UHID, Doctor, Slot, check-in status), 3. Action buttons: "New Patient" and "Check-in".
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), on-surface (#0f172a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/reception/ReceptionDashboard.tsx
interface ReceptionDashboardProps {
  appointmentsList: Array<{ id: string, uhid: string, name: string, doctorName: string, timeSlot: string, status: string }>;
  onCheckInPatient: (appointmentId: string) => Promise<void>;
  onNavigate: (route: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/appointments, POST /v1/queues/tokens
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-RC-01. A sidebar menu is on the left. The main grid shows today's outpatient schedule with patient columns. A highlighted blue "Check-In" button sits next to the entry for patient "Jane Doe".
```

---

### SCR-RC-02 — Patient Registration Form

#### Figma AI
```text
Screen: SCR-RC-02 Patient Registration Form
Platform: Web Responsive Desktop
Purpose: Captures patient demographic files.
Layout: Clean multi-column form inside a large white Card. Column 1: Personal (Name, DOB, Gender, Address). Column 2: Emergency (Contact Name, Phone, Notes). Bottom row: "Save Registration" (filled primary) and "Cancel" (outlined).
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/reception/PatientRegistrationForm.tsx
interface PatientRegistrationProps {
  onSaveProfileSubmit: (formData: any) => Promise<boolean>;
  isSaving: boolean;
  validationErrors?: Record<string, string>;
}
// Calls: POST /v1/patients
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-RC-02. In the center is a structured two-column form capturing personal and emergency contact information. Inputs have thin borders. At the bottom, a solid dark-teal button reads "Save Profile".
```

---

### SCR-RC-03 — Reception Scheduler

#### Figma AI
```text
Screen: SCR-RC-03 Reception Scheduler
Platform: Web Responsive Desktop
Purpose: Booking, waitlist, and calendar grids management.
Layout: Sidebar showing doctor lists. Center layout: large calendar grid with time slots. Right panel: waitlist queue lists.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/reception/ReceptionScheduler.tsx
interface ReceptionSchedulerProps {
  selectedDoctorId: string;
  schedulerDate: string;
  onCancelSlot: (apptId: string) => Promise<void>;
  onRescheduleSlot: (apptId: string, newDate: string, newTime: string) => Promise<void>;
  isLoading: boolean;
}
// Calls: GET /v1/appointments, PUT /v1/appointments/{id}/cancel, POST /v1/appointments
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-RC-03. A weekly calendar grid shows physician availability. Booked slots are blocked in slate-gray, and a highlighted slot is outlined in teal. Right side panel shows a chronological waitlist.
```

---

### SCR-RC-04 — Queue Token Generator

#### Figma AI
```text
Screen: SCR-RC-04 Queue Token Generator
Platform: Web Responsive Desktop
Purpose: Renders check-in token summaries.
Layout: Centered modal card layout displaying: 1. Success header icon, 2. Generated Token Number in large bold display, 3. Patient Name and UHID details, 4. "Print Token" button.
Color Tokens: primary (#006874), surface (#f8fafc), success (#0f766e).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/reception/QueueTokenGenerator.tsx
interface QueueTokenProps {
  tokenId: string;
  tokenNumber: string;
  patientName: string;
  uhid: string;
  onPrint: () => void;
  onClose: () => void;
}
// Calls: POST /v1/queues/tokens (triggered from dashboard check-in)
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal modal overlay showing SCR-RC-04. A dialog card features a green success checkmark, a prominent token display "T-101", patient details "Jane Doe", and a primary button reading "Print Token".
```

---

### SCR-NS-01 — Nurse Dashboard

#### Figma AI
```text
Screen: SCR-NS-01 Nurse Dashboard
Platform: Web Responsive Desktop
Purpose: Lists incoming check-ins and ward map summary data.
Layout: Three panels layout: 1. Left sidebar, 2. Central list displaying checked-in patient tokens waiting for triage vitals, 3. Right panel cards showing bed occupancy gauge metrics.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), success (#0f766e).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/nurse/NurseDashboard.tsx
interface NurseDashboardProps {
  triageQueue: Array<{ tokenId: string, tokenNumber: string, patientName: string, checkInTime: string }>;
  onSelectTriage: (tokenId: string) => void;
  bedOccupancyRate: number;
  isLoading: boolean;
}
// Calls: GET /v1/queues/tokens/active, GET /v1/analytics/executive
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-NS-01. Central table lists patient tokens waiting for triage. The right panel displays a circular gauge widget showing "Bed Occupancy: 78.5%". Clinical, clean spacing layout.
```

---

### SCR-NS-02 — Vital Signs Intake (Triage)

#### Figma AI
```text
Screen: SCR-NS-02 Vital Signs Intake (Triage)
Platform: Web Responsive Desktop
Purpose: Captures triage measurements before doctor consult.
Layout: Large card container. Inputs: Blood Pressure (systolic/diastolic check inputs), Heart Rate (integer), Temperature (decimal), and Weight. Bottom buttons: "Save Vitals" and "Cancel".
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/nurse/VitalsTriage.tsx
interface VitalsTriageProps {
  patientId: string;
  queueTokenId: string;
  onSaveVitalsSubmit: (bp: string, hr: number, temp: number, weight: number) => Promise<boolean>;
  isSaving: boolean;
  validationErrors?: Record<string, string>;
}
// Calls: POST /v1/triage/vitals
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-NS-02. In the center is a patient triage intake card. Input fields capture blood pressure, pulse, temperature, and weight. The "Save Vitals" button is highlighted in teal.
```

---

### SCR-NS-03 — Inpatient (IPD) Admission Form

#### Figma AI
```text
Screen: SCR-NS-03 Inpatient Admission Form
Platform: Web Responsive Desktop
Purpose: Admits patients and allocates beds.
Layout: Two-column form layout. Left: Patient search (UHID input) showing matching profile parameters. Right: Ward selection dropdown showing list of vacant bed numbers.
Color Tokens: primary (#006874), surface (#f8fafc), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/nurse/IpdAdmissionForm.tsx
interface IpdAdmissionProps {
  vacantBeds: Array<{ id: string, roomNumber: string, wardType: string }>;
  onAdmitPatient: (patientId: string, bedId: string) => Promise<boolean>;
  isLoading: boolean;
}
// Calls: POST /v1/admissions, GET /v1/beds (filtered by vacant)
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-NS-03. Left column inputs show the query "Jane Doe". Right column dropdown displays available rooms: "Room 302 - Bed A (ICU)".
```

---

### SCR-NS-04 — Bed Map Layout

#### Figma AI
```text
Screen: SCR-NS-04 Bed Map Layout
Platform: Web Responsive Desktop
Purpose: Real-time ward bed map tracking dashboard.
Layout: Grid map container. Categorized into three sections tabs: ICU, General Ward, Private Rooms. Each bed slot represented as a colored block: Green (Available), Red (Occupied), Yellow (Cleaning/Maintenance).
Color Tokens: primary (#006874), surface (#f8fafc), success (#0f766e), error (#ba1a1a), warning (#e28704).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/nurse/BedMapLayout.tsx
interface BedMapProps {
  bedsList: Array<{ id: string, roomNumber: string, wardType: 'ICU' | 'General' | 'Private', status: 'Available' | 'Occupied' | 'Cleaning' }>;
  onDischargePatient: (admissionId: string) => void;
}
// Calls: GET /v1/beds (real-time layout fetch)
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-NS-04 Bed Map. A large visual map displays bed blocks color-coded in green, red, and yellow. Selecting an occupied red block displays patient metadata and a "Discharge" action button.
```

---

### SCR-NS-05 — Inpatient Discharge Form

#### Figma AI
```text
Screen: SCR-NS-05 Inpatient Discharge Form
Platform: Web Responsive Desktop
Purpose: Discharge summary entry and invoicing.
Layout: Main card. Top: Length of stay metrics and patient details. Center: Discharge Summary text area. Bottom: "Complete Discharge" button (primary filled).
Color Tokens: primary (#006874), surface (#f8fafc), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/nurse/InpatientDischarge.tsx
interface InpatientDischargeProps {
  admissionId: string;
  patientDetails: { name: string, uhid: string, stayDays: number };
  onCompleteDischarge: (summary: string) => Promise<boolean>;
  isProcessing: boolean;
}
// Calls: POST /v1/admissions/{id}/discharge
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-NS-05. A checkout summary card details "Length of Stay: 5 Days". Below is a discharge notes field and a highlighted button reading "Discharge Patient".
```

---

### SCR-LS-01 — Lab Worklist Dashboard

#### Figma AI
```text
Screen: SCR-LS-01 Lab Worklist Dashboard
Platform: Web Responsive Desktop
Purpose: Lists incoming lab test orders.
Layout: Large grid table. Columns: Order ID, Patient, Test Name, Date, Status (Requested/Sample Collected/Processing/Completed/Uploaded), Action link.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/lab/LabWorklist.tsx
interface LabWorklistProps {
  orders: Array<{ id: string, name: string, testName: string, date: string, status: string }>;
  onSelectOrder: (orderId: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/lab/orders
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-LS-01. A large lab worklist table displays today's tests. Row 1 lists "Complete Blood Count - Requested" with an action link to open details.
```

---

### SCR-LS-02 — Lab Order Details

#### Figma AI
```text
Screen: SCR-LS-02 Lab Order Details
Platform: Web Responsive Desktop
Purpose: Update test sample lifecycle states.
Layout: Centered detail card. Details: Test parameters, patient. Buttons representing workflow transition states: "Collect Sample", "Start Processing", "Complete Test", "Upload Report".
Color Tokens: primary (#006874), surface (#f8fafc), success (#0f766e).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/lab/LabOrderDetails.tsx
interface LabOrderDetailsProps {
  orderId: string;
  orderDetails: { patientName: string, uhid: string, testName: string, status: string };
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onTriggerUpload: () => void;
  isLoading: boolean;
}
// Calls: PUT /v1/lab/orders/{id}/status
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-LS-02. A card displays details for "Complete Blood Count". Buttons display workflow transitions with "Collect Sample" highlighted in solid teal.
```

---

### SCR-LS-03 — Lab Report PDF Upload Form

#### Figma AI
```text
Screen: SCR-LS-03 Lab Report PDF Upload Form
Platform: Web Responsive Desktop
Purpose: File upload panel to attach PDF test results.
Layout: Centered card container. Features a large dotted Drag-and-Drop file box. Max file size indicator (10MB limit). Save button below.
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/lab/ReportPdfUpload.tsx
interface ReportPdfUploadProps {
  labOrderId: string;
  onUploadSubmit: (file: File) => Promise<boolean>;
  isUploading: boolean;
  errorMessage?: string;
}
// Calls: POST /v1/lab/reports/upload
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-LS-03. In the center is a dotted file uploader dropzone with a PDF icon and caption: "Drag and drop patient PDF report here, or browse (10MB limit)."
```

---

### SCR-PH-01 — Pharmacy Dashboard

#### Figma AI
```text
Screen: SCR-PH-01 Pharmacy Dashboard
Platform: Web Responsive Desktop
Purpose: Lists pending doctor prescriptions.
Layout: Grid table. Columns: Prescription ID, Patient Name, Doctor, Date, Status (Pending/Dispensed). Actions: "Fulfill", "View Inventory".
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/pharmacy/PharmacyDashboard.tsx
interface PharmacyDashboardProps {
  pendingPrescriptions: Array<{ id: string, patientName: string, doctorName: string, date: string, status: string }>;
  onSelectPrescription: (id: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/pharmacy/prescriptions
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-PH-01. A pharmacy queue dashboard lists pending prescriptions. A "Fulfill" button is highlighted next to patient "Jane Doe".
```

---

### SCR-PH-02 — Prescription Fulfiller

#### Figma AI
```text
Screen: SCR-PH-02 Prescription Fulfiller
Platform: Web Responsive Desktop
Purpose: Displays drug details and dispenses items.
Layout: Large panel. Displays patient details at top. Below, a table lists prescribed medicines, dosages, duration, instructions. Bottom: Fulfill Button (filled primary style).
Color Tokens: primary (#006874), surface (#f8fafc), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/pharmacy/PrescriptionFulfiller.tsx
interface PrescriptionFulfillerProps {
  prescriptionId: string;
  prescriptionDetails: {
    patientName: string;
    items: Array<{ medicineId: string, name: string, dosage: string, duration: string, instructions: string }>;
  };
  onFulfillSubmit: () => Promise<boolean>;
  isProcessing: boolean;
}
// Calls: POST /v1/pharmacy/prescriptions/{id}/fulfill
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-PH-02. Table outlines prescription items: "Amoxicillin 500mg, 1 twice daily, 5 days, after meals". At the bottom, a teal "Fulfill & Dispense" button is visible.
```

---

### SCR-PH-03 — Pharmacy Stock Inventory

#### Figma AI
```text
Screen: SCR-PH-03 Pharmacy Stock Inventory
Platform: Web Responsive Desktop
Purpose: Monitor local drug counts, expiries, and alerts.
Layout: Grid table. Columns: Drug Name, Stock level, Reorder threshold, Expiry date, Status alerts. Action: "Adjust Stock".
Color Tokens: primary (#006874), surface (#f8fafc), warning (#e28704), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/pharmacy/StockInventory.tsx
interface StockInventoryProps {
  inventoryList: Array<{ id: string, name: string, stock: number, threshold: number, expiry: string, alertStatus: string }>;
  onTriggerAdjustment: (medicineId: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/pharmacy/inventory
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-PH-03. Table lists pharmacy medicines. An entry for "Amoxicillin 500mg" displays stock count "450" and an action button reading "Adjust Stock".
```

---

### SCR-PH-04 — Manual Inventory Adjustment Form

#### Figma AI
```text
Screen: SCR-PH-04 Manual Inventory Adjustment Form
Platform: Web Responsive Desktop
Purpose: Adjust stock levels with reasoning validation.
Layout: Detail card. Inputs: Medicine Name (disabled), Quantity delta (+/- number), Expiry Date, and Reason (textarea). Bottom: Save button.
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/pharmacy/StockAdjustmentForm.tsx
interface StockAdjustmentProps {
  medicineId: string;
  medicineName: string;
  onAdjustmentSubmit: (delta: number, expiry: string, reason: string) => Promise<boolean>;
  isSaving: boolean;
}
// Calls: POST /v1/pharmacy/inventory/adjustments
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-PH-04. A card displays "Amoxicillin 500mg". Inputs show a quantity delta of "+100", an expiry date "2026-12-01", and a reason log "Restocked".
```

---

### SCR-BO-01 — Billing Queue Dashboard

#### Figma AI
```text
Screen: SCR-BO-01 Billing Queue Dashboard
Platform: Web Responsive Desktop
Purpose: Lists patient checkouts waiting for invoicing.
Layout: Grid table. Columns: Patient Name, UHID, Encounter (OPD/IPD), Discharge Date, Status (Unbilled/Pending), Action button.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/billing/BillingQueue.tsx
interface BillingQueueProps {
  pendingCheckouts: Array<{ id: string, name: string, uhid: string, type: 'OPD' | 'IPD', date: string }>;
  onSelectCheckout: (id: string) => void;
  isLoading: boolean;
}
// Calls: GET /v1/billing/queues
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-BO-01. A billing dashboard lists patients pending invoicing. An action button reading "Process Bill" is adjacent to the entry for patient "Jane Doe".
```

---

### SCR-BO-02 — Invoicing & Payment Generator

#### Figma AI
```text
Screen: SCR-BO-02 Invoicing & Payment Generator
Platform: Web Responsive Desktop
Purpose: Compile charges and generate invoices.
Layout: Split panel card. Left: list of outstanding itemized charges (consultation, lab, bed fees). Right: invoice total summary, Payment method dropdown, "Insurance" button, and "Complete Payment" button.
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/billing/InvoiceGenerator.tsx
interface InvoiceGeneratorProps {
  patientId: string;
  uhid: string;
  onGenerateInvoiceSubmit: (paymentMethod: 'Cash' | 'Card' | 'Pending Insurance') => Promise<boolean>;
  isProcessing: boolean;
}
// Calls: GET /v1/billing/patients/{uhid}/charges, POST /v1/billing/invoices
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-BO-02. Left panel shows itemized clinical charges totaling "$230.00". The right panel displays payment methods and a teal "Process Checkout" button.
```

---

### SCR-BO-03 — Insurance Claims Logger

#### Figma AI
```text
Screen: SCR-BO-03 Insurance Claims Logger
Platform: Web Responsive Desktop
Purpose: Log manual insurance claim policies.
Layout: Form card. Inputs: Policy Number, Insurance Provider Name, Claim Amount, Claim Details notes. Bottom: "Log Claim" button.
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/billing/ClaimsLogger.tsx
interface ClaimsLoggerProps {
  invoiceId: string;
  claimAmount: number;
  onLogClaimSubmit: (policy: string, provider: string, amount: number, details: string) => Promise<boolean>;
  isSaving: boolean;
}
// Calls: POST /v1/billing/claims
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-BO-03. Form inputs display "Policy Number: POL-99402", "Provider: HealthCare Corp", and a highlighted button reading "Log Claim".
```

---

### SCR-AD-01 — Admin Dashboard

#### Figma AI
```text
Screen: SCR-AD-01 Admin Dashboard
Platform: Web Responsive Desktop
Purpose: Hospital KPI analytics charts display.
Layout: Grid layout metrics deck. 4 Cards at top showing Revenue ($15,450.00), Bed Occupancy (78.5%), Avg Wait Time (22.4 min), and Patient Volume (142). Left Sidebar navigation menu. Below: revenue timeline charts and department performance metrics table.
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc), secondary (#4a6267).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/admin/AdminDashboard.tsx
interface AdminDashboardProps {
  kpis?: { dailyRevenue: number, bedOccupancy: number, waitTime: number, volume: number };
  onFetchForecasts: () => void;
  isLoading: boolean;
}
// Calls: GET /v1/analytics/executive, GET /v1/analytics/doctors, GET /v1/analytics/forecasts
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-AD-01 Admin Dashboard. Top widgets display daily revenue, bed occupancy, and waiting times. Below, a line chart shows daily revenue trends. Clean, premium clinical look.
```

---

### SCR-AD-02 — User Account Management

#### Figma AI
```text
Screen: SCR-AD-02 User Account Management
Platform: Web Responsive Desktop
Purpose: Create staff accounts and configure RBAC roles.
Layout: Split panel. Left: Form inputs to add user (Email, password, role dropdown, department dropdown). Right: grid table showing staff directory list (Email, Role, status, actions).
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9), error (#ba1a1a).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/admin/UserManagement.tsx
interface UserManagementProps {
  staffList: Array<{ id: string, email: string, role: string, department: string, status: string }>;
  onAddUserSubmit: (email: string, pass: string, role: string, deptId: string) => Promise<boolean>;
  onDisableUser: (id: string) => Promise<void>;
  isProcessing: boolean;
}
// Calls: POST /v1/admin/staff, POST /v1/auth/staff/login (Admin override calls)
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-AD-02. Left form card has inputs to create users. The right side table lists active staff credentials with red "Disable" buttons.
```

---

### SCR-AD-03 — Audit Log Viewer

#### Figma AI
```text
Screen: SCR-AD-03 Audit Log Viewer
Platform: Web Responsive Desktop
Purpose: Query security compliance audit trails.
Layout: Top filter panel (search by Patient ID, User ID, action). Main table displaying log records (Action, User ID, Changed Entity, IP Address, Timestamps).
Color Tokens: primary (#006874), background (#f1f5f9), surface (#f8fafc).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/admin/AuditLogViewer.tsx
interface AuditLogViewerProps {
  logs: Array<{ logId: number, action: string, userId: string, entityChanged: string, ip: string, date: string }>;
  onFilterQuery: (filters: any) => Promise<void>;
  isLoading: boolean;
}
// Calls: GET /v1/admin/audit-logs
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal displaying SCR-AD-03. Table lists system-wide logs: "Read - Doctor ID - Patients Table - IP: 192.168.1.5 - Timestamp". Search filters are at the top.
```

---

### SCR-SA-01 — Super Admin Configurations Console

#### Figma AI
```text
Screen: SCR-SA-01 Super Admin Configurations Console
Platform: Web Responsive Desktop
Purpose: Global settings and variables configuration.
Layout: Centered grid form. Inputs: Configuration keys (e.g. Clinic Start Time) with text values. Bottom: Save button (filled primary style).
Color Tokens: primary (#006874), surface (#f8fafc), background (#f1f5f9).
```

#### Bolt / Lovable / v0 (Component Code)
```typescript
// Platform: React Web (v18, Vanilla CSS)
// File Path: components/super-admin/ConfigConsole.tsx
interface ConfigConsoleProps {
  configurations: Array<{ key: string, value: string }>;
  onSaveConfig: (key: string, value: string) => Promise<boolean>;
  isSaving: boolean;
}
// Calls: PUT /v1/admin/config
```

#### Gemini / Image Generation (Mockup)
```text
Mockup: Desktop web portal showing SCR-SA-01. A centralized configuration panel lists system parameter variables and text values. A teal button at the bottom reads "Save Settings".
```

---

## 4. Global Component Prompts

### Button Component Prompt
```text
Create a standalone, reusable Button component. Supported styles: filled (primary background, white text) and outlined (border, primary color text). Minimum height target must be 48dp with 16dp left/right padding. Enforce all visual states: default, pressed (darkened color), focused (outer focus ring), disabled (gray, no click action), and loading (infinite spinner, labels hidden). Accessibility requires minimum touch size 48dp x 48dp and contrast ratio >= 4.5:1.
```

### Input Component Prompt
```text
Create a standalone, reusable Input text field component. Height 56dp with 12dp top/bottom and 16dp left/right padding. Shape must be rounded with 8dp radius. Enforce states: default (light border), focused (2dp primary color border), error (2dp red border, displays error caption below), disabled (light gray background, read-only). Enforce input label association for screen readers.
```

### Card Component Prompt
```text
Create a standalone, reusable Card container component. Padding 16dp, border radius 16dp, thin light-gray border, elevation-1 shadow. Enforce pressed states (elevation-2 shadow increase). Supports custom sub-layouts inside the card container.
```

---

## 5. Design Token Prompt

```text
Generate the design tokens file for this project containing the colors, spacing, typography scales, border radius, and elevations defined below.

Format output as three blocks:
1. Kotlin Object (for Android Compose)
2. CSS Variables (for Web Portals)
3. Swift Struct (for iOS compatibility)

Tokens:
- Colors:
  primary: #006874, primary-variant: #004f59, secondary: #4a6267, surface: #f8fafc, surface-variant: #e2e8f0, background: #f1f5f9, error: #ba1a1a, warning: #e28704, success: #0f766e, info: #0284c7, on-primary: #ffffff, on-surface: #0f172a, on-background: #0f172a, on-error: #ffffff
- Spacing:
  xs: 4dp/px, sm: 8dp/px, md: 16dp/px, lg: 24dp/px, xl: 32dp/px, xxl: 48dp/px
- Border Radius:
  none: 0dp/px, sm: 4dp/px, md: 8dp/px, lg: 16dp/px, full: 9999dp/px
- Elevations:
  0 to 5 (0 = 0dp, 1 = 2dp, 2 = 4dp, 3 = 8dp, 4 = 16dp, 5 = 24dp)
```
