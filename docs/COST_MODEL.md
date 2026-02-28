# NoUI DERP — Production Cost Model & Pricing Strategy

**Date:** February 28, 2026
**Architecture:** Node.js Composition Service with Claude Messages API + structured outputs
**Scope:** 10 staff end users + self-service member/employer portals

---

## 1. API Pricing Reference (Claude, February 2026)

| Model | Input | Output | Cache Write (5m) | Cache Hit | Batch Input | Batch Output |
|-------|-------|--------|------------------|-----------|-------------|--------------|
| **Sonnet 4.6** | $3/MTok | $15/MTok | $3.75/MTok | $0.30/MTok | $1.50/MTok | $7.50/MTok |
| **Haiku 4.5** | $1/MTok | $5/MTok | $1.25/MTok | $0.10/MTok | $0.50/MTok | $2.50/MTok |

MTok = million tokens. Tool use adds 346 tokens system prompt overhead per request.

Source: [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

---

## 2. Token Budget Per Composition Request

Each "composition" is a single Messages API call — the Node.js service pre-fetches member data from Go services, sends it with the system prompt, and receives a structured workspace JSON response. No multi-turn agent loop.

### What consumes tokens

| Component | Tokens | Notes |
|-----------|--------|-------|
| System prompt (composition rules + governance) | ~2,500 | Cacheable (identical across all calls) |
| JSON schema definition (WorkspaceSpec) | ~500 | Cacheable (part of output_config) |
| **Static prefix total** | **~3,000** | **Cached after first call** |
| Member context (profile, employment, salary, service credit) | ~2,000-3,500 | Varies by member complexity |
| Calculation results (eligibility, benefit, options) | ~1,000-2,000 | Pre-fetched from Go services |
| **Total input per composition** | **~5,000-7,500** | |
| Structured workspace specification (JSON output) | ~1,500-2,500 | Schema-constrained |

### Token estimates by process type

| Process | Input Tokens | Output Tokens | Est. Cost (Sonnet 4, cached) |
|---------|-------------|--------------|---------------------------|
| **Retirement workspace** (no DRO) | ~6,500 | ~2,200 | $0.034 |
| **Retirement workspace** (with DRO) | ~7,500 | ~2,500 | $0.039 |
| **Death workspace** | ~5,000 | ~1,500 | $0.024 |
| **Refund workspace** | ~4,500 | ~1,200 | $0.019 |
| **Member portal wizard** | ~6,000 | ~1,800 | $0.028 |
| **Member lookup** (quick) | ~4,000 | ~800 | $0.013 |
| **Knowledge/Q&A** (in-workspace) | ~5,500 | ~500 | $0.009 |
| **Employer contribution** | ~4,500 | ~1,000 | $0.016 |

### Prompt caching impact

The static prefix (~3,000 tokens) is identical across all compositions and cacheable for 5 minutes. With 10 staff users active during business hours, cache hits are nearly continuous.

- First call: cache write (3,000 tokens at $3.75/MTok = $0.011)
- Subsequent calls within 5 min: cache hits (3,000 at $0.30/MTok = $0.001)
- **Caching saves ~90% on the static prefix** ($0.001 vs $0.009 for regular pricing)

During active hours (10 users, ~10 compositions/user/hour), the system prompt cache is effectively permanent.

---

## 3. Daily Usage Model — 10 Staff Users

### Usage assumptions (derived from simulation framework)

DERP context: ~12,000 members, ~400-500 retirements/year, ~100 refunds/year, ~50 death cases/year.

| Activity | Per User/Day | Team of 10/Day | Notes |
|----------|-------------|----------------|-------|
| Retirement workspace opens | 3-5 | 40 | Primary workflow |
| Death workspace opens | 0-1 | 10 | Lower volume |
| Refund workspace opens | 0-1 | 10 | Lower volume |
| Member lookups (quick view) | 5-10 | 50 | Inquiries, verification |
| In-workspace Q&A | 3-5 | 40 | "Why was benefit reduced?" etc. |
| Knowledge searches | 2-4 | 30 | Provision lookups |
| **Total invocations** | **~15-25** | **~180** | |

### Daily token consumption

| Activity | Count | Input Tokens | Output Tokens |
|----------|-------|-------------|---------------|
| Retirement workspace | 40 | 260,000 | 88,000 |
| Death workspace | 10 | 50,000 | 15,000 |
| Refund workspace | 10 | 45,000 | 12,000 |
| Member lookup | 50 | 200,000 | 40,000 |
| In-workspace Q&A | 40 | 220,000 | 20,000 |
| Knowledge search | 30 | 165,000 | 15,000 |
| **Daily total** | **180** | **940,000** | **190,000** |

### Daily cost — three scenarios

**Scenario A: Sonnet 4, no caching (worst case)**

| | Tokens | Rate | Cost |
|---|--------|------|------|
| Input | 0.94M | $3.00/MTok | $2.82 |
| Output | 0.19M | $15.00/MTok | $2.85 |
| **Daily** | | | **$5.67** |
| **Monthly (22 days)** | | | **$125** |
| **Annual** | | | **$1,497** |

**Scenario B: Sonnet 4, with prompt caching (expected)**

Caching model: ~40% of input tokens are cacheable static prefix (system prompt + schema). Of those, ~90% are cache hits (active hours), ~10% cache writes (cache expiry).

| | Tokens | Rate | Cost |
|---|--------|------|------|
| Cache writes | 0.038M | $3.75/MTok | $0.14 |
| Cache hits | 0.338M | $0.30/MTok | $0.10 |
| Regular input | 0.564M | $3.00/MTok | $1.69 |
| Output | 0.19M | $15.00/MTok | $2.85 |
| **Daily** | | | **$4.78** |
| **Monthly (22 days)** | | | **$105** |
| **Annual** | | | **$1,262** |

**Scenario C: Hybrid model — Haiku for simple tasks, Sonnet for complex (optimized)**

Route member lookups and knowledge searches (80/180 compositions) to Haiku 4.5; keep workspace compositions and Q&A on Sonnet 4.

| | Tokens | Rate | Cost |
|---|--------|------|------|
| **Sonnet portion** (100 compositions) | | | |
| Cache writes | 0.021M | $3.75/MTok | $0.08 |
| Cache hits | 0.189M | $0.30/MTok | $0.06 |
| Regular input | 0.365M | $3.00/MTok | $1.10 |
| Output | 0.135M | $15.00/MTok | $2.03 |
| **Haiku portion** (80 compositions) | | | |
| Cache writes | 0.017M | $1.25/MTok | $0.02 |
| Cache hits | 0.149M | $0.10/MTok | $0.01 |
| Regular input | 0.199M | $1.00/MTok | $0.20 |
| Output | 0.055M | $5.00/MTok | $0.28 |
| **Daily** | | | **$3.78** |
| **Monthly (22 days)** | | | **$83** |
| **Annual** | | | **$998** |

---

## 4. Self-Service Portal Cost (Member + Employer)

Portal users are not counted as "end users" — they're plan members and employers using self-service features. Their volume is additive to staff costs.

### Member portal

DERP context: 12,000 members. At any given time, maybe 50-100 are actively exploring retirement.

| Activity | Daily Volume | Input | Output | Daily Cost (Sonnet 4) |
|----------|-------------|-------|--------|-------------------|
| Dashboard benefit estimate | 30 | 180,000 | 54,000 | $1.35 |
| What-if calculator | 20 | 100,000 | 24,000 | $0.66 |
| Application wizard | 5 | 30,000 | 9,000 | $0.23 |
| Status check | 15 | 60,000 | 12,000 | $0.36 |
| **Subtotal** | **70** | | | **$2.60/day** |

### Employer portal

~30 city departments reporting contributions monthly. Most activity concentrates in 2-3 days/month.

| Activity | Daily Volume (avg) | Input | Output | Daily Cost (Haiku) |
|----------|-------------------|-------|--------|-------------------|
| Contribution upload + review | 5 | 22,500 | 5,000 | $0.05 |
| Roster lookup | 10 | 40,000 | 8,000 | $0.08 |
| **Subtotal** | **15** | | | **$0.13/day** |

### Combined portal cost

| | Monthly | Annual |
|---|---------|--------|
| Member portal (Sonnet 4) | $57 | $686 |
| Employer portal (Haiku) | $3 | $34 |
| **Portal total** | **$60** | **$720** |

---

## 5. Total Cost of Delivery

### Monthly operating cost

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| **Claude API — Staff** (10 users, optimized) | $83 | Scenario C: Haiku/Sonnet hybrid |
| **Claude API — Member portal** | $57 | Sonnet 4, ~70 sessions/day |
| **Claude API — Employer portal** | $3 | Haiku, ~15 sessions/day |
| **Infrastructure** (compute, DB, networking) | $200-400 | 2 Go services + Node.js composition + PG |
| **Monitoring & logging** | $50-100 | Telemetry pipeline, audit storage |
| **Total operating cost** | **$393-643/mo** | |

### Scale sensitivity

| Team Size | Staff API | Portal API | Infrastructure | Total Monthly |
|-----------|-----------|-----------|---------------|--------------|
| 5 users | $42 | $60 | $250 | ~$352 |
| **10 users** | **$83** | **$60** | **$300** | **~$443** |
| 25 users | $208 | $100 | $400 | ~$708 |
| 50 users | $415 | $175 | $600 | ~$1,190 |

API cost scales linearly. Infrastructure has a flat base + marginal cost per user.

---

## 6. Competitive Pricing Context

### What pension systems cost today

| Solution | Typical Annual Cost | Per-Member/Month |
|----------|-------------------|-----------------|
| Legacy pension admin (PensionGold, Vitech V3) | $500K-$2M+ | $3.50-$14.00 |
| Mid-market SaaS pension platforms | $200K-$500K | $1.50-$3.50 |
| Custom-built (development + maintenance) | $300K-$1M first year, $100K-$300K/yr ongoing | varies |

DERP's ~12,000 members puts them in the **mid-market** range. A system like this would typically cost **$200K-$500K/year** in the current market.

### NoUI cost advantage

Our total operating cost is **~$443/month** (~$5,300/year) for 10 staff users + full portal. That's **38-95x cheaper** than the competition's operating cost. Even adding development and support labor, the margin is extraordinary.

---

## 7. Pricing Strategy Options

### Option 1: Per-User Subscription (Simple)

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Staff User** | $150/user/month | Full workspace, all processes, Q&A, knowledge | DERP staff analysts |
| **Supervisor** | $200/user/month | Staff features + oversight dashboards, audit review | Supervisors, management |
| **Portal** (member + employer) | $500/month flat | Self-service for all plan members and employers | Unlimited portal users |

**10-user example:** 8 staff × $150 + 2 supervisors × $200 + portal $500 = **$2,100/month** ($25,200/year)

Margin at $443 operating cost: **~$1,657/month (79%)**

### Option 2: Per-Member Platform Fee (Industry Standard)

| Plan Size | Per Member/Month | Includes |
|-----------|-----------------|----------|
| Up to 5,000 members | $1.50 | All staff seats, portals, full platform |
| 5,001 - 15,000 | $1.25 | Volume discount |
| 15,001 - 50,000 | $1.00 | Enterprise scale |
| 50,000+ | Custom | Negotiated |

**DERP example (12,000 members):** 12,000 × $1.25 = **$15,000/month** ($180,000/year)

Margin at $443 operating cost: **~$14,557/month (97%)**

This pricing is **still 50-75% cheaper than competitors** while being dramatically more capable.

### Option 3: Hybrid — Base Platform + Per-User (Recommended)

| Component | Price | Rationale |
|-----------|-------|-----------|
| **Platform fee** | $2,000/month | Covers infrastructure, portal, base AI |
| **Staff seat** | $100/user/month | Covers per-user API consumption |
| **Implementation** | $25,000-$50,000 one-time | Rules configuration, data migration, training |
| **Annual support** | 15% of platform fee | Ongoing maintenance, rule updates |

**DERP example:**
- Platform: $2,000/month
- 10 staff seats: $1,000/month
- **Total: $3,000/month** ($36,000/year)
- Implementation: $35,000 one-time
- **Year 1: $71,000 | Year 2+: $40,140**

Margin at $443/month operating cost: **~$2,557/month (85%)**

**Compared to alternatives:**
- 80-85% cheaper than legacy systems ($200K-$500K/year)
- Dramatically more capable (AI-composed workspaces, knowledge panels, transparency)
- Faster implementation (weeks not months)

---

## 8. Cost Optimization Levers

If costs need to come down further (larger deployments, budget-constrained clients):

| Lever | Savings | Tradeoff |
|-------|---------|----------|
| **Prompt caching** (already modeled) | 30-40% on input | None — always use this |
| **Haiku for simple tasks** (already modeled) | 15-20% overall | Slightly less nuanced composition for lookups |
| **Composition caching** — cache workspace specs for same member + date | 40-60% reduction in API calls | Stale data if member record changes; TTL of 5-15 min mitigates |
| **Batch API** for overnight processing | 50% off API costs | Only for non-interactive work (reports, batch DQ checks) |
| **Smart routing** — skip AI for deterministic cases | 20-30% reduction | Requires maintaining parallel static composition path |

### Composition caching (biggest lever)

When the same staff member navigates between stages of the same case, the workspace spec doesn't change. Cache the composition output and only re-invoke when:
- Member data changes
- Retirement date changes
- Staff requests a fresh composition
- Cache TTL expires (15 minutes)

This could reduce actual composition requests from 180/day to ~60-80/day — cutting API costs by 50-60%.

**With composition caching, optimized monthly cost: ~$40-55** for API.

---

## 9. Unit Economics Summary

| Metric | Value |
|--------|-------|
| Cost to compose one workspace | $0.015-0.035 |
| Cost per staff member per day | $0.38-0.57 |
| Cost per staff member per month | $8-13 |
| API cost per plan member per month | $0.01-0.03 |
| Total operating cost (10 users + portals) | $443/month |
| Revenue at recommended pricing | $3,000/month |
| Gross margin | 85% |
| Breakeven point | 2 staff users |

### Stress test: What if usage doubles?

| Scenario | API Cost | Total Operating | Margin at $3K revenue |
|----------|----------|----------------|----------------------|
| Normal (10 users, 180 comp/day) | $143/mo | $443/mo | 85% |
| Heavy (10 users, 360 comp/day) | $286/mo | $586/mo | 80% |
| Peak (10 users, 500 comp/day) | $397/mo | $697/mo | 77% |

Even at 3x normal usage, the economics hold.

---

## 10. Recommendation

**Use Option 3 (Hybrid Platform + Per-User) pricing:**

- **$2,000/month platform fee** — covers infrastructure, portal, knowledge base, rule maintenance
- **$100/month per staff seat** — covers AI composition costs with generous margin
- **$35,000 implementation** — rules configuration, data migration, training
- **Year 1 total: ~$71,000** (vs. $200K-$500K for alternatives)
- **Year 2+ total: ~$40,000** (vs. $100K-$300K maintenance for alternatives)

This pricing is:
- **Affordable** — 75-85% cheaper than market alternatives
- **Sustainable** — 85% gross margin at normal usage
- **Scalable** — unit economics improve with prompt caching and composition caching at scale
- **Transparent** — clients can understand what they're paying for (platform + seats)

The API costs are so low (~$0.015-0.035 per workspace composition) that even significant usage spikes don't threaten margins. The real value delivered — AI-composed workspaces with full transparency, knowledge panels, and natural language interaction — justifies a premium over the cost basis.
