# NoUI DERP POC — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dynamic Workspace (React)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Member   │ │Eligibility│ │ Benefit  │ │ Payment  │       │
│  │ Banner   │ │  Panel   │ │  Calc    │ │ Options  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Service  │ │  DRO     │ │ Scenario │ │  Data    │       │
│  │ Credit   │ │ Impact   │ │ Modeler  │ │ Quality  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  Composition Engine: Tier 1 (always) → Tier 2 (rules-based) │
│  Shows only what's relevant to each member's situation       │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────────────┐
│              Intelligence Service (Go, port 8082)            │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Eligibility      │  │ Benefit          │                 │
│  │ Engine           │  │ Calculator       │                 │
│  │ - Vesting        │  │ - AMS lookup     │                 │
│  │ - Rule of 75/85  │  │ - Multiplier     │                 │
│  │ - Normal/Early   │  │ - Reduction      │                 │
│  │ - Reduction calc │  │ - IPR            │                 │
│  └──────────────────┘  │ - Death benefit  │                 │
│                         │ - Payment opts   │                 │
│  ┌──────────────────┐  └──────────────────┘                 │
│  │ DRO Calculator   │  ┌──────────────────┐                 │
│  │ - Marital frac   │  │ Data Quality     │                 │
│  │ - Division       │  │ - Status checks  │                 │
│  │ - Sequence       │  │ - Balance checks │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                              │
│  Statutory Lookup Tables (RMC §18-409, §18-411)             │
│  52 YAML Rule Definitions with source references             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────────────┐
│              Data Connector Service (Go, port 8081)          │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Member Profile   │  │ AMS Calculator   │                 │
│  │ - Demographics   │  │ - Biweekly → Mo  │                 │
│  │ - Employment     │  │ - Sliding window │                 │
│  │ - Salary history │  │ - Leave payout   │                 │
│  │ - Beneficiaries  │  │   integration    │                 │
│  │ - DRO records    │  └──────────────────┘                 │
│  └──────────────────┘                                        │
│                                                              │
│  Service Credit Aggregation                                  │
│  - Earned, purchased, military, leave                        │
│  - Inclusion flags: INCL_BENEFIT, INCL_ELIG, INCL_IPR       │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
┌────────────────────┴────────────────────────────────────────┐
│              Legacy Database (PostgreSQL 16)                  │
│                                                              │
│  12 tables | ~10,000 members | ~950,000 salary records       │
│  Deliberate legacy messiness: inconsistent naming,           │
│  nullable fields, missing FKs, era-dependent formats         │
│  6 seeded data quality issues for demo                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Separation of Concerns

| Layer | Responsibility | Does NOT |
|-------|---------------|----------|
| Frontend | Display, composition, user interaction | Calculate, decide eligibility |
| Intelligence | Business rules, calculations, eligibility | Access database directly |
| Connector | Data retrieval, AMS computation, transformation | Apply business rules |
| Database | Storage | Enforce business rules |

### Calculation Flow

```
Member clicks "Calculate" →
  Frontend sends member_id + retirement_date to Intelligence →
    Intelligence fetches member data from Connector →
      Connector queries PostgreSQL, computes AMS →
    Intelligence applies eligibility rules (lookup tables, not formulas) →
    Intelligence computes benefit (AMS × multiplier × service × reduction) →
    Intelligence returns full audit trail →
  Frontend displays result with formula, inputs, and RMC citation
```

### Rule Governance

```
Source Document (RMC) →
  AI drafts YAML rule definition →
    Human SME reviews against RMC text →
      System generates regression tests →
        Tests execute (failures = defects) →
          Human certifies package →
            Deploy on effective date (prior rules preserved)
```

### Service Credit Separation

```
Member has: 18.17 earned + 3.00 purchased = 21.17 total

For BENEFIT calculation:  use 21.17 (all service)
For RULE OF 75:          use 18.17 (earned only)
For IPR:                 use 18.17 (earned only)

Enforced by: SVC_CREDIT.INCL_BENEFIT / INCL_ELIG / INCL_IPR flags
```

### DRO Sequence

```
1. Calculate gross benefit:     $6,117.68
2. Apply DRO split:            -$1,553.24 (to alternate payee)
3. Member remainder:            $4,564.44
4. THEN apply payment option:   $4,564.44 × 0.9150 = $4,176.46

NOT: benefit → payment option → DRO split (WRONG ORDER)
```

## Testing Strategy

| Category | Tests | What They Verify |
|----------|-------|-----------------|
| AMS Calculation | 8 | Sliding window, leave payout, 36/60-month windows |
| API Handlers | 9 | HTTP routing, error handling, response envelopes |
| Eligibility | 15 | Demo cases + boundary conditions (Rule of 75/85 exact, vesting) |
| Benefit Calc | 13 | Demo cases + boundary (zero service, max reduction, tier comparison) |
| DRO | 4 | Marital fraction, percentage/fixed split, no-DRO passthrough |
| Rules/Tables | 8 | Statutory lookup tables, multipliers, thresholds |
| Data Quality | 18 | Contradictory status, beneficiary allocation, contribution balance |
| Change Mgmt | 1 | Demo package structure and completeness |
| Composition | 5 | Correct component presence/absence per demo case |
| Demo Verify | 18 | All cached fixture data matches hand calculations |
| **Total** | **99** | |

## File Structure

```
noui-derp-poc/
├── CLAUDE.md                          # Project instructions and DERP reference
├── BUILD_PLAN.md                      # 15-day execution plan
├── BUILD_HISTORY.md                   # Decision log and session history
├── demo-cases/                        # Hand calculations and test fixtures
│   ├── case1-robert-martinez-*        # Tier 1, Rule of 75
│   ├── case2-jennifer-kim-*           # Tier 2, purchased service
│   ├── case3-david-washington-*       # Tier 3, early retirement
│   └── case4-robert-dro-*            # DRO division
├── rules/definitions/                 # 52 YAML rule definitions
│   ├── eligibility.yaml              # 10 rules
│   ├── benefit-calculation.yaml      # 9 rules
│   ├── payment-options.yaml          # 7 rules
│   ├── dro.yaml                      # 6 rules
│   └── ...                           # 20 more rules across 4 files
├── database/
│   ├── schema/001_legacy_schema.sql  # 12-table legacy schema
│   └── seed/generate_derp_data.py    # 10,000-member seed generator
├── services/
│   ├── connector/                     # Go data connector (port 8081)
│   │   └── internal/
│   │       ├── ams/                   # AMS sliding window calculator
│   │       ├── api/                   # HTTP handlers
│   │       ├── db/                    # PostgreSQL queries
│   │       └── models/                # Domain types
│   ├── intelligence/                  # Go rules engine (port 8082)
│   │   └── internal/
│   │       ├── eligibility/           # Eligibility evaluation
│   │       ├── benefit/               # Benefit + IPR + death benefit
│   │       ├── dro/                   # DRO calculation
│   │       ├── rules/                 # Statutory lookup tables
│   │       ├── dataquality/           # Data quality checks
│   │       └── changemanagement/      # Change management demo
│   └── frontend/                      # React + TypeScript (port 3000)
│       └── src/
│           ├── api/                   # API client + demo fixtures
│           ├── components/            # 18 workspace components
│           ├── composition/           # Workspace composition engine
│           ├── hooks/                 # React Query hooks
│           ├── types/                 # TypeScript interfaces
│           └── pages/                 # MemberWorkspace
└── infrastructure/helm/               # Kubernetes Helm charts
```
