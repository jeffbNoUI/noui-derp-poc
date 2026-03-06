# noui-connector-lab

**NoUI Connector Development Lab** — schema discovery, concept tagging, and operational monitoring against real legacy systems.

This is a plan-agnostic infrastructure workbench. Client-specific demo work lives in `noui-derp-poc`.

## Purpose

Develop and validate the NoUI Data Connector's core capabilities before connecting to production pension systems:

1. **Schema introspection** — map an unfamiliar legacy schema without prior knowledge
2. **Concept tagging** — identify pension-adjacent concepts (salary history, leave balances, payroll runs) by signal, not name
3. **Anomaly detection** — detect operational data quality issues against a statistical baseline
4. **Monitoring overlay** — surface findings without modifying the source system

## Current Target: OrangeHRM

OrangeHRM (open-source HR system, MariaDB) serves as the first lab target — a realistic proxy for legacy pension administration systems like DERP's Neospin.

See [`targets/orangehrm/`](targets/orangehrm/) and [`docs/orangehrm-lab-guide.docx`](docs/orangehrm-lab-guide.docx).

## Getting Started

```bash
# Start OrangeHRM
docker compose -f targets/orangehrm/docker-compose.yml up -d

# Seed test data
cd targets/orangehrm/seed && python3 seed.py --employees 200 --years 3 --dq-issues

# Run introspection
go run ./connector/introspect/cmd --target orangehrm --output targets/orangehrm/schema-manifest/
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
│   └── orangehrm/
│       ├── docker-compose.yml   # OrangeHRM + MariaDB stack
│       ├── seed/                # Data generation scripts (Python)
│       ├── schema-manifest/     # Introspection output (generated, not committed)
│       ├── monitoring-checks/   # OrangeHRM-specific check configs (YAML)
│       └── docs/                # Target-specific notes
├── docs/
│   └── orangehrm-lab-guide.docx
└── tools/                       # Shared utilities
```

## Relationship to noui-derp-poc

| | noui-connector-lab | noui-derp-poc |
|--|--|--|
| **Purpose** | Generic connector development | DERP-specific demo system |
| **Database** | OrangeHRM / MariaDB (lab) | Synthetic DERP / PostgreSQL |
| **Audience** | Engineering validation | DERP leadership demo |
| **Logic flow** | Develop here → promote to DERP | Consumes promoted connector logic |

## Target Systems Roadmap

| Target | System | DB | Status |
|--|--|--|--|
| OrangeHRM | Open-source HR | MariaDB 10.11 | 🔄 In progress |
| DERP Neospin | Pension admin | TBD (PostgreSQL/MSSQL) | ⏳ Pending access |
| COPERA | Pension admin | TBD | ⏳ Future |
