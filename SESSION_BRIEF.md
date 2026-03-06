# SESSION_BRIEF.md — noui-connector-lab

_Updated: 2026-03-05 | Status: Ready for Session 1_

---

## Current State

Repository initialized. No Go code written yet. No seed data generated yet. OrangeHRM not yet running.

## Session 1 Scope

**Goal:** Working OrangeHRM environment + schema introspection producing a validated manifest

### Phase 1: Environment Setup
1. Start OrangeHRM via `targets/orangehrm/docker-compose.yml`
2. Complete OrangeHRM browser-based installer (see lab guide Section 3.3)
3. Verify direct DB access: `mysql -h 127.0.0.1 -P 3306 -u orangehrm -porangehrm orangehrm`
4. Confirm table count ≥ 90

### Phase 2: Seed Data
1. Write `targets/orangehrm/seed/seed.py`
2. Run: `python3 seed.py --employees 200 --years 3 --dq-issues`
3. Verify:
   - Employee count: ~200 (170 active, 30 terminated)
   - Salary records: ~7,200
   - Payroll run records: 36 months × 4 runs = 144 runs
   - DQ issues embedded: salary gaps (12), negative leave balances (15), missing termination records (5), missing payroll runs (3 months)

### Phase 3: Schema Introspection
1. `cd connector && go mod tidy` (go.mod already initialized)
2. Scaffold `connector/introspect/` with:
   - MariaDB adapter (connection, information_schema queries)
   - Schema manifest builder (tables, columns, data types, foreign keys, row counts)
   - JSON output to `targets/orangehrm/schema-manifest/manifest.json`
3. Run introspection
4. Verify manifest contains all tables with correct row counts

### Session 1 Exit Criteria
- [ ] OrangeHRM running and accessible at localhost:8080
- [ ] Seed data verified (row counts match targets above)
- [ ] `targets/orangehrm/schema-manifest/manifest.json` generated
- [ ] Manifest contains ≥ 90 tables
- [ ] Row counts in manifest match live DB counts
- [ ] BUILD_HISTORY.md updated
- [ ] All changes committed

## Environment Details

| Item | Value |
|------|-------|
| OrangeHRM URL | http://localhost:8080 |
| OrangeHRM admin | admin / Admin@1234 |
| MariaDB host | localhost:3306 |
| MariaDB DB | orangehrm |
| MariaDB user | orangehrm / orangehrm |
| MariaDB root | root / noui_root |
| Go version | 1.21+ |
| Python version | 3.10+ |

## Key Reference Files

- `docs/orangehrm-lab-guide.docx` — Full lab guide (Sections 3-5 most relevant for Session 1)
- `CLAUDE.md` — Governing instructions
- `BUILD_HISTORY.md` — Prior decisions

## Concept Tags (Phase B — Session 2)

Session 1 does NOT implement concept tagging. That is Session 2 scope.
The 7 target concept tags are documented in the lab guide (Section 5.3).

## DQ Issues Reference (for seed script)

| Category | Count | Detection Signal |
|----------|-------|-----------------|
| Salary history gaps | 12 employees | Missing records in date range |
| Negative leave balances | 15 employees | balance < 0 |
| Missing termination records | 5 employees | status=inactive, no termination row |
| Missing payroll runs | 3 months | expected run count not met |
| Invalid hire dates | 8 employees | joined_date in future |
| Contribution imbalance | 10 employees | calculated vs stored mismatch |
