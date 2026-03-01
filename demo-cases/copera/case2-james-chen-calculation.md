# Case 2: James Chen — School Division, HAS Table PERA 6

## Member Profile

| Field | Value |
|-------|-------|
| Name | James Chen |
| Member ID | COPERA-002 |
| Date of Birth | 1968-11-15 |
| Hire Date | 2008-01-01 |
| Division | School |
| HAS Table | PERA 6 (post-2011 rules, vested before 1/1/2020) |
| Retirement Date | 2026-01-01 |
| Marital Status | Single |

## What This Case Demonstrates

- **Early retirement with reduction** — does not meet Rule of 85 or normal age
- **Anti-spiking triggered** — salary capped at 108% of prior year
- **Different HAS table rules** — PERA 6 vs PERA 1 (different Rule of N, different reduction)
- **3-year HAS window** (vested before 1/1/2020, so uses pre-2020 window)
- **1.0% annual increase** — post-2011 rate (vs 1.5% for pre-2011)
- **School Division** contribution rates

---

## Step 1: Age at Retirement

```
DOB:             1968-11-15
Retirement Date: 2026-01-01
Birthday in retirement year: November 15, 2026 (not yet reached on Jan 1)
Age = 2026 - 1968 - 1 = 57 completed years
```

**Result: Age = 57**

---

## Step 2: HAS Table Determination

**Source:** C.R.S. §24-51-602, §24-51-604, CMPTIER0 table

```
Membership date:            2008-01-01
SB 10-001 effective date:   2011-01-01
SB 18-200 effective date:   2020-01-01
Vested (5 years):           2013-01-01 (before 2020-01-01)

Membership after 2007, before 2011: SB 10-001 tier
Vested before 2020: Protected from SB 18-200 changes
→ HAS Table: PERA 6
```

| PERA 6 Parameters | Value | Source |
|---|---|---|
| Normal retirement age | 65 | §24-51-602(2) |
| Rule of N threshold | 85 | §24-51-602(2) |
| Minimum age for Rule of 85 | 55 | §24-51-602(2) |
| Minimum early retirement age | 55 | §24-51-602(2) |
| HAS window | 36 months (3 years) | §24-51-101(25.5) — vested before 2020 |
| Early retirement reduction | 4% per year under 65 | §24-51-605(3) |
| Annual increase | 1.0% compound | §24-51-1002(1.5) |

---

## Step 3: Service Credit

```
Hire date:       2008-01-01
Retirement date: 2026-01-01
Months: 216 months (18 years × 12)
```

| Category | Years |
|---|---|
| Earned service | 18.00 |
| Purchased service | 0.00 |
| **Total for benefit** | **18.00** |
| **Total for eligibility** | **18.00** |

---

## Step 4: Vesting Check

```
5.00 years required
18.00 >= 5.00 → VESTED ✓
```

---

## Step 5: Eligibility Evaluation

### Normal Retirement (PERA 6: age 65+, vested)
```
Age: 57 < 65  ✗
→ NOT ELIGIBLE for normal retirement
```

### Rule of 85 (PERA 6: age + earned >= 85, min age 55)
```
Age + Earned Service: 57 + 18.00 = 75.00
75.00 < 85  ✗
→ NOT ELIGIBLE for Rule of 85
```

### Early Retirement (PERA 6: age 55+, vested)
```
Age: 57 >= 55  ✓
Vested: YES    ✓
→ ELIGIBLE for early retirement

Years under 65: 65 - 57 = 8
Reduction: 8 × 4% = 32%
Reduction factor: 1.00 - 0.32 = 0.68
```

**Result: Early Retirement — Reduction Factor = 0.68 (32% reduction)**

---

## Step 6: Salary History and HAS Calculation

### Salary History (3-year HAS window)

| Year | Annual Salary | Role |
|---|---|---|
| 2022 | $64,000.00 | Base year (prior to HAS window) |
| 2023 | $67,000.00 | HAS window year 1 |
| 2024 | $74,000.00 | HAS window year 2 — PROMOTION |
| 2025 | $78,000.00 | HAS window year 3 |

### Anti-Spiking Check (108% Cascading Cap)

**Source:** C.R.S. §24-51-101(25.5) — base year method

```
Base year salary (2022): $64,000.00

Year 2023:
  108% cap = $64,000.00 × 1.08 = $69,120.00
  Actual salary: $67,000.00
  $67,000.00 ≤ $69,120.00 → NO ADJUSTMENT
  Used salary: $67,000.00

Year 2024:
  108% cap = $67,000.00 × 1.08 = $72,360.00
  Actual salary: $74,000.00
  $74,000.00 > $72,360.00 → ⚠️ CAPPED AT $72,360.00
  Used salary: $72,360.00

Year 2025:
  108% cap = $72,360.00 × 1.08 = $78,148.80
  Actual salary: $78,000.00
  $78,000.00 ≤ $78,148.80 → NO ADJUSTMENT
  Used salary: $78,000.00
```

**Anti-spiking triggered: YES (2024 salary capped from $74,000.00 to $72,360.00)**

### HAS Calculation (using anti-spiking adjusted salaries)

```
HAS Window: 36 months (3 years) — vested before 2020
Sum (adjusted): $67,000.00 + $72,360.00 + $78,000.00 = $217,360.00
Annual HAS: $217,360.00 / 3 = $72,453.33
Monthly HAS: $72,453.33 / 12 = $6,037.78

Without anti-spiking:
Sum (actual):   $67,000.00 + $74,000.00 + $78,000.00 = $219,000.00
Annual HAS:     $219,000.00 / 3 = $73,000.00
Monthly HAS:    $73,000.00 / 12 = $6,083.33

Impact of anti-spiking: -$45.55/month on HAS
```

**Result: Monthly HAS = $6,037.78 (after anti-spiking adjustment)**

---

## Step 7: Benefit Calculation

**Source:** C.R.S. §24-51-603

```
Annual HAS:      $72,453.33
Multiplier:      2.5% (0.025)
Service Years:   18.00
Reduction Factor: 0.68 (early retirement, 32% reduction)

Annual Unreduced = $72,453.33 × 0.025 × 18.00
                 = $72,453.33 × 0.45
                 = $32,604.00

Monthly Unreduced = $32,604.00 / 12
                  = $2,717.00

Monthly Reduced = $2,717.00 × 0.68
                = $1,847.56

Maximum Monthly Benefit = $1,847.56
```

**Result: Maximum Monthly Benefit = $1,847.56**

---

## Step 8: Payment Options

**Source:** C.R.S. §24-51-801 through §24-51-803

| Option | Factor | Monthly Benefit | Survivor Benefit |
|---|---|---|---|
| Option 1 (Maximum) | 1.0000 | **$1,847.56** | $0.00 |
| Option 2 (J&S 50%) | 0.9450 | **$1,745.94** | $872.97 |
| Option 3 (J&S 100%) | 0.8850 | **$1,635.09** | $1,635.09 |

### Calculation Detail
```
Option 2: $1,847.56 × 0.9450 = $1,745.9442 → $1,745.94
  Survivor: $1,745.94 × 0.50 = $872.97

Option 3: $1,847.56 × 0.8850 = $1,635.0906 → $1,635.09
  Survivor: $1,635.09
```

---

## Step 9: Annual Increase Projection

**Source:** C.R.S. §24-51-1002(1.5) (post-SB 18-200)

Post-2011 members: 1.0% compound annual increase.

```
Retirement date: 2026-01-01
First annual increase: 2028-03-01

Year 1 (2028): $1,847.56 × 1.010 = $1,866.04
Year 2 (2029): $1,866.04 × 1.010 = $1,884.70
Year 5 (2032): $1,847.56 × 1.010^5 = $1,847.56 × 1.05101 = $1,941.84
Year 10 (2037): $1,847.56 × 1.010^10 = $1,847.56 × 1.10462 = $2,040.93
```

---

## Expected Test Results

```json
{
  "memberId": "COPERA-002",
  "division": "School",
  "hasTable": 6,
  "ageAtRetirement": 57,
  "serviceYears": 18.00,
  "vested": true,
  "retirementType": "early",
  "ruleOf85Qualifies": false,
  "ruleOf85Sum": 75.00,
  "reductionFactor": 0.68,
  "reductionPercent": 32,
  "antiSpikingTriggered": true,
  "antiSpikingDetail": {
    "year2024": { "actual": 74000.00, "capped": 72360.00, "capApplied": true }
  },
  "annualHAS": 72453.33,
  "monthlyHAS": 6037.78,
  "unreducedMonthlyBenefit": 2717.00,
  "maximumMonthlyBenefit": 1847.56,
  "option2MonthlyBenefit": 1745.94,
  "option3MonthlyBenefit": 1635.09,
  "annualIncreaseRate": 0.010,
  "firstAnnualIncreaseDate": "2028-03-01"
}
```
