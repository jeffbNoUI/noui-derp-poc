# Case 1: Robert Martinez — Tier 1, Rule of 75, Leave Payout

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | Robert Martinez | Demo case specification |
| Member ID | M-100001 | Assigned |
| Date of Birth | March 8, 1963 | Demo case specification |
| Hire Date | June 15, 1997 | Demo case specification |
| Last Day Worked | March 31, 2026 | Demo case specification |
| Retirement Effective Date | April 1, 2026 | First of month following last day worked |
| Tier | 1 (hired before Sept 1, 2004) | RMC §18-393 |
| Status | Active → Retired | — |
| Department | Public Works | Demo case specification |
| Position | Senior Engineer | Demo case specification |

## Beneficiary Information

| Field | Value |
|-------|-------|
| Spouse | Elena Martinez |
| Spouse DOB | September 15, 1966 |
| Payment Option Elected | 75% Joint & Survivor |
| Spousal Consent | Yes (notarized) |

---

## Application Timeline

| Event | Date | Validation Rule |
|-------|------|-----------------|
| Notification of intent to retire | February 12, 2026 | — |
| Last day worked | March 31, 2026 (Tuesday) | — |
| Retirement effective date | April 1, 2026 (Wednesday) | RULE-EFFECTIVE-DATE: First of month following separation |
| Application received (notarized) | March 10, 2026 (Tuesday) | RULE-APP-DEADLINE: 21 days before last day ✓ (within 30) |
| Notarization confirmed | March 10, 2026 | RULE-NOTARIZATION: ✓ |
| Complete package received | March 10, 2026 | RULE-PAYMENT-CUTOFF: Before March 15 ✓ |
| First payment date | April 1, 2026 (Wednesday) | On-time — package before cutoff |

---

## Step 1: Age at Retirement

**Calculation:**
- DOB: March 8, 1963
- Retirement Date: April 1, 2026
- Age = 2026 - 1963 = 63 years base
- Month adjustment: April 1 vs March 8 = birthday HAS passed
- **Age at Retirement: 63 years, 0 months, 24 days (use 63 for completed years)**

---

## Step 2: Service Credit Calculation

### 2.1 Employment Service (Earned)

**Employment Period:** June 15, 1997 through March 31, 2026

**Calculation (year-month method per RULE-SVC-EARNED):**
- Start: June 15, 1997
- End: March 31, 2026
- From June 1997 to June 2025 = 28 years (336 months)
- From June 2025 to March 2026 = 9 months
- Total: 345 months / 12 = **28.75 years**

### 2.2 Purchased / Military / Leave Service

| Type | Years | For Benefit Calc | For Rule of 75 | For IPR |
|------|-------|------------------|----------------|---------|
| Purchased | 0.00 | — | — | — |
| Military | 0.00 | — | — | — |

*Robert has no purchased or military service credit. All service is earned.*

### 2.3 Total Service Credit

| Type | Years | For Benefit Calc | For Rule of 75 | For IPR |
|------|-------|------------------|----------------|---------|
| Employment (Earned) | 28.75 | ✓ | ✓ | ✓ |
| **Total** | **28.75** | **28.75** | **28.75** | **28.75** |

---

## Step 3: Rule of 75 Eligibility Check

**Rule of 75 Requirements (Tier 1):** RMC §18-401
- Age + Earned Service ≥ 75
- Minimum age: 55

**Calculation:**
- Age: 63 (completed years)
- Earned Service: 28.75 years
- Sum: 63 + 28.75 = **91.75**

**Evaluation:**
- 91.75 ≥ 75? ✓ **YES — QUALIFIES**
- Age 63 ≥ 55? ✓ Yes (meets minimum)

**Result: QUALIFIES for Rule of 75 — NO early retirement reduction**

---

## Step 4: Early Retirement Reduction

**Not applicable.** Robert qualifies for Rule of 75 (sum = 91.75).

**Reduction Factor: 1.00 (no reduction)**

---

## Step 5: Leave Payout Eligibility

### 5.1 Leave Payout Rules

**Source:** RMC §18-401.5; RULE-LEAVE-PAYOUT
- Member must be hired before January 1, 2010
- Leave must be sick leave and/or vacation leave (NOT PTO)
- Payout amount is added to the FINAL MONTH of salary
- This boosts the AMS only if the final months are within the highest consecutive window

### 5.2 Robert's Leave Payout

**Eligibility Check:**
- Hire Date: June 15, 1997 — **Before Jan 1, 2010 ✓**
- Leave Type: Sick/Vacation (SICK_VAC) — **Eligible type ✓**

**Leave Payout Amount: $52,000.00**

**Application:** Added to the final pay period (ending March 31, 2026), which falls within the AMS window. This significantly boosts the AMS calculation (see Step 6).

---

## Step 6: Salary History and AMS Calculation

### 6.1 Tier 1 AMS Rule

**AMS Window:** Highest 36 consecutive months of pensionable compensation
**Source:** RMC §18-391(3)

### 6.2 Salary History (Final 5 Years)

*Salary progression for a Senior Engineer, Public Works:*

| Year | Annual Salary | Monthly Salary | Notes |
|------|---------------|----------------|-------|
| 2021 | $98,500 | $8,208.33 | — |
| 2022 | $101,455 | $8,454.58 | 3% increase |
| 2023 | $105,513 | $8,792.75 | 4% increase |
| 2024 | $109,734 | $9,144.50 | 4% increase |
| 2025 | $113,043 | $9,420.25 | 3% increase |
| 2026 (Q1) | $116,434 (annualized) | $9,702.83 | 3% increase |

### 6.3 Monthly Breakdown: 36-Month AMS Window

**Window Period:** April 2023 through March 2026 (most recent 36 months)

*Since salary consistently increases year over year, the most recent 36 months is the highest consecutive window.*

| Month | Year | Salary |
|-------|------|--------|
| Apr | 2023 | $8,792.75 |
| May | 2023 | $8,792.75 |
| Jun | 2023 | $8,792.75 |
| Jul | 2023 | $8,792.75 |
| Aug | 2023 | $8,792.75 |
| Sep | 2023 | $8,792.75 |
| Oct | 2023 | $8,792.75 |
| Nov | 2023 | $8,792.75 |
| Dec | 2023 | $8,792.75 |
| Jan | 2024 | $9,144.50 |
| Feb | 2024 | $9,144.50 |
| Mar | 2024 | $9,144.50 |
| Apr | 2024 | $9,144.50 |
| May | 2024 | $9,144.50 |
| Jun | 2024 | $9,144.50 |
| Jul | 2024 | $9,144.50 |
| Aug | 2024 | $9,144.50 |
| Sep | 2024 | $9,144.50 |
| Oct | 2024 | $9,144.50 |
| Nov | 2024 | $9,144.50 |
| Dec | 2024 | $9,144.50 |
| Jan | 2025 | $9,420.25 |
| Feb | 2025 | $9,420.25 |
| Mar | 2025 | $9,420.25 |
| Apr | 2025 | $9,420.25 |
| May | 2025 | $9,420.25 |
| Jun | 2025 | $9,420.25 |
| Jul | 2025 | $9,420.25 |
| Aug | 2025 | $9,420.25 |
| Sep | 2025 | $9,420.25 |
| Oct | 2025 | $9,420.25 |
| Nov | 2025 | $9,420.25 |
| Dec | 2025 | $9,420.25 |
| Jan | 2026 | $9,702.83 |
| Feb | 2026 | $9,702.83 |
| Mar | 2026 | $9,702.83 + **$52,000.00 leave payout** |

### 6.4 AMS Calculation

**Base Compensation (36 months without leave payout):**
- 2023 (Apr-Dec): 9 × $8,792.75 = $79,134.75
- 2024 (Jan-Dec): 12 × $9,144.50 = $109,734.00
- 2025 (Jan-Dec): 12 × $9,420.25 = $113,043.00
- 2026 (Jan-Mar): 3 × $9,702.83 = $29,108.50
- **Subtotal: $331,020.25**

*Note: The database stores biweekly pay records (annual ÷ 26 per period). When aggregated biweekly→monthly, the exact total is $331,020.24 — a $0.01 difference from annualized monthly rates. The fixture value of $331,020.24 is authoritative.*

**Leave Payout Addition:**
- Leave payout: **$52,000.00** added to March 2026 (final month)
- This is the key feature of Case 1 — the leave payout substantially increases AMS

**Total 36-Month Compensation:**
- $331,020.24 + $52,000.00 = **$383,020.24**

**Average Monthly Salary (AMS):**
- $383,020.24 ÷ 36 = **$10,639.45**

### 6.5 Leave Payout Impact

| Scenario | 36-Month Total | AMS | Impact |
|----------|---------------|-----|--------|
| Without leave payout | $331,020.24 | $9,195.01 | Baseline |
| **With leave payout** | **$383,020.24** | **$10,639.45** | **+$1,444.44/month** |

**The $52,000 leave payout increases Robert's AMS by $1,444.44 per month — a 15.7% boost.**

---

## Step 7: Benefit Calculation

### 7.1 Tier 1 Formula

**Formula:** AMS × Multiplier × Years of Service
**Source:** RMC §18-401

| Component | Value | Source |
|-----------|-------|--------|
| AMS | $10,639.45 | Step 6 calculation |
| Multiplier | 2.0% (0.02) | Tier 1, RMC §18-401 |
| Service Years | 28.75 (all earned) | Step 2 calculation |

### 7.2 Maximum Monthly Benefit

**Monthly Benefit = AMS × Multiplier × Service**
- = $10,639.45 × 0.02 × 28.75
- = $10,639.45 × 0.575
- = **$6,117.68**

*Verification: $10,639.45 × 0.02 = $212.789; $212.789 × 28.75 = $6,117.68375; rounded to $6,117.68*

### 7.3 Leave Payout Impact on Benefit

| Scenario | AMS | Benefit | Difference |
|----------|-----|---------|------------|
| Without leave payout | $9,195.01 | $5,287.13 | — |
| **With leave payout** | **$10,639.45** | **$6,117.68** | **+$830.55/month** |

**The leave payout increases Robert's monthly benefit by $830.55 — for the rest of his life.**

---

## Step 8: Payment Options

### 8.1 Actuarial Factors

*Illustrative factors — actual factors from DERP actuarial tables based on member age 63, beneficiary age 59, standard mortality tables.*

| Option | Factor | Calculation | Monthly Benefit |
|--------|--------|-------------|-----------------|
| Maximum (Single Life) | 1.0000 | $6,117.68 × 1.0000 | **$6,117.68** |
| 100% J&S | 0.8850 | $6,117.68 × 0.8850 | **$5,414.15** |
| **75% J&S** | **0.9150** | **$6,117.68 × 0.9150** | **$5,597.68** |
| 50% J&S | 0.9450 | $6,117.68 × 0.9450 | **$5,781.21** |

### 8.2 Robert's Elected Option

**Robert elects: 75% Joint & Survivor** (with spouse Elena Martinez)

- Monthly benefit to Robert: **$5,597.68**
- Upon Robert's death, Elena receives: $5,597.68 × 0.75 = **$4,198.26**/month for life

### 8.3 Spousal Consent

**Per RULE-SPOUSAL-CONSENT (RMC §18-410):**
- Robert is married — if he elected anything other than 50% J&S or greater, spousal consent would be required
- Robert elected 75% J&S — Elena signed notarized spousal consent
- Election is irrevocable once payments begin (RULE-IRREVOCABILITY)

---

## Step 9: Insurance Premium Reduction (IPR)

### 9.1 IPR Rules

**Source:** RMC §18-412; RULE-IPR
- Non-Medicare (under 65): $12.50 per year of **earned** service
- Medicare-eligible (65+): $6.25 per year of **earned** service
- Purchased service EXCLUDED (not applicable here — Robert has none)

### 9.2 Robert's IPR Calculation

**At Retirement (Age 63) — Pre-Medicare:**
- Rate: $12.50/year of earned service
- Earned Service: 28.75 years
- **IPR Amount = $12.50 × 28.75 = $359.38/month**

**At Age 65 — Post-Medicare:**
- Rate: $6.25/year of earned service
- **IPR Amount = $6.25 × 28.75 = $179.69/month**

---

## Step 10: Lump-Sum Death Benefit

### 10.1 Death Benefit Rules

**Source:** RMC §18-411(d); RULE-DEATH-NORMAL
- Normal retirement / Rule of 75 / Rule of 85: **$5,000**
- Must retire directly from active service (Robert does ✓)

### 10.2 Robert's Death Benefit

**Retirement type:** Rule of 75 (normal retirement equivalent)
**Lump-Sum Death Benefit: $5,000.00**

No reduction — Rule of 75 qualifies for the full death benefit amount.

**Installment Options:**

| Option | Installments | Monthly Amount |
|--------|-------------|----------------|
| 50 installments | 50 months | $100.00/month |
| 100 installments | 100 months | $50.00/month |

*Election is irrevocable per RULE-DEATH-ELECTION.*

---

## Step 11: Scenario Comparison

### 11.1 Robert's Strong Position

Robert is well above the Rule of 75 threshold (91.75 vs 75 needed). No reduction applies. The primary scenario comparison is the leave payout impact and payment option tradeoffs.

### 11.2 Payment Option Comparison

| Option | Monthly to Robert | Monthly to Elena (after death) | Reduction from Maximum |
|--------|-------------------|-------------------------------|------------------------|
| Maximum | $6,117.68 | $0.00 | — |
| 100% J&S | $5,414.15 | $5,414.15 | -$703.53 (11.5%) |
| **75% J&S (elected)** | **$5,597.68** | **$4,198.26** | **-$520.00 (8.5%)** |
| 50% J&S | $5,781.21 | $2,890.61 | -$336.47 (5.5%) |

### 11.3 Without Leave Payout (Hypothetical)

If Robert were not eligible for the $52,000 sick/vacation payout:
- AMS would be $9,195.01
- Maximum benefit: $5,287.13
- 75% J&S benefit: $5,287.13 × 0.9150 = $4,837.72

**The leave payout adds $759.96/month to his elected 75% J&S benefit.**

### 11.4 Demo Narrative

This case demonstrates two key DERP features:
1. **Rule of 75** eliminates early retirement reduction entirely — Robert's 91.75 exceeds 75 by a wide margin
2. **Leave Payout** adds $52,000 to the final month of salary, boosting AMS by 15.7% and increasing the monthly benefit by $830.55. This is a significant, permanent increase that only applies to members hired before January 1, 2010 with accrued sick/vacation leave (not PTO).

The system correctly identifies leave payout eligibility, applies it to the AMS window, and shows the impact. This is the foundation calculation for Case 4 (DRO variant).

---

## Summary: Robert Martinez

| Item | Value |
|------|-------|
| **Tier** | 1 |
| **Age at Retirement** | 63 |
| **Earned Service** | 28.75 years |
| **Total Service (for benefit)** | 28.75 years |
| **Rule of 75** | ✓ Qualifies (91.75) |
| **Early Retirement Reduction** | None (0%) |
| **AMS (36-month, with leave payout)** | $10,639.45 |
| **Leave Payout** | $52,000.00 (sick/vacation) |
| **Maximum Monthly Benefit** | $6,117.68 |
| **Elected Option** | 75% Joint & Survivor |
| **Monthly Benefit** | $5,597.68 |
| **Survivor Benefit (Elena)** | $4,198.26/month |
| **IPR (pre-Medicare)** | $359.38/month |
| **IPR (post-Medicare)** | $179.69/month |
| **Lump-Sum Death Benefit** | $5,000.00 |

---

## Key Demonstration Points

### 1. Rule of 75 Eligibility
Robert's age (63) + earned service (28.75) = 91.75, well above the 75 threshold. No early retirement reduction applies. The system evaluates this automatically.

### 2. Leave Payout — The Hidden Benefit Booster
The $52,000 leave payout is the most impactful feature in this case:
- ✓ Robert hired before Jan 1, 2010 (June 1997)
- ✓ Leave type is sick/vacation (not PTO)
- The payout is added to the final month's salary within the AMS window
- Boosts AMS from $9,195.01 to $10,639.45 (+15.7%)
- Increases monthly benefit by $830.55 permanently

### 3. Payment Option Tradeoffs
Robert elects 75% J&S, accepting an 8.5% reduction ($520.00/month) to provide Elena with $4,198.26/month for life after his death. The system presents all four options with exact dollar impacts.

### 4. Foundation for Case 4
This calculation provides the base benefit ($6,117.68) used in Case 4's DRO division. The DRO split happens on the Maximum benefit BEFORE payment option selection.

---

## Verification Checklist

- [x] Tier correctly determined from hire date (Tier 1: before Sept 1, 2004)
- [x] Service credit calculated using year-month method (345 months / 12 = 28.75)
- [x] Rule of 75 evaluated correctly (63 + 28.75 = 91.75 ≥ 75)
- [x] No early retirement reduction applied (Rule of 75 met)
- [x] Leave payout eligibility confirmed (hired before 2010, sick/vacation type)
- [x] Leave payout added to final month in AMS window
- [x] AMS uses 36-month window (Tier 1)
- [x] Benefit formula uses 2.0% multiplier (Tier 1)
- [x] Maximum benefit matches fixture: $6,117.68
- [x] J&S factors applied correctly (75% → $5,597.68)
- [x] Survivor benefit calculated (75% of elected → $4,198.26)
- [x] IPR calculated with earned service (28.75 years)
- [x] Lump-sum death benefit = $5,000 (Rule of 75 retirement)
- [x] Application timing rules validated

---

## Source References

| Provision | RMC Section | Additional Source |
|-----------|-------------|-------------------|
| Tier 1 Definition | §18-393(a) | — |
| AMS (36 months) | §18-391(3) | — |
| Rule of 75 | §18-401(b) | — |
| 2.0% Multiplier | §18-401(a) | — |
| Leave Payout Eligibility | §18-401.5 | — |
| IPR | §18-412 | — |
| Lump-Sum Death Benefit | §18-411(d)(1-2) | Active Member Handbook |
| Spousal Consent | §18-410 | — |
| Application Deadline | §18-402(10), §18-408 | — |
| Election Irrevocability | §18-410 | — |
| Effective Date | §18-408 | — |

## Change History

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-21 | Initial creation | Day 3, Step 3.1 — hand calculation for Case 1 |
