# noui-connector-lab — Build History

## Format

Each entry: Date | Session | Decision/Change | Rationale | Status

---

## Repository Initialization

**Date:** 2026-03-05
**Session:** Repo init (pre-Claude Code)
**Decision:** Created `noui-connector-lab` as a standalone repository separate from `noui-derp-poc`
**Rationale:** Schema discovery and monitoring logic is plan-agnostic. Developing it inside the DERP demo repo would muddy the POC's purpose. A standalone lab repo enables testing against multiple target systems (OrangeHRM → Neospin → COPERA) without client-specific coupling. Proven logic is promoted to `noui-derp-poc/services/connector/`.
**Status:** Complete

**Decision:** OrangeHRM 5.6 + MariaDB 10.11 selected as first lab target
**Rationale:** Open-source, fully documented schema (~100 tables), realistic HR/payroll transactional depth, Docker-installable, front end observable. Structural analog to Neospin: employee master, salary history, leave balances, payroll runs, employment timeline. Resolves open assumption: "What system can serve as a proxy legacy database for Data Connector schema-learning validation before Neospin access?"
**Status:** Complete — OrangeHRM docker-compose.yml created

---

## Pending (Next Claude Code Session)

- [ ] Initialize Go module (go.mod already present — run `go mod tidy`)
- [ ] Scaffold `connector/introspect` service with MariaDB adapter
- [ ] Write and run OrangeHRM seed script (200 employees, 3 years, DQ issues)
- [ ] Verify seed data: row counts, DQ issue counts, date ranges
- [ ] Generate first schema manifest
