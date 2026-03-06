# noui-derp-poc — Build History

## Format

Each entry: Date | Session | Decision/Change | Rationale | Status

---

## DERP POC Session 1

**Date:** 2026-03-06
**Session:** DERP POC Session 1

### Commit 1: Prototype Features (1c9686f)
**Decision:** Added full prototype feature set — composition engine, 4 navigation models (Guided/Deck/Expert/Orbit), staff dashboards (Executive/Supervisor/CSR), member search, command palette, service map, vendor portal, contextual help, live summary, proficiency selector, 8 workflow stages, demo cases.
**Rationale:** Establish end-to-end prototype demonstrating NoUI's AI-composed workspace concept across all user roles (staff, member, employer, vendor).
**Status:** Complete

### Commit 2: Float Precision Fix (0f97d42)
**Decision:** Fixed eligibility float precision, tuned compose-sim prompts.
**Rationale:** Ensure benefit calculations match hand-calculated values to the cent.
**Status:** Complete

### Commit 3: Quality Gate Tuning (b2daae9)
**Decision:** Tuned compose-sim prompts to pass all 3 quality gates (97% panels, 96% alerts, 100% view mode).
**Rationale:** Validate AI composition engine against deterministic quality thresholds.
**Status:** Complete

### Commit 4: Three New Microservices (805c537)
**Decision:** Added Knowledge Base (8087), Data Quality Engine (8086), and Correspondence (8085) Go microservices with PostgreSQL schemas/seeds, React frontend components, API clients, docker-compose wiring, and Vite proxy config.
**Rationale:** Extend platform with KB-driven contextual help, data quality monitoring, and template-based correspondence generation.
**Status:** Complete

### Commit 5: Frontend Wiring + Tests (current)
**Decision:** Wired DataQualityPanel and CorrespondencePanel into StaffPortal sidebar navigation. Added unit tests for all 3 new Go services (44 tests total).
**Rationale:** Make new frontend components accessible from staff portal. Establish test coverage for handler helpers, health checks, template rendering, and response serialization.
**Status:** Complete

---

## Service Inventory

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | DERP database (PostgreSQL 16) |
| connector | 8081 | Schema discovery & member data |
| intelligence | 8082 | Rules engine & benefit calculation |
| crm | 8084 | Contact relationship management |
| correspondence | 8085 | Template-based letter generation |
| dataquality | 8086 | Data quality scoring & monitoring |
| knowledgebase | 8087 | Contextual help articles & rules |
| frontend | 3000 | React app (Vite dev) / 80 (Docker) |

---

## Remaining Work

- [ ] End-to-end docker compose test (`docker compose up --build`)
- [ ] KnowledgeBase panel as standalone StaffPortal tab (currently only in ContextualHelp within workflow)
- [ ] Full integration tests against live DB for new services
- [ ] Add command palette entries for DQ and Correspondence tabs
