/**
 * Curated demo script for kiosk mode — ~50 steps, ~3.5 minutes.
 * Seven scenes covering platform showcase, staff expert mode, guided mode,
 * member portal, and capability demos.
 * Consumed by: KioskOrchestrator
 * Depends on: kiosk-types (KioskStep)
 */
import type { KioskStep } from './kiosk-types'

export const KIOSK_SCRIPT: KioskStep[] = [

  // ═══════════════════════════════════════════════════════════
  // Scene 1 — Platform Showcase (8s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Platform Showcase',
    caption: 'NoUI — a pension administration platform that dynamically composes workspaces based on member data, business rules, and process context.',
    dwell: 5000,
  },
  {
    type: 'navigate',
    path: '/',
    caption: 'Nine capability areas organized into Core Workspaces, Productivity Services, and Platform Intelligence.',
    dwell: 5000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 2 — Staff Welcome (6s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Staff Workspace',
    caption: 'The Staff Workspace — where retirement analysts process applications with full transparency.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/staff',
    caption: 'Two processing modes: Expert for experienced analysts, Guided for training and complex cases.',
    dwell: 5000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 3 — Expert Mode: Robert Martinez (45s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Expert Mode',
    caption: 'Expert Mode — Robert Martinez, Tier 1 member with 30+ years of service and a leave payout.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/staff/case/10001',
    caption: 'The carousel layout gives experienced analysts immediate access to all stages. The Live Summary sidebar tracks progress in real time.',
    dwell: 5000,
  },
  // Visit eligibility stage
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'eligibility' },
    caption: 'Eligibility — Rule of 75 met with age 62 + 31 years of service = 93. Normal retirement, no reduction.',
    dwell: 4500,
  },
  // Visit benefit calc
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'benefit-calc' },
    caption: 'Benefit Calculation — the rules engine shows every input, formula step, and intermediate result. $52,000 leave payout boosts the final salary month.',
    dwell: 5000,
  },
  // Confirm eligibility
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'CONFIRM_AND_ROUTE', stageId: 'application-intake', stageCount: 9, allStageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'dro', 'review-certify'] },
    caption: 'Confirming stages — each confirmation collapses to a chip and auto-routes to the next unconfirmed stage.',
    dwell: 3500,
  },
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'CONFIRM_AND_ROUTE', stageId: 'member-verify', stageCount: 9, allStageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'dro', 'review-certify'] },
    caption: 'The Live Summary sidebar updates as stages are confirmed — building toward the complete picture.',
    dwell: 3500,
  },
  // Visit payment options
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'SELECT_EXPERT_STAGE', stageId: 'payment-options' },
    caption: 'Payment Options — five DERP options displayed with DRO-adjusted amounts. Every number from the certified rules engine.',
    dwell: 5000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 4 — Guided Mode: Jennifer Kim (35s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Guided Mode',
    caption: 'Guided Mode — Jennifer Kim, Tier 2 with purchased service credit and early retirement.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/staff/case/10002/guided',
    caption: 'Sequential processing with the Learning Module — onboarding narrative, rules citations, and verification checklists.',
    dwell: 5000,
  },
  // Navigate to service credit
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 2 },
    caption: 'Service Credit — 2 years purchased. Critical distinction: purchased credit counts for benefit calculation but NOT for Rule of 75.',
    dwell: 5000,
  },
  // Navigate to eligibility
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 3 },
    caption: 'Eligibility — age 58 + 15 years credited (13 earned). Rule of 75 not met. Early retirement with 21% reduction (3% per year under 65, Tiers 1 & 2).',
    dwell: 5500,
  },
  // Toggle rules layer
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'TOGGLE_LAYER', layer: 'rules' },
    caption: 'The Learning Module shows RMC citations for every rule applied — analysts can verify against the governing documents.',
    dwell: 4500,
  },
  // Navigate to benefit calc
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'GO_TO', index: 4 },
    caption: 'Benefit Calculation — 1.5% multiplier (Tier 2), AMS from 36 consecutive months, early retirement reduction applied transparently.',
    dwell: 5000,
  },
  // Toggle rules off
  {
    type: 'dispatch',
    target: 'guided',
    action: { type: 'TOGGLE_LAYER', layer: 'rules' },
    dwell: 500,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 5 — Member Portal (40s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Member Portal',
    caption: 'The Member Portal — where retiring members apply online. Same rules engine, member-facing presentation.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/portal',
    caption: 'Dashboard shows application status, upcoming retirement date, and quick actions. Portal never calculates — it reads from the rules engine.',
    dwell: 5000,
  },
  {
    type: 'navigate',
    path: '/portal/apply/new',
    caption: 'The Application Wizard — 7 steps from personal info through review and submit.',
    dwell: 4000,
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
    caption: 'Step 2: Retirement Date — pre-populated from the member\'s filed intent, editable if plans change.',
    dwell: 4000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 2 },
    caption: 'Step 3: Benefit Estimate — read-only display from the rules engine. The portal shows the work but never runs the calculation.',
    dwell: 5000,
  },
  {
    type: 'dispatch',
    target: 'wizard',
    action: { type: 'SET_STEP', step: 3 },
    caption: 'Step 4: Payment Option — members select from the same DERP options staff sees, with clear monthly amounts.',
    dwell: 4500,
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
    caption: 'Step 5: Death Benefit — $5,000 lump sum for normal retirees. Installment election: 50 or 100 monthly payments.',
    dwell: 4500,
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
    caption: 'Step 6: Insurance & Acknowledgments — health coverage continuation and regulatory disclosures.',
    dwell: 4000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 6 — Capability Demos (25s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Platform Intelligence',
    caption: 'Beyond the core workspace — AI-powered productivity services that accelerate administration.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/demos/knowledge-assistant',
    caption: 'Knowledge Assistant — AI reads governing documents and answers plan questions with RMC citations. Never executes rules.',
    dwell: 5000,
  },
  {
    type: 'navigate',
    path: '/demos/workflow',
    caption: 'Workflow Dashboard — AI learns task patterns from transactions to orchestrate work and prioritize queues.',
    dwell: 5000,
  },
  {
    type: 'navigate',
    path: '/demos/data-quality',
    caption: 'Data Quality — AI identifies anomalies and proposes corrections. Every suggestion awaits human review.',
    dwell: 5000,
  },

  // ═══════════════════════════════════════════════════════════
  // Scene 7 — Closing (8s)
  // ═══════════════════════════════════════════════════════════
  {
    type: 'scene',
    name: 'Closing',
    caption: 'NoUI — the system shows its work. Every calculation is transparent and verifiable.',
    dwell: 2000,
  },
  {
    type: 'navigate',
    path: '/',
    caption: 'Deterministic rules engine. AI-composed workspaces. Trust through transparency. Thank you for watching.',
    dwell: 6000,
  },
]
