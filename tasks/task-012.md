# Task 012: Pharmacy Prescription Fulfillment and Inventory Management
**Status:** pending
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 10 hours
**Tags:** [backend, frontend, database]

## Description
This task implements the Pharmacy Fulfillment queue and local stock inventory management interfaces. When the pharmacist dispenses medications, the system updates the prescription status to "Dispensed" and automatically decrements the corresponding stock count in the `inventory_logs` database table.

Additionally, this task covers manual stock adjustments (with required text justifications), reorder alert flags (for items falling below a set threshold), and expiry date indicators (highlighting batches within 30 days of expiry).

## Document References

### PRD
- **Feature ID:** F-PHR-01 (Prescription Fulfillment), F-PHR-02 (Local Stock Inventory Management)
- **User Story:**
  * As a Pharmacist, I want to view and fulfill digital prescriptions so that patients receive their prescribed medications.
  * As a Pharmacist, I want to view stock counts, track expiry dates, manage reorder alerts, and make manual inventory adjustments.
- **Acceptance Criteria:**
  1. Pharmacist portal displays pending prescriptions searchable by patient UHID or Name.
  2. Clicking shows medicine list, structured dosages, and instructions.
  3. Fulfilling sets status to "Dispensed" and decrements stock count in `InventoryLogs` for each item.
  4. Inventory screen lists all medicines, stock counts, reorder thresholds, and expiry dates.
  5. Manual Adjustment interface requires a text explanation for changes.
  6. Red warning icon next to expired batches or within 30 days of expiry.
  7. Yellow alert icon next to medicines whose stock count is <= reorder threshold.

### SRS
- **Requirement IDs:** FR-PHR-01-01 (Prescription Fulfill), FR-PHR-02-01 (Stock Adjustment), FR-PHR-02-02 (Expiry Alert), FR-PHR-02-03 (Reorder Warning)
- **SHALL statements:**
  * The system SHALL decrement inventory stock upon prescription fulfillment.
  * The system SHALL flag expired medicine batches.

### Architecture
- **Component(s):** Pharmacy Service, Web Portal (Pharmacist console)
- **Data Flow:** Pharmacist fulfills -> decrement stock in Postgres -> update prescription status -> log inventory adjustment transaction.

### Database
- **Tables:** `inventory_logs`, `medicines`, `prescriptions`
- **Migrations:** None

### API
- **Endpoints:**
  * `GET /api/pharmacy/prescriptions` (list pending prescriptions)
  * `POST /api/pharmacy/prescriptions/{id}/fulfill` (finalize fulfillment, adjust stock)
  * `GET /api/pharmacy/inventory` (list stock items)
  * `POST /api/pharmacy/inventory/adjust` (manual adjustment log)
- **Auth/Role guard:** Pharmacist, Administrator (Read), Doctor (Read formulary).

### Security
- **Threats addressed:**
  * T-PHR-01 (Unauthorized stock modifications - manual adjustments require login and logged text justifications)
  * T-PHR-02 (Dispensing invalid or cancelled prescriptions - status checks block double-fulfillment)
- **Data classifications:** `INTERNAL` Medicine stock counts and logs.

### Design
- **Screen(s):** SCR-PH-02 (Pharmacy Queue), SCR-PH-03 (Inventory Console)
- **Components used:** Search inputs, Stock detail tables, Alert warning icons
- **Design tokens:** Success Color, Error Color, Warning Color

### Testing
- **Unit tests:** Stock decrement calculation unit tests
- **Integration tests:** IT-PHR-01 (Fulfillment stock adjustment integration test)
- **Security tests:** None
- **UAT scenarios:** UAT-PH-01 (Pharmacist fulfills patient prescription)

## Acceptance Criteria
- [ ] Pharmacist search matches active pending prescriptions by UHID or Name.
- [ ] Clicking Fulfill sets prescription status to "Dispensed" and updates inventory logs counts.
- [ ] Fulfilling is blocked if any item is out-of-stock (count <= 0), returning a clear out-of-stock error.
- [ ] Manual adjustments save successfully only if a non-empty string explanation is provided.
- [ ] Stock items display red warning badges if expired or within 30 days of the expiry date.

## Dependencies
- task-009: Digital Prescription System (fulfillment requires generated digital prescriptions)

## Implementation Approach
### Step-by-step Plan:
1. Write database constraint checks to prevent negative inventory counts.
2. Implement transaction logic in `inventory.service.ts` that updates the `prescriptions` status and creates `inventory_logs` rows for each item.
3. Build the Pharmacist fulfillment dashboard in the Web Portal using Vanilla JS.
4. Build the Inventory Management list and manual adjustment popup using Vanilla JS.
5. Create alert indicators using Vanilla CSS.

### Technical Considerations:
- Ensure the database queries for inventory calculate sum counts correctly across multiple batches.

### Architecture/Design Notes:
- Matches standalone manual stock adjustment constraints specified in Blueprint Section 24.

## Files to Modify/Create
- `backend/src/modules/pharmacy/inventory.controller.ts` — Create pharmacy route handlers
- `backend/src/modules/pharmacy/inventory.service.ts` — Implement fulfillment and adjustment logic
- `backend/src/modules/pharmacy/inventory.router.ts` — Define pharmacy endpoints
