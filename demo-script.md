# NoUI DERP POC — Demo Script

## Pre-Demo Checklist

- [ ] Open browser to `http://localhost:3000?demo`
- [ ] Verify demo mode banner appears ("Demo Mode — Using cached fixture data")
- [ ] Clear browser cache if needed
- [ ] Have architecture diagram accessible
- [ ] Have this script open on second screen

## Demo Flow (25-30 minutes)

### Opening (2 minutes)

**Key message:** "This is a proof of concept showing how AI can transform pension administration — not by replacing human judgment, but by making the right information available at the right time."

**Say:**
> "What you're about to see is a retirement application workspace for the Denver Employees Retirement Plan. The platform does three things:
> 1. It reads member data from the legacy database
> 2. A deterministic rules engine calculates benefits using certified plan provisions
> 3. AI composes the workspace — deciding what information to show based on each member's situation
>
> Let me be clear about what the AI does and does NOT do: **AI does not calculate benefits.** Every number you see comes from a rules engine executing certified plan provisions. AI's role is to compose the workspace and accelerate rule configuration."

---

### Case 1: Robert Martinez — The Happy Path (5 minutes)

**Click:** Demo Card "Robert Martinez" (Case 1)

**Walk through:**
1. **Member Banner** — "Here's Robert: Tier 1, hired in 1997, age 63. The workspace already shows his service credit: 28.75 years earned."

2. **Alerts** — "Notice the system identified he's eligible for leave payout — hired before 2010 with sick/vacation leave. The workspace composed this alert because it's relevant to his situation."

3. **Select retirement date:** April 1, 2026

4. **Eligibility Panel** — "The rules engine evaluated Robert against every eligibility rule. Rule of 75: age 63 plus 28.75 years of service equals 91.75 — well above the 75 threshold. No reduction."

5. **Benefit Calculation** — "Here's where transparency matters. You can see every step:
   - AMS: $10,639.45 — that's his highest 36 consecutive months including the $52,000 leave payout
   - Multiplier: 2.0% for Tier 1
   - Service: 28.75 years
   - Result: $6,117.68 per month

   Every calculation shows its formula, inputs, and source reference to the Revised Municipal Code."

6. **Payment Options** — "Robert has four options. His 75% J&S pays $5,597.68 with $4,198.26 going to Elena if he predeceases her."

7. **Audit Trail** — "Every rule applied is logged with its RMC citation. This isn't just a number — it's a verifiable calculation."

**Key talking point:** "Notice what's NOT here: there's no DRO panel, because Robert doesn't have a domestic relations order. The workspace only shows what's relevant."

---

### Case 2: Jennifer Kim — Purchased Service & Early Retirement (5 minutes)

**Click:** Demo Card "Jennifer Kim" (Case 2)

**Walk through:**
1. **Service Credit** — "Jennifer has 21.17 total years, but notice: 18.17 earned, 3.00 purchased. This distinction is CRITICAL."

2. **Purchased Service Alert** — "The system immediately flags the purchased service. Purchased credit counts toward the benefit amount but is excluded from the Rule of 75 and IPR. Getting this wrong would overpay or underpay benefits."

3. **Select retirement date:** May 1, 2026

4. **Eligibility** — "Rule of 75: the system correctly uses earned service only — 55 + 18.17 = 73.17, which is below 75. Jennifer gets a 30% early retirement reduction: 3% per year for 10 years under age 65."

5. **Benefit Calculation** — "Watch the formula: $7,347.62 × 1.5% × 21.17 years = $2,332.96 unreduced. Then × 0.70 reduction = $1,633.07. The purchased service IS included in the benefit calculation — it increases her benefit from what it would otherwise be."

6. **Death Benefit** — "$2,500 — reduced from $5,000 base by $250 per year under age 65."

**Key talking point:** "This is the kind of rule interaction that causes real-world errors. Purchased service counts here but not there. The rules engine handles it consistently every time because it's executing certified plan provisions, not making judgment calls."

---

### Case 3: David Washington — Tier 3 Differences (3 minutes)

**Click:** Demo Card "David Washington" (Case 3)

**Walk through:**
1. **Tier 3 differences** — "David is Tier 3 — hired after July 1, 2011. Everything is different:
   - 60-month AMS window instead of 36
   - Rule of 85 instead of 75
   - Minimum age 60 for early retirement instead of 55
   - 6% reduction per year instead of 3%
   - No leave payout eligibility"

2. **Select retirement date:** April 1, 2026

3. **Quick walkthrough** — Point out the Rule of 85 evaluation (76.58 < 85), the 12% reduction, the 60-month AMS, and the $4,000 death benefit ($500/year reduction for Tier 3).

**Key talking point:** "The workspace automatically adjusts for tier. Every Tier 3 calculation uses the right parameters — no human has to remember which rules apply to which tier."

---

### Case 4: Robert Martinez with DRO (5 minutes)

**Click:** Demo Card "Robert Martinez" (Case 4)

**Walk through:**
1. **DRO Alert** — "Same Robert Martinez, but now with a domestic relations order. The workspace composed a DRO alert and the DRO Impact panel."

2. **Select retirement date:** April 1, 2026

3. **DRO Impact Panel** — "The DRO calculation:
   - Marriage: 1999 to 2017 = 18.25 years of service during marriage
   - Marital fraction: 18.25 / 28.75 = 0.6348
   - Marital share: $6,117.68 × 0.6348 = $3,883.10
   - Patricia's 40%: $1,553.24
   - Robert keeps: $4,564.44"

4. **Payment Options** — "Notice these are calculated on the post-DRO amount — $4,564.44, not $6,117.68. The DRO split happens BEFORE the payment option selection. Getting this sequence wrong would be a compliance violation."

**Key talking point:** "The order of operations matters: DRO split first, then payment option. The rules engine enforces this sequence. It's not something a caseworker has to remember."

---

### AI-Accelerated Change Management (3 minutes)

**Say:**
> "Let me show you what happens when a rule changes. The board approves a contribution rate increase from 8.45% to 9.00%. Here's the AI-accelerated workflow:
> 1. AI reads the board resolution and identifies 3 affected rules
> 2. AI drafts the changes — but a human SME reviews against the actual RMC language
> 3. The system generates regression tests from the reviewed definitions
> 4. Tests execute — failures are defects, never auto-resolved
> 5. A human certifies the complete package
> 6. Changes deploy on the effective date; prior rules are preserved
>
> No rule reaches production without human approval."

---

### Data Quality (2 minutes)

**Say:**
> "The system also identifies data quality issues in the legacy database. It found:
> - 12 active members with termination dates — contradictory status
> - 5 beneficiaries with allocations that don't sum to 100%
> - 3 contribution balance mismatches
>
> Each finding has a proposed resolution, but in Phase 1, every correction requires human review. There is no auto-resolve. The system shows its work and presents findings for human verification."

---

### Closing (3 minutes)

**Key messages:**
1. "AI does not execute business rules. The rules engine does."
2. "Every calculation shows its formula, inputs, and governing document reference."
3. "The system earns trust through transparency, not automation."
4. "AI accelerates rule configuration and composes workspaces — humans certify and approve."

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

### "What happens if the AI service goes down during a session?"
**Answer:** "The rules engine and all calculations are independent of the AI service. Workspace composition falls back to showing all available panels rather than the optimized layout. Data quality findings are still generated. The only degraded capability is the AI-composed workspace ordering — and that's a convenience feature, not a compliance requirement."

---

## Fallback Plan

If the demo environment has issues:

1. **Frontend won't load:** Use `?demo` parameter to activate demo mode, which serves cached fixtures with no backend dependency
2. **Calculations seem wrong:** All demo mode values are pre-verified against hand calculations (18 automated tests confirm this)
3. **Browser issues:** Chrome recommended; Safari and Firefox also work. Clear cache and reload.
4. **Network issues:** Demo mode is fully self-contained — no API calls needed

## Technical Details (if asked)

- **Technology:** Go backend, React + TypeScript frontend, PostgreSQL database
- **Testing:** 71 Go tests + 23 frontend tests = 94 total, all passing
- **Rules:** 52 business rules defined in YAML with RMC citations
- **Architecture:** Connector (data) → Intelligence (rules) → Frontend (workspace)
- **Governed artifacts:** Rule definitions, lookup tables, test fixtures — all version-controlled
