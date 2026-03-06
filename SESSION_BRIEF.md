# SESSION_BRIEF.md — noui-connector-lab

_Updated: 2026-03-05 | Status: Session 1 In Progress_

---

## Current State

Repository initialized. Go introspection code written but untested. ERPNext docker-compose created. No seed data generated yet. ERPNext not yet running.

## Session 1 Scope

**Goal:** Working ERPNext environment + schema introspection producing a validated manifest

### Phase 1: Environment Setup
1. Start ERPNext via `targets/erpnext/docker-compose.yml`
2. Wait for site creation to complete (~5 minutes)
3. Verify direct DB access: `mysql -h 127.0.0.1 -P 3307 -u root -padmin`
4. Confirm table count (ERPNext creates hundreds of DocType tables)

### Phase 2: Schema Introspection
1. `cd connector && go mod tidy`
2. Build and run `connector/introspect/` against ERPNext MariaDB
3. JSON output to `targets/erpnext/schema-manifest/manifest.json`
4. Verify manifest contains all tables with correct row counts

### Phase 3: Seed Data (if time permits)
1. Investigate ERPNext API or bench commands for data seeding
2. Create employees, salary structures, payroll entries, leave records
3. Embed DQ issues for anomaly detection validation

### Session 1 Exit Criteria
- [ ] ERPNext running and accessible at localhost:8080
- [ ] DB accessible at localhost:3307
- [ ] `targets/erpnext/schema-manifest/manifest.json` generated
- [ ] Manifest contains all ERPNext tables
- [ ] Row counts in manifest match live DB counts
- [ ] BUILD_HISTORY.md updated
- [ ] All changes committed

## Environment Details

| Item | Value |
|------|-------|
| ERPNext URL | http://localhost:8080 |
| ERPNext admin | Administrator / admin |
| MariaDB host | localhost:3307 |
| MariaDB user | root / admin |
| ERPNext version | v16.8.1 |
| Go version | 1.26.1 |

## Key Reference Files

- `CLAUDE.md` — Governing instructions
- `BUILD_HISTORY.md` — Prior decisions

## Concept Tags (Phase B — Session 2)

Session 1 does NOT implement concept tagging. That is Session 2 scope.
