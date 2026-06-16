# Task 020: AI Clinical Risk Alerts and Bed Demand Forecasting
**Status:** pending
**Priority:** P1
**Complexity:** high
**Estimated Time:** 12 hours
**Tags:** [backend, frontend, testing]

## Description
This task implements AI-assisted Clinical Risk Alerts (F-AI-04) and Bed Demand Forecasting models. For doctors, the backend parses patient medical histories, critical lab values, and previous admission records (warning if discharged within the last 30 days) to display clinical risk alerts on the Doctor Dashboard.

For administrators, the backend compiles historical room occupancy, billing rates, and patient volume statistics to render 7-day resource forecasting curves with graphical confidence intervals on the Analytics console.

## Document References

### PRD
- **Feature ID:** F-AI-04 (AI Clinical Risk Detection), F-ANA-03 (Operational Predictive Analytics)
- **User Story:**
  * As a Doctor, I want to see system-generated flags for readmission risk, high-risk patient profiles, and critical lab values.
  * As an Administrator, I want to see forecasts for bed demand, staffing needs, and inventory stock so that I can plan resources.
- **Acceptance Criteria:**
  1. Doctor Dashboard and Workspace display alert banner if patient's historical diagnoses indicate high-risk profile (severe chronic conditions).
  2. Red flag next to lab reports containing values in critical range.
  3. Readmission warning badge if patient was discharged from inpatient care within the last 30 days.
  4. Analytics screen displays "Forecasts" tab showing 7-day predictive curves.
  5. Forecasts display a clear "Confidence Interval" band.

### SRS
- **Requirement IDs:** FR-AI-04-01 (Risk Banner), FR-AI-04-02 (Readmission Check), FR-ANA-03-01 (7-day Forecast), FR-ANA-03-02 (Confidence Band)
- **SHALL statements:**
  * The system SHALL flag patient readmissions if occurring within 30 days of discharge.
  * The system SHALL render 7-day resource forecasts with confidence bands.

### Architecture
- **Component(s):** AI Service Wrapper, Doctor App, Web Portal (Admin dashboard)
- **Data Flow:** Doctor loads dashboard -> API fetches patient risk -> verifies timeline -> returns alerts. Admin clicks forecast -> calculates linear regression/forecasting model on PostgreSQL stay history -> returns 7-day values -> renders line chart.

### Database
- **Tables:** `consultations`, `reports`, `admissions`, `rooms`, `beds`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/ai/risk/{patientId}` (query risk alerts for patient)
  * `GET /api/analytics/forecasts` (calculate resource demand forecasts)
- **Auth/Role guard:** Doctor (Read risk), Administrator (Read forecasts).

### Security
- **Threats addressed:**
  * T-AI-04 (Unauthorized access to predictive models - restricted to authenticated staff roles)
- **Data classifications:** `RESTRICTED` Patient medical history indices, `CONFIDENTIAL` forecasting curves.

### Design
- **Screen(s):** SCR-DR-02 (Doctor Dashboard), SCR-DR-03 (Consultation Workspace), SCR-AD-02 (Operational Dashboard)
- **Components used:** Warning Banners, Readmission Badges, Shaded Chart Area (Confidence Interval)
- **Design tokens:** Error Color, Warning Color, Primary-variant Color

### Testing
- **Unit tests:** Readmission window date calculation tests
- **Integration tests:** IT-AI-04 (Risk detection calculation speed test)
- **Security tests:** None
- **UAT scenarios:** UAT-DR-04 (Doctor reviews patient readmission warnings), UAT-AD-03 (Admin views bed demand forecasts)

## Acceptance Criteria
- [ ] Doctor Dashboard displays a readmission alert badge if the patient has a discharge record dated within 30 days of today.
- [ ] System highlights lab reports displaying metrics flagged as critical.
- [ ] Admin console renders 7-day bed occupancy forecasts displaying a shaded confidence interval band.
- [ ] Risk APIs complete evaluation and return JSON responses in under 500ms.

## Dependencies
- task-016: Executive Operational Analytics Dashboard (forecasting extends analytics database aggregates)
- task-019: AI Medical Scribe

## Implementation Approach
### Step-by-step Plan:
1. Write `risk.service.ts` checking date differences between active appointments and previous admissions discharge dates.
2. Implement patient risk evaluation algorithms parsing diagnoses and lab values arrays.
3. Write forecasting model logic in `forecast.service.ts` calculating 7-day moving averages or regression formulas over historical occupancy rows.
4. Build the Alert badges and warning banners in the Doctor Android App.
5. Build the shaded 7-day forecasting chart using Chart.js in the Web Portal.

### Technical Considerations:
- Ensure forecasting formulas degrade gracefully if the database has less than 30 days of historical data.

### Architecture/Design Notes:
- Follows resource forecasting constraints outlined in Blueprint Section 36.

## Files to Modify/Create
- `backend/src/modules/ai/risk.service.ts` — Create patient risk evaluation service
- `backend/src/modules/billing/forecast.service.ts` — Implement forecasting calculations
- `android/app/src/main/java/com/ship/app/ui/doctor/DashboardScreen.kt` — Add risk badges in Compose
- `backend/src/modules/billing/analytics.controller.ts` — Add forecast endpoint path
