# Case 8: Thomas Chen — Vested Contribution Refund with Decision Moment

## Member Profile
- **Name:** Thomas Chen
- **Member ID:** M-100008 (Demo ID: 10008)
- **Tier:** 1 (hired before Sept 1, 2004)
- **Date of Birth:** March 10, 1981 (age 44 at termination)
- **Hire Date:** June 1, 2018
- **Termination Date:** June 30, 2025
- **Service:** 7 years, 1 month = 7.08 years
- **Vested:** Yes (>= 5 years)
- **Status:** Terminated (T)

## Step 1: 90-Day Waiting Period (RULE-REFUND-WAIT)

```
Termination date:         June 30, 2025
+ 90 calendar days:       September 28, 2025
Earliest application:     September 28, 2025
```

## Step 2: Contribution Accumulation (RULE-REFUND-CONTRIB)

**Rate:** 8.45% of pensionable salary

| Period | Months | Monthly Salary | Employee Contrib (8.45%) | Period Total |
|--------|--------|---------------|--------------------------|-------------|
| 2018-06 to 2019-05 (Year 1) | 12 | $5,416.67 | $457.71 | $5,492.52 |
| 2019-06 to 2020-05 (Year 2) | 12 | $5,687.50 | $480.59 | $5,767.13 |
| 2020-06 to 2021-05 (Year 3) | 12 | $5,971.88 | $504.62 | $6,055.50 |
| 2021-06 to 2022-05 (Year 4) | 12 | $6,270.47 | $529.86 | $6,358.28 |
| 2022-06 to 2023-05 (Year 5) | 12 | $6,583.99 | $556.35 | $6,676.16 |
| 2023-06 to 2024-05 (Year 6) | 12 | $6,913.19 | $584.16 | $7,009.97 |
| 2024-06 to 2025-06 (Year 7) | 13 | $7,258.85 | $613.37 | $7,973.85 |
| **Total** | **85** | | | **$45,333.41** |

**Total Employee Contributions: $45,333.41**

## Step 3: Interest Calculation (RULE-REFUND-INTEREST)

**Rate:** 2% per annum, compounded June 30

| Compounding Date | Balance Before Interest | Interest (2%) | Cumulative |
|-----------------|------------------------|---------------|------------|
| June 30, 2019 | $6,407.41 | $128.15 | $128.15 |
| June 30, 2020 | $12,302.67 | $246.05 | $374.20 |
| June 30, 2021 | $18,604.22 | $372.08 | $746.29 |
| June 30, 2022 | $25,334.59 | $506.69 | $1,252.98 |
| June 30, 2023 | $32,517.83 | $650.36 | $1,903.33 |
| June 30, 2024 | $40,178.16 | $803.56 | $2,706.90 |
| June 30, 2025 | $48,065.42 | $961.31 | $3,668.21 |

Wait — termination is June 30, 2025, so the June 30, 2025 interest is the last one.

For the POC test oracle: **Total Interest = $3,668.21**

## Step 4: Gross Refund Amount

```
Total Employee Contributions:  $45,333.41
+ Accrued Interest:            $ 3,668.21
                               ──────────
Gross Refund Amount:           $49,001.62
```

## Step 5: Tax Withholding Options

### Option A: Direct Payment
```
Gross Refund:                  $49,001.62
× 20% Federal Withholding:    $ 9,800.32
                               ──────────
Net Payment to Member:         $39,201.30
```

### Option B: Direct Rollover
```
Full Amount Rolled Over:       $49,001.62
Withholding:                   $     0.00
```

## Step 6: Forfeiture Determination (RULE-REFUND-VESTED)

```
Service Years: 7.08
Vesting Requirement: 5.00 years
Vested: YES
Forfeiture: REQUIRED — member permanently forfeits all pension rights
```

**This is the CRITICAL decision.** A vested member must choose between:
1. Taking the refund now ($49,001.62 gross)
2. Leaving contributions in the system and receiving a deferred pension at age 65

## Step 7: Decision Moment — Deferred Pension Comparison (RULE-REFUND-DEFERRED)

**Projected Deferred Pension at Age 65:**

```
AMS (at termination):          $7,258.85/month
Multiplier (Tier 1):           2.00%
Service Years:                 7.08
Deferred Monthly Benefit:      $7,258.85 × 0.02 × 7.08 = $1,028.45/month
```

**Comparison:**

| Factor | Take Refund Now | Leave for Deferred Pension |
|--------|----------------|--------------------------|
| Immediate cash | $49,001.62 gross | $0 |
| Monthly pension at 65 | $0 | $1,028.45/month |
| Annual pension at 65 | $0 | $12,341.40/year |
| Years to age 65 | 21 years | 21 years |
| Breakeven period | N/A | ~4.0 years after age 65 |
| Lifetime value (to 85) | $49,001.62 | $246,828.00 |

**Breakeven calculation:**
```
Refund amount / Annual pension = $49,001.62 / $12,341.40 = 3.97 years
Starting at age 65, breakeven at ~age 69
```

**Key insight for the Decision Moment display:**
- The deferred pension is worth approximately 5x the refund amount over a 20-year retirement
- However, the refund provides immediate liquidity
- No COLA assumed for this comparison (conservative)
- Time value of money not factored (a $49K investment over 21 years could also grow)

## Summary — Case 8 Oracle Values

| Item | Amount |
|------|--------|
| Total Employee Contributions | $45,333.41 |
| Accrued Interest (2%, June 30 compounding) | $3,668.21 |
| **Gross Refund** | **$49,001.62** |
| Federal Withholding (20%, direct payment) | $9,800.32 |
| **Net Refund (direct payment)** | **$39,201.30** |
| Net Refund (full rollover) | $49,001.62 |
| Earliest Application Date | September 28, 2025 |
| Vested | Yes |
| Forfeiture Required | Yes |
| Deferred Monthly at 65 | $1,028.45 |
| Breakeven Years | ~4.0 years after age 65 |
