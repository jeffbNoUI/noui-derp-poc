# noui-connector-lab — Build History

## Format

Each entry: Date | Session | Decision/Change | Rationale | Status

---

## Repository Initialization

**Date:** 2026-03-05
**Session:** Repo init (pre-Claude Code)
**Decision:** Created `noui-connector-lab` as a standalone repository separate from `noui-derp-poc`
**Rationale:** Schema discovery and monitoring logic is plan-agnostic. Developing it inside the DERP demo repo would muddy the POC's purpose. A standalone lab repo enables testing against multiple target systems without client-specific coupling. Proven logic is promoted to `noui-derp-poc/services/connector/`.
**Status:** Complete

---

## Target System Change: OrangeHRM → ERPNext

**Date:** 2026-03-05
**Session:** Session 1
**Decision:** Switched first lab target from OrangeHRM to ERPNext (v16.8.1, MariaDB 10.6)
**Rationale:** ERPNext provides richer HR/payroll schema depth out of the box — salary structures, payroll entries, leave ledgers, attendance, employee lifecycle. Same MariaDB backend so introspection code is compatible. More realistic proxy for legacy pension administration systems.
**Status:** Complete — docker-compose.yml created, docs updated

---

## ERPNext Environment Setup

**Date:** 2026-03-05
**Session:** Session 1
**Decision:** ERPNext Docker stack based on official frappe/frappe_docker pwd.yml
**Rationale:** Official quick-start compose is well-tested and includes all required services (backend, frontend, workers, scheduler, redis, MariaDB). MariaDB exposed on port 3307 (not 3306) to avoid local conflicts.
**Status:** Complete — ERPNext running on port 8083, DB on port 3307, 876 tables discovered

---

## Schema Introspection

**Date:** 2026-03-05
**Session:** Session 1
**Decision:** Built `connector/introspect/` as standalone Go CLI using information_schema queries
**Rationale:** Queries information_schema.TABLES, COLUMNS, and KEY_COLUMN_USAGE for complete schema discovery. Output is a JSON manifest with tables, columns, data types, foreign keys, and row counts.
**Status:** Complete — manifest generated with 876 tables from ERPNext database `_0919b4e09c48d335`

---

## Concept Tagger Implementation

**Date:** 2026-03-06
**Session:** Session 2
**Decision:** Built `connector/tagger/` — signal-based concept tagging engine
**Rationale:** The tagger identifies HR/payroll concepts (employee records, salary history, payroll runs, leave balances, etc.) by analyzing structural signals in the schema manifest: column name patterns, data type distributions, FK relationships, and date range patterns. No hardcoded table names — works across any HR system schema.
**Status:** Complete

**Architecture:**
- `types.go` — Shared types (SchemaManifest redeclared, ConceptTag, SignalHit, TagReport)
- `signals.go` — Signal detection helpers (column matching, type ratios, FK topology)
- `concepts.go` — 7 concept definitions with weighted signal configurations
- `scorer.go` — Additive scoring engine with per-concept thresholds
- `tagger.go` — Orchestrator: iterates tables, scores, assigns tags, builds report
- `main.go` — CLI: `--input`, `--output`, `--report`, `--threshold` flags

**Design decisions:**
- Additive scoring: each signal has a weight, tag assigned when sum >= threshold
- Per-concept thresholds (2.5–3.5) tuned against ERPNext to balance precision/recall
- Dual output: enriched manifest (NoUITags populated) + tags-report.json with full signal audit
- No external dependencies (standard library only — reads JSON, no DB connection)
- Types redeclared from introspect (both are `package main` standalone binaries)

**Results against ERPNext (876 tables):**
- 23 tables tagged across 7 concepts
- employee-master: 1 (tabEmployee)
- salary-history: 2 (tabSalary Slip, tabSalary Structure)
- payroll-run: 1 (tabPayroll Entry)
- leave-balance: 8 (tabLeave Allocation + 7 related)
- employment-timeline: 4 (Promotion, Transfer, Separation, Onboarding)
- attendance: 2 (tabAttendance, tabAttendance Request)
- benefit-deduction: 5 (Benefit Application, Tax Exemption Declaration, etc.)

---

## Pending (Session 3)

- [ ] Seed data generation (employees, salary structures, payroll entries, leave records, DQ issues)
- [ ] Statistical baseline establishment from seeded data
- [ ] Monitoring checks implementation (`connector/monitor/`)
- [ ] Monitoring dashboard via NoUI workspace API
