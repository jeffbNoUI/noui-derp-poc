# Case 11: Lisa Chen — Tier 2, Service Purchase (Governmental)

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | Lisa Chen | Demo case specification |
| Member ID | M-100011 | Assigned |
| Date of Birth | June 22, 1978 | Demo case specification |
| Hire Date | February 1, 2014 | Demo case specification |
| Tier | 2 (hired Sept 1, 2004 – June 30, 2011: **NO** — hired 2014 → Tier 3) | RMC §18-393 |

**CORRECTION:** Lisa Chen was hired February 1, 2014. Per RMC §18-393, members hired on or after July 1, 2011 are Tier 3. The expanded build plan specifies T2 age 48 with 12 years — but a 2014 hire date puts her in Tier 3.

**Reconciliation:** To maintain the expanded build plan's intent (T2, age 48, 12 years), we adjust the hire date to October 1, 2005 — which places Chen in Tier 2 (hired Sept 1, 2004 – June 30, 2011).

| Field | Value | Source |
|-------|-------|--------|
| Name | Lisa Chen | Demo case specification |
| Member ID | M-100011 | Assigned |
| Date of Birth | June 22, 1978 | Demo case specification |
| Hire Date | October 1, 2005 | Adjusted to satisfy Tier 2 |
| Current Status | Active | — |
| Tier | 2 (hired between Sept 1, 2004 and June 30, 2011) | RMC §18-393 |
| Department | Finance | Demo case specification |
| Position | Senior Financial Analyst | Demo case specification |
| Current Annual Salary | $78,000 | Demo case specification |
| Current Monthly Salary | $6,500 | $78,000 / 12 |

## Prior Governmental Employment

| Field | Value |
|-------|-------|
| Prior Employer | State of Colorado, Dept. of Revenue |
| Period | August 15, 2002 – September 25, 2005 |
| Duration | 3 years, 1 month (3.08 years) |
| Years Requesting to Purchase | 3.0 |
| Qualifying Documentation | Employer certification letter, dates of service |

---

## Purchase Quote Date

| Field | Value |
|-------|-------|
| Quote request date | February 15, 2026 |
| Member age at quote | 47 (birthday June 22, 1978 → turns 48 in June 2026) |

**Note:** Age for cost factor purposes = 47 at quote date. For the expanded build plan's "age 48" specification, we use age 48 which applies at Chen's birthday (June 2026). For consistency with the build plan, we'll use age 48 for the cost factor lookup.

---

## Step 1: Purchase Eligibility (RULE-PURCHASE-ELIGIBILITY)

| Condition | Value | Result |
|-----------|-------|--------|
| Member status | Active | ✓ |
| Vested (5+ years) | Yes (20.33 years earned as of Feb 2026) | ✓ |
| Purchase type | Governmental | ✓ Valid type |
| Years requested | 3.0 | ✓ ≤ 5.0 max |
| Documentation | Employer certification required | Pending |
| **Eligible** | **YES** | |

---

## Step 2: Service Credit Summary

### 2.1 Earned Service

**Employment Period:** October 1, 2005 through current (active member)

For purchase analysis, projected to current date (February 2026):
- October 2005 to February 2026 = 244 months
- 244 / 12 = **20.33 years earned**

### 2.2 Total Service for Benefit (with Purchase)

| Type | Years | For Benefit | For Eligibility (Rule of 75) | For IPR |
|------|-------|-------------|------------------------------|---------|
| Earned | 20.33 | ✓ | ✓ | ✓ |
| Purchased (governmental) | 3.00 | ✓ | **✗ EXCLUDED** | **✗ EXCLUDED** |
| **Total** | **23.33** | **23.33** | **20.33** | **20.33** |

**CRITICAL:** Purchased service is EXCLUDED from Rule of 75 eligibility per RMC §18-415(a).

---

## Step 3: Actuarial Cost Calculation (RULE-PURCHASE-COST-FACTOR)

### 3.1 Cost Factor Lookup

| Parameter | Value | Source |
|-----------|-------|--------|
| Tier | 2 | Member record |
| Age at purchase | 48 | Per build plan specification |
| Cost factor (T2, age 48) | 0.0860 | Actuarial cost factor table |

### 3.2 Total Cost Calculation

```
Total Cost = Cost Factor × Current Annual Salary × Years Purchased
           = 0.0860 × $78,000.00 × 3.0
           = $6,708.00 × 3.0
           = $20,124.00
```

| Component | Value |
|-----------|-------|
| Cost factor | 0.0860 |
| Current annual salary | $78,000.00 |
| Years purchased | 3.0 |
| Cost per year | $6,708.00 |
| **Total cost** | **$20,124.00** |

---

## Step 4: Payment Options (RULE-PURCHASE-PAYMENT-OPTIONS)

### Option A: Lump Sum

| Field | Value |
|-------|-------|
| Amount due | $20,124.00 |
| Interest | $0.00 |
| Total cost | $20,124.00 |

### Option B: Payroll Deduction (60 months, 3% annual interest)

**Amortization calculation:**
```
Monthly rate r = 0.03 / 12 = 0.0025
Number of payments n = 60
Principal P = $20,124.00

Monthly payment = P × r(1+r)^n / ((1+r)^n - 1)
                = $20,124.00 × 0.0025 × (1.0025)^60 / ((1.0025)^60 - 1)
                = $20,124.00 × 0.0025 × 1.16161678 / (1.16161678 - 1)
                = $20,124.00 × 0.00290404 / 0.16161678
                = $20,124.00 × 0.01796853
                = $361.56
```

| Field | Value |
|-------|-------|
| Monthly payment | $361.56 |
| Number of payments | 60 |
| Total paid | $21,693.60 |
| Interest cost | $1,569.60 |
| Pre-tax deduction | Yes (reduces taxable income) |

### Option C: Rollover from Qualified Plan

| Field | Value |
|-------|-------|
| Rollover amount | $20,124.00 |
| Tax impact | None (direct trustee-to-trustee transfer) |
| Interest | $0.00 |

---

## Step 5: Benefit Impact Analysis (RULE-PURCHASE-BENEFIT-IMPACT)

### 5.1 Projected Benefit WITHOUT Purchase

Assuming retirement at normal age (65) with current salary trajectory:
```
AMS (Tier 2, highest 36 months) ≈ $6,500.00/mo (current — will grow)
Earned years at retirement ≈ 39.58 (Oct 2005 to ~June 2045)
```

**For immediate analysis at current values:**
```
Current benefit projection (earned only):
  = Multiplier × AMS × Earned Years
  = 1.5% × $6,500.00 × 20.33
  = $97.50 × 20.33
  = $1,982.18/mo
```

### 5.2 Projected Benefit WITH Purchase

```
With purchased service:
  = Multiplier × AMS × (Earned + Purchased)
  = 1.5% × $6,500.00 × (20.33 + 3.00)
  = 1.5% × $6,500.00 × 23.33
  = $97.50 × 23.33
  = $2,274.68/mo
```

### 5.3 Benefit Increase

```
Monthly increase = $2,274.68 - $1,982.18 = $292.50
Annual increase  = $292.50 × 12 = $3,510.00
```

### 5.4 Breakeven Analysis (Lump Sum)

```
Breakeven = Total Cost / Monthly Increase
          = $20,124.00 / $292.50
          = 68.8 months
          ≈ 69 months (5 years, 9 months)
```

| Metric | Value |
|--------|-------|
| Monthly increase | $292.50 |
| Annual increase | $3,510.00 |
| Breakeven (lump sum) | 69 months (5.8 years) |
| Breakeven (payroll deduction) | 75 months (6.3 years) |
| Lifetime value (20 years retirement) | $70,200.00 |
| ROI (lump sum, 20 years) | 249% |

### 5.5 Eligibility Impact

```
Rule of 75 check (WITHOUT purchase):
  Age (projected at 65) + Earned service (39.58) = 104.58 → MET
  Age (current 48) + Earned service (20.33) = 68.33 → NOT MET

Rule of 75 check (WITH purchase):
  Age (current 48) + Earned service (20.33) = 68.33 → STILL NOT MET
  (Purchased 3.0 years are EXCLUDED from Rule of 75 per RMC §18-415(a))
```

**The purchase does NOT change Chen's eligibility status.** It only increases the benefit amount when she eventually retires.

---

## Step 6: Quote Validity (RULE-PURCHASE-QUOTE-VALIDITY)

| Field | Value |
|-------|-------|
| Quote issue date | February 15, 2026 |
| Quote expiration | May 16, 2026 (90 calendar days) |
| Status | Valid |

---

## Final Summary

| Item | Value | Source Rule |
|------|-------|------------|
| Purchase type | Governmental | RULE-PURCHASE-TYPE-GOVERNMENTAL |
| Years purchased | 3.0 | Member election |
| Cost factor (T2, age 48) | 0.0860 | RULE-PURCHASE-COST-FACTOR |
| **Total cost** | **$20,124.00** | RULE-PURCHASE-COST-FACTOR |
| Lump sum option | $20,124.00 | RULE-PURCHASE-PAYMENT-OPTIONS |
| Payroll deduction (60mo) | $361.56/mo ($21,693.60 total) | RULE-PURCHASE-PAYMENT-OPTIONS |
| Rollover option | $20,124.00 | RULE-PURCHASE-PAYMENT-OPTIONS |
| Benefit increase | $292.50/mo | RULE-PURCHASE-BENEFIT-IMPACT |
| Breakeven | 69 months (5.8 years) | RULE-PURCHASE-BENEFIT-IMPACT |
| Eligibility impact | **NONE** | RMC §18-415(a) |
| IPR impact | **NONE** | RMC §18-415(a) |
| Irrevocable | Yes (once fully paid) | RULE-PURCHASE-IRREVOCABLE |

---

## Verification Notes

- Cost: 0.0860 × $78,000 × 3 = $20,124.00 ✓
- Benefit without: 1.5% × $6,500 × 20.33 = $1,982.18 ✓
- Benefit with: 1.5% × $6,500 × 23.33 = $2,274.68 ✓
- Increase: $2,274.68 - $1,982.18 = $292.50 ✓
- Breakeven: $20,124.00 / $292.50 = 68.8 → 69 months ✓
- Payroll deduction: amortize($20,124, 3%/12, 60) = $361.56/mo ✓
- Rule of 75 exclusion: Age 48 + 20.33 earned = 68.33 (purchased excluded) ✓
