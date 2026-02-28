# NoUI Architecture Challenge — Stress Test Results

**Date:** February 28, 2026
**Purpose:** Adversarial review of all strategic documents, codebase, and product design
**Verdict:** The foundation is strong. The strategy documents have critical contradictions that must be resolved before going to market.

---

## Executive Summary

Three independent audits (CTO/technical, benefits user, strategic document cross-reference) produced 45 findings. The critical ones cluster into five themes:

1. **PII Data Flow** — The security architecture promises "no PII leaves the customer boundary." The rearchitecture sends member data to Claude API. These are irreconcilable without a resolution.
2. **Last-Mile Workflow** — The system can verify and display everything about a case but cannot complete processing one. No post-submit workflow, no case queue, no case assignment.
3. **Strategic Document Contradictions** — Three pricing strategies ($750K vs $101K vs $71K Year 1), an "AI ensemble" that exists only in the business plan, and a phantom hardware appliance.
4. **Database Modernization** — Promised as a premium feature worth $2-5M but has zero engineering detail. No target schema, no migration mechanics, no code abstraction layer.
5. **Production Readiness** — Zero authentication, no concurrency control, no persistent audit trail, no panic recovery, no compliance certifications.

**None of these are fatal.** Items 1-4 are strategic decisions that need to be made. Item 5 is expected POC debt that gets resolved during productionization. The architecture is sound — the gaps are in the missing layers on top.

---

## Finding 1: The PII Contradiction (MUST RESOLVE)

### The Problem

| Document | Claim |
|----------|-------|
| Security Architecture | "No PII leaves the customer boundary" |
| Rearchitecture Sketch | Composition agent sends member context (ID, tier, salary, benefits) to Claude API |

These cannot both be true. Every downstream document (compliance, pricing, sales) depends on which one wins.

### Resolution Options

**Option A: Agent Runs On-Premise (No PII Leaves)**

The composition agent runs inside the customer's network. The Claude API call happens from their infrastructure, subject to their security controls.

```
Customer Boundary
┌──────────────────────────────────────────────┐
│  React → Composition Agent → Claude API  ──────→ Anthropic
│              ↓                                │
│         MCP → Go Services → PostgreSQL       │
└──────────────────────────────────────────────┘
```

- PII enters the agent locally, agent calls API with member context
- Anthropic API terms: no training on API data, 30-day abuse monitoring retention
- Requires: Anthropic API agreement, data processing addendum (DPA)
- This is how every SaaS tool with AI features works (Salesforce Einstein, ServiceNow, etc.)
- **PII does technically leave the boundary** — but under contract, encrypted in transit, not retained for training

**Honest framing:** "Member data is processed via Anthropic's API under a data processing agreement. Data is encrypted in transit (TLS 1.3), not used for model training, and subject to a 30-day abuse monitoring retention policy. The NoUI Standard tier operates with zero external data transmission."

**Option B: Tokenized/Anonymized Data to Agent**

Replace PII with tokens before sending to the agent. The agent reasons about structure ("Member M-7382 is Tier 2, age 63, 28.5 years service") without seeing real names or SSNs.

```
Member Profile → Tokenizer → Agent (sees tokens) → Detokenizer → Workspace Spec
```

- Agent never sees: names, SSN, DOB, addresses
- Agent does see: tier, age, service years, salary ranges, retirement dates
- Salary and benefit amounts are arguably PII but are necessary for composition decisions
- **Adds engineering complexity:** tokenizer/detokenizer layer, token mapping persistence

**Option C: Standard Tier as PII-Safe Default**

Position NoUI Standard (fully deterministic, zero API calls) as the PII-safe option. NoUI Intelligence is offered only to agencies that accept the Anthropic DPA.

- Standard: all data stays on-premise, period
- Intelligence: member context processed via Anthropic API under DPA
- Agencies choose their risk tolerance
- **This is the recommended approach** — it leverages the two-tier architecture naturally

### Recommendation

**Go with Option C, with Option A as the technical reality for Intelligence tier.** Update the security architecture to honestly state:

> NoUI Standard processes all data within the customer boundary with zero external API calls. NoUI Intelligence transmits member context (member ID, tier, age, service years, salary, benefit amounts) to Anthropic's API for workspace composition. No SSNs, names, or addresses are transmitted. Data is protected by TLS 1.3 encryption, a data processing agreement, and Anthropic's commitment to not train on API data.

This is honest, defensible, and matches industry practice. Remove the blanket "no PII leaves" claim — it's a liability.

---

## Finding 2: Last-Mile Workflow Gaps (Benefits User Perspective)

### What's Missing

A benefits administrator evaluated every workflow and found that **every process ends at a dead end**:

| Process | What Exists | What's Missing |
|---------|-------------|---------------|
| Retirement | 8-stage guided workspace through Review & Certify | Post-submit: supervisory approval, payment setup, confirmation letter, payroll initiation |
| Refund | 5-6 stage workspace through Final Review | Save/submit action, check generation, 1099-R, member record closure |
| Death | 6-stage workspace through Case Close | Save/submit action, survivor record creation, overpayment recovery initiation |

### The Full Gap List (Prioritized)

| Priority | Gap | Why It Matters |
|----------|-----|---------------|
| **P0** | No post-submit workflow | Staff cannot complete a single case end-to-end |
| **P0** | No unified case queue | Staff cannot see their workload across all process types |
| **P0** | No case assignment/ownership | Supervisors cannot manage team workload |
| **P1** | No case notes/activity log | No record of staff decisions and communications |
| **P1** | No document management | Cannot process paperwork (upload, attach, status) |
| **P1** | No data correction with recalculation | Cannot fix wrong data and see updated results |
| **P1** | Refund/death have no save action | Confirm button is visual-only, no persistence |
| **P2** | No staff-to-member messaging | Cannot communicate with members |
| **P2** | No deadline notifications | 30-day deadlines will be missed |
| **P2** | No calculation worksheet print | Cannot produce physical file documentation |
| **P2** | No staff reports/KPI dashboard | Management has no visibility |
| **P2** | No disability retirement workspace | Cannot handle disability cases |
| **P3** | Minimal accessibility (WCAG) | ADA compliance risk |
| **P3** | No rehire/break-in-service handling | Edge cases will fail |
| **P3** | No mid-process death transition | No workflow to convert retirement case to death case |

### What This Means for the Product Tiers

NoUI Standard and Intelligence both inherit these gaps — they're in the shared foundation layer. These need to be addressed before either tier is production-ready for daily pension work.

**However:** The POC's purpose was to demonstrate the architecture pattern (AI-composed workspaces, transparent calculations, deterministic rules engine), not to build a complete pension admin system. These P0-P1 gaps are expected for a POC and represent the roadmap from POC to product. They are not architectural failures — they're unbuilt features.

### Recommended Approach

Package the P0 items as **"Production Readiness Phase"** — the work between POC and first deployment:

1. **Case lifecycle engine** — states (SUBMITTED → UNDER_REVIEW → APPROVED → PAYMENT_SETUP → ACTIVE), transitions, assignment, queue
2. **Unified work queue** — all process types in one view with aging, priority, SLA
3. **Case notes** — timestamped notes attached to cases with user attribution
4. **Save/submit for all processes** — refund and death workspaces wire up to actual persistence
5. **Document attachment** — file upload, status tracking, case linking

This is ~2-4 weeks of work, not a rearchitecture.

---

## Finding 3: Strategic Document Contradictions (MUST RESOLVE)

### 3.1 Three Incompatible Pricing Strategies

| Document | Year 1 Price (12K members) |
|----------|--------------------------|
| Business Plan Rev5 | $750,000+ |
| Cost Model | $71,000 |
| Tiers & Pricing | $81,000-$101,000 |

**Resolution:** The Business Plan Rev5 predates the cost analysis and tiers strategy. It was written as a vision document with aspirational pricing. The Cost Model and Tiers documents are the current strategy. **Action: deprecate or rewrite the Business Plan pricing section to align with the tiers strategy.** The $750K price point is defensible only for a multi-plan, enterprise-wide deployment with custom rule encoding — not for a single-plan agency.

### 3.2 "AI Ensemble" Exists Only in the Business Plan

The Business Plan describes "Coordinated AI Ensemble" with multi-model verification patterns. No other document references this. The rearchitecture uses a single Sonnet agent.

**Resolution:** The ensemble concept is a future capability, not a current architecture feature. **Action: move ensemble to a "Future Capabilities" section** and ensure the business plan's architecture section aligns with the rearchitecture sketch.

### 3.3 "Data Connector Appliance" Is a Phantom Product

The security architecture describes a physical appliance with "tamper-evident seals" and "remote attestation." No design, no manufacturing plan, no cost model.

**Resolution:** The appliance concept was an aspirational security posture, not a committed product. **Action: replace with a "deployment agent" — a software package (Docker container or VM image) that runs within the customer boundary.** This achieves the same security goal (data stays local) without requiring hardware manufacturing.

### 3.4 Prohibited Terminology in Business Plan

The Business Plan uses "heals itself" (prohibited by CLAUDE.md controlled terminology).

**Resolution:** Replace with "AI-accelerated change management" per the terminology guide.

---

## Finding 4: Database Modernization Path (MUST DESIGN)

### Current State

- Legacy schema: 19 tables, intentionally messy (simulates 25 years of organic growth)
- Connector service: all SQL is raw, embedded, references legacy column names directly
- Domain model specification: exists in `docs/002_domain_entity_specifications.md` with legacy-to-domain mapping tables
- Clean target schema DDL: **does not exist**
- Migration plan: `progressive-migration-architecture.md` describes agency-side migration (their old system → NoUI), not internal schema modernization
- No ORM, no repository pattern, no query abstraction layer

### The Problem

The connector is the sole database interface (good architectural boundary). But the connector's internals are tightly coupled to legacy column names via raw SQL. Migrating to a clean schema requires rewriting every query in 5+ Go files.

More critically: the Business Plan promises "progressive database migration" as a premium feature worth "$2-5M" — but there is no engineering detail for how this works.

### Proposed Modernization Path

#### Phase 1: Query Abstraction Layer (Pre-requisite)

Add a repository interface between the connector's HTTP handlers and raw SQL:

```go
// internal/repository/member.go
type MemberRepository interface {
    GetByID(ctx context.Context, id string) (*domain.Member, error)
    Search(ctx context.Context, query string) ([]domain.MemberSummary, error)
}

// internal/repository/legacy/member.go — current implementation
type LegacyMemberRepo struct { db *sql.DB }
func (r *LegacyMemberRepo) GetByID(ctx context.Context, id string) (*domain.Member, error) {
    // Current raw SQL against MEMBER_MASTER
}

// internal/repository/modern/member.go — future implementation
type ModernMemberRepo struct { db *sql.DB }
func (r *ModernMemberRepo) GetByID(ctx context.Context, id string) (*domain.Member, error) {
    // Clean SQL against members table
}
```

The handler code switches from `h.q.GetMember(id)` to `h.members.GetByID(ctx, id)`. The interface hides whether the underlying schema is legacy or modern.

**Effort:** ~3-5 days. This is a refactor of the connector's internals with zero external behavior change. All existing tests continue to pass.

#### Phase 2: Domain Schema DDL

Write the target schema based on the domain model spec:

```sql
-- database/schema/100_domain_schema.sql
CREATE TABLE members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id       VARCHAR(10) UNIQUE,  -- maps to MEMBER_MASTER.MBR_ID
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100),
    date_of_birth   DATE NOT NULL,
    hire_date       DATE NOT NULL,
    termination_date DATE,
    tier            SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    -- ... clean, normalized, constrained
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employment_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    event_type      VARCHAR(20) NOT NULL,
    event_date      DATE NOT NULL,
    department      VARCHAR(100),
    position_title  VARCHAR(100),
    -- ...
);

-- Similar for: salary_records, service_credits, beneficiaries,
-- dro_orders, contributions, cases, documents, audit_log
```

**Effort:** ~2-3 days. Based on existing domain entity spec, this is primarily a typing exercise.

#### Phase 3: Dual-Write Migration

During migration, the connector writes to both schemas simultaneously:

```go
func (h *Handler) SaveRetirementElection(w http.ResponseWriter, r *http.Request) {
    // Write to legacy schema (current behavior)
    legacyResult, err := h.legacyRepo.SaveElection(ctx, election)

    // Write to modern schema (new, parallel)
    modernResult, err := h.modernRepo.SaveElection(ctx, election)

    // Compare for validation
    if legacyResult.CaseID != modernResult.CaseID {
        log.Warn("dual-write mismatch", ...)
    }
}
```

Reads continue from legacy. Writes go to both. Discrepancies are logged. Over time, reads shift to modern once data is validated.

**Effort:** ~1-2 weeks for full dual-write across all entities.

#### Phase 4: Data Backfill

Migrate historical data from legacy to modern schema:

```sql
-- One-time backfill script
INSERT INTO members (legacy_id, first_name, last_name, ...)
SELECT MBR_ID, FIRST_NM, LAST_NM, ...
FROM MEMBER_MASTER;
```

With data quality checks, cleanup, and validation against the DQ engine's findings.

**Effort:** ~1 week including validation.

#### Phase 5: Cutover

Switch reads from legacy to modern. Keep legacy as read-only archive. Eventually deprecate.

### How This Connects to the Product

The modernized database is **not** a premium feature to sell for $2-5M. It's an internal engineering milestone that:
- Makes the connector cleaner and more maintainable
- Enables multi-plan support (clean schema is plan-agnostic)
- Provides the agency with a modern, well-structured database they can query directly
- De-risks the product from legacy schema assumptions

**Pricing implication:** Include the modernized database as part of the implementation deliverable, not as a separate line item. The real value isn't the schema migration — it's the ongoing operational benefits of a clean data model.

---

## Finding 5: Production Readiness Gaps (Expected POC Debt)

### Critical (Must Fix Before Any Production Deployment)

| # | Gap | Risk | Fix |
|---|-----|------|-----|
| 1 | Zero authentication on Go APIs | Anyone on the network can read all member data | Add JWT/OIDC middleware to both services |
| 2 | Race condition in CASE_ID generation | Concurrent submissions collide | Use PostgreSQL SERIAL or sequence |
| 3 | No optimistic concurrency control | Last-write-wins on elections | Add version column, ETag header, 409 Conflict |
| 4 | No panic recovery in Go services | One bad request crashes the entire service | Add `recover()` middleware |
| 5 | Audit trail is log-only (stdout) | No persistent record of who did what | Create audit_log table, capture user identity |
| 6 | CORS is `Access-Control-Allow-Origin: *` | Any origin can call the APIs | Restrict to known frontend origins |
| 7 | DB credentials hardcoded as defaults | Password in source code | Remove defaults, require environment variables |
| 8 | DB SSL disabled by default | Unencrypted database connections | Enable `sslmode=require` |

### Important (Should Fix Before Production)

| # | Gap | Risk | Fix |
|---|-----|------|-----|
| 9 | No code splitting/lazy loading | Large initial bundle | Add React.lazy() + route-based splitting |
| 10 | No test coverage metrics | Don't know what's untested | Add c8/istanbul to vitest config |
| 11 | No E2E tests | No browser-level validation | Add Playwright for critical paths |
| 12 | Frontend types use snake_case, Go API uses camelCase | Live mode data contract mismatch | Align on one convention via mappers |
| 13 | No circuit breaker in intelligence→connector | Single failure propagates | Add retry + circuit breaker |
| 14 | No error boundaries on portal/employer/vendor layouts | Unhandled errors show blank screen | Add ErrorBoundary to all layouts |
| 15 | Salary endpoint returns unbounded results | Performance risk for long-tenured members | Add date range or pagination |

### Low Priority (Pre-Enterprise)

| # | Gap | Fix |
|---|-----|-----|
| 16 | No WCAG accessibility attributes | Add aria-labels, roles, keyboard navigation |
| 17 | J&S factors are illustrative placeholders | Obtain actual actuarial tables |
| 18 | No text truncation on member names | Add CSS overflow handling |
| 19 | Calculation traces not persisted | Store traces in audit_log alongside case records |
| 20 | No SSN search despite code comment claiming it | Either implement or remove the comment |

---

## Finding 6: Agent SDK Reality Check

### What's Real

- The Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) is a published npm package
- MCP (Model Context Protocol) is a production standard with tooling
- Claude models support tool use and structured output
- Prompt caching is production-ready

### What's Speculative in the Rearchitecture Sketch

| Claim | Reality |
|-------|---------|
| `import { Claude } from "@anthropic-ai/agent-sdk"` | Wrong package name. Actual: `@anthropic-ai/claude-agent-sdk` |
| `new Claude({ mcpServers: [...], hooks: {...} })` | API surface is speculative — needs to be verified against actual SDK docs |
| "Skills" as markdown workflow documents | Claude Code concept, may not be in the public SDK |
| SDK is production-ready for this use case | SDK is pre-1.0 (0.2.x), designed for Claude Code-like agents (file editing, codebase navigation), not workspace composition |

### Recommendation

Before committing to the Agent SDK, build a **spike** — a 2-day proof that the SDK can:
1. Connect to custom MCP servers
2. Call tools and receive structured results
3. Return a JSON workspace specification
4. Enforce pre-tool-use hooks that block certain actions

If the spike succeeds, proceed with the rearchitecture. If not, the same composition agent can be built directly on the Claude Messages API with tool use — MCP servers still provide value as the integration layer, with or without the Agent SDK wrapper.

---

## Finding 7: What's Actually Strong

The audits weren't all negative. These findings represent genuine architectural strength:

| Strength | Evidence |
|----------|---------|
| **Governing principles hold** | AI never calculates. Rules engine is deterministic. Transparency is real. |
| **Calculation accuracy** | 4 demo cases match hand calculations to the penny. 428+ backend tests. |
| **SQL injection protection** | All queries use parameterized placeholders. Zero concatenation. |
| **Composition engine works** | 13 component types, correct conditional logic, tested for all 4 cases. |
| **Knowledge panel is fully deterministic** | 13 provisions, keyword search, member-specific badges — zero AI dependency. |
| **Demo mode is complete** | Entire app runs offline with cached fixtures. True zero-backend operation. |
| **Connector as sole DB interface** | Clean architectural boundary. No other service touches the database. |
| **Audit trail types are well-designed** | `AuditEntry`, `CalculationTrace`, source references — the transparency backbone is solid. |
| **Two-tier product architecture is natural** | The deterministic frontend is already built. AI is genuinely additive. |

---

## Action Items Summary

### Must Resolve Before Going to Market

| # | Action | Owner | Effort |
|---|--------|-------|--------|
| 1 | Resolve PII data flow — update security architecture with honest framing | Strategy | 1 day |
| 2 | Align pricing strategy — deprecate Business Plan Rev5 pricing, use Tiers strategy | Strategy | 1 day |
| 3 | Remove "AI ensemble" from business plan or scope to future roadmap | Strategy | 1 day |
| 4 | Replace "Data Connector Appliance" with deployment agent (software container) | Strategy | 1 day |
| 5 | Fix prohibited terminology in business plan | Strategy | 1 hour |

### Must Build Before First Deployment

| # | Action | Effort |
|---|--------|--------|
| 6 | Authentication middleware (JWT/OIDC) on all Go services | 3-5 days |
| 7 | Case lifecycle engine (states, transitions, queue, assignment) | 1-2 weeks |
| 8 | Persistent audit trail (audit_log table, user attribution) | 2-3 days |
| 9 | Concurrency control (sequences, version columns, ETags) | 2-3 days |
| 10 | Save/submit actions for refund and death workspaces | 2-3 days |
| 11 | Panic recovery middleware | 1 hour |
| 12 | CORS restriction, DB SSL, credential management | 1 day |

### Should Build for Product Completeness

| # | Action | Effort |
|---|--------|--------|
| 13 | Repository abstraction layer (Phase 1 of DB modernization) | 3-5 days |
| 14 | Domain schema DDL (Phase 2 of DB modernization) | 2-3 days |
| 15 | Agent SDK spike (validate rearchitecture feasibility) | 2 days |
| 16 | Document management (upload, attach, status) | 1 week |
| 17 | Case notes / activity log | 2-3 days |
| 18 | Code splitting / lazy loading | 1-2 days |
| 19 | Frontend-to-API data contract alignment (snake_case vs camelCase) | 2-3 days |
| 20 | E2E test framework (Playwright) | 2-3 days |

---

## Conclusion

The NoUI architecture is sound. The governing principles are genuinely enforced in code. The calculation engine is accurate. The two-tier product strategy (Standard + Intelligence) is commercially viable and architecturally natural.

The gaps are in three categories:
1. **Strategic contradictions** — the documents disagree with each other. Fix by aligning to the Tiers strategy.
2. **Last-mile workflow** — the POC demonstrates the architecture but doesn't complete cases end-to-end. Fix with a Production Readiness Phase.
3. **Production hardening** — security, concurrency, audit. Expected POC debt, well-understood fixes.

None of these require rearchitecting. They require building the next layers on a solid foundation.
