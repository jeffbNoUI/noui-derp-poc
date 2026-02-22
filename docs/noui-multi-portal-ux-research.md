# NoUI Multi-Portal UX Architecture — Design Research Synthesis

## Executive Summary

This document synthesizes research across enterprise LOB design, member self-service portals, multi-portal architecture, and the DERP brand identity to establish a unified UX strategy for NoUI's four portal surfaces. The core finding is that NoUI needs **one component architecture with four distinct personalities** — each tuned to its audience's mental model, task frequency, and skill level.

The prototype (`noui-multi-portal.jsx`) demonstrates all four portals as a switchable experience, proving the shared-component architecture works while delivering genuinely different user experiences.

---

## Research Sources & Key Findings

### 1. Enterprise LOB Design (Staff Portal)

**Sources analyzed**: Linear app redesign methodology, Stripe Dashboard design patterns, Salesforce Lightning Design System (SLDS), Microsoft Fluent 2, enterprise UI guides from Superblocks, Mockplus, and Softkraft.

**Key principles extracted**:

**a) Command Palette (⌘K) is non-negotiable for power users.** Linear, Figma, Notion, Stripe, and VS Code all center keyboard-first navigation around a command palette. Linear's implementation is the gold standard — discoverable via hover hints on every element, with patterns that follow consistent grammar (G+key for navigation, O+key for opening). For NoUI staff who process dozens of cases daily, this is the single highest-impact UX feature.

**b) Information density must be controlled, not minimized.** Salesforce SLDS and Microsoft Fluent 2 both emphasize "dense information rather than visual flair" for enterprise contexts. The research consistently shows that pension analysts working 8-hour days need to see more data per screen, not less. Linear's redesign specifically focused on "increasing hierarchy and density of navigation elements." Our previous prototypes had too much whitespace for the staff use case.

**c) Consistent interaction patterns across features accelerate learning.** Linear documents that every action follows the same pattern regardless of context — keyboard, command palette, right-click menu, or button all do the same thing. For NoUI, this means the same component patterns appear whether the analyst is reviewing eligibility, calculating benefits, or processing a DRO.

**d) Role-aware visualization is essential.** Enterprise UX research from UX Pilot emphasizes that the same data should be presented differently based on who is viewing it. An analyst needs calculation details; a supervisor needs approval summaries; a CSR needs member-facing status.

### 2. Member Self-Service Portal

**Sources analyzed**: U.S. Web Design System (USWDS) progressive disclosure patterns, Nielsen Norman Group principles, LogRocket progressive disclosure analysis, Booking.com conditional disclosure, GOV.UK progressive disclosure, DERP's existing website and Sector Brands redesign case study.

**Key principles extracted**:

**a) Progressive/staged disclosure for complex forms.** USWDS specifically recommends "providing the most straightforward path through successful form completion by simplifying the user interface, progressively disclosing form questions and content." A retirement application is exactly this scenario — 9 parts with conditional sections. The wizard pattern is validated across government, healthcare, and financial services.

**b) Trauma-informed design matters for financial decisions.** USWDS calls out "trauma-informed research and design practices" specifically for forms collecting "sensitive personal, financial, health, or safety details." Retirement is one of the most consequential financial decisions a person makes. The UI must feel calm, supportive, and never rushed.

**c) Conditional disclosure hides irrelevant complexity.** LogRocket's analysis shows Booking.com revealing age inputs only when children are added. For NoUI, this maps directly to: spousal consent fields appear only for married members, DRO banners appear only when a DRO exists, leave payout sections appear only for eligible tiers.

**d) Simple → complex progression with escape hatches.** Members should start with pre-populated information they can confirm (low effort, builds confidence), progress to estimation (exciting — seeing their benefit amount), then to elections (consequential — payment option choice), and finally to review (reassurance). At any point, they should be able to go back or save and return later.

### 3. DERP Brand Identity

**Sources analyzed**: derp.org website (live crawl), Sector Brands portfolio case study, MyDERP.org member portal, DERP flyers and publications, existing NoUI design system CSS.

**Brand platform**: "Powering Your Future, Together" — positions DERP as a partner, not a bureaucracy.

**Color system** (extracted from derp.org):
- **Primary teal**: #00796b (buttons, links, active states)
- **Accent orange**: #e65100 (warnings, attention, CTAs)
- **Background**: White/light gray with slight teal warmth (#f6f9f9)
- **Text**: Deep teal-black (#1a2e2e) — not pure black
- **Success green**: Muted, institutional (#2e7d32)

**Typography**: Clean, modern, accessible. The redesigned brand moved away from institutional/government feel toward contemporary and engaging. Google Fonts: Plus Jakarta Sans (headings — warm geometric), Source Sans 3 (body — highly readable), JetBrains Mono (data values — precise and technical).

**Design tone**: Warm, approachable, not corporate. The Sector Brands redesign specifically aimed to "make it more contemporary, engaging, relevant and member-centric." The member portal must continue this direction — it should feel like a trusted advisor, not a government form.

**Existing design system alignment**: Our noui-design-system.css already captures these tokens accurately. The prototype uses them directly.

### 4. Multi-Portal Architecture

**Sources analyzed**: Salesforce enterprise agentic architecture, Oracle enterprise portal patterns, ServiceNow employee portal winners (2025), Microsoft Azure multitenant architecture guidance.

**Key principles extracted**:

**a) Shared component library, portal-specific theming.** Salesforce's approach uses consistent component patterns with role-based rendering. ServiceNow's best portals (Danone replacing 27 regional sites, Adidas ASPEN) all emphasize unified design systems with audience-specific presentation.

**b) Portal identity through branding, not through different systems.** Stripe's app platform uses a color indicator bar and icon to distinguish apps while maintaining component consistency. For NoUI, each portal has its own color personality and layout shell, but the underlying components (Badge, Field, Callout, Table, Card) are identical.

**c) Density scales with expertise.** Oracle's enterprise portal patterns distinguish between "content portals" (read-focused, comfortable spacing) and "process portals" (task-focused, dense). For NoUI: Staff = high density, Member = comfortable, Employer = medium-high, Vendor = comfortable.

---

## Four-Portal Architecture

### Shared Architecture Layer

All four portals consume the same:
- **API layer** (connector, intelligence, workspace services)
- **Component primitives** (Badge, Field, Callout, Card, Table, ProgressBar)
- **Typography scale** (Plus Jakarta Sans / Source Sans 3 / JetBrains Mono)
- **Semantic color tokens** (success, warning, danger, info — mapped per theme)
- **Interaction patterns** (hover states, focus rings, transitions)

What differs per portal:
- **Color theme** (sidebar, accent, surfaces)
- **Layout shell** (sidebar nav vs. top nav)
- **Information density** (padding, font sizes, data per screen)
- **Navigation model** (command palette vs. wizard vs. table-first)
- **Content tone** (technical vs. friendly vs. reporting vs. transactional)

### Portal 1: Staff Portal (Internal LOB)

**Audience**: Benefits analysts, supervisors, CSRs — process 20-40 cases/day.

**Design direction**: Linear-inspired. High density, keyboard-first, deep teal sidebar.

**Layout**: Fixed sidebar (200px) + content area. No scrolling on primary workflow.

**Key features**:
- **Command Palette (⌘K)**: Search members, jump to cases, run calculations, access rules
- **Keyboard shortcuts**: G+Q (queue), G+C (cases), G+M (members), G+L (calculations)
- **Pipeline view**: Active step + upcoming preview cards showing the system already has answers
- **Completed step chips**: Click any to jump back and review
- **Confirm & Continue button names the next step**: Analyst always knows where they're going
- **Member banner**: Persistent context — tier badge, flags (DRO, leave payout, early retirement)
- **Hover-discoverable shortcuts**: Like Linear, every element shows its keyboard shortcut on hover

**Color**: Deep teal sidebar (#00363a), white content area, teal accent (#00796b), tier-coded badges.

**Density**: Compact padding (7-10px rows), 12px body text, monospace values, minimal line height.

### Portal 2: Member Portal (Self-Service)

**Audience**: DERP members — use the system once or twice in their career (retirement, beneficiary updates).

**Design direction**: DERP brand. Warm, progressive, guided. Feels like a trusted advisor.

**Layout**: Top navigation bar (DERP branded) + centered content (max-width 720px). No sidebar.

**Key features**:
- **Step-by-step wizard**: 5 clear stages with progress bar
- **Pre-populated confirmation**: Start with what we already know (builds trust, reduces effort)
- **Interactive benefit estimate**: The "wow moment" — member sees their number for the first time
- **Payment option comparison**: All four options with real calculated amounts, clear descriptions
- **Conditional sections**: Spousal consent only if married + Maximum/non-spouse beneficiary. DRO banner only if DRO exists. Leave payout callout only if eligible.
- **Scenario modeling**: Jennifer Kim sees "wait 1 year → 54% increase" proactively
- **Save & return**: Auto-save every field change, resume from any device
- **Friendly language**: "Everything look correct?" not "Confirm data accuracy"

**Color**: DERP teal (#00796b) primary, warm orange (#e65100) for attention items, white cards on light gray (#f6f9f9) background.

**Density**: Generous padding (16-20px), 14px body text, large touch targets (44px minimum), clear section breaks.

### Portal 3: Employer Portal

**Audience**: City department payroll managers — monthly reporting, employee status, contribution verification.

**Design direction**: Professional slate-blue. Table-first, reporting-focused.

**Layout**: Sidebar navigation (200px) + content area. Dashboard-first landing.

**Key features**:
- **Stats dashboard**: Active employees, pending retirements, monthly payroll, average service — at a glance
- **Employee roster table**: Sortable, filterable, tier-coded — the primary workspace
- **Contribution reporting**: Upload payroll data, verify contributions, flag discrepancies
- **Retirement coordination**: See who's pending, what documents are needed
- **Command palette**: Available but less prominent than staff portal

**Color**: Navy sidebar (#1e293b), blue accent (#3b82f6), white/slate surfaces. Professional and corporate.

**Density**: Medium-high. Tables use compact rows (32px), stats cards use moderate padding.

### Portal 4: Vendor Portal (Health Insurance)

**Audience**: Health insurance vendor enrollment specialists — process enrollments, verify IPR eligibility.

**Design direction**: Clean, transactional, healthcare-adjacent teal-green.

**Layout**: Top navigation + centered content (max-width 800px). No sidebar.

**Key features**:
- **Enrollment queue**: Primary view — pending, verified, enrolled items
- **IPR verification**: Confirm service years, calculate IPR amount, verify plan selection
- **Stats overview**: Pending count, monthly enrolled, average IPR
- **Minimal navigation**: Vendors need 2-3 screens maximum — queue, detail, reports

**Color**: Teal-green (#0d9488) accent, warm white surfaces, minimal visual weight.

**Density**: Comfortable. Enrollment specialists process fewer items with more verification per item.

---

## Reducing Scrolling & Mouse Navigation

The research consistently points to these techniques for minimizing scrolling and mouse travel:

### For Staff Portal (highest impact)

1. **Pipeline view eliminates scroll**: Active step + upcoming cards fit in viewport without scrolling. No wasted whitespace.
2. **Command palette eliminates menu navigation**: ⌘K reaches any function in 2 keystrokes.
3. **Keyboard shortcuts for common actions**: G+key navigation means analysts never touch the mouse for screen changes.
4. **Completed step chips collapse vertically**: Instead of scrolling back through a long wizard, click a compact chip.
5. **Confirm & Continue is a single action**: No separate "save" and "next" buttons.

### For Member Portal

1. **One question per screen (staged disclosure)**: No scrolling within a step — everything fits in the viewport.
2. **Pre-populated data reduces input**: Member confirms rather than enters — fewer fields, less scrolling.
3. **Conditional sections**: Only relevant fields appear. A single member without a DRO sees 40% fewer fields than the Robert Martinez DRO case.
4. **Large touch targets and clear spacing**: No need for precise mouse targeting.

### For Employer Portal

1. **Stats + table on single screen**: Dashboard metrics above, filterable table below — no page changes needed.
2. **Inline actions on table rows**: Hover to reveal actions, click to expand detail panel — no navigation.
3. **Sticky table headers**: For departments with many employees, headers stay visible during any scroll.

### For Vendor Portal

1. **Queue is the home screen**: No dashboard-to-queue navigation — you land on your work.
2. **Inline expansion**: Click an enrollment item to expand detail panel in-place.
3. **3-screen maximum**: Queue → Detail → Reports. That's it.

---

## Implementation Strategy

### Phase 1: POC (Current)
- Staff portal pipeline view with 4 demo cases
- Member portal wizard for Case 1 (Robert Martinez)
- Theme switching demonstrates multi-portal architecture
- All themes align with noui-design-system.css tokens

### Phase 2: Production Foundation
- Extract shared component library (@noui/components)
- Portal shell components (SidebarLayout, TopnavLayout)
- Theme provider consuming CSS custom properties
- Command palette with actual backend integration

### Phase 3: Portal Buildout
- Staff portal: full case management, queue, supervisor views
- Member portal: complete application wizard, status tracking, messaging
- Employer portal: payroll reporting, employee roster, contribution upload
- Vendor portal: enrollment queue, IPR verification

### Technology Alignment
- React 18+ with TypeScript strict mode
- Tailwind CSS consuming noui-design-system.css custom properties
- shadcn/ui primitives as component base (unstyled, composable)
- Portal-specific theme files extending the base design system

---

## Prototype Reference

The accompanying `noui-multi-portal.jsx` demonstrates:
- All four portal themes with instant switching
- Staff portal: sidebar + pipeline view + command palette (⌘K)
- Member portal: DERP-branded wizard with progressive disclosure
- Employer portal: sidebar + stats dashboard + employee table
- Vendor portal: top nav + enrollment queue
- Shared components (Badge, Field, Callout) adapting to each theme
- JetBrains Mono for all numerical values across all portals
- Tier-coded badges consistent across staff and employer views

---

*Document: NoUI Multi-Portal UX Architecture — Design Research Synthesis*
*Date: February 22, 2026*
*Status: Design Evaluation*
