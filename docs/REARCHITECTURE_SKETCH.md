# NoUI DERP — Rearchitected Prototype Sketch

**Date:** February 28, 2026
**Status:** Decision document — not yet approved for implementation

---

## The Core Insight

Instead of spawning Claude Code subprocesses (Agent SDK) or building MCP server wrappers, we use the **Anthropic Messages API** with `output_config.format.type = "json_schema"` to produce structured workspace compositions. This is simpler, cheaper, faster, and has built-in Zero Data Retention (ZDR). Today's codebase simulates AI orchestration with static if/then composition rules. The rearchitecture replaces the simulation with a single API call that returns a typed workspace specification — while preserving every governing principle.

```
TODAY                                    REARCHITECTED
─────                                    ──────────────
React → REST → Go Workspace Service      React → REST → Node.js Composition → Claude Messages API → Go Services
        (static composition rules)               (AI-composed workspaces, structured JSON output)

React → REST → Go Intelligence Service   Same Go service, called by Node.js composition layer
        (deterministic rules engine)      (AI NEVER replaces this)

React → REST → Go Connector Service      Same Go service, called by Node.js composition layer
        (sole DB interface)               (AI NEVER replaces this)
```

**What changes:** The workspace composition layer — from hardcoded rules to a Node.js service that gathers member context from Go services, sends it to the Claude Messages API with a JSON schema constraint, and returns a structured workspace specification.

**What stays:** The rules engine. The connector. The type system. The audit trails. The governing principles. All of it.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  (same components, same theme system, same types)                │
│                                                                  │
│  Frontend calls POST /api/v1/workspace/compose on the            │
│  Node.js composition service. Returns a typed WorkspaceSpec.     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    Node.js Composition Service
                    (REST endpoint + Claude Messages API)
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐     │
     │  Connector    │ │Intelligence │     │
     │  (Go, :8081)  │ │ (Go, :8082) │     │
     └───────────────┘ └─────────────┘     │
              │              │              │
         PostgreSQL    Statutory       Claude Messages API
                       Tables          (structured output,
                                        ZDR enabled)
```

---

## Layer 1: Go Services (Unchanged)

The existing Go services stay exactly as they are. The Node.js composition service calls them via their existing REST APIs. No MCP wrappers needed.

### Connector Service (Go, :8081)

Sole database interface. The composition service calls these endpoints to gather member context before sending it to Claude.

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/members/{id}` | Member profile, tier, status, DQ flags |
| `GET /api/v1/members/{id}/employment` | Employment history with service credit breakdown |
| `GET /api/v1/members/{id}/salary` | Salary history with AMS calculation |
| `GET /api/v1/members/{id}/service-credit` | Detailed service credit: earned, purchased, military, leave |
| `GET /api/v1/members/{id}/beneficiaries` | Beneficiary records with completeness check |
| `GET /api/v1/members/{id}/dros` | Domestic Relations Order records |
| `GET /api/v1/members/{id}/contributions` | Contribution history with gap detection |
| `GET /api/v1/members/search?q=` | Search members by name, ID, or SSN |
| `POST /api/v1/members/{id}/retirement-election` | Save retirement election and create case |

### Intelligence Service (Go, :8082)

Deterministic rules engine. These endpoints return calculation results with full audit trails. AI NEVER replaces these.

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/eligibility/evaluate` | Retirement eligibility (normal, early, deferred, Rule of 75/85) |
| `POST /api/v1/benefit/calculate` | Monthly retirement benefit with formula transparency |
| `POST /api/v1/benefit/options` | J&S and period-certain payment alternatives |
| `POST /api/v1/benefit/scenario` | Model multiple retirement dates with projections |
| `POST /api/v1/dro/calculate` | DRO marital fraction benefit split |
| `POST /api/v1/refund/calculate` | Contribution refund with compound interest |
| `POST /api/v1/death-benefit/calculate` | Survivor/death benefit |
| `POST /api/v1/estimate/full` | Full pipeline: eligibility + benefit + options + IPR + death benefit |

---

## Layer 2: Node.js Composition Service (Claude Messages API)

This is the heart of the rearchitecture. The composition service replaces the static `composition/rules.ts` and Go `workspace/main.go` with a single Claude Messages API call that returns a structured workspace specification.

### How It Works

1. The Node.js service receives a composition request (member ID + process type)
2. It calls the Go services (connector + intelligence) to gather all member context
3. It sends a single Messages API request with:
   - A system prompt encoding composition rules and governing principles
   - The gathered member context as user message content
   - `output_config.format.type = "json_schema"` with the WorkspaceSpec schema
4. Claude returns a structured JSON workspace specification — guaranteed to conform to the schema
5. No multi-turn agent loop. No tool use. One request, one response.

### Implementation

```typescript
// composition/compose.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function composeWorkspace(
  memberId: string,
  processType: string,
  memberContext: MemberContext // pre-fetched from Go services
): Promise<WorkspaceSpec> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: COMPOSITION_SYSTEM_PROMPT,  // encodes all composition rules + governance
    messages: [{
      role: "user",
      content: formatMemberContext(memberContext, processType),
    }],
    output_config: {
      format: {
        type: "json_schema",
        json_schema: WORKSPACE_SPEC_SCHEMA, // TypeScript-derived JSON Schema
      },
    },
  });

  return JSON.parse(response.content[0].text) as WorkspaceSpec;
}
```

### Why This Is Better Than Agent SDK + MCP

| Dimension | Agent SDK + MCP | Messages API + Structured Output |
|-----------|----------------|----------------------------------|
| **Complexity** | 3 MCP server processes + agent loop + hooks | 1 Node.js service + 1 API call |
| **Latency** | 3-8 tool calls = 3-8 API round-trips | 1 API call, ~1-2 seconds |
| **Cost** | ~$0.04-0.09 per composition (multi-turn) | ~$0.015-0.035 per composition (single turn) |
| **Data safety** | Member data in tool call transcripts | ZDR (Zero Data Retention) built in |
| **Output reliability** | Free-form text, must parse | Schema-constrained, guaranteed valid JSON |
| **Infrastructure** | 3 MCP servers + agent runtime | Standard HTTP client |
| **Governance** | Hooks to prevent AI calculations | System prompt constraints + schema (AI never sees raw calc endpoints) |

### System Prompt (Composition Rules + Governance)

The system prompt encodes all composition logic and governing principles. It is structured as sections that replace the Agent SDK "Skills" concept:

```markdown
# Composition Agent — DERP Pension Workspace

You compose context-sensitive workspaces for pension administration.
You receive pre-fetched member data and calculation results.
You return a structured workspace specification.

## Your Role
You decide WHAT to show. The rules engine has already decided WHAT THE NUMBERS ARE.
You NEVER calculate benefits, evaluate eligibility, or make determinations.
All calculation results are provided in the input — you compose the workspace from them.

## Composition Rules
- ALWAYS include: member-banner, alert-bar
- Include leave-payout component ONLY for Tier 1/2 members hired before 2010
- Include dro-impact stage ONLY when DRO records exist
- Include early-retirement-reduction ONLY when reduction factor < 1.0
- Include vested-decision stage in refund process ONLY when member is vested

## Process: Retirement Application
[Stage composition rules for retirement workflow — 8 stages...]

## Process: Contribution Refund
[Stage composition rules for refund workflow — 5-6 stages...]

## Process: Death & Survivor
[Stage composition rules for death workflow — notification through case close...]

## CRITICAL CONSTRAINTS
- All calculations are pre-computed and provided in the input
- You MUST NOT perform arithmetic on pension amounts
- You MUST include rationale for every composition decision
- You MUST surface all DQ flags from the provided data
```

### Structured Output Schema

The `output_config.format` uses a JSON Schema derived from the TypeScript `WorkspaceSpec` type:

```json
{
  "type": "object",
  "properties": {
    "stages": { "type": "array", "items": { "$ref": "#/$defs/Stage" } },
    "components_per_stage": { "type": "object" },
    "rationale": { "type": "object", "description": "Why each component was included/excluded" },
    "alerts": { "type": "array", "items": { "$ref": "#/$defs/Alert" } },
    "knowledge_context": { "type": "array", "items": { "$ref": "#/$defs/Provision" } }
  },
  "required": ["stages", "components_per_stage", "rationale", "alerts"]
}
```

Because the schema is enforced at the API level, the response is guaranteed valid — no parsing failures, no unexpected formats.

### What Structured Composition Enables That Static Rules Cannot

1. **Novel situations**: Member has an unusual combination (military + purchased + DRO + early). Static rules need explicit handling for every combo. The composition model reasons about it from the system prompt rules.

2. **Contextual knowledge**: The model selects relevant DERP provisions for the knowledge panel based on the member's specific situation — not just pattern-matched by stage ID.

3. **Adaptive presentation**: Using simulation-derived patterns (expert vs. novice behavior) included in the prompt, the model adjusts depth, ordering, and default expansion based on the user's demonstrated proficiency.

4. **Natural language interaction**: A separate Messages API call (using the same member context) lets staff ask "why was this member's benefit reduced?" and get an explanation drawn from the calculation trace.

### Governance Without Hooks

The Agent SDK approach required pre/post-tool-use hooks to prevent the AI from executing business rules. With Messages API + structured output, governance is simpler:

1. **AI never sees raw endpoints.** The Node.js composition service calls Go services and pre-fetches all data. Claude receives the results, not the ability to call services.
2. **System prompt constraints.** The prompt explicitly states: "All calculations are pre-computed and provided in the input. You MUST NOT perform arithmetic on pension amounts."
3. **Schema constraints.** The output schema has no field for calculation results — only composition decisions (which stages, which components, rationale). The AI literally cannot return a calculated number in a schema-constrained field.
4. **Audit trail.** The Node.js service logs every composition request: input context, API response, latency, and the rationale from the structured output.

---

## Layer 3: Frontend Integration

The frontend calls a single REST endpoint. No Agent SDK dependency, no streaming complexity.

```
React → POST /api/v1/workspace/compose → Node.js Composition → Claude Messages API
                                          ↓                          ↓
                                     Go Services            Structured WorkspaceSpec
                                   (data + calcs)
```

### Implementation

```typescript
// hooks/useWorkspace.ts
import { useQuery } from '@tanstack/react-query';

export function useWorkspace(memberId: string, processType: string) {
  return useQuery({
    queryKey: ['workspace', memberId, processType],
    queryFn: () =>
      fetch('/api/v1/workspace/compose', {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, process_type: processType }),
      }).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — same member context
  });
}

// In the workspace component:
function GuidedWorkspace({ memberId }: { memberId: string }) {
  const { data: workspace, isLoading } = useWorkspace(memberId, 'retirement');

  // workspace.stages — AI-composed stage list
  // workspace.components_per_stage — which components per stage
  // workspace.rationale — why each component appears
  // workspace.alerts — DQ flags, deadlines
  // workspace.knowledge_context — relevant provisions

  return <WorkspaceRenderer workspace={workspace} />;
}
```

The frontend doesn't change at all — it just gets a richer workspace specification from a smarter backend. Falls back to static composition rules (ADR-007) if the composition service is unavailable.

---

## What Stays Exactly The Same

| Component | Why It Stays |
|-----------|-------------|
| Go Connector Service | Sole DB interface — architecture-agnostic |
| Go Intelligence Service | Deterministic rules engine — AI NEVER replaces this |
| PostgreSQL schema | Data layer unchanged |
| React components | Same components render the workspace — only the composition source changes |
| TypeScript types | Clean domain model — preserved wholesale |
| Theme system | Visual layer — independent of composition |
| Demo fixtures | Test oracle — validates AI composition against known-good results |
| Test suite (1,100+ tests) | Regression protection — validates the migration |
| Simulation telemetry schema | Production-quality event types — feeds composition prompt context |
| Audit trail types | Transparency backbone — preserved and extended |

---

## What Changes

| Component | Current | Rearchitected |
|-----------|---------|---------------|
| Workspace composition | Static Go rules + static TS rules | Node.js service + Claude Messages API (structured output) |
| API integration | Direct REST calls from React | React calls composition endpoint; Node.js calls Go services |
| Knowledge panel | Pattern-matched by stage ID | Claude selects provisions contextually from member situation |
| Adaptivity | Fixed composition per member attributes | Claude adjusts based on proficiency signals in prompt |
| Operational learning | Simulation generates reports | Simulation feeds composition prompt context |
| Staff Q&A | Not available | Separate Messages API call with member context answers questions |

---

## Migration Path

### Phase 1: Node.js Composition Service (2-3 days)
- Build Node.js service that calls Go services for member data + calculations
- Send gathered context to Claude Messages API with WorkspaceSpec JSON schema
- Frontend calls new endpoint, falls back to static composition on failure (ADR-007)
- Validate: AI-composed workspace matches static composition for all 4 demo cases
- Zero infrastructure overhead — just a Node.js process and an API key

### Phase 2: Knowledge + Q&A (2-3 days)
- Enrich system prompt with DERP provisions indexed by topic and tier
- Knowledge panel powered by Claude's contextual provision selection
- Staff Q&A via separate Messages API call (same member context, different system prompt)

### Phase 3: Adaptive Composition (ongoing)
- Feed simulation-derived patterns into composition prompt context
- Claude adjusts presentation depth based on user proficiency signals
- Handles novel member situations without code changes

### Phase 4: MCP Integration (optional future)
- If the composition service needs to call additional data sources at runtime (beyond the pre-fetched Go service data), MCP tools can be added to give Claude direct access to specific services
- This is an optimization, not a requirement — the pre-fetch pattern handles all current use cases

---

## Decision Points

Before implementing, we need to decide:

### 1. Demo Mode Story
- Currently: demo mode serves cached fixtures, no backend needed.
- With Messages API: demo mode needs either (a) a running composition service, or (b) cached composition responses.
- **Recommendation:** Preserve demo mode via cached composition responses (same pattern as today's fixtures).

### 2. Model Selection
- Workspace composition: Sonnet 4 (fast, cost-effective, sufficient for structured composition)
- Q&A / explanation: Sonnet 4 or Haiku 4.5 depending on latency needs
- **Never Opus for runtime composition** — too slow, too expensive for interactive use

### 3. Cost Model
- Each workspace composition = 1 Messages API call (~5,000-7,500 input tokens, ~1,500-2,500 output tokens)
- At Sonnet 4 pricing: ~$0.015-0.035 per workspace composition
- Staff processes ~20-30 cases/day = $0.30-1.05/day per staff member
- Acceptable for enterprise POC; optimize with caching in production

### 4. Scope for POC v2
- Rearchitect only the staff workspace (flagship), keep portal/employer/vendor as-is
- **Recommendation:** Staff workspace only. If it works there, extend later.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Claude produces wrong composition | Validate against static rules for all 4 demo cases; graceful fallback to static rules (ADR-007) |
| Claude tries to calculate benefits | System prompt prohibits it; schema has no calculation fields; AI receives pre-computed results only |
| Latency | Single API call (~1-2 seconds); no multi-turn loop; composition caching for repeat visits |
| Claude hallucinates provision text | Provisions included in prompt are verified; schema constrains output to known provision IDs |
| Demo mode breaks | Cache composition responses as fixtures; demo mode works offline |
| Cost at scale | Composition caching (same member + date = cached result); prompt caching for system prompt |

---

## Measuring Success

The rearchitected prototype succeeds if:

1. **Parity**: AI-composed workspaces match static composition for all 4 demo cases
2. **Transparency preserved**: Every composition decision has a rationale; every calculation has an audit trail
3. **Governing principles enforced**: AI never produces calculation values — verified by schema constraints and adversarial testing
4. **Novel handling**: Claude correctly composes for a member situation NOT in the static rules (e.g., military + purchased + DRO + early + leave payout)
5. **Knowledge integration**: Claude surfaces contextually relevant provisions without stage-ID pattern matching
6. **Latency**: Workspace renders within 3 seconds (single API call, ~1-2 seconds typical)
7. **Fallback works**: If the composition service fails, the system degrades to static composition gracefully

---

## File Structure

```
noui-derp-poc/
├── services/
│   ├── connector/          # UNCHANGED — Go, :8081
│   ├── intelligence/       # UNCHANGED — Go, :8082
│   ├── workspace/          # DEPRECATED — replaced by composition service
│   ├── frontend/           # MINIMAL CHANGES — new useWorkspace hook, rest same
│   │
│   └── composition/        # NEW — Node.js composition service
│       ├── server.ts        # HTTP endpoint (POST /api/v1/workspace/compose)
│       ├── compose.ts       # Claude Messages API call with structured output
│       ├── context.ts       # Fetches member data from Go services
│       ├── system-prompt.ts # Composition rules + governance (all process types)
│       ├── schema.ts        # WorkspaceSpec JSON Schema (derived from TS types)
│       ├── audit.ts         # Logs composition requests + responses
│       ├── fallback.ts      # Static composition rules (ADR-007 graceful degradation)
│       └── package.json
```
