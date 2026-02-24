# Build Readiness Assessment

**Date:** February 24, 2026
**Context:** All five parallel design streams complete. Contract Registry v3 finalized. Assessing readiness to begin Claude Code build sessions.

---

## Design-to-Build Artifact Map

For each BUILD_PLAN day, this maps what was planned vs. what design artifacts now exist, and what Claude Code needs to execute.

---

### Day 1: Database Schema and Seed Data — FULLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| 1.1 Legacy Schema | `001_legacy_schema.sql` (S1) — 11 tables, complete DDL with intentional realism | **Ready. Claude Code copies file into repo.** |
| 1.2 Data Generation | `generate_derp_data.py` (pre-existing) + S1 domain entity specs for validation | **Ready. Script exists, needs S1 corrections applied (employer rate by era).** |
| 1.3 Demo Case Members | `case1-4-test-fixture.json` — all four fixtures with exact input data | **Ready. Generator must produce members matching these fixtures exactly.** |
| 1.4 Data Quality Issues | `embedded-issues.md` + S1 DDL comments marking DQ issue locations | **Ready. 6 issue types, specific counts defined.** |
| 1.5 Verification | S5 verification artifacts define database-level acceptance criteria | **Ready.** |

**BUILD_PLAN correction needed:** Step 2.2 says employer contribution 11%. SESSION_BRIEF corrects to 17.95% (current) with era-appropriate historical rates.

**Day 1 Claude Code estimate:** 1 session. The schema is written; the generator exists. Primary work is integrating S1 corrections and verifying demo case data.

---

### Day 2: DERP Rule Definitions — COMPLETE (Done in Parallel Design)

| Step | Design Artifact | Status |
|------|----------------|--------|
| 2.1 Schema | `schema.yaml` (S2) | **Done.** |
| 2.2 Membership | `membership.yaml` (S2) — 5 rules | **Done.** |
| 2.3 Eligibility | `eligibility.yaml` (S2) — 10 rules | **Done.** |
| 2.4 Benefit Calc | `benefit-calculation.yaml` (S2) — 9 rules | **Done.** |
| 2.5 Payment Options | `payment-options.yaml` (S2) — 7 rules | **Done.** |
| 2.6 Service Credit | `service-credit.yaml` (S2) — 3 rules | **Done.** |
| 2.7 DRO/Supplemental/Process | `dro.yaml`, `supplemental.yaml`, `process.yaml` (S2) — 18 rules | **Done.** |
| 2.8 Verification | 52 rules, 257 test cases, all with source references | **Done.** |

**Day 2 Claude Code estimate:** 0 sessions (or 30 minutes to copy files into repo structure and verify). All YAML files exist. This is the biggest acceleration — Day 2 was originally a full build day.

---

### Day 3: Hand Calculations — COMPLETE (Done in Parallel Design)

| Step | Design Artifact | Status |
|------|----------------|--------|
| 3.1 Case 1 | `case1-robert-martinez-calculation.md` (S2) | **Done.** |
| 3.2 Case 2 | `case2-jennifer-kim-calculation.md` (pre-existing) | **Done.** |
| 3.3 Case 3 | `case3-david-washington-calculation.md` (S2) | **Done. DISC-01 beneficiary name fix pending.** |
| 3.4 Case 4 | `case4-robert-dro-calculation.md` (pre-existing) | **Done.** |
| 3.5 Test Fixtures | All four `case*-test-fixture.json` (pre-existing) | **Done.** |
| 3.6 Verification | All hand calcs validated against fixtures in CR-2 | **Done.** |

**Day 3 Claude Code estimate:** 0 sessions. All artifacts exist and are verified.

---

### Day 4: Data Connector Service — FULLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| 4.1 Scaffold | Go service pattern defined in S3 API conventions | **Designed. Claude Code implements.** |
| 4.2 Member API | `openapi-connector.yaml` endpoint spec + `002_domain_entity_specifications.md` field mapping + `003_connector_data_contracts.md` response shapes | **Fully specified.** |
| 4.3 Employment API | Same sources — employment history endpoint fully spec'd | **Fully specified.** |
| 4.4 Salary + AMS API | Same sources — AMS calculation endpoint spec'd. XS-11 confirms Intelligence trusts this result. | **Fully specified.** |
| 4.5 Supporting APIs | Beneficiaries, DRO, contributions, service credit — all in OpenAPI spec | **Fully specified.** |
| 4.6 Integration Tests | `integration-test-contracts.md` (S3+S5) defines boundary assertions | **Contract defined. Test implementation is the work.** |
| 4.7 Verification | Demo case expected values from hand calculations | **Oracle ready.** |

**Key contracts:** C-01 (schema), C-02 (domain model), C-04 (salary/AMS), C-10 (Connector API), C-19 (response envelope), C-20 (shared types). All Proposed or Resolved.

**Day 4 Claude Code estimate:** 1-2 sessions. OpenAPI spec provides the target. `shared-types.go` provides the type definitions. Domain entity specs provide the mapping logic. The Connector is mostly a translation layer with the AMS calculation being the complex part.

---

### Day 5: Intelligence Service — FULLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| 5.1 Scaffold | Same Go pattern as Connector | **Designed.** |
| 5.2 Rule Loader | `schema.yaml` (S2) defines the YAML structure to parse | **Schema defined.** |
| 5.3 Eligibility | `eligibility.yaml` — 10 rules with conditions, hierarchy, test cases. `openapi-intelligence.yaml` — endpoint spec. XS-20 confirms 6 retirement types. | **Fully specified.** |
| 5.4 Benefit Calc | `benefit-calculation.yaml` — 9 rules with formulas. Calculation trace format defines output structure. XS-36/37 confirm rounding and partial-year conventions. | **Fully specified.** |
| 5.5 Payment Options | `payment-options.yaml` — 7 rules. XS-21 confirms placeholder factors. | **Fully specified.** |
| 5.6 Scenario Calc | XS-29 defines input (what_if_retirement_date) and output (re-run pipeline). | **Specified.** |
| 5.7 DRO Calc | `dro.yaml` — 6 rules. Case 4 hand calculation provides oracle. | **Fully specified.** |
| 5.8 Verification | All 4 demo cases must match. 257 inline YAML test cases provide additional coverage. | **Oracle ready.** |

**Key contracts:** C-03 (rule input shape), C-05 through C-09 (calculation outputs), C-11 (Intelligence API), C-22 (YAML schema), C-23 (trace format). All Proposed.

**Day 5 Claude Code estimate:** 2-3 sessions. This is the most complex service — the rules engine, calculation pipeline, and trace output. But every formula, condition, and expected result is pre-defined. The 257 YAML test cases can be directly translated to Go tests.

---

### Days 6-8: Frontend — SUBSTANTIALLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| Day 6 Foundation | `noui-s4-frontend-architecture.docx` — component inventory, prototype-to-production mapping | **Architecture defined.** |
| Day 6 Components | `noui-component-interfaces.ts` — TypeScript interfaces for all components (CON-01/02 applied) | **Props contracts defined.** |
| Day 7 Calc Components | Same sources — BenefitCalculationPanel, PaymentOptionsComparison, ScenarioModeler, DROImpactPanel all spec'd | **Interfaces defined. Implementation is the work.** |
| Day 8 Composition | S4 architecture doc — workspace composition decision tree, Tier 1/2 logic | **Decision tree defined. C-16 still Draft.** |
| Day 8 Integration | `openapi-*` specs define all API endpoints to wire to | **Backend contracts ready.** |

**Key contracts:** C-15 (component props), C-16 (composition rules — Draft), C-12 (Workspace API — Draft). The two Draft contracts are the composition layer, which is acceptable because the component contracts are stable.

**Existing prototypes:** `benefit-estimator-1/2/3.jsx`, `noui-multi-portal.jsx`, `noui-workflow-dashboard-prototype.jsx`, `noui-ux-prototype.jsx` provide visual direction (not production code).

**Design system:** `noui-design-system.css` provides DERP brand colors and base styles.

**Days 6-8 Claude Code estimate:** 2-3 sessions. Component interfaces are defined but React implementation is the bulk of the work. The prototypes give visual direction. The composition engine is the novel piece.

---

### Days 9-10: Data Quality + Operational Analysis — PARTIALLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| Day 9 DQ Engine | `embedded-issues.md` defines the 6 issue types to detect. S5 verification artifacts define DQ detection specs (DQ-001 through DQ-006). `dataQualityFlags` in response envelope (CON-03) defines how findings surface. | **Detection rules defined. UI and workflow partially spec'd.** |
| Day 10 Patterns | `noui-operational-intelligence-dashboard.md` and feature analysis docs (01-05) provide concept direction. | **Conceptual. Less formal specification than Days 1-8.** |

**Days 9-10 Claude Code estimate:** 1-2 sessions. Day 9 is well-defined (detect known issues, surface them). Day 10 is more exploratory.

---

### Days 11-12: Testing — SUBSTANTIALLY DESIGNED

| Step | Design Artifact | Status |
|------|----------------|--------|
| Day 11 Test Suite | S5 verification artifacts: 124 test functions across 7 Go test files. 4-case-per-rule boundary pattern. S2 YAML test cases provide 257 additional cases. | **Test specs defined. Translation to Go is the work.** |
| Day 12 Edge Cases | S5 boundary case inventory. S2 YAML boundary/just-below/negative test cases. | **Cases identified. Implementation is the work.** |

**Days 11-12 Claude Code estimate:** 1-2 sessions. Test specifications are comprehensive. The work is translating YAML test cases to Go test functions and wiring integration tests.

---

### Days 13-15: Polish + Demo — DESIGN NOT NEEDED

These days are execution: visual polish, demo environment, rehearsal. Design artifacts don't drive these — the working system does.

**Days 13-15 Claude Code estimate:** 1-2 sessions.

---

## Summary: Build Compression

| BUILD_PLAN Day | Original Scope | Post-Design Status | Estimated Sessions |
|---------------|---------------|-------------------|-------------------|
| Day 1 | Schema + seed data | Schema written, generator exists | 1 |
| Day 2 | Rule definitions | **COMPLETE — 52 rules in YAML** | 0 (file copy) |
| Day 3 | Hand calculations | **COMPLETE — all 4 cases** | 0 (already done) |
| Day 4 | Connector service | Fully specified (OpenAPI + types + mapping) | 1-2 |
| Day 5 | Intelligence service | Fully specified (rules + trace + tests) | 2-3 |
| Days 6-8 | Frontend | Component contracts defined, prototypes exist | 2-3 |
| Days 9-10 | DQ + patterns | Detection rules defined, UI conceptual | 1-2 |
| Days 11-12 | Testing | 257 YAML test cases + boundary inventory | 1-2 |
| Days 13-15 | Polish + demo | Execution only | 1-2 |
| **Total** | **15 working days** | | **~9-15 sessions** |

Days 2 and 3 are eliminated entirely. The parallel design work saved an estimated 2-3 full build days and removed the design discovery that would have paused implementation on Days 4-5.

---

## Recommended Session Sequence

Rather than following the BUILD_PLAN day numbering (which assumed sequential design-then-build), Claude Code sessions should follow this order:

**Session 1: Repository Setup + Database**
- Initialize repo structure per BUILD_PLAN
- Copy S1/S2 artifacts into proper locations (schema, YAML rules, hand calcs, fixtures)
- Apply SESSION_BRIEF corrections (employer rate, reduction rates)
- Run data generation, verify demo cases, verify DQ issues embedded
- Deploy to local PostgreSQL

**Session 2: Data Connector Service**
- Implement from `openapi-connector.yaml` + `shared-types.go`
- Use `002_domain_entity_specifications.md` for legacy-to-domain mapping
- AMS calculation per `benefit-calculation.yaml` RULE-AMS-WINDOW/RULE-AMS-CALC
- Integration tests verifying all 4 demo cases through API
- XS-13 resolved: `/data-quality/member/{id}` lives here

**Session 3: Intelligence Service — Eligibility + Benefit Calc**
- Rule loader consuming YAML files
- Eligibility evaluation (10 rules, hierarchy logic)
- Benefit calculation (9 rules, all three tier formulas)
- Calculation trace output per `calculation-trace-format.md`
- Test against all 4 demo case oracles

**Session 4: Intelligence Service — Payment Options + DRO + Scenario**
- Payment options (7 rules, J&S placeholder factors)
- DRO calculation (6 rules, Case 4 validation)
- Scenario modeling (re-run pipeline with what_if dates)
- Supplemental benefits (IPR, death benefit, COLA)
- Full 4-case acceptance test: ALL values match to the penny

**Session 5: Frontend Foundation + Core Components**
- React/TypeScript/Vite/Tailwind/shadcn setup
- Component implementations from `noui-component-interfaces.ts`
- Wire to Connector + Intelligence APIs
- Workspace composition engine (Tier 1 + Tier 2 logic)

**Session 6: Frontend Calculation Components + Integration**
- BenefitCalculationPanel, PaymentOptionsComparison, ScenarioModeler
- DROImpactPanel, calculation trace rendering
- Demo case workspace verification (right components for right cases)

**Session 7: Data Quality + Testing**
- DQ detection engine (6 issue types from embedded-issues.md)
- DQ dashboard UI
- Comprehensive test suite from YAML test cases (257 → Go tests)
- Boundary case testing from S5 inventory

**Session 8: Polish + Demo Prep**
- Visual consistency, loading states, print styling
- Demo environment deployment
- Verification sweep, rehearsal prep

---

## Pre-Session Checklist

Before launching Session 1, ensure these are in the project:

- [x] BUILD_PLAN.md (with corrections noted in SESSION_BRIEF.md)
- [x] SESSION_BRIEF.md
- [x] CLAUDE_CODE_PROTOCOL.md
- [x] CLAUDE.md
- [x] SYNC_LOG.md
- [x] BUILD_HISTORY.md
- [x] CRITICAL-001-resolution.md
- [x] CRITICAL-002-conflict-resolutions.md
- [x] derp-business-rules-inventory.docx
- [x] 001_legacy_schema.sql
- [x] 002_domain_entity_specifications.md
- [x] 003_connector_data_contracts.md
- [x] schema.yaml + 8 rule YAML files
- [x] 4 hand calculation .md files
- [x] 4 test fixture .json files
- [x] calculation-trace-format.md
- [x] cross-stream-resolutions.md
- [x] openapi-connector.yaml
- [x] openapi-intelligence.yaml
- [x] openapi-workspace.yaml
- [x] shared-types.go + shared-types.ts
- [x] noui-api-conventions.docx
- [x] noui-component-interfaces.ts
- [x] noui-s4-frontend-architecture.docx
- [x] noui-s5-verification-implementation-artifacts.docx
- [x] integration-test-contracts.md
- [x] embedded-issues.md
- [x] generate_derp_data.py
- [x] noui-design-system.css
- [ ] DISC-01 fix applied (Case 3 beneficiary name)

---

## One Update Needed: SESSION_BRIEF.md

The current SESSION_BRIEF.md was written before parallel design. It needs an addendum pointing Claude Code to the new artifacts. Recommended addition:

```
## Appended: Post-Parallel-Design Artifacts (February 24, 2026)

The following artifacts were produced during the parallel design phase and
supersede earlier drafts where applicable:

- Rule YAML files (8 files, 52 rules) → rules/definitions/
- schema.yaml → rules/definitions/
- Hand calculations (Cases 1 and 3) → demo-cases/
- Calculation trace format → docs/
- shared-types.go/ts → services/shared/
- OpenAPI specs (3 files) → docs/api/
- Component interfaces → services/frontend/src/types/
- CRITICAL-002 conflict resolutions → project root
- Cross-stream resolutions → project root

Claude Code should read CRITICAL-002-conflict-resolutions.md during session
initialization (add after SYNC_LOG.md in the startup reading list).
The conventions in CRITICAL-002 are BINDING:
- All monetary values: string with 2 decimal places
- All enums: lowercase
- Response envelope: { data, dataQualityFlags, meta }
```
