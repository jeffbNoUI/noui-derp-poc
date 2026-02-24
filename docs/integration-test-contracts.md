# NoUI Integration Test Contract Definitions

**Stream S3 — Deliverable 4**
**Status:** Provisional (pending S1 and S2 reconciliation)

---

## Purpose

This document defines what each boundary integration test must verify. These are
_contracts_, not test implementations. They specify the invariants that must hold
at every service boundary. Test implementations (Go test files) are produced during
BUILD_PLAN Days 4-5 and expanded on Days 11-12.

Each contract specifies:
- **Boundary:** Which two systems are being tested
- **Contract ID:** Unique identifier for traceability
- **Invariant:** What must be true
- **Verification method:** How to check it
- **Demo case coverage:** Which of the four demo cases exercise this contract

---

## Boundary 1: Database → Connector

These tests verify that the Data Connector correctly reads from the legacy
database schema and maps it to the clean domain model. The seeded test database
contains the four demo case members with known data.

### IT-DC-001: Member Profile Mapping

**Invariant:** Every field in the Member response must match the seeded
MEMBER_MASTER data after schema mapping.

**Verification:**
- Seed Robert Martinez (Case 1) with known values
- GET /api/v1/members/{martinez-id}
- Assert: firstName, lastName, dateOfBirth, hireDate, tier, status all match
- Assert: tier = 1 (hireDate 1997-06-15 < 2004-09-01)
- Assert: status = "Active"
- Assert: department and position match current EMPLOYMENT_HIST

**Demo cases:** All four

---

### IT-DC-002: Tier Determination Accuracy

**Invariant:** The tier field must be correctly derived from hireDate for all
three tier boundaries.

**Verification:**
- Case 1 (hired 1997-06-15) → tier = 1
- Case 2 (hired 2008-03-01) → tier = 2
- Case 3 (hired 2012-09-01) → tier = 3
- Test boundary: member hired exactly 2004-09-01 → tier = 2
- Test boundary: member hired exactly 2011-07-01 → tier = 3
- Test boundary: member hired 2004-08-31 → tier = 1
- Test boundary: member hired 2011-06-30 → tier = 2

**Demo cases:** Cases 1, 2, 3

---

### IT-DC-003: AMS Calculation — Window Size

**Invariant:** AMS calculation must use 36-month window for Tiers 1/2 and
60-month window for Tier 3.

**Verification:**
- GET /api/v1/members/{martinez-id}/salary → ams.windowMonths = 36
- GET /api/v1/members/{kim-id}/salary → ams.windowMonths = 36
- GET /api/v1/members/{washington-id}/salary → ams.windowMonths = 60

**Demo cases:** Cases 1, 2, 3

---

### IT-DC-004: AMS Calculation — Exact Value

**Invariant:** AMS amount must match the hand-calculated oracle to the penny.

**Verification:**
- For each demo case, GET salary endpoint with retirementDate parameter
- Compare ams.amount to hand-calculated AMS from demo-cases/calculation.md
- Assert exact string match (no floating-point comparison)
- Assert ams.monthlyBreakdown sums to ams.totalCompensationInWindow
- Assert ams.amount = ams.totalCompensationInWindow / ams.windowMonths

**Demo cases:** All four (Case 4 same as Case 1)

---

### IT-DC-005: AMS Calculation — Leave Payout Boost

**Invariant:** For members hired before 2010-01-01, leave payout in the final
month boosts the AMS window's last month.

**Verification:**
- Case 1 (Robert Martinez, hired 1997): leavePayout = $52,000
  - ams.leavePayoutIncluded = true
  - The final month in the AMS window includes the payout
  - AMS is higher than it would be without payout
- Case 3 (David Washington, hired 2012): No leave payout applicable
  - ams.leavePayoutIncluded = false

**Demo cases:** Cases 1, 3

---

### IT-DC-006: Service Credit — Purchased Exclusion Flags

**Invariant:** Purchased service credit records must have countsForEligibility
= false and countsForIPR = false, while countsForBenefit = true.

**Verification:**
- Case 2 (Jennifer Kim, 3 years purchased):
  - GET /api/v1/members/{kim-id}/service-credit
  - Find purchased record: countsForBenefit = true
  - Same record: countsForEligibility = false
  - Same record: countsForIPR = false
  - totalForBenefit.decimalYears > totalForEligibility.decimalYears

**Demo cases:** Case 2

---

### IT-DC-007: Service Credit — Summary vs Detail Consistency

**Invariant:** The service credit summary totals must match the sum of detail
records.

**Verification:**
- For each demo case member:
  - GET /api/v1/members/{id}/service-credit (summary)
  - GET /api/v1/members/{id}/service-credit/detail
  - Assert: summary.totalForBenefit matches detail total
  - Assert: detail.recordCount matches actual array length

**Demo cases:** All four

---

### IT-DC-008: Beneficiary — Allocation Totals

**Invariant:** Current (non-superseded) primary beneficiary allocations must
sum to 100%.

**Verification:**
- For each demo case member with beneficiaries:
  - GET /api/v1/members/{id}/beneficiaries
  - Sum allocationPercentage for current primary designations
  - Assert: total = 100

**Demo cases:** Cases 1, 4

---

### IT-DC-009: DRO Records — Presence and Absence

**Invariant:** DRO endpoint returns records only for members who have DROs.

**Verification:**
- Case 4 (Robert with DRO): GET returns non-empty array, status = "Active"
- Case 1 (Robert without DRO): GET returns empty array (not 404)
- Case 2: GET returns empty array
- Case 3: GET returns empty array

**Demo cases:** Cases 1, 2, 3, 4

---

### IT-DC-010: Date Format Consistency

**Invariant:** All date fields in every response use ISO 8601 (YYYY-MM-DD).
No legacy format leakage.

**Verification:**
- For each demo case, call every Connector endpoint
- Regex-validate every date field matches /^\d{4}-\d{2}-\d{2}$/
- Specifically check: hireDate, dateOfBirth, effectiveDate, payPeriodDate,
  marriageDate, divorceDate

**Demo cases:** All four

---

### IT-DC-011: Monetary Precision

**Invariant:** All monetary values are strings with exactly 2 decimal places.

**Verification:**
- For each salary record: grossPay, pensionablePay, employeeContribution
  all match /^\d+\.\d{2}$/
- For AMS: amount matches same pattern
- For contribution balance: runningBalance matches same pattern
- Never returns scientific notation or more than 2 decimal places

**Demo cases:** All four

---

## Boundary 2: Connector → Intelligence

These tests verify that the Intelligence service correctly consumes Connector
data and applies rules to produce accurate calculations.

### IT-CI-001: Eligibility Evaluation — All Paths

**Invariant:** The eligibility evaluator returns the correct eligible/not-eligible
status for every retirement path for a given member.

**Verification:**
- Case 1 (Robert Martinez, age 63, 28.75 years earned service):
  - normal: not eligible (under 65)
  - rule75: eligible (63 + 28.75 = 91.75 ≥ 75, age ≥ 55)
  - rule85: not applicable (Tier 1)
  - earlyTier12: eligible (age ≥ 55, service ≥ 5)
  - earlyTier3: not applicable (Tier 1)
- Case 2 (Jennifer Kim, age 55, 18.17 years earned, 3 purchased):
  - rule75: not eligible (55 + 18.17 = 73.17 < 75, purchased excluded)
  - earlyTier12: eligible
  - Assert: projectedEligibilityDate for rule75 is approximately 1 year out
- Case 3 (David Washington, age 63, 13.58 years):
  - rule85: not eligible (63 + 13.58 = 76.58 < 85)
  - earlyTier3: eligible (age ≥ 60, service ≥ 5)

**Demo cases:** Cases 1, 2, 3

---

### IT-CI-002: Benefit Calculation — Exact Match to Oracle

**Invariant:** The calculated benefit must match the hand-calculated oracle
to the penny for all four demo cases.

**Verification:**
- For each demo case:
  - POST /api/v1/benefit/calculate with memberId and retirementDate
  - Assert: calculation.netBenefit matches oracle value exactly
  - Assert: calculation.grossBenefit matches oracle value
  - Assert: calculation.ams.amount matches oracle AMS
  - Assert: calculation.multiplier is correct for tier
  - Assert: calculation.formula is human-readable

**Expected values (from hand calculations):**
- Case 1: Verify against case1 test fixture
- Case 2: grossBenefit = "2332.96", netBenefit = "1633.07"
- Case 3: Verify against case3 test fixture
- Case 4: Same gross/net as Case 1 (DRO is separate calculation)

**Demo cases:** All four

---

### IT-CI-003: Early Retirement Reduction — Tier-Specific Rates

**Invariant:** Early retirement reduction uses 3% per year for Tiers 1/2 and
6% per year for Tier 3. This is the CRITICAL-001 resolution.

**Verification:**
- Case 2 (Tier 2, age 55, 10 years under 65):
  - earlyRetirementReduction.ratePerYear = "0.03"
  - earlyRetirementReduction.totalReduction = "0.30"
  - earlyRetirementReduction.yearsUnder65 = 10
- Case 3 (Tier 3, age 63, 2 years under 65):
  - earlyRetirementReduction.ratePerYear = "0.06"
  - earlyRetirementReduction.totalReduction = "0.12"
  - earlyRetirementReduction.yearsUnder65 = 2
- Case 1 (Rule of 75 met):
  - earlyRetirementReduction should be null or exemptReason = "Rule of 75 met"

**Demo cases:** Cases 1, 2, 3

---

### IT-CI-004: Purchased Service — Benefit vs Eligibility

**Invariant:** Purchased service counts in the benefit formula (multiplier ×
years) but NOT in Rule of 75/85 eligibility checks.

**Verification:**
- Case 2 (Jennifer Kim, 18.17 earned + 3 purchased):
  - Benefit calculation uses 21.17 years (earned + purchased)
  - Rule of 75 check uses 18.17 years (earned only)
  - Rule of 75: 55 + 18.17 = 73.17 < 75 → NOT eligible
  - If purchased were counted: 55 + 21.17 = 76.17 ≥ 75 → would be eligible
  - Assert the system correctly excludes purchased from eligibility

**Demo cases:** Case 2

---

### IT-CI-005: DRO Calculation — Marital Fraction

**Invariant:** The marital fraction equals service during marriage divided by
total service at retirement.

**Verification:**
- Case 4 (Robert Martinez with DRO):
  - Marriage: Aug 15, 1999; Divorce: Nov 3, 2017
  - Service during marriage: ~18.25 years
  - Total service: 28.75 years
  - Marital fraction: 18.25 / 28.75 = 0.6348 (approximately)
  - Award: 40% of marital share
  - Assert: fraction matches oracle value
  - Assert: alternatePayeeAmount = grossBenefit × fraction × 0.40

**Demo cases:** Case 4

---

### IT-CI-006: Payment Options — DRO Interaction

**Invariant:** When a DRO is present, the DRO split is applied BEFORE the
payment option actuarial reduction.

**Verification:**
- Case 4: Calculate payment options with DRO
  - grossBenefit (pre-DRO) should equal Case 1 gross
  - Each option's monthlyAmount reflects both DRO deduction and option reduction
  - preDROAmount field is populated on each option
  - memberRetainedAmount < grossBenefit
  - droApplied = true

**Demo cases:** Case 4

---

### IT-CI-007: Calculation Trace — Completeness

**Invariant:** Every calculation response includes a trace with at least one
step, and every step has ruleId and sourceReference populated.

**Verification:**
- For each demo case:
  - POST benefit/calculate → trace.steps.length > 0
  - Every step: ruleId matches /^[A-Z]+-\d{3}$/
  - Every step: sourceReference contains "RMC" or "18-"
  - Steps are ordered by stepNumber (sequential, no gaps)
  - finalResult contains grossBenefit and netBenefit

**Demo cases:** All four

---

### IT-CI-008: Scenario Calculator — Threshold Detection

**Invariant:** The scenario calculator identifies dates where eligibility
status changes (e.g., Rule of 75 becomes available).

**Verification:**
- Case 2 (Jennifer Kim):
  - Run scenarios with dates spanning 12 months
  - Assert: one date produces a threshold crossing for Rule of 75
  - At that date: retirementType changes from "Early Retirement" to "Rule of 75"
  - At that date: reductionPercentage changes from "0.30" to null
  - The benefit amount increases significantly at the threshold

**Demo cases:** Case 2

---

### IT-CI-009: Lump-Sum Death Benefit — Tier-Specific Formula

**Invariant:** Lump-sum death benefit uses the correct reduction formula per
tier and retirement type.

**Verification:**
- Case 1 (Rule of 75): $5,000 (no reduction)
- Case 2 (Early, Tier 2, 10 years under 65): $5,000 - ($250 × 10) = $2,500
- Case 3 (Early, Tier 3, 2 years under 65): $5,000 - ($500 × 2) = $4,000
- Case 4 (Rule of 75): $5,000 (same as Case 1)

**Demo cases:** All four

---

### IT-CI-010: IPR Calculation — Purchased Service Excluded

**Invariant:** IPR is calculated using earned service years only, excluding
purchased service.

**Verification:**
- Case 2 (18.17 earned years, 3 purchased):
  - ipr.serviceYearsUsed = "18.17" (not 21.17)
  - medicareEligible = $6.25 × 18.17 (approximately)
  - nonMedicareEligible = $12.50 × 18.17 (approximately)

**Demo cases:** Case 2

---

## Boundary 3: Intelligence → Workspace

These tests verify that the Workspace service correctly consumes Intelligence
outputs and produces appropriate workspace compositions.

### IT-IW-001: Tier 1 Composition — Base Components

**Invariant:** For a service-retirement process, the workspace always includes
MemberBanner, AlertBar, EmploymentTimeline, SalaryTable,
BenefitCalculationPanel, PaymentOptionsComparison, and ServiceCreditSummary.

**Verification:**
- POST /api/v1/composition/task for Case 1:
  - Assert: all 7 base components present in response
  - Assert: each component has compositionTier = 1
  - Assert: all components have visible = true

**Demo cases:** Case 1

---

### IT-IW-002: Tier 2 Composition — DRO Conditional

**Invariant:** DROImpactPanel appears only when the member has an active DRO.

**Verification:**
- Case 4 (has DRO): DROImpactPanel present, visible = true, compositionTier = 2
- Case 1 (no DRO): DROImpactPanel absent or visible = false
- compositionMeta.tier2Components includes "DROImpactPanel" for Case 4
- compositionMeta.compositionRules includes a rule with trigger "member has active DRO"

**Demo cases:** Cases 1, 4

---

### IT-IW-003: Tier 2 Composition — Leave Payout Conditional

**Invariant:** LeavePayoutCalculator appears only for members hired before
2010-01-01 with leave payout.

**Verification:**
- Case 1 (hired 1997, has payout): LeavePayoutCalculator present
- Case 3 (hired 2012): LeavePayoutCalculator absent or visible = false

**Demo cases:** Cases 1, 3

---

### IT-IW-004: Tier 2 Composition — Tier-Specific Components

**Invariant:** Workspace reflects tier-specific differences. Tier 3 shows
60-month AMS window notation; Tiers 1/2 show 36-month.

**Verification:**
- Case 1 (Tier 1): SalaryTable parameters include windowMonths = 36
- Case 3 (Tier 3): SalaryTable parameters include windowMonths = 60
- ScenarioModeler parameters reference correct rule (75 vs 85) for tier

**Demo cases:** Cases 1, 3

---

### IT-IW-005: Tier 3 Fallback — AI Unavailable

**Invariant:** If Tier 3 AI is requested but unavailable, the workspace falls
back to Tier 2 composition without error. All calculations remain correct.

**Verification:**
- POST composition/task with requestTier3 = true (AI service stopped)
- Response HTTP 200 (not error)
- compositionMeta.tier3Used = false
- compositionMeta.tier3FellBack = true
- All base and conditional components still present
- meta.degradationLevel = 1

**Demo cases:** Case 1

---

### IT-IW-006: Data Source References — Valid Endpoints

**Invariant:** Every component's dataSource references a valid, reachable
endpoint on the correct service.

**Verification:**
- For each component in a composed workspace:
  - If dataSource.service = "connector": endpoint is a valid Connector path
  - If dataSource.service = "intelligence": endpoint is a valid Intelligence path
  - Call the referenced endpoint: should return 200 for demo case members
  - Response shape matches what the component expects (schema validation)

**Demo cases:** Case 1

---

### IT-IW-007: Alert Generation — Early Retirement Warning

**Invariant:** When a member is taking early retirement with a reduction,
the AlertBar includes a warning about the reduction percentage and amount.

**Verification:**
- Case 2 (30% reduction): alerts array includes severity = "warning" with
  message referencing 30% reduction
- Case 3 (12% reduction): similar warning
- Case 1 (no reduction): no early retirement warning in alerts

**Demo cases:** Cases 1, 2, 3

---

## Boundary 4: Workspace → Frontend

These tests verify that the frontend correctly renders composed workspace data.

### IT-WF-001: Monetary Display — Consistent Formatting

**Invariant:** All monetary values displayed in the frontend use consistent
formatting: $X,XXX.XX with commas for thousands.

**Verification:**
- Render workspace for Case 1
- Assert: benefit amount displays with 2 decimal places and comma grouping
- Assert: AMS amount displays same way
- Assert: no rounding discrepancy between API response and displayed value

**Demo cases:** Case 1

---

### IT-WF-002: Calculation Trace — Step Rendering

**Invariant:** The BenefitCalculationPanel renders every step from the
calculation trace, showing the formula, inputs, and result.

**Verification:**
- Render workspace for Case 1
- Assert: number of rendered steps = trace.steps.length
- Assert: each step shows ruleId (or human-readable equivalent)
- Assert: each step shows sourceReference
- Assert: final result matches trace.finalResult

**Demo cases:** Case 1

---

### IT-WF-003: Negative Composition — Components That Should NOT Appear

**Invariant:** Components excluded by Tier 2 rules must not render.

**Verification:**
- Case 3 (Tier 3, no DRO, no leave payout):
  - DROImpactPanel NOT rendered
  - LeavePayoutCalculator NOT rendered
- Case 1 (Tier 1, no DRO):
  - DROImpactPanel NOT rendered

**Demo cases:** Cases 1, 3

---

## Cross-Boundary: End-to-End Demo Case Acceptance

### IT-E2E-001 through IT-E2E-004: Full Pipeline Per Demo Case

**Invariant:** For each demo case, the complete pipeline from database through
Connector, Intelligence, Workspace, and Frontend produces the exact expected
result at every layer.

**Verification per case:**
1. Connector: Member profile, salary, service credit match seeded data
2. Intelligence: Eligibility, benefit, options match hand-calculated oracle
3. Workspace: Correct components composed for tier and situation
4. Frontend: Values displayed match Intelligence API response exactly

**Acceptance criterion:** ALL FOUR CASES MUST PASS before the POC is
considered demo-ready. Any single penny of discrepancy blocks the demo.

---

## Health Check Contracts

### IT-HC-001: Cascading Health Status

**Invariant:** When the database is unreachable, the Connector reports
unhealthy. When the Connector is unhealthy, the Intelligence service reports
degraded. The Workspace service reports degraded with degradationLevel ≥ 3.

**Verification:**
- Stop PostgreSQL → Connector /readyz returns 503
- With Connector down → Intelligence /readyz returns 503
- With Intelligence down → Workspace /readyz returns 503
- All services: /healthz still returns 200 (liveness ≠ readiness)

---

### IT-HC-002: Degradation Level Propagation

**Invariant:** The degradationLevel in ResponseMeta reflects the actual system
state and propagates through the service chain.

**Verification:**
- Normal operation: all responses have degradationLevel = 0
- Stop AI service: Workspace responses have degradationLevel = 1
- Stop Intelligence: remaining responses have degradationLevel = 3

---

## Contract Governance

Each contract is tagged with a maturity level matching the API conventions
document:

| Status | Meaning |
|--------|---------|
| **Provisional** | Initial definition, may change with S1/S2 reconciliation |
| **Draft** | Validated against at least two streams' outputs |
| **Accepted** | Technical Director approved, changes require formal revision |

All contracts in this document are currently **Provisional**. They advance
to Draft after S1 (schema) and S2 (rules) produce their outputs and any
conflicts are reconciled in this stream.
