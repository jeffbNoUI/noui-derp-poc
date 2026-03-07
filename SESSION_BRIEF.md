# SESSION_BRIEF.md — noui-derp-poc

_Updated: 2026-03-06 | Status: DERP POC Session 3 Complete / Connector Lab Session 9 Complete_

---

## Current State

**DERP POC:** Full prototype deployed with 7 backend services and React frontend. All staff dashboards, workflow stages, navigation models, and portal views functional. DataQualityPanel and CorrespondencePanel wired into StaffPortal navigation. Frontend test coverage established (21 Vitest tests). Docker Compose validated end-to-end. Visual QA complete — all tabs render, command palette works, retirement workflow navigates correctly. Unit tests passing for all 3 new Go services (44 tests).

**Connector Lab:** Three live targets running: ERPNext (MariaDB, port 3307), PostgreSQL HR (port 5433), and MSSQL HR (Azure SQL Edge, port 1434). All seeded with 32,158 records (200 employees, 3 years, 6 DQ issue categories). Full pipeline (introspect → tag → monitor → dashboard) validated end-to-end against all 3 databases with identical detection results (8 checks, 5 baselines). Dashboard supports workspace embedding via iframe with postMessage API and trend analysis from history data. Tagger expanded to 12 concepts, all validated against live ERPNext (39 tables tagged). Monitor supports configurable thresholds via JSON file and webhook notifications on check status changes. 86 unit tests passing.

## What Was Built (DERP POC Session 3)

### Frontend Test Infrastructure
- **Vitest** configured with jsdom, @testing-library/react, @testing-library/jest-dom
- `vitest.config.ts` — test environment with path aliases
- `src/test/setup.ts` — global fetch mock, localStorage mock, jest-dom matchers
- `src/test/helpers.tsx` — QueryClientProvider wrapper for component tests

### Test Coverage (21 frontend tests)
- **StaffPortal** (9 tests): All 8 tab renders + sidebar nav validation
- **CommandPalette** (6 tests): Open/close, search filtering, keyboard navigation, escape, categories
- **RetirementApplication** (6 tests): Render, case ID display, back button, navigation model, status bar, empty flags

### Bug Fixes
- **Unicode escape rendering**: Fixed bare `\u2190`, `\u00b7`, `\u25be`, `\u2713` in JSX text content — wrapped in JS expressions for correct rendering
- **Intelligence port conflict**: Remapped host port from 8082 to 8088 (connector-lab uses 8082)

### Docker Compose Validation
- All 8 containers verified healthy (postgres + 6 Go services + frontend)
- All `/healthz` endpoints return OK
- All API endpoints return real data through nginx proxy
- TypeScript excluded test files from production build

## What Was Built (Session 1)

### Frontend
- **StaffPortal**: Work Queue, Member Lookup, Supervisor Dashboard, Executive Dashboard, CSR Hub, Service Map, Data Quality, Correspondence (8 tabs)
- **RetirementApplication**: 8-stage workflow with Guided/Assisted/Expert navigation modes
- **MemberPortal**, **EmployerPortal**, **VendorPortal**: Role-specific views
- **CommandPalette**: Global Ctrl+K navigation (9 commands)
- **ContextualHelp**: KB-driven stage help with proficiency awareness

### Backend Services (6 Go services)
1. **Connector** (8081) — Schema discovery, member/employment/service-credit data
2. **Intelligence** (8088 host / 8082 internal) — Eligibility, benefit calculation, DRO, scenarios
3. **CRM** (8084) — Contact management, interaction history
4. **Correspondence** (8085) — Template rendering, merge fields, letter history
5. **Data Quality** (8086) — DQ checks, scoring, issues, trend analysis
6. **Knowledge Base** (8087) — Articles, stage help, rule references, search

### Test Coverage
- `intelligence/rules/`: Benefit calculation, DRO, payment options, IPR, death benefit
- `correspondence/api/`: Health, helpers, template rendering (17 tests)
- `dataquality/api/`: Health, helpers, model serialization (14 tests)
- `knowledgebase/api/`: Health, helpers, search validation (13 tests)
- `frontend/src/components/__tests__/`: StaffPortal, CommandPalette, RetirementApplication (21 tests)

## Next Session Scope

### Priority 1: Expanded Command Palette
1. Add entries for DQ, Correspondence, KB, Supervisor, Executive, CSR, Service Map (expand to 16)

### Priority 2: KB Standalone Tab
1. Add Knowledge Base as standalone StaffPortal tab

### Priority 3: Integration Tests
1. Integration tests with live database for CRUD operations
2. Error handling review across all services

## Environment Details

| Item | Value |
|------|-------|
| Frontend URL | http://localhost:3000 |
| PostgreSQL | localhost:5432 (derp/derp) |
| Connector | localhost:8081 |
| Intelligence | localhost:8088 (host) / 8082 (internal) |
| CRM | localhost:8084 |
| Correspondence | localhost:8085 |
| Data Quality | localhost:8086 |
| Knowledge Base | localhost:8087 |

## Key Reference Files

- `CLAUDE.md` — Governing instructions
- `BUILD_HISTORY.md` — Prior decisions
- `docker-compose.yml` — Full service topology
- `frontend/vite.config.ts` — API proxy config
- `frontend/vitest.config.ts` — Test configuration

---

# Connector Lab Sessions

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

## Session 8 Summary (Complete)

**Goal:** MSSQL live target, tagger validation, timeliness checks, workspace embedding

### Deliverables

1. **MSSQL live target** (`targets/mssql-hr/`)
   - Azure SQL Edge Docker container on port 1434 (ARM64-compatible)
   - Seed script with 32,158 records (same schema, data, DQ issues as MySQL/PG)
   - Full E2E pipeline validated: 12 tables introspected, 8 tagged, 8 checks, 5 baselines
   - Three-database parity confirmed: identical results across MySQL, PostgreSQL, MSSQL
   - Fixed go-mssqldb driver name mapping (mssql → sqlserver for URL-style DSNs)

2. **Expanded tagger live validation**
   - Ran 12-concept tagger against live ERPNext (876 tables)
   - 39 tables tagged across all 12 concepts
   - All 5 new concepts (training, expense, performance, shift, loan) successfully detecting ERPNext tables

3. **Timeliness checks** (`connector/monitor/checks.go`)
   - 2 new checks: stale_payroll (months behind), stale_attendance (days stale)
   - New adapter methods: QueryLatestSalarySlipDate, QueryLatestAttendanceDate
   - Implemented in all 3 adapters (MySQL, PostgreSQL, MSSQL)
   - Total checks: 8 (up from 6)
   - 2 new monitor tests (34 total)

4. **Dashboard workspace embedding** (`connector/dashboard/`)
   - `?embed=true` mode: hides header, compact layout for iframe embedding
   - postMessage API: parent can send refresh/setFilter commands, dashboard notifies on refresh
   - `/api/v1/embed/config` endpoint: returns capabilities, feature flags, endpoint map
   - Fixed category filter: accuracy → timeliness
   - 2 new tests (22 total dashboard tests)

### Session 8 Exit Criteria
- [x] MSSQL target running, seeded, and validated E2E
- [x] Three-database parity confirmed (all 8 checks, 5 baselines identical)
- [x] Expanded tagger validated against live ERPNext (39 tables, 12 concepts)
- [x] 2 timeliness checks added to monitoring engine
- [x] Dashboard workspace embedding implemented (embed mode, postMessage, config endpoint)
- [x] All unit tests passing (dashboard: 22, introspect: 4, tagger: 16, monitor: 34 = 78 total)
- [x] BUILD_HISTORY.md updated
- [x] SESSION_BRIEF.md updated

## MSSQL Target Environment

| Item | Value |
|------|-------|
| MSSQL host | localhost:1434 |
| MSSQL DB | hrlab |
| MSSQL user | sa / NoUI_Lab2026! |
| Image | Azure SQL Edge (ARM64) |
| Tables | 12 (ERPNext-compatible naming) |

## Full Pipeline Commands (MSSQL)

```bash
# 1. Start MSSQL
docker compose -f targets/mssql-hr/docker-compose.yml up -d

# 2. Seed data
cd targets/mssql-hr/seed && pip install -r requirements.txt && python seed.py

# 3. Introspect schema
cd connector && go run ./introspect/ \
  --driver mssql \
  --dsn "sqlserver://sa:NoUI_Lab2026!@127.0.0.1:1434?database=hrlab&encrypt=disable" \
  --db dbo \
  --output ../targets/mssql-hr/schema-manifest/manifest.json

# 4. Tag concepts
go run ./tagger/ \
  --input ../targets/mssql-hr/schema-manifest/manifest.json \
  --output ../targets/mssql-hr/schema-manifest/manifest-tagged.json \
  --report ../targets/mssql-hr/schema-manifest/tags-report.json

# 5. Run monitoring checks
go run ./monitor/ \
  --driver mssql \
  --dsn "sqlserver://sa:NoUI_Lab2026!@127.0.0.1:1434?database=hrlab&encrypt=disable" \
  --output ../targets/mssql-hr/schema-manifest/monitor-report.json

# 6. Start dashboard (with embedding)
go run ./dashboard/ \
  --report-file ../targets/mssql-hr/schema-manifest/monitor-report.json \
  --port 8092
# Access: http://localhost:8092/?embed=true
```

## Session 9 Summary (Complete)

**Goal:** Configurable thresholds, trend analysis, webhook alerts

### Deliverables

1. **Configurable check thresholds** (`connector/monitor/thresholds.go`)
   - `Thresholds` struct with per-check warn/fail boundaries
   - JSON config file support via `--thresholds` flag
   - Merges with defaults — only specified fields are overridden
   - Count-based checks support tiered warn/fail zones
   - 3 new tests (41 total monitor tests)

2. **Webhook/alert integration** (`connector/monitor/scheduler.go`)
   - `--webhook-url` flag for POST notifications on status changes
   - `detectStatusChanges()` compares current vs previous run
   - First run establishes baseline (no notifications)
   - 10s HTTP timeout, logged success/failure
   - `WebhookPayload` includes event, summary, and list of changes
   - 4 new tests

3. **Dashboard trend analysis** (`connector/dashboard/server.go`)
   - `--history-dir` flag points to timestamped report directory
   - `GET /api/v1/monitor/trends` endpoint
   - Baseline drift: percentage change from first to last data point per metric
   - Check timeline: status changes over time per check
   - `loadHistoryReports()` reads and sorts report-*.json files
   - 3 new tests (25 total dashboard tests)

### Session 9 Exit Criteria
- [x] All hardcoded thresholds extracted into configurable struct
- [x] JSON threshold config file support with merge semantics
- [x] Webhook notification on check status changes
- [x] Trend analysis endpoint reading history data
- [x] All unit tests passing (dashboard: 25, introspect: 4, tagger: 16, monitor: 41 = 86 total)
- [x] BUILD_HISTORY.md updated
- [x] SESSION_BRIEF.md updated

## What's Built So Far

| Component | Location | Status | Tests |
|-----------|----------|--------|-------|
| Shared types library | `connector/schema/` | Complete | — |
| Schema introspect (MySQL + PostgreSQL + MSSQL) | `connector/introspect/` | Complete | 4 |
| Concept tagger (12 concepts) | `connector/tagger/` | Complete | 16 |
| Monitor engine (8 checks + thresholds + scheduler + webhooks + 3 adapters) | `connector/monitor/` | Complete | 41 |
| Dashboard API (9 endpoints + HTML UI + embed + trends) | `connector/dashboard/` | Complete | 25 |
| ERPNext seed (200 employees, 3yr) | `targets/erpnext/seed/seed.py` | Complete | — |
| ERPNext Docker stack | `targets/erpnext/docker-compose.yml` | Running | — |
| PostgreSQL HR seed (200 employees, 3yr) | `targets/postgres-hr/seed/seed.py` | Complete | — |
| PostgreSQL Docker stack | `targets/postgres-hr/docker-compose.yml` | Running | — |
| MSSQL HR seed (200 employees, 3yr) | `targets/mssql-hr/seed/seed.py` | Complete | — |
| MSSQL Docker stack | `targets/mssql-hr/docker-compose.yml` | Running | — |
