# Cross-Environment Sync Agreement — Directive from Analysis

Jeff is pasting this from the analysis environment (Claude.ai) to formalize how the two environments stay in sync. This is the result of a discussion between both environments and Jeff's decision.

## The Problem

Analysis (Claude.ai) overwrote build-owned files by rewriting CLAUDE.md and CLAUDE_CODE_PROTOCOL.md in their entirety without knowing Claude Code had added content. This happened because both environments treated the same files as writable.

## The Agreement

### File Ownership

**Analysis owns (writes, pushes to `docs/`):**
- `docs/*.docx` — Architecture decisions, governance, policies, business rules inventory
- `docs/SESSION_BRIEF.md` — One-way channel from analysis to build. Analysis writes, build reads. Build never modifies.
- `demo-cases/case*-calculation.md` — Hand calculations
- `demo-cases/case*-test-fixture.json` — Expected values from hand calculations

**Build owns (writes, analysis does not overwrite):**
- `/CLAUDE.md` — Development standards, code quality, tech stack, workflow, governing principles
- `/CLAUDE_CODE_PROTOCOL.md` — Session discipline, commit conventions, test-first enforcement
- `/BUILD_HISTORY.md` — Implementation log
- `/BUILD_PLAN.md` — Execution plan
- All source code, tests, infrastructure, deployment

Analysis will never again push a full replacement of CLAUDE.md, CLAUDE_CODE_PROTOCOL.md, or BUILD_HISTORY.md. If analysis has content that needs to appear in those files (like governing principles or controlled terminology), it goes into SESSION_BRIEF.md with a note that build should incorporate it.

### Sync Mechanism

The sync is simple and uses existing artifacts:

1. **Analysis → Build:** Analysis updates `docs/SESSION_BRIEF.md` with new corrections, guidance, or context. Each update gets a dated entry in the Sync Checkpoint section at the bottom. Jeff uploads the file to the repo. Claude Code reads it at session startup.

2. **Build → Analysis:** Build records decisions, issues, and questions in `BUILD_HISTORY.md` as it already does. Jeff copies relevant entries back to the analysis project for review.

3. **Traceability:** Git history tracks when files changed. `docs/` = came from analysis. Root files and `services/` = came from build. No separate tracking document needed.

### What to Do Now

**Incorporate from analysis:** The revised `docs/SESSION_BRIEF.md` (attached/uploaded alongside this directive) contains the complete file ownership agreement and all business context. Read the Sync Checkpoint section — it lists what's new.

**Incorporate into your owned files:** If any business directives from SESSION_BRIEF.md need to be in CLAUDE.md or CLAUDE_CODE_PROTOCOL.md (like the governing principles, controlled terminology, or DERP quick reference), incorporate them into your versions of those files. You own the format and structure; analysis provides the content.

**Clean up:**
- Delete `SYNC_LOG.md` from the repo if it exists. Its function is replaced by the Sync Checkpoint section in SESSION_BRIEF.md.
- Delete `docs/CLAUDE.md` if it exists as a separate file. One CLAUDE.md at root, owned by build.
- Any earlier versions of CLAUDE.md or CLAUDE_CODE_PROTOCOL.md that analysis pushed — discard in favor of your current versions.

**Update BUILD_HISTORY.md** with a decision entry documenting this file ownership agreement. Suggested format:

```
XX. **DECISION: Cross-Environment File Ownership Agreement**
    Analysis (Claude.ai) and Build (Claude Code) now have clear file ownership to prevent overwrites.
    Analysis owns docs/ and SESSION_BRIEF.md. Build owns root CLAUDE.md, CLAUDE_CODE_PROTOCOL.md,
    BUILD_HISTORY.md, BUILD_PLAN.md, and all code. Sync flows through SESSION_BRIEF.md (analysis → build)
    and BUILD_HISTORY.md (build → analysis). SYNC_LOG.md retired. See docs/SESSION_BRIEF.md §File Ownership Agreement.
```

### Session Startup Reading List (Build's Version)

Build owns CLAUDE_CODE_PROTOCOL.md including the startup reading list. I'd suggest this order but you decide:

1. `BUILD_HISTORY.md` — Current state, last decisions, backtrack points
2. `BUILD_PLAN.md` — What comes next, verification criteria
3. `docs/SESSION_BRIEF.md` — Check Sync Checkpoint for anything new from analysis
4. `CLAUDE.md` — Governing principles, critical rules, controlled terminology
5. Relevant `rules/definitions/*.yaml` for the current task
6. Relevant `demo-cases/case*` files if working on calculations

### The Principle

Analysis decides *what* the system should do (rules, calculations, architecture). Build decides *how* to implement it (code structure, development standards, infrastructure). Neither overwrites the other's domain. Jeff is the bridge.
