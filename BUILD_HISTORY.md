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
**Status:** In progress — docker-compose created, awaiting first run

---

## Pending

- [ ] Start ERPNext and verify site creation
- [ ] Run `go mod tidy` and build introspection tool
- [ ] Generate first schema manifest from ERPNext
- [ ] Investigate seed data approach (bench commands vs API vs direct SQL)
