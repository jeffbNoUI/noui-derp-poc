# noui-connector-lab — Session 1 Starter Prompt

Paste this as your first message in a Claude Code session from the `noui-connector-lab/` directory.

---

This is Session 1 of the noui-connector-lab project.

Before writing any code, read these files in order:
1. `CLAUDE.md`
2. `BUILD_HISTORY.md`
3. `SESSION_BRIEF.md`

Then complete all phases defined in SESSION_BRIEF.md:

**Phase 1: Environment Setup**
- Start OrangeHRM: `docker compose -f targets/orangehrm/docker-compose.yml up -d`
- Wait for healthy state, then complete the browser installer at http://localhost:8080
- Verify DB: `mysql -h 127.0.0.1 -P 3306 -u orangehrm -porangehrm -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='orangehrm';"`
- Confirm table count ≥ 90

**Phase 2: Seed Data**
- Install dependency: `pip install mysql-connector-python --break-system-packages`
- Run: `python3 targets/orangehrm/seed/seed.py --employees 200 --years 3 --dq-issues`
- Verify row counts match SESSION_BRIEF.md targets

**Phase 3: Schema Introspection**
- `cd connector && go mod tidy`
- `go run ./introspect/main.go --output ../targets/orangehrm/schema-manifest/manifest.json`
- Verify manifest.json contains ≥ 90 tables with correct row counts

Commit after each phase. Update BUILD_HISTORY.md after every commit.

Exit criteria are in SESSION_BRIEF.md — do not consider the session complete until all boxes can be checked.
