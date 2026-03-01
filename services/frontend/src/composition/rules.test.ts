import { describe, it, expect } from 'vitest'
import { composeWorkspace, validateComposition } from './rules'
import type { Member, ServiceCreditSummary, DRORecord } from '@/types/Member'

// Test fixtures matching demo cases
const case1Member: Member = {
  member_id: 'COPERA-001',
  first_name: 'Maria',
  last_name: 'Garcia',
  date_of_birth: '1963-07-20',
  hire_date: '1998-01-01',
  division: 'State',
  has_table: 1,
  has_table_name: 'PERA 1',
  status: 'Active',
  department: 'Department of Revenue',
  position: 'Senior Financial Analyst',
}

const case2Member: Member = {
  member_id: 'COPERA-002',
  first_name: 'James',
  last_name: 'Chen',
  date_of_birth: '1968-09-15',
  hire_date: '2005-03-01',
  division: 'School',
  has_table: 6,
  has_table_name: 'PERA 6',
  status: 'Active',
  department: 'Jefferson County Schools',
  position: 'Assistant Principal',
}

const case3Member: Member = {
  member_id: 'COPERA-003',
  first_name: 'Sarah',
  last_name: 'Williams',
  date_of_birth: '1970-04-10',
  hire_date: '2002-07-01',
  division: 'DPS',
  has_table: 10,
  has_table_name: 'DPS 1',
  status: 'Active',
  department: 'Denver Police',
  position: 'Detective Sergeant',
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
  it('Case 1: State PERA 1, Rule of 80, unreduced — no DRO, no early reduction', () => {
    const result = composeWorkspace(case1Member, undefined, [], true, 1.0)

    const validation = validateComposition(
      result,
      ['member-banner', 'salary-table', 'benefit-calculation', 'payment-options', 'annual-increase'],
      ['dro-impact', 'early-retirement-reduction', 'anti-spiking-detail']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('Case 2: School PERA 6, early retirement, anti-spiking — should show reduction and anti-spiking', () => {
    const result = composeWorkspace(case2Member, purchasedServiceCredit, [], true, 0.70, true)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'early-retirement-reduction', 'service-credit-summary', 'anti-spiking-detail'],
      ['dro-impact']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('Case 3: DPS, Rule of 80 — no early reduction, no anti-spiking', () => {
    const result = composeWorkspace(case3Member, undefined, [], true, 1.0)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'annual-increase'],
      ['dro-impact', 'early-retirement-reduction', 'anti-spiking-detail']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('DRO member — should show DRO impact panel', () => {
    const result = composeWorkspace(case1Member, undefined, [droRecord], true, 1.0)

    const validation = validateComposition(
      result,
      ['member-banner', 'benefit-calculation', 'dro-impact'],
      ['early-retirement-reduction']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('No retirement date selected — should not show calculation components', () => {
    const result = composeWorkspace(case1Member, undefined, [], false)

    const validation = validateComposition(
      result,
      ['member-banner', 'employment-timeline', 'salary-table'],
      ['eligibility-panel', 'benefit-calculation', 'payment-options', 'dro-impact', 'early-retirement-reduction', 'annual-increase']
    )
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })
})
