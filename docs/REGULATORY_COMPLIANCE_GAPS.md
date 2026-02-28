# Regulatory Compliance Gap Analysis

**Source Documents:**
- `docs/sync/noui-fiduciary-responsibility-framework.md`
- `docs/sync/noui-public-pension-universal-regulatory-framework.md`

**Assessment Date:** 2026-02-28
**Scope:** Evaluated against current POC codebase (v0.1.0-demo + rearchitecture commit)

---

## Summary

12 federal regulatory compliance items identified. 1 partially implemented, 11 not yet implemented. None are POC-blocking — no demo case triggers any of these limits or requirements. All are production-readiness items for a "Universal Compliance Module" that would apply across every public pension system NoUI serves.

2 audit trail hardening gaps identified from the fiduciary framework.

---

## Priority 1: Audit Trail Hardening

These items close the gap between the current audit implementation (Phase 2 rearchitecture) and the fiduciary framework's requirements.

### GAP-01: Audit Trail Immutability Enforcement

**Status:** Partially implemented
**Source:** Fiduciary Framework §4, Principle 4
**Current State:** `database/schema/006_audit_schema.sql` creates AUDIT_LOG as append-only by application convention. `services/connector/internal/api/audit.go` only INSERTs, never UPDATEs or DELETEs.
**Gap:** No database-level enforcement. A DBA or rogue query could DELETE/UPDATE audit records.
**Required:**
- Add PostgreSQL trigger or REVOKE UPDATE/DELETE on AUDIT_LOG from application role
- Consider partitioning by month for retention management without row-level deletes
**Impact:** Low risk in POC; critical for production compliance

### GAP-02: Before/After Value Capture

**Status:** Not implemented
**Source:** Fiduciary Framework §4, Principle 4 ("what data was affected — before/after values")
**Current State:** `AuditEntry.Details` is a free-form `map[string]interface{}` — captures action context but not state changes.
**Gap:** When a member record is updated (e.g., status change on death notification), the audit entry doesn't record what the old value was.
**Required:**
- Add `BeforeValues` and `AfterValues` fields to `AuditEntry` struct
- Add `BEFORE_VALUES JSONB` and `AFTER_VALUES JSONB` columns to AUDIT_LOG
- Populate at handler level before writes
**Impact:** Moderate — requires handler-level changes to capture pre-write state

---

## Priority 2: Federal Benefit/Compensation Limits

These items would be the first universal compliance features built for production.

### GAP-03: IRC §415(b) Annual Benefit Limit

**Status:** Not implemented
**Source:** Regulatory Framework §1.1
**Requirement:** Annual benefit from a defined benefit plan cannot exceed $290,000 (2026). Reduced for retirement before age 62. Exception for qualified police/fire with 15+ years.
**Current State:** No benefit cap check exists anywhere in the codebase.
**Demo Impact:** None — highest demo case benefit is ~$6,900/mo ($82,800/yr), well below limit.
**Required:**
- Add `RULE-BENEFIT-LIMIT-415B` to `rules/definitions/benefit-calculation.yaml`
- Implement annual limit check in Intelligence service after benefit calculation
- Track excess benefit arrangement (§415(m)) per plan configuration
- Flag cases approaching limit (e.g., >80% of §415(b)) for administrator review
**Complexity:** Low — simple cap check on final benefit × 12

### GAP-04: IRC §401(a)(17) Compensation Limit

**Status:** Not implemented
**Source:** Regulatory Framework §1.2
**Requirement:** Annual compensation used in benefit calculations capped at $350,000 (2025). Applies only to members who first became participants on/after plan's effective date. Pre-effective-date members are grandfathered.
**Current State:** No salary cap in AMS calculation. No grandfathering logic.
**Demo Impact:** None — highest demo salary is ~$120K/yr.
**Required:**
- Add `RULE-COMPENSATION-LIMIT-401A17` to `rules/definitions/benefit-calculation.yaml`
- Track member's participation start date
- Determine plan's §401(a)(17) effective date (DERP: likely first plan year after 12/31/1995)
- Cap individual salary records at the applicable year's limit before AMS calculation
- Grandfather pre-effective-date members (no cap)
**Complexity:** Moderate — requires per-year limit lookup and participation date tracking

---

## Priority 3: Distribution and Tax Reporting

### GAP-05: IRC §72 Distribution Taxation (Simplified Method)

**Status:** Not implemented
**Source:** Regulatory Framework §1.8
**Requirement:** Each benefit payment has a taxable portion (employer contributions + earnings) and non-taxable portion (employee after-tax contributions recovered over expected payout period).
**Current State:** Refund calculator tracks withholding rate (20%) but doesn't compute taxable vs. non-taxable split for annuity payments.
**Required:**
- Implement Simplified Method: divide total after-tax contributions by expected number of monthly payments (IRS table based on age at annuity start)
- Monthly exclusion amount = after-tax contributions ÷ expected payments
- Apply until full basis recovered, then 100% taxable
**Complexity:** Moderate — needs contribution history and IRS age-factor table

### GAP-06: 1099-R Generation

**Status:** Not implemented
**Source:** Regulatory Framework §7.1
**Requirement:** Annual Form 1099-R to every recipient reporting: gross distribution (Box 1), taxable amount (Box 2a), employee contributions (Box 5), distribution code (Box 7), state withholding (Box 12-15).
**Required:**
- Create 1099-R data model tracking all required box values
- Implement distribution code assignment (Code 7 normal, Code 2 early with exception, Code 4 death, Code 3 disability, Code G rollover)
- Generate annual 1099-R records for all retirees and beneficiaries
- Support electronic filing format (IRS Publication 1220)
**Complexity:** High — full tax reporting pipeline

### GAP-07: IRC §401(a)(31) Rollover Eligibility Rules

**Status:** Partially implemented
**Source:** Regulatory Framework §1.4
**Current State:** Refund calculator applies 20% withholding (IRC §3405(c)). Frontend `f15-direct-withdrawal.ts` offers rollover/direct-payment/split options.
**Gap:** No formal rule defining which distribution types are eligible rollover distributions. No 30-day notice requirement implementation.
**Required:**
- Add `RULE-ROLLOVER-ELIGIBLE` to `rules/definitions/refund.yaml` defining eligible distributions
- Extend to death benefits, DRO distributions, disability lump sums
- Implement mandatory rollover notice (IRC §402(f)) — 30 days minimum before distribution
**Complexity:** Low-moderate

### GAP-08: IRC §414(h)(2) Pick-Up Contribution Tax Distinction

**Status:** Acknowledged, not formalized
**Source:** Regulatory Framework §1.5
**Current State:** Employee contribution rate (8.45%) coded in refund calculator. No distinction between pick-up and non-pick-up for tax reporting.
**Required:**
- Add plan-level configuration: pick-up election status
- Distinguish pick-up contributions (excluded from income tax, subject to FICA) in tax reporting
- Ensure refund basis calculation accounts for pick-up status
**Complexity:** Low — configuration + tax reporting flag

---

## Priority 4: Lifecycle and Compliance Tracking

### GAP-09: IRC §401(a)(9) Required Minimum Distributions

**Status:** Not implemented
**Source:** Regulatory Framework §1.3
**Requirement:** Benefits must begin by April 1 following the later of: age 73 (SECURE 2.0) or retirement year. "Still working" exception defers RMD.
**Current State:** No deferred member lifecycle tracking. No RMD notification system.
**Required:**
- Track deferred members (separated but not drawing benefits)
- Calculate RMD deadline: April 1 of year following age 73 or separation, whichever is later
- Generate notifications 12/6/3/1 months before RMD deadline
- Track RMD compliance status
**Complexity:** Moderate — new lifecycle tracking subsystem

### GAP-10: USERRA Military Service Credit

**Status:** Not implemented
**Source:** Regulatory Framework §6.4
**Requirement:** Members returning from military service receive full pension credit for military period. Can make up missed contributions interest-free.
**Current State:** No military service tracking.
**Required:**
- Track military leave periods per member
- Calculate USERRA-credited service (counts for vesting + benefit)
- Calculate contribution make-up amount (interest-free)
- Apply employer contributions as if continuously employed
**Complexity:** Moderate — new service credit type + contribution calculation

### GAP-11: Social Security Coordination

**Status:** Not implemented
**Source:** Regulatory Framework §3
**Current State:** No Section 218 coverage tracking. DERP is covered (noted in doc).
**Required:**
- Plan-level configuration: Social Security coverage status
- Per-member Medicare coverage tracking (mandatory for hires on/after 4/1/1986)
- Social Security Fairness Act (WEP/GPO repeal) impact on total retirement income modeling
**Complexity:** Low for configuration; high for income modeling

### GAP-12: GASB 67/68 Reporting

**Status:** Not implemented
**Source:** Regulatory Framework §2
**Requirement:** GASB 67 plan-level financial reporting. GASB 68 employer-level pension accounting (NPL, pension expense, deferred inflows/outflows).
**Required:**
- Statement of Fiduciary Net Position generator
- Net Pension Liability calculation engine
- Discount rate sensitivity analysis
- 10-year RSI schedules
- Employer proportionate share calculations (for cost-sharing plans)
**Complexity:** Very high — actuarial-level reporting engine. This would likely be a separate service.

### GAP-13: Anti-Alienation Formalization

**Status:** Partially addressed via DRO
**Source:** Regulatory Framework §4.1
**Current State:** DRO processing implemented in `rules/definitions/dro.yaml`. No broader anti-alienation rule.
**Required:**
- Formalize anti-alienation rule beyond DRO exception
- Support 10% voluntary assignment exception
- Support federal tax levy exception
- Support criminal restitution order exception
**Complexity:** Low — rule definition + exception handling

---

## Implementation Roadmap

### POC (Current) — No changes needed
All demo cases operate within federal limits. Audit trail is append-only by convention.

### Production Phase 1 — Benefit Integrity
- GAP-01: Audit immutability (database trigger)
- GAP-02: Before/after values
- GAP-03: §415(b) benefit cap
- GAP-04: §401(a)(17) compensation cap

### Production Phase 2 — Tax Compliance
- GAP-05: IRC §72 Simplified Method
- GAP-06: 1099-R generation
- GAP-07: Rollover eligibility rules
- GAP-08: Pick-up contribution distinction

### Production Phase 3 — Lifecycle & Reporting
- GAP-09: RMD tracking
- GAP-10: USERRA military service
- GAP-11: Social Security coordination
- GAP-12: GASB 67/68 reporting
- GAP-13: Anti-alienation formalization

---

*This gap analysis is based on the NoUI fiduciary responsibility framework and universal regulatory framework documents. It does not constitute legal advice. Each system deployment requires review by the plan's legal counsel to verify compliance within that jurisdiction's specific legal framework.*
