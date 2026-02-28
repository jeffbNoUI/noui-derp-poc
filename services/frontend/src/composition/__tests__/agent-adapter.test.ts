/**
 * Tests for agent composition adapter — verifies mapping from AgentWorkspaceSpec
 * to StageHelp[] for guided workspace rendering.
 * TOUCHPOINTS:
 *   Upstream: agent-adapter.ts, guided-help.ts (STAGE_HELP), useWorkspace.ts (AgentWorkspaceSpec)
 *   Downstream: None (test file)
 */
import { describe, it, expect } from 'vitest'
import { composeStagesFromAgent, extractActiveComponentIds } from '../agent-adapter'
import type { AgentWorkspaceSpec } from '@/hooks/useWorkspace'

/** Helper to build a minimal AgentWorkspaceSpec with given component IDs */
function makeSpec(componentIds: string[], overrides?: Partial<AgentWorkspaceSpec>): AgentWorkspaceSpec {
  return {
    stages: [{ id: 'stage-1', label: 'Test Stage', order: 1, components: componentIds }],
    conditional_components: {},
    rationale: {},
    alerts: [],
    knowledge_context: [],
    composed_by: 'agent',
    ...overrides,
  }
}

describe('extractActiveComponentIds', () => {
  it('flattens components from multiple stages', () => {
    const spec: AgentWorkspaceSpec = {
      stages: [
        { id: 's1', label: 'S1', order: 1, components: ['eligibility-panel', 'salary-table'] },
        { id: 's2', label: 'S2', order: 2, components: ['benefit-calculation', 'payment-options'] },
      ],
      conditional_components: {},
      rationale: {},
      alerts: [],
      knowledge_context: [],
      composed_by: 'agent',
    }
    const ids = extractActiveComponentIds(spec)
    expect(ids).toEqual(new Set([
      'eligibility-panel', 'salary-table', 'benefit-calculation', 'payment-options',
    ]))
  })

  it('handles empty stages', () => {
    const spec = makeSpec([])
    expect(extractActiveComponentIds(spec).size).toBe(0)
  })

  it('deduplicates components across stages', () => {
    const spec: AgentWorkspaceSpec = {
      stages: [
        { id: 's1', label: 'S1', order: 1, components: ['salary-table'] },
        { id: 's2', label: 'S2', order: 2, components: ['salary-table', 'benefit-calculation'] },
      ],
      conditional_components: {},
      rationale: {},
      alerts: [],
      knowledge_context: [],
      composed_by: 'agent',
    }
    const ids = extractActiveComponentIds(spec)
    expect(ids.size).toBe(2)
  })
})

describe('composeStagesFromAgent', () => {
  it('always includes application-intake and review-certify', () => {
    const spec = makeSpec([])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)
    expect(ids).toContain('application-intake')
    expect(ids).toContain('review-certify')
  })

  it('empty spec returns only always-present stages', () => {
    const spec = makeSpec([])
    const stages = composeStagesFromAgent(spec)
    expect(stages.map(s => s.id)).toEqual(['application-intake', 'review-certify'])
  })

  it('maps Case 1 components (Tier 1, leave payout, no DRO)', () => {
    // Case 1 (Robert): employment-timeline, service-credit, salary, eligibility, benefit, payment, ipr — no DRO
    const spec = makeSpec([
      'employment-timeline', 'service-credit-summary', 'salary-table',
      'eligibility-panel', 'benefit-calculation', 'payment-options', 'ipr-panel',
    ])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    expect(ids).toContain('member-verify')
    expect(ids).toContain('service-credit')
    expect(ids).toContain('eligibility')
    expect(ids).toContain('benefit-calc')
    expect(ids).toContain('payment-options')
    expect(ids).toContain('supplemental')
    expect(ids).not.toContain('dro')
  })

  it('includes DRO stage when dro-impact component is present', () => {
    const spec = makeSpec([
      'employment-timeline', 'service-credit-summary', 'salary-table',
      'eligibility-panel', 'benefit-calculation', 'payment-options',
      'ipr-panel', 'dro-impact',
    ])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)
    expect(ids).toContain('dro')
  })

  it('excludes DRO stage when dro-impact component is absent', () => {
    const spec = makeSpec([
      'employment-timeline', 'eligibility-panel', 'benefit-calculation',
    ])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)
    expect(ids).not.toContain('dro')
  })

  it('preserves canonical STAGE_HELP ordering', () => {
    // Agent may return components in any order — stages should follow STAGE_HELP order
    const spec = makeSpec([
      'payment-options', 'eligibility-panel', 'employment-timeline',
      'benefit-calculation', 'service-credit-summary',
    ])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)

    // Canonical order: application-intake, member-verify, service-credit, eligibility,
    // benefit-calc, payment-options, review-certify
    const expectedOrder = [
      'application-intake', 'member-verify', 'service-credit', 'eligibility',
      'benefit-calc', 'payment-options', 'review-certify',
    ]
    expect(ids).toEqual(expectedOrder)
  })

  it('maps multiple components to the same stage without duplication', () => {
    // Both salary-table and benefit-calculation map to benefit-calc
    const spec = makeSpec(['salary-table', 'benefit-calculation'])
    const stages = composeStagesFromAgent(spec)
    const benefitCalcStages = stages.filter(s => s.id === 'benefit-calc')
    expect(benefitCalcStages.length).toBe(1)
  })

  it('ignores unknown component IDs gracefully', () => {
    const spec = makeSpec(['unknown-component', 'eligibility-panel'])
    const stages = composeStagesFromAgent(spec)
    const ids = stages.map(s => s.id)
    // Should still include eligibility + always-present
    expect(ids).toContain('eligibility')
    expect(ids).toContain('application-intake')
    expect(ids).toContain('review-certify')
  })
})
