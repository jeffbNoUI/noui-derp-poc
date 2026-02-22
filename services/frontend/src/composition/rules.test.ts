import { describe, it, expect } from 'vitest'
import { composeWorkspace, validateComposition } from './rules'
import type { Member, ServiceCreditSummary, DRORecord } from '@/types/Member'

// Test fixtures matching demo cases
const case1Member: Member = {
  member_id: '10001',
  first_name: 'Robert',
  last_name: 'Martinez',
  date_of_birth: '1963-06-15',
  hire_date: '1998-09-14',
  tier: 1,
  status: 'A',
  department: 'Public Works',
  position: 'Senior Engineer',
}

const case2Member: Member = {
  member_id: '10002',
  first_name: 'Jennifer',
  last_name: 'Kim',
  date_of_birth: '1970-03-22',
  hire_date: '2005-06-01',
  tier: 2,
  status: 'A',
  department: 'Finance',
  position: 'Budget Analyst III',
}

const case3Member: Member = {
  member_id: '10003',
  first_name: 'Marcus',
  last_name: 'Thompson',
  date_of_birth: '1965-11-08',
  hire_date: '2012-03-15',
  tier: 3,
  status: 'A',
  department: 'Parks & Recreation',
  position: 'Program Manager',
}

const case4Member: Member = {
  ...case1Member,
  member_id: '10004',
}

const purchasedServiceCredit: ServiceCreditSummary = {
  total_service_years: 22.08,
  earned_service_years: 19.58,
  purchased_service_years: 2.50,
  military_service_years: 0,
  total_for_eligibility: 19.58,
  total_for_benefit: 22.08,
}

const droRecord: DRORecord = {
  dro_id: 'DRO-001',
  case_number: '2015CV12345',
  alternate_payee_name: 'Sarah Martinez',
  division_method: 'percentage',
  division_pct: 40,
  marriage_date: '1995-08-20',
  divorce_date: '2014-01-15',
  status: 'active',
}

describe('Workspace Composition', () => {
  it('Case 1: Tier 1, Rule of 75, leave payout — should show leave payout, no DRO', () => {
    const result = composeWorkspace(case1Member, undefined, [], true, 1.0)

    const validation = validateComposition(
      result,
      ['member-banner', 'salary-table', 'benefit-calculation', 'leave-payout', 'payment-options'],
      ['dro-impact', 'early-retirement-reduction']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('Case 2: Tier 2, early retirement, purchased service — should show reduction AND leave payout (hired 2005, before 2010)', () => {
    const result = composeWorkspace(case2Member, purchasedServiceCredit, [], true, 0.70)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'early-retirement-reduction', 'service-credit-summary', 'leave-payout'],
      ['dro-impact']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('Case 3: Tier 3 — should NOT show leave payout (Tier 3), no DRO', () => {
    const result = composeWorkspace(case3Member, undefined, [], true, 0.88)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'early-retirement-reduction'],
      ['dro-impact', 'leave-payout']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('Case 4: Tier 1 with DRO — should show DRO impact panel', () => {
    const result = composeWorkspace(case4Member, undefined, [droRecord], true, 1.0)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'dro-impact', 'leave-payout'],
      ['early-retirement-reduction']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('No retirement date selected — should not show calculation components', () => {
    const result = composeWorkspace(case1Member, undefined, [], false)

    const validation = validateComposition(
      result,
      ['member-banner', 'employment-timeline', 'salary-table', 'leave-payout'],
      ['eligibility-panel', 'benefit-calculation', 'payment-options', 'dro-impact', 'early-retirement-reduction']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })
})
