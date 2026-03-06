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

## Seed Data Generation

**Date:** 2026-03-06
**Session:** Session 3
**Decision:** Built `targets/erpnext/seed/seed.py` — Python script that populates ERPNext via direct SQL
**Rationale:** ERPNext has no company/department/employee data out of the box. Direct SQL insertion is the fastest path to a populated database with controlled DQ issues for monitoring validation. The seed is idempotent (cleans before inserting) and reproducible (random seed=42).
**Status:** Complete

**Data seeded:**
- 1 company (NoUI Labs), 6 departments, 10 designations
- 200 employees (170 active, 30 terminated)
- 3 salary structures, 200 salary structure assignments
- 6,399 salary slips (monthly, 3 years)
- 33 payroll entries (monthly company-wide)
- 1,662 leave allocations (annual per employee per leave type)
- 2,235 leave applications (random leaves taken)
- 21,384 attendance records (daily, last 6 months)
- 25 employee separations (5 intentionally missing)
- **Total: 32,158 records across 12 tables**

**Embedded DQ issues (6 categories):**
| Category | Seeded | Detected | Signal |
|----------|--------|----------|--------|
| Salary history gaps | 12 employees | 237 gap-months | Missing salary slips in date sequence |
| Negative leave balances | 15 employees | 13 allocations | total_leaves_allocated < 0 |
| Missing termination records | 5 employees | 5 | status=Left, no separation doc |
| Missing payroll runs | 3 months | 3 | Salary slips exist, no payroll entry |
| Invalid hire dates | 8 employees | 8 | date_of_joining in 2027 |
| Contribution imbalance | 10 employees | 89 slip-months | gross_pay ≠ salary structure base (>10%) |

---

## Monitoring Checks Engine

**Date:** 2026-03-06
**Session:** Session 3
**Decision:** Built `connector/monitor/` — statistical baseline computation + 6 anomaly detection checks
**Rationale:** The monitor connects to the live database, computes baselines from actual data, then runs targeted checks that detect each DQ issue category. Each check is auditable — results include the specific evidence (employee IDs, amounts, dates) that triggered the finding.
**Status:** Complete — all 6 checks detect seeded DQ issues, 24 unit tests pass

**Architecture:**
- `types.go` — CheckResult, Baseline, MonitorReport, ReportSummary
- `baseline.go` — Computes 5 statistical baselines (monthly employee count, gross totals, avg gross, leave allocation avg, payroll run frequency)
- `checks.go` — 6 checks: salary_gap, negative_leave_balance, missing_termination, missing_payroll_run, invalid_hire_date, contribution_imbalance
- `monitor.go` — Orchestrator: runs baselines + checks, builds report
- `main.go` — CLI: `--driver`, `--dsn`, `--output`, `--baseline-only`, `--checks-only`

**Baselines computed:**
| Metric | Mean | StdDev | Range |
|--------|------|--------|-------|
| monthly_employee_count | 177.75 | 11.86 | 159–192 |
| monthly_gross_total | $1,235,222 | $93,075 | $1.09M–$1.35M |
| monthly_avg_gross | $6,945 | $67 | $6,816–$7,023 |
| avg_leave_allocation | 12.21 days | 2.48 | -5–15 |
| monthly_payroll_runs | 1.00 | 0.00 | 1–1 |

---

## Monitoring Dashboard API

**Date:** 2026-03-06
**Session:** Session 3
**Decision:** Built `connector/dashboard/` — lightweight HTTP server serving monitoring results as JSON API
**Rationale:** The NoUI workspace needs a programmatic interface to display monitoring findings. A standalone HTTP server that reads the monitor report JSON and exposes filtered endpoints enables workspace integration without coupling to any specific frontend.
**Status:** Complete — 7 endpoints, 18 unit tests pass

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| GET /api/v1/health | Server health + uptime |
| GET /api/v1/monitor/report | Full monitor report (cacheable, `?refresh=true`) |
| GET /api/v1/monitor/summary | Summary counts + baselines |
| GET /api/v1/monitor/checks | All checks (`?status=fail`, `?category=completeness`) |
| GET /api/v1/monitor/checks/{name} | Single check by name |
| GET /api/v1/monitor/baselines | All baseline metrics |
| GET /api/v1/monitor/history | Run history |

---

## Scheduled Monitoring

**Date:** 2026-03-06
**Session:** Session 4
**Decision:** Added `--schedule` and `--history-dir` flags to `connector/monitor/`
**Rationale:** The monitor previously only ran once and exited. For production monitoring, periodic runs with history accumulation are essential. The scheduler runs checks on a configurable interval (e.g. `--schedule 5m`), writes each report to both a `latest.json` (for the dashboard API) and a timestamped file in the history directory (for trend analysis). Graceful shutdown on SIGINT/SIGTERM.
**Status:** Complete — 3 new tests pass

**New files:**
- `connector/monitor/scheduler.go` — `RunScheduled()` loop + `writeReport()` with history
- `connector/monitor/scheduler_test.go` — Tests for report writing and history accumulation

**Usage:**
```bash
go run ./monitor/ \
  --dsn "root:admin@tcp(127.0.0.1:3307)/_0919b4e09c48d335" \
  --output monitor-report.json \
  --schedule 5m \
  --history-dir ./monitor-history/
```

---

## PostgreSQL Adapter for Schema Introspection

**Date:** 2026-03-06
**Session:** Session 4
**Decision:** Refactored `connector/introspect/` into swappable `SchemaAdapter` interface with MySQL and PostgreSQL implementations
**Rationale:** Per CLAUDE.md: "Connector DB adapter must be swappable per target — no MariaDB-specific code in core connector logic." The introspect tool now supports `--driver postgres` alongside `--driver mysql`. PostgreSQL adapter handles differences in information_schema (no COLUMN_KEY, different FK discovery via constraint_column_usage, row counts via pg_stat_user_tables).
**Status:** Complete — 3 new tests pass, MySQL adapter verified against live ERPNext

**Architecture:**
- `adapter.go` — `SchemaAdapter` interface + `NewAdapter()` factory
- `mysql.go` — MySQL/MariaDB adapter (extracted from original monolithic main.go)
- `postgres.go` — PostgreSQL adapter (uses `$N` placeholders, pg_stat_user_tables, constraint_column_usage)
- `main.go` — Refactored to use adapter pattern

**Design decisions:**
- Interface has 3 methods: `GetTables`, `GetColumns`, `GetForeignKeys`
- PostgreSQL maps `--db` to schema name (defaults to "public")
- Key type detection in PostgreSQL uses correlated subquery against table_constraints
- Added `github.com/lib/pq` driver dependency

**PostgreSQL usage:**
```bash
go run ./introspect/ \
  --driver postgres \
  --dsn "postgres://user:pass@localhost:5432/mydb?sslmode=disable" \
  --db public \
  --output manifest.json
```

---

## Shared Types Package

**Date:** 2026-03-06
**Session:** Session 5
**Decision:** Extracted 8 shared types into `connector/schema/` library package
**Rationale:** SchemaManifest/TableInfo/ColumnInfo/ForeignKey were duplicated in both introspect and tagger. MonitorReport/CheckResult/Baseline/ReportSummary were duplicated in both monitor and dashboard. All packages were `package main` so they couldn't import each other. Created `connector/schema/` as a library package (`package schema`) importable by all 4 binaries.
**Status:** Complete — all 4 packages refactored, 63 tests pass

**New files:**
- `connector/schema/manifest.go` — SchemaManifest, TableInfo, ColumnInfo, ForeignKey
- `connector/schema/monitor.go` — MonitorReport, CheckResult, Baseline, ReportSummary

**Modified files:** 20 files across introspect/, tagger/, monitor/, dashboard/ — all type references qualified with `schema.` prefix

---

## PostgreSQL Adapter for Monitor

**Date:** 2026-03-06
**Session:** Session 5
**Decision:** Added `MonitorAdapter` interface to `connector/monitor/` with MySQL and PostgreSQL implementations
**Rationale:** The introspect tool already had a swappable adapter pattern, but the monitor's 5 baseline queries and 6 check queries were hardcoded MySQL (YEAR(), MONTH(), CURDATE(), backtick quoting). This blocked monitoring against PostgreSQL targets. Following the same adapter pattern from introspect: interface + factory + per-driver implementations.
**Status:** Complete — 63 tests pass (59 original + 3 adapter factory + 1 new count check)

**Architecture:**
- `adapter.go` — `MonitorAdapter` interface (11 methods: 5 baseline + 6 checks) + `NewMonitorAdapter()` factory
- `adapter_mysql.go` — All existing MySQL queries extracted from baseline.go and checks.go
- `adapter_postgres.go` — All queries ported to PostgreSQL syntax
- `adapter_test.go` — Factory tests (mysql, postgres, default)

**MySQL → PostgreSQL translations:**
| MySQL | PostgreSQL |
|-------|-----------|
| `YEAR(col)` | `EXTRACT(YEAR FROM col)::int` |
| `MONTH(col)` | `EXTRACT(MONTH FROM col)::int` |
| `CURDATE()` | `CURRENT_DATE` |
| `` `tabName` `` | `"tabName"` |

**Refactored functions:**
- `ComputeBaselines(db, adapter)` — delegates queries to adapter
- `AllChecks(adapter)` — returns closures that pass adapter to each check
- `RunMonitor(db, adapter, ...)` — passes adapter through
- `RunScheduled(db, adapter, ...)` — passes adapter through

---

## E2E Pipeline Validation (Session 5)

**Date:** 2026-03-06
**Session:** Session 5
**Decision:** Full pipeline validated end-to-end against live ERPNext after shared types + adapter refactor
**Rationale:** After significant refactoring (shared types + adapter pattern), need to verify the full pipeline still works against the live database.
**Status:** Complete

**Results:**
| Step | Tool | Result |
|------|------|--------|
| Introspect | `go run ./introspect/` | 876 tables discovered |
| Tag | `go run ./tagger/` | 23 tables tagged, 7 concepts |
| Monitor | `go run ./monitor/` | 5 baselines, 6 checks (all FAIL — detecting seeded DQ) |
| Dashboard | `go run ./dashboard/` | Health + summary APIs verified |

---

## PostgreSQL Live Validation

**Date:** 2026-03-06
**Session:** Session 6
**Decision:** Added `targets/postgres-hr/` — standalone PostgreSQL target with ERPNext-compatible HR schema for adapter validation
**Rationale:** Both introspect and monitor PostgreSQL adapters were built in Sessions 4-5 but never tested against a live PostgreSQL database. To prove the adapter pattern works end-to-end, created a PostgreSQL 15 target with identical table structures (same `tab`-prefixed naming), seeded with the same 32,158 records and 6 categories of DQ issues (same random seed=42 for reproducibility).
**Status:** Complete — full pipeline validated against live PostgreSQL

**New files:**
- `targets/postgres-hr/docker-compose.yml` — PostgreSQL 15-alpine on port 5433
- `targets/postgres-hr/seed/seed.py` — Creates schema DDL + seeds matching data
- `targets/postgres-hr/seed/requirements.txt` — psycopg2-binary

**E2E Results (PostgreSQL):**
| Step | Tool | Result |
|------|------|--------|
| Introspect | `go run ./introspect/ --driver postgres` | 12 tables discovered |
| Tag | `go run ./tagger/` | 8 tables tagged, 6 concepts |
| Monitor | `go run ./monitor/ --driver postgres` | 5 baselines, 6 checks (all FAIL — detecting seeded DQ) |
| Dashboard | `go run ./dashboard/ --port 8091` | Health + summary + checks APIs verified |

**MySQL vs PostgreSQL Detection Parity:**
| Check | ERPNext (MySQL) | PostgreSQL | Match |
|-------|----------------|------------|-------|
| salary_gap | 237 gaps | 237 gaps | YES |
| negative_leave | 13 | 13 | YES |
| missing_termination | 5 | 5 | YES |
| missing_payroll | 3 months | 3 months | YES |
| invalid_hire_date | 8 | 8 | YES |
| contribution_imbalance | 89 slips | 89 slips | YES |

**Baseline Parity (identical values):**
| Metric | MySQL | PostgreSQL |
|--------|-------|-----------|
| monthly_employee_count | 177.75 | 177.75 |
| monthly_gross_total | 1,235,222.43 | 1,235,222.43 |
| monthly_avg_gross | 6,945.19 | 6,945.19 |
| avg_leave_allocation | 12.21 | 12.21 |
| monthly_payroll_runs | 1.00 | 1.00 |

---

## Pending (Session 7)

- [ ] Integrate monitoring dashboard with NoUI workspace UI
- [ ] Expand concept tagger with additional HR concepts
- [ ] Add MSSQL adapter for introspect and monitor (future Neospin support)
