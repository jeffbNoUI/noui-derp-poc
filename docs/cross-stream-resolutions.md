# S2 Rules Engine — Cross-Stream Item Resolutions

## Summary

Seven cross-stream items were flagged for resolution during S2. All resolved based on decisions made during rule definition authoring.

---

## XS-19: Calculation Trace Rule ID Scheme

**Question:** Are the rule IDs in the inventory (RULE-TIER-1, etc.) the exact IDs used in trace output?

**Resolution: YES — exact match.**

The `calculation-trace-format.md` uses `ruleId` values that match YAML `rule_id` fields exactly: `RULE-TIER-1`, `RULE-SVC-EARNED`, `RULE-VESTING`, `RULE-RULE-OF-75`, etc. No translation layer needed. The trace's `stepNumber` field provides execution order; `ruleId` provides identity.

**Decided in:** `calculation-trace-format.md`, step objects

---

## XS-20: Eligibility Evaluate Response — Retirement Type Enum

**Question:** Does `openapi-intelligence.yaml`'s EligibilityResult schema correctly represent all pathways?

**Resolution: YES — six values confirmed.**

The eligibility hierarchy (RULE-ELIG-HIERARCHY) produces exactly these retirement types:
- `normal` — RULE-NORMAL-RET
- `rule_of_75` — RULE-RULE-OF-75
- `rule_of_85` — RULE-RULE-OF-85
- `early` — RULE-EARLY-RET-T12 / RULE-EARLY-RET-T3
- `deferred` — RULE-DEFERRED
- `not_eligible` — non-vested members (refund eligible)

This matches the enum in CRITICAL-002 resolution (CON-05: retirement type enum alignment). No changes needed to the OpenAPI spec.

**Decided in:** `eligibility.yaml`, RULE-ELIG-HIERARCHY test cases

---

## XS-21: J&S Actuarial Factor Sourcing

**Question:** Where do J&S actuarial factors come from?

**Resolution: POC uses hardcoded placeholder constants.**

Three placeholder factors defined in `payment-options.yaml`:
- 100% J&S: `0.8850`
- 75% J&S: `0.9150`
- 50% J&S: `0.9450`

Each J&S rule (RULE-JS-100, RULE-JS-75, RULE-JS-50) carries assumption `Q-CALC-04` (OPEN status), explicitly marking all J&S dollar amounts as illustrative. When DERP provides actuarial tables, factors will come from a configuration lookup keyed by member age and beneficiary age. No code change needed — only factor table replacement.

**Decided in:** `payment-options.yaml`, RULE-JS-100/75/50 assumption blocks

---

## XS-29: Scenario Modeler Inputs/Outputs

**Question:** What inputs does scenario modeling accept?

**Resolution: Deferred to S4 (frontend) — rules engine provides the primitives.**

The rules engine defines everything the scenario modeler needs:
- **Input:** Alternative `retirementDate` (which changes `ageAtRetirement` and `serviceCredit`)
- **Recalculate:** RULE-ELIG-HIERARCHY → RULE-BENEFIT-T* → RULE-REDUCTION-APPLY
- **Output:** Side-by-side comparison of current vs projected benefit

Case 2 (Kim) demonstrates the value: at age 56, she meets Rule of 75 (56 + 19.17 = 75.17), eliminating the 30% reduction. The Intelligence Service endpoint accepts `what_if_retirement_date` and re-runs the pipeline. Exact API shape is an S4 concern.

**Decided in:** `eligibility.yaml` TC-R75-04 (Kim at boundary), `benefit-calculation.yaml` test cases

---

## XS-36: Rounding Convention

**Question:** Banker's rounding on final monthly benefit only, or at intermediate steps too?

**Resolution: Final amount only. Intermediates carry full precision.**

RULE-ROUNDING in `benefit-calculation.yaml` specifies:
- All intermediate calculations carry full precision (no rounding)
- Only the final monthly benefit amount is rounded to 2 decimal places
- Method: banker's rounding (round half to even)
- Assumption `Q-CALC-01` remains OPEN — DERP may use standard rounding or truncation

The calculation trace format reflects this: `intermediateValues` show full precision, `result` shows rounded values.

**Decided in:** `benefit-calculation.yaml`, RULE-ROUNDING; `calculation-trace-format.md`

---

## XS-37: Partial-Year Service Calculation Method

**Question:** months/12 or exact days/365.25?

**Resolution: months/12.**

RULE-SVC-EARNED in `service-credit.yaml` uses `completedMonths / 12`:
- Martinez: 345 months / 12 = 28.75 years
- Kim: 218 months / 12 = 18.17 years (earned)
- Washington: 163 months / 12 = 13.58 years

Assumption `Q-CALC-02` remains OPEN — exact day method could shift service by ~0.05 years. This is documented in the assumption but accepted for POC because all four demo cases use the months/12 convention in their test fixtures.

**Decided in:** `service-credit.yaml`, RULE-SVC-EARNED; both hand calculation documents

---

## XS-41: Statutory Reduction Table Format

**Question:** Confirm lookup table format in YAML.

**Resolution: Confirmed — `lookup_table.entries` keyed by integer age string.**

Both reduction rules use the same pattern:

```yaml
lookup_table:
  source: "RMC §18-409(b)"
  entries:
    "55": "0.70"
    "56": "0.73"
    ...
    "65": "1.00"
```

RULE-EARLY-REDUCE-T12: ages 55-65, 3% increments (Tiers 1 & 2)
RULE-EARLY-REDUCE-T3: ages 60-65, 6% increments (Tier 3)

Death benefit tables use the same pattern in `supplemental.yaml`:
- RULE-DEATH-EARLY-T12: $250 increments
- RULE-DEATH-EARLY-T3: $500 increments

Per CRITICAL-001 resolution, the tier-specific rates (3% vs 6%) are confirmed.

**Decided in:** `eligibility.yaml`, RULE-EARLY-REDUCE-T12/T3; `supplemental.yaml`, RULE-DEATH-EARLY-T12/T3
