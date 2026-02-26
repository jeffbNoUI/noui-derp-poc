# NoUI DERP POC — Demo Fallback Plan

**Purpose:** Contingency procedures for issues during the live demonstration.

---

## Architecture Advantage: No External Dependencies During Demo

The demo is designed to be resilient by default. All demo data is embedded in the frontend as client-side fixtures. The application runs as a static single-page app with no backend service calls, no database connections, and no network dependencies required during the demonstration. Demo mode is the default — it activates automatically unless explicitly opted out with the `?live` query parameter.

---

## Failure Scenarios and Responses

### Frontend Dev Server Will Not Start

**Symptom:** `npm run dev` fails or port 5175 is unavailable.

**Response:**
1. Check if another process is using port 5175: `lsof -i :5175`
2. Kill the conflicting process or use an alternate port: `npx vite --port 5176`
3. If Node.js is not found, add to PATH: `export PATH="/home/jeffb/.local/node-v20.19.1-linux-arm64/bin:$PATH"`
4. Last resort: run `npx vite build` and serve the static build with `npx serve dist -l 5175`

### Production Build Fails

**Symptom:** `npx vite build` errors during pre-demo preparation.

**Response:**
1. Run `npx tsc -b --noEmit` to identify TypeScript errors
2. Fix type errors (most common: missing imports or interface changes)
3. Re-run build
4. The dev server (`npm run dev`) does not require a successful production build

### Browser Rendering Issues

**Symptom:** Layout is broken, fonts are missing, or components do not render.

**Response:**
1. Tested browsers: Chrome (primary), Firefox, Safari — use Chrome for demo
2. Clear browser cache: Ctrl+Shift+Delete, then hard refresh: Ctrl+Shift+R
3. Check browser zoom is at 100% (Ctrl+0 to reset)
4. If a specific route breaks, navigate to `/` (Portal Switcher) and re-enter from there

### Specific Route Does Not Load

**Symptom:** Blank screen or error on a specific route (e.g., `/staff/case/10001/guided`).

**Response:**
1. Navigate to `/` first, then click through the portal cards
2. If the staff guided view fails, use the expert view: `/staff/case/10001` (no `/guided`)
3. If a specific case fails, switch to another case (Cases 1-4 exercise similar rules)
4. Use the Demo Landing page (`/demo`) as an alternative entry point

### Calculation Displays Wrong Number

**Symptom:** A benefit amount does not match the expected hand-calculated value.

**Response:**
1. This should not happen — all calculations are from pre-verified fixtures, not live computation
2. Reference the hand-calculated demo cases in `demo-cases/` for the correct values
3. Explain: "The rules engine shows its work — let me walk through the formula step by step"
4. Demo case expected values:
   - Case 1 (Martinez): Single life benefit based on 28yr 9mo at 2.0% multiplier, no reduction
   - Case 2 (Kim): 21yr 2mo at 1.5% multiplier, 30% early retirement reduction
   - Case 3 (Washington): 13yr 7mo at 1.5% multiplier, 12% early retirement reduction

### Network or Connectivity Issues

**Symptom:** No network access in the demo room.

**Response:** Not a problem. All demo data is client-side. The application requires no network access, no API calls, and no database connectivity during the demonstration. The frontend runs entirely in the browser.

### Projector or Display Issues

**Symptom:** Display resolution causes layout problems.

**Response:**
1. The application is responsive but optimized for 1280px+ width
2. If resolution is low, zoom browser out to 90% (Ctrl+minus)
3. The Portal Switcher (`/`) and Demo Landing (`/demo`) are the most visually stable entry points
4. Staff guided workspace works best at full screen width

### Audience Asks About Something Not in the Demo

**Symptom:** Question about retiree payroll, annual COLAs, specific edge cases, or processes not built.

**Response:**
> "That is a great question. The POC demonstrates the architecture pattern using the retirement application process. [Feature X] would follow the same pattern: business rules configured from governing documents, workspace composed for the specific context, full calculation transparency. Let me show you how the architecture handles this..."

Then demonstrate the relevant principle using what IS in the demo:
- For **rule questions** — show the Knowledge Assistant (`/demos/knowledge-assistant`)
- For **process questions** — show how refund and death/survivor workspaces differ from retirement
- For **data questions** — show the Data Quality dashboard (`/demos/data-quality`)
- For **scalability questions** — reference the 10,000-member simulated population

### Someone Wants to See Live Data

**Symptom:** "Can you connect to our actual database?"

**Response:**
> "The POC uses simulated data that mirrors your actual data structure. The Connector Service is designed to connect to your PostgreSQL database with minimal configuration changes. The demo data includes 10,000 members across all three tiers with 15 years of salary and contribution history — the same scale and complexity as your production data."

---

## Quick Recovery Commands

```bash
# Add Node.js to PATH
export PATH="/home/jeffb/.local/node-v20.19.1-linux-arm64/bin:$PATH"

# Start dev server
cd /home/jeffb/noui-derp-poc/services/frontend && npm run dev

# Start on alternate port
cd /home/jeffb/noui-derp-poc/services/frontend && npx vite --port 5176

# Build and serve static
cd /home/jeffb/noui-derp-poc/services/frontend && npx vite build && npx serve dist -l 5175

# Run tests (verify everything passes before demo)
cd /home/jeffb/noui-derp-poc/services/frontend && npx vitest run

# Type check
cd /home/jeffb/noui-derp-poc/services/frontend && npx tsc -b --noEmit
```

---

## Pre-Demo Verification (Run 30 Minutes Before)

1. `npx tsc -b --noEmit` — zero TypeScript errors
2. `npx vitest run` — all 393 tests pass
3. `npm run dev` — dev server starts on port 5175
4. Open `http://localhost:5175/` — Portal Switcher renders
5. Click through to `/staff/case/10001/guided` — member banner shows Robert Martinez
6. Click through to `/portal` — member dashboard renders
7. Click through to `/employer` — employer dashboard renders
8. Click through to `/vendor` — vendor dashboard renders
9. Navigate to `/demos/data-quality` — findings table renders
10. Navigate to `/demos/knowledge-assistant` — search interface renders
