# NoUI DERP POC — Product State Summary

**Generated:** February 28, 2026
**Purpose:** Context document for strategic design conversations in Claude Projects

---

## 1. What This Is

A proof-of-concept pension administration platform for the Denver Employees Retirement Plan (DERP). It demonstrates the **NoUI architecture** — AI composes context-sensitive workspaces from deterministic business rules, rather than presenting fixed screens. The POC focuses on the **Retirement Application** process (member applies, system evaluates eligibility, calculates benefit, presents payment options).

### Governing Principles (Non-Negotiable)

1. **AI Does Not Execute Business Rules** — All calculations, eligibility determinations, and decisions run as deterministic, auditable, version-controlled code. AI orchestrates presentation and accelerates configuration; humans certify.
2. **Trust Through Transparency** — Every calculation shows its formula, inputs, steps, and result. Phase 1 (current): no automation of approvals.
3. **Rules Changes Follow Full SDLC** — AI drafts rule configs from governing documents; human SMEs review; regression tests run; humans certify; changes deploy on effective date.
4. **Source of Truth** — Business rules come from governing documents only (RMC, DERP Handbook). Legacy data tells us WHERE data lives, not WHAT the rules are. Historical transactions validate, never define.

---

## 2. What's Built

### Platform Architecture

```
Frontend (React 19 + TypeScript + Vite)
  |
Workspace Service (Go, port 8083) -- composes UI layout
  |
Intelligence Service (Go, port 8082) -- deterministic rules engine
  |
Connector Service (Go, port 8081) -- sole database interface
  |
PostgreSQL 16 (legacy schema, 19 tables, 10,000+ synthetic members)
```

The frontend runs in **demo mode** by default (cached fixtures, no backend required). Append `?live` for live backend queries.

### Four Portals

| Portal | Theme | Target User | Key Screens |
|--------|-------|-------------|-------------|
| **Staff** | Light | DERP administrators | Guided retirement workspace (8 stages), death processing (6 stages), refund processing (6 stages), work queue, member/employer lookup, contribution review |
| **Member** | Light | Plan members | Dashboard (benefit estimate, what-if calculator, life events), 7-step application wizard, application status tracker, profile management, document/message center |
| **Employer** | Light | City departments | Employee roster, contribution reporting (CSV upload + manual), retirement coordination, user management |
| **Vendor** | Light | Insurance vendors | IPR verification queue, enrollment confirmation, reporting |

### Three Process Domains

| Process | Demo Cases | Status |
|---------|-----------|--------|
| **Retirement Application** | 4 cases (Cases 1-4) | Full end-to-end: intake through certification |
| **Contribution Refund** | 2 cases (vested + non-vested) | 6-stage workspace with vested decision moment |
| **Death & Survivor** | 2 cases (retired + active member) | 6-stage workspace: notification through case close |

### Demo Cases (Test Oracle)

| Case | Member | Tier | Scenario | Key Test Points |
|------|--------|------|----------|----------------|
| **1** | Robert Martinez (10001) | 1 | Rule of 75, leave payout | Leave payout boosts AMS; 2.0% multiplier; unreduced |
| **2** | Jennifer Kim (10002) | 2 | Purchased service, early retirement | Purchased service excluded from Rule of 75 but included in benefit calc; 30% early reduction |
| **3** | David Washington (10003) | 3 | Tier 3 early retirement | Rule of 85 (not 75); 60-month AMS; 12% reduction (6%/yr) |
| **4** | Robert Martinez + DRO (10004) | 1 | Domestic Relations Order | Same as Case 1 with benefit divided per marital fraction |

All four cases have hand-calculated expected results that the system must match **to the penny**.

### Staff Guided Workspace Features

The flagship workspace is an 8-stage guided workflow for retirement applications:

1. Application Intake (with 30-day deadline gate)
2. Member Verification
3. Service Credit Review
4. Eligibility Determination
5. Benefit Calculation (with formula transparency)
6. Payment Options
7. Supplemental Benefits (IPR, death benefit)
8. Review & Certify

Features built into the guided workspace:
- **Learning Module** — Three independent layers: onboarding narrative, rules reference citations, interactive verification checklist
- **Auto-checks** — Automated verification signals (green/amber/red) at each stage
- **Confidence signals** — Staff and system confidence indicators
- **Expert mode** — Summary/full depth toggle for experienced staff
- **Knowledge panel** — Searchable DERP provisions with member-specific status badges (now on all member screens)
- **Correspondence composer** — Letter generation with template system
- **Kiosk mode** — Automated walkthrough orchestration for demos

### Rules Engine (Intelligence Service)

52 business rules implemented across 12 YAML definition files (7,467 lines of rule specifications). The Go service uses embedded statutory lookup tables — no AI in the calculation path.

Key calculations:
- AMS (Average Monthly Salary) — highest consecutive 36 or 60 months by tier
- Benefit formula — multiplier x AMS x service years
- Early retirement reduction — 3%/yr (Tiers 1-2) or 6%/yr (Tier 3) under age 65
- Payment options — Life Only, J&S 50/75/100%, 10-Year Certain, Deferred
- DRO — marital fraction allocation to alternate payee
- IPR — Insurance Premium Reimbursement ($12.50/yr pre-Medicare, $6.25/yr post)
- Death benefit — $5,000 base with age reduction ($250/yr Tiers 1-2, $500/yr Tier 3)
- Contribution refund — contributions + compound interest

### Data Quality Engine

Six detectors that flag data issues without auto-resolving (Phase 1: human reviews all findings):
- DQ-001: Employment gap detection
- DQ-002: Salary anomaly detection
- DQ-003: Service credit inconsistency
- DQ-004: Beneficiary completeness
- DQ-005: Contribution history gaps
- DQ-006: Cross-record consistency

### Test Coverage

| Layer | Tests | Focus |
|-------|-------|-------|
| Frontend | 638 tests (31 files) | Route smoke tests, data contracts, cross-portal consistency, calculation accuracy, edge cases, composition logic, form validation |
| Intelligence | ~166 tests + 262 YAML subtests | Eligibility, benefit, DRO, refund, death benefit, boundary conditions |
| Connector | 36 tests | AMS calculation, API handlers, integration |
| **Total** | **~1,100+** | |

### Frontend Infrastructure

- **Theme system** — `PortalTheme` interface (staff/member/employer/vendor), legacy `C` compatibility layer
- **Composition engine** — Tier 1 (deterministic) + Tier 2 (rule-based) component selection
- **Simulation framework** — Workflow simulation with persona-based session generation, pattern analysis
- **Knowledge base** — 14 searchable DERP provisions with member-specific enhancement badges
- **Form system** — 20 form definitions (F01-F20) covering retirement, DRO, survivor, disability, health insurance
- **Life events** — Qualifying life event catalog and workflow engine

---

## 3. Key Architectural Decisions

| ID | Decision | Impact |
|----|----------|--------|
| D-22 | Early retirement reduction: Tiers 1-2 = 3%/yr, Tier 3 = 6%/yr | CRITICAL — verified against 3 DERP sources |
| D-37 | Local PostgreSQL (Docker/K8s unavailable in WSL2) | Dev-only constraint |
| D-50 | AMS calculator in Connector (data transformation, not business rule) | Architecture boundary |
| D-51 | Banker's rounding on final values; full precision intermediates | Penny-accurate calculations |
| D-57 | Statutory lookup tables (not formulas) for reductions/death benefits | Auditability |
| D-64 | Demo mode via cached fixtures (standalone, no backend) | Demo portability |
| ADR-007 | Six-level graceful degradation hierarchy | Resilience |

---

## 4. Open Questions & Known Gaps

### Assumptions In Use (Not Yet Verified with DERP)

| ID | Assumption | Risk |
|----|-----------|------|
| Q-CALC-01 | Banker's rounding on final monthly benefit | Low (penny-level) |
| Q-CALC-02 | Partial year service = months/12 | Low (~0.05 yr) |
| Q-CALC-03 | Reduction uses integer age only (no monthly proration) | Medium (up to ~2.9% diff) |
| Q-CALC-04 | J&S factors are illustrative placeholders | All J&S amounts are estimates |
| Q-001 | Marital status inferred from intake documents | Low |

### Known Fixture Discrepancies

Cases 2, 3, and 4 have sub-$0.30 discrepancies between formula-correct values and fixtures, caused by biweekly salary aggregation precision. Documented and accepted — not a regression.

### Infrastructure Gaps

- End-to-end live mode (`?live`) not yet verified across all 4 cases
- Workspace service not yet in Helm charts
- Integration tests require Docker network (not available in WSL2)

### Feature Gaps (Not Planned for POC)

- Retiree Payroll (ongoing monthly payments, tax withholding, deductions) — separate process
- Actual actuarial J&S factors (using illustrative placeholders)
- Social Security Make-Up Benefit — out of scope
- Proficiency model integration (reference docs exist, not wired into UI)
- Phase 2+ automation (auto-approvals after demonstrated accuracy)

---

## 5. Build Timeline

The original 15-day build plan completed Feb 18-22, 2026 (Sessions 1-19). Post-build work added:

- **Session 20-28** (Feb 22): Code hygiene, guided workspace, UX overhaul, proficiency model, expert mode, adaptive card depth
- **Phase 2** (Feb 25): Multi-process expansion (refund + death/survivor workspaces, service purchase explorer)
- **Phase 3** (Feb 25): Employer portal (5 pages), vendor portal (3 pages), test quality overhaul
- **Ongoing** (Feb 25-28): Portal login/auth gates, knowledge panel expansion, edge case testing

Git tag `v0.1.0-demo` marks the original build plan completion.

---

## 6. Codebase Size

| Component | Language | Lines |
|-----------|----------|-------|
| Connector Service | Go | ~4,900 |
| Intelligence Service | Go | ~10,000 |
| Workspace Service | Go | ~1,600 |
| Frontend | TypeScript/React | ~25,000+ |
| Database Schema | SQL | ~750 |
| Rules Definitions | YAML | ~7,500 |
| Seed Data Generator | Python | ~500 |
| **Total** | | **~50,000+** |

---

## 7. DERP Quick Reference

| Provision | Tier 1 | Tier 2 | Tier 3 |
|-----------|--------|--------|--------|
| Hire Date | Before Sept 1, 2004 | Sept 1, 2004 - June 30, 2011 | On/after July 1, 2011 |
| Multiplier | 2.0% | 1.5% | 1.5% |
| AMS Window | 36 months | 36 months | 60 months |
| Rule of N | 75 (min age 55) | 75 (min age 55) | 85 (min age 60) |
| Early Retirement Age | 55 | 55 | 60 |
| Early Reduction | 3%/yr under 65 | 3%/yr under 65 | 6%/yr under 65 |
| Leave Payout | If hired <2010 | If hired <2010 | No |
| Death Benefit | $5K, -$250/yr if early | $5K, -$250/yr if early | $5K, -$500/yr if early |
| Vesting | 5 years | 5 years | 5 years |
| Employee Contribution | 8.45% | 8.45% | 8.45% |
| Employer Contribution | 17.95% | 17.95% | 17.95% |
| Normal Retirement | Age 65 + 5 years | Age 65 + 5 years | Age 65 + 5 years |

---

## 8. Route Map (All Screens)

### Staff Portal (14 routes)
`/staff` — Welcome/process selector
`/staff/case/:memberId` — Classic benefit workspace
`/staff/case/:memberId/guided` — Guided 8-stage workspace
`/staff/death/:memberId` — Death processing (6 stages)
`/staff/refund/:memberId` — Refund processing (6 stages)
`/staff/compare` — Multi-case comparison
`/staff/queue` — Work queue (pending submissions)
`/staff/queue/:bundleId` — Submission review
`/staff/contributions` — Contribution batch queue
`/staff/contributions/:reportId` — Contribution report review
`/staff/members` — Member lookup/search
`/staff/members/:memberId` — Member detail
`/staff/employers` — Employer/department lookup
`/staff/access` — Access management

### Member Portal (10 routes)
`/portal` — Dashboard (benefit estimate, what-if, life events)
`/portal/apply/:appId` — 7-step application wizard
`/portal/status/:appId` — Application status tracker
`/portal/messages` — Messages/correspondence
`/portal/documents` — Document library
`/portal/profile` — Profile management
`/portal/life-events` — Life event hub
`/portal/life-events/:eventId` — Life event workflow
`/portal/forms/:formId` — Form submission wizard
`/portal/submissions/:bundleId` — Submission status

### Employer Portal (8 routes)
`/employer` — Dashboard
`/employer/roster` — Employee roster
`/employer/contributions` — Contribution reports
`/employer/contributions/upload` — CSV upload
`/employer/contributions/new` — Report builder
`/employer/retirements` — Retirement coordination
`/employer/reports` — Reports/analytics
`/employer/users` — User management

### Vendor Portal (3 routes)
`/vendor` — Enrollment queue
`/vendor/member/:memberId` — IPR verification detail
`/vendor/reports` — Reporting

### Demos (9 routes)
`/demo` — Demo landing
`/demos/knowledge-assistant` — Rules Q&A
`/demos/correspondence` — Letter composer
`/demos/data-validator` — Data quality
`/demos/learning-engine` — AI/ML learning
`/demos/workflow` — Workflow orchestration
`/demos/operational` — Operational analytics
`/demos/data-quality` — DQ dashboard
`/demos/purchase-explorer` — Service purchase calculator
`/demos/change-management` — Change management demo

---

## 9. What To Upload to Claude Project

For strategy conversations, upload these files:

1. **This document** (`PRODUCT_STATE_SUMMARY.md`) — current state overview
2. **CLAUDE.md** — governing principles, tier reference, conventions
3. **BUILD_PLAN.md** — the original 15-day roadmap (all complete)
4. **docs/SESSION_BRIEF.md** — business context, corrections, sync status
5. **derp-business-rules-inventory.docx** — all 52 rules with RMC citations
6. **Screenshots** of each portal (staff guided workspace, member dashboard, employer, vendor)

Optional depth:
- `rules/definitions/*.yaml` — full rule specifications
- `demo-cases/case*-calculation.md` — hand-calculated test oracles
- `docs/noui-architecture-decisions.docx` — architectural principles document
