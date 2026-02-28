/**
 * Integration tests for agent composition — verifies end-to-end mapping from
 * AgentWorkspaceSpec through the adapter to correct stage selection.
 * Tests each demo case scenario and fallback behavior.
 * TOUCHPOINTS:
 *   Upstream: agent-adapter.ts, guided-help.ts (STAGE_HELP), useWorkspace.ts (AgentWorkspaceSpec)
 *   Downstream: None (test file)
 */
import { describe, it, expect } from 'vitest'
import { composeStagesFromAgent } from '../agent-adapter'
import type { AgentWorkspaceSpec } from '@/hooks/useWorkspace'

/** All standard components the composition service might include */
const ALL_STANDARD_COMPONENTS = [
  'employment-timeline', 'service-credit-summary', 'salary-table',
  'eligibility-panel', 'benefit-calculation', 'payment-options', 'ipr-panel',
]

function makeFullSpec(extraComponents: string[] = [], overrides?: Partial<AgentWorkspaceSpec>): AgentWorkspaceSpec {
  return {
    stages: [
      {
        id: 'main', label: 'Main', order: 1,
        components: [...ALL_STANDARD_COMPONENTS, ...extraComponents],
      },
    ],
    conditional_components: {},
    rationale: {
      'employment-timeline': 'Member employment history required for verification',
      'eligibility-panel': 'Retirement date selected — evaluating Rule of 75',
      'benefit-calculation': 'Computing AMS and applying tier multiplier',
    },
    alerts: [],
    knowledge_context: [
      { provision_id: 'RMC-18-408', title: 'Rule of 75', citation: 'RMC §18-408(b)', relevance: 'Applies to Tier 1 members' },
    ],
    composed_by: 'agent',
    ...overrides,
  }
}

describe('Agent composition integration — demo cases', () => {
  it('Case 1 (Robert, Tier 1): standard stages without DRO', () => {
    // Robert: Tier 1, leave payout, no DRO
    const spec = makeFullSpec()
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    expect(ids).toEqual([
      'application-intake', 'member-verify', 'service-credit', 'eligibility',
      'benefit-calc', 'payment-options', 'supplemental', 'review-certify',
    ])
  })

  it('Case 4 (James, Tier 1 + DRO): includes DRO stage', () => {
    // James: Tier 1, leave payout, has DRO
    const spec = makeFullSpec(['dro-impact'])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    expect(ids).toContain('dro')
    expect(ids.indexOf('dro')).toBeGreaterThan(ids.indexOf('supplemental'))
    expect(ids.indexOf('dro')).toBeLessThan(ids.indexOf('review-certify'))
  })

  it('Case 2 (Jennifer, Tier 1, no DRO, purchased service): standard stages', () => {
    const spec = makeFullSpec()
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    // Jennifer has purchased service but no DRO — standard stages
    expect(ids).not.toContain('dro')
    expect(ids).toContain('service-credit')
  })

  it('Case 3 (Maria, Tier 3): standard stages', () => {
    const spec = makeFullSpec()
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    expect(ids).not.toContain('dro')
    expect(ids).toContain('eligibility')
    expect(ids).toContain('benefit-calc')
  })
})

describe('Agent composition integration — rationale availability', () => {
  it('rationale entries are present for included components', () => {
    const spec = makeFullSpec()
    expect(spec.rationale['employment-timeline']).toBeDefined()
    expect(spec.rationale['eligibility-panel']).toBeDefined()
    expect(spec.rationale['benefit-calculation']).toBeDefined()
  })

  it('knowledge_context entries are present', () => {
    const spec = makeFullSpec()
    expect(spec.knowledge_context.length).toBeGreaterThan(0)
    expect(spec.knowledge_context[0].provision_id).toBe('RMC-18-408')
  })
})

describe('Agent composition integration — fallback', () => {
  it('static-fallback composed_by still produces valid stages', () => {
    const spec = makeFullSpec([], { composed_by: 'static-fallback' })
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    // Same stage structure regardless of composed_by source
    expect(ids).toContain('application-intake')
    expect(ids).toContain('review-certify')
    expect(ids).toContain('benefit-calc')
  })

  it('empty stages array yields only always-present stages', () => {
    const spec: AgentWorkspaceSpec = {
      stages: [],
      conditional_components: {},
      rationale: {},
      alerts: [],
      knowledge_context: [],
      composed_by: 'agent',
    }
    const stages = composeStagesFromAgent(spec)
    expect(stages.map(s => s.id)).toEqual(['application-intake', 'review-certify'])
  })
})
