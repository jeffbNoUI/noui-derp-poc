# noui-derp-poc — Build History

## Format

Each entry: Date | Session | Decision/Change | Rationale | Status

---

## DERP POC Session 1

**Date:** 2026-03-06
**Session:** DERP POC Session 1

### Commit 1: Prototype Features (1c9686f)
**Decision:** Added full prototype feature set — composition engine, 4 navigation models (Guided/Deck/Expert/Orbit), staff dashboards (Executive/Supervisor/CSR), member search, command palette, service map, vendor portal, contextual help, live summary, proficiency selector, 8 workflow stages, demo cases.
**Rationale:** Establish end-to-end prototype demonstrating NoUI's AI-composed workspace concept across all user roles (staff, member, employer, vendor).
**Status:** Complete

### Commit 2: Float Precision Fix (0f97d42)
**Decision:** Fixed eligibility float precision, tuned compose-sim prompts.
**Rationale:** Ensure benefit calculations match hand-calculated values to the cent.
**Status:** Complete

### Commit 3: Quality Gate Tuning (b2daae9)
**Decision:** Tuned compose-sim prompts to pass all 3 quality gates (97% panels, 96% alerts, 100% view mode).
**Rationale:** Validate AI composition engine against deterministic quality thresholds.
**Status:** Complete

### Commit 4: Three New Microservices (805c537)
**Decision:** Added Knowledge Base (8087), Data Quality Engine (8086), and Correspondence (8085) Go microservices with PostgreSQL schemas/seeds, React frontend components, API clients, docker-compose wiring, and Vite proxy config.
**Rationale:** Extend platform with KB-driven contextual help, data quality monitoring, and template-based correspondence generation.
**Status:** Complete

### Commit 5: Frontend Wiring + Tests (current)
**Decision:** Wired DataQualityPanel and CorrespondencePanel into StaffPortal sidebar navigation. Added unit tests for all 3 new Go services (44 tests total).
**Rationale:** Make new frontend components accessible from staff portal. Establish test coverage for handler helpers, health checks, template rendering, and response serialization.
**Status:** Complete

---

## Service Inventory

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | DERP database (PostgreSQL 16) |
| connector | 8081 | Schema discovery & member data |
| intelligence | 8088 (host) / 8082 (internal) | Rules engine & benefit calculation |
| crm | 8084 | Contact relationship management |
| correspondence | 8085 | Template-based letter generation |
| dataquality | 8086 | Data quality scoring & monitoring |
| knowledgebase | 8087 | Contextual help articles & rules |
| frontend | 3000 | React app (Vite dev) / 80 (Docker) |

---

## DERP POC Session 3

**Date:** 2026-03-06
**Session:** DERP POC Session 3

### Commit 6: Frontend Test Coverage + Visual QA Fixes
**Decision:** Configured Vitest with jsdom environment, added @testing-library/react and @testing-library/jest-dom. Created 21 frontend component tests across 3 test files: StaffPortal (9 tab smoke tests), CommandPalette (6 tests: open/close, search filtering, keyboard nav, categories), RetirementApplication (6 tests: render, case ID, navigation, status bar). Fixed Unicode escape rendering bug in JSX text content across RetirementApplication.tsx and NavigationModelPicker.tsx (bare `\u2190` in JSX renders as literal text, wrapped in `{'\u2190'}` for correct rendering). Remapped intelligence service host port from 8082 to 8088 to avoid conflict with connector-lab.
**Rationale:** Establish frontend test coverage baseline. Fix visual rendering bugs found during browser QA. Prevent port conflicts with sibling connector-lab project.
**Status:** Complete

### Docker Compose Validation
**Decision:** Verified all 8 containers (postgres + 6 Go services + frontend) start and run healthy. All `/healthz` endpoints return OK. All API endpoints return real data through nginx proxy (members, benefit calculation, DQ checks, KB articles, correspondence templates, CRM contacts). Frontend serves at port 3000.
**Rationale:** Confirm full stack runs end-to-end in Docker.
**Status:** Complete (validated against existing running stack)

### Visual QA
**Decision:** Clicked through all 8 StaffPortal tabs — all render data correctly. Command Palette opens with Ctrl+K, shows 9 commands across 3 categories, keyboard navigation works. Walked through 3 stages of retirement application in Guided mode (Intake → Verify Employment → Salary & AMS) — all render real backend data with contextual help. No console errors.
**Rationale:** Confirm all UI components render correctly with live backend data.
**Status:** Complete

---

---

## DERP POC Session 4

**Date:** 2026-03-07
**Session:** DERP POC Session 4

### Commit 7: Expanded Command Palette + KB Standalone Tab
**Decision:** Expanded command palette from 9 to 17 entries. Lifted StaffPortal `activeTab` state to App level so commands navigate directly to specific tabs. Added Knowledge Base as 9th StaffPortal sidebar tab with browsable articles/rules panel.
**Rationale:** Make all StaffPortal tabs accessible from the command palette (Ctrl+K). Add standalone KB browsing capability separate from the workflow-specific ContextualHelp.
**Status:** Complete

**Command Palette (17 entries):**
| Category | Commands |
|----------|----------|
| Navigation (14) | Work Queue (G Q), Search Member (G M), Supervisor Dashboard (G S), Executive Dashboard (G E), CSR Hub (G H), Service Map (G P), Data Quality (G D), Correspondence (G X), Knowledge Base (G K), Open CRM (G C), Member Portal, Employer Portal, Vendor Portal |
| Actions (1) | Run Calculation |
| Cases (3) | Robert Martinez, Jennifer Kim, David Washington |

**Architecture changes:**
- `StaffTab` type exported from StaffPortal for App-level state management
- StaffPortal accepts optional `activeTab`/`onTabChange` props (backwards-compatible — falls back to internal state)
- `goToStaffTab()` helper in App sets both `staffTab` and `viewMode('staff')` atomically
- New `KnowledgeBasePanel` component in `components/admin/` with article search, expandable details, rules table

**Test changes:**
- StaffPortal: 11 tests (was 9) — added KB tab render + controlled tab prop test
- CommandPalette: 6 tests (unchanged — uses generic test commands)
- RetirementApplication: 6 tests (unchanged)
- **Total frontend tests: 23** (was 21)

---

## Remaining Work

- [ ] Full integration tests against live DB for new services
- [ ] Error handling review across all services

---

# Connector Lab Build History

## ERPNext Docker Stack

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

## Embedded HTML Dashboard

**Date:** 2026-03-06
**Session:** Session 7
**Decision:** Added embedded HTML dashboard served from the Go binary via `embed.FS`
**Rationale:** The dashboard API had 7 JSON endpoints but no visual interface. The NoUI workspace needs a self-contained monitoring UI that ships with the binary — no separate frontend build required. Uses Go 1.16+ `embed` directive to serve `static/index.html` at the root path.
**Status:** Complete — 2 new tests pass (20 total dashboard tests)

**Features:**
- Summary cards (total/pass/warn/fail counts)
- Baseline metrics table
- Filterable check results with expandable details
- Run history table
- Auto-refresh every 30 seconds
- Responsive layout

---

## Expanded Concept Tagger (5 New Concepts)

**Date:** 2026-03-06
**Session:** Session 7
**Decision:** Added 5 new HR concept definitions to the signal-based tagger
**Rationale:** The original 7 concepts covered core HR/payroll (employee, salary, payroll, leave, timeline, attendance, benefits). Real ERP systems like ERPNext have additional HR domains worth identifying. Each new concept follows the same signal-based architecture with auditable weights and thresholds.
**Status:** Complete — 5 new concept tests + updated fixture test, 16 total tagger tests pass

**New concepts:**
| Concept | Threshold | Key Signals |
|---------|-----------|-------------|
| training-record | 3.0 | Table name: training/certification/skill; columns: trainer, course, event_name; completion: result, grade, hours |
| expense-claim | 3.0 | Table name: expense/reimbursement; columns: claim_amount, sanctioned_amount, expense_type; approval workflow |
| performance-review | 2.5 | Table name: appraisal/performance/review; columns: score, rating, goal, kpi; review period |
| shift-schedule | 3.0 | Table name: shift/roster; columns: shift_type, start_time, end_time; date range pattern |
| loan-advance | 3.0 | Table name: loan/advance; columns: loan_amount, repayment_amount, disbursement_date; interest/tenure |

**Total concepts:** 12 (7 original + 5 new)

---

## MSSQL Adapter (Introspect + Monitor)

**Date:** 2026-03-06
**Session:** Session 7
**Decision:** Added Microsoft SQL Server adapter for both schema introspection and monitoring
**Rationale:** Future Neospin support requires SQL Server. Following the proven adapter pattern from MySQL/PostgreSQL: interface + factory + per-driver implementation. No live MSSQL target yet — adapters are factory-tested and ready for E2E validation when a target is available.
**Status:** Complete — 2 new factory tests pass, 72 total tests

**New files:**
- `connector/introspect/mssql.go` — `MSSQLAdapter` implementing `SchemaAdapter` (3 methods)
- `connector/monitor/adapter_mssql.go` — `MSSQLMonitorAdapter` implementing `MonitorAdapter` (11 methods)

**MSSQL-specific translations:**
| MySQL | MSSQL |
|-------|-------|
| `` `tabName` `` | `[tabName]` |
| `CURDATE()` | `CAST(GETDATE() AS DATE)` |
| `YEAR(col)` | `YEAR(col)` (same) |
| `MONTH(col)` | `MONTH(col)` (same) |

**Introspect design:**
- Uses `sys.tables` + `sys.partitions` for accurate row counts
- Uses `sys.foreign_keys` + `sys.foreign_key_columns` for FK discovery
- Uses `INFORMATION_SCHEMA.COLUMNS` for column metadata
- Default schema: `dbo` (MSSQL convention)

**Dependencies added:** `github.com/microsoft/go-mssqldb v1.9.8`

**Usage:**
```bash
go run ./introspect/ --driver mssql --dsn "sqlserver://user:pass@host:1433?database=mydb" --db dbo --output manifest.json
go run ./monitor/ --driver mssql --dsn "sqlserver://user:pass@host:1433?database=mydb" --output report.json
```

---

## MSSQL Live Target

**Date:** 2026-03-06
**Session:** Session 8
**Decision:** Added `targets/mssql-hr/` — MSSQL target with Docker container, seed data, and full E2E validation
**Rationale:** The MSSQL adapter was built in Session 7 but never tested against a live database. Created an Azure SQL Edge container (ARM64-compatible alternative to MSSQL Server 2022) with identical schema, seed data (32,158 records, seed=42), and DQ issues. Validated full pipeline parity across all 3 database engines.
**Status:** Complete — all 8 checks, 5 baselines identical across MySQL, PostgreSQL, and MSSQL

**New files:**
- `targets/mssql-hr/docker-compose.yml` — Azure SQL Edge on port 1434
- `targets/mssql-hr/seed/seed.py` — MSSQL seed (pymssql, bracket quoting, DATETIME types)
- `targets/mssql-hr/seed/requirements.txt` — pymssql

**Driver name fix:** go-mssqldb registers as "sqlserver" for URL-style DSNs, not "mssql". Added mapping in both `introspect/main.go` and `monitor/main.go`: `if sqlDriver == "mssql" { sqlDriver = "sqlserver" }`

**Three-database parity:**
| Check | MySQL | PostgreSQL | MSSQL |
|-------|-------|-----------|-------|
| salary_gap | 237 | 237 | 237 |
| negative_leave | 13 | 13 | 13 |
| missing_termination | 5 | 5 | 5 |
| missing_payroll | 3 | 3 | 3 |
| invalid_hire_date | 8 | 8 | 8 |
| contribution_imbalance | 89 | 89 | 89 |
| stale_payroll | 3 months | 3 months | 3 months |
| stale_attendance | 65 days | 65 days | 65 days |

---

## Expanded Tagger Validation (Live ERPNext)

**Date:** 2026-03-06
**Session:** Session 8
**Decision:** Ran expanded 12-concept tagger against live ERPNext (876 tables)
**Rationale:** The 5 new concepts added in Session 7 were only tested against the fixture manifest. Needed live validation against the full ERPNext schema to confirm signal-based detection works at scale.
**Status:** Complete — 39 tables tagged across all 12 concepts

**Results:**
| Concept | Tables Tagged |
|---------|-------------|
| employee-master | 1 |
| salary-history | 2 |
| payroll-run | 1 |
| leave-balance | 8 |
| employment-timeline | 4 |
| attendance | 2 |
| benefit-deduction | 5 |
| training-record | 4 |
| expense-claim | 2 |
| performance-review | 6 |
| shift-schedule | 3 |
| loan-advance | 1 |

---

## Timeliness Checks

**Date:** 2026-03-06
**Session:** Session 8
**Decision:** Added 2 timeliness checks to the monitoring engine (8 total checks)
**Rationale:** The existing 6 checks covered completeness, validity, and consistency. Timeliness — detecting stale or lagging data — is a critical DQ dimension missing from the engine. Two new checks measure how far behind payroll and attendance data are.
**Status:** Complete — 34 monitor tests pass (up from 32)

**New checks:**
| Check | Category | FAIL threshold | WARN threshold |
|-------|----------|---------------|---------------|
| stale_payroll | timeliness | >2 months behind | >1 month behind |
| stale_attendance | timeliness | >30 days stale | >7 days stale |

**New adapter methods:** `QueryLatestSalarySlipDate`, `QueryLatestAttendanceDate` — implemented in all 3 adapters (MySQL, PostgreSQL, MSSQL)

---

## Dashboard Workspace Embedding

**Date:** 2026-03-06
**Session:** Session 8
**Decision:** Added workspace embedding support to the dashboard (embed mode, postMessage API, embed config endpoint)
**Rationale:** The NoUI workspace needs to embed the monitoring dashboard as an iframe within the workspace UI. This requires: compact embed mode (no header), bidirectional postMessage communication, and a discovery endpoint for the workspace to query capabilities.
**Status:** Complete — 22 dashboard tests pass (up from 20)

**Changes:**
- `server.go` — Added `handleEmbedConfig` handler + `/api/v1/embed/config` route
- `index.html` — Added `?embed=true` mode (hides header, compact layout), postMessage listener (refresh, setFilter), parent notification on refresh, fixed category filter (accuracy → timeliness)
- `server_test.go` — 2 new tests: `TestEmbedConfigEndpoint`, `TestEmbedConfigNoData`

**Embed config response:**
```json
{
  "embeddable": true,
  "version": "1.0",
  "features": { "postMessage": true, "embedMode": true, "autoRefresh": true },
  "endpoints": { "health": "/api/v1/health", ... },
  "has_data": true
}
```

**postMessage API:**
- Parent → Dashboard: `{ target: "noui-dashboard", action: "refresh" }` or `{ target: "noui-dashboard", action: "setFilter", status: "fail", category: "timeliness" }`
- Dashboard → Parent: `{ source: "noui-dashboard", type: "refreshed", data: { timestamp: "..." } }`

**Embed usage:**
```html
<iframe src="http://localhost:8090/?embed=true"></iframe>
```

---

## Session 8 Test Summary

| Package | Tests | Change |
|---------|-------|--------|
| dashboard | 22 | +2 (embed config) |
| introspect | 4 | — |
| tagger | 16 | — |
| monitor | 34 | +2 (timeliness) |
| **Total** | **78** | **+4** |

---

## Configurable Check Thresholds

**Date:** 2026-03-06
**Session:** Session 9
**Decision:** Extracted all hardcoded check thresholds into a configurable `Thresholds` struct with JSON file support
**Rationale:** Check thresholds (e.g. contribution imbalance 5%/10%, stale payroll 1/2 months, stale attendance 7/30 days) were hardcoded in checks.go. Different deployments may need different sensitivity levels. A `--thresholds` flag loads a JSON config file that merges with defaults — only overridden fields change.
**Status:** Complete — 3 new tests pass

**New files:**
- `connector/monitor/thresholds.go` — `Thresholds` struct, `DefaultThresholds()`, `LoadThresholds()`, `evaluateCountThreshold()`

**New CLI flag:**
```bash
go run ./monitor/ --thresholds thresholds.json ...
```

**Configurable values:**
| Threshold | Default | Purpose |
|-----------|---------|---------|
| salary_gap (warn/fail) | 1/1 | Count of gap-months to trigger |
| negative_leave_balance (warn/fail) | 1/1 | Count of negative allocations |
| missing_termination (warn/fail) | 1/1 | Count of missing separations |
| missing_payroll_run (warn/fail) | 1/1 | Count of missing months |
| invalid_hire_date (warn/fail) | 1/1 | Count of future dates |
| contribution_warn_pct | 5% | Salary slip deviation warn |
| contribution_fail_pct | 10% | Salary slip deviation fail |
| stale_payroll_warn_months | 1 | Months behind to warn |
| stale_payroll_fail_months | 2 | Months behind to fail |
| stale_attend_warn_days | 7 | Days stale to warn |
| stale_attend_fail_days | 30 | Days stale to fail |

**Count-based checks now support tiered thresholds:** Setting warn_at < fail_at enables a WARN zone between the two values instead of the previous binary pass/fail behavior.

---

## Webhook/Alert Integration

**Date:** 2026-03-06
**Session:** Session 9
**Decision:** Added webhook notification to the scheduler — POSTs status changes to a configurable URL
**Rationale:** Scheduled monitoring needs to alert external systems (Slack, PagerDuty, custom dashboards) when check statuses change. The webhook fires only on transitions (pass→fail, fail→pass, warn→fail, etc.), not on every run. First run establishes baseline — no notifications.
**Status:** Complete — 4 new tests pass

**New CLI flag:**
```bash
go run ./monitor/ --schedule 5m --webhook-url https://hooks.slack.com/... ...
```

**New types:**
- `StatusChange` — records prev/new status for a single check
- `WebhookPayload` — JSON body sent on POST (event, timestamp, source, database, summary, changes)

**New functions:**
- `detectStatusChanges()` — compares current check results to previous run
- `sendWebhook()` — POSTs payload with 10s timeout, logs success/failure

**Webhook payload example:**
```json
{
  "event": "status_change",
  "timestamp": "2026-03-06T10:05:00Z",
  "source": "mysql",
  "database": "_0919b4e09c48d335",
  "summary": { "total_checks": 8, "passed": 6, "warnings": 0, "failed": 2 },
  "changes": [
    { "check_name": "salary_gap_check", "prev_status": "pass", "new_status": "fail", "message": "..." }
  ]
}
```

---

## Dashboard Trend Analysis

**Date:** 2026-03-06
**Session:** Session 9
**Decision:** Added `/api/v1/monitor/trends` endpoint to the dashboard for baseline drift and check status timeline analysis
**Rationale:** The scheduler writes timestamped history reports but there was no way to analyze trends over time. The trends endpoint reads all history files, computes baseline drift percentages and check status change counts, and returns a structured response for visualization.
**Status:** Complete — 3 new tests pass

**New CLI flag:**
```bash
go run ./dashboard/ --history-dir ./monitor-history/ ...
```

**New endpoint:** `GET /api/v1/monitor/trends`

**Response structure:**
- `data_points` — number of historical reports analyzed
- `time_range` — earliest and latest report timestamps
- `baseline_trends[]` — per-metric: name, data points (run_at + mean), drift percentage
- `check_timeline[]` — per-check: name, data points (run_at + status + actual), status change count

**New types:** `TrendResponse`, `BaselineTrend`, `TrendPoint`, `CheckTimeline`, `CheckTimePoint`

**New functions:**
- `loadHistoryReports()` — reads report-*.json from history dir, sorts by timestamp
- `computeTrends()` — builds drift calculations and status timelines

---

## Session 9 Test Summary

| Package | Tests | Change |
|---------|-------|--------|
| dashboard | 25 | +3 (trends endpoint, trends with history, no drift) |
| introspect | 4 | — |
| tagger | 16 | — |
| monitor | 41 | +7 (thresholds: 3, webhook: 4) |
| **Total** | **86** | **+8** |
