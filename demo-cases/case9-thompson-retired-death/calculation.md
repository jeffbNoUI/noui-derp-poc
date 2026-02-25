# Case 9: Margaret Thompson — Retired Member Death & Survivor Benefits

## Member Profile

| Field | Value | Source |
|-------|-------|--------|
| Name | Margaret Thompson | Demo case specification |
| Member ID | M-100009 | Assigned |
| Date of Birth | July 12, 1958 | Demo case specification |
| Hire Date | March 1, 1990 | Demo case specification |
| Retirement Effective Date | January 1, 2024 | Retired with Rule of 75 |
| Tier | 1 (hired before Sept 1, 2004) | RMC §18-393 |
| Status at Death | Retired | — |
| Date of Death | March 15, 2026 | Demo case specification |
| Age at Death | 67 years | — |

## Retirement Record (At Retirement)

| Field | Value | Source |
|-------|-------|--------|
| Retirement Type | Rule of 75 (Normal Retirement Rate) | Age 65 + 33.83 yrs service = 98.83 >= 75 |
| AMS | $5,527.94 | Highest 36 consecutive months |
| Service Years | 33.83 | Earned service |
| Multiplier | 2.0% (Tier 1) | RMC §18-409(a)(1) |
| Unreduced Benefit | $3,750.00 | $5,527.94 × 0.02 × 33.83 = $3,739.70... rounded illustration; use $3,750.00 as given |
| Maximum Benefit | $3,750.00 | No reduction (Rule of 75) |
| Payment Option Elected | 75% Joint & Survivor | Member election |
| J&S Factor | 0.8661 (placeholder) | Actuarial table |
| Monthly Benefit (75% J&S) | $3,248.00 | As stated at retirement |
| Death Benefit Election | 100 installments | Member election |
| Death Benefit Lump Sum | $5,000.00 | Normal retirement rate, RMC §18-411(d) |
| Per-Installment Amount | $50.00 | $5,000.00 / 100 = $50.00 |

## Beneficiary Information

| Field | Value |
|-------|-------|
| J&S Survivor | William Thompson (Spouse) |
| J&S Survivor DOB | January 5, 1956 |
| J&S Percentage | 75% |
| Death Benefit Beneficiary | William Thompson |

---

## Death Processing — Step-by-Step Rule Application

### Step 1: Death Notification (RULE-DEATH-NOTIFY)

**Inputs:**
- Notification date: March 16, 2026
- Notification source: Family member (William Thompson)
- Current benefit status: ACTIVE (paying)

**Rule Application:**
- Credible notification received: YES
- Immediate action: SUSPEND all benefit payments
- Death certificate required for final processing: YES

**Result:**
- Member status: RETIRED → **SUSPENDED**
- Next April 1 payment: **HELD pending verification**
- Certificate requested from family

---

### Step 2: Overpayment Detection (RULE-OVERPAY-DETECT)

**Inputs:**
- Date of death: March 15, 2026
- Payment history:
  - January 2026: $3,248.00 deposited January 1, 2026
  - February 2026: $3,248.00 deposited February 1, 2026
  - March 2026: $3,248.00 deposited March 1, 2026

**Rule Application:**
- For each payment, compare deposit date to date of death:
  - Jan 1, 2026 deposit ≤ Mar 15, 2026 death → **VALID**
  - Feb 1, 2026 deposit ≤ Mar 15, 2026 death → **VALID**
  - Mar 1, 2026 deposit ≤ Mar 15, 2026 death → **VALID**
- March payment was deposited March 1, which is BEFORE the March 15 death

**Result:**
- Overpayment count: **0**
- Overpayment total: **$0.00**
- All payments prior to death date are legitimate

---

### Step 3: Survivor Benefit Determination (RULE-SURVIVOR-JS)

**Inputs:**
- Payment option elected: 75% Joint & Survivor
- Member's monthly benefit at death: $3,248.00
- J&S percentage: 75%
- Designated survivor: William Thompson (Spouse)

**Calculation:**
```
Survivor Monthly Benefit = Member Benefit × J&S Percentage
                        = $3,248.00 × 0.75
                        = $2,436.00
```

**Result:**
- Survivor monthly benefit: **$2,436.00**
- Payable to: William Thompson
- Duration: William Thompson's lifetime
- Effective date: **April 1, 2026** (first of month following death)
- First payment: April 1, 2026

---

### Step 4: Death Benefit Installment Status (RULE-DEATH-INSTALLMENTS)

**Inputs:**
- Death benefit lump sum: $5,000.00
- Election: 100 monthly installments
- Per-installment amount: $50.00
- Retirement date: January 1, 2024
- Date of death: March 15, 2026

**Calculation — Installments Paid:**
```
Months from retirement to death:
  Jan 2024, Feb 2024, Mar 2024, ... , Feb 2026, Mar 2026
  = 27 months (Jan 2024 through Mar 2026, inclusive of Jan 2024 payment)

Note: January 2024 is the first payment month. March 2026 payment was
deposited March 1 (before death on March 15), so it counts as paid.

Installments paid: 27
Installments remaining: 100 - 27 = 73
Remaining total: 73 × $50.00 = $3,650.00
```

**Result:**
- Installments paid: **27**
- Installments remaining: **73**
- Remaining amount: **$3,650.00**
- Payable to: Death benefit beneficiary (William Thompson)
- Payment schedule: $50.00/month for 73 months

---

### Step 5: Pop-Up Provision Reference (RULE-POPUP)

**Not applicable in this case** — the member (Margaret) died, not the beneficiary.

**For reference:** Had William Thompson predeceased Margaret, her benefit would have
increased from $3,248.00 (75% J&S rate) to $3,750.00 (Maximum rate), effective
the first of the month following William's death. Margaret would NOT have been
allowed to designate a new J&S beneficiary.

Pop-up increase that would have applied: $3,750.00 - $3,248.00 = **$502.00/month**

---

### Step 6: Maximum Benefit Check (RULE-MAXIMUM-DEATH)

**Not applicable** — Margaret elected 75% J&S, not Maximum. This rule applies only
to members who elected the Maximum (single life annuity) option. For those members,
all monthly payments cease at death; only death benefit installments continue.

---

### Step 7: Record Transition (RULE-DEATH-RECORD-TRANSITION)

**Transition sequence:**
1. Notification received (March 16, 2026): RETIRED → **SUSPENDED**
2. Death certificate verified (pending): SUSPENDED → **DECEASED**
3. J&S applies (75% J&S elected): Survivor benefit record **CREATED** for William Thompson

**Final member status:** DECEASED
**Survivor benefit record:** ACTIVE — $2,436.00/month to William Thompson

---

## Summary — Complete Death Processing Package

| Item | Amount | Recipient | Duration |
|------|--------|-----------|----------|
| Overpayment recovery | $0.00 | N/A | N/A |
| Survivor monthly benefit (75% J&S) | $2,436.00/mo | William Thompson | Lifetime |
| Death benefit installments remaining | $50.00/mo × 73 = $3,650.00 | William Thompson | 73 months |

**Total ongoing to William Thompson:**
- Monthly: $2,436.00 (survivor) + $50.00 (death installment) = **$2,486.00/month** for 73 months
- After 73 months: $2,436.00/month (survivor only) for remainder of lifetime

---

## Verification Checklist

- [x] Death benefit amount: $5,000.00 (Rule of 75 = normal retirement rate) — RMC §18-411(d)
- [x] Death benefit installments: 100 elected, $50.00/month
- [x] Installments paid: 27 (Jan 2024 through Mar 2026)
- [x] Installments remaining: 73, total $3,650.00
- [x] Survivor benefit: 75% × $3,248.00 = $2,436.00 — RMC §18-410(a)(1)
- [x] Overpayment: $0.00 (March 1 deposit before March 15 death)
- [x] Status transition: RETIRED → SUSPENDED → DECEASED
- [x] Survivor record created for William Thompson
