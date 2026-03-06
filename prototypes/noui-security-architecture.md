# NoUI Security Architecture

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft |
| Created | 2026-02-20 |
| Author | Jeff (with Claude) |
| Related Documents | noui-architecture-decisions.docx, progressive-migration-architecture.md |

---

## 1. Executive Summary

This document defines NoUI's security architecture for protecting pension agency data. The architecture is designed to meet SOC 2 Trust Service Criteria and position NoUI for compliance with IRS Publication 1075, HIPAA (where applicable), and state-specific privacy requirements.

### Core Security Principles

1. **Customer data isolation** — Multi-tenant architecture with hard boundaries; no customer can access another's data
2. **Defense in depth** — Multiple layers of protection; no single control failure compromises security
3. **Least privilege** — Users and systems have minimum access required for their function
4. **Audit everything** — Every access logged; immutable audit trail
5. **Encryption everywhere** — Data protected at rest and in transit
6. **Privacy by design** — PII minimized, anonymized where possible, protected where necessary

---

## 2. Architecture Overview

### Split Architecture Model

NoUI operates a split architecture where AI services run in the cloud while customer data remains under customer control.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER BOUNDARY                            │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐   │
│  │    Legacy     │      │     Data      │      │    Modern     │   │
│  │   Database    │◄────►│   Connector   │◄────►│   Database    │   │
│  │               │      │   Appliance   │      │  (PostgreSQL) │   │
│  └───────────────┘      └───────┬───────┘      └───────────────┘   │
│                                 │                                   │
│                                 │ Anonymized/Structural Only        │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NOUI CLOUD BOUNDARY                         │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐   │
│  │   Analytics   │      │      AI       │      │    Pattern    │   │
│  │    Bridge     │◄────►│   Services    │◄────►│  Knowledge    │   │
│  │               │      │               │      │     Base      │   │
│  └───────────────┘      └───────────────┘      └───────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Security Implications

| Boundary | What Resides There | Security Responsibility |
|----------|-------------------|------------------------|
| Customer Boundary | PII, financial data, benefit calculations, transaction history | Customer infrastructure + NoUI Data Connector controls |
| NoUI Cloud Boundary | AI services, pattern knowledge, structural intelligence | NoUI cloud controls |
| Analytics Bridge | Anonymized/structural data crossing boundary | Enforced data sanitization |

### Key Security Property

**No PII leaves the customer boundary.** The Analytics Bridge enforces structural constraints that prevent PII transmission. AI services operate on anonymized patterns, not member data.

---

## 3. Data Classification

### Classification Scheme

| Level | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Restricted** | Highest sensitivity; regulatory protection required | SSN, bank account numbers, medical/disability information |
| 2 | **Confidential** | Sensitive PII; breach causes significant harm | Name + DOB, salary history, benefit amounts, beneficiary details |
| 3 | **Internal** | Business sensitive; not for public disclosure | Rule configurations, process workflows, system logs with member IDs |
| 4 | **Public** | No sensitivity; can be disclosed freely | Plan provisions (from public statute), general system documentation |

### Classification by Data Element

| Data Element | Classification | Rationale |
|--------------|----------------|-----------|
| Social Security Number | Restricted | Federal tax identifier; IRS Pub 1075 |
| Bank Account / Routing Numbers | Restricted | Financial fraud risk |
| Medical/Disability Information | Restricted | HIPAA protected health information |
| Date of Birth | Confidential | PII; identity theft risk combined with other data |
| Full Name | Confidential | PII |
| Home Address | Confidential | PII |
| Salary History | Confidential | Sensitive financial information |
| Benefit Amounts | Confidential | Sensitive financial information |
| Beneficiary Information | Confidential | PII of third parties |
| Employment History | Confidential | Sensitive employment information |
| Member ID (internal) | Internal | Not PII alone; sensitive in context |
| Transaction Logs | Internal | May contain member references |
| Rule Definitions | Internal | Business logic; not sensitive |
| Plan Provisions | Public | Published in statute |

---

## 4. Encryption

### Encryption at Rest

| Scope | Approach | Standard |
|-------|----------|----------|
| Database (full) | Transparent Data Encryption (TDE) | AES-256 |
| Restricted fields | Application-level field encryption | AES-256-GCM |
| Backups | Encrypted before storage | AES-256 |
| Logs | Encrypted at storage layer | AES-256 |

**Field-Level Encryption:** Restricted data (SSN, bank accounts, medical info) is encrypted at the application layer before database storage. This provides defense in depth — even database administrators with TDE access cannot read restricted fields without application-layer keys.

### Encryption in Transit

| Path | Approach | Standard |
|------|----------|----------|
| User to Application | TLS | TLS 1.3 (minimum 1.2) |
| Application to Database | TLS | TLS 1.3 (minimum 1.2) |
| Data Connector to Legacy | TLS or VPN | Per legacy system capability |
| Analytics Bridge | TLS + message signing | TLS 1.3 + HMAC verification |
| Internal service-to-service | mTLS | Mutual TLS authentication |

### Key Management

| Key Type | Storage | Rotation |
|----------|---------|----------|
| TDE keys | Hardware Security Module (HSM) or cloud KMS | Annual or on compromise |
| Field encryption keys | Customer-controlled KMS | Annual or on compromise |
| TLS certificates | Certificate manager | 90 days (automated) |
| API keys | Secrets manager | 90 days or on personnel change |

**Customer Key Control:** For field-level encryption, customers may control their own keys via their KMS (AWS KMS, Azure Key Vault, HashiCorp Vault). NoUI never has access to Restricted data without customer key authorization.

---

## 5. Access Control

### Role-Based Access Control (RBAC)

#### Standard Roles

| Role | Description | Typical Access |
|------|-------------|----------------|
| **Pension Analyst** | Processes retirement applications, calculates benefits | Read member data; execute calculations; submit for approval |
| **Senior Analyst** | Reviews and approves analyst work | Analyst permissions + approve transactions |
| **Benefits Manager** | Oversees benefits operations | Senior Analyst permissions + reporting + exception handling |
| **System Administrator** | Manages users, configuration | User management; system config; no member data access |
| **Auditor** | Reviews transactions and access logs | Read-only access to transactions and audit logs |
| **NoUI Support** | Technical support for system issues | System logs; anonymized diagnostics; no PII access |

#### Permission Matrix

| Permission | Analyst | Sr. Analyst | Manager | Sys Admin | Auditor | Support |
|------------|---------|-------------|---------|-----------|---------|---------|
| View member demographics | ✓ | ✓ | ✓ | | ✓ | |
| View Restricted fields (SSN) | Limited | Limited | ✓ | | ✓ | |
| Execute calculations | ✓ | ✓ | ✓ | | | |
| Approve transactions | | ✓ | ✓ | | | |
| Manage users | | | | ✓ | | |
| View audit logs | | | ✓ | ✓ | ✓ | |
| System configuration | | | | ✓ | | |
| View anonymized diagnostics | | | | ✓ | | ✓ |

**Limited SSN Access:** Analysts see masked SSN (XXX-XX-1234) by default. Full SSN revealed only when operationally necessary (e.g., IRS reporting) and logged.

### Attribute-Based Access Control (ABAC)

RBAC provides base permissions. ABAC refines access based on context:

| Attribute | Effect |
|-----------|--------|
| Department | User can only access members in their assigned department(s) |
| Case assignment | User has elevated access to members on their active caseload |
| Time of day | Sensitive operations restricted to business hours (configurable) |
| Location | Access restricted by IP range or VPN requirement |
| Data age | Historical records may have different access rules than active |

### Break-Glass Access

For emergency situations requiring access beyond normal permissions:

1. User requests elevated access with written justification
2. System grants temporary access (time-limited: [Assumption: 4-hour maximum])
3. All actions during elevated session logged with special flag
4. Automatic notification to security administrator
5. Post-incident review required within [Assumption: 24 hours]

Break-glass is audited and reported. Abuse results in access revocation.

---

## 6. Audit Logging

### What Is Logged

| Event Category | Examples | Retention |
|----------------|----------|-----------|
| Authentication | Login, logout, failed login, password change, MFA events | [Assumption: 2 years] |
| Authorization | Permission granted, denied, role change, break-glass | [Assumption: 2 years] |
| Data Access | Member record viewed, search performed, report generated | [Assumption: 7 years] |
| Data Modification | Record created, updated, deleted; calculation performed | [Assumption: 7 years] |
| System Events | Configuration change, deployment, service start/stop | [Assumption: 2 years] |
| Security Events | Anomaly detected, alert triggered, incident response | [Assumption: 7 years] |

### Log Entry Structure

Every log entry contains:

| Field | Description |
|-------|-------------|
| Timestamp | UTC timestamp with millisecond precision |
| Event ID | Unique identifier for correlation |
| Event Type | Category and specific event code |
| Actor | User ID or system component |
| Actor Context | IP address, session ID, role at time of action |
| Resource | What was accessed or modified (member ID, record type) |
| Action | What was done (view, update, delete, execute) |
| Outcome | Success, failure, partial |
| Details | Event-specific additional information |

### Log Integrity

| Control | Description |
|---------|-------------|
| Immutability | Logs written to append-only storage; no modification or deletion |
| Integrity verification | Cryptographic hash chain; tampering detectable |
| Separation | Logs stored separately from application data; different access controls |
| Replication | Logs replicated to secondary location; resilient to single-point failure |

### Log Access

- **Security team:** Full access for investigation
- **Auditors:** Read-only access for compliance review
- **Managers:** Access to logs for their team/department
- **Users:** Access to their own activity log
- **NoUI Support:** Anonymized logs only (member IDs redacted)

---

## 7. Multi-Tenant Isolation

### Isolation Model

Each customer deployment is logically isolated:

| Layer | Isolation Mechanism |
|-------|---------------------|
| Compute | Separate container namespaces per customer |
| Database | Separate database per customer (not shared tables with tenant ID) |
| Storage | Separate storage buckets/volumes per customer |
| Encryption | Separate encryption keys per customer |
| Network | Network policies restricting cross-customer traffic |
| Logging | Separate log streams per customer |

### Why Separate Databases

The shared-database-with-tenant-ID model creates risk:

- Single query bug can leak data across tenants
- Index or query performance issues affect all tenants
- Compliance audits must verify every query respects tenant boundaries

**NoUI uses database-per-tenant:** No code path can accidentally access wrong tenant because the database connection itself is tenant-specific.

### Cross-Tenant Learning (Pattern Knowledge Base)

The pattern knowledge base learns across deployments without sharing PII:

**What Crosses the Boundary:**

| Data Type | Example | Privacy Control |
|-----------|---------|-----------------|
| Schema patterns | "Legacy system uses SALARY_HIST table with PAY_PERIOD_END_DATE column" | No PII; structural only |
| Process patterns | "Retirement applications average 3 data corrections before completion" | Aggregated statistics; no individual cases |
| Error patterns | "Beneficiary allocation errors occur in 2% of records migrated from System X" | Pattern type; no specific records |
| Rule interpretations | "Ambiguity in §18-401(b) resolved: leave payout included in final month" | Legal interpretation; no member data |

**What Never Crosses:**

- Member names, SSNs, dates of birth
- Specific salary or benefit amounts
- Individual transaction details
- Customer-specific rule configurations (unless customer explicitly shares)

**Enforcement:** The Analytics Bridge validates all outbound data against a structural schema. Fields that could contain PII are blocked. This is enforced architecturally, not by policy alone.

---

## 8. Network Security

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WAF / DDoS Protection                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Load Balancer (TLS termination)             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway                                 │
│              (Authentication, rate limiting, request validation)    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Services                        │
│                    (Kubernetes pods, internal mTLS)                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                  │
│           (Database, no direct external access, encrypted)          │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Controls

| Control | Purpose |
|---------|---------|
| Web Application Firewall (WAF) | Block common attack patterns (SQLi, XSS, etc.) |
| DDoS protection | Absorb volumetric attacks |
| Rate limiting | Prevent brute force and abuse |
| IP allowlisting | Restrict access to known customer networks (optional per customer) |
| Network segmentation | Database not directly accessible from internet |
| Internal mTLS | Service-to-service authentication |
| Egress filtering | Outbound traffic restricted to known destinations |

### Data Connector Network

The Data Connector appliance sits within the customer network:

| Requirement | Description |
|-------------|-------------|
| Outbound only | Data Connector initiates all connections; no inbound ports required |
| TLS to cloud | All communication to NoUI cloud encrypted |
| Customer firewall | Customer controls firewall rules for Data Connector |
| VPN option | Customer may require VPN for additional protection |

---

## 9. Authentication

### User Authentication

| Mechanism | Description |
|-----------|-------------|
| SSO integration | SAML 2.0 / OIDC integration with customer identity provider |
| MFA required | Multi-factor authentication mandatory for all users |
| Password policy | If local auth used: 12+ characters, complexity requirements, no reuse |
| Session management | Configurable timeout; automatic logout on inactivity |
| Device trust | Optional: restrict to enrolled devices |

### Service Authentication

| Mechanism | Description |
|-----------|-------------|
| mTLS | Mutual TLS for service-to-service communication |
| API keys | Rotating keys for external integrations |
| Service accounts | Named accounts for automated processes; no shared credentials |

### Authentication Logging

All authentication events logged:
- Successful login (user, time, IP, device)
- Failed login (user, time, IP, reason)
- MFA challenge (user, method, outcome)
- Session timeout
- Explicit logout

---

## 10. Incident Response

### Incident Classification

| Severity | Definition | Response Time |
|----------|------------|---------------|
| Critical | Active breach; data exfiltration confirmed or likely | [Assumption: 15 minutes to triage] |
| High | Security control failure; breach possible but not confirmed | [Assumption: 1 hour to triage] |
| Medium | Vulnerability discovered; no active exploitation | [Assumption: 24 hours to triage] |
| Low | Security improvement opportunity; no immediate risk | [Assumption: 5 business days] |

### Response Procedure

1. **Detection** — Alert triggered by monitoring, user report, or external notification
2. **Triage** — Severity assessment, scope determination
3. **Containment** — Stop active threat; isolate affected systems
4. **Investigation** — Root cause analysis; impact assessment
5. **Remediation** — Fix vulnerability; restore service
6. **Notification** — Customer notification per contractual requirements; regulatory notification if required
7. **Post-Incident Review** — Document lessons learned; update controls

### Customer Notification

| Incident Type | Notification Timeline |
|---------------|----------------------|
| Confirmed breach of customer data | [Assumption: Within 24 hours of confirmation] |
| Potential breach under investigation | [Assumption: Within 48 hours of detection] |
| Security incident with no customer data impact | Summary in regular security report |

Notification timelines may be superseded by contractual or regulatory requirements.

---

## 11. Compliance Mapping

### SOC 2 Trust Service Criteria

| Criterion | Status | Key Controls |
|-----------|--------|--------------|
| **Security** | Designed | Access control, encryption, network security, logging, incident response |
| **Availability** | Designed | Redundancy, failover, monitoring (see ADR-007 Graceful Degradation) |
| **Processing Integrity** | Designed | Input validation, calculation verification, audit trails |
| **Confidentiality** | Designed | Data classification, encryption, access control, tenant isolation |
| **Privacy** | Designed | PII minimization, consent management, data subject rights |

### IRS Publication 1075

| Requirement | How Addressed |
|-------------|---------------|
| Access limited to need-to-know | RBAC + ABAC; least privilege |
| Background checks for personnel | Customer responsibility for their staff; NoUI staff checked |
| Encryption of federal tax information | Field-level encryption for SSN and tax-related data |
| Audit trail of access | Comprehensive logging with 7-year retention |
| Incident reporting to IRS | Included in incident response procedure |
| Secure disposal | Cryptographic erasure; physical destruction of media |

### HIPAA (Where Applicable)

| Requirement | How Addressed |
|-------------|---------------|
| Access controls | RBAC restricts medical information to authorized roles |
| Audit controls | All PHI access logged |
| Transmission security | TLS for all data in transit |
| Encryption | Field-level encryption for medical/disability data |
| Business Associate Agreement | NoUI signs BAA with customers processing PHI |

### Colorado Privacy Requirements

| Requirement | How Addressed |
|-------------|---------------|
| Data minimization | Collect only what's needed for pension administration |
| Purpose limitation | Data used only for stated purposes |
| Security measures | This security architecture |
| Breach notification | Incident response includes Colorado notification requirements |

---

## 12. Security Development Lifecycle

### Secure Coding Practices

| Practice | Description |
|----------|-------------|
| Input validation | All inputs validated; parameterized queries |
| Output encoding | Prevent injection attacks |
| Dependency scanning | Automated vulnerability scanning of dependencies |
| Static analysis | Code scanned for security issues before merge |
| Code review | Security-focused review for sensitive changes |

### Security Testing

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Automated vulnerability scanning | Continuous | All deployed services |
| Dependency vulnerability scanning | Daily | All dependencies |
| Penetration testing | [Assumption: Annual, or before major release] | Full application |
| Security architecture review | [Assumption: Annual, or on significant change] | Design and implementation |

### Change Management

All changes to security controls follow documented change management:

1. Change requested with security impact assessment
2. Security review for changes affecting controls
3. Testing in non-production environment
4. Approval from authorized personnel
5. Deployment with rollback plan
6. Post-deployment verification

---

## 13. Physical Security

### Cloud Infrastructure

NoUI cloud services run on major cloud providers (AWS, Azure, or GCP) with:

- SOC 2 Type II certified data centers
- Physical access controls (biometric, 24/7 security)
- Environmental controls (fire suppression, climate control, power redundancy)
- Geographic redundancy (multi-region deployment option)

### Data Connector Appliance

The Data Connector runs in customer data center:

- Physical security is customer responsibility
- Appliance ships with tamper-evident seals
- No persistent storage of sensitive data on appliance (passthrough only)
- Remote attestation to verify appliance integrity

---

## 14. Compliance Roadmap

### Pre-First-Customer (Now)

| Item | Status |
|------|--------|
| Security architecture documented | This document |
| Data classification defined | This document |
| Access control model defined | This document |
| Encryption approach defined | This document |
| Audit logging requirements defined | This document |

### Before Production Deployment

| Item | Timeline Assumption |
|------|---------------------|
| Security controls implemented | [Assumption: With POC build] |
| Independent penetration test | [Assumption: Before first production customer] |
| Security documentation for customer review | [Assumption: Before first production customer] |
| Incident response procedure documented and tested | [Assumption: Before first production customer] |

### After First Customer

| Item | Timeline Assumption |
|------|---------------------|
| SOC 2 Type I audit | [Assumption: 3-6 months after production deployment] |
| SOC 2 Type II observation period begins | [Assumption: After Type I] |
| SOC 2 Type II report | [Assumption: 6-12 months after Type I] |

### Growth Phase

| Item | Timeline Assumption |
|------|---------------------|
| HIPAA compliance (if disability processing) | [Assumption: When disability process added] |
| FedRAMP (if federal customers pursued) | [Assumption: Year 2-3 per business plan] |

---

## 15. Open Questions

| Question | Status | Owner |
|----------|--------|-------|
| Customer-specific compliance requirements (DERP) | Research needed | Per deployment |
| HSM vs. cloud KMS for key management | Design decision | Architecture |
| Specific MFA methods supported | Design decision | Architecture |
| Penetration test vendor selection | Procurement | Operations |
| SOC 2 auditor selection | Procurement | Operations |
| Data retention periods per jurisdiction | Research needed | Per deployment |

---

## 16. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-20 | Jeff (with Claude) | Initial draft |
