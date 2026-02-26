# NoUI DERP Architecture Overview

**Leave-Behind Document — Denver Employees Retirement Plan POC**

---

## System Architecture

```
                           ┌─────────────────────────────┐
                           │      NoUI Frontend (SPA)     │
                           │                              │
                           │  ┌────────┐  ┌────────────┐  │
                           │  │ Staff  │  │  Member    │  │
                           │  │ Portal │  │  Portal    │  │
                           │  ├────────┤  ├────────────┤  │
                           │  │Employer│  │  Vendor    │  │
                           │  │ Portal │  │  Portal    │  │
                           │  └────────┘  └────────────┘  │
                           └──────────┬──────────────────┘
                                      │ HTTP/JSON
                    ┌─────────────────┼──────────────────┐
                    │                 │                   │
           ┌────────▼──────┐  ┌───────▼───────┐  ┌───────▼───────┐
           │  Intelligence │  │   Workspace   │  │   Connector   │
           │    Service    │  │  Composition  │  │    Service    │
           │               │  │    Service    │  │               │
           │ - Eligibility │  │               │  │ - Legacy DB   │
           │ - Benefit     │  │ - Context     │  │   adapter     │
           │   calculation │  │   assembly    │  │ - Domain      │
           │ - Payment     │  │ - Tier-aware  │  │   model       │
           │   options     │  │   layout      │  │   mapping     │
           │ - IPR / DRO   │  │ - Process-    │  │ - Derived     │
           │ - Refund      │  │   type routing│  │   values      │
           │ - Death       │  │               │  │               │
           └───────────────┘  └───────────────┘  └───────┬───────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │  PostgreSQL  │
                                                  │  Legacy DB   │
                                                  │              │
                                                  │ 10K members  │
                                                  │ 12 tables    │
                                                  │ 15yr history │
                                                  └─────────────┘
```

---

## Service Roles

| Service | Language | Purpose |
|---------|----------|---------|
| **Frontend** | React 19 / TypeScript 5.9 | Four portal experiences (staff, member, employer, vendor) with deterministic workspace composition. Renders calculations, never computes them. |
| **Intelligence Service** | Go 1.22 | Rules engine — eligibility evaluation, benefit calculation, payment options, IPR, DRO, refund, death/survivor benefits. Executes certified plan provisions. |
| **Connector Service** | Go 1.22 | Data gateway — translates the legacy database schema into a clean domain model. Computes derived values (tier, AMS) from source records. |
| **Workspace Composition** | Go 1.22 | Context-aware workspace assembly. Selects components based on member tier, process type, retirement type, and case-specific factors (DRO, purchased service, leave payout). |

---

## Key Design Principles

### 1. AI Does Not Execute Business Rules

All benefit calculations, eligibility determinations, and dollar amounts come from a deterministic rules engine — conventional code executing certified plan provisions. AI serves three roles: rules configuration accelerator, orchestration and presentation, and learning and migration support.

### 2. Trust Through Transparency, Not Automation

Every calculation displays its formula, inputs, intermediate steps, result, and governing document citation (RMC section reference). The POC operates exclusively in Phase 1 (Transparent): no calculation, correction, or decision happens without human visibility.

### 3. Rules Changes Follow Full SDLC

AI reads governing documents and drafts proposed changes. Humans review against source language. The system generates regression tests. The full suite executes. Humans certify the complete package. No rule reaches production without human approval.

### 4. Source of Truth = Governing Documents

Business rules come from the Revised Municipal Code (sections 18-391 through 18-430.7) and DERP board policies. The legacy database tells us where data lives, not what the rules are. Historical transactions validate rules but never define them.

---

## Calculation Transparency

Every calculation panel displays:

| Element | Example |
|---------|---------|
| **Formula** | `AMS x Multiplier x Years of Service x (1 - Reduction)` |
| **Inputs** | AMS: $8,247.33 / Multiplier: 2.0% / Years: 28.75 / Reduction: 0% |
| **Intermediate steps** | Highest 36 consecutive months identified, leave payout applied to final month |
| **Result** | $4,742.21/month (Single Life) |
| **Source reference** | RMC section 18-409(a) — benefit formula; section 18-409(b) — reduction |

---

## Business Rule Coverage

| Category | Count | Examples |
|----------|-------|---------|
| Tier classification | 3 | Hire date thresholds, Tier 1 termination clause |
| Service credit | 6 | Earned, purchased, military, separation, broken service |
| Eligibility | 8 | Normal retirement, early retirement, Rule of 75/85, vesting |
| Benefit calculation | 10 | AMS windows, multipliers, reductions, leave payout |
| Payment options | 6 | Single life, J&S (100/75/50%), pop-up, level income |
| DRO processing | 4 | Marital fraction, division methods, ordering rules |
| Death/survivor | 8 | Active/retired death, vested/non-vested, J&S continuation |
| Refund | 7 | Contribution totals, interest, tax withholding, forfeiture |
| **Total** | **52** | All traced to Revised Municipal Code sections |

---

## Tier Comparison

| Provision | Tier 1 | Tier 2 | Tier 3 |
|-----------|--------|--------|--------|
| Hire date | Before Sep 1, 2004 | Sep 1, 2004 – Jun 30, 2011 | On/after Jul 1, 2011 |
| Multiplier | 2.0% | 1.5% | 1.5% |
| AMS window | 36 consecutive months | 36 consecutive months | 60 consecutive months |
| Rule of N | 75 (min age 55) | 75 (min age 55) | 85 (min age 60) |
| Early reduction | 3%/year under 65 | 3%/year under 65 | 6%/year under 65 |
| Leave payout | If hired before 2010 | If hired before 2010 | Not eligible |

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19, TypeScript 5.9, Vite 7.3 | Single-page application with four portal experiences |
| Styling | Tailwind CSS, shadcn/ui primitives | Consistent design system across all portals |
| State | TanStack Query (React Query) | API data fetching and caching |
| Routing | react-router-dom v7 | 22 routes across portals and demo capabilities |
| Backend | Go 1.22 standard library | Minimal external dependencies; lib/pq for PostgreSQL |
| Database | PostgreSQL 16 | Legacy schema simulation with 10K members |
| Infrastructure | Docker, Kubernetes, Helm | Deployable cloud, on-premises, or hybrid |
| Testing | Vitest, Go testing | 393 tests across 22 test files |

---

## Demo Cases

| Case | Member | Tier | Scenario | Key Rules Exercised |
|------|--------|------|----------|-------------------|
| 1 | Robert Martinez | 1 | Rule of 75 retirement | Leave payout, 36-mo AMS, 2.0% multiplier, J&S options |
| 2 | Jennifer Kim | 2 | Early retirement | Purchased service (excluded from Rule of 75), 30% reduction |
| 3 | David Washington | 3 | Early retirement | 60-mo AMS, 6%/yr reduction, Rule of 85 |
| 4 | Martinez + DRO | 1 | DRO split | Marital fraction, 40% DRO, ordering (DRO before J&S) |
| 7 | Maria Santos | 2 | Contribution refund | Non-vested, interest compounding, tax withholding |
| 8 | Thomas Chen | 1 | Vested refund | Forfeiture decision, deferred benefit comparison |
| 9 | Margaret Thompson | 1 | Retired member death | 75% J&S survivor continuation, overpayment review |
| 10 | James Rivera | 3 | Active member death | Non-vested, contribution refund to beneficiary |

All retirement cases hand-calculated and verified to the penny.

---

## Data Quality Detection

Six detector types run automatically across the member population:

1. **Tier classification** — Hire date vs. assigned tier mismatch
2. **Salary continuity** — Missing pay periods in salary history
3. **Contribution balance** — Running balance vs. sum of records
4. **Beneficiary allocation** — Percentages not totaling 100%
5. **Status consistency** — Active status with termination date populated
6. **Benefit accuracy** — Calculated vs. stored benefit amounts for retirees

All findings are presented as proposed corrections awaiting human review.

---

*The rules engine is configured with certified plan provisions. AI composes the workspace. The rules engine determines the numbers. Every calculation is transparent and verifiable.*
