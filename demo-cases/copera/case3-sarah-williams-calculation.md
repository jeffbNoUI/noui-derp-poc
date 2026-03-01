# Case 3: Sarah Williams — DPS Division, HAS Table DPS 1

## Member Profile

| Field | Value |
|-------|-------|
| Name | Sarah Williams |
| Member ID | COPERA-003 |
| Date of Birth | 1966-02-28 |
| Hire Date | 2000-01-01 |
| Division | DPS (Denver Public Safety) |
| HAS Table | DPS 1 (pre-2005 DPS membership, pre-2011 eligible) |
| Retirement Date | 2026-01-01 |
| Marital Status | Married |

## What This Case Demonstrates

- **DPS-specific rules** — different from PERA divisions, demonstrating cross-division architecture
- **DPS benefit options** — Options A/B/P2/P3 (not PERA's 1/2/3)
- **DPS contribution rates** — different EE/ER rates than State/School/Local Gov
- **Rule of 80 eligible** — unreduced benefit
- **Multi-division architecture** — same rules engine handles both PERA and DPS divisions
- **1.5% annual increase** — pre-2011 eligible DPS member

---

## Step 1: Age at Retirement

```
DOB:             1966-02-28
Retirement Date: 2026-01-01
Birthday in retirement year: February 28, 2026 (not yet reached on Jan 1)
Age = 2026 - 1966 - 1 = 59 completed years
```

**Result: Age = 59**

---

## Step 2: HAS Table Determination

**Source:** C.R.S. §24-51-602, CMPTIER0 table

```
Membership date:            2000-01-01
Division:                   DPS
DPS tier cutoff (pre-2005): 2005-07-01
SB 10-001 effective date:   2011-01-01

DPS membership before 2005-07-01? YES → DPS 1
```

| DPS 1 Parameters | Value | Source |
|---|---|---|
| Normal retirement age | 60 | §24-51-602(1)(a) |
| Rule of N threshold | 80 | §24-51-602(1)(a) |
| Minimum age for Rule of 80 | 55 | §24-51-602(1)(a) |
| Minimum early retirement age | 55 | §24-51-602(1)(a) |
| HAS window | 36 months (3 years) | §24-51-101(25.5) |
| Early retirement reduction | 3% per year under 65 | §24-51-605(2) |
| Annual increase | 1.5% compound | §24-51-1002 |
| Benefit options | A/B/P2/P3 | §24-51-803 (DPS-specific) |

---

## Step 3: Service Credit

```
Hire date:       2000-01-01
Retirement date: 2026-01-01
Months: 312 months (26 years × 12)
```

| Category | Years |
|---|---|
| Earned service | 26.00 |
| Purchased service | 0.00 |
| **Total for benefit** | **26.00** |
| **Total for eligibility** | **26.00** |

---

## Step 4: Vesting Check

```
5.00 years required
26.00 >= 5.00 → VESTED ✓
```

---

## Step 5: Eligibility Evaluation

### Normal Retirement (DPS 1: age 60+, vested)
```
Age: 59 < 60  ✗
→ NOT ELIGIBLE for normal retirement (1 year short)
```

### Rule of 80 (DPS 1: age + earned >= 80, min age 55)
```
Age + Earned Service: 59 + 26.00 = 85.00
85.00 >= 80  ✓
Age: 59 >= 55  ✓
→ ELIGIBLE for Rule of 80 (no reduction)
```

### Early Retirement (evaluated for transparency)
```
Age: 59 >= 55  ✓
Vested: YES    ✓
→ Would qualify, but Rule of 80 applies (no reduction needed)
```

**Result: Rule of 80 — Reduction Factor = 1.00 (no reduction)**

Note: Although Sarah is 1 year below normal retirement age (60), the Rule of 80 provides
an unreduced benefit because her age + service (85) exceeds the threshold (80).

---

## Step 6: Salary History and HAS Calculation

### Salary History (3-year HAS window)

DPS members typically have higher salaries (law enforcement/public safety).

| Year | Annual Salary | Role |
|---|---|---|
| 2022 | $101,000.00 | Base year (prior to HAS window) |
| 2023 | $105,000.00 | HAS window year 1 |
| 2024 | $109,000.00 | HAS window year 2 |
| 2025 | $113,000.00 | HAS window year 3 |

### Anti-Spiking Check (108% Cascading Cap)

**Source:** C.R.S. §24-51-101(25.5) — base year method

```
Base year salary (2022): $101,000.00

Year 2023:
  108% cap = $101,000.00 × 1.08 = $109,080.00
  Actual salary: $105,000.00
  $105,000.00 ≤ $109,080.00 → NO ADJUSTMENT
  Used salary: $105,000.00

Year 2024:
  108% cap = $105,000.00 × 1.08 = $113,400.00
  Actual salary: $109,000.00
  $109,000.00 ≤ $113,400.00 → NO ADJUSTMENT
  Used salary: $109,000.00

Year 2025:
  108% cap = $109,000.00 × 1.08 = $117,720.00
  Actual salary: $113,000.00
  $113,000.00 ≤ $117,720.00 → NO ADJUSTMENT
  Used salary: $113,000.00
```

**Anti-spiking triggered: NO**

### HAS Calculation

```
HAS Window: 36 months (3 years)
Sum: $105,000.00 + $109,000.00 + $113,000.00 = $327,000.00
Annual HAS: $327,000.00 / 3 = $109,000.00
Monthly HAS: $109,000.00 / 12 = $9,083.33
```

**Result: Monthly HAS = $9,083.33**

---

## Step 7: Benefit Calculation

**Source:** C.R.S. §24-51-603

```
Annual HAS:      $109,000.00
Multiplier:      2.5% (0.025) — same for DPS
Service Years:   26.00
Reduction Factor: 1.00 (Rule of 80 retirement)

Annual Unreduced = $109,000.00 × 0.025 × 26.00
                 = $109,000.00 × 0.65
                 = $70,850.00

Monthly Unreduced = $70,850.00 / 12
                  = $5,904.1667

Rounded: $5,904.17

Maximum Monthly Benefit = $5,904.17
```

**Result: Maximum Monthly Benefit = $5,904.17**

---

## Step 8: DPS Benefit Options

**Source:** C.R.S. §24-51-803 (DPS-specific options)

DPS members use Options A/B/P2/P3, which differ from PERA's Options 1/2/3.

| Option | Factor | Monthly Benefit | Survivor Benefit | Description |
|---|---|---|---|---|
| Option A (Maximum) | 1.0000 | **$5,904.17** | $0.00 | Single life annuity |
| Option B (Modified Half) | 0.9450 | **$5,579.44** | $2,789.72 | 50% continues to co-benefit recipient |
| Pop-Up 2 (J&S w/ pop-up) | 0.9150 | **$5,402.32** | $4,051.74 | 75% survivor; returns to full if beneficiary predeceases |
| Pop-Up 3 (100% w/ pop-up) | 0.8850 | **$5,225.19** | $5,225.19 | 100% survivor; returns to full if beneficiary predeceases |

### Calculation Detail
```
Option B: $5,904.17 × 0.9450 = $5,579.4407 → $5,579.44
  Survivor: $5,579.44 × 0.50 = $2,789.72

Pop-Up 2: $5,904.17 × 0.9150 = $5,402.3156 → $5,402.32
  Survivor: $5,402.32 × 0.75 = $4,051.74

Pop-Up 3: $5,904.17 × 0.8850 = $5,225.1905 → $5,225.19
  Survivor: $5,225.19 × 1.00 = $5,225.19
```

### DPS Pop-Up Feature
Pop-Up options (P2, P3) include a special provision: if the co-benefit recipient predeceases
the retiree, the benefit "pops up" to the full Option A amount. This is unique to DPS and
not available to other PERA divisions.

---

## Step 9: Annual Increase Projection

**Source:** C.R.S. §24-51-1002 (pre-2011 eligible)

```
Retirement date: 2026-01-01
First annual increase: 2028-03-01
Rate: 1.5% compound

Year 1 (2028): $5,904.17 × 1.015 = $5,992.73
Year 2 (2029): $5,992.73 × 1.015 = $6,082.62
Year 5 (2032): $5,904.17 × 1.015^5 = $5,904.17 × 1.07728 = $6,360.30
Year 10 (2037): $5,904.17 × 1.015^10 = $5,904.17 × 1.16054 = $6,851.57
```

---

## Step 10: Contribution History Summary

**Source:** C.R.S. §24-51-401 (DPS rates)

| Rate | Percentage | Source |
|---|---|---|
| Employee contribution (DPS) | 12.00% | §24-51-401(1.5)(c) |
| Employer contribution (DPS) | 19.50% | §24-51-408(1)(c) |

Note: DPS contribution rates differ from State/School/Local Gov (EE: 10.50%, ER: 21.40%).
This demonstrates the multi-division architecture where each division has distinct parameters.

---

## Expected Test Results

```json
{
  "memberId": "COPERA-003",
  "division": "DPS",
  "hasTable": 10,
  "hasTableName": "DPS 1",
  "ageAtRetirement": 59,
  "serviceYears": 26.00,
  "vested": true,
  "retirementType": "rule_of_80",
  "ruleOf80Qualifies": true,
  "ruleOf80Sum": 85.00,
  "reductionFactor": 1.00,
  "antiSpikingTriggered": false,
  "annualHAS": 109000.00,
  "monthlyHAS": 9083.33,
  "unreducedMonthlyBenefit": 5904.17,
  "maximumMonthlyBenefit": 5904.17,
  "optionBMonthlyBenefit": 5579.44,
  "popUp2MonthlyBenefit": 5402.32,
  "popUp3MonthlyBenefit": 5225.19,
  "annualIncreaseRate": 0.015,
  "firstAnnualIncreaseDate": "2028-03-01",
  "contributionRateEE": 0.12,
  "contributionRateER": 0.195
}
```
