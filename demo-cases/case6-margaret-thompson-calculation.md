# Case 6: Margaret Thompson — Retiree Death, J&S Survivor Benefit Continuation

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | Margaret Thompson | Demo case specification |
| Member ID | M-100006 | Assigned |
| Date of Birth | November 22, 1957 | Demo case specification |
| Hire Date | August 15, 1993 | Demo case specification |
| Retirement Date | January 1, 2024 | Demo case specification |
| Tier | 1 (hired before Sept 1, 2004) | RMC §18-409(a)(1) |
| Retirement Type | Rule of 75 | Age 66 + service 30.375 = 96.375 ≥ 75, min age 55 ✓ |
| Payment Option | 75% Joint & Survivor | Irrevocable election |
| Monthly Benefit (member) | $3,248.00 | Per retirement calculation (actuarially reduced from Maximum) |
| Maximum Benefit (unreduced) | $3,750.00 | For pop-up reference |
| Death Benefit Election | 100 monthly installments | Irrevocable |
| Date of Death | March 15, 2026 | Demo case specification |

### Survivor / Beneficiary

| Field | Value |
|-------|-------|
| Name | William Thompson |
| Relationship | Spouse |
| Date of Birth | June 3, 1955 |
| Age at Margaret's Death | 70 |
| J&S Beneficiary | Yes — 75% survivor |
| Death Benefit Beneficiary | Yes |

---

## What This Case Demonstrates

1. **Death notification processing** — intake, verification, benefit suspension
2. **J&S survivor benefit continuation** — 75% of member's benefit to surviving spouse
3. **Last payment determination** — was the month-of-death benefit already paid?
4. **Lump-sum death benefit installment continuation** — remaining installments to beneficiary
5. **IPR termination** — IPR is a member benefit; verify whether it continues to survivor
6. **Overpayment check** — if benefit was paid for month after death, recovery needed
7. **Member record status transition** — active retiree → deceased → survivor active
8. **Multi-party management** — separate payment streams to survivor (pension vs. death benefit)

---

## Death Event Timeline

| Event | Date | Action |
|-------|------|--------|
| Margaret's death | March 15, 2026 | — |
| March benefit payment deposited | March 1, 2026 | $3,248.00 already paid (full month) |
| March death benefit installment deposited | March 1, 2026 | $50.00 already paid |
| Death notification received by DERP | March 20, 2026 | Via William Thompson (phone call) |
| Death certificate received | March 28, 2026 | Original certified copy, submitted in person |
| Benefit suspended | March 20, 2026 | Upon notification; no April payment generated |
| Survivor benefit calculation | April 2, 2026 | Staff processes survivor claim |
| Survivor benefit approval | April 5, 2026 | Supervisor review |
| William notified | April 7, 2026 | Survivor benefit amount, ongoing death benefit installments |
| First survivor payment | May 1, 2026 | $2,436.00 (75% of $3,248.00) |
| Death benefit installments resume | May 1, 2026 | $50.00/month to William (remaining installments) |

---

## Step 1: Verify Retirement Record

**Margaret's retirement details (from original retirement processing):**

| Field | Value | Rule |
|-------|-------|------|
| Tier | 1 | RULE-TIER-1 |
| Hire date | August 15, 1993 | — |
| Retirement date | January 1, 2024 | — |
| Age at retirement | 66 | DOB Nov 22, 1957 → age 66 on Jan 1, 2024 |
| Earned service | 30 years, 4.5 months = 30.375 years | Aug 1993 → Dec 2023 |
| Rule of 75 | 66 + 30.375 = 96.375 ≥ 75 ✓ | RULE-RULE-OF-75 |
| Minimum age 55 | 66 ≥ 55 ✓ | RULE-RULE-OF-75 |
| Retirement type | Rule of 75 (no reduction) | — |
| AMS (36-month window) | Verified at retirement | — |
| Payment option | 75% J&S with William | RULE-JS-75 |
| Maximum benefit | $3,750.00/month | Before J&S reduction |
| J&S reduced benefit | $3,248.00/month | Actuarial reduction for 75% J&S |
| Death benefit | $5,000 (Rule of 75 = full amount) | RULE-DEATH-NORMAL |
| Death benefit election | 100 monthly installments = $50.00/month | RULE-DEATH-ELECTION |

**Note:** The Maximum benefit of $3,750.00 and J&S reduced benefit of $3,248.00 are carried forward from Margaret's original retirement calculation. The J&S reduction factor depends on the ages of both Margaret and William at retirement, using DERP's actuarial tables. The specific factor is an assumption — see Assumptions Register.

---

## Step 2: Determine Last Payment to Member

**Rule:** Pension benefits are paid monthly, deposited on the first business day of each month.

- Margaret died: March 15, 2026
- March 2026 benefit ($3,248.00): Deposited March 1, 2026 (before death)
- March 2026 death benefit installment ($50.00): Deposited March 1, 2026 (before death)
- **March payments are valid** — Margaret was alive when payment was deposited
- **No overpayment recovery needed** for March

### Overpayment Scenario Check

If death notification had been received AFTER April 1, 2026:
- April benefit ($3,248.00) would have been deposited
- This would require recovery since Margaret was deceased before April payment
- Recovery amount: $3,248.00 + $50.00 = $3,298.00
- Recovery method: offset against William's first survivor payment, or direct repayment request

**In this case:** Death notification received March 20, 2026 — before April 1 payment generation. **No overpayment.**

---

## Step 3: Survivor Benefit Calculation

**Rule:** RULE-JS-75 — RMC §18-410(a)

Under 75% Joint & Survivor, upon the member's death, the surviving beneficiary receives 75% of the member's monthly benefit for the remainder of the survivor's life.

### Calculation

| Component | Amount | Derivation |
|-----------|--------|------------|
| Margaret's monthly benefit (75% J&S) | $3,248.00 | From retirement calculation |
| Survivor percentage | 75% | Per irrevocable election |
| **William's monthly survivor benefit** | **$2,436.00** | $3,248.00 × 0.75 |

### Key Rules

- Survivor benefit is **for William's lifetime** — no end date
- Benefit amount is **fixed** — does not change (unless COLA is granted by board)
- William **cannot change** the benefit type or designate a new beneficiary
- If William predeceases Margaret (hypothetical), Margaret's benefit would **pop up** to the Maximum ($3,750.00) prospectively per DERP's pop-up provision — but this is not applicable here since Margaret predeceased

---

## Step 4: Lump-Sum Death Benefit — Remaining Installments

**Rule:** RULE-DEATH-ELECTION — RMC §18-411(d)

Margaret elected 100 monthly installments of $50.00 ($5,000 / 100) at retirement.

### Installment Status

| Item | Value |
|------|-------|
| Total death benefit | $5,000.00 |
| Election | 100 monthly installments |
| Monthly installment | $50.00 |
| Payments made (Jan 2024 – Mar 2026) | 27 months |
| Total paid to date | $1,350.00 |
| **Remaining installments** | **73** |
| **Remaining amount** | **$3,650.00** |

### Continuation After Death

Per RMC §18-411(d), upon the member's death:
- Remaining death benefit installments continue to the designated death benefit beneficiary
- William Thompson is designated beneficiary
- William receives $50.00/month for 73 remaining months
- If William dies before all installments are paid, remaining installments go to his estate (or secondary beneficiary if designated)

**⚠️ ASSUMPTION:** Death benefit installments are separate from the J&S survivor benefit. William receives BOTH:
- $2,436.00/month survivor benefit (for his lifetime)
- $50.00/month death benefit installments (for 73 remaining months)
- **Total initial payment: $2,486.00/month** (reducing to $2,436.00 after death benefit installments exhaust)

---

## Step 5: Insurance Premium Reduction (IPR) Determination

**Rule:** RULE-IPR — RMC §18-412

Margaret's IPR at retirement:
- Earned service: 30.375 years
- Pre-Medicare rate (age 66 at retirement, already Medicare-eligible at 65): $6.25/year
- Margaret's IPR: 30.375 × $6.25 = $189.84/month

### IPR After Member Death

**⚠️ OPEN QUESTION:** Does IPR continue to the surviving spouse?

RMC §18-412 describes IPR as a benefit to the "retired member" for health insurance premium reduction. The statute does not explicitly address survivor continuation.

**Assumption for this case:** IPR terminates upon member death. Survivor receives J&S pension benefit and death benefit installments but NOT IPR.

**⚠️ [Q-IPR-SURVIVOR]:** Confirm with DERP whether IPR continues to surviving spouses. This affects Margaret's case and any survivor case where the retiree was receiving IPR.

---

## Step 6: COLA Considerations

**Rule:** RULE-COLA — RMC §18-414

- Margaret retired January 1, 2024
- First COLA eligibility: January 1, 2026 (2nd calendar year after retirement)
- If COLA was granted for 2026 (board discretionary), Margaret's benefit would have increased before death
- **For this demo case:** No COLA assumed. Margaret's benefit remained $3,248.00 from retirement through death.
- William's survivor benefit is based on the benefit amount at time of death (including any COLAs that had been applied)

### COLA on Survivor Benefit

If the board grants COLA in future years, William's survivor benefit ($2,436.00) would increase by the COLA percentage, same as any other retiree benefit. William's COLA eligibility is based on Margaret's original retirement date, not the date survivor benefits began.

---

## Step 7: DRO Check

- Margaret had no DRO on record
- **No alternate payee considerations**
- If a DRO had existed, the alternate payee's benefit would continue or cease per the terms of the DRO order, independent of the survivor benefit to William

---

## Step 8: Health Insurance Continuation

**⚠️ ASSUMPTION:** DERP health insurance is available to the retired member. Upon death, surviving spouse eligibility depends on DERP's health plan rules, which are separate from pension benefit provisions.

**For this demo case:** Health insurance is flagged as requiring action but is not calculated as a pension benefit. The workspace surfaces a task for staff to coordinate health insurance transition with DERP's health plan administrator.

---

## Step 9: Member Record Transitions

| Record | Before Death | After Death |
|--------|-------------|-------------|
| Margaret's status | Retired (active retiree) | Deceased |
| Margaret's benefit | $3,248.00/month | Terminated |
| Margaret's IPR | $189.84/month | Terminated |
| Margaret's death benefit installments | $50.00/month (27 of 100 paid) | Transferred to William |
| William's status | Beneficiary (inactive) | Survivor (active) |
| William's survivor benefit | — | $2,436.00/month (lifetime) |
| William's death benefit installments | — | $50.00/month (73 remaining) |

---

## Expected Outputs Summary

| Output | Value |
|--------|-------|
| Member status | Deceased |
| Date of death | March 15, 2026 |
| Last valid member payment | March 1, 2026 ($3,248.00 + $50.00) |
| Overpayment amount | $0.00 (no overpayment) |
| Survivor benefit (monthly) | $2,436.00 |
| Survivor benefit basis | 75% × $3,248.00 |
| First survivor payment date | May 1, 2026 |
| Death benefit installments remaining | 73 months × $50.00 = $3,650.00 |
| Death benefit installment payee | William Thompson |
| William's total initial monthly payment | $2,486.00 ($2,436.00 + $50.00) |
| William's monthly payment after installments exhaust | $2,436.00 |
| IPR continuation to survivor | No (assumed — see Q-IPR-SURVIVOR) |
| COLA eligibility (William) | Based on Margaret's Jan 1, 2024 retirement date |

---

## Verification Points for Automated Testing

| Check | Expected | Tolerance |
|-------|----------|-----------|
| Survivor benefit = member benefit × 0.75 | $3,248.00 × 0.75 = $2,436.00 | $0.00 |
| Death benefit installments paid | 27 (Jan 2024 – Mar 2026) | 0 |
| Death benefit remaining | $5,000 − $1,350 = $3,650.00 | $0.00 |
| Remaining installment count | 100 − 27 = 73 | 0 |
| Monthly installment amount | $5,000 / 100 = $50.00 | $0.00 |
| Overpayment (death mid-month, payment already issued) | $0.00 | $0.00 |
| Margaret's IPR at retirement | 30.375 × $6.25 = $189.84 | $0.01 |

---

## Assumptions Register

| Assumption | Impact | Risk | Reference |
|------------|--------|------|-----------|
| Margaret's Maximum benefit is $3,750.00 | Basis for all calculations | MEDIUM | Assumed for demo — actual would come from retirement calculation |
| J&S 75% actuarial reduction produces $3,248.00 | Core survivor benefit basis | HIGH | Q-JS-FACTORS — need DERP's actuarial reduction tables |
| IPR terminates upon member death | Affects survivor total compensation | MEDIUM | Q-IPR-SURVIVOR — verify with DERP |
| March benefit was deposited March 1 (before March 15 death) | Determines overpayment status | LOW | Standard practice: 1st business day |
| Death benefit installments continue to beneficiary after member death | Affects survivor payment streams | LOW | Consistent with irrevocable election at retirement |
| No COLA applied between retirement and death | Simplifies case | LOW | Board-discretionary, assume none for demo |
| William was alive and validly designated at time of death | Prerequisite for survivor benefit | LOW | Demo case specification |
| Health insurance continuation is outside pension benefit scope | Not calculated | LOW | Separate plan administration |

---

## Governing Document References

| Step | Rule | RMC Section |
|------|------|-------------|
| Retirement type verification | RULE-RULE-OF-75 | §18-408(b)(2) |
| Payment option terms | RULE-JS-75 | §18-410(a) |
| Survivor benefit amount | — | §18-410(a) — 75% continuation |
| Death benefit | RULE-DEATH-NORMAL | §18-411(d)(1) |
| Death benefit election | RULE-DEATH-ELECTION | §18-411(d) |
| Pop-up provision | — | Retirement Application Part B |
| IPR | RULE-IPR | §18-412 |
| COLA eligibility | RULE-COLA | §18-414 |

---

## Edge Cases This Case Enables Testing

1. **Delayed death notification:** What if DERP didn't learn until April 5? April payment would have been issued → overpayment of $3,298.00 requiring recovery
2. **Beneficiary predeceases (hypothetical):** If William had died first, Margaret's benefit pops up to $3,750.00 (Maximum) — test pop-up logic
3. **DRO interaction (hypothetical):** If Margaret had a DRO, alternate payee benefit treatment at death depends on DRO terms — some continue, some cease
4. **100% J&S variant:** Survivor would receive $3,248.00 (100% of member benefit)
5. **50% J&S variant:** Survivor would receive $1,624.00 (50% of member benefit)
6. **Maximum election:** No survivor benefit; benefit ceases at death. Only death benefit installments continue.

---

*Case 6 validates the death/survivor pipeline: death notification intake, benefit suspension, survivor benefit calculation from J&S election, death benefit installment continuation, IPR termination, overpayment detection, and multi-party payment stream management.*
