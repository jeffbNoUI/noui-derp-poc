# SESSION_BRIEF.md — noui-connector-lab

_Updated: 2026-03-06 | Status: Session 7 Complete_

---

## Current State

Two live targets running: ERPNext (MariaDB, port 3307) and PostgreSQL HR (port 5433). Both seeded with 32,158 records (200 employees, 3 years, 6 DQ issue categories). Full pipeline (introspect → tag → monitor → dashboard) validated end-to-end against both MySQL and PostgreSQL with identical detection results. Dashboard now has embedded HTML UI. Tagger expanded to 12 concepts. MSSQL adapter ready for future Neospin. 72 unit tests passing.

## Session 1 Summary (Complete)

- ERPNext Docker stack running (MariaDB 10.6, port 3307)
- Schema introspection tool built (`connector/introspect/`)
- Manifest generated: 876 tables from ERPNext database `_0919b4e09c48d335`

## Session 2 Summary (Complete)

- Concept tagger built (`connector/tagger/`) — 7 concept tags, 23 tables tagged
- Signal-based detection with full audit trail
- 11 unit tests passing

## Session 3 Summary (Complete)

**Goal:** Seed data, build monitoring engine, build dashboard API

### Deliverables

1. **Seed script** (`targets/erpnext/seed/seed.py`)
   - 200 employees, 3 salary structures, monthly salary slips/payroll entries
   - Leave allocations, applications, attendance records
   - 6 categories of embedded DQ issues (salary gaps, negative leave, missing terminations, missing payroll, invalid dates, contribution imbalance)
   - Idempotent, reproducible (seed=42), 32,158 total records

2. **Monitor engine** (`connector/monitor/`)
   - 5 statistical baselines computed from seeded data
   - 6 anomaly detection checks — all detecting seeded DQ issues
   - JSON report output with full evidence audit trail
   - 24 unit tests passing

3. **Dashboard API** (`connector/dashboard/`)
   - 7 REST endpoints serving monitoring results
   - Filterable checks (by status, category), baseline metrics, run history
   - CORS support, graceful shutdown, request logging
   - 18 unit tests passing

### DQ Detection Results
| Check | Detected | Status |
|-------|----------|--------|
| salary_gap_check | 237 gap-months across employees | FAIL |
| negative_leave_balance_check | 13 negative allocations | FAIL |
| missing_termination_check | 5 employees | FAIL |
| missing_payroll_run_check | 3 months | FAIL |
| invalid_hire_date_check | 8 employees | FAIL |
| contribution_imbalance_check | 89 slip-months >10% deviation | FAIL |

### Session 3 Exit Criteria
- [x] Seed data generated and verified (32,158 records)
- [x] Statistical baselines computed (5 metrics)
- [x] 6 monitoring checks implemented and detecting DQ issues
- [x] Dashboard API serving monitor report (7 endpoints)
- [x] All unit tests passing (tagger: 11, monitor: 24, dashboard: 18 = 53 total)
- [x] Full pipeline validated end-to-end
- [x] Code audit performed
- [x] BUILD_HISTORY.md updated
- [x] All changes committed

## Environment Details

| Item | Value |
|------|-------|
| ERPNext URL | http://localhost:8083 |
| ERPNext admin | Administrator / admin |
| MariaDB host | localhost:3307 |
| MariaDB DB | _0919b4e09c48d335 |
| MariaDB user | root / admin |
| ERPNext version | v16.8.1 |
| Go version | 1.26.1 |
| Dashboard API | http://localhost:8090 |

## Session 4 Summary (Complete)

**Goal:** Scheduled monitoring + PostgreSQL adapter

### Deliverables

1. **Scheduled monitoring** (`connector/monitor/scheduler.go`)
   - `--schedule` flag for periodic runs (e.g. `5m`, `1h`)
   - `--history-dir` for timestamped report accumulation
   - Graceful shutdown on SIGINT/SIGTERM
   - Each run writes latest report + timestamped history file
   - 3 unit tests passing

2. **PostgreSQL adapter** (`connector/introspect/`)
   - Refactored into `SchemaAdapter` interface with `NewAdapter()` factory
   - `mysql.go` — MySQL/MariaDB adapter (extracted from monolith)
   - `postgres.go` — PostgreSQL adapter (pg_stat_user_tables, constraint_column_usage)
   - `adapter.go` — Interface definition
   - `--driver postgres` support with `$N` placeholders
   - Added `github.com/lib/pq` dependency
   - 3 unit tests passing

### Session 4 Exit Criteria
- [x] Scheduled monitoring implemented with history accumulation
- [x] PostgreSQL adapter built for introspect tool
- [x] Swappable adapter pattern per CLAUDE.md requirement
- [x] All unit tests passing (tagger: 11, monitor: 27, dashboard: 18, introspect: 3 = 59 total)
- [x] Full pipeline validated end-to-end against live ERPNext
- [x] BUILD_HISTORY.md updated
- [x] All changes committed

## Full Pipeline Commands

```bash
# 1. Seed data
cd targets/erpnext/seed && pip install -r requirements.txt && python seed.py

# 2. Introspect schema
cd connector && go run ./introspect/ \
  --dsn "root:admin@tcp(127.0.0.1:3307)/_0919b4e09c48d335" \
  --db _0919b4e09c48d335 \
  --output ../targets/erpnext/schema-manifest/manifest.json

# 3. Tag concepts
go run ./tagger/ \
  --input ../targets/erpnext/schema-manifest/manifest.json \
  --output ../targets/erpnext/schema-manifest/manifest-tagged.json \
  --report ../targets/erpnext/schema-manifest/tags-report.json

# 4. Run monitoring checks (single run)
go run ./monitor/ \
  --output ../targets/erpnext/schema-manifest/monitor-report.json

# 4b. Run monitoring checks (scheduled, every 5 minutes)
go run ./monitor/ \
  --output ../targets/erpnext/schema-manifest/monitor-report.json \
  --schedule 5m \
  --history-dir ../targets/erpnext/schema-manifest/monitor-history/

# 5. Start dashboard API
go run ./dashboard/ \
  --report-file ../targets/erpnext/schema-manifest/monitor-report.json \
  --port 8090
```

## Session 5 Summary (Complete)

**Goal:** Shared types package, PostgreSQL monitor adapter, E2E pipeline validation

### Deliverables

1. **Shared types package** (`connector/schema/`)
   - Extracted 8 types into importable library package
   - `manifest.go` — SchemaManifest, TableInfo, ColumnInfo, ForeignKey
   - `monitor.go` — MonitorReport, CheckResult, Baseline, ReportSummary
   - All 4 binaries (introspect, tagger, monitor, dashboard) updated to import `schema`
   - Eliminated all type duplication across packages

2. **PostgreSQL monitor adapter** (`connector/monitor/`)
   - `MonitorAdapter` interface with 11 methods (5 baseline + 6 checks)
   - `adapter_mysql.go` — All MySQL queries extracted from inline code
   - `adapter_postgres.go` — All queries translated to PostgreSQL syntax
   - MySQL→PG translations: YEAR()→EXTRACT(), MONTH()→EXTRACT(), CURDATE()→CURRENT_DATE, backticks→double quotes
   - 3 adapter factory tests

3. **E2E pipeline validation**
   - Full pipeline run against live ERPNext after refactor
   - 876 tables introspected, 23 tagged, 6 checks (all FAIL detecting DQ issues)
   - Dashboard API verified (health + summary endpoints)

### Session 5 Exit Criteria
- [x] Shared types extracted, all type duplication eliminated
- [x] PostgreSQL adapter built for monitor (11 query methods)
- [x] Monitor refactored to adapter pattern (ComputeBaselines, AllChecks, RunMonitor, RunScheduled)
- [x] All unit tests passing (introspect: 3, tagger: 11, monitor: 30, dashboard: 18, adapter: 3 = 63 total)
- [x] Full pipeline validated end-to-end against live ERPNext
- [x] BUILD_HISTORY.md updated
- [x] All changes committed

## Session 6 Summary (Complete)

**Goal:** Validate PostgreSQL adapters against a live PostgreSQL database

### Deliverables

1. **PostgreSQL HR target** (`targets/postgres-hr/`)
   - PostgreSQL 15-alpine Docker container on port 5433
   - ERPNext-compatible schema (12 tables, `tab`-prefixed naming)
   - Seed script creating identical data: 200 employees, 3 years, 6 DQ categories
   - Same random seed (42) for reproducible, comparable results

2. **Full pipeline E2E validation against live PostgreSQL**
   - Introspect: 12 tables discovered with columns, FKs, and row counts
   - Tagger: 8 tables tagged across 6 concepts (signal-based, no hardcoding)
   - Monitor: All 6 checks detect identical DQ issues (237 gaps, 13 negative leave, 5 missing terminations, 3 missing payroll, 8 invalid dates, 89 imbalances)
   - Dashboard: All 7 API endpoints serving PG monitor report

3. **MySQL/PostgreSQL parity confirmed**
   - All check results identical between ERPNext (MySQL) and PostgreSQL targets
   - All 5 baseline metrics identical
   - Adapter pattern proven: same Go code, different SQL dialects, same results

### Session 6 Exit Criteria
- [x] PostgreSQL target running and seeded (32,158 records)
- [x] Introspect PG adapter validated against live database (12 tables)
- [x] Monitor PG adapter validated — all 6 checks detecting DQ issues
- [x] Tagger validated against PG manifest (8 tables, 6 concepts)
- [x] Dashboard API verified against PG monitor report
- [x] MySQL vs PostgreSQL detection parity confirmed
- [x] All unit tests passing (63 total)
- [x] BUILD_HISTORY.md updated
- [x] All changes committed

## PostgreSQL Target Environment

| Item | Value |
|------|-------|
| PostgreSQL host | localhost:5433 |
| PostgreSQL DB | hrlab |
| PostgreSQL user | hrlab / hrlab |
| PostgreSQL version | 15-alpine |
| Tables | 12 (ERPNext-compatible naming) |

## Full Pipeline Commands (PostgreSQL)

```bash
# 1. Start PostgreSQL
docker compose -f targets/postgres-hr/docker-compose.yml up -d

# 2. Seed data
cd targets/postgres-hr/seed && pip install -r requirements.txt && python seed.py

# 3. Introspect schema
cd connector && go run ./introspect/ \
  --driver postgres \
  --dsn "postgres://hrlab:hrlab@127.0.0.1:5433/hrlab?sslmode=disable" \
  --db public \
  --output ../targets/postgres-hr/schema-manifest/manifest.json

# 4. Tag concepts
go run ./tagger/ \
  --input ../targets/postgres-hr/schema-manifest/manifest.json \
  --output ../targets/postgres-hr/schema-manifest/manifest-tagged.json \
  --report ../targets/postgres-hr/schema-manifest/tags-report.json

# 5. Run monitoring checks
go run ./monitor/ \
  --driver postgres \
  --dsn "postgres://hrlab:hrlab@127.0.0.1:5433/hrlab?sslmode=disable" \
  --output ../targets/postgres-hr/schema-manifest/monitor-report.json

# 6. Start dashboard API
go run ./dashboard/ \
  --report-file ../targets/postgres-hr/schema-manifest/monitor-report.json \
  --port 8091
```

## Session 7 Summary (Complete)

**Goal:** Embedded dashboard UI, expanded tagger concepts, MSSQL adapter

### Deliverables

1. **Embedded HTML dashboard** (`connector/dashboard/static/index.html`)
   - Self-contained HTML/CSS/JS served via Go `embed.FS`
   - Summary cards, baseline metrics table, filterable checks, run history
   - Auto-refresh every 30 seconds, responsive layout
   - 2 new tests (20 total dashboard tests)

2. **5 new tagger concepts** (`connector/tagger/concepts.go`)
   - training-record, expense-claim, performance-review, shift-schedule, loan-advance
   - Signal-based detection with auditable weights and thresholds (2.5-3.5)
   - 5 new unit tests + updated fixture test (16 total tagger tests)
   - Fixture validates 10/11 tables tagged across 10 concepts

3. **MSSQL adapter** (`connector/introspect/mssql.go`, `connector/monitor/adapter_mssql.go`)
   - `MSSQLAdapter` implementing `SchemaAdapter` (3 methods: GetTables, GetColumns, GetForeignKeys)
   - `MSSQLMonitorAdapter` implementing `MonitorAdapter` (11 methods: 5 baseline + 6 checks)
   - Uses sys.tables/sys.partitions for row counts, sys.foreign_keys for FK discovery
   - Square bracket quoting, CAST(GETDATE() AS DATE), @p1/@p2 placeholders
   - 2 new factory tests (4 introspect + 32 monitor = 36 total)
   - Added `github.com/microsoft/go-mssqldb v1.9.8` dependency

### Session 7 Exit Criteria
- [x] Embedded HTML dashboard served at root path
- [x] 5 new concepts added with signal-based detection
- [x] MSSQL adapter for both introspect and monitor
- [x] All unit tests passing (dashboard: 20, introspect: 4, tagger: 16, monitor: 32 = 72 total)
- [x] All 4 binaries compile
- [x] BUILD_HISTORY.md updated
- [x] All changes committed

## What's Built So Far

| Component | Location | Status | Tests |
|-----------|----------|--------|-------|
| Shared types library | `connector/schema/` | Complete | — |
| Schema introspect (MySQL + PostgreSQL + **MSSQL**) | `connector/introspect/` | Complete | 4 |
| Concept tagger (**12 concepts**) | `connector/tagger/` | Complete | 16 |
| Monitor engine (6 checks + scheduler + PG + **MSSQL** adapter) | `connector/monitor/` | Complete | 32 |
| Dashboard API (7 endpoints + **HTML UI**) | `connector/dashboard/` | Complete | 20 |
| ERPNext seed (200 employees, 3yr) | `targets/erpnext/seed/seed.py` | Complete | — |
| ERPNext Docker stack | `targets/erpnext/docker-compose.yml` | Running | — |
| PostgreSQL HR seed (200 employees, 3yr) | `targets/postgres-hr/seed/seed.py` | Complete | — |
| PostgreSQL Docker stack | `targets/postgres-hr/docker-compose.yml` | Running | — |
