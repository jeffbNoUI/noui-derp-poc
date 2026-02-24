# NoUI DERP POC — Demo Script

## Pre-Demo Checklist

- [ ] Docker containers running: `docker ps` shows postgres, connector (8081), intelligence (8082) all healthy
- [ ] Frontend dev server running on `http://localhost:5175`
- [ ] Open browser to `http://localhost:5175` — Platform Showcase landing page loads
- [ ] Demo mode is active by default (no query param needed). Add `?live` to hit real database.
- [ ] Clear browser cache if needed
- [ ] Have this script open on second screen

---

## Demo Flow (35-40 minutes)

### Act 1: Platform Overview (3 minutes)

**Start at:** `http://localhost:5175` — the Platform Showcase landing page

**Say:**
> "This is the NoUI platform for the Denver Employees Retirement Plan. What you're seeing is a proof of concept that demonstrates how AI can transform pension administration — not by replacing human judgment, but by making the right information available at the right time.
>
> The platform has three layers:
> 1. **Core Workspaces** — the retirement application workflow from both the staff and member perspectives
> 2. **Productivity Services** — AI-accelerated tools that augment analyst capabilities
> 3. **Platform Intelligence** — learning, operations, and data quality insights
>
> Let me be clear about what the AI does and does NOT do: **AI does not calculate benefits.** Every number comes from a deterministic rules engine executing certified plan provisions. AI composes the workspace — deciding what to show based on each member's situation — and accelerates rule configuration. Humans certify and approve."

**Point out:** The 9 capability cards organized into 3 sections. Each one is a functional demonstration.

**Click:** "Staff Portal" card

---

### Act 2: Staff Workspace — Expert Mode (20 minutes)

**Landing:** Staff Welcome Screen with mode toggle and 4 demo case cards

**Say:**
> "This is where a benefits analyst works. They choose a processing mode — Expert for experienced analysts, Guided for newer staff — and select a case. We'll use Expert mode to walk through all four demo cases."

**Ensure Expert mode is selected** (default).

---

#### Case 1: Robert Martinez — The Happy Path (5 minutes)

**Click:** "Robert Martinez" Case 1 card → loads `/staff/case/10001`

**Walk through the 3D carousel:**
> "The expert workspace uses a carousel layout. The active stage is center — full content, fully interactive. Previous and next stages peek in from the sides, angled like cards on a drum. The pill navigation at the bottom shows all 9 stages with confirmation status."

1. **Member Banner** — "Robert Martinez: Tier 1, hired 1997, age 63. 28.75 years earned service."

2. **Application Intake stage** — "Document checklist, application timeline, payment cutoff — this is the analyst's starting point."

3. **Navigate to Eligibility** (click pill or next card) — "Rule of 75: age 63 plus 28.75 years = 91.75 — well above 75. No reduction. Every rule evaluated is shown with its RMC citation."

4. **Navigate to Benefit Calculation** — "Here's where transparency matters:
   - AMS: $10,639.45 — highest 36 consecutive months including $52,000 leave payout
   - Multiplier: 2.0% for Tier 1
   - Service: 28.75 years
   - Result: **$6,117.68 per month**

   Every step shows formula, inputs, and source reference."

5. **Live Summary sidebar** (right panel) — "The Live Calculation sidebar updates in real time. Hero benefit amount, line item breakdown, confirmation progress. When all stages are confirmed, Save & Submit activates."

6. **Payment Options stage** — "Four options. His 75% J&S pays $5,597.68 with $4,198.26 for Elena as survivor."

7. **Confirm a stage** — Click the confirm button to show how stages get marked done, pills update with checkmarks, and progress advances.

**Key talking point:**
> "Notice what's NOT here — no DRO panel. Robert doesn't have a domestic relations order. The workspace only shows what's relevant to this member's situation."

---

#### Case 2: Jennifer Kim — The Edge Case (5 minutes)

**Navigate back:** Click browser back or navigate to `/staff` then select Case 2

**Click:** "Jennifer Kim" Case 2 card → `/staff/case/10002`

1. **Service Credit stage** — "Jennifer has 21.17 total years: 18.17 earned, 3.00 purchased. This distinction is CRITICAL."

2. **Alert** — "The system flags the purchased service. Purchased credit counts toward the benefit amount but is excluded from the Rule of 75 and IPR. Getting this wrong would overpay or underpay benefits."

3. **Eligibility stage** — "Rule of 75 uses earned service only — 55 + 18.17 = 73.17, below 75. Jennifer gets a 30% early retirement reduction: 3% per year for 10 years under age 65."

4. **Benefit Calculation** — "$7,347.62 AMS x 1.5% x 21.17 years = $2,332.96 unreduced. Then x 0.70 = **$1,633.07**. Purchased service IS included in the benefit formula — it increases her benefit."

5. **Supplemental Benefits** — "Death benefit: $2,500 — reduced from $5,000 by $250/year under 65. IPR uses earned service only: 18.17 years."

**Key talking point:**
> "This is the kind of rule interaction that causes real-world errors. Purchased service counts HERE but not THERE. The rules engine handles it consistently every time — certified plan provisions, not judgment calls."

---

#### Case 3: David Washington — Tier 3 Differences (3 minutes)

**Navigate to:** `/staff` → Case 3 card → `/staff/case/10003`

1. **Tier differences** — "David is Tier 3 — hired after July 1, 2011. EVERYTHING is different:
   - 60-month AMS window (not 36)
   - Rule of 85 (not 75)
   - Minimum early retirement age 60 (not 55)
   - 6% reduction per year (not 3%)
   - No leave payout eligibility"

2. **Quick walkthrough** — Rule of 85: 63 + 13.58 = 76.58 < 85. 12% reduction. 60-month AMS includes a 2021 salary dip. Death benefit: $4,000 ($500/year reduction for Tier 3 vs $250 for Tiers 1-2).

**Key talking point:**
> "Same interface, completely different rules. The workspace automatically adjusts for tier — no human has to remember which parameters apply."

---

#### Case 4: Robert Martinez with DRO (5 minutes)

**Navigate to:** `/staff` → Case 4 card → `/staff/case/10004`

1. **DRO Alert** — "Same Robert Martinez, but now with a Domestic Relations Order. The workspace composed a DRO panel that wasn't present in Case 1."

2. **DRO stage** — "The calculation sequence:
   - Marriage: 1999-2017 = 18.25 years during DERP employment
   - Marital fraction: 18.25 / 28.75 = 0.6348 (63.48%)
   - Marital share: $6,117.68 x 0.6348 = $3,883.10
   - Patricia's 40%: **$1,553.24/month**
   - Robert's net: **$4,564.44/month**"

3. **Payment Options** — "Payment option applies to the post-DRO amount — $4,564.44, NOT the original $6,117.68. DRO split first, then option election. Getting this sequence wrong is a compliance violation."

**Key talking point:**
> "The order of operations is enforced by the rules engine. It's not something a caseworker has to remember — the system applies DRO before payment options, every time."

---

### Act 3: Guided Mode — Learning Module (3 minutes)

**Navigate to:** `/staff` → Toggle to **Guided** mode → Case 1 card → `/staff/case/10001/guided`

**Say:**
> "Guided mode is designed for newer staff or complex cases where step-by-step verification matters."

1. **Sequential flow** — "Stages advance one at a time. The analyst must confirm each stage before moving on."

2. **Learning Module sidebar** — "Three independent layers:
   - **Onboarding** — teaching narrative explaining what this stage does and why
   - **Rules Reference** — statutory citations from the Revised Municipal Code
   - **Verification Checklist** — interactive checks that guide the analyst through confirmation

   Each layer toggles independently. As analysts demonstrate proficiency, the system could reduce onboarding content — earning trust over time."

3. **Checklist gates** — "Checklist items must be completed before the stage can be confirmed. This ensures consistency across all analysts."

**Key talking point:**
> "Expert mode trusts the analyst. Guided mode teaches and verifies. Same underlying data and calculations — different workspace composition based on who's using it."

---

### Act 4: Member Portal (5 minutes)

**Navigate to:** `http://localhost:5175` → "Member Portal" card → `/portal`

**Say:**
> "Now let's see the same retirement process from the member's perspective."

1. **Member Dashboard** — "Robert Martinez logged in. He sees his basic info, current application status, quick actions."

2. **Start Application** → `/portal/apply/...` — "The member walks through a 7-step wizard:
   - Confirm personal info and beneficiary
   - Select retirement date
   - View benefit estimate (from the same rules engine — member never calculates)
   - Choose payment option
   - Elect death benefit installments
   - Review insurance and tax withholding
   - Final review and submit"

3. **Application Status** → "After submission, the member tracks their application through the pipeline. Documents received, expected first payment date, messages from staff."

**Key talking point:**
> "The member portal reads from the same rules engine as the staff workspace. The member sees their estimate; the analyst sees the full audit trail. One source of truth, two views."

---

### Act 5: Platform Capabilities (5 minutes)

**Navigate to:** `http://localhost:5175` (landing page)

**Quick tour through 3-4 productivity demos:**

1. **Knowledge Assistant** (`/demos/knowledge-assistant`) — "Search DERP provisions by topic. Returns statutory citations with RMC section references. Can operate standalone or connected to a specific member's situation."

2. **Correspondence Composer** (`/demos/correspondence`) — "Assemble retirement letters from structured content blocks. Every paragraph has provenance — the analyst sees exactly what content came from where."

3. **Workflow Dashboard** (`/demos/workflow`) — "Supervisor view: processing pipeline, caseload heatmap by analyst, deadline risk monitoring, case reassignment."

4. **Data Quality** (`/demos/data-quality`) — "Migration findings from the legacy database — severity-classified, with proposed corrections. Every correction requires human review. The system identifies; humans approve."

**Key talking point:**
> "These are all AI-augmented tools, not AI-automated tools. The Knowledge Assistant finds provisions — it doesn't interpret them. The Correspondence Composer assembles letters — the analyst reviews before sending. Data Quality proposes corrections — humans approve them."

---

### Closing (2 minutes)

**Key messages:**

1. "**AI does not execute business rules.** The deterministic rules engine does — executing certified plan provisions with full audit trails."

2. "**Every calculation shows its work.** Formula, inputs, intermediate steps, governing document reference. Trust through transparency."

3. "**The workspace adapts to the situation.** DRO panels appear only when a DRO exists. Tier 3 rules apply only to Tier 3 members. Purchased service warnings appear only when relevant."

4. "**Same rules engine, multiple views.** Staff expert mode, staff guided mode, and member portal — all reading from the same source of truth."

5. "**AI accelerates, humans certify.** Rule configuration, workspace composition, data quality findings — AI proposes, humans approve. No rule reaches production without human certification."

---

## Anticipated Questions & Answers

### "Does the AI calculate the benefits?"
**Answer:** "No. Every benefit amount comes from a deterministic rules engine executing certified plan provisions. AI has three roles: it reads governing documents to draft rule configurations, it composes the workspace to show the right information, and it analyzes legacy data to accelerate migration. But it never executes a business rule, performs a calculation, or makes an eligibility determination."

### "What if the AI makes a mistake?"
**Answer:** "AI can't make a calculation mistake because it doesn't calculate. For rule configuration: AI drafts, humans review against the actual governing document, tests are generated, and humans certify before anything reaches production. For workspace composition: the worst that happens is showing a panel that isn't needed — which is a UX issue, not a compliance issue."

### "How do you handle rule changes?"
**Answer:** "Every rule change follows a full software development lifecycle. AI identifies affected rules and drafts changes, but human SMEs review against the source document, regression tests are generated and run, and a human certifies the complete package. No rule reaches production without human approval."

### "What about security and audit?"
**Answer:** "Every calculation includes a full audit trail citing the specific RMC section that authorizes it. Rule definitions are version-controlled and governed. Prior rules are preserved when changes deploy. The system is designed to be auditable end-to-end."

### "Can this handle our plan?"
**Answer:** "DERP has 52 business rules across 3 tiers with interactions like purchased service exclusion and DRO sequencing. We've implemented and tested all of them with penny-accurate verification against hand calculations. The architecture is plan-agnostic — the same engine can be configured for different plan provisions."

### "What's the timeline to production?"
**Answer:** "This is a proof of concept. Production would require: actual DERP actuarial tables (we're using placeholder J&S factors), integration testing against the real legacy database, security hardening, and the full change management certification process. The architecture and rules engine are ready; the configuration certification is the gating item."

### "What happens if the AI service goes down?"
**Answer:** "The rules engine and all calculations are independent of the AI service. Workspace composition falls back to showing all available panels rather than the optimized layout. Data quality findings are still generated. The only degraded capability is the AI-composed workspace ordering — and that's a convenience feature, not a compliance requirement."

### "How does Expert mode differ from Guided mode?"
**Answer:** "Expert mode shows a carousel with all stages accessible in any order — designed for experienced analysts who know the process. Guided mode walks through stages sequentially with a learning module that includes onboarding narratives, rule citations, and verification checklists. Same calculations, different workspace composition based on analyst proficiency."

### "What does the member see vs the analyst?"
**Answer:** "The member portal reads from the same rules engine but presents a simplified view — benefit estimates, payment option selection, application status tracking. The staff workspace shows the full audit trail, rule evaluations, and edge case alerts. One source of truth, two perspectives."

---

## Fallback Plan

If the demo environment has issues:

1. **Frontend won't load:** Ensure dev server is running (`npm run dev` from `services/frontend/`). App serves on port 5175.
2. **Backend services down:** Demo mode uses cached fixtures with no backend dependency — the app works fully offline.
3. **Calculations seem wrong:** All demo mode values are pre-verified against hand calculations with automated tests.
4. **Browser issues:** Chrome recommended; Safari and Firefox also work. Clear cache and reload.

## Technical Details (if asked)

- **Technology:** Go backend, React 19 + TypeScript 5.9 frontend, PostgreSQL 16
- **Build:** Vite 7.3, production build < 650KB gzipped
- **Rules:** 52 business rules defined in YAML with RMC citations
- **Architecture:** Connector (data access) → Intelligence (rules engine) → Frontend (workspace composition)
- **Testing:** Go unit tests + frontend Vitest tests, all passing. 4 demo cases verified penny-accurate to hand calculations.
- **Governed artifacts:** Rule definitions, lookup tables, test fixtures — all version-controlled
- **Dual mode:** Demo (default, offline) or Live (`?live`, hits real PostgreSQL through connector + intelligence services)
