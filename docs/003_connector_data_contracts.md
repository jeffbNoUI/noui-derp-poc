# Connector Data Contracts (Draft) — JSON API Shapes

## Purpose

These are the JSON response shapes for each Connector API endpoint within POC scope (Service Retirement). Every response includes a standard envelope with the entity data, data quality flags, and metadata.

## Standard Response Envelope

Every Connector response follows this structure:

```json
{
  "data": { ... },
  "dataQualityFlags": [ ... ],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

Collection responses use `"data": [ ... ]` with a `"count"` in metadata.

---

## GET /api/v1/members/{id}

Returns the Member entity.

```json
{
  "data": {
    "memberId": "M-100001",
    "ssnMasked": "***-**-3456",
    "firstName": "Robert",
    "lastName": "Martinez",
    "middleName": "A.",
    "suffix": null,
    "dateOfBirth": "1963-03-08",
    "gender": "male",
    "address": {
      "line1": "1847 Vine St",
      "line2": null,
      "city": "Denver",
      "state": "CO",
      "zipCode": "80205"
    },
    "contactInfo": {
      "homePhone": "303-555-0101",
      "workPhone": "303-555-0201",
      "cellPhone": "720-555-0301",
      "email": "rmartinez@denvergov.org"
    },
    "hireDate": "1997-06-15",
    "terminationDate": null,
    "rehireDate": null,
    "originalHireDate": null,
    "storedTier": 1,
    "computedTier": 1,
    "tierMismatch": false,
    "status": "active",
    "departmentCode": "DPW",
    "departmentName": "Public Works",
    "positionCode": "ENG3",
    "positionTitle": "Senior Engineer",
    "currentAnnualSalary": 116434.00,
    "employeeContributionRate": 0.0845,
    "employerContributionRate": 0.1795,
    "maritalStatus": "married",
    "retirementEligibilityDate": null,
    "vestingDate": "2002-06-15",
    "isVested": true,
    "ageToday": 62.95
  },
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

### Example with Data Quality Flag (DQ-006 tier mismatch)

```json
{
  "data": {
    "memberId": "M-009998",
    "storedTier": 2,
    "computedTier": 1,
    "tierMismatch": true,
    "hireDate": "2004-08-15"
  },
  "dataQualityFlags": [
    {
      "code": "DQ-006",
      "severity": "critical",
      "field": "tier",
      "message": "Stored tier (2) does not match computed tier (1) based on hire date 2004-08-15. Hire date precedes Tier 2 start (2004-09-01).",
      "storedValue": 2,
      "expectedValue": 1,
      "rule": "RULE-TIER-DETERMINATION"
    }
  ]
}
```

---

## GET /api/v1/members/{id}/employment

Returns employment event history ordered by date.

```json
{
  "data": [
    {
      "memberId": "M-100001",
      "eventType": "hire",
      "effectiveDate": "1997-06-15",
      "fromDepartmentCode": null,
      "toDepartmentCode": "DPW",
      "fromPositionCode": null,
      "toPositionCode": "ENG1",
      "fromSalary": null,
      "toSalary": 48000.00,
      "separationReason": null,
      "notes": "Initial hire"
    },
    {
      "memberId": "M-100001",
      "eventType": "promotion",
      "effectiveDate": "2003-01-01",
      "fromDepartmentCode": "DPW",
      "toDepartmentCode": "DPW",
      "fromPositionCode": "ENG1",
      "toPositionCode": "ENG2",
      "fromSalary": 62629.00,
      "toSalary": 68000.00,
      "separationReason": null,
      "notes": "Promotion to Engineer II"
    },
    {
      "memberId": "M-100001",
      "eventType": "promotion",
      "effectiveDate": "2010-01-01",
      "fromDepartmentCode": "DPW",
      "toDepartmentCode": "DPW",
      "fromPositionCode": "ENG2",
      "toPositionCode": "ENG3",
      "fromSalary": 72604.00,
      "toSalary": 85000.00,
      "separationReason": null,
      "notes": "Promotion to Senior Engineer"
    }
  ],
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "count": 3,
    "version": "1.0"
  }
}
```

---

## GET /api/v1/members/{id}/salary

Returns salary history with optional date range filtering.

**Query Parameters:**
- `from` (date, optional): Start of date range
- `to` (date, optional): End of date range
- `limit` (integer, optional): Max records to return (default: all)

```json
{
  "data": [
    {
      "memberId": "M-100001",
      "payPeriodEndDate": "2026-03-21",
      "payPeriodNumber": 6,
      "basePay": 4478.23,
      "overtimePay": 0.00,
      "pensionablePay": 4478.23,
      "supplementalPay": 0.00,
      "leavePayoutAmount": 52000.00,
      "leavePayoutType": "sick_vacation",
      "annualSalaryAtPeriod": 116434.00,
      "processedDate": "2026-03-21",
      "payFrequency": "biweekly"
    }
  ],
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "count": 753,
    "version": "1.0"
  }
}
```

---

## GET /api/v1/members/{id}/salary/ams

Calculates Average Monthly Salary for benefit formula.

**Query Parameters:**
- `retirementDate` (date, required): Target retirement date
- `tier` (integer, optional): Override tier for window calculation (defaults to computedTier)

**Response: AMS Calculation Worksheet**

```json
{
  "data": {
    "memberId": "M-100001",
    "tier": 1,
    "windowMonths": 36,
    "windowStart": "2023-04-01",
    "windowEnd": "2026-03-31",
    "retirementDate": "2026-04-01",
    "baseCompensation": 331020.24,
    "leavePayoutIncluded": 52000.00,
    "totalCompensation": 383020.24,
    "ams": 10639.45,
    "monthlyBreakdown": [
      {
        "month": "2023-04",
        "pensionablePay": 8700.42,
        "leavePayoutPortion": 0.00,
        "totalForMonth": 8700.42
      }
    ],
    "leavePayoutEligibility": {
      "eligible": true,
      "reason": "Hired before 2010-01-01 with sick/vacation leave",
      "hireDate": "1997-06-15",
      "cutoffDate": "2010-01-01"
    },
    "calculationTrace": {
      "step1_windowDetermination": "Tier 1 → 36 months (highest consecutive)",
      "step2_windowPlacement": "Sliding window ending 2026-03-31 (retirement date - 1 day)",
      "step3_baseCompensation": "Sum of pensionable pay in window: $331,020.24",
      "step4_leavePayoutBoost": "Leave payout $52,000 added to final month",
      "step5_totalCompensation": "$331,020.24 + $52,000.00 = $383,020.24",
      "step6_ams": "$383,020.24 / 36 = $10,639.45"
    }
  },
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

**CROSS-STREAM S2 Note:** The `calculationTrace` structure enables the Intelligence Service to compose a full audit trail. The Rules Engine does not re-derive AMS — it trusts this value but includes the trace in its own output.

---

## GET /api/v1/members/{id}/service-credit

Returns service credit summary and detail records.

```json
{
  "data": {
    "summary": {
      "totalForBenefit": 28.75,
      "totalForEligibility": 28.75,
      "totalForIPR": 28.75,
      "earnedYears": 28.75,
      "purchasedYears": 0.00,
      "militaryYears": 0.00
    },
    "records": [
      {
        "memberId": "M-100001",
        "serviceType": "employment",
        "startDate": "1997-06-15",
        "endDate": null,
        "yearsCredit": 28.75,
        "monthsCredit": 345,
        "purchaseCost": null,
        "purchaseDate": null,
        "purchaseStatus": null,
        "purchaseType": null,
        "includesInBenefitCalc": true,
        "includesInEligibility": true,
        "includesInIPR": true
      }
    ]
  },
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "count": 1,
    "version": "1.0"
  }
}
```

### Case 2 Example (Jennifer Kim — purchased service)

```json
{
  "data": {
    "summary": {
      "totalForBenefit": 21.17,
      "totalForEligibility": 18.17,
      "totalForIPR": 18.17,
      "earnedYears": 18.17,
      "purchasedYears": 3.00,
      "militaryYears": 0.00
    },
    "records": [
      {
        "serviceType": "employment",
        "yearsCredit": 18.17,
        "includesInBenefitCalc": true,
        "includesInEligibility": true,
        "includesInIPR": true
      },
      {
        "serviceType": "purchased",
        "yearsCredit": 3.00,
        "purchaseCost": 45000.00,
        "purchaseDate": "2015-06-01",
        "purchaseStatus": "paid",
        "purchaseType": "prior_government",
        "includesInBenefitCalc": true,
        "includesInEligibility": false,
        "includesInIPR": false
      }
    ]
  }
}
```

---

## GET /api/v1/members/{id}/beneficiaries

```json
{
  "data": {
    "summary": {
      "activePrimaryAllocTotal": 100.00,
      "allocationValid": true,
      "hasSpouse": true
    },
    "primaryBeneficiaries": [
      {
        "beneficiaryId": 1,
        "memberId": "M-100001",
        "firstName": "Elena",
        "lastName": "Martinez",
        "dateOfBirth": "1966-09-15",
        "relationship": "spouse",
        "allocationPercentage": 100.00,
        "designationType": "primary",
        "effectiveDate": "1999-08-15",
        "status": "active",
        "hasSpouseConsent": true,
        "consentDate": "1999-08-15"
      }
    ],
    "contingentBeneficiaries": []
  },
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

### Example with DQ-004 (allocation over 100%)

```json
{
  "data": {
    "summary": {
      "activePrimaryAllocTotal": 130.00,
      "allocationValid": false,
      "hasSpouse": true
    }
  },
  "dataQualityFlags": [
    {
      "code": "DQ-004",
      "severity": "medium",
      "field": "allocationPercentage",
      "message": "Active primary beneficiary allocations total 130.00%, expected 100.00%",
      "storedValue": 130.00,
      "expectedValue": 100.00,
      "rule": "RULE-BENE-ALLOCATION-TOTAL"
    }
  ]
}
```

---

## GET /api/v1/members/{id}/dro

Returns DRO records for the member. Empty array if no DROs exist.

```json
{
  "data": [
    {
      "droId": 1,
      "memberId": "M-100001",
      "courtOrderDate": "2017-11-03",
      "courtName": "Denver District Court",
      "caseNumber": "2017-DR-4521",
      "alternatePayeeName": "Patricia Martinez",
      "alternatePayeeDateOfBirth": "1964-04-22",
      "alternatePayeeRelationship": "former_spouse",
      "marriageDate": "1999-08-15",
      "divorceDate": "2017-11-03",
      "divisionMethod": "percentage",
      "divisionPercentage": 0.4000,
      "divisionDescription": "40% of marital share of benefit",
      "status": "active",
      "approvedDate": "2018-02-15",
      "computedMaritalServiceYears": 18.25,
      "computedMaritalFraction": 0.6348,
      "receivedDate": "2017-12-01",
      "notes": "DRO approved per court order 2017-DR-4521"
    }
  ],
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "count": 1,
    "version": "1.0"
  }
}
```

---

## GET /api/v1/members/{id}/contributions

Returns contribution summary and optional detail.

**Query Parameters:**
- `summary` (boolean, default true): Return summary only
- `from` / `to` (date, optional): Date range for detail records
- `fiscalYear` (integer, optional): Filter by fiscal year

### Summary Response

```json
{
  "data": {
    "totalEmployeeContributions": 132456.78,
    "totalEmployerContributions": 281234.56,
    "totalInterest": 0.00,
    "currentEmployeeBalance": 132456.78,
    "currentEmployerBalance": 281234.56,
    "firstContributionDate": "1997-06-27",
    "lastContributionDate": "2026-03-21",
    "periodCount": 753,
    "currentRates": {
      "employee": 0.0845,
      "employer": 0.1795
    }
  },
  "dataQualityFlags": [],
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

---

## GET /api/v1/data-quality/member/{id}

Returns all data quality findings for a specific member across all entities. This is the endpoint the workspace calls to populate the DQ indicator panel.

```json
{
  "data": {
    "memberId": "M-009998",
    "findingCount": 2,
    "criticalCount": 1,
    "findings": [
      {
        "code": "DQ-006",
        "severity": "critical",
        "entity": "member",
        "field": "tier",
        "message": "Tier mismatch: stored 2, computed 1 from hire date 2004-08-15",
        "storedValue": 2,
        "expectedValue": 1,
        "rule": "RULE-TIER-DETERMINATION",
        "impact": "Wrong benefit formula and eligibility threshold would be applied"
      },
      {
        "code": "DQ-001",
        "severity": "high",
        "entity": "member",
        "field": "terminationDate",
        "message": "Active member has termination date set to 2023-06-15",
        "storedValue": "2023-06-15",
        "expectedValue": null,
        "rule": "RULE-STATUS-CONSISTENCY",
        "impact": "Service credit calculation may use wrong end date"
      }
    ]
  },
  "metadata": {
    "source": "legacy_derp_db",
    "retrievedAt": "2026-03-15T14:30:00Z",
    "version": "1.0"
  }
}
```

---

## Error Response Format

All error responses follow a consistent shape:

```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "No member found with ID M-999999",
    "status": 404,
    "timestamp": "2026-03-15T14:30:00Z"
  }
}
```

Standard error codes for the Connector:
- `MEMBER_NOT_FOUND` (404)
- `INVALID_MEMBER_ID` (400) — malformed ID format
- `INVALID_DATE_RANGE` (400) — `from` after `to`
- `DATABASE_UNAVAILABLE` (503) — legacy DB connection failed
- `QUERY_TIMEOUT` (504) — legacy DB query exceeded timeout

---

## CROSS-STREAM Discoveries

**CROSS-STREAM S2 (Rules):** The AMS endpoint returns a fully computed result. The Intelligence Service should NOT re-derive AMS. It calls this endpoint, trusts the value, and includes the `calculationTrace` in its own benefit calculation output.

**CROSS-STREAM S3 (API):** The response envelope (`data`, `dataQualityFlags`, `metadata`) must be consistent across all three services. S3 should define a shared response envelope type that all services import.

**CROSS-STREAM S3 (API):** The `/data-quality/member/{id}` endpoint aggregates DQ flags from all entity endpoints into a single view. S3 should confirm whether this is a Connector responsibility or an Intelligence Service orchestration.

**CROSS-STREAM S4 (Frontend):** The `calculationTrace` object in the AMS response is what drives the "show your work" transparency feature. The trace should use markdown-safe strings so the frontend can render them directly.

**CROSS-STREAM S5 (Testing):** Every JSON shape above is a testable contract. Test fixtures (case1-4) should be validated against these exact shapes. The test suite generates type-safe Go structs from these contracts.
