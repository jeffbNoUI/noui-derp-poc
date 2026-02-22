# NoUI Operational Intelligence Dashboard

**Companion document to `noui-operational-intelligence.jsx` prototype**
**DERP Proof of Concept | February 2026 | Working Architecture Document**

---

## What This Is

The Operational Intelligence Dashboard is a management workspace that transforms the data NoUI already possesses — plan rules, member population, case processing history, and analyst capability profiles — into predictive, explanatory, and actionable operational insight.

This is not a bolt-on reporting tool. It is a natural consequence of NoUI's architecture: a system that knows the plan's eligibility rules, holds the member database, tracks every case through a defined workflow, and measures analyst proficiency *already has everything it needs* to forecast workload, identify bottlenecks, explain efficiency changes, and optimize team capability.

The accompanying JSX prototype (`noui-operational-intelligence.jsx`) demonstrates the complete user experience. This document explains how each analytical view works, where the data comes from, how computations flow through the architecture, and why pension agencies cannot get these capabilities from any existing vendor.

---

## The Core Differentiator

Generic workforce management tools analyze what happened. They ingest completed case counts, calculate averages, and produce charts.

NoUI can do something fundamentally different: **predict what will happen from the member population itself**.

The system holds every active member's date of birth, hire date, service credit total, tier classification, purchased service records, and DRO status. It also holds the complete set of plan eligibility rules — Rule of 75/85 thresholds, normal retirement age, early retirement minimums. By evaluating the entire active population against those rules, NoUI can project exactly how many members will cross an eligibility threshold in each future month, broken down by retirement type and complexity tier.

This is not statistical forecasting. It is a deterministic projection from known facts. The system is not guessing that "historically, 12 people retire in July." It is saying "14 specific members will cross the Rule of 75 threshold by July 2026 based on their current age and service credit." The margin of uncertainty comes only from whether each member actually *chooses* to retire when they become eligible — which is where historical take-up rates provide calibration.

No workforce management tool, no BI dashboard, and no pension administration vendor can replicate this without simultaneously knowing the plan rules, holding the member data, and having the computation engine to evaluate eligibility thresholds at population scale. NoUI has all three.

---

## Six Analytical Views

The dashboard provides six interconnected views, accessible individually or composed together on the main dashboard. Each view answers a specific operational question.

### 1. Eligibility Wave Forecast

**Question answered:** How many members will become retirement-eligible in each of the next 12 months, and what kind of retirements will they be?

**Data sources:**
- Active member roster (age, hire date, service credit, tier) from the Data Connector
- Plan eligibility rules from the Business Rules Engine (RULE-NORMAL-RET, RULE-RULE-OF-75, RULE-RULE-OF-85, RULE-EARLY-RET-T12, RULE-EARLY-RET-T3)
- Historical take-up rate (percentage of eligible members who actually file within N months of eligibility) — calibrated from observed behavior once production data accumulates

**Computation:**
For each active member who is not yet retirement-eligible, the system evaluates:
1. When will their age reach 65? (Normal retirement eligibility, all tiers, assuming 5+ years vested)
2. When will age + earned service credit reach 75 or 85? (Rule of 75/85, evaluated monthly)
3. When will their age reach 55 (Tiers 1/2) or 60 (Tier 3) with 5+ years service? (Early retirement eligibility)

Each member's earliest eligibility date is computed. Members are bucketed by month. The breakdown by retirement type (normal, rule-based, early) drives complexity projections — early retirements involve reduction calculations that increase case complexity.

**Unique insight — Capacity alerts:**
The forecast is compared against current team processing capacity (derived from the analyst capability profiles in the Proficiency & Skills Development Model). When projected volume exceeds a configurable percentage of capacity, the system generates a capacity alert with the specific month, projected count, and capacity utilization percentage. This gives supervisors months of lead time to plan staffing, authorize overtime, or accelerate cross-training — rather than reacting after a backlog has formed.

**What the prototype shows:**
A 12-month stacked bar chart with three retirement types color-coded (normal, Rule of 75/85, early retirement). An automatic capacity alert banner calls out the July 2026 surge. An explanation panel describes exactly how the forecast works so users trust the numbers. Hovering on any month shows the breakdown detail.

---

### 2. Processing Flow & Bottleneck Analysis

**Question answered:** Where are cases spending time in the workflow, and why?

**Data sources:**
- Case lifecycle records from the Process Orchestrator (stage entry/exit timestamps)
- Wait-type classification from case state: awaiting analyst action (case assigned, no stage advance), awaiting external input (pending document, court order, employer verification), awaiting system/data resolution (data quality finding, calculation hold)
- Stage-level active case counts (real-time from case lifecycle)

**Computation:**
For each workflow stage (Application Review → Eligibility Review → Benefit Calculation → Payment Options → Approval), the system computes:
1. Active case count — how many cases are currently *in* this stage
2. Average dwell time — median time cases spend in this stage, computed from completed cases over the trailing period
3. Wait-type distribution — what percentage of dwell time is attributable to analyst action, external dependencies, or system holds

A stage is flagged as a bottleneck when its active count exceeds a configurable multiple of the rolling average, or when its dwell time exceeds the SLA threshold.

**Unique insight — Root cause explanation:**
Rather than just labeling a stage as "slow," the system explains *why*. Because NoUI tracks the specific reason each case is waiting (the Process Orchestrator records state transitions with reason codes), the bottleneck card can say "6 of 12 cases are awaiting external input — spousal consent forms (3), employer salary verification (2), purchased service documentation (1)." This transforms the bottleneck from a number into an actionable finding: the supervisor knows the issue is not staffing but document dependencies, and can respond with targeted member outreach or process changes rather than hiring.

**What the prototype shows:**
A pipeline visualization with active case counts per stage, average dwell time, and a color-coded wait-type breakdown bar (analyst action / external dependency / system hold). Stages flagged as bottlenecks get orange borders and explanation cards with root cause and suggested actions.

---

### 3. Period-over-Period Efficiency

**Question answered:** Are we getting better or worse, by how much, and why?

**Data sources:**
- Completed case metrics per period from case lifecycle (volume, processing time, accuracy rate, on-time rate)
- Task complexity classification from the Proficiency & Skills Development Model (used for complexity-adjusted throughput)
- Analyst proficiency change events (graduations, mode changes)
- QA return records from the audit trail

**Computation:**
Six metrics are compared between the current and prior period:
1. **Cases completed** — raw count
2. **Average processing days** — median calendar days from case creation to final approval, complexity-adjusted (a period with a higher complex mix gets a normalized comparison)
3. **Accuracy rate** — percentage of cases completed without QA return or recalculation
4. **On-time rate** — percentage of cases completing within SLA
5. **Complexity-adjusted throughput** — total Complexity Units processed (Standard × 1.0, Elevated × 1.5, Complex × 2.5). This is more meaningful than raw case counts because it normalizes for case mix changes.
6. **QA returns** — count of cases sent back for correction

Each metric shows the current value, prior value, percentage change, and directional indicator (improved/declined/stable). The "improved" or "declined" assessment accounts for whether higher is better or worse for each metric (lower processing days = better; lower accuracy = worse).

**Unique insight — AI-assisted causal analysis:**
The dashboard does not just show that processing time improved. It explains *what caused* the improvement. The causal analysis section examines:
- Analyst proficiency changes (did someone graduate to a new proficiency level?)
- Case mix shifts (did the proportion of complex cases change?)
- Process changes (did a new document checklist reduce a specific bottleneck?)
- External factors (seasonal patterns, court order backlogs, employer reporting delays)

This is where Tier 3 (AI augmentation) contributes. The AI analyzes the correlation between observed metric changes and known events from the proficiency tracker, process orchestrator, and operational calendar. It generates a narrative explanation with specific attribution — not "things got faster" but "Lisa Park's promotion to Proficient on Complex cases reduced DRO processing from 6.1d to 3.8d average."

The watch areas section applies the same analysis to identify emerging risks — "Complex case mix increased from 15% to 18%, concentrating on a single analyst."

**What the prototype shows:**
A 3×2 grid of metric cards with current/prior values, percentage change, and directional coloring. Below, a two-column causal analysis panel separates improvements from watch areas with specific, actionable explanations.

---

### 4. Team Capability & Operational Grouping

**Question answered:** Where does the team have depth, where are the gaps, and who is ready to grow?

**Data sources:**
- Analyst capability profiles from the Proficiency & Skills Development Model (proficiency level per complexity tier, cases completed, accuracy rate)
- Active caseload per analyst from case lifecycle
- 7-day case completion trend per analyst

**Computation — Operational grouping:**
Rather than ranking analysts by speed (which the Proficiency Model explicitly prohibits), the system groups analysts into capability cohorts based on their proficiency distribution:

| Group | Definition | Operational Meaning |
|-------|-----------|-------------------|
| **High Throughput** | Proficient across Standard + Elevated, Developing or Proficient at Complex | Fully independent on most cases. Can handle the full case mix. |
| **Building Proficiency** | Proficient at Standard, Developing at Elevated | Independent on routine work. Growing into complex cases with system support. |
| **Guided Development** | Learning or Developing at Standard | Building foundations. System providing full guidance. Expected growth trajectory. |

These groups answer the supervisor's real question: "How many people can I route complex work to right now?" The count per group is immediately visible. Each group includes the names, a description of what the group means operationally, and a complexity-adjusted throughput metric.

**Unique insight — Concentration risk:**
The system identifies when capability is concentrated on too few analysts. If only one team member is Proficient at the Complex tier, that is a single-point-of-failure risk that the dashboard surfaces explicitly: "Lisa Park is the only Complex-proficient team member. If mix continues trending upward, routing will concentrate on a single analyst."

**What the prototype shows:**
Three group cards with counts, names, descriptions, and metrics. Below, a detail matrix showing each analyst's proficiency level per complexity tier (color-coded pills), active case count, capacity utilization bar, and 7-day sparkline trend. A capacity risk alert identifies the concentration problem and recommends a specific action (advance Sarah's Complex proficiency).

---

### 5. Complexity-Adjusted Capacity

**Question answered:** What is the team's *actual* cognitive workload, not just their case count?

**Data sources:**
- Active case assignments per analyst from case lifecycle
- Task complexity classification per case from the Process Orchestrator
- Complexity Unit weights from the Proficiency & Skills Development Model

**Computation:**
Raw case counts are misleading. An analyst with 10 Standard cases and an analyst with 10 Complex cases have radically different workloads. The Complexity Unit (CU) model weights each case by its complexity tier:

| Complexity | CU Weight | Rationale |
|-----------|----------|-----------|
| Standard | 1.0 | Base unit. Single-path calculation, minimal rule interaction. |
| Elevated | 1.5 | Rule interactions require verification. Early retirement reductions, purchased service exclusions, leave payout conditionals. |
| Complex | 2.5 | Multi-factor analysis, DRO marital share calculations, data quality resolution, multi-party coordination. |

These weights are *assumptions that would be calibrated with DERP production data*. They are not presented as facts — the system allows supervisors to adjust weights based on observed processing patterns.

**Unique insight — The visibility gap:**
The capacity gauge shows two numbers side by side: raw utilization (case count / capacity) and complexity-adjusted utilization (CU total / CU capacity). When a team appears to be at 67% capacity by case count but 86% capacity by CU weight, the complexity-adjusted view reveals that the team is closer to saturation than the raw numbers suggest. This prevents the common management error of assigning more work to a team that looks underutilized but is actually handling disproportionately complex cases.

**What the prototype shows:**
A circular gauge showing CU utilization percentage, with a breakdown panel showing Standard/Elevated/Complex case counts and their CU contributions. An explanatory note shows the difference between raw and adjusted utilization.

---

### 6. Operational Calendar

**Question answered:** What pension-specific deadlines, milestones, and events are approaching, and what do they mean for operations?

**Data sources:**
- Payment processing cutoff dates (configured per plan — for DERP, the 15th of each month for next-month payment)
- Case-specific deadlines (DRO court response dates, application notarization deadlines)
- Board meeting schedule (configured by plan administrator)
- Fiscal year milestones (actuarial valuation dates, annual statement generation, contribution rate adjustment dates)
- Historical seasonal patterns (when observed, retirement volume spikes)

**Computation:**
Events are sorted by date with a days-out countdown. Events within 14 days are flagged as urgent. Event types are categorized:

| Type | Examples | Operational Impact |
|------|---------|-------------------|
| **Cutoff** | Payment processing deadline, application filing deadline | Cases must be complete by this date or miss the next payment cycle |
| **Deadline** | DRO court response, notarization requirement | Specific case-level action required |
| **Board** | Quarterly board meeting, COLA review | Reporting and presentation preparation |
| **Milestone** | Fiscal year end, contribution rate change, tier date boundary | Systemic events affecting multiple processes |

**Unique insight — Pension-specific awareness:**
Generic calendar tools show meetings. This calendar understands pension operations. It knows that a payment processing cutoff means incomplete cases will delay a member's first retirement payment by an entire month. It knows that a fiscal year boundary means annual member statements will be generated and contribution rates may change. It knows that a COLA review at a board meeting could trigger a plan-wide benefit adjustment. These are not just dates — they are operational triggers that affect workload and priority.

**What the prototype shows:**
A list of upcoming events with date blocks, type-coded icons and badges, descriptions explaining the operational impact, urgency indicators, and days-out countdowns. Events within 14 days get subtle highlighting.

---

## Architectural Integration

The Operational Intelligence Dashboard does not introduce new architectural layers. It consumes data that already exists across the four layers and presents it through the standard workspace composition model.

### Data Flow

```
Layer 1: Data Connector
  └─ Member roster, employment history, salary data
     └─ Feeds: Eligibility Wave Forecast (member population)

Layer 2: Business Intelligence
  ├─ Rules Engine
  │   └─ Eligibility rules evaluate member population
  │      └─ Feeds: Eligibility Wave Forecast (threshold projections)
  ├─ Process Orchestrator
  │   ├─ Case lifecycle (stage timestamps, state transitions)
  │   │   └─ Feeds: Flow Analysis, Period-over-Period, Capacity Gauge
  │   └─ Task complexity classification (computed at case creation)
  │       └─ Feeds: Complexity-Adjusted Capacity, Team Capability grouping
  └─ Knowledge Base
      └─ Calendar events (cutoffs, deadlines, milestones)
          └─ Feeds: Operational Calendar

Layer 3: Relevance Engine
  ├─ Proficiency Tracking Service
  │   └─ Analyst capability profiles (proficiency per complexity tier)
  │       └─ Feeds: Team Capability, Efficiency Causal Analysis
  └─ Operational Metrics Aggregator (new service in this layer)
      └─ Period aggregation, trend computation, anomaly detection
          └─ Feeds: Period-over-Period, KPI Strip

Layer 4: Dynamic Workspace
  └─ Supervisor workspace variant composes dashboard views
      using standard Tier 1 (deterministic) and Tier 2 (rule-based)
      composition. Tier 3 (AI) used only for causal analysis narrative.
```

### New Service: Operational Metrics Aggregator

The dashboard requires one new service within the Relevance Engine (Layer 3): the Operational Metrics Aggregator. This service:

- Computes period-over-period metrics from case lifecycle data
- Maintains rolling aggregates (trailing 30/60/90 day windows)
- Calculates complexity-adjusted throughput using CU weights
- Detects anomalies (metric deviations beyond configurable thresholds)
- Generates the raw data consumed by the Tier 3 causal analysis

This is a BUILD service per the Application Management Services framework. It operates entirely on data that NoUI already owns. It introduces no external dependencies or data flows.

### Tier 3 AI Usage

Only one view uses Tier 3 (AI augmentation): the causal analysis narrative in the Period-over-Period Efficiency view. The AI examines correlations between metric changes and known events (proficiency graduations, case mix shifts, process changes, seasonal patterns) and generates a human-readable explanation.

Per ADR-003, this is an orchestration insight, not a business rule derivation. The AI is not determining whether a metric improved — that is a deterministic calculation. The AI is explaining *why* it improved, which is a pattern recognition task appropriate for Tier 3.

All other views are Tier 1 (deterministic computation) or Tier 2 (rule-based composition). The dashboard is fully functional without the AI service.

### Degradation Behavior

Per ADR-007, the dashboard degrades gracefully:

| Failure | Impact | Fallback |
|---------|--------|----------|
| AI service unavailable | Causal analysis section shows "Analysis unavailable" | All other views function normally. Metrics are still computed and displayed. |
| Proficiency Tracking service unavailable | Team capability view shows last-known proficiency levels | Cached data used. Grouping and capacity calculations continue with stale but valid data. |
| Data Connector latency | Eligibility wave forecast uses last-computed projection | Forecast timestamp displayed. Refresh button available. |
| Process Orchestrator overloaded | Flow analysis uses most recent snapshot | Snapshot age displayed. Real-time counts may lag by minutes. |

---

## Relationship to Existing Documents

| Document | Relationship |
|----------|-------------|
| **Application Management Services** | Parent. Section 5 identified Operational Reporting Engine as a HIGH priority design gap. This dashboard fulfills that requirement. |
| **Proficiency & Skills Development Model** | This dashboard consumes the capability profiles and complexity classifications defined in that document. The Team Capability view and Complexity-Adjusted Capacity gauge directly use the proficiency tier model and CU weights. |
| **Roles & Workspace Architecture** | The dashboard is the Supervisor workspace variant described in Section 2.3. The Executive Dashboard variant (Section 2.5) is a read-only subset showing KPIs and operational calendar only. |
| **Dynamic Workspace UX Architecture** | Section 5 (Intelligent Routing) describes progressive routing phases. This dashboard provides the supervisor-facing visibility into Phase 2 (observation) and Phase 3 (suggestion) routing intelligence. |
| **ADR-003: AI Learns Orchestration** | Boundary compliance: AI generates causal analysis narratives (orchestration insight). AI never derives business rules, evaluates human performance for employment decisions, or determines eligibility/calculation outcomes. |
| **ADR-007: Graceful Degradation** | Dashboard follows the defined degradation hierarchy. Every view identifies its data freshness. No view fails silently. |
| **Defect Prevention Framework** | Accuracy tracking per complexity tier (from this dashboard) feeds the defect taxonomy. Systematic accuracy drops at a complexity level indicate a training gap, triggering cross-training recommendations rather than individual corrective action. |

---

## What Makes This Unique

Pension administration vendors offer reporting. Workforce management vendors offer dashboards. Neither can do what this dashboard does, because the capability requires simultaneous access to three things that no other system holds together:

**Plan rules + member population = predictive workload.**
The eligibility wave forecast is impossible without knowing both the retirement eligibility rules (Rule of 75 requires age + service ≥ 75, minimum age 55) and the individual member data (Sarah is 54 with 20 years of service — she crosses Rule of 75 in 12 months). Legacy pension systems hold the data but do not evaluate rules at population scale. BI tools can analyze historical patterns but cannot project future eligibility from current member state.

**Case complexity classification + analyst proficiency = intelligent capacity.**
The complexity-adjusted capacity gauge requires knowing both how hard each case is (Task Complexity Classification from the Proficiency Model) and how skilled each analyst is at each difficulty level (Analyst Capability Profile). A team with 5 analysts at 10 cases each looks uniform by case count but radically different when one analyst has 10 Complex DRO cases and another has 10 Standard normal retirements.

**Stage-level tracking + wait-type classification = causal bottleneck analysis.**
The flow analysis goes beyond "Eligibility Review is slow" to "6 of 12 cases at Eligibility Review are waiting for external documents, not for analyst action." This requires case-level state tracking with reason codes — data that exists naturally in NoUI's Process Orchestrator but would require extensive custom development in any other system.

**Proficiency change events + metric shifts = explanatory efficiency analysis.**
The period-over-period view does not just report that processing time decreased. It attributes the change to a specific event (Lisa's proficiency graduation reduced DRO processing time). This requires correlation between the proficiency tracker, the case lifecycle, and the complexity classification — three data streams that only exist together within NoUI.

The result is a management workspace that does not just describe operations but *explains* them, does not just report on the past but *projects* the future, and does not just measure individuals but *develops* teams. No existing pension vendor offers this because no existing vendor has the architectural foundation to support it.

---

## POC Scope

| Capability | POC Status | Notes |
|-----------|-----------|-------|
| KPI strip | PROTOTYPE | Static data. Demonstrates layout and metric selection. |
| Eligibility wave forecast | PROTOTYPE | Computed from synthetic member population for demo. |
| Flow & bottleneck analysis | PROTOTYPE | Static data demonstrating the visualization and root cause pattern. |
| Period-over-period efficiency | PROTOTYPE | Static comparison demonstrating the causal analysis format. |
| Team capability grouping | PROTOTYPE | Pre-populated proficiency profiles for demo analysts. |
| Complexity-adjusted capacity | PROTOTYPE | Static data demonstrating the CU weighting concept. |
| Operational calendar | PROTOTYPE | Static events demonstrating pension-specific awareness. |
| Operational Metrics Aggregator service | DEFERRED | Requires production case volume. |
| Live eligibility wave computation | DEFERRED | Requires population-scale rule evaluation pipeline. |
| AI-assisted causal analysis | DEFERRED | Requires production data and proficiency tracking history. |

All prototype views use illustrative data to demonstrate the concept. No numbers in the prototype should be presented as data-backed statistics.

---

## Assumptions Register

| Assumption | Risk | Notes |
|-----------|------|-------|
| Complexity Unit weights (Standard=1.0, Elevated=1.5, Complex=2.5) | Medium | Assumed ratios. Would be calibrated from production processing time data per complexity tier. |
| Team capacity of ~18 cases/month per analyst | Medium | Assumed baseline. Actual capacity depends on case mix, analyst proficiency, and plan complexity. |
| Historical take-up rate for eligibility forecasting | Low | Calibrated over time from observed behavior. Initial projection assumes 100% of eligible members may retire (conservative for capacity planning). |
| Operational grouping thresholds (High Throughput / Building / Guided) | Low | Based on proficiency tier distribution. May need additional sub-groups as team size grows. |

---

*This document is a working architecture document per the Knowledge Governance Framework. It supplements the `noui-operational-intelligence.jsx` prototype and will be formalized into a Tier 1 Governing Document when the design stabilizes.*
