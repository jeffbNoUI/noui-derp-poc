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
| intelligence | 8088 (host) / 8082 (internal) | Rules engine & benefit calculation |
| crm | 8084 | Contact relationship management |
| correspondence | 8085 | Template-based letter generation |
| dataquality | 8086 | Data quality scoring & monitoring |
| knowledgebase | 8087 | Contextual help articles & rules |
| frontend | 3000 | React app (Vite dev) / 80 (Docker) |

---

## DERP POC Session 3

**Date:** 2026-03-06
**Session:** DERP POC Session 3

### Commit 6: Frontend Test Coverage + Visual QA Fixes
**Decision:** Configured Vitest with jsdom environment, added @testing-library/react and @testing-library/jest-dom. Created 21 frontend component tests across 3 test files: StaffPortal (9 tab smoke tests), CommandPalette (6 tests: open/close, search filtering, keyboard nav, categories), RetirementApplication (6 tests: render, case ID, navigation, status bar). Fixed Unicode escape rendering bug in JSX text content across RetirementApplication.tsx and NavigationModelPicker.tsx (bare `\u2190` in JSX renders as literal text, wrapped in `{'\u2190'}` for correct rendering). Remapped intelligence service host port from 8082 to 8088 to avoid conflict with connector-lab.
**Rationale:** Establish frontend test coverage baseline. Fix visual rendering bugs found during browser QA. Prevent port conflicts with sibling connector-lab project.
**Status:** Complete

### Docker Compose Validation
**Decision:** Verified all 8 containers (postgres + 6 Go services + frontend) start and run healthy. All `/healthz` endpoints return OK. All API endpoints return real data through nginx proxy (members, benefit calculation, DQ checks, KB articles, correspondence templates, CRM contacts). Frontend serves at port 3000.
**Rationale:** Confirm full stack runs end-to-end in Docker.
**Status:** Complete (validated against existing running stack)

### Visual QA
**Decision:** Clicked through all 8 StaffPortal tabs — all render data correctly. Command Palette opens with Ctrl+K, shows 9 commands across 3 categories, keyboard navigation works. Walked through 3 stages of retirement application in Guided mode (Intake → Verify Employment → Salary & AMS) — all render real backend data with contextual help. No console errors.
**Rationale:** Confirm all UI components render correctly with live backend data.
**Status:** Complete

---

## Remaining Work

- [ ] KnowledgeBase panel as standalone StaffPortal tab (currently only in ContextualHelp within workflow)
- [ ] Full integration tests against live DB for new services
- [ ] Add command palette entries for DQ and Correspondence tabs
- [ ] Expand command palette from 9 to 16 entries (add DQ, Correspondence, KB, Supervisor, Executive, CSR, Service Map shortcuts)
