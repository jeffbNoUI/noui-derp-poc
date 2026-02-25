# NoUI Architecture — How It Works

## Four Layers

**1. Data Connector** — Connects to the existing DERP database. Reads member data without modifying it. Computes derived values (tier classification, Average Monthly Salary) from source records rather than trusting stored values.

**2. Rules Engine** — Evaluates 52 business rules configured from DERP governing documents (RMC §18-391 through §18-430.7). Determines eligibility, calculates benefits, applies payment options and reductions. Every calculation shows its formula, inputs, intermediate steps, and result.

**3. Workspace Composition** — Decides which information to present based on the member's tier, retirement type, and specific situation. A Tier 1 member retiring under the Rule of 75 sees different components than a Tier 3 early retirement. A member with an active DRO sees the DRO impact panel; members without DROs never see it.

**4. User Interface** — Renders the composed workspace. Staff see exactly what they need for each case, with the ability to drill into any calculation for verification against their own records and governing documents.

## What AI Does and Does Not Do

| AI Does | AI Does NOT |
|---------|-------------|
| Compose workspaces — decides which panels to show for each situation | Calculate benefits or determine dollar amounts |
| Analyze population patterns — eligibility projections, workload forecasting | Determine eligibility or make yes/no decisions |
| Detect data quality issues — finds inconsistencies for human review | Execute business rules or apply plan provisions |
| Accelerate rule configuration — reads governing documents, drafts rules | Make decisions about individual member benefits |

All benefit calculations are performed by a deterministic rules engine — conventional code implementing certified plan provisions. AI never touches the money.

## Built From Your Documents

| What | Count | Source |
|------|-------|--------|
| Business rules | 52 | Revised Municipal Code sections 18-391 through 18-430.7 |
| Demo cases | 4 | Hand-calculated, verified to the penny |
| Automated tests | 300+ | Generated from rule definitions and demo case oracles |
| Data quality checks | 6 types | Embedded issues detected automatically across the member population |
| Plan tiers | 3 | Each with distinct multipliers, AMS windows, reduction rates, and eligibility rules |

## Trust Through Transparency

This system operates in **Phase 1: Transparent** mode. Every output is presented for human verification — no calculation, correction, or decision happens without human visibility.

- Every benefit formula displays its inputs, computation steps, and result
- Every eligibility determination traces to a specific Revised Municipal Code section
- Every data quality finding is presented as a proposed correction awaiting review
- The system earns trust by showing its work, not by automating approvals
