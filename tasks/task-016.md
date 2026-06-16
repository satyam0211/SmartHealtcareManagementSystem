# Task 016: Executive Operational Analytics Dashboard
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 10 hours
**Tags:** [backend, frontend]

## Description
This task implements the Executive Analytics Dashboard. It covers fetching and aggregating core operational data from invoices, admissions, and queue tokens tables to calculate KPIs: total daily/monthly revenue, real-time bed occupancy rates, average clinic waiting times, and doctor utilization rates.

For the frontend, it includes building the graphical dashboards in the Web Portal. Visual charts and tables must compile up to 10,000 historical records and render in under 3.0 seconds.

## Document References

### PRD
- **Feature ID:** F-ANA-01 (Operational Analytics Dashboard)
- **User Story:** As an Administrator, I want to monitor hospital-wide KPIs, including revenue, occupancy, wait times, patient volume, and department performance so that I can oversee hospital operations.
- **Acceptance Criteria:**
  1. Dashboard displays real-time aggregate charts showing: Total Revenue (daily, monthly), Bed Occupancy Rate, Average Waiting Time, and Patient Volume.
  2. Charts support filtering by Department.
  3. Dashboard refreshes metrics on demand, with data load completing in under 2 seconds.

### SRS
- **Requirement IDs:** FR-ANA-01-01 (KPI Compilation), FR-ANA-01-02 (Filter Rule), NFR-PERF-03 (Analytics Compile Limit)
- **SHALL statements:**
  * The system SHALL calculate aggregate revenue and bed occupancy.
  * The system SHALL compile analytics under 3 seconds.

### Architecture
- **Component(s):** Billing Service (Analytics sub-controller), Web Portal (Admin dashboard UI)
- **Data Flow:** Admin requests analytics -> Billing Service aggregates Postgres records -> compiles KPIs -> sends JSON -> Web Portal renders charts.

### Database
- **Tables:** `invoices`, `admissions`, `queue_tokens`, `users`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/analytics/operational` (fetch aggregate KPI metrics)
  * `GET /api/analytics/doctors` (fetch doctor utilization stats)
- **Auth/Role guard:** Administrator only.

### Security
- **Threats addressed:**
  * T-ANA-01 (Information disclosure of sensitive financial metrics - endpoint restricted strictly to Administrator role)
- **Data classifications:** `CONFIDENTIAL` Revenue numbers, department analytics.

### Design
- **Screen(s):** SCR-AD-02 (Executive Operational Dashboard)
- **Components used:** Line charts, Bar graphs, KPI Cards
- **Design tokens:** Primary Color, Secondary-variant Color, Typography Header-2

### Testing
- **Unit tests:** KPI aggregation mathematical checks
- **Integration tests:** IT-ANA-01 (Analytics data load execution speed test)
- **Security tests:** None
- **UAT scenarios:** UAT-AD-02 (Admin monitors hospital performance KPIs)

## Acceptance Criteria
- [ ] Analytics dashboard loads KPIs (revenue, bed occupancy, queue waiting times) in under 2.0 seconds over LAN.
- [ ] Filter controls update charts based on selected department (e.g. Cardiology).
- [ ] Average waiting time calculates correctly based on queue token timestamps.
- [ ] Only users with the `Administrator` role can execute the analytics API queries.

## Dependencies
- task-013: Invoicing, Billing Engine, and Manual Claims Logging (requires billing transactions logs)

## Implementation Approach
### Step-by-step Plan:
1. Write database aggregate queries in `analytics.service.ts` using SQL `SUM` and `AVG` functions over date ranges.
2. Build the `/api/analytics/operational` endpoint.
3. Integrate a charting library (such as Chart.js or D3.js) into the Web Portal.
4. Build the dashboard KPI cards and line/bar chart elements using Vanilla JS and CSS.
5. Implement query parameters to filter aggregates by department and time frames.

### Technical Considerations:
- Ensure the database index `idx_invoices_created_at` and `idx_queue_tokens_created_at` are utilized during aggregates.

### Architecture/Design Notes:
- Follows analytics specifications outlined in Blueprint Section 33.

## Files to Modify/Create
- `backend/src/modules/billing/analytics.controller.ts` — Create analytics routes
- `backend/src/modules/billing/analytics.service.ts` — Implement aggregate queries
- `backend/src/modules/billing/analytics.router.ts` — Define analytics endpoints
