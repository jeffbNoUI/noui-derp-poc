/**
 * Curated demo script for kiosk mode — ~50 steps, ~4 minutes.
 * Seven scenes covering platform showcase, staff expert mode, guided mode,
 * member portal, and capability demos. Each step declares a narrator panel
 * with position preset to avoid blocking action buttons.
 * Consumed by: KioskOrchestrator
 * Depends on: kiosk-types (KioskStep)
 */
import type { KioskStep } from './kiosk-types'

export const KIOSK_SCRIPT: KioskStep[] = [

  // ═══════════════════════════════════════════════════════════
  // Scene 1 — Platform Showcase (landing page, bottom-center)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Platform Showcase',
    caption: 'NoUI — Pension Administration, Reimagined',
    narrator: {
      headline: 'NoUI Platform Overview',
      body: 'Welcome to NoUI — a pension administration platform that dynamically composes workspaces based on member data, business rules, and process context.\n\nInstead of static screens, the system assembles exactly what each user needs for their current task. Every calculation is transparent, every rule is traceable to its governing document.',
      position: 'bottom-center',
    },
    dwell: 10000,
  },
  {
    type: 'navigate',
    path: '/',
    narrator: {
      headline: 'Nine Capability Areas',
      body: 'The platform organizes into three tiers: Core Workspaces for daily processing, Productivity Services that accelerate routine tasks, and Platform Intelligence that learns operational patterns over time.\n\nEach card represents a capability area — not a menu item. The system activates the right capabilities based on what the member needs.',
      position: 'bottom-center',
    },
    dwell: 10000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 2 — Staff Welcome (bottom-center, no footer yet)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Staff Workspace',
    caption: 'The Staff Workspace',
    narrator: {
      headline: 'Staff Workspace',
      body: 'The staff workspace is where retirement analysts process applications. The system composes a different workspace for each member based on their tier, employment history, and retirement type.\n\nTwo processing modes adapt to the analyst\'s experience level and the case complexity.',
      position: 'bottom-center',
    },
    dwell: 8000,
  },
  {
    type: 'navigate',
    path: '/staff',
    narrator: {
      headline: 'Expert & Guided Modes',
      body: 'Expert Mode gives experienced analysts a carousel layout with immediate access to all stages — no forced sequence. Guided Mode walks newer analysts step-by-step with a Learning Module sidebar that teaches plan provisions as they work.\n\nBoth modes use the same rules engine. The difference is presentation, not calculation.',
      position: 'bottom-center',
    },
    dwell: 10000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 3 — Expert Mode: Robert Martinez (top-right, clears footer)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Expert Mode',
    caption: 'Expert Mode — Robert Martinez',
    narrator: {
      headline: 'Case: Robert Martinez',
      body: 'Robert is a Tier 1 member with 30+ years of service and a qualifying sick leave payout. His case demonstrates the full benefit calculation pipeline: leave payout boosting the final salary month, the highest 36-consecutive-month average, and the 2.0% Tier 1 multiplier.',
      position: 'bottom-center',
    },
    dwell: 10000,
  },
  {
    type: 'navigate',
    path: '/staff/case/10001',
    narrator: {
      headline: 'Carousel Layout',
      body: 'The carousel gives experienced analysts random access to all nine stages. The Live Summary sidebar tracks every confirmed value in real time — building toward a complete picture as the analyst works.\n\nNo legacy system offers this kind of at-a-glance progress. Every number traces back to its source.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Visit eligibility stage
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'eligibility' },
    narrator: {
      headline: 'Eligibility Determination',
      body: 'Rule of 75 check: age 62 + 31 years of service = 93. Robert qualifies for normal retirement with no early retirement reduction.\n\nThe system shows every input and threshold. Analysts verify, not guess. In legacy systems, eligibility was a lookup in a binder — here it\'s computed and displayed transparently.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Visit benefit calc
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'benefit-calc' },
    narrator: {
      headline: 'Benefit Calculation',
      body: 'Every input, formula step, and intermediate result is visible. The $52,000 leave payout adds to the final salary month, potentially boosting the 36-month average.\n\nThe rules engine calculates; the workspace presents. Analysts can verify each step against the C.R.S. Title 24 Article 51 citation shown alongside.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Confirm stages
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'CONFIRM_AND_ROUTE', stageId: 'application-intake', stageCount: 9, allStageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'dro', 'review-certify'] },
    narrator: {
      headline: 'Confirm & Advance',
      body: 'Each confirmation collapses to a chip and auto-routes to the next unconfirmed stage. The Live Summary updates immediately — analysts always know exactly where they stand.',
      position: 'top-right',
    },
    dwell: 6000,
  },
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'CONFIRM_AND_ROUTE', stageId: 'member-verify', stageCount: 9, allStageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'dro', 'review-certify'] },
    caption: '',
    dwell: 1500,
  },
  // Visit payment options
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'payment-options' },
    narrator: {
      headline: 'Payment Options',
      body: 'Five Colorado PERA payment options displayed with DRO-adjusted amounts. Members choose how to balance their monthly benefit against survivor protection.\n\nEvery dollar amount comes from the certified rules engine — the workspace presents, it never calculates. Analysts compare options side by side, something legacy systems required separate spreadsheets to achieve.',
      position: 'top-right',
    },
    dwell: 10000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 4 — Guided Mode: Jennifer Kim (top-right, clears footer + nav)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Guided Mode',
    caption: 'Guided Mode — Jennifer Kim',
    narrator: {
      headline: 'Case: Jennifer Kim',
      body: 'Jennifer is a Tier 2 member with 13 years of earned service plus 2 years of purchased service credit. Her case tests a critical distinction: purchased credit counts for the benefit amount but not for Rule of 75 eligibility.\n\nShe qualifies for early retirement with a 21% reduction — 3% per year under age 65.',
      position: 'bottom-center',
    },
    dwell: 10000,
  },
  {
    type: 'navigate',
    path: '/staff/case/10002/guided',
    narrator: {
      headline: 'Learning Module',
      body: 'Guided mode walks the analyst step-by-step with a Learning Module sidebar. Three independent layers — onboarding narrative, rules citations, and verification checklists — can be toggled based on experience level.\n\nNew analysts learn plan provisions while processing real cases. The training IS the work.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Navigate to service credit
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 2 },
    narrator: {
      headline: 'Service Credit',
      body: 'Two years of purchased service credit. The critical distinction the system enforces: purchased credit counts toward the benefit calculation (increasing the monthly amount) but does NOT count toward Rule of 75 or Rule of 85 eligibility.\n\nThis is the kind of nuance that causes errors in manual processing.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Navigate to eligibility
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 3 },
    narrator: {
      headline: 'Early Retirement',
      body: 'Age 58 + 15 years credited (only 13 earned for eligibility). Rule of 75 not met: 58 + 13 = 71.\n\nEarly retirement applies with a 21% reduction — 3% per year under age 65 for Tier 2 members. The system shows the exact calculation, not just the result.',
      position: 'top-right',
    },
    dwell: 10000,
  },
  // Toggle rules layer
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'TOGGLE_LAYER', layer: 'rules' },
    narrator: {
      headline: 'Rules Citations',
      body: 'The Learning Module shows C.R.S. Title 24 Article 51 citations for every rule applied. Analysts can verify any determination against the governing documents — the source of truth, not institutional memory.\n\nThis is trust through transparency: the system shows its work.',
      position: 'top-right',
    },
    dwell: 8000,
  },
  // Navigate to benefit calc
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 4 },
    narrator: {
      headline: 'Tier 2 Benefit Calc',
      body: '1.5% multiplier for Tier 2, average monthly salary from the highest 36 consecutive months, early retirement reduction applied transparently.\n\nThe guided mode walks through each formula component. Analysts build confidence by verifying each step before moving forward.',
      position: 'top-right',
    },
    dwell: 9000,
  },
  // Toggle rules off (quick dispatch, no narrator)
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'TOGGLE_LAYER', layer: 'rules' },
    dwell: 500,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 5 — Member Portal (bottom-center for dashboard, bottom-right for wizard)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Member Portal',
    caption: 'Member Portal',
    narrator: {
      headline: 'Member Self-Service',
      body: 'The member portal gives retiring members a direct view into their retirement application. Same rules engine, same transparency — presented for the member audience.\n\nThe portal reads from the rules engine. It never calculates, never interprets. Members see exactly what staff sees, adapted for their context.',
      position: 'bottom-center',
    },
    dwell: 9000,
  },
  {
    type: 'navigate',
    path: '/portal',
    narrator: {
      headline: 'Member Dashboard',
      body: 'Application status, upcoming retirement date, and quick actions — all at a glance. Members track their application\'s progress without calling the office.\n\nIn legacy systems, members wait for a letter. Here, they watch their application move through each stage in real time.',
      position: 'bottom-center',
    },
    dwell: 9000,
  },
  {
    type: 'navigate',
    path: '/portal/apply/new',
    narrator: {
      headline: 'Application Wizard',
      body: 'A seven-step wizard walks members through the retirement application — personal info, retirement date, benefit estimate, payment option, death benefit election, insurance, and final review.\n\nEach step presents information from the rules engine. The member confirms, they don\'t calculate.',
      position: 'bottom-right',
    },
    dwell: 10000,
  },
  // Step through the wizard
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'UPDATE', payload: { personal_confirmed: true } },
    dwell: 500,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 1 },
    narrator: {
      headline: 'Retirement Date',
      body: 'Pre-populated from the member\'s filed intent, editable if plans change. The system validates the date against eligibility rules and shows the impact on the benefit amount immediately.',
      position: 'bottom-right',
    },
    dwell: 7000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 2 },
    narrator: {
      headline: 'Benefit Estimate',
      body: 'Read-only display from the rules engine. The portal shows every step of the calculation but never runs it — the same deterministic engine that staff uses produces these numbers.\n\nMembers see the formula, not just the result. Transparency builds trust.',
      position: 'bottom-right',
    },
    dwell: 9000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 3 },
    narrator: {
      headline: 'Payment Option',
      body: 'Members select from the same Colorado PERA payment options staff sees — Maximum, Option 1 through 3. Each option shows the monthly amount and survivor benefit implications in plain language.',
      position: 'bottom-right',
    },
    dwell: 8000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'UPDATE', payload: { payment_option: 'maximum' } },
    dwell: 500,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 4 },
    narrator: {
      headline: 'Death Benefit',
      body: '$5,000 lump sum for normal retirees. Members elect 50 or 100 monthly installment payments.\n\nThe portal explains each choice clearly — no jargon, no ambiguity. Members make informed decisions.',
      position: 'bottom-right',
    },
    dwell: 7000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'UPDATE', payload: { death_benefit_election: '50_installments' } },
    dwell: 500,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 5 },
    narrator: {
      headline: 'Insurance & Disclosures',
      body: 'Health coverage continuation details and regulatory acknowledgments. The wizard ensures nothing is missed — every required election and disclosure is presented before final submission.',
      position: 'bottom-right',
    },
    dwell: 7000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 6 — Capability Demos (bottom-center, demo pages have space)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Platform Intelligence',
    caption: 'Platform Intelligence',
    narrator: {
      headline: 'Beyond the Core',
      body: 'Beyond the core workspaces, AI-powered productivity services accelerate administration without ever executing business rules.\n\nAI reads documents, learns patterns, identifies anomalies — and proposes. Humans decide.',
      position: 'bottom-center',
    },
    dwell: 8000,
  },
  {
    type: 'navigate',
    path: '/demos/knowledge-assistant',
    narrator: {
      headline: 'Knowledge Assistant',
      body: 'AI reads governing documents and answers plan questions with C.R.S. Title 24 Article 51 citations. Staff ask questions in plain language; the system responds with traced, verifiable answers.\n\nThe assistant never executes rules — it helps staff find the right provision faster.',
      position: 'bottom-center',
    },
    dwell: 9000,
  },
  {
    type: 'navigate',
    path: '/demos/workflow',
    narrator: {
      headline: 'Workflow Dashboard',
      body: 'AI learns task patterns from historical transactions to orchestrate work and prioritize queues. The system identifies bottlenecks and suggests optimal task sequences.\n\nAI informs the workflow; staff decide the priorities.',
      position: 'bottom-center',
    },
    dwell: 9000,
  },
  {
    type: 'navigate',
    path: '/demos/data-quality',
    narrator: {
      headline: 'Data Quality Monitor',
      body: 'AI identifies anomalies — missing records, inconsistent dates, suspicious patterns — and proposes corrections. Every suggestion awaits human review and approval.\n\nData quality is the foundation of accurate benefits. The system surfaces problems; staff fix them.',
      position: 'bottom-center',
    },
    dwell: 9000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 7 — Closing (bottom-center)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Closing',
    caption: 'Thank You',
    narrator: {
      headline: 'Trust Through Transparency',
      body: 'NoUI: a deterministic rules engine executing certified plan provisions, with AI-composed workspaces that show the right information for each situation.\n\nThe system shows its work. Every calculation is transparent and verifiable. Thank you for watching.',
      position: 'bottom-center',
    },
    dwell: 8000,
  },
  {
    type: 'navigate',
    path: '/',
    caption: 'Deterministic rules engine. AI-composed workspaces. Trust through transparency.',
    dwell: 6000,
  },
]
