# Domain Entity Specifications — Connector API Clean Model

## Purpose

This document defines the clean domain model that the Data Connector exposes to all higher layers (Intelligence, Relevance, Workspace). No upstream service ever queries legacy tables directly. The Connector translates the messy legacy schema (001_legacy_schema.sql) into these well-typed, validated domain entities.

## Design Principles

1. **Clean names.** Legacy abbreviations (`MBR_ID`, `FIRST_NM`, `BENE_DOB`) become readable camelCase (`memberId`, `firstName`, `beneficiaryDateOfBirth`).
2. **Typed enums.** Single-character status codes become explicit string enums with documented values.
3. **Computed fields included.** The Connector computes derived values (age, computed tier, vesting status) rather than pushing that logic upstream.
4. **Data quality signals.** Every entity can carry `dataQualityFlags` — the Connector surfaces problems rather than hiding them.
5. **SSN never exposed.** Only masked (`***-**-3456`) or absent. Full SSN stays in the legacy database.

---

## Entity 1: Member

The core identity entity. Combines MEMBER_MASTER with computed fields.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| SSN | ssnMasked | string | Mask to `***-**-NNNN` |
| FIRST_NM | firstName | string | Trim |
| LAST_NM | lastName | string | Trim |
| MIDDLE_NM | middleName | string? | Trim, null if empty |
| SUFFIX | suffix | string? | Direct |
| DOB | dateOfBirth | date | ISO 8601 |
| GENDER_CD | gender | enum | `M`→`male`, `F`→`female` |
| ADDR_LINE1..ZIP_CD | address | Address object | Composed |
| HOME_PHONE, WORK_PHONE, CELL_PHONE, EMAIL_ADDR | contactInfo | ContactInfo object | Composed |
| HIRE_DT | hireDate | date | ISO 8601 |
| TERM_DT | terminationDate | date? | ISO 8601 |
| REHIRE_DT | rehireDate | date? | ISO 8601 |
| ORIG_HIRE_DT | originalHireDate | date? | ISO 8601 |
| TIER_CD | storedTier | integer | Direct (preserved for audit) |
| *(computed)* | computedTier | integer | Derived from hireDate |
| *(computed)* | tierMismatch | boolean | storedTier ≠ computedTier |
| STATUS_CD | status | enum | See status enum below |
| DEPT_CD | departmentCode | string | Direct |
| *(joined)* | departmentName | string | From DEPARTMENT_REF |
| POS_CD | positionCode | string | Direct |
| *(joined)* | positionTitle | string | From POSITION_REF |
| ANNUAL_SALARY | currentAnnualSalary | decimal | Direct |
| EMPL_CONTRIB_RT | employeeContributionRate | decimal | Direct |
| EMPR_CONTRIB_RT | employerContributionRate | decimal | Direct |
| MARITAL_STATUS | maritalStatus | enum | See enum below |
| RET_ELIG_DT | retirementEligibilityDate | date? | ISO 8601 |
| VEST_DT | vestingDate | date? | ISO 8601 |
| *(computed)* | isVested | boolean | vestingDate ≤ today OR service ≥ 5 years |
| *(computed)* | ageToday | decimal | Years from DOB to reference date |

### Status Enum
| Legacy | Domain | Description |
|---|---|---|
| A | `active` | Currently employed |
| R | `retired` | Receiving benefits |
| T | `terminated` | Separated, not yet drawing benefits |
| D | `deferred` | Vested but deferred retirement |
| X | `deceased` | Deceased |

### Marital Status Enum
| Legacy | Domain |
|---|---|
| M | `married` |
| S | `single` |
| D | `divorced` |
| W | `widowed` |

---

## Entity 2: EmploymentEvent

One record per career event (hire, promotion, transfer, separation).

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| EVENT_TYPE | eventType | enum | See below |
| EVENT_DT | effectiveDate | date | ISO 8601 |
| FROM_DEPT | fromDepartmentCode | string? | Direct |
| TO_DEPT | toDepartmentCode | string? | Direct |
| FROM_POS | fromPositionCode | string? | Direct |
| TO_POS | toPositionCode | string? | Direct |
| FROM_SALARY | fromSalary | decimal? | Direct |
| TO_SALARY | toSalary | decimal? | Direct |
| SEP_REASON | separationReason | enum? | Only for SEP events |
| NOTES | notes | string? | Direct |

### Event Type Enum
`hire`, `promotion`, `transfer`, `separation`, `rehire`, `reclassification`

### Separation Reason Enum
`retirement`, `resignation`, `termination`, `death`, `leave_of_absence`

---

## Entity 3: SalaryRecord

Per-pay-period compensation. Connector normalizes biweekly and monthly into a consistent shape.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| PAY_PRD_END_DT | payPeriodEndDate | date | ISO 8601 |
| PAY_PRD_NBR | payPeriodNumber | integer? | NULL for monthly records |
| BASE_PAY | basePay | decimal | Direct |
| OT_PAY | overtimePay | decimal | Direct; default 0 |
| PENS_PAY | pensionablePay | decimal | Direct |
| SUPPL_PAY | supplementalPay | decimal | Direct; default 0 |
| LV_PAYOUT_AMT | leavePayoutAmount | decimal? | Only on payout period |
| LV_PAYOUT_TYPE | leavePayoutType | enum? | `sick_vacation`, `sick`, `vacation` |
| ANNL_SALARY | annualSalaryAtPeriod | decimal | Direct |
| PROC_DT | processedDate | date | ISO 8601 |
| *(computed)* | payFrequency | enum | `biweekly` if PAY_PRD_NBR present, else `monthly` |

---

## Entity 4: ContributionRecord

Per-period contribution with running balance.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| CONTRIB_DT | contributionDate | date | ISO 8601 |
| EMPL_CONTRIB | employeeContribution | decimal | Direct |
| EMPR_CONTRIB | employerContribution | decimal | Direct |
| PENS_SALARY | pensionableSalary | decimal | Direct |
| EMPL_BAL | employeeBalance | decimal | Running total |
| EMPR_BAL | employerBalance | decimal | Running total |
| INTEREST_BAL | interestBalance | decimal | Direct |
| FISCAL_YR | fiscalYear | integer | Direct |
| QTR | quarter | integer | Direct |

---

## Entity 5: ServiceCredit

Service credit by type with applicability flags.

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| SVC_TYPE | serviceType | enum | `employment`, `purchased`, `military`, `loa_buyback` |
| SVC_START_DT | startDate | date? | ISO 8601 |
| SVC_END_DT | endDate | date? | ISO 8601; NULL for active |
| YEARS_CREDIT | yearsCredit | decimal | Direct |
| MONTHS_CREDIT | monthsCredit | integer? | Direct |
| PURCH_COST | purchaseCost | decimal? | Only for purchased |
| PURCH_DT | purchaseDate | date? | Only for purchased |
| PURCH_STATUS | purchaseStatus | enum? | `paid`, `partial`, `pending` |
| PURCH_TYPE | purchaseType | enum? | `prior_government`, `military`, `loa_buyback` |
| INCL_BENEFIT | includesInBenefitCalc | boolean | 'Y' → true |
| INCL_ELIG | includesInEligibility | boolean | 'Y' → true |
| INCL_IPR | includesInIPR | boolean | 'Y' → true |

### Connector Computes Summary

The Connector also provides a pre-computed summary alongside the records:

```
ServiceCreditSummary {
  totalForBenefit: decimal    -- SUM(yearsCredit) WHERE includesInBenefitCalc
  totalForEligibility: decimal -- SUM(yearsCredit) WHERE includesInEligibility
  totalForIPR: decimal        -- SUM(yearsCredit) WHERE includesInIPR
  earnedYears: decimal        -- SUM WHERE serviceType = 'employment'
  purchasedYears: decimal     -- SUM WHERE serviceType = 'purchased'
  militaryYears: decimal      -- SUM WHERE serviceType = 'military'
  records: ServiceCredit[]
}
```

---

## Entity 6: Beneficiary

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| BENE_ID | beneficiaryId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| BENE_FIRST_NM | firstName | string? | Direct |
| BENE_LAST_NM | lastName | string? | NULL for estate |
| BENE_DOB | dateOfBirth | date? | NULL for estate |
| BENE_RELATION | relationship | enum | See below |
| ALLOC_PCT | allocationPercentage | decimal | Direct |
| BENE_TYPE | designationType | enum | `primary`, `contingent` |
| EFF_DT | effectiveDate | date | ISO 8601 |
| STATUS_CD | status | enum | `active`, `inactive` |
| SPOUSE_CONSENT | hasSpouseConsent | boolean? | 'Y' → true |
| CONSENT_DT | consentDate | date? | ISO 8601 |

### Relationship Enum
`spouse`, `child`, `parent`, `sibling`, `estate`, `other`

### Connector Computes Summary

```
BeneficiarySummary {
  activePrimaryAllocTotal: decimal    -- Should be 100.00
  allocationValid: boolean            -- activePrimaryAllocTotal == 100.00
  hasSpouse: boolean                  -- Any active beneficiary with relationship='spouse'
  primaryBeneficiaries: Beneficiary[]
  contingentBeneficiaries: Beneficiary[]
}
```

---

## Entity 7: DomesticRelationsOrder

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| DRO_ID | droId | integer | Direct |
| MBR_ID | memberId | string | Direct |
| COURT_ORDER_DT | courtOrderDate | date | ISO 8601 |
| COURT_NAME | courtName | string | Direct |
| CASE_NBR | caseNumber | string | Direct |
| ALT_PAYEE_NM | alternatePayeeName | string | Direct |
| ALT_PAYEE_DOB | alternatePayeeDateOfBirth | date | ISO 8601 |
| ALT_PAYEE_RELATION | alternatePayeeRelationship | string | Direct |
| MARRIAGE_DT | marriageDate | date | ISO 8601 |
| DIVORCE_DT | divorceDate | date | ISO 8601 |
| DIV_METHOD | divisionMethod | enum | `percentage`, `amount` |
| DIV_PCT | divisionPercentage | decimal | Stored as fraction (0.40 = 40%) |
| DIV_DESC | divisionDescription | string | Direct |
| STATUS_CD | status | enum | `active`, `pending`, `rejected`, `superseded` |
| APPROVED_DT | approvedDate | date? | ISO 8601 |
| CALC_MARITAL_SVC | computedMaritalServiceYears | decimal? | Pre-computed |
| CALC_MARITAL_FRAC | computedMaritalFraction | decimal? | Pre-computed |
| RECV_DT | receivedDate | date | ISO 8601 |
| NOTES | notes | string? | Direct |

---

## Entity 8: BenefitPayment (retirees only)

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| MBR_ID | memberId | string | Direct |
| EFF_DT | effectiveDate | date | ISO 8601 |
| GROSS_BENEFIT | grossMonthlyBenefit | decimal | Direct |
| PAY_OPTION | paymentOption | enum | `maximum`, `joint_survivor_100`, `joint_survivor_75`, `joint_survivor_50` |
| FED_TAX_AMT | federalTaxWithholding | decimal | Direct |
| STATE_TAX_AMT | stateTaxWithholding | decimal | Direct |
| NET_BENEFIT | netMonthlyBenefit | decimal | Direct |
| DRO_FLG | hasDRO | boolean | 'Y' → true |
| IPR_AMT | iprAmount | decimal | Direct |
| IPR_TYPE | iprType | enum | `pre_medicare`, `post_medicare` |
| COLA_FLG | hasCOLA | boolean | 'Y' → true |
| STATUS_CD | paymentStatus | enum | `active`, `suspended`, `terminated` |

### Payment Option Enum Mapping
| Legacy | Domain |
|---|---|
| MAX | `maximum` |
| 100JS | `joint_survivor_100` |
| 75JS | `joint_survivor_75` |
| 50JS | `joint_survivor_50` |

---

## Entity 9: CaseRecord

### Legacy → Domain Mapping

| Legacy Column | Domain Field | Type | Transform |
|---|---|---|---|
| CASE_ID | caseId | integer | Direct |
| MBR_ID | memberId | string? | NULL for system cases |
| CASE_TYPE | caseType | enum | See below |
| CASE_STATUS | status | enum | `open`, `in_review`, `approved`, `denied`, `closed` |
| OPEN_DT | openDate | date | ISO 8601 |
| CLOSE_DT | closeDate | date? | ISO 8601 |
| ASSIGNED_TO | assignedTo | string | Direct |
| PRIORITY | priority | integer? | 1=high, 2=medium, 3=low |

### Case Type Enum
`service_retirement`, `early_retirement`, `refund`, `dro`, `service_purchase`, `beneficiary_change`, `address_change`, `death`, `reemployment`

---

## Entity 10: TransactionRecord (unified across three eras)

The Connector normalizes all three logging eras into a single structure.

| Domain Field | Type | Source |
|---|---|---|
| timestamp | datetime | TXN_DT |
| transactionType | string | TXN_TYPE |
| description | string | Era 1: TXN_DESC; Era 2-3: composed from ACTION + ENTITY_TYPE |
| entityType | string? | Era 2+: ENTITY_TYPE |
| entityId | string? | Era 2+: ENTITY_ID |
| action | enum? | Era 2+: `create`, `update`, `delete`, `calculate` |
| changes | object? | Era 2: parsed from pipe-delimited; Era 3: parsed from JSON |
| memberId | string? | MBR_ID |
| userId | string | USER_ID |
| sessionId | string? | Era 3: SESSION_ID |
| module | string | MODULE |
| result | enum? | Era 2+: `success`, `failure`, `warning` |
| loggingEra | integer | Computed: 1, 2, or 3 (for transparency) |

---

## Data Quality Flags

Every entity response can include a `dataQualityFlags` array. Each flag has:

```
DataQualityFlag {
  code: string          -- e.g., "DQ-001", "DQ-006"
  severity: enum        -- "critical", "high", "medium", "low"
  field: string         -- Which field is affected
  message: string       -- Human-readable description
  storedValue: any      -- What the database says
  expectedValue: any?   -- What the Connector thinks it should be (if computable)
  rule: string?         -- Business rule reference, if applicable
}
```

Example: When `storedTier=2` but `computedTier=1` (hire date 2004-08-15):
```json
{
  "code": "DQ-006",
  "severity": "critical",
  "field": "tier",
  "message": "Stored tier (2) does not match computed tier (1) based on hire date 2004-08-15",
  "storedValue": 2,
  "expectedValue": 1,
  "rule": "RULE-TIER-DETERMINATION"
}
```

---

## CROSS-STREAM Notes

**CROSS-STREAM S2 (Rules):** The Intelligence Service always uses `computedTier`, never `storedTier`. The `tierMismatch` flag triggers a data quality finding but does not block calculation.

**CROSS-STREAM S3 (API):** The AMS calculation endpoint (GET /api/v1/members/{id}/salary/ams) needs the tier to determine window size (36 vs 60 months). The Connector must accept an optional `tier` override parameter so the Intelligence Service can pass the computed tier.

**CROSS-STREAM S3 (API):** The ServiceCreditSummary pre-computation means the Intelligence Service does NOT need to re-aggregate service credit records — it trusts the Connector's totals but can drill into records for audit display.

**CROSS-STREAM S4 (Frontend):** The `dataQualityFlags` array drives the DQ indicator component in workspace rendering. Flags with `severity: "critical"` should trigger a visual alert; lower severities appear on hover/drill.

**CROSS-STREAM S5 (Testing):** Every entity mapping above defines a testable contract. The test suite should verify that each legacy column maps to the correct domain field for all four demo cases.
