# Claude Code Session Brief — Day 1-2 Build Tasks

**Date:** February 21, 2026
**Context:** Pre-build analysis complete. Business rules inventory finalized. Ready for implementation.
**Add this file to the project root as `SESSION_BRIEF.md` before starting Claude Code.**

---

## What Was Just Completed (Chat Session)

A comprehensive business rules identification pass was completed against the full RMC (§18-391 through §18-430.7) and all DERP governing documents. The output is:

**`derp-business-rules-inventory.docx`** — Add this to the project root.

This document contains:
- **52 rules** across 8 categories, in evaluation order
- **48 confirmed** against RMC statutory text with section citations
- **4 assumed** with documented rationale
- **12 open items** requiring DERP staff input (flagged, not blocking)
- **38 flagged assumptions** with risk ratings
- **Demo case coverage matrix** (Appendix B)
- **Assumptions register** (Appendix A)

**This inventory is the authoritative source for YAML rule definitions.** Every rule in the YAML files must trace to a rule in this inventory.

---

## Known Corrections Needed in Existing Project Files

Before starting Day 1 tasks, apply these corrections:

### BUILD_PLAN.md Corrections

1. **Line ~95:** Employer contribution rate says `11%`. Should be `17.95%` per RMC §18-407(e)(1) and Decision 26.

2. **Line ~117:** Early retirement reduction says `6% per year under age 65`. Should be:
   - Tiers 1 & 2: `3% per year under age 65` (max 30% at age 55)
   - Tier 3: `6% per year under age 65` (max 30% at age 60)
   Per CRITICAL-001 resolution and RMC §18-409(b).

### generate_derp_data.py

3. Verify employer contribution rate uses era-appropriate values:
   - Pre-2012: ~11%
   - 2012-2022: gradual increase (approximate)
   - 2023+: 17.95%
   Employee rate: 8.45% (consistent since at least 2014).

---

## Day 1 Execution: Database Schema and Seed Data

Follow BUILD_PLAN.md Day 1 steps with these additions from the rules inventory:

### Schema Design Notes (from rules analysis)

- **SERVICE_CREDIT table:** Must store `credit_type` (EARNED, PURCHASED, MILITARY, LEAVE) as a first-class field. RULE-SVC-PURCHASED and RULE-SVC-SEPARATION require the engine to query earned-only vs. total service in different contexts. This is the single most important data model decision for eligibility accuracy.

- **SALARY_HIST table:** Must include `leave_payout_amount` as a separate column (not merged into base salary). RULE-LEAVE-PAYOUT requires adding it conditionally based on hire date.

- **DRO_MASTER table:** Must store `marriage_date`, `divorce_date`, `division_method` (PERCENTAGE, FIXED_AMOUNT), `division_value`, and `status`. RULE-DRO-MARITAL-SHARE calculates the marital fraction from these dates.

- **Tier 1 termination clause:** RULE-TIER-1 includes a condition that the member terminated service after Dec 31, 1999. Seed data should not generate Tier 1 members with termination dates before 2000.

### Demo Case Data Requirements

The four demo case members must produce **exact** expected calculations. Source data for each:

| Field | Case 1 (Martinez) | Case 2 (Kim) | Case 3 (Washington) | Case 4 (Martinez DRO) |
|-------|-------------------|--------------|---------------------|----------------------|
| Hire Date | Jun 15, 1997 | Mar 1, 2008 | Sep 1, 2012 | Same as Case 1 |
| DOB | Mar 8, 1963 | Jun 22, 1970 | Feb 14, 1963 | Same as Case 1 |
| Tier | 1 | 2 | 3 | 1 |
| Retirement Date | Apr 1, 2026 | May 1, 2026 | Apr 1, 2026 | Apr 1, 2026 |
| Earned Service | 28 yr 9 mo | 18 yr 2 mo | 13 yr 7 mo | 28 yr 9 mo |
| Purchased Svc | None | 3 yr | None | None |
| Leave Payout | $52,000 | Eligible (verify) | Not eligible | $52,000 |
| Marital Status | Married (Elena) | Single | Single* | Married (Elena) + DRO (Patricia) |
| DRO | No | No | No | Yes — 40% of marital share |

*Case 3 marital status: verify from test fixture. Not material to calculation but affects spousal consent rule.

### Seed Data Verification Checklist

After generation, verify:
- [ ] Each demo case member identifiable by name or ID
- [ ] Tier determination matches hire date rules
- [ ] Salary histories produce correct AMS when windowed
- [ ] Leave payout appears in correct month for eligible members
- [ ] Purchased service records exist for Case 2
- [ ] DRO record exists for Case 4 with correct dates/percentages
- [ ] Deliberate data quality issues embedded per BUILD_PLAN Step 1.4
- [ ] No Tier 1 members with termination before Jan 1, 2000

---

## Day 2 Execution: YAML Rule Definitions

### YAML Schema (Step 2.1)

Create `rules/definitions/schema.yaml`:

```yaml
# Rule Definition Schema
# Every rule must conform to this structure
rule_definition:
  rule_id: string          # e.g., "RULE-TIER-1" — matches inventory
  rule_name: string        # Human-readable name
  category: string         # membership | service_credit | eligibility | benefit_calculation | payment_options | dro | supplemental | process
  description: string      # Precise rule statement from inventory
  tier_applicability:      # Which tiers this rule applies to
    - 1
    - 2
    - 3
  conditions:              # Structured conditions (evaluated in order)
    - field: string        # Data field to evaluate
      operator: string     # eq | neq | gt | gte | lt | lte | in | between
      value: any           # Comparison value
      join: string         # AND | OR (for compound conditions)
  formula:                 # For calculation rules
    expression: string     # e.g., "ams * multiplier * service_years"
    variables:
      - name: string
        source: string     # Where this value comes from
  result:                  # What this rule produces
    type: string           # determination | calculation | validation | routing
    output: string         # What's returned
  source_reference:        # CRITICAL — every rule must have this
    document: string       # "RMC" | "DERP Handbook" | "Retirement Application"
    section: string        # e.g., "§18-409(a)(1)"
    verification: string   # "CONFIRMED" | "ASSUMED" | "OPEN"
  effective_date: date     # When this rule version takes effect
  end_date: date           # null for current rules
  test_cases:              # Inline basic expectations
    - description: string
      inputs: object
      expected: object
  governance:
    version: string
    certified_by: string   # "PENDING" until human certifies
    certified_date: date
    inventory_ref: string  # Reference to business rules inventory
```

### YAML File Organization (Steps 2.2-2.7)

Create one file per category, with rules in evaluation order:

| File | Rules from Inventory | Count |
|------|---------------------|-------|
| `rules/definitions/membership.yaml` | RULE-TIER-1, RULE-TIER-2, RULE-TIER-3, RULE-CONTRIB-EE, RULE-CONTRIB-ER | 5 |
| `rules/definitions/service-credit.yaml` | RULE-SVC-EARNED, RULE-SVC-PURCHASED, RULE-SVC-SEPARATION | 3 |
| `rules/definitions/eligibility.yaml` | RULE-VESTING, RULE-NORMAL-RET, RULE-RULE-OF-75, RULE-RULE-OF-85, RULE-EARLY-RET-T12, RULE-EARLY-RET-T3, RULE-EARLY-REDUCE-T12, RULE-EARLY-REDUCE-T3, RULE-DEFERRED, RULE-ELIG-HIERARCHY | 10 |
| `rules/definitions/benefit-calculation.yaml` | RULE-AMS-WINDOW, RULE-AMS-CALC, RULE-LEAVE-PAYOUT, RULE-FURLOUGH, RULE-BENEFIT-T1, RULE-BENEFIT-T2, RULE-BENEFIT-T3, RULE-REDUCTION-APPLY, RULE-ROUNDING | 9 |
| `rules/definitions/payment-options.yaml` | RULE-PAY-MAXIMUM, RULE-JS-100, RULE-JS-75, RULE-JS-50, RULE-JS-DEFAULT, RULE-SPOUSAL-CONSENT, RULE-BENEFICIARY-PREDECEASE | 7 |
| `rules/definitions/dro.yaml` | RULE-DRO-MARITAL-SHARE, RULE-DRO-SEQUENCE, RULE-DRO-METHODS, RULE-DRO-NO-IPR, RULE-DRO-NO-HEALTH, RULE-DRO-COLA | 6 |
| `rules/definitions/supplemental.yaml` | RULE-IPR, RULE-DEATH-NORMAL, RULE-DEATH-EARLY-T12, RULE-DEATH-EARLY-T3, RULE-DEATH-ELECTION, RULE-DEATH-REEMPLOY | 6 |
| `rules/definitions/process.yaml` | RULE-APP-DEADLINE, RULE-NOTARIZATION, RULE-PAYMENT-CUTOFF, RULE-EFFECTIVE-DATE, RULE-IRREVOCABILITY, RULE-COLA | 6 |
| **Total** | | **52** |

### Early Retirement Reduction: Use Statutory Lookup Tables

Do NOT implement reductions as `years_under_65 * rate`. Instead, use the RMC statutory tables directly:

```yaml
# Tiers 1 & 2 — RMC §18-409(b)
early_retirement_table_t12:
  55: 0.70
  56: 0.73
  57: 0.76
  58: 0.79
  59: 0.82
  60: 0.85
  61: 0.88
  62: 0.91
  63: 0.94
  64: 0.97
  65: 1.00

# Tier 3 — RMC §18-409(b)
early_retirement_table_t3:
  60: 0.70
  61: 0.76
  62: 0.82
  63: 0.88
  64: 0.94
  65: 1.00
```

### Death Benefit: Use Statutory Lookup Tables

Same approach — use the dollar-amount tables from RMC §18-411(d):

```yaml
# Tiers 1 & 2
death_benefit_table_t12:
  55: 2500
  56: 2750
  57: 3000
  58: 3250
  59: 3500
  60: 3750
  61: 4000
  62: 4250
  63: 4500
  64: 4750
  65: 5000

# Tier 3
death_benefit_table_t3:
  60: 2500
  61: 3000
  62: 3500
  63: 4000
  64: 4500
  65: 5000
```

### Inline Test Cases per Rule

Every YAML rule definition should include at least these test expectations:

1. **Happy path** — the normal case that exercises the rule
2. **Boundary** — the exact threshold (Rule of 75 = exactly 75.00)
3. **Just below** — one unit below threshold
4. **Negative** — case where rule should NOT fire

Example for RULE-RULE-OF-75:
```yaml
test_cases:
  - description: "Martinez - meets Rule of 75"
    inputs: { tier: 1, age: 63, earned_service: 28.75 }
    expected: { rule_met: true, sum: 91.75, min_age_met: true }
  - description: "Exact boundary"
    inputs: { tier: 1, age: 55, earned_service: 20.00 }
    expected: { rule_met: true, sum: 75.00, min_age_met: true }
  - description: "Just below"
    inputs: { tier: 1, age: 55, earned_service: 19.99 }
    expected: { rule_met: false, sum: 74.99 }
  - description: "Kim - does not meet"
    inputs: { tier: 2, age: 55, earned_service: 18.17 }
    expected: { rule_met: false, sum: 73.17 }
  - description: "Meets sum but not min age"
    inputs: { tier: 1, age: 54, earned_service: 21.00 }
    expected: { rule_met: false, sum: 75.00, min_age_met: false, deferred_until_age: 55 }
```

---

## Assumptions in Effect (Build With These, Adjust When DERP Confirms)

These are documented in the inventory as ASSUMED. Build the engine using these defaults:

| Assumption | Default | Impact if Wrong | Inventory Ref |
|-----------|---------|-----------------|---------------|
| Rounding method | Banker's rounding on final amount only | Penny-level differences | RULE-ROUNDING, Q-CALC-01 |
| Partial year service | Year-month (months/12) | Could shift service by ~0.05 years | RULE-SVC-EARNED, Q-CALC-02 |
| Reduction proration | Integer age only (no monthly proration) | Could change reduction by up to ~2.9% | RULE-EARLY-REDUCE-T12/T3, Q-CALC-03 |
| J&S factors | Placeholders (100%: 0.8850, 75%: 0.9150, 50%: 0.9450) | All J&S dollar amounts are illustrative | RULE-JS-*, Q-CALC-04 |

Mark these in code with `// ASSUMPTION: [Q-CALC-XX] ...` comments so they're searchable.

---

## Verification After Day 2

Before proceeding to Day 3 (hand calculations / engine implementation):

- [ ] Every YAML rule has a `source_reference` with RMC section
- [ ] Every YAML rule has at least 4 inline test cases (happy, boundary, below, negative)
- [ ] All 52 rules from inventory are represented in YAML
- [ ] Rule IDs in YAML match inventory IDs exactly
- [ ] No rule contains information not in the inventory or governing documents
- [ ] BUILD_PLAN.md corrections applied (employer rate, reduction rates)
- [ ] BUILD_HISTORY.md updated with Day 1-2 activities
- [ ] Seed data generates successfully with all four demo cases identifiable
