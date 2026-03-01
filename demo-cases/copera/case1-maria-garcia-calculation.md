# Case 1: Maria Garcia — State Division, HAS Table PERA 1

## Member Profile

| Field | Value |
|-------|-------|
| Name | Maria Garcia |
| Member ID | COPERA-001 |
| Date of Birth | 1963-07-20 |
| Hire Date | 1998-01-01 |
| Division | State |
| HAS Table | PERA 1 (pre-2007 membership, pre-2011 eligible) |
| Retirement Date | 2026-01-01 |
| Marital Status | Married |

## What This Case Demonstrates

- **Full unreduced benefit** — Rule of 80 satisfied, no reduction applied
- **3-year HAS window** with anti-spiking check (108% cascading, no trigger)
- **2.5% multiplier** — universal across all COPERA divisions
- **Annual increase** — 1.5% compound for pre-2011 eligible members
- **PERA benefit options** — Options 1/2/3 (distinct from DPS Options A/B/P2/P3)
- **State Division** contribution rates (EE: 10.5%, ER: 21.4%)

---

## Step 1: Age at Retirement

**Source:** Standard actuarial practice

```
DOB:             1963-07-20
Retirement Date: 2026-01-01
Birthday in retirement year: July 20, 2026 (not yet reached on Jan 1)
Age = 2026 - 1963 - 1 = 62 completed years
```

**Result: Age = 62**

---

## Step 2: HAS Table Determination

**Source:** C.R.S. §24-51-602, CMPTIER0 table

```
Membership date:            1998-01-01
SB 10-001 effective date:   2011-01-01
SB 18-200 effective date:   2020-01-01

Membership before 2007-01-01? YES → PERA 1 eligible
  (PERA 1 = pre-2007 PERA membership, most favorable rules)
```

**HAS Table: PERA 1**

| PERA 1 Parameters | Value | Source |
|---|---|---|
| Normal retirement age | 60 | §24-51-602(1)(a) |
| Rule of N threshold | 80 | §24-51-602(1)(a) |
| Minimum age for Rule of 80 | 55 | §24-51-602(1)(a) |
| Minimum early retirement age | 55 | §24-51-602(1)(a) |
| HAS window | 36 months (3 years) | §24-51-101(25.5) |
| Early retirement reduction | 3% per year under 65 | §24-51-605(2) |
| Annual increase | 1.5% compound | §24-51-1002 |

---

## Step 3: Service Credit

**Source:** C.R.S. §24-51-101(42), §24-51-501

```
Hire date:       1998-01-01
Retirement date: 2026-01-01
Months of service: 336 months (28 years × 12)
```

| Category | Years | Notes |
|---|---|---|
| Earned service | 28.00 | Full months from hire to retirement |
| Purchased service | 0.00 | None |
| Military service | 0.00 | None |
| **Total for benefit** | **28.00** | Earned + purchased |
| **Total for eligibility** | **28.00** | Earned only (purchased excluded from Rule of 80) |

---

## Step 4: Vesting Check

**Source:** C.R.S. §24-51-401(1.7)

```
Vesting requirement: 5 years
Earned service:      28.00 years
28.00 >= 5.00 → VESTED ✓
```

---

## Step 5: Eligibility Evaluation

**Source:** C.R.S. §24-51-602(1)(a)

### Normal Retirement (PERA 1: age 60+, vested)
```
Age:     62 >= 60  ✓
Vested:  YES       ✓
→ ELIGIBLE for normal retirement (no reduction)
```

### Rule of 80 (PERA 1: age + earned service >= 80, min age 55)
```
Age + Earned Service: 62 + 28.00 = 90.00
90.00 >= 80  ✓
Age: 62 >= 55  ✓
→ ELIGIBLE for Rule of 80 (no reduction)
```

### Early Retirement (evaluated for transparency)
```
Age: 62 >= 55  ✓
Vested: YES    ✓
→ Would qualify, but not needed (normal retirement applies)
```

**Result: Normal Retirement — Reduction Factor = 1.00 (no reduction)**

---

## Step 6: Salary History and HAS Calculation

**Source:** C.R.S. §24-51-101(25.5)

### Salary History (3-year HAS window)

| Year | Annual Salary | Role |
|---|---|---|
| 2022 | $85,000.00 | Base year (prior to HAS window) |
| 2023 | $88,500.00 | HAS window year 1 |
| 2024 | $92,000.00 | HAS window year 2 |
| 2025 | $95,000.00 | HAS window year 3 |

### Anti-Spiking Check (108% Cascading Cap)

**Source:** C.R.S. §24-51-101(25.5) — base year method

```
Base year salary (2022): $85,000.00

Year 2023:
  108% cap = $85,000.00 × 1.08 = $91,800.00
  Actual salary: $88,500.00
  $88,500.00 ≤ $91,800.00 → NO ADJUSTMENT
  Used salary: $88,500.00

Year 2024:
  108% cap = $88,500.00 × 1.08 = $95,580.00
  Actual salary: $92,000.00
  $92,000.00 ≤ $95,580.00 → NO ADJUSTMENT
  Used salary: $92,000.00

Year 2025:
  108% cap = $92,000.00 × 1.08 = $99,360.00
  Actual salary: $95,000.00
  $95,000.00 ≤ $99,360.00 → NO ADJUSTMENT
  Used salary: $95,000.00
```

**Anti-spiking triggered: NO**

### HAS Calculation

```
HAS Window: 36 months (3 years)
Sum of salaries: $88,500.00 + $92,000.00 + $95,000.00 = $275,500.00
Annual HAS: $275,500.00 / 3 = $91,833.33
Monthly HAS: $91,833.33 / 12 = $7,652.78
```

**Result: Monthly HAS = $7,652.78**

---

## Step 7: Benefit Calculation

**Source:** C.R.S. §24-51-603

### Formula
```
Monthly Benefit = (Annual HAS × Multiplier × Service Years) / 12
```

### Calculation
```
Annual HAS:      $91,833.33
Multiplier:      2.5% (0.025) — all COPERA divisions
Service Years:   28.00 (total for benefit)
Reduction Factor: 1.00 (normal/Rule of 80 retirement)

Annual Unreduced = $91,833.33 × 0.025 × 28.00
                 = $91,833.33 × 0.70
                 = $64,283.33

Monthly Unreduced = $64,283.33 / 12
                  = $5,356.9444...

Rounded: $5,356.94

Reduction: None (factor = 1.00)
Maximum Monthly Benefit = $5,356.94
```

**Result: Maximum Monthly Benefit = $5,356.94**

---

## Step 8: Payment Options

**Source:** C.R.S. §24-51-801 through §24-51-803

PERA divisions use Options 1/2/3 (not DPS A/B/P2/P3).

**ASSUMPTION:** [Q-CALC-04] J&S factors are placeholders pending actuarial tables.

| Option | Factor | Monthly Benefit | Survivor Benefit | Description |
|---|---|---|---|---|
| Option 1 (Maximum) | 1.0000 | **$5,356.94** | $0.00 | Single life annuity, no survivor benefit |
| Option 2 (J&S 50%) | 0.9450 | **$5,062.31** | $2,531.16 | Joint & survivor, 50% continues to co-benefit recipient |
| Option 3 (J&S 100%) | 0.8850 | **$4,740.89** | $4,740.89 | Joint & survivor, 100% continues to co-benefit recipient |

### Calculation Detail
```
Option 2: $5,356.94 × 0.9450 = $5,062.3083 → $5,062.31
  Survivor: $5,062.31 × 0.50 = $2,531.155 → $2,531.16

Option 3: $5,356.94 × 0.8850 = $4,740.8919 → $4,740.89
  Survivor: $4,740.89 × 1.00 = $4,740.89
```

---

## Step 9: Annual Increase Projection

**Source:** C.R.S. §24-51-1002 (as amended by SB 18-200)

Pre-2011 eligible members receive 1.5% compound annual increase.
First eligible: March 1 of the second calendar year after retirement.

```
Retirement date: 2026-01-01
First annual increase: 2028-03-01

Year 1 (2028-03-01): $5,356.94 × 1.015 = $5,437.30
Year 2 (2029-03-01): $5,437.30 × 1.015 = $5,518.86
Year 3 (2030-03-01): $5,518.86 × 1.015 = $5,601.64
Year 5 (2032-03-01): $5,356.94 × 1.015^5 = $5,356.94 × 1.07728 = $5,770.80
Year 10 (2037-03-01): $5,356.94 × 1.015^10 = $5,356.94 × 1.16054 = $6,216.55
```

---

## Step 10: Contribution History Summary

**Source:** C.R.S. §24-51-401

| Rate | Percentage | Source |
|---|---|---|
| Employee contribution | 10.50% | §24-51-401(1.5)(a)(I) |
| Employer contribution | 21.40% | §24-51-408(1)(a) |

```
Estimated employee contributions over 28 years:
  Average salary ~$75,000 × 10.50% × 28 years ≈ $220,500
  (Actual calculated from detailed salary history)
```

---

## Expected Test Results

```json
{
  "memberId": "COPERA-001",
  "division": "State",
  "hasTable": 1,
  "ageAtRetirement": 62,
  "serviceYears": 28.00,
  "vested": true,
  "retirementType": "normal",
  "ruleOf80Qualifies": true,
  "ruleOf80Sum": 90.00,
  "reductionFactor": 1.00,
  "antiSpikingTriggered": false,
  "annualHAS": 91833.33,
  "monthlyHAS": 7652.78,
  "unreducedMonthlyBenefit": 5356.94,
  "maximumMonthlyBenefit": 5356.94,
  "option2MonthlyBenefit": 5062.31,
  "option3MonthlyBenefit": 4740.89,
  "annualIncreaseRate": 0.015,
  "firstAnnualIncreaseDate": "2028-03-01"
}
```
