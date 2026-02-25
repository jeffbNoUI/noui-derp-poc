# Phase 2 Domain Entity Extensions — Connector API Clean Model

## Purpose

Extends 002_domain_entity_specifications.md with clean domain entities for Phase 2 process domains: Contribution Refund and Death/Survivor Benefits. These entities are exposed by the Data Connector to all higher layers. No upstream service queries legacy tables directly.

Follows the same design principles as the POC entities: clean names, typed enums, computed fields, data quality signals, SSN never exposed.

---

## Entity 11: RefundRequest

Represents a terminated member's request for contribution refund. Combines REFUND_REQUEST with computed fields from CONTRIBUTION_HIST, INTEREST_CREDIT, and SVC_CREDIT.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| REFUND_ID | refundId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| REQUEST_DT | applicationDate | date | ISO 8601 |
| SEP_DT | separationDate | date | ISO 8601 |
| WAIT_END_DT | waitingPeriodEndDate | date | ISO 8601 |
| WAIT_SATISFIED | waitingPeriodSatisfied | boolean | `Y`→`true` |
| VESTED_FLG | isVested | boolean | `Y`→`true` |
| VESTED_ACKNOWLEDGE | vestedForfeitureAcknowledged | boolean | `Y`→`true` |
| SPOUSE_NOTIFIED | spouseNotified | boolean? | `Y`→`true`, null if N/A |
| CONTRIB_TOTAL | totalContributions | decimal | Direct |
| INTEREST_TOTAL | totalInterest | decimal | Direct |
| REFUND_AMT | grossRefundAmount | decimal | Direct |
| INTEREST_RT | interestRate | decimal | Direct |
| ELECTION_CD | election | enum | See enum below |
| ROLLOVER_INST | rolloverInstitution | string? | Direct |
| ROLLOVER_ACCT | rolloverAccountMasked | string? | Mask to last 4 digits |
| ROLLOVER_AMT | rolloverAmount | decimal? | Direct |
| TAX_WITHHOLD_AMT | federalWithholding | decimal | Direct |
| NET_PAYMENT_AMT | netPaymentAmount | decimal | Direct |
| STATUS_CD | status | enum | See enum below |
| APPROVED_DT | approvedDate | date? | ISO 8601 |
| ISSUE_DT | issuedDate | date? | ISO 8601 |
| ISSUE_DEADLINE | issuanceDeadline | date | ISO 8601 |
| *(computed)* | daysUntilDeadline | integer | issuanceDeadline − today |
| *(computed)* | vestingProximity | VestingProximity? | See computed object below |
| *(computed)* | reemploymentWindow | ReemploymentWindow | See computed object below |

### Election Enum

| Legacy | Domain | Description |
|---|---|---|
| DIRECT | `direct_payment` | Direct payment to member, 20% withholding |
| ROLLOVER | `full_rollover` | Full rollover to IRA/qualified plan |
| PARTIAL | `partial_rollover` | Partial rollover, 20% on remainder |
| LEAVE_IN_TRUST | `leave_in_trust` | Leave contributions in trust fund |

### Status Enum

| Legacy | Domain | Description |
|---|---|---|
| PENDING | `pending` | Application received, not yet processed |
| APPROVED | `approved` | Calculation verified, awaiting payment |
| ISSUED | `issued` | Payment/rollover processed |
| CANCELLED | `cancelled` | Cancelled (e.g., member returned to work) |
| DENIED | `denied` | Denied (e.g., active member, pending claim) |

### Computed: VestingProximity

Only populated for non-vested members near the threshold.

```typescript
interface VestingProximity {
  currentServiceYears: number;      // 3.8333
  requiredYears: number;            // 5.0
  shortfallYears: number;           // 1.1667
  shortfallDescription: string;     // "1 year, 2 months"
  vestingDateIfStayed: string;      // ISO date
  projectedDeferredBenefitAtAge60?: number; // Estimated monthly benefit if vested
}
```

### Computed: ReemploymentWindow

```typescript
interface ReemploymentWindow {
  separationDate: string;           // ISO date
  windowEndDate: string;            // separationDate + 24 months
  isWithinWindow: boolean;          // windowEndDate > today
  repaymentInterestRate: number;    // 0.03 (fixed per RMC)
}
```

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `waiting_period_mismatch` | WAIT_SATISFIED='Y' but REQUEST_DT < WAIT_END_DT | error |
| `stale_refund_amount` | Calculated amount ≠ stored REFUND_AMT | warning |
| `missing_election` | ELECTION_CD is NULL (pre-2012 record) | warning |

---

## Entity 12: InterestCredit

Individual interest compounding event. Array of these attached to RefundRequest and ContributionRecord.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| CREDIT_DT | creditDate | date | ISO 8601 (always June 30) |
| BAL_BEFORE | balanceBefore | decimal | Direct |
| RATE_USED | interestRate | decimal | Direct |
| INTEREST_AMT | interestAmount | decimal | Direct |
| BAL_AFTER | balanceAfter | decimal | Direct |
| FISCAL_YR | fiscalYear | integer | Direct |

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `balance_drift` | balanceAfter ≠ balanceBefore + interestAmount | error |
| `rate_out_of_range` | interestRate < 0.01 or > 0.03 | warning |

---

## Entity 13: DeathRecord

Death notification and processing record. Links to member, and optionally to SurvivorBenefit and DeathBenefitInstallment.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| DEATH_ID | deathId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| DEATH_DT | dateOfDeath | date | ISO 8601 |
| NOTIFY_DT | notificationDate | date | ISO 8601 |
| NOTIFY_SOURCE | notificationSource | enum | See enum below |
| CERT_RECEIVED | deathCertificateReceived | boolean | `Y`→`true` |
| CERT_RECEIVED_DT | deathCertificateDate | date? | ISO 8601 |
| MBR_STATUS_AT_DEATH | memberStatusAtDeath | enum | Same as Member status enum |
| LAST_BENEFIT_DT | lastValidPaymentDate | date? | ISO 8601 |
| LAST_BENEFIT_AMT | lastValidPaymentAmount | decimal? | Direct |
| OVERPAY_FLG | hasOverpayment | boolean | `Y`→`true` |
| OVERPAY_AMT | overpaymentAmount | decimal? | Direct |
| OVERPAY_RECOVERED | overpaymentRecovered | enum? | See enum below |
| OVERPAY_METHOD | overpaymentRecoveryMethod | enum? | See enum below |
| SUSPENSION_DT | benefitSuspensionDate | date? | ISO 8601 |
| STATUS_CD | status | enum | See enum below |
| *(computed)* | daysBetweenDeathAndNotification | integer | notificationDate − dateOfDeath |
| *(computed)* | overpaymentRisk | boolean | Was payment deposited after death? |
| *(computed)* | survivorBenefitApplicable | boolean | J&S election + living beneficiary |

### Notification Source Enum

| Legacy | Domain |
|---|---|
| FAMILY | `family` |
| EMPLOYER | `employer` |
| NEWSPAPER | `newspaper` |
| SSA | `social_security_administration` |
| OTHER | `other` |

### Status Enum

| Legacy | Domain | Description |
|---|---|---|
| PENDING | `pending` | Notification received, certificate not yet verified |
| VERIFIED | `verified` | Death certificate received and verified |
| PROCESSED | `processed` | Survivor benefits set up, payments adjusted |
| CLOSED | `closed` | All actions complete |

### Recovery Status Enum

| Legacy | Domain |
|---|---|
| Y | `fully_recovered` |
| N | `not_recovered` |
| P | `partially_recovered` |

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `notification_before_death` | notificationDate < dateOfDeath | error |
| `member_status_not_updated` | member.status ≠ `deceased` after verified death | error |
| `stale_benefit_payment` | BENEFIT_PAYMENT.STATUS_CD still 'A' after death | warning |

---

## Entity 14: SurvivorBenefit

Continuing benefit stream to J&S survivor after member death.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| SURV_ID | survivorBenefitId | integer | Direct |
| DEATH_ID | deathId | integer? | Direct |
| MBR_ID | deceasedMemberId | string | Direct |
| SURV_MBR_ID | survivorMemberId | string? | Direct (if survivor gets own record) |
| SURV_FIRST_NM | survivorFirstName | string | Direct |
| SURV_LAST_NM | survivorLastName | string | Direct |
| SURV_DOB | survivorDateOfBirth | date | ISO 8601 |
| SURV_RELATION | survivorRelationship | enum | See enum below |
| SURV_SSN | survivorSsnMasked | string? | Mask to `***-**-NNNN` |
| JS_OPTION | jointSurvivorOption | enum | `100JS`→`joint_survivor_100` etc. |
| JS_PCT | jointSurvivorPercentage | decimal | Direct (0.50, 0.75, 1.00) |
| MBR_BENEFIT_AT_DEATH | memberBenefitAtDeath | decimal | Direct |
| SURV_BENE_AMT | monthlyBenefit | decimal | Direct |
| EFF_DT | effectiveDate | date | ISO 8601 |
| END_DT | endDate | date? | ISO 8601, null = lifetime |
| STATUS_CD | status | enum | Same as BenefitPayment status |
| POPUP_APPLIED | popupApplied | boolean? | `Y`→`true` |
| POPUP_DT | popupDate | date? | ISO 8601 |
| POPUP_PREV_AMT | popupPreviousAmount | decimal? | Direct |
| POPUP_NEW_AMT | popupNewAmount | decimal? | Direct |
| COLA_ELIGIBLE | colaEligible | boolean | `Y`→`true` |
| COLA_BASE_DT | colaEligibilityBaseDate | date | ISO 8601 (member's retirement date) |
| *(computed)* | survivorAge | decimal | Years from DOB |
| *(computed)* | benefitDuration | string | `lifetime` |
| *(computed)* | expectedBenefit | decimal | memberBenefitAtDeath × jointSurvivorPercentage |
| *(computed)* | benefitMismatch | boolean | monthlyBenefit ≠ expectedBenefit |

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `benefit_calculation_mismatch` | monthlyBenefit ≠ memberBenefitAtDeath × percentage | error |
| `missing_death_link` | deathId is null (orphaned survivor record) | warning |

---

## Entity 15: DeathBenefitInstallment

Tracks the lump-sum death benefit installment stream (50 or 100 monthly payments of $50 or $100).

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| DBI_ID | installmentId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| DEATH_ID | deathId | integer? | Direct |
| BENEFIT_AMT | totalBenefitAmount | decimal | Direct |
| ELECTION_TYPE | electionType | enum | Normalize: '50'→`fifty_installments`, '100'→`one_hundred_installments` |
| MONTHLY_AMT | monthlyAmount | decimal | Direct |
| TOTAL_INSTALLMENTS | totalInstallments | integer | Direct (50 or 100) |
| START_DT | startDate | date | ISO 8601 |
| INSTALLMENTS_PAID | installmentsPaid | integer | Direct |
| AMT_PAID | amountPaid | decimal | Direct |
| REMAINING_AMT | amountRemaining | decimal | Direct |
| CURRENT_PAYEE_NM | currentPayeeName | string | Direct |
| CURRENT_PAYEE_TYPE | currentPayeeType | enum | See enum below |
| TRANSFER_DT | transferDate | date? | ISO 8601 |
| STATUS_CD | status | enum | See enum below |
| *(computed)* | installmentsRemaining | integer | totalInstallments − installmentsPaid |
| *(computed)* | expectedAmountRemaining | decimal | (totalInstallments − installmentsPaid) × monthlyAmount |
| *(computed)* | amountDrift | decimal | amountRemaining − expectedAmountRemaining |
| *(computed)* | estimatedCompletionDate | date | Now + installmentsRemaining months |

### Payee Type Enum

| Legacy | Domain |
|---|---|
| MEMBER | `member` |
| BENEFICIARY | `beneficiary` |
| ESTATE | `estate` |

### Status Enum

| Legacy | Domain |
|---|---|
| ACTIVE | `active` |
| COMPLETED | `completed` |
| SUSPENDED | `suspended` |

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `amount_drift` | amountRemaining ≠ expectedAmountRemaining | warning |
| `installment_count_mismatch` | installmentsPaid + computed remaining ≠ totalInstallments | error |
| `election_format_legacy` | Raw election is '50' or '100' not '50_INST' | info |

---

## Entity 16: ReemploymentRecord

Tracks member returning to employment after separation, including service credit restoration.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| REEMPL_ID | reemploymentId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| PRIOR_SEP_DT | priorSeparationDate | date | ISO 8601 |
| REHIRE_DT | rehireDate | date | ISO 8601 |
| MONTHS_SEPARATED | monthsSeparated | integer | Direct |
| WITHIN_24_MONTHS | withinRestorationWindow | boolean | `Y`→`true` |
| PRIOR_REFUND_TAKEN | priorRefundTaken | boolean | `Y`→`true` |
| PRIOR_REFUND_ID | priorRefundId | integer? | Direct |
| PRIOR_REFUND_AMT | priorRefundAmount | decimal? | Direct |
| REPAY_REQUIRED | repaymentRequired | boolean | `Y`→`true` |
| REPAY_AMT | repaymentAmount | decimal? | Direct |
| REPAY_RECEIVED | repaymentReceived | enum | See enum below |
| REPAY_DT | repaymentDate | date? | ISO 8601 |
| PRIOR_SVC_RESTORED | priorServiceRestored | boolean | `Y`→`true` |
| PRIOR_SVC_YEARS | priorServiceYears | decimal? | Direct |
| NEW_TIER | newTier | integer | Direct (always 3 for re-employment) |
| STATUS_CD | status | enum | See enum below |

### Data Quality Flags

| Flag | Condition | Severity |
|---|---|---|
| `service_restored_without_repayment` | priorServiceRestored AND NOT repaymentReceived AND priorRefundTaken | error |
| `window_calculation_mismatch` | withinRestorationWindow doesn't match date math | warning |

---

## Connector API Extensions

### New Endpoints

```
GET /api/v1/members/{memberId}/refund-history
GET /api/v1/members/{memberId}/refund-requests/{refundId}
POST /api/v1/members/{memberId}/refund-requests

GET /api/v1/members/{memberId}/death-record
GET /api/v1/members/{memberId}/survivor-benefit
GET /api/v1/members/{memberId}/death-benefit-installments
GET /api/v1/members/{memberId}/interest-credits

GET /api/v1/members/{memberId}/reemployment-history
```

### Extended Endpoints

```
GET /api/v1/members/{memberId}
  — Add fields: refundStatus, deathRecordId, survivorBenefitId, hasActiveInstallments
  — Add computed: vestingProximity (for non-vested terminated members)

GET /api/v1/members/{memberId}/contribution-summary
  — Add: totalInterestCredited, accumulatedBalance, interestCredits[]
```

---

## Cross-Entity Relationships

```
Member ─── RefundRequest (0..n, typically 0 or 1)
  │
  ├── DeathRecord (0..1)
  │     │
  │     ├── SurvivorBenefit (0..1, only if J&S election)
  │     │
  │     └── DeathBenefitInstallment.transferDate (triggers payee change)
  │
  ├── DeathBenefitInstallment (0..1, created at retirement)
  │
  ├── InterestCredit (0..n, one per June 30 during employment)
  │
  └── ReemploymentRecord (0..n)
        └── RefundRequest (0..1, the refund being restored)
```
