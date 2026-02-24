# NoUI DERP POC — Calculation Trace Output Format

## Purpose

Every calculation the Intelligence Service performs must produce a trace that shows its work. This trace serves three audiences:

1. **DERP Staff** — verify calculations match governing documents
2. **POC Reviewers** — demonstrate transparency and auditability
3. **Test Framework** — automated verification against hand-calculated oracles

## Design Principles

- Every intermediate value is visible
- Every formula shows variable substitution
- Every rule references its governing document
- Assumptions are explicitly tagged with their IDs
- Compatible with Connector's AMS `calculationTrace` pattern (from 003_connector_data_contracts.md)

---

## JSON Structure

```json
{
  "traceId": "calc-2026-04-01-M100001-001",
  "memberId": "M-100001",
  "calculationType": "service_retirement",
  "timestamp": "2026-03-10T14:30:00Z",
  "engineVersion": "1.0.0",
  "schemaVersion": "1.0",

  "inputs": {
    "member": {
      "memberId": "M-100001",
      "dateOfBirth": "1963-03-08",
      "hireDate": "1997-06-15",
      "lastDayWorked": "2026-03-31",
      "effectiveRetirementDate": "2026-04-01",
      "maritalStatus": "married",
      "storedTier": 1
    },
    "serviceCredit": {
      "totalForBenefit": "28.75",
      "totalForEligibility": "28.75",
      "totalForIPR": "28.75",
      "earnedYears": "28.75",
      "purchasedYears": "0.00"
    },
    "beneficiary": {
      "name": "Elena Martinez",
      "relationship": "spouse",
      "dateOfBirth": "1966-09-15"
    },
    "elections": {
      "paymentOption": "75_js",
      "deathBenefitInstallments": 100
    },
    "leavePayoutAmount": "52000.00",
    "dro": null,
    "amsFromConnector": {
      "ams": "10639.45",
      "windowMonths": 36,
      "windowStart": "2023-04-01",
      "windowEnd": "2026-03-31",
      "totalCompensation": "383020.24"
    }
  },

  "steps": [
    {
      "stepNumber": 1,
      "ruleId": "RULE-TIER-1",
      "ruleName": "Tier Determination",
      "sourceReference": "RMC §18-409(a)(1)",
      "description": "Determine member tier based on hire date",
      "formula": "hireDate < 2004-09-01 AND terminationDate > 1999-12-31",
      "substitution": "1997-06-15 < 2004-09-01 AND 2026-04-01 > 1999-12-31",
      "intermediateValues": {
        "hireDateBeforeCutoff": true,
        "terminationAfter1999": true
      },
      "result": {
        "computedTier": 1,
        "tierMatch": true
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 2,
      "ruleId": "RULE-SVC-EARNED",
      "ruleName": "Earned Service Credit",
      "sourceReference": "RMC §18-402, §18-409(a)",
      "description": "Calculate earned service from employment dates",
      "formula": "completedMonths(hireDate, retirementDate) / 12",
      "substitution": "completedMonths(1997-06-15, 2026-04-01) / 12 = 345 / 12",
      "intermediateValues": {
        "hireDate": "1997-06-15",
        "retirementDate": "2026-04-01",
        "completedMonths": 345
      },
      "result": {
        "earnedServiceYears": "28.75"
      },
      "assumptions": ["Q-CALC-02"],
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 3,
      "ruleId": "RULE-VESTING",
      "ruleName": "Vesting Check",
      "sourceReference": "RMC §18-402(31)",
      "description": "Verify 5-year vesting requirement (earned service only)",
      "formula": "totalForEligibility >= 5.0",
      "substitution": "28.75 >= 5.0",
      "result": {
        "isVested": true
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 4,
      "ruleId": "RULE-ELIG-HIERARCHY",
      "ruleName": "Eligibility Evaluation",
      "sourceReference": "RMC §18-408, §18-409",
      "description": "Evaluate eligibility in hierarchy order",
      "substeps": [
        {
          "ruleId": "RULE-NORMAL-RET",
          "formula": "age >= 65 AND service >= 5",
          "substitution": "63 >= 65 → false",
          "result": { "met": false }
        },
        {
          "ruleId": "RULE-RULE-OF-75",
          "formula": "tier IN [1,2] AND age >= 55 AND (age + earnedService) >= 75",
          "substitution": "1 IN [1,2] AND 63 >= 55 AND (63 + 28.75) >= 75 → 91.75 >= 75",
          "result": { "met": true, "ruleSum": "91.75", "minimumAgeMet": true }
        }
      ],
      "result": {
        "retirementType": "rule_of_75",
        "reductionFactor": "1.00",
        "reductionPercent": 0
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 5,
      "ruleId": "RULE-LEAVE-PAYOUT",
      "ruleName": "Leave Payout Eligibility",
      "sourceReference": "RMC §18-402(15)",
      "description": "Determine if leave payout included in AMS",
      "formula": "hireDate <= 2009-12-31",
      "substitution": "1997-06-15 <= 2009-12-31 → true",
      "result": {
        "leavePayoutEligible": true,
        "leavePayoutAmount": "52000.00"
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 6,
      "ruleId": "RULE-AMS-CALC",
      "ruleName": "AMS Calculation",
      "sourceReference": "RMC §18-409(a)(1)",
      "description": "Average Monthly Salary from Connector (trusted value with trace)",
      "formula": "totalCompensation / windowMonths",
      "substitution": "383020.24 / 36",
      "intermediateValues": {
        "windowMonths": 36,
        "baseCompensation": "331020.24",
        "leavePayoutAdded": "52000.00",
        "totalCompensation": "383020.24"
      },
      "result": {
        "ams": "10639.45"
      },
      "source": "connector",
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 7,
      "ruleId": "RULE-BENEFIT-T1",
      "ruleName": "Tier 1 Benefit Formula",
      "sourceReference": "RMC §18-409(a)(1)",
      "description": "Calculate unreduced monthly benefit",
      "formula": "AMS × multiplier × serviceYearsForBenefit",
      "substitution": "10639.45 × 0.02 × 28.75",
      "intermediateValues": {
        "ams": "10639.45",
        "multiplier": "0.02",
        "serviceYearsForBenefit": "28.75",
        "fullPrecisionResult": "6117.6838..."
      },
      "result": {
        "unreducedMonthlyBenefit": "6117.68"
      },
      "assumptions": ["Q-CALC-01"],
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 8,
      "ruleId": "RULE-REDUCTION-APPLY",
      "ruleName": "Reduction Application",
      "sourceReference": "RMC §18-409(b)",
      "description": "No reduction — Rule of 75 qualifies for unreduced benefit",
      "formula": "unreducedBenefit × reductionFactor",
      "substitution": "6117.68 × 1.00",
      "result": {
        "maximumMonthlyBenefit": "6117.68",
        "reductionApplied": false
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 9,
      "ruleId": "RULE-JS-75",
      "ruleName": "75% Joint & Survivor",
      "sourceReference": "RMC §18-410(a)(1)",
      "description": "Apply J&S factor to maximum benefit",
      "formula": "maximumBenefit × jsFactor; survivorBenefit = memberBenefit × 0.75",
      "substitution": "6117.68 × 0.9150; 5597.68 × 0.75",
      "intermediateValues": {
        "jsFactor": "0.9150",
        "fullPrecisionMember": "5597.6772"
      },
      "result": {
        "memberMonthlyBenefit": "5597.68",
        "survivorMonthlyBenefit": "4198.26"
      },
      "assumptions": ["Q-CALC-04"],
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 10,
      "ruleId": "RULE-IPR",
      "ruleName": "Insurance Premium Reduction",
      "sourceReference": "RMC §18-412",
      "description": "Calculate IPR based on earned service",
      "formula": "earnedService × iprRate",
      "substitution": "28.75 × 12.50 (pre-Medicare); 28.75 × 6.25 (post-Medicare)",
      "result": {
        "preMedicareMonthly": "359.38",
        "postMedicareMonthly": "179.69"
      },
      "verification": "CONFIRMED"
    },

    {
      "stepNumber": 11,
      "ruleId": "RULE-DEATH-NORMAL",
      "ruleName": "Lump-Sum Death Benefit",
      "sourceReference": "RMC §18-411(d)(1-2)",
      "description": "Death benefit for Rule of 75 retirement (normal equivalent)",
      "formula": "lookup(retirementType) → $5,000 for normal/Rule of N",
      "result": {
        "lumpSumDeathBenefit": "5000.00"
      },
      "verification": "CONFIRMED"
    }
  ],

  "finalResult": {
    "retirementType": "rule_of_75",
    "tier": 1,
    "maximumMonthlyBenefit": "6117.68",
    "electedPaymentOption": "75_js",
    "memberMonthlyBenefit": "5597.68",
    "survivorMonthlyBenefit": "4198.26",
    "iprMonthly": "359.38",
    "lumpSumDeathBenefit": "5000.00",
    "colaEligibilityDate": "2028-01-01"
  },

  "assumptions": [
    {
      "id": "Q-CALC-01",
      "description": "Banker's rounding on final amount only",
      "appliedInSteps": [7]
    },
    {
      "id": "Q-CALC-02",
      "description": "Partial year service = months/12",
      "appliedInSteps": [2]
    },
    {
      "id": "Q-CALC-04",
      "description": "J&S factors are placeholders (75%: 0.9150)",
      "appliedInSteps": [9]
    }
  ],

  "dataQualityFlags": [],

  "meta": {
    "calculationDurationMs": 45,
    "rulesEvaluated": 11,
    "cacheHits": 0
  }
}
```

---

## Trace Field Reference

### Step Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| stepNumber | integer | ✓ | Sequential order |
| ruleId | string | ✓ | Matches YAML rule_id exactly |
| ruleName | string | ✓ | Human-readable name |
| sourceReference | string | ✓ | RMC section or other source |
| description | string | ✓ | What this step does |
| formula | string | ✓ | Generic formula template |
| substitution | string | ✓ | Formula with actual values substituted |
| intermediateValues | object | | Named intermediate results |
| substeps | array | | For hierarchy rules with multiple checks |
| result | object | ✓ | Output values from this step |
| assumptions | array[string] | | Assumption IDs applied |
| verification | string | ✓ | CONFIRMED, ASSUMED, or OPEN |
| source | string | | "connector" if value from Connector API |

### Substep Object (for RULE-ELIG-HIERARCHY)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ruleId | string | ✓ | The sub-rule evaluated |
| formula | string | ✓ | Condition expression |
| substitution | string | ✓ | With actual values |
| result | object | ✓ | Including `met: boolean` |

---

## Compatibility Notes

- **Connector AMS trace**: The AMS step references the Connector's `calculationTrace` object. The Intelligence Service trusts the Connector's AMS value but includes the Connector's trace for end-to-end transparency.
- **Rule IDs**: Match `rule_id` values from the YAML rule definitions exactly (RULE-TIER-1, RULE-SVC-EARNED, etc.) per XS-19.
- **Monetary values**: Strings with 2 decimals per CRITICAL-002 (CON-01).
- **Response envelope**: Trace is nested inside the standard response envelope per CRITICAL-002 (CON-03):
  ```json
  {
    "data": { "calculationTrace": { ... } },
    "dataQualityFlags": [],
    "meta": { ... }
  }
  ```
