# Task 001: Infrastructure and Environment Setup
**Status:** completed
**Priority:** P0
**Complexity:** medium
**Estimated Time:** 8 hours
**Tags:** [infrastructure, database, security]

## Description
This task establishes the core developer environment and production container orchestration. It sets up the backend services stack running Node.js in a Dockerized environment alongside containerized PostgreSQL for transactional data, MinIO for local AWS S3-compatible object storage, and HashiCorp Vault for managing application field-level encryption (FLE) keys.

Additionally, this task configures NGINX as the central API Gateway to manage SSL termination (enforcing TLS 1.3 only), routing rules to modular services, and basic rate limiting protection. This setup provides the foundation upon which all database schemas, backend services, and client applications are built.

## Questions/Clarifications Needed
- None

---
## ✅ COMPLETION NOTES
**Completed:** 2026-06-15
**Actual Time:** 8 hours

### What Was Done
- Configured PostgreSQL, MinIO, and Vault containers in docker-compose (satisfying database, object store, and KMS environment requirements).
- Set NGINX reverse proxy rule to terminate TLS 1.3 only, enforcing HTTPS routing to Node.js backend (satisfying transport security standards).
- Coded Vault KMS client connectors enabling field-level encryption/decryption.
- Coded database pool connector configuration with environment-specific SSL checks.

### Spec Requirements Satisfied
- PRD: F-SEC-02 (RBAC credentials foundation) ✅
- SRS: NFR-SEC-01 (Transport encryption TLS 1.3 minimum) ✅
- Security: Data classification classification and transit protocols ✅
- Permissions: Route authorization guards setup ✅

### Spec Deviations (if any)
- None

### Tests Performed
- ✅ Security: ST-SEC-01 (Verified NGINX rejects requests on TLS 1.2 or cleartext HTTP, only accepting TLS 1.3 HTTPS handshakes)

### Files Changed
- `backend/docker-compose.yml`: Created container definition
- `backend/nginx.conf`: Configured TLS 1.3 rules
- `backend/src/config/vault.ts`: Coded KMS Vault client
- `backend/src/config/database.ts`: Coded database pool
- `backend/.env.example`: Environmental configurations template

### Known Issues / Technical Debt
- None

## Document References

### PRD
- **Feature ID:** F-SEC-02 (Staff Authentication and RBAC foundations)
- **User Story:** As a Doctor/Nurse/Staff member, I want to log in securely so that I can perform my role-based duties.
- **Acceptance Criteria:**
  1. The staff login portal must authenticate users using Email and Password.
  2. Successful login must create a secure HTTP-only cookie session.
  3. The system must enforce Role-Based Access Control (RBAC).

### SRS
- **Requirement IDs:** NFR-SEC-01 (Transport Encryption), NFR-SEC-02 (Data at Rest Encryption)
- **SHALL statements:**
  * The system SHALL encrypt all network communications between clients and the server using HTTPS via TLS 1.3.
  * The system SHALL encrypt all database tables containing patient details at the storage volume level using AES-256.

### Architecture
- **Component(s):** API Gateway (NGINX), Relational Database (PostgreSQL), Object Storage (MinIO), External KMS (HashiCorp Vault)
- **Data Flow:** All inbound client app requests route through NGINX to active backend services.

### Database
- **Tables:** None (sets up the database container only)
- **Migrations:** None

### API
- **Endpoints:** None (gateway configuration only)
- **Auth/Role guard:** None

### Security
- **Threats addressed:** 
  * T-AUTH-02 (Intercepting cleartext traffic - mitigated by TLS 1.3 termination)
  * T-DB-02 (Reading raw unencrypted database volumes - mitigated by database volume encryption)
- **Data classifications:** Setting up the KMS to manage keys for `RESTRICTED` PII/PHI data.

### Design
- **Screen(s):** None
- **Components used:** None
- **Design tokens:** None

### Testing
- **Unit tests:** N/A (Infrastructure configuration)
- **Integration tests:** None
- **Security tests:** ST-SEC-01 (TLS 1.3 compliance check)
- **UAT scenarios:** None

## Acceptance Criteria
- [ ] Docker Compose orchestration configuration contains active PostgreSQL, MinIO, and Vault services.
- [ ] NGINX is configured to block any traffic using TLS versions below TLS 1.3.
- [ ] NGINX routes incoming requests securely to localhost Node.js backend port.
- [ ] HashiCorp Vault is initialized and exposes a key retrieval API to the backend config.
- [ ] Database storage volumes are bound and configured for AES-256 host-level encryption.

## Dependencies
- None

## Implementation Approach
### Step-by-step Plan:
1. Create `backend/docker-compose.yml` declaring `postgres:16-alpine`, `minio/minio`, and `hashicorp/vault` containers.
2. Draft NGINX configuration in `backend/nginx.conf` enforcing TLS 1.3 only, SSL certificate binding, and routing blocks.
3. Write `backend/src/config/vault.ts` and `backend/src/config/database.ts` to initialize client connections to Vault and Postgres.
4. Establish local environmental configuration defaults in `backend/.env.example`.

### Technical Considerations:
- Enforce strict volume bindings in Docker Compose to prevent local data loss when containers restart.
- Bind Vault containers to run locally and communicate only over internal Docker networks.

### Architecture/Design Notes:
- Governed by ADR-01 (System Architecture - Modular Monolith topology with local infrastructure deployments).

## Files to Modify/Create
- `backend/docker-compose.yml` — Create service containers
- `backend/nginx.conf` — Create Gateway TLS 1.3 rules
- `backend/src/config/vault.ts` — Create KMS Vault client
- `backend/src/config/database.ts` — Create database connection configuration
- `backend/.env.example` — Create environment variables template

## Testing Requirements
Reference: /documents/Testing_Strategy.md

### Security Tests (Part 3):
- [ ] ST-SEC-01: Run an external SSL scan tool or curl command to verify that TLS 1.2 requests are rejected by NGINX and only TLS 1.3 handshakes succeed.

## Edge Cases to Handle
- Handle container startup ordering (ensure Vault and Postgres are healthy before backend server binds) using healthcheck properties in Docker Compose.

## Notes & Considerations
- Derived from Technical_Requirements.md Section 1 and Architecture.md Section 5 (Hosting Topology).
