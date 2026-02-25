# Case 5: Maria Santos — Tier 3, Non-Vested Termination, Contribution Refund

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | Maria Santos | Demo case specification |
| Member ID | M-100005 | Assigned |
| Date of Birth | August 10, 1990 | Demo case specification |
| Hire Date | April 1, 2022 | Demo case specification |
| Last Day Worked | January 31, 2026 | Demo case specification |
| Termination Type | Voluntary resignation | Demo case specification |
| Tier | 3 (hired on/after July 1, 2011) | RMC §18-409(a)(3), RULE-TIER-3 |
| Department | Parks & Recreation | Demo case specification |
| Position | Program Coordinator | Demo case specification |
| Marital Status | Single | Demo case specification |

---

## What This Case Demonstrates

1. **Non-vested termination processing** — member has less than 5 years of service
2. **90-day separation waiting period** enforcement
3. **Contribution accumulation with interest** — compound interest at board-set rate, compounded annually on June 30
4. **Mandatory 20% tax withholding** for eligible rollover distributions
5. **Direct payment vs. rollover election** processing
6. **Member record closure** workflow
7. **Proximity to vesting** — member is 1 year 2 months short of vesting, demonstrating the system's ability to surface "what if you stayed" information

---

## Refund Timeline

| Event | Date | Rule | Result |
|-------|------|------|--------|
| Last day worked | January 31, 2026 | — | Voluntary resignation |
| Employer termination report received | February 7, 2026 | — | Confirms final day and final contribution |
| Final contribution posted | February 14, 2026 | — | January 2026 payroll processed |
| 90-day waiting period begins | January 31, 2026 | RMC §18-408(e)(1) | Day 0 |
| 90-day waiting period ends | May 1, 2026 | RMC §18-408(e)(1) | 90 days from separation |
| Refund application received | May 5, 2026 | — | After waiting period ✓ |
| Refund calculation completed | May 8, 2026 | — | Staff processes application |
| Member notification sent | May 9, 2026 | — | Amount, options, tax implications |
| Member election received | May 20, 2026 | — | Elects direct payment |
| Refund issued | June 2, 2026 | RMC §18-408(e)(1) | Within 90 days of properly completed application ✓ |

---

## Step 1: Tier Determination

**Rule:** RULE-TIER-3 — RMC §18-409(a)(3)

- Hire date: April 1, 2022
- Is hire date on/after July 1, 2011? **YES**
- **Result: Tier 3 ✓**

---

## Step 2: Service Credit at Termination

**Rule:** RULE-SVC-EARNED — RMC §18-402, §18-409(a)

- Employment period: April 1, 2022 through January 31, 2026
- Complete months: April 2022 → January 2026
  - April 2022 to April 2025 = 3 years = 36 months
  - April 2025 to January 2026 = 10 months (Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan)
  - Total: 46 months
- Service credit: 46 / 12 = **3.8333 years (3 years, 10 months)**

---

## Step 3: Vesting Determination

**Rule:** RULE-VESTING — RMC §18-402(31)

- Required: 5 years of credited service (post-January 1, 1987 hire)
- Maria's service: 3.8333 years
- 3.8333 < 5.0 → **NOT VESTED**
- **Result: Non-vested. Eligible for contribution refund only. No right to deferred benefit.**

### Proximity to Vesting (System Intelligence)

- Service shortfall: 5.0 − 3.8333 = 1.1667 years = 1 year, 2 months
- If Maria had worked until April 1, 2027, she would have reached 5 years and vested
- At that point, she could elect a deferred benefit at age 60 (Tier 3)
- This information surfaces in the workspace for staff awareness but does not affect the refund calculation

---

## Step 4: Salary History

Maria's annual salary progression (4% annual increases):

| Period | Annual Salary | Monthly Salary | Source |
|--------|--------------|----------------|--------|
| April 2022 – December 2022 | $52,000.00 | $4,333.33 | Seed data |
| January 2023 – December 2023 | $54,080.00 | $4,506.67 | 4% increase |
| January 2024 – December 2024 | $56,243.20 | $4,686.93 | 4% increase |
| January 2025 – December 2025 | $58,492.93 | $4,874.41 | 4% increase |
| January 2026 (final month) | $60,832.65 | $5,069.39 | 4% increase |

**Note:** Monthly salary rounded to cents per paycheck. This is the pensionable compensation per RMC §18-402(15). Maria was hired after January 1, 2010, so leave payouts would NOT be included in pensionable compensation — but this is moot since she is not retiring.

---

## Step 5: Contribution Accumulation

**Rule:** RULE-CONTRIB-EE — RMC §18-407(f)(1)

Employee contribution rate: **8.45%** of pensionable compensation (pre-tax per IRC §414(h))

### Monthly Contributions by Period

| Period | Monthly Salary | Monthly Contribution (8.45%) | Months | Period Total |
|--------|---------------|------------------------------|--------|-------------|
| Apr–Dec 2022 | $4,333.33 | $366.17 | 9 | $3,295.53 |
| Jan–Dec 2023 | $4,506.67 | $380.81 | 12 | $4,569.72 |
| Jan–Dec 2024 | $4,686.93 | $396.14 | 12 | $4,753.68 |
| Jan–Dec 2025 | $4,874.41 | $411.89 | 12 | $4,942.68 |
| Jan 2026 | $5,069.39 | $428.36 | 1 | $428.36 |
| **TOTAL** | | | **46** | **$17,989.97** |

### Contribution Detail

**2022:**
- $4,333.33 × 0.0845 = $366.1666... → rounded per paycheck: $366.17
- 9 months × $366.17 = $3,295.53

**2023:**
- $4,506.67 × 0.0845 = $380.8136... → $380.81
- 12 months × $380.81 = $4,569.72

**2024:**
- $4,686.93 × 0.0845 = $396.0456... → $396.05
- 12 months × $396.05 = $4,752.60

**⚠️ CORRECTION:** Recalculating with precise rounding:
- $56,243.20 / 12 = $4,686.9333... → $4,686.93
- $4,686.93 × 0.0845 = $396.045585 → $396.05
- 12 × $396.05 = $4,752.60

**2025:**
- $58,492.93 / 12 = $4,874.4108... → $4,874.41
- $4,874.41 × 0.0845 = $411.887645 → $411.89
- 12 × $411.89 = $4,942.68

**2026 (January only):**
- $60,832.65 / 12 = $5,069.3875 → $5,069.39
- $5,069.39 × 0.0845 = $428.363455 → $428.36
- 1 × $428.36 = $428.36

### Corrected Totals

| Year | Contributions |
|------|--------------|
| 2022 | $3,295.53 |
| 2023 | $4,569.72 |
| 2024 | $4,752.60 |
| 2025 | $4,942.68 |
| 2026 | $428.36 |
| **Total** | **$17,988.89** |

---

## Step 6: Interest Calculation

**Rule:** RMC §18-407(f)(2) — Accumulated contributions plus interest

**Interest rate:** 2% per annum (board-set rate within 1–3% range)
**Compounding:** Annually as of June 30 of each year
**⚠️ ASSUMPTION:** Interest rate of 2% assumed. Actual rate set by DERP Board annually. [Q-INTEREST-RATE]

### Year-by-Year Interest Compounding

Interest is calculated on the accumulated balance as of each June 30.

**June 30, 2022:**
- Contributions received (Apr–Jun 2022): 3 × $366.17 = $1,098.51
- Interest: $1,098.51 × 0.02 = $21.97
- Balance after interest: **$1,120.48**

**July 2022 – June 2023 new contributions:**
- Jul–Dec 2022: 6 × $366.17 = $2,197.02
- Jan–Jun 2023: 6 × $380.81 = $2,284.86
- New contributions: $4,481.88

**June 30, 2023:**
- Balance before interest: $1,120.48 + $4,481.88 = $5,602.36
- Interest: $5,602.36 × 0.02 = $112.05
- Balance after interest: **$5,714.41**

**July 2023 – June 2024 new contributions:**
- Jul–Dec 2023: 6 × $380.81 = $2,284.86
- Jan–Jun 2024: 6 × $396.05 = $2,376.30
- New contributions: $4,661.16

**June 30, 2024:**
- Balance before interest: $5,714.41 + $4,661.16 = $10,375.57
- Interest: $10,375.57 × 0.02 = $207.51
- Balance after interest: **$10,583.08**

**July 2024 – June 2025 new contributions:**
- Jul–Dec 2024: 6 × $396.05 = $2,376.30
- Jan–Jun 2025: 6 × $411.89 = $2,471.34
- New contributions: $4,847.64

**June 30, 2025:**
- Balance before interest: $10,583.08 + $4,847.64 = $15,430.72
- Interest: $15,430.72 × 0.02 = $308.61
- Balance after interest: **$15,739.33**

**July 2025 – January 2026 new contributions (final):**
- Jul–Dec 2025: 6 × $411.89 = $2,471.34
- Jan 2026: 1 × $428.36 = $428.36
- New contributions: $2,899.70

**No further compounding dates before refund.**

### Final Accumulated Balance

| Component | Amount |
|-----------|--------|
| Balance after June 30, 2025 interest | $15,739.33 |
| + Jul–Dec 2025 contributions | $2,471.34 |
| + Jan 2026 contribution | $428.36 |
| **Total accumulated contributions** | **$18,639.03** |

### Interest Summary

| Date | Balance Before | Interest (2%) | Balance After |
|------|---------------|---------------|---------------|
| June 30, 2022 | $1,098.51 | $21.97 | $1,120.48 |
| June 30, 2023 | $5,602.36 | $112.05 | $5,714.41 |
| June 30, 2024 | $10,375.57 | $207.51 | $10,583.08 |
| June 30, 2025 | $15,430.72 | $308.61 | $15,739.33 |
| **Total interest** | | **$650.14** | |

### Verification

- Total contributions deposited: $17,988.89
- Total interest credited: $650.14
- Accumulated contributions: $17,988.89 + $650.14 = **$18,639.03** ✓

---

## Step 7: Refund Calculation

**Rule:** RMC §18-408(e)(1) — Non-vested termination refund

### Gross Refund Amount

| Component | Amount |
|-----------|--------|
| Employee contributions | $17,988.89 |
| Accumulated interest | $650.14 |
| **Gross refund** | **$18,639.03** |

### Tax Withholding

**Rule:** IRC §402(c), §3405(c) — Mandatory withholding for eligible rollover distributions

- Gross refund is an eligible rollover distribution
- Mandatory 20% federal income tax withholding applies to direct payments
- No withholding if member elects direct rollover to IRA or qualified plan

#### Option A: Direct Payment to Member

| Item | Amount |
|------|--------|
| Gross refund | $18,639.03 |
| Federal withholding (20%) | −$3,727.81 |
| **Net payment to member** | **$14,911.22** |

**Note:** Colorado state tax withholding is optional; member may elect additional state withholding. For this demo case, we show federal mandatory only.

#### Option B: Direct Rollover to IRA/Qualified Plan

| Item | Amount |
|------|--------|
| Gross refund | $18,639.03 |
| Federal withholding | $0.00 |
| **Amount rolled over** | **$18,639.03** |

#### Option C: Partial Rollover

Member may elect to roll over a portion and receive the remainder as direct payment. 20% withholding applies only to the non-rolled-over portion.

---

## Step 8: Eligibility Verification Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Terminated covered employment | ✓ | Employer termination report Feb 7, 2026 |
| 90-day separation waiting period | ✓ | Jan 31 + 90 days = May 1; application received May 5 |
| Non-vested status confirmed | ✓ | 3.8333 years < 5 years required |
| Final contribution received | ✓ | January 2026 payroll posted Feb 14, 2026 |
| No pending disability claim | ✓ | None filed |
| No pending survivor claim | ✓ | N/A |
| Properly completed refund form | ✓ | Received May 5, 2026 |

---

## Step 9: Re-employment Considerations

**Rule:** RMC §18-406(b) — Breaks in service

If Maria returns to City employment within 24 months of separation:
- She may restore her prior service credit by repaying the refunded contributions plus 3% annual interest
- The 3% interest is compounded annually as of June 30
- If she does not take the refund (leaves money in trust), her prior service automatically restores upon re-employment
- If she takes the refund and later repays, she must repay the **full refunded amount** plus 3% interest, not just the employee contribution portion

**24-month window:** January 31, 2026 → January 31, 2028

This information is presented to the member at the refund decision point.

---

## Step 10: System Intelligence — Proximity Alerts

The workspace should surface the following contextual information for the analyst:

### Vesting Proximity
- **Current service:** 3 years, 10 months (3.8333 years)
- **Vesting requirement:** 5 years
- **Shortfall:** 1 year, 2 months
- **If member had stayed until:** June 1, 2027 → would have vested
- **This does NOT affect the refund calculation** but is surfaced for staff awareness and is included in the member notification letter

### Leave-in-Trust Option
- Maria may choose to leave her contributions in the trust fund rather than take a refund
- If she does not return to City employment before her normal retirement date, the accumulated contributions as of her normal retirement date will be paid to her at that time
- If she dies before that date, the accumulated contributions are paid to her designated beneficiary

---

## Expected Outputs Summary

| Output | Value |
|--------|-------|
| Tier | 3 |
| Service credit | 3.8333 years (3 years, 10 months) |
| Vested | No |
| Total employee contributions | $17,988.89 |
| Total interest credited | $650.14 |
| Gross refund amount | $18,639.03 |
| 20% mandatory withholding (direct payment) | $3,727.81 |
| Net direct payment | $14,911.22 |
| Rollover amount (if elected) | $18,639.03 |
| 90-day waiting period end | May 1, 2026 |
| Refund eligibility confirmed | Yes |
| Service shortfall to vesting | 1 year, 2 months |

---

## Assumptions Register

| Assumption | Impact | Risk | Reference |
|------------|--------|------|-----------|
| Interest rate of 2% per annum | Directly affects refund amount | HIGH | Q-INTEREST-RATE — must confirm with DERP |
| Interest compounds on June 30 only | Affects timing of interest credits | LOW | Confirmed by RMC §18-407(f)(2) |
| Monthly salary rounded to nearest cent per paycheck | Penny-level contribution differences | LOW | Standard payroll practice |
| Monthly contribution rounded to nearest cent per paycheck | Cumulative effect over career | LOW | Standard payroll practice |
| 20% mandatory withholding per IRC §3405(c) | Federal tax requirement | LOW | Federal law, not DERP-specific |
| No Colorado state mandatory withholding on refunds | Affects net payment | MEDIUM | Verify with DERP |
| 24-month re-employment window for service restoration | Affects member notification | LOW | Confirmed by RMC §18-406(b) |

---

## Governing Document References

| Step | Rule | RMC Section |
|------|------|-------------|
| Tier determination | RULE-TIER-3 | §18-409(a)(3) |
| Vesting | RULE-VESTING | §18-402(31) |
| Employee contributions | RULE-CONTRIB-EE | §18-407(f)(1) |
| Interest on contributions | — | §18-407(f)(2) |
| Non-vested refund | — | §18-408(e)(1) |
| Refund processing timeline | — | §18-408(e)(1) — within 90 days of properly completed form |
| Breaks in service / restoration | — | §18-406(b) |
| Non-vested member options | — | §18-408(e)(3) |
| Forfeited benefits | — | §18-408(f) |

---

*Case 5 validates the contribution refund pipeline: termination processing, vesting determination, contribution accumulation with compound interest, tax withholding options, and member notification with contextual intelligence about vesting proximity.*
