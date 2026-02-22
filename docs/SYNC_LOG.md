# NoUI DERP POC — Sync Log

## Purpose

This file tracks synchronization points between the **analysis project** (Claude.ai chat sessions) and the **build repository** (Claude Code). It ensures both environments operate from the same state and that discoveries in either direction are captured before the next work session.

**Location:** Repository root, alongside BUILD_HISTORY.md and SESSION_BRIEF.md.
**Update frequency:** Before and after every Claude Code session.
**Owner:** Jeff (Technical Director) — the human bridge between both environments.

---

## How Sync Works

```
┌─────────────────────────┐           ┌─────────────────────────┐
│   Analysis Project      │           │   Build Repository      │
│   (Claude.ai Chats)     │           │   (Claude Code)         │
│                         │           │                         │
│  Domain analysis        │──────────▶│  SESSION_BRIEF.md       │
│  Rule corrections       │  Push     │  New/updated .docx      │
│  Calculation fixes      │           │  Test fixture updates   │
│  Architecture decisions │           │  SYNC_LOG.md updates    │
│                         │           │                         │
│  Review & analyze       │◀──────────│  BUILD_HISTORY.md delta │
│  Resolve questions      │  Pull     │  Flagged discrepancies  │
│  Plan next steps        │           │  Implementation Q's     │
└─────────────────────────┘           └─────────────────────────┘
```

### Push (Analysis → Build)

Before each Claude Code session, update these repo files with any analysis-side changes:

| File | What Changes |
|------|-------------|
| `SESSION_BRIEF.md` | New corrections, clarifications, or guidance discovered in analysis |
| `derp-business-rules-inventory.docx` | Rule additions, modifications, or status changes |
| `demo-cases/case*-calculation.md` | Corrected hand calculations |
| `demo-cases/case*-test-fixture.json` | Updated expected values (with documented justification) |
| New `.docx` or `.md` files | New ADRs, policy documents, domain analysis |
| `SYNC_LOG.md` | New entry documenting what was pushed |

### Pull (Build → Analysis)

After each Claude Code session, bring these items into the analysis project:

| Item | How to Transfer |
|------|----------------|
| New BUILD_HISTORY.md entries | Paste into analysis chat or add to project knowledge |
| Flagged discrepancies | Copy the Issues Encountered table entries |
| Implementation questions | Copy any STOP-flagged items from BUILD_HISTORY.md |
| Schema or API decisions | Note any design choices that affect domain modeling |

---

## Sync Entry Format

```markdown
### SYNC-NNN: [Date] — [Direction] — [Brief Description]

**Direction:** Analysis → Build | Build → Analysis | Bidirectional
**Triggered by:** [What prompted this sync — session end, correction found, etc.]

**Items Pushed (Analysis → Build):**
- [ ] [File]: [What changed and why]

**Items Pulled (Build → Analysis):**
- [ ] [Item]: [What was discovered and what analysis is needed]

**Open Questions (Requiring Analysis):**
- [Q-NNN]: [Question from build that needs domain analysis]

**Verification:**
- [ ] SESSION_BRIEF.md reflects all pushed changes
- [ ] BUILD_HISTORY.md reviewed for pulled items
- [ ] No contradictions between analysis state and build state
- [ ] CLAUDE_CODE_PROTOCOL.md startup list still covers all required reads

**State Alignment:**
- Analysis project last sync: SYNC-NNN
- BUILD_HISTORY.md last session: Session N
- BUILD_PLAN.md current step: Day X, Step Y.Z
```

---

## Sync History

### SYNC-001: February 21, 2026 — Analysis → Build — Initial Build Handoff

**Direction:** Analysis → Build
**Triggered by:** Pre-build analysis complete. Transitioning from planning to implementation.

**Items Pushed (Analysis → Build):**
- [x] `SESSION_BRIEF.md`: Created — Day 1-2 build guidance, corrections, schema notes
- [x] `CLAUDE_CODE_PROTOCOL.md`: Created — Session discipline, test-first enforcement, red flags
- [x] `derp-business-rules-inventory.docx`: Created — 52 rules, 8 categories, full RMC citations
- [x] `CRITICAL-001-resolution.md`: Created — Early retirement reduction rate correction (6% → 3%/6%)
- [x] `SYNC_LOG.md`: Created — This file

**Items Pulled (Build → Analysis):**
- (First sync — nothing to pull yet)

**Open Questions (Requiring Analysis):**
- None at this time. All known open items documented in BUILD_HISTORY.md Open Items table.

**Verification:**
- [x] SESSION_BRIEF.md reflects all pushed changes
- [x] BUILD_HISTORY.md reviewed — current through Session 5 + Pre-Build Session
- [x] No contradictions between analysis state and build state
- [x] CLAUDE_CODE_PROTOCOL.md startup list covers all required reads

**State Alignment:**
- Analysis project last sync: SYNC-001
- BUILD_HISTORY.md last session: Pre-Build Session (Feb 21, 2026)
- BUILD_PLAN.md current step: Day 1, Step 1.1 (ready to begin)

---

## Sync Rules

1. **Never start a Claude Code session without checking SYNC_LOG.md.** Add it to the CLAUDE_CODE_PROTOCOL.md startup reading list (after SESSION_BRIEF.md, before CLAUDE.md).

2. **Never end a Claude Code session without updating SYNC_LOG.md** if any questions, discrepancies, or decisions arose that the analysis project needs to know about.

3. **SESSION_BRIEF.md is append-only between syncs.** New corrections get added with a date stamp. Previous corrections are not removed until the build session confirms they've been applied (marked with ✅ in SESSION_BRIEF.md).

4. **Test fixture changes require a sync entry.** Any modification to expected values in `demo-cases/case*-test-fixture.json` must have a corresponding SYNC_LOG entry documenting the justification and which environment originated the change.

5. **Architecture decisions flow through Tier 1 documents.** If a Claude Code session surfaces an architecture question, the answer must be formalized in the analysis project (as an ADR or governing document update) and then pushed back via SYNC_LOG — not decided ad hoc in the build session.

6. **One sync entry per synchronization event.** Don't batch multiple sync sessions into one entry. Each time you sit down to transfer state between environments, create a new SYNC-NNN entry.

---

## Quick Reference: What Lives Where

| Content Type | Authoritative Location | Sync Direction |
|-------------|----------------------|----------------|
| Business rules and RMC citations | Analysis project → `derp-business-rules-inventory.docx` | Analysis → Build |
| Hand calculations and expected values | Analysis project → `demo-cases/` | Analysis → Build |
| Architecture decisions (ADRs) | Analysis project → `.docx` files | Analysis → Build |
| Domain knowledge and plan provisions | Analysis project → `doc01-doc14` | Analysis → Build |
| Code implementation | Build repository | Build only (no sync needed) |
| Schema design decisions | Build repository → BUILD_HISTORY.md | Build → Analysis |
| Test results and failures | Build repository → BUILD_HISTORY.md | Build → Analysis |
| Implementation questions | Build repository → BUILD_HISTORY.md | Build → Analysis |
| Deployment and infrastructure | Build repository | Build only (no sync needed) |
