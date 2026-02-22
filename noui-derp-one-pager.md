# NoUI: AI-Accelerated Pension Administration

## The Problem

Pension administration systems are built around screens, not work. Caseworkers navigate dozens of screens to process a single retirement application — mentally assembling the member's situation from scattered data while manually applying complex, tier-specific rules. Errors in benefit calculations, missed rule interactions (like purchased service exclusion from eligibility), and inconsistent DRO sequencing are systemic risks.

## The NoUI Approach

NoUI replaces screen-based navigation with **context-aware workspaces** that compose themselves around each member's situation. The platform has three layers:

1. **Data Connector** — Reads legacy database, transforms raw records into structured member profiles
2. **Intelligence Engine** — Deterministic rules engine executing certified plan provisions. Calculates benefits, evaluates eligibility, applies DRO divisions. Every calculation shows its formula, inputs, and governing document reference.
3. **Dynamic Workspace** — AI composes the right panels for each member. DRO panel only appears for members with DROs. Leave payout only for eligible members. The workspace adapts; the rules engine decides the numbers.

## What AI Does (and Does NOT Do)

| AI Does | AI Does NOT |
|---------|-------------|
| Compose context-sensitive workspaces | Execute business rules |
| Read governing documents to draft rule configurations | Make eligibility determinations |
| Analyze legacy data to accelerate migration | Perform benefit calculations |
| Learn task patterns from transactions | Auto-approve corrections |

**Every calculation is deterministic, auditable, and traceable to the Revised Municipal Code.**

## POC Scope: DERP Retirement Application

The proof of concept targets the Denver Employees Retirement Plan — a 3-tier municipal pension plan serving ~28,800 members:

- **52 business rules** defined with RMC citations
- **4 demonstration cases** verified against hand calculations to the penny
- **94 automated tests** covering calculations, eligibility, boundary conditions, and data quality
- **AI-accelerated change management** workflow demonstrating the full rule change lifecycle

### Demo Cases

| Case | Member | Key Features |
|------|--------|-------------|
| 1 | Robert Martinez | Tier 1, Rule of 75, $52K leave payout, $6,117.68/month |
| 2 | Jennifer Kim | Tier 2, purchased service exclusion, 30% early reduction, $1,633.07/month |
| 3 | David Washington | Tier 3, 60-month AMS, Rule of 85, 12% reduction, $1,198.03/month |
| 4 | Robert + DRO | DRO division: marital fraction 0.6348, alt payee $1,553.24/month |

## Governing Principles

1. **AI Does Not Execute Business Rules** — All calculations are deterministic code executing certified configurations
2. **Trust Through Transparency** — Every output shows its work for human verification
3. **Rules Changes Follow Full SDLC** — AI drafts, humans review, tests verify, humans certify
4. **Source of Truth** — Business rules come from governing documents only

## Technology

Go backend | React + TypeScript frontend | PostgreSQL | Kubernetes-ready | 52 YAML rule definitions | Full audit trails

## Next Steps

- Obtain actual DERP actuarial tables (J&S factors currently use placeholders)
- Integration testing against production legacy database
- Security hardening and access control
- Rule certification workshop with DERP subject matter experts
- Phased rollout: Phase 1 (Transparent) → Phase 2 (Assisted) → Phase 3 (Autonomous)
