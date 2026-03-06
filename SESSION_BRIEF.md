# SESSION_BRIEF.md — noui-connector-lab

_Updated: 2026-03-06 | Status: Session 4 Complete_

---

## Current State

ERPNext v16.8.1 running (port 8083, DB on port 3307). Database seeded with 32,158 records (200 employees, 3 years of salary/payroll/leave/attendance data, 6 categories of embedded DQ issues). Full monitoring pipeline operational: introspect → tag → monitor → dashboard API.

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

## Pending (Session 5)

- [ ] Integrate monitoring dashboard with NoUI workspace UI
- [ ] Expand concept tagger with additional HR concepts
- [ ] Test PostgreSQL adapter against a live PostgreSQL target
- [ ] Add PostgreSQL adapter to monitor (target-specific check queries)
