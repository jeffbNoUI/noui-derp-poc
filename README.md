# noui-connector-lab

**NoUI Connector Development Lab** — schema discovery, concept tagging, and operational monitoring against real legacy systems.

This is a plan-agnostic infrastructure workbench. Client-specific demo work lives in `noui-derp-poc`.

## Purpose

Develop and validate the NoUI Data Connector's core capabilities before connecting to production pension systems:

1. **Schema introspection** — map an unfamiliar legacy schema without prior knowledge
2. **Concept tagging** — identify pension-adjacent concepts (salary history, leave balances, payroll runs) by signal, not name
3. **Anomaly detection** — detect operational data quality issues against a statistical baseline
4. **Monitoring overlay** — surface findings without modifying the source system

## Targets

### ERPNext (MariaDB)
ERPNext (open-source ERP, MariaDB) serves as the primary lab target — a realistic proxy for legacy pension administration systems like DERP's Neospin. ERPNext has full HR, payroll, leave management, and employee lifecycle modules (876 tables).

See [`targets/erpnext/`](targets/erpnext/).

### PostgreSQL HR (PostgreSQL)
A standalone PostgreSQL target with ERPNext-compatible schema (12 core HR tables) for validating the connector's PostgreSQL adapters against a live database. Same data, same DQ issues, different database engine.

See [`targets/postgres-hr/`](targets/postgres-hr/).

## Getting Started

```bash
# Start ERPNext (first run takes ~5 minutes)
docker compose -f targets/erpnext/docker-compose.yml up -d
docker compose -f targets/erpnext/docker-compose.yml logs -f create-site

# Run introspection
cd connector
go mod tidy
go run ./introspect/ \
  --dsn "root:admin@tcp(127.0.0.1:3307)/frontend" \
  --db frontend \
  --output ../targets/erpnext/schema-manifest/manifest.json
```

## Repository Structure

```
noui-connector-lab/
├── CLAUDE.md                    # Claude Code governing instructions
├── BUILD_HISTORY.md             # Decision and change log
├── SESSION_BRIEF.md             # Current session scope (updated per session)
├── connector/
│   ├── introspect/              # Schema discovery engine (Go)
│   ├── tagger/                  # Concept tagging logic (Go)
│   └── monitor/                 # Anomaly detection checks (Go)
├── targets/
│   ├── erpnext/
│   │   ├── docker-compose.yml   # ERPNext + MariaDB stack
│   │   ├── seed/                # Data generation scripts
│   │   └── schema-manifest/     # Introspection output (generated, not committed)
│   └── postgres-hr/
│       ├── docker-compose.yml   # PostgreSQL 15 stack
│       ├── seed/                # Schema DDL + data generation
│       └── schema-manifest/     # Introspection output (generated, not committed)
└── tools/                       # Shared utilities
```

## Relationship to noui-derp-poc

| | noui-connector-lab | noui-derp-poc |
|--|--|--|
| **Purpose** | Generic connector development | DERP-specific demo system |
| **Database** | ERPNext / MariaDB (lab) | Synthetic DERP / PostgreSQL |
| **Audience** | Engineering validation | DERP leadership demo |
| **Logic flow** | Develop here → promote to DERP | Consumes promoted connector logic |

## Target Systems Roadmap

| Target | System | DB | Status |
|--|--|--|--|
| ERPNext | Open-source ERP | MariaDB 10.6 | Complete |
| PostgreSQL HR | Adapter validation | PostgreSQL 15 | Complete |
| DERP Neospin | Pension admin | TBD (PostgreSQL/MSSQL) | Pending access |
| COPERA | Pension admin | TBD | Future |
