# Case 10: Active Member Death — Non-Vested (Contribution Refund)

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | James Rivera | Demo case specification |
| Member ID | M-100010 | Assigned |
| Date of Birth | November 3, 1992 | Demo case specification |
| Hire Date | June 15, 2023 | Demo case specification |
| Tier | 3 (hired on/after July 1, 2011) | RMC §18-393 |
| Status at Death | Active | Currently employed |
| Date of Death | February 10, 2026 | Demo case specification |
| Age at Death | 33 years | — |
| Service Years | 2.67 | June 2023 to Feb 2026 |
| Vested? | NO — 2.67 < 5.00 years required | RMC §18-401 |

## Beneficiary Information

| Field | Value |
|-------|-------|
| Primary Beneficiary | Maria Rivera (Spouse) |
| Allocation | 100% |

## Contribution History

| Item | Amount | Source |
|------|--------|--------|
| Annual Salary at Death | $62,000.00 | Demo case specification |
| Employee Contribution Rate | 8.45% | DERP plan rules |
| Accumulated Employee Contributions | $13,215.30 | $62,000 × 8.45% × ~2.53 years (approx) |
| Accrued Interest | $487.20 | Per DERP interest crediting |
| Total Refund Amount | $13,702.50 | Contributions + interest |

---

## Death Processing — Step-by-Step Rule Application

### Step 1: Active Member Death Determination (RULE-ACTIVE-DEATH)

**Inputs:**
- Member status: ACTIVE (currently employed)
- Death during employment: YES
- Service years: 2.67
- Vesting requirement: 5.00 years

**Rule Application:**
- Is member vested? 2.67 < 5.00 → **NOT VESTED**
- Non-vested active death → **Contribution refund** to designated beneficiary
- Survivor annuity: **NOT available** (requires vesting)

**Result:**
- Benefit type: **CONTRIBUTION REFUND**
- No survivor annuity option

---

### Step 2: Contribution Refund Calculation

**Calculation:**
```
Total Refund = Accumulated Employee Contributions + Accrued Interest
             = $13,215.30 + $487.20
             = $13,702.50
```

**Note:** Only EMPLOYEE contributions are refunded. Employer contributions
are NOT included in the refund for non-vested members.

**Result:**
- Refund amount: **$13,702.50**
- Payable to: Maria Rivera (designated beneficiary)
- Payment method: Lump sum

---

### Step 3: Death Benefit (Not Applicable)

**Rule Application:**
- Death benefit installments apply to RETIRED members who elected installments
- Active member death: No death benefit installments
- The $5,000 lump-sum death benefit per RMC §18-411 applies to retirees

**Result:**
- Death benefit installments: **N/A** (active member)

---

### Step 4: Record Transition

**Transition:**
1. Notification received: ACTIVE → **SUSPENDED**
2. Death certificate verified: SUSPENDED → **DECEASED**
3. No survivor benefit record (non-vested)
4. Contribution refund processed

---

## Contrast: What if James Rivera Had Been Vested?

For comparison, if James had 5+ years of service (vested), the following
would have been available to Maria Rivera:

| Scenario | Benefit Available |
|----------|------------------|
| Non-vested (actual) | Contribution refund: $13,702.50 |
| Vested (hypothetical, 5 years) | Survivor annuity based on accrued benefit OR contribution refund (beneficiary's choice) |
| Vested (hypothetical, 12 years) | Significantly larger survivor annuity option |

**Vested active member death produces a choice:**
- Option A: Survivor annuity — calculated as if member had retired on date of death,
  then J&S survivor percentage applied
- Option B: Contribution refund — total employee contributions plus interest

The beneficiary chooses whichever is more advantageous. For short-service
vested members, the refund may exceed the present value of the annuity.
For long-service members, the annuity is typically more valuable.

---

## Summary — Complete Death Processing Package

| Item | Amount | Recipient |
|------|--------|-----------|
| Contribution refund | $13,702.50 | Maria Rivera |
| Survivor annuity | N/A (not vested) | — |
| Death benefit installments | N/A (active member) | — |
| Overpayment recovery | N/A (no benefit payments) | — |

---

## Verification Checklist

- [x] Vesting check: 2.67 years < 5.00 required → NOT VESTED
- [x] Non-vested active death → contribution refund
- [x] Refund includes employee contributions + interest: $13,702.50
- [x] Employer contributions NOT included in refund
- [x] No survivor annuity available for non-vested member
- [x] No death benefit installments (active member, not retiree)
- [x] Status transition: ACTIVE → SUSPENDED → DECEASED
