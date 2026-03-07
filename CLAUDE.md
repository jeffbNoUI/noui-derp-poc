# noui-connector-lab — Claude Code Instructions

## What This Repository Is

This is the **NoUI Connector Development Lab** — a standalone workbench for developing and validating the Data Connector's schema-discovery, concept-tagging, and operational-monitoring capabilities against real legacy systems.

It is **not** a demo system. It is **not** client-specific. It is plan-agnostic infrastructure development.

The first target system is **ERPNext** (MariaDB). Future targets will be added under `targets/`.

## Relationship to noui-derp-poc

- `noui-derp-poc` is the DERP-specific proof of concept and demo system.
- `noui-connector-lab` is where generic connector capabilities are developed and validated.
- Proven connector logic here gets ported/promoted into `noui-derp-poc/services/connector/`.
- These repos are siblings, not nested. Do not reference one from the other at the code level.

## Architecture

```
noui-connector-lab/
├── connector/              # Generic connector tooling (Go)
│   ├── introspect/         # Schema discovery engine (MySQL + PostgreSQL adapters)
│   ├── tagger/             # Concept tagging logic
│   ├── monitor/            # Anomaly detection + scheduled monitoring
│   └── dashboard/          # REST API serving monitoring results
├── targets/
│   └── erpnext/            # First target system
│       ├── docker-compose.yml
│       ├── seed/           # Data generation scripts
│       ├── schema-manifest/ # Introspection output artifacts
│       ├── monitoring-checks/ # Target-specific check configs
│       └── docs/           # Target-specific notes
├── docs/                   # Lab-level documentation
└── tools/                  # Shared utilities
```

## Governing Principles

### What This Lab Validates
1. **Schema introspection**: Can the connector map an unfamiliar schema without prior knowledge?
2. **Concept tagging**: Can it identify salary-history-like, leave-balance-like, payroll-run-like tables by signal rather than name?
3. **Anomaly detection**: Can it detect operational anomalies against a statistical baseline?

### Code Standards
- Go for all connector tooling (same as noui-derp-poc)
- No hardcoded schema knowledge — all discovery must be signal-based
- Every concept tag must reference the signals that triggered it (auditable)
- Every anomaly check must define its baseline calculation explicitly
- Tests run against the live ERPNext database (seeded state)

### AI Boundaries (Same as noui-derp-poc)
- AI may assist with schema analysis and pattern identification
- AI does NOT execute business calculations or make fiduciary determinations
- All tagging heuristics are human-reviewed before promotion to production

### What "Done" Looks Like for ERPNext Target
- [ ] Schema manifest generated (all tables described)
- [ ] 7 core concept tags correctly assigned
- [ ] Statistical baseline established from 3 years of clean seed data
- [ ] 6 monitoring checks running and detecting seeded DQ issues
- [ ] Monitoring dashboard surfaced via NoUI workspace API

## Session Startup Checklist

Before writing any code in a Claude Code session:
1. Read `CLAUDE.md` (this file)
2. Read `BUILD_HISTORY.md` — understand current state
3. Read `SESSION_BRIEF.md` — binding session scope
4. Confirm ERPNext is running: `docker compose -f targets/erpnext/docker-compose.yml ps`
5. Confirm DB is accessible: `mysql -h 127.0.0.1 -P 3307 -u root -padmin -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema LIKE '_%%';"`

## Technology

- **Language**: Go 1.21+
- **Target DB (ERPNext)**: MariaDB 10.6
- **Future targets**: PostgreSQL (Neospin/DERP), potentially MSSQL
- **Connector DB adapter**: Must be swappable per target — no MariaDB-specific code in core connector logic
- **API**: RESTful JSON, same conventions as noui-derp-poc (see docs/api-conventions.md when created)

## Commit Discipline

- Commit after each logical unit of work
- Format: `[target/component] Brief description`
- Example: `[erpnext/seed] Add 200-employee seed with DQ issues`
- Update BUILD_HISTORY.md after every commit
- Never commit schema-manifest output files as build artifacts — they are generated outputs

## Monetary and Precision Rules

Not applicable to this repo (no benefit calculations). However:
- Statistical baselines use float64 internally, rounded to 2 decimal places in output
- Never use integer division where fractional results are expected
