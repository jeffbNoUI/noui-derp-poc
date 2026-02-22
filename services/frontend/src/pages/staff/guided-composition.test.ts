/**
 * Stage composition tests — verifies correct stage lists for all 4 demo cases.
 * Stage 7 (DRO) should only appear for Case 4 (Robert Martinez + DRO).
 *
 * TOUCHPOINTS for guided-composition:
 *   Upstream: guided-help.ts (STAGE_HELP), Member types (ServiceCreditSummary, DRORecord)
 *   Downstream: GuidedWorkspace (consumes composeStages/composeStageIds)
 *   Shared: none
 */
import { describe, it, expect } from 'vitest'
import { composeStages, composeStageIds } from './guided-composition'
import type { ServiceCreditSummary, DRORecord } from '@/types/Member'

// ─── Fixtures ────────────────────────────────────────────────

const case1SC: ServiceCreditSummary = {
  total_service_years: 28.75,
  earned_service_years: 28.75,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 28.75,
  total_for_benefit: 28.75,
}

const case2SC: ServiceCreditSummary = {
  total_service_years: 23.92,
  earned_service_years: 20.92,
  purchased_service_years: 3.0,
  military_service_years: 0,
  total_for_eligibility: 20.92,
  total_for_benefit: 23.92,
}

const case3SC: ServiceCreditSummary = {
  total_service_years: 14.75,
  earned_service_years: 14.75,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 14.75,
  total_for_benefit: 14.75,
}

const case4SC: ServiceCreditSummary = {
  ...case1SC,
}

const case4DROs: DRORecord[] = [
  {
    dro_id: 'DRO-001',
    case_number: '2018-DR-4521',
    alternate_payee_name: 'Maria Martinez',
    division_method: 'marital_fraction',
    marriage_date: '1995-06-10',
    divorce_date: '2018-03-15',
    status: 'Active',
  },
]

const ALL_BASE_STAGES = [
  'member-verify',
  'service-credit',
  'eligibility',
  'benefit-calc',
  'payment-options',
  'supplemental',
  'review-certify',
]

const ALL_STAGES_WITH_DRO = [
  'member-verify',
  'service-credit',
  'eligibility',
  'benefit-calc',
  'payment-options',
  'supplemental',
  'dro',
  'review-certify',
]

// ─── Tests ───────────────────────────────────────────────────

describe('guided-composition', () => {
  describe('composeStageIds', () => {
    it('Case 1 (Robert Martinez) — 7 stages, no DRO', () => {
      const ids = composeStageIds(case1SC, undefined)
      expect(ids).toEqual(ALL_BASE_STAGES)
      expect(ids).not.toContain('dro')
    })

    it('Case 2 (Jennifer Kim) — 7 stages, no DRO, has purchased service', () => {
      const ids = composeStageIds(case2SC, undefined)
      expect(ids).toEqual(ALL_BASE_STAGES)
      expect(ids).not.toContain('dro')
    })

    it('Case 3 (David Washington) — 7 stages, no DRO', () => {
      const ids = composeStageIds(case3SC, undefined)
      expect(ids).toEqual(ALL_BASE_STAGES)
      expect(ids).not.toContain('dro')
    })

    it('Case 4 (Robert Martinez + DRO) — 8 stages, includes DRO', () => {
      const ids = composeStageIds(case4SC, case4DROs)
      expect(ids).toEqual(ALL_STAGES_WITH_DRO)
      expect(ids).toContain('dro')
    })

    it('DRO stage excluded when dros is empty array', () => {
      const ids = composeStageIds(case1SC, [])
      expect(ids).toEqual(ALL_BASE_STAGES)
    })

    it('DRO stage excluded when dros is undefined', () => {
      const ids = composeStageIds(case1SC, undefined)
      expect(ids).toEqual(ALL_BASE_STAGES)
    })
  })

  describe('composeStages', () => {
    it('returns full StageHelp objects with correct IDs', () => {
      const stages = composeStages(case1SC, undefined)
      expect(stages).toHaveLength(7)
      expect(stages.map(s => s.id)).toEqual(ALL_BASE_STAGES)
      // Each stage has required help fields
      for (const stage of stages) {
        expect(stage.title).toBeTruthy()
        expect(stage.icon).toBeTruthy()
        expect(stage.onboarding).toBeTruthy()
        expect(stage.confirmLabel).toBeTruthy()
        expect(stage.rules.length).toBeGreaterThan(0)
        expect(stage.checklist.length).toBeGreaterThan(0)
      }
    })

    it('DRO stage has conditional function', () => {
      const stages = composeStages(case4SC, case4DROs)
      const droStage = stages.find(s => s.id === 'dro')
      expect(droStage).toBeDefined()
      expect(droStage!.conditional).toBeDefined()
    })

    it('non-DRO stages have no conditional function', () => {
      const stages = composeStages(case1SC, undefined)
      for (const stage of stages) {
        expect(stage.conditional).toBeUndefined()
      }
    })
  })
})
