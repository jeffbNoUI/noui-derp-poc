# Sync Manifest — Claude Project → Claude Code

This folder is a drop zone for documents produced in the Claude project workspace.
Claude Code checks this folder at the start of each session and compares new/updated
files against the current codebase to flag gaps, conflicts, or missing integrations.

## How to use

1. Export or copy documents from your Claude project into this folder
2. Add an entry below with the filename and a one-line description
3. Tell Claude Code "check sync" or it will check automatically at session start

## Last Full Audit: 2026-02-22

### Audit Summary
- 66 files uploaded from Claude project
- 39 identical to repo (no action)
- 8 sync-is-newer → copied to repo
- 8 repo-is-newer → repo is authoritative (no action)
- 10 new files → copied to repo docs/
- 2 repo files missing from sync (case1/case3 calculation MDs)

### Files Copied to Repo (sync → repo)

| File | Destination | Reason |
|------|-------------|--------|
| noui-application-management-services.docx | docs/ | Sync +26K larger |
| noui-member-portal-architecture.docx | docs/ | Sync +28K larger |
| noui-defect-taxonomy-metrics.docx | docs/ | Sync +14K larger |
| noui-verification-test-framework.docx | docs/ | Sync +12K larger |
| noui-defect-resolution-backlog.docx | docs/ | Sync +9K larger |
| noui-defect-prevention-framework.docx | docs/ | Sync +8K larger |
| noui-defect-monitoring-dashboard.docx | docs/ | Sync +6K larger |
| case4-robert-dro-calculation.md | demo-cases/ | Sync +74 bytes |
| benefit-estimator-1.jsx | docs/ | New — UI prototype |
| benefit-estimator-2.jsx | docs/ | New — UI prototype |
| benefit-estimator-3.jsx | docs/ | New — UI prototype |
| noui-workflow-engine.jsx | docs/ | New — UI prototype |
| noui-ux-prototype.jsx | docs/ | New — UI prototype |
| noui-cardstack-usability-review.docx | docs/ | New — UX research |
| noui-derp-demo-story.docx | docs/ | New — demo narrative |
| embedded-issues.md | docs/ | New — issue tracking |
| SYNC_LOG.md | docs/ | New — sync history |

### Repo-is-Authoritative (NOT overwritten)

| File | Why Repo Wins |
|------|---------------|
| CLAUDE.md | Repo has UX Principles, code quality standards added during build |
| BUILD_HISTORY.md | Repo has 55K+ of accumulated build entries |
| BUILD_PLAN.md | Repo has minor updates from build execution |
| SESSION_BRIEF.md | Repo has sync checkpoint updates |
| CLAUDE_CODE_PROTOCOL.md | Trivial drift (+18 bytes) |
| noui-platform-vision.jsx | Repo has Learning Module merge (just completed) |
| noui-knowledge-governance-framework.docx | Repo expanded during build (+12K) |
| generate_derp_data.py | Repo has seed data fixes |

## Status Key

- **NEW** — Just added, not yet reviewed by Claude Code
- **REVIEWED** — Claude Code has read and compared against codebase
- **INTEGRATED** — Changes from this doc have been merged into the codebase
- **CONFLICT** — Doc conflicts with current codebase state (see notes)
