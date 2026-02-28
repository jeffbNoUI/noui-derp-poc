/**
 * Tests for the simulation system — verifies generators produce valid telemetry.
 * TOUCHPOINTS:
 *   Upstream: personas.ts, noise.ts, all generators, session-generator.ts
 *   Downstream: None (test-only)
 *   Shared: guided-types.ts reducer, upload reducer, Portal types
 */
import { describe, it, expect } from 'vitest'
import { createRng } from '../noise'
import { ALL_PERSONAS, STAFF_PERSONAS, MEMBER_PERSONAS, EMPLOYER_PERSONAS } from '../personas'
import { generateStaffRetirementSession } from '../generators/staff-retirement'
import { generateStaffDeathSession } from '../generators/staff-death'
import { generateStaffRefundSession } from '../generators/staff-refund'
import { generateMemberWizardSession } from '../generators/member-wizard'
import { generateEmployerUploadSession } from '../generators/employer-upload'
import { generateAllSessions } from '../session-generator'
import { extractAllPatterns } from '../analysis/pattern-extractor'
import { generateRecommendations } from '../analysis/composition-recommender'

describe('Persona definitions', () => {
  it('has 25 total personas', () => {
    expect(ALL_PERSONAS).toHaveLength(25)
  })

  it('has correct role distribution', () => {
    expect(STAFF_PERSONAS.length).toBeGreaterThanOrEqual(10)
    expect(MEMBER_PERSONAS.length).toBeGreaterThanOrEqual(5)
    expect(EMPLOYER_PERSONAS.length).toBeGreaterThanOrEqual(3)
  })

  it('all personas have valid parameters', () => {
    for (const p of ALL_PERSONAS) {
      expect(p.speed_factor).toBeGreaterThan(0)
      expect(p.thoroughness).toBeGreaterThanOrEqual(0)
      expect(p.thoroughness).toBeLessThanOrEqual(1)
      expect(p.linearity).toBeGreaterThanOrEqual(0)
      expect(p.linearity).toBeLessThanOrEqual(1)
      expect(p.error_rate).toBeGreaterThanOrEqual(0)
      expect(p.error_rate).toBeLessThanOrEqual(1)
    }
  })
})

describe('Noise helpers', () => {
  it('createRng is deterministic', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    const vals1 = Array.from({ length: 10 }, () => rng1())
    const vals2 = Array.from({ length: 10 }, () => rng2())
    expect(vals1).toEqual(vals2)
  })

  it('createRng produces values in [0, 1)', () => {
    const rng = createRng(123)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('Staff retirement generator', () => {
  it('generates events for guided mode', () => {
    const rng = createRng(42)
    const events = generateStaffRetirementSession({
      sessionId: 'S-TEST-001',
      persona: STAFF_PERSONAS[0],
      caseIndex: 0,
      expertMode: false,
      rng,
    })

    expect(events.length).toBeGreaterThan(10)
    expect(events[0].event_type).toBe('session_start')
    expect(events[events.length - 1].event_type).toBe('session_complete')
    expect(events[0].portal).toBe('staff')
    expect(events[0].workflow).toBe('retirement')
  })

  it('generates events for expert mode', () => {
    const rng = createRng(42)
    const events = generateStaffRetirementSession({
      sessionId: 'S-TEST-002',
      persona: STAFF_PERSONAS[8], // Expert
      caseIndex: 0,
      expertMode: true,
      rng,
    })

    expect(events.length).toBeGreaterThan(10)
    const expertSwitch = events.find(e => e.event_type === 'expert_mode_switch')
    expect(expertSwitch).toBeDefined()
  })

  it('handles DRO case (case 4)', () => {
    const rng = createRng(42)
    const events = generateStaffRetirementSession({
      sessionId: 'S-TEST-003',
      persona: STAFF_PERSONAS[0],
      caseIndex: 3, // Case 4 (DRO)
      expertMode: false,
      rng,
    })

    const stageEnters = events.filter(e => e.event_type === 'stage_enter')
    const stageIds = stageEnters.map(e => e.payload['stage_id'])
    expect(stageIds).toContain('dro')
  })

  it('all events have valid timestamps', () => {
    const rng = createRng(42)
    const events = generateStaffRetirementSession({
      sessionId: 'S-TEST-004',
      persona: STAFF_PERSONAS[0],
      caseIndex: 0,
      expertMode: false,
      rng,
    })

    for (let i = 1; i < events.length; i++) {
      expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp)
    }
  })
})

describe('Staff death generator', () => {
  it('generates events with 5 stages', () => {
    const rng = createRng(42)
    const events = generateStaffDeathSession({
      sessionId: 'S-TEST-005',
      persona: STAFF_PERSONAS[0],
      caseIndex: 0,
      rng,
    })

    const stageEnters = events.filter(e => e.event_type === 'stage_enter')
    expect(stageEnters).toHaveLength(5)
    expect(events[events.length - 1].event_type).toBe('session_complete')
  })
})

describe('Staff refund generator', () => {
  it('generates non-vested refund (5 stages)', () => {
    const rng = createRng(42)
    const events = generateStaffRefundSession({
      sessionId: 'S-TEST-006',
      persona: STAFF_PERSONAS[0],
      caseIndex: 0, // Non-vested
      rng,
    })

    const stageEnters = events.filter(e => e.event_type === 'stage_enter')
    expect(stageEnters).toHaveLength(5)
  })

  it('generates vested refund (6 stages)', () => {
    const rng = createRng(42)
    const events = generateStaffRefundSession({
      sessionId: 'S-TEST-007',
      persona: STAFF_PERSONAS[0],
      caseIndex: 1, // Vested
      rng,
    })

    const stageEnters = events.filter(e => e.event_type === 'stage_enter')
    expect(stageEnters).toHaveLength(6)
  })
})

describe('Member wizard generator', () => {
  it('generates completed wizard session', () => {
    const rng = createRng(42)
    const events = generateMemberWizardSession({
      sessionId: 'S-TEST-008',
      persona: MEMBER_PERSONAS[2], // Confident member, low error rate
      caseIndex: 0,
      forceAbandon: false,
      rng,
    })

    expect(events[0].event_type).toBe('session_start')
    expect(events[0].portal).toBe('member')
    // May complete or naturally abandon
    const lastType = events[events.length - 1].event_type
    expect(['session_complete', 'session_abandon']).toContain(lastType)
  })

  it('generates abandoned wizard session', () => {
    const rng = createRng(42)
    const events = generateMemberWizardSession({
      sessionId: 'S-TEST-009',
      persona: MEMBER_PERSONAS[0],
      caseIndex: 0,
      forceAbandon: true,
      rng,
    })

    const abandonEvent = events.find(e => e.event_type === 'session_abandon')
    expect(abandonEvent).toBeDefined()
  })
})

describe('Employer upload generator', () => {
  it('generates clean file upload session', () => {
    const rng = createRng(42)
    const events = generateEmployerUploadSession({
      sessionId: 'S-TEST-010',
      persona: EMPLOYER_PERSONAS[0],
      fixtureIndex: 0, // Clean
      rng,
    })

    expect(events[0].portal).toBe('employer')
    expect(events[events.length - 1].event_type).toBe('session_complete')
  })

  it('generates error file upload with remediation', () => {
    const rng = createRng(42)
    const events = generateEmployerUploadSession({
      sessionId: 'S-TEST-011',
      persona: EMPLOYER_PERSONAS[0],
      fixtureIndex: 2, // Errors
      rng,
    })

    const corrections = events.filter(e =>
      e.event_type === 'analyst_input' && e.payload['action'] === 'correct'
    )
    expect(corrections.length).toBeGreaterThan(0)
  })
})

describe('Full session generation', () => {
  it('generates 1000 sessions with deterministic seed', () => {
    const result = generateAllSessions(42)

    expect(result.totalSessions).toBe(1000)
    expect(result.totalEvents).toBeGreaterThan(30000)
    expect(result.summaries).toHaveLength(1000)
  })

  it('is deterministic — same seed produces same event count and types', () => {
    const r1 = generateAllSessions(42)
    const r2 = generateAllSessions(42)

    expect(r1.totalEvents).toBe(r2.totalEvents)
    expect(r1.summaries.length).toBe(r2.summaries.length)
    // Check first few events have same types and session IDs
    // (timestamps use Date.now() so they differ between runs)
    for (let i = 0; i < 10; i++) {
      expect(r1.events[i].event_type).toBe(r2.events[i].event_type)
      expect(r1.events[i].session_id).toBe(r2.events[i].session_id)
    }
  })

  it('has correct portal distribution', () => {
    const result = generateAllSessions(42)
    const byPortal = new Map<string, number>()
    for (const s of result.summaries) {
      byPortal.set(s.portal, (byPortal.get(s.portal) ?? 0) + 1)
    }

    expect(byPortal.get('staff')).toBe(650)
    expect(byPortal.get('member')).toBe(250)
    expect(byPortal.get('employer')).toBe(100)
  })
})

describe('Pattern extraction', () => {
  it('extracts all pattern categories', () => {
    const result = generateAllSessions(42)
    const patterns = extractAllPatterns(result.events, result.summaries)

    expect(patterns.stage_ordering.length).toBeGreaterThan(0)
    expect(patterns.bottlenecks.length).toBeGreaterThan(0)
    expect(patterns.completion_funnel).toHaveLength(7)
    expect(patterns.nudge_effectiveness.length).toBeGreaterThan(0)
    expect(patterns.learning_module).toHaveLength(3)
  })

  it('generates actionable recommendations', () => {
    const result = generateAllSessions(42)
    const patterns = extractAllPatterns(result.events, result.summaries)
    const recommendations = generateRecommendations(patterns)

    expect(recommendations.length).toBeGreaterThan(0)

    // Every recommendation references a real file
    for (const rec of recommendations) {
      expect(rec.implementation.file).toMatch(/^src\//)
      expect(rec.implementation.function_name).toBeTruthy()
      expect(rec.evidence.confidence).toBeGreaterThan(0)
      expect(rec.evidence.confidence).toBeLessThanOrEqual(1)
    }
  })
})
