# NoUI — Product Tiers, Cost Resilience, and Pricing Strategy

**Date:** February 28, 2026
**Status:** Strategic decision document

---

## The Key Insight

The current NoUI frontend is **already fully deterministic**. Workspace composition, stage signals, auto-checks, knowledge enhancements, scenario modeling — all of it runs as pure TypeScript rule code with zero AI dependency. The Go rules engine is deterministic. The data layer is deterministic. Demo mode runs entirely client-side with no backend at all.

This means the AI composition layer proposed in the rearchitecture is **additive** — an enhancement on top of a complete, working, deterministic product. It does not replace the core. It makes the core smarter.

This is not an accident. It's the governing principles working as designed:
- *"AI does not execute business rules"* → the rules engine is AI-free
- *"Trust through transparency"* → every calculation shows its formula
- *"AI orchestrates presentation"* → AI enhances how work is shown, not what the numbers are

**Implication:** NoUI is not one product with an AI dependency. It's two product tiers sharing a common foundation.

---

## Two-Tier Product Architecture

```
┌─────────────────────────────────────────────────────────┐
│              NoUI Intelligence (Tier 2)                  │
│                                                         │
│  AI-composed workspaces (Messages API + structured JSON) │
│  Contextual knowledge surfacing                         │
│  Natural language Q&A within workspace                  │
│  Adaptive presentation (proficiency-based)              │
│  Orchestration learning from usage patterns             │
│  Novel situation handling                               │
│                                                         │
│  Variable cost: Claude API (~$0.015-0.035/workspace)    │
│  Requires: internet + API key                           │
│                                                         │
│  DATA POLICY: Member context (name, dates, tier,        │
│  salary) sent to Claude API with Zero Data Retention    │
│  (ZDR). SSN, bank accounts, and medical information     │
│  are NEVER transmitted.                                 │
├─────────────────────────────────────────────────────────┤
│              NoUI Standard (Tier 1)                      │
│                                                         │
│  Static workspace composition (TypeScript rules)        │
│  Full rules engine (Go, deterministic)                  │
│  All 4 portals (staff, member, employer, vendor)        │
│  Knowledge panel (keyword search, member badges)        │
│  Guided workspace (8 stages, checklists, auto-checks)   │
│  Scenario modeler (in-browser DERP rules)               │
│  Template-based correspondence                          │
│  Stage signals (green/amber/red)                        │
│  All process types (retirement, refund, death)          │
│  Demo mode (runs with zero backend)                     │
│                                                         │
│  Fixed cost: infrastructure only (~$300/mo)             │
│  Requires: nothing beyond the deployment                │
│                                                         │
│  DATA POLICY: No data leaves the customer boundary.     │
│  Zero external API calls. All processing is local.      │
└─────────────────────────────────────────────────────────┘
```

**Both tiers share:**
- The same React components, same TypeScript types, same theme system
- The same Go rules engine (connector + intelligence services)
- The same PostgreSQL schema and data layer
- The same test suite (1,100+ tests)
- The same audit trails and calculation transparency
- The same demo mode (cached fixtures, runs offline)

**The ONLY difference:** How workspace composition decisions are made.
- Standard: `composition/rules.ts` — static if/then rules
- Intelligence: Node.js Composition Service — Claude Messages API with structured output reasons about what to show

---

## 1. Countering AI Cost Variability

### The Risk

Claude API pricing has dropped significantly over the past two years (Sonnet went from $15/$75 to $3/$15). But future pricing is uncertain. It could continue dropping. It could spike. New models may have different price/performance tradeoffs. An AI-dependent product tied to a single provider's pricing is a business risk.

### Mitigation Strategy: Seven Layers of Defense

#### Layer 1: Architecture — AI Is Enhancement, Not Foundation

This is the most important layer. Because the deterministic frontend is complete and functional, AI costs going to zero or infinity both have the same impact on the core product: **none**.

- If AI costs drop → margins improve, more features become cost-effective
- If AI costs spike → disable Intelligence tier features, Standard tier continues unchanged
- If the AI provider goes down → Standard tier is unaffected

The AI layer is a value multiplier, not a dependency.

#### Layer 2: Composition Caching

The agent produces a JSON workspace specification. That spec doesn't change unless the member's data or the retirement date changes. Cache it.

```
First visit to member 10001 → agent composes → cache workspace spec
Second visit (same session) → serve from cache → zero API cost
Stage navigation → serve from cache → zero API cost
Data change or cache expiry (15 min) → re-invoke agent
```

Impact: Reduces actual agent invocations by **50-70%**. A staff member working one case for 30 minutes might generate 1 agent call instead of 10.

#### Layer 3: Model Tiering

Not every interaction needs the same model. Route by complexity:

| Interaction | Model | Cost/MTok (output) |
|-------------|-------|-------------------|
| Workspace composition (complex reasoning) | Sonnet 4.6 | $15 |
| Knowledge search (simple retrieval) | Haiku 4.5 | $5 |
| Member lookup (structured data return) | Haiku 4.5 | $5 |
| Q&A explanation (moderate reasoning) | Sonnet 4.6 | $15 |

Haiku is 3x cheaper than Sonnet on output tokens. Routing 40-50% of invocations to Haiku saves 20-25% overall.

#### Layer 4: Prompt Caching

The system prompt + tool definitions (~4,850 tokens) are identical across every invocation. With 10 active users, the cache is effectively permanent during business hours.

- Cache hit: $0.30/MTok (vs $3.00 regular) = **90% savings on the static prefix**
- Over a full day: saves ~$2-3 on a $7 base

#### Layer 5: Usage Caps and Budget Controls

Build usage awareness into the product:

```typescript
// Per-user daily budget
const DAILY_BUDGET_TOKENS = {
  staff: 500_000,      // ~25 workspace compositions
  supervisor: 750_000, // More Q&A, oversight
  portal_member: 100_000, // 3-5 sessions
};

// When budget exhausted → graceful degradation to Standard tier
if (user.dailyTokens >= DAILY_BUDGET_TOKENS[user.role]) {
  return composeWorkspaceStatic(memberId); // Falls back to rules.ts
}
```

This creates a hard ceiling on costs regardless of usage spikes. Users never lose functionality — they get the Standard tier instead of Intelligence.

#### Layer 6: Multi-Provider Readiness

The composition service abstracts the AI provider. The system prompt and JSON schema work with any model that supports structured output. Future options:

| Provider | Model | Approx. Cost | Notes |
|----------|-------|-------------|-------|
| Anthropic | Sonnet 4.6 | $3/$15 per MTok | Current choice |
| Anthropic | Haiku 4.5 | $1/$5 per MTok | Budget option |
| OpenAI | GPT-4o | ~$2.50/$10 per MTok | Alternative |
| AWS Bedrock | Claude or others | Same + markup | Gov cloud option |
| Self-hosted | Open-source LLM | Compute cost only | Maximum control |

The composition output is a JSON workspace specification. Any model that can accept a system prompt and return structured JSON can fill this role. Switching providers is a configuration change, not an architecture change.

#### Layer 7: Contract Structure

Don't pass variable AI costs to the client. Absorb them into fixed pricing with margin:

- **Fixed monthly fee** covers all usage up to a generous cap
- **NoUI bears the API cost risk**, not the pension agency
- **Margin covers variance**: at 82% gross margin, API costs can triple before margins turn negative
- **Annual price locks**: clients get a fixed price for 12-24 months regardless of API pricing changes

If API costs drop (which is the historical trend), margins improve. If they spike, the margin buffer absorbs it. If they spike beyond the buffer, disable Intelligence features and fall back to Standard.

---

## 2. NoUI Standard — The Deterministic Frontend

### What It Is

A complete pension administration platform with zero AI dependency. Every feature runs on deterministic code — TypeScript composition rules, Go rules engine, PostgreSQL data layer. No API keys, no internet dependency for core functionality, no variable costs.

### What Already Exists (Today)

The exploration of the current codebase reveals that **NoUI Standard is essentially already built.** The current frontend in demo mode IS the deterministic product:

| Feature | Status | Notes |
|---------|--------|-------|
| Staff guided workspace (8 stages) | Complete | Static composition, checklists, auto-checks |
| Benefit calculation with formula display | Complete | Go rules engine, penny-accurate |
| Payment options comparison | Complete | All J&S variants, period-certain |
| DRO processing | Complete | Marital fraction, conditional stage |
| Early retirement reduction | Complete | Tier-specific rates, statutory tables |
| Leave payout calculation | Complete | Eligibility logic, AMS impact |
| Knowledge panel (13 provisions) | Complete | Keyword search, member-specific badges |
| Stage signals (green/amber/red) | Complete | Deterministic auto-checks |
| Scenario modeler | Complete | In-browser DERP rules engine |
| Member portal (7-step wizard) | Complete | Dashboard, application, status |
| Employer portal | Complete | Roster, contributions, coordination |
| Vendor portal | Complete | IPR verification, enrollment |
| Death processing (6 stages) | Complete | Notification through case close |
| Refund processing (5-6 stages) | Complete | Vested decision moment |
| Correspondence templates | Complete | Variable substitution |
| Demo mode (zero backend) | Complete | Cached fixtures, runs offline |

### What Needs to Be Formalized

To ship Standard as a product tier, these gaps need attention:

| Gap | Effort | Description |
|-----|--------|-------------|
| Salary row fixtures | Small | Demo mode returns empty `records: []` — need 36-60 monthly rows per case for the SalaryTable component |
| Extended member registry | Medium | Currently 5 fixture members (10001-10004, 10011). A production Standard deployment would connect to the live Go backend, not fixtures. |
| Per-hook fallback | Medium | Currently demo vs live is a global switch. Standard should support mixed mode: live data from Go services, with deterministic composition (no agent). |
| Contribution upload fixtures | Small | CSV validation/remediation demo needs a fixture error set |
| Refund/death cross-referencing | Small | Refund and death fixtures are separate from the main 4 cases |

**Total effort to formalize Standard as a product tier: ~2-3 days.**

The heavy lifting — the composition engine, the rules engine, the workspace UX, the knowledge panel, the portal flows — is already done.

### What Standard Does NOT Include

These features are Intelligence-only — they require AI and have no deterministic equivalent:

| Feature | Why AI-Only |
|---------|-------------|
| Adaptive workspace composition | Reasoning about novel member situations requires inference |
| Natural language Q&A | "Why was this benefit reduced?" requires language understanding |
| Proficiency-based presentation | Adjusting depth based on behavioral patterns requires ML |
| Orchestration learning | Extracting patterns from usage telemetry requires AI analysis |
| Contextual provision surfacing | Going beyond keyword search to understand intent |
| Rule change drafting | Reading governing documents and proposing configurations |

These are genuinely valuable but not essential for daily pension administration. Staff managed pension cases for decades without them.

---

## 3. Business Continuity Guarantee

This is the strategic differentiator for government procurement. Pension agencies fear vendor lock-in more than they fear missing features.

### The Guarantee

> If NoUI ceases operations, AI services become unavailable, or the agency chooses to discontinue the Intelligence tier, all pension administration capabilities continue to function without interruption. The deterministic frontend, rules engine, and data layer operate independently with zero AI dependency.

### How It Works

```
Normal operation:
  React → REST → Node.js Composition → Claude Messages API → Go Services → PostgreSQL
  (AI composes workspaces, full Intelligence features)

If AI unavailable:
  React → composition/rules.ts → Go Services → PostgreSQL
  (Static rules compose workspaces, all Standard features)

If NoUI unavailable:
  React → composition/rules.ts → Go Services → PostgreSQL
  (Agency runs the deployed software independently)

If everything fails:
  React → demo-data.ts (cached fixtures)
  (Application runs offline with last-known data)
```

**Four levels of degradation, each fully functional.** This is ADR-007 made into a product promise.

### Source Code Escrow

For government contracts, offer source code escrow:
- Full source code (React + Go + SQL) deposited with escrow agent
- Released to agency if NoUI ceases operations or breaches SLA
- Agency can self-host and maintain the Standard tier indefinitely
- No AI dependency in the escrowed codebase

---

## 4. Revised Pricing Strategy — Two Tiers

### NoUI Standard

| Component | Price | What's Included |
|-----------|-------|-----------------|
| Platform fee | $1,500/month | Infrastructure, all 4 portals, rules engine, knowledge panel, demo mode |
| Staff seat | $75/month | Full deterministic workspace, guided workflow, scenario modeler |
| Implementation | $20,000-$35,000 | Rules configuration, data migration, training |
| Annual support | 12% of annual platform fee | Rule updates, patches, SLA |

**10-user example:** $1,500 + (10 × $75) = **$2,250/month** ($27,000/year)
Year 1 with implementation: ~$52,000-$62,000

**Operating cost:** ~$300/month (infrastructure only, zero AI cost)
**Gross margin:** 87%

### NoUI Intelligence

| Component | Price | What's Included |
|-----------|-------|-----------------|
| Platform fee | $2,500/month | Everything in Standard + AI composition engine, Messages API integration |
| Staff seat | $125/month | AI-composed workspaces, natural language Q&A, adaptive presentation |
| Portal AI | $500/month | AI-enhanced member/employer portal experience |
| Implementation | $30,000-$50,000 | Standard implementation + composition service configuration, prompt tuning |
| Annual support | 15% of annual platform fee | Rule updates, model updates, prompt optimization |

**10-user example:** $2,500 + (10 × $125) + $500 = **$4,250/month** ($51,000/year)
Year 1 with implementation: ~$81,000-$101,000

**Operating cost:** ~$443/month (infrastructure + Claude API)
**Gross margin:** 90%

### Comparison to Market

| Solution | Year 1 | Year 2+ | AI Features |
|----------|--------|---------|-------------|
| Legacy pension admin | $500K-$2M | $200K-$500K | None |
| Mid-market SaaS | $250K-$500K | $150K-$300K | Limited |
| **NoUI Standard** | **$52K-$62K** | **$29K** | None (deterministic) |
| **NoUI Intelligence** | **$81K-$101K** | **$55K** | Full AI composition |

NoUI Standard is **80-90% cheaper** than alternatives.
NoUI Intelligence is **70-85% cheaper** than alternatives while being more capable.

### Upgrade Path

Agencies start with Standard. When they're comfortable, upgrade to Intelligence:
- Same infrastructure, same data, same rules engine
- Enable the composition agent alongside static rules
- Staff sees AI features immediately — no retraining, same workspace layout
- Downgrade back to Standard at any time with zero disruption

This removes the adoption barrier. Nobody has to bet on AI on day one.

---

## 5. Architecture Implications

### The Runtime Switch

```typescript
// services/frontend/src/composition/index.ts

type CompositionMode = 'standard' | 'intelligence';

export async function composeWorkspace(
  memberId: string,
  context: CompositionContext,
  mode: CompositionMode = getCompositionMode()
): Promise<WorkspaceSpec> {

  if (mode === 'intelligence') {
    try {
      // Try AI composition with timeout
      const spec = await agentCompose(memberId, context, { timeoutMs: 5000 });
      return { ...spec, composedBy: 'agent' };
    } catch {
      // Graceful degradation to Standard
      console.warn('Agent composition failed, falling back to static rules');
      return staticCompose(memberId, context);
    }
  }

  // Standard: deterministic composition
  return staticCompose(memberId, context);
}

function staticCompose(memberId: string, context: CompositionContext): WorkspaceSpec {
  // This is today's composition/rules.ts — unchanged
  const result = composeWorkspaceRules(context.member, context);
  return {
    components: result.components,
    rationale: result.reason,
    composedBy: 'static-rules',
  };
}
```

### What Gets Built for Each Tier

| Component | Standard | Intelligence |
|-----------|----------|-------------|
| `composition/rules.ts` | Primary | Fallback |
| Node.js composition service | Not needed | Required |
| Claude Messages API | Not needed | Required |
| React components | Same | Same |
| Go rules engine | Same | Same |
| Knowledge panel | Keyword search | AI-contextual search |
| Q&A | Not available | Agent-powered |
| Telemetry | Basic analytics | Feeds agent learning |

### Build Sequence

1. **Formalize Standard** (2-3 days) — fill fixture gaps, add per-hook fallback, document the tier
2. **Build Intelligence** (3-5 days) — Node.js composition service, Messages API integration, system prompt, JSON schema
3. **Wire the switch** (1 day) — `CompositionMode` toggle, graceful degradation
4. **Validate parity** (1-2 days) — AI composition output matches static rules for all 4 demo cases

---

## 6. Long-Term Cost Trajectory

### AI pricing trend (historical)

| Date | Model | Input/MTok | Output/MTok |
|------|-------|-----------|-------------|
| Mar 2024 | Claude 3 Sonnet | $3 | $15 |
| Jun 2024 | Claude 3.5 Sonnet | $3 | $15 |
| Oct 2025 | Claude 3.5 Haiku | $0.80 | $4 |
| Feb 2026 | Claude Sonnet 4.6 | $3 | $15 |
| Feb 2026 | Claude Haiku 4.5 | $1 | $5 |

Sonnet-class pricing has been stable at $3/$15 for two years. Haiku-class has dropped. The trend is: **frontier stays flat, efficient models get cheaper.** As composition becomes more routine (not frontier), it migrates to cheaper model classes.

### Three cost scenarios over 5 years

| Year | Optimistic (costs halve) | Stable (no change) | Pessimistic (costs double) |
|------|------------------------|-------------------|--------------------------|
| 1 | $1,716 | $1,716 | $1,716 |
| 2 | $858 | $1,716 | $3,432 |
| 3 | $429 | $1,716 | $6,864 |
| 4 | $215 | $1,716 | $13,728 |
| 5 | $107 | $1,716 | $27,456 |

(Annual API cost for 10 staff users + portals)

**Even in the pessimistic scenario** (costs double every year for 5 years), the Year 5 API cost is $27.5K — still cheaper than a single legacy pension admin license. And the Standard tier is always available as a zero-API-cost fallback.

### Break-even analysis: When does Intelligence stop being worth it?

At the recommended Intelligence pricing ($4,250/month revenue), the tier remains profitable as long as API costs stay under ~$3,700/month. That would require current costs to increase by **26x** — an implausible scenario given industry trends.

If it ever happens, disable Intelligence, revert to Standard, and margins remain at 87%.

---

## 7. Summary

| Question | Answer |
|----------|--------|
| How do we counter AI cost variability? | Seven-layer defense: AI-as-enhancement architecture, composition caching, model tiering, prompt caching, usage caps, multi-provider readiness, fixed-price contracts |
| What if AI costs become too high? | Disable Intelligence tier, fall back to Standard. Zero disruption. |
| What if AI is unavailable? | Standard tier runs independently. No AI dependency in core product. |
| What if NoUI is unavailable? | Source code escrow. Agency self-hosts Standard tier. |
| Is the deterministic frontend a lot of work? | **It's already built.** 2-3 days to formalize as a product tier. |
| What's the pricing model? | Two tiers: Standard ($2,250/mo) and Intelligence ($4,250/mo). Both 80%+ cheaper than market. |
| Which tier do agencies start with? | Standard. Upgrade to Intelligence when comfortable. Downgrade anytime. |
