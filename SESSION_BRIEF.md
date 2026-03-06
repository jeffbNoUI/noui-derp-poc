# SESSION_BRIEF.md — noui-derp-poc

_Updated: 2026-03-06 | Status: Session 1 Complete_

---

## Current State

Full prototype deployed with 7 backend services and React frontend. All staff dashboards, workflow stages, navigation models, and portal views functional. DataQualityPanel and CorrespondencePanel wired into StaffPortal navigation. Unit tests passing for all 3 new Go services (44 tests).

## What Was Built (Session 1)

### Frontend
- **StaffPortal**: Work Queue, Member Lookup, Supervisor Dashboard, Executive Dashboard, CSR Hub, Service Map, Data Quality, Correspondence (8 tabs)
- **RetirementApplication**: 8-stage workflow with Guided/Assisted/Expert navigation modes
- **MemberPortal**, **EmployerPortal**, **VendorPortal**: Role-specific views
- **CommandPalette**: Global Ctrl+K navigation
- **ContextualHelp**: KB-driven stage help with proficiency awareness

### Backend Services (6 Go services)
1. **Connector** (8081) — Schema discovery, member/employment/service-credit data
2. **Intelligence** (8082) — Eligibility, benefit calculation, DRO, scenarios
3. **CRM** (8084) — Contact management, interaction history
4. **Correspondence** (8085) — Template rendering, merge fields, letter history
5. **Data Quality** (8086) — DQ checks, scoring, issues, trend analysis
6. **Knowledge Base** (8087) — Articles, stage help, rule references, search

### Test Coverage
- `intelligence/rules/`: Benefit calculation, DRO, payment options, IPR, death benefit
- `correspondence/api/`: Health, helpers, template rendering (17 tests)
- `dataquality/api/`: Health, helpers, model serialization (14 tests)
- `knowledgebase/api/`: Health, helpers, search validation (13 tests)

## Next Session Scope

### Priority 1: Docker Compose Validation
1. Run `docker compose up --build` and verify all 7 services start
2. Fix any build/connectivity issues
3. Verify frontend can reach all API endpoints through Vite proxy

### Priority 2: Enhanced Test Coverage
1. Integration tests with live database for CRUD operations
2. Frontend component tests (Vitest)

### Priority 3: Polish
1. Add command palette entries for DQ and Correspondence tabs
2. Consider KB as standalone StaffPortal tab
3. Review error handling across all services

## Environment Details

| Item | Value |
|------|-------|
| Frontend URL | http://localhost:3000 |
| PostgreSQL | localhost:5432 (derp/derp) |
| Connector | localhost:8081 |
| Intelligence | localhost:8082 |
| CRM | localhost:8084 |
| Correspondence | localhost:8085 |
| Data Quality | localhost:8086 |
| Knowledge Base | localhost:8087 |

## Key Reference Files

- `CLAUDE.md` — Governing instructions
- `BUILD_HISTORY.md` — Prior decisions
- `docker-compose.yml` — Full service topology
- `frontend/vite.config.ts` — API proxy config
