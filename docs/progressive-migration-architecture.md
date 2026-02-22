# NoUI Progressive Migration Architecture

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft |
| Created | 2026-02-20 |
| Author | Jeff (with Claude) |
| Related Documents | noui-architecture-decisions.docx, ARCHITECTURE_REFERENCE.md |

---

## 1. Executive Summary

This document defines NoUI's approach to migrating pension agencies from legacy systems to the modern NoUI platform. The approach prioritizes system validation before user exposure, eliminates dual-entry burden, ensures legacy defects do not transfer to the new system, and provides a safety net through reverse parallel operation post-cutover.

### Core Principles

1. **System ready before users transition** — Users never see NoUI until it is fully validated
2. **No dual entry** — Users work in one system at a time; never both
3. **Statute is source of truth** — NoUI implements governing documents, not legacy behavior
4. **Differences are explained** — Every discrepancy between NoUI and legacy traces to root cause
5. **Legacy defects are findings, not requirements** — NoUI does not replicate known errors
6. **Failover available post-cutover** — Reverse parallel provides safety net until confidence established

---

## 2. Migration Stages Overview

The migration follows eight sequential stages. Users are not exposed to NoUI until Stage 5.

| Stage | Name | Description | User Involvement |
|-------|------|-------------|------------------|
| 1 | Synthetic Validation | NoUI tested against hand-calculated expected results from governing documents | None |
| 2 | Historical Comparison | NoUI results compared to legacy transactions; differences explained | None |
| 3 | Production Simulation | Real pending cases processed through NoUI in simulation mode | None (limited SME review possible) |
| 4 | System Ready Declaration | All defects resolved; sign-off obtained | None |
| 5 | User Preparation | Training developed and delivered; practice environment available | Users trained |
| 6 | Cutover | Users transition to NoUI; NoUI becomes authoritative | Users in NoUI |
| 7 | Reverse Parallel | Legacy runs as automated shadow; discrepancies monitored | None (automated) |
| 8 | Legacy Retirement | Legacy decommissioned after exit criteria met | None |

---

## 3. Stage 1: Synthetic Validation

### Purpose

Verify that NoUI correctly implements the governing documents (statutes, board policies, actuarial valuations) independent of legacy system behavior.

### Method

1. Build comprehensive test cases derived from governing document analysis
2. Hand-calculate expected results for each test case
3. Execute test cases in NoUI
4. Compare NoUI results to expected results
5. Investigate and resolve any discrepancies

### Test Case Coverage

| Category | Description | Examples |
|----------|-------------|----------|
| Rule Coverage | Every rule in every tier | Tier 1 AMS (36-month), Tier 3 AMS (60-month) |
| Boundary Conditions | At threshold, one unit below, one unit above | Exactly Rule of 75, one day under, one day over |
| Combinations | Multiple interacting factors | DRO + early retirement + purchased service |
| Edge Cases | Unusual but valid scenarios | Rehire after retirement, zero-balance refund |
| Temporal | Effective dating, rule version transitions | Member spanning tier boundary dates |

### Success Criteria

- 100% match between NoUI results and hand-calculated expected results
- Every NoUI calculation traceable to governing document provision
- All edge cases either pass or have documented expected behavior

### Deliverables

- Test case inventory with expected results
- Test execution report
- Defect log (resolved before proceeding)

### Volume Assumption

[Assumption: 200-500 synthetic test cases covering the rule space for Service Retirement process]

---

## 4. Stage 2: Historical Comparison

### Purpose

Compare NoUI calculations against actual legacy transactions to identify differences and categorize their root causes.

### Method

1. Extract completed transactions from legacy system (retirements processed, benefits calculated)
2. Extract input data for each transaction (member demographics, salary history, service credit, etc.)
3. Process same inputs through NoUI
4. Compare results (benefit amounts, eligibility determinations, payment options)
5. For each difference, trace both calculations to governing documents
6. Categorize each difference

### Difference Categories

| Category | Definition | Action |
|----------|------------|--------|
| NoUI Defect | NoUI does not match governing documents | Fix NoUI; retest |
| Legacy Defect | Legacy does not match governing documents | Document finding; report to customer |
| Ambiguous Interpretation | Governing documents unclear; both interpretations defensible | Escalate for policy clarification |
| Data Quality Issue | Source data inconsistent or erroneous | Document; separate from calculation validation |
| Rounding Variance | Minor difference due to rounding approach | Document if within tolerance; investigate if not |

### Explanation Format

Each difference produces a documented explanation:

```
Member: [Name] (ID: [ID])
Transaction: [Type]
Transaction Date: [Date]

Legacy Result:
  [Field]: [Value]

NoUI Result:
  [Field]: [Value]

Difference: [Amount or description]

Explanation:
  [Detailed trace of both calculations]
  
Governing Document Reference:
  [Statute section, policy reference]

Finding Category: [NoUI Defect | Legacy Defect | Ambiguous | Data Quality | Rounding]

Recommended Action: [Fix | Document | Escalate | None]
```

### Success Criteria

- All NoUI defects resolved
- All legacy defects documented
- All ambiguous interpretations resolved or escalated
- Remaining unexplained differences: zero

### Deliverables

- Historical comparison report
- Legacy defect inventory (value to customer)
- Ambiguous interpretation log with resolutions
- NoUI defect log (resolved)

### Volume Assumption

[Assumption: 500-2000 historical transactions sampled, stratified by tier, case type, and time period]

---

## 5. Stage 3: Production Simulation

### Purpose

Validate NoUI handles real, current cases correctly before users depend on it.

### Method

1. Extract current pending cases from legacy (applications in progress, awaiting processing)
2. Run complete workflow through NoUI in simulation mode (no commits, no notifications)
3. Generate full results with documentation for each case
4. Review results for correctness and completeness
5. Optionally: Limited SME review of selected cases

### Simulation Mode Behavior

- NoUI processes as if live, but:
  - No data written to production
  - No external notifications sent
  - No downstream systems triggered
  - Full audit trail captured for review

### Success Criteria

- All pending cases process without error
- Results match expected outcomes based on governing documents
- No new defect categories discovered
- SME review (if conducted) confirms correctness

### Deliverables

- Simulation execution report
- Per-case result documentation
- SME review signoff (if applicable)

### Volume Assumption

[Assumption: 50-100 real pending cases as final validation set]

---

## 6. Stage 4: System Ready Declaration

### Purpose

Formal confirmation that NoUI is ready for production use.

### Prerequisites

- Stage 1 complete: All synthetic tests pass
- Stage 2 complete: All differences explained and resolved
- Stage 3 complete: Production simulation successful
- All NoUI defects resolved
- All ambiguous interpretations resolved
- Legacy defect inventory documented

### Approval Authority

[To be defined per customer — typically Executive Director, IT Director, or Board depending on governance structure]

### Deliverables

- System Readiness Report summarizing validation activities and results
- Sign-off documentation
- Go-live authorization

---

## 7. Stage 5: User Preparation

### Purpose

Prepare end users to work effectively in NoUI.

### Approach

NoUI's guided experience reduces training burden compared to traditional systems. Users do not need deep system knowledge — NoUI directs them to relevant information and provides contextual guidance.

### Training Components

| Component | Description | Duration Assumption |
|-----------|-------------|---------------------|
| System Overview | What NoUI is, how it helps, what changed | [Assumption: 30-60 minutes] |
| Hands-On Practice | Guided walkthrough of common tasks in practice environment | [Assumption: 2-4 hours] |
| Reference Materials | Quick reference guides, contextual help within system | Ongoing |
| Support Channels | How to get help during transition | Documented |

### Practice Environment

- Mirrors production configuration
- Contains synthetic or anonymized data
- Users can practice without affecting real data
- Available before and after cutover

### Success Criteria

- All users complete required training
- Users demonstrate basic task completion in practice environment
- Support channels established and communicated

### Deliverables

- Training materials
- Practice environment
- Training completion records
- Support documentation

---

## 8. Stage 6: Cutover

### Purpose

Transition users from legacy system to NoUI as the authoritative system.

### Cutover Approach

**Single cutover event** — all users, all transactions, one moment in time.

No phased rollout by user group, function, or transaction type. This eliminates dual-system complexity and confusion about "which system do I use?"

### Cutover Sequence

1. **Pre-cutover (T-24 hours)**
   - Final data sync from legacy to NoUI
   - Verification checks on migrated data
   - Communication to all users: cutover is imminent

2. **Cutover window (T-0)**
   - Legacy system set to read-only
   - Any in-flight legacy transactions completed or migrated
   - NoUI enabled for all users
   - Verification that NoUI is operational

3. **Post-cutover (T+1 hour)**
   - Confirm users can access NoUI
   - Confirm transactions are processing
   - Support team active for questions

### Cutover Window Assumption

[Assumption: 2-4 hour maintenance window, scheduled during low-activity period (weekend, evening)]

### Rollback Criteria

If critical issues discovered during cutover:

1. NoUI disabled
2. Legacy restored to read-write
3. Users notified to continue in legacy
4. Issue investigated and resolved
5. Cutover rescheduled

### Deliverables

- Cutover plan with timeline
- Rollback procedure
- Communication templates
- Verification checklist

---

## 9. Stage 7: Reverse Parallel Operation

### Purpose

Provide safety net post-cutover by running legacy as automated shadow system.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│                          │                                  │
│                          ▼                                  │
│                    ┌──────────┐                             │
│                    │   NoUI   │ ◄─── Authoritative          │
│                    │ (writes) │                             │
│                    └────┬─────┘                             │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              │                     │                        │
│              ▼                     ▼                        │
│     ┌─────────────┐       ┌──────────────┐                  │
│     │   Modern    │       │   Legacy     │ ◄─── Shadow      │
│     │  Database   │       │   Database   │     (automated)  │
│     └─────────────┘       └──────────────┘                  │
│                                  │                          │
│                                  ▼                          │
│                         ┌──────────────┐                    │
│                         │  Comparison  │                    │
│                         │    Engine    │                    │
│                         └──────────────┘                    │
│                                  │                          │
│                                  ▼                          │
│                         ┌──────────────┐                    │
│                         │ Discrepancy  │                    │
│                         │     Log      │                    │
│                         └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Options

**Option A: Synchronous Write-Through**

- User enters transaction in NoUI
- NoUI processes and commits to modern database
- NoUI also writes to legacy database via Data Connector
- Comparison runs immediately
- Discrepancy flagged in real-time

Best when: Legacy accepts writes via API or direct database insert

**Option B: Batch Replication**

- NoUI processes and commits to modern database
- Periodic job extracts NoUI transactions
- Job feeds transactions into legacy
- Comparison runs on batch basis (hourly or daily)
- Discrepancies flagged on batch cycle

Best when: Legacy only accepts batch input or synchronous writes not feasible

### Discrepancy Handling

| Discrepancy Type | Action |
|------------------|--------|
| NoUI defect (critical) | Pause; consider failover; emergency fix |
| NoUI defect (non-critical) | Log; fix in next release |
| Legacy defect (known) | Ignore (documented in Stage 2) |
| Legacy defect (new) | Log; add to legacy defect inventory |
| Expected difference | Ignore (legacy has embedded error NoUI doesn't replicate) |

### Critical Discrepancy Definition

A discrepancy is critical if:

- Benefit payment amount differs by more than [Assumption: $1.00]
- Eligibility determination differs (eligible vs. not eligible)
- Payment option calculation materially incorrect
- Any difference that would cause financial harm to member or plan

### Failover Procedure

If critical issue requires failover:

1. NoUI disabled for new transactions (in-flight complete normally)
2. Legacy restored to read-write
3. Users notified: temporary return to legacy
4. Most recent NoUI transactions reviewed and entered into legacy if needed
5. Issue investigated and resolved
6. NoUI re-enabled after fix validated
7. Users return to NoUI

### Exit Criteria

Reverse parallel ends when all criteria met:

| Criterion | Threshold |
|-----------|-----------|
| Duration | [Assumption: Minimum 60 days] |
| Critical discrepancies | Zero for [Assumption: 60 consecutive days] |
| Non-critical discrepancies | All explained and documented |
| Stakeholder confidence | Board/executive sign-off on legacy retirement |

### Deliverables

- Comparison engine (automated)
- Discrepancy log and dashboard
- Failover procedure (documented and tested)
- Exit criteria checklist

---

## 10. Stage 8: Legacy Retirement

### Purpose

Decommission legacy system after reverse parallel validates NoUI stability.

### Prerequisites

- Exit criteria from Stage 7 met
- Sign-off from approval authority
- Data archival complete

### Retirement Sequence

1. **Data Archival**
   - Full legacy database backup
   - Archive stored per retention requirements
   - Verification that archive is readable and complete

2. **Access Transition**
   - Legacy system set to read-only (if not already)
   - Access restricted to administrators only
   - User accounts disabled

3. **Infrastructure Decommission**
   - Legacy application servers shut down
   - Database servers shut down (after archival verified)
   - Infrastructure resources released

4. **Documentation**
   - Legacy system retirement documented
   - Archive location and access procedure documented
   - Retention schedule confirmed

### Retention Assumption

[Assumption: Legacy data archived for 7+ years per pension record retention requirements — verify against specific jurisdiction requirements]

### Deliverables

- Data archival confirmation
- Retirement documentation
- Updated system inventory

---

## 11. Timeline Summary

| Stage | Duration Assumption | Cumulative |
|-------|---------------------|------------|
| 1. Synthetic Validation | 2-3 weeks | 2-3 weeks |
| 2. Historical Comparison | 3-4 weeks | 5-7 weeks |
| 3. Production Simulation | 2-3 weeks | 7-10 weeks |
| 4. System Ready Declaration | 1 week | 8-11 weeks |
| 5. User Preparation | 2-3 weeks | 10-14 weeks |
| 6. Cutover | 1 day | 10-14 weeks |
| 7. Reverse Parallel | 8-12 weeks | 18-26 weeks |
| 8. Legacy Retirement | 1-2 weeks | 19-28 weeks |

**Total: [Assumption: 5-7 months from validation start to legacy retirement]**

This compares favorably to traditional pension system implementations [Assumption: 2-5 years].

Note: Stages 1-3 may overlap with POC and initial deployment work. Timeline above assumes sequential execution; actual timeline depends on resource availability and customer engagement cadence.

---

## 12. Dependencies and Assumptions

### Technical Dependencies

| Dependency | Description | Risk if Unavailable |
|------------|-------------|---------------------|
| Legacy database access | Read access for historical comparison and data extraction | Cannot validate without historical data |
| Legacy write capability | Write access for reverse parallel (Option A) or batch feed (Option B) | Must choose Option B or skip reverse parallel |
| Data Connector | Functional connection to legacy database | Blocks all stages |
| NoUI Rules Engine | Correctly implements governing documents | Core functionality |

### Customer Dependencies

| Dependency | Description | Risk if Unavailable |
|------------|-------------|---------------------|
| Governing documents | Statutes, board policies, actuarial valuations | Cannot validate rules |
| SME availability | Subject matter experts for ambiguous interpretation resolution | Interpretation disputes unresolved |
| Approval authority | Sign-off for system ready and legacy retirement | Cannot proceed to cutover |
| Training participation | Users attend and complete training | User readiness compromised |

### Assumptions

All durations in this document are assumptions based on typical pension agency scale and complexity. Actual durations depend on:

- Legacy system complexity
- Data quality
- Volume of historical transactions
- Number of discovered defects
- Customer responsiveness
- Resource availability

---

## 13. Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Synthetic test cases miss edge cases | Medium | Multiple sources: rule analysis, historical patterns, SME input |
| Historical comparison surfaces many legacy defects | Low | This is valuable, not problematic; document and report |
| Ambiguous interpretations delay progress | Medium | Escalation path defined; don't block on policy decisions |
| Users resist transition | Medium | Guided experience reduces burden; clear communication |
| Cutover fails | High | Rollback procedure defined and tested |
| Critical defect discovered post-cutover | High | Reverse parallel provides failover; monitoring catches issues |
| Reverse parallel extends indefinitely | Low | Exit criteria defined upfront; governance checkpoint |
| Legacy write-back fails | Medium | Test thoroughly; Option B as fallback |

---

## 14. Open Questions

| Question | Status | Owner |
|----------|--------|-------|
| Specific exit criteria thresholds (days, tolerance) | Needs customer input | TBD |
| Legacy write capability (Option A vs. Option B) | Depends on legacy system | Per deployment |
| Approval authority for each stage | Customer-specific | Per deployment |
| Data retention requirements | Jurisdiction-specific | Per deployment |
| Training approach (on-site, virtual, self-paced) | Customer preference | Per deployment |

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-20 | Jeff (with Claude) | Initial draft |
