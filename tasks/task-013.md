# Task 013: Invoicing, Billing Engine, and Manual Claims Logging
**Status:** pending
**Priority:** P0
**Complexity:** high
**Estimated Time:** 14 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Invoicing and Billing Engine. It covers compiling outstanding charges linked to a patient's UHID (OPD consultation fees, laboratory test costs, and IPD room bed stay charges) to generate a unified, itemized invoice.

Additionally, this task covers payment processing (marking invoices as "Paid") and logging manual insurance claims. Billing officers can enter patient insurance policy details and claim amounts, and update the claim status (Pending, Approved, Rejected) with mandatory text reasons for change.

## Document References

### PRD
- **Feature ID:** F-BIL-01 (Billing Engine), F-BIL-02 (Insurance Processing)
- **User Story:**
  * As a Billing Officer, I want to process consultation, lab, and procedure charges and generate invoices so that patient bills are settled.
  * As a Billing Officer, I want to manually log insurance claims by inputting claim details and policy numbers, and track status.
- **Acceptance Criteria:**
  1. Billing screen fetches all outstanding charges (fees, lab test costs, bed stay charges).
  2. Generates unified, itemized invoice with subtotal, taxes, and final total.
  3. Saving generates record in `Invoices` & `Payments` with status "Paid" or "Pending Insurance".
  4. Insurance section provides fields: Policy Number, Provider Name, Claim Amount, and details.
  5. Records claims details and initializes status to "Pending".
  6. Display interface to manually update claim status to "Approved" or "Rejected" (requires notes).

### SRS
- **Requirement IDs:** FR-BIL-01-01 (Aggregate Charges), FR-BIL-01-02 (PDF Invoice), FR-BIL-02-01 (Claim Fields), FR-BIL-02-02 (Status Notes)
- **SHALL statements:**
  * The system SHALL compile consultation, lab, and bed charges.
  * The system SHALL enforce notes on insurance status updates.

### Architecture
- **Component(s):** Billing Service, Web Portal (Billing console)
- **Data Flow:** Fetch patient charges -> aggregate -> generate invoice -> update payment status -> log insurance details -> insert row in `invoices` & `payments`.

### Database
- **Tables:** `invoices`, `payments`, `insurance_claims`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/billing/patients/{uhid}/charges` (retrieve charges)
  * `POST /api/billing/invoices` (create invoice)
  * `POST /api/billing/claims` (create claim)
  * `PUT /api/billing/claims/{id}/status` (update claim status)
- **Auth/Role guard:** Billing Officer, Administrator (Read), Patient (Own Read).

### Security
- **Threats addressed:**
  * T-BIL-01 (Falsifying insurance claims - role validation blocks non-billing staff)
  * T-BIL-02 (Double-billing or unpaid records - database constraints restrict invoice adjustments once paid)
- **Data classifications:** `RESTRICTED` Insurance policies, claim amounts, payment details.

### Design
- **Screen(s):** SCR-BO-02 (Patient Billing Dashboard), SCR-BO-03 (Claims Management console)
- **Components used:** Itemized lists, payment action grids, status dropdowns
- **Design tokens:** Primary Color, Typography Header-2

### Testing
- **Unit tests:** Tax calculation and charge aggregation unit tests
- **Integration tests:** IT-BIL-01 (Lab and IPD stay charge compilation test)
- **Security tests:** None
- **UAT scenarios:** UAT-BO-01 (Billing officer compiles bill and logs claim)

## Acceptance Criteria
- [ ] Billing controller successfully compiles charges from consultations, reports, and admissions tables.
- [ ] Generated invoice displays subtotal, calculated tax (e.g. 5%), and itemized total.
- [ ] Invoice creation is blocked if the patient has no outstanding checked-in charges.
- [ ] Claim status transitions to "Approved" or "Rejected" require a text description note.
- [ ] Patients can view their invoice history, but are blocked from creating invoices or editing claims.

## Dependencies
- task-010: Inpatient Admission, Bed, and Discharge Management (requires bed charge calculations)
- task-011: Lab Order and PDF Report Management (requires lab charge database logs)
- task-012: Pharmacy Prescription Fulfillment and Inventory Management

## Implementation Approach
### Step-by-step Plan:
1. Write `billing.service.ts` query aggregating unbilled records from the database.
2. Build itemized cost calculation modules.
3. Build the Billing Dashboard and Claims Management screens in the Web Portal using Vanilla JS.
4. Implement PDF invoice generation using a lightweight node library.
5. Set up RBAC guards preventing non-billing staff from accessing the `/api/billing/*` routes.

### Technical Considerations:
- Ensure the billing database updates set `payment_status` transactionally to prevent double-payment.

### Architecture/Design Notes:
- Follows manual billing and insurance guidelines defined in Blueprint Section 25 & 26.

## Files to Modify/Create
- `backend/src/modules/billing/billing.controller.ts` — Create billing route paths
- `backend/src/modules/billing/billing.service.ts` — Implement invoice generation and claims updates
- `backend/src/modules/billing/billing.router.ts` — Define billing endpoints
