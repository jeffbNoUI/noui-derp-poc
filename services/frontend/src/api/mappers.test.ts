/**
 * Tests for Go→TS response mappers.
 * Each test uses a sample Go response payload and verifies the mapped output
 * matches the expected TypeScript type shape.
 *
 * TOUCHPOINTS:
 *   Upstream: Go connector/intelligence JSON response contracts
 *   Downstream: client.ts liveApi (consumers of mappers)
 *   Shared: Member.ts types
 */
import { describe, it, expect } from 'vitest'
import {
  mapMember, mapBeneficiaries, mapServiceCredit, mapDRORecords,
  mapEligibility, mapBenefit, mapPaymentOptions, mapScenarios,
  mapDROResult, buildSyntheticIntake, fromBackendId,
} from './mappers'
import { toBackendId } from './client'

describe('toBackendId', () => {
  it('maps demo case short IDs to database format', () => {
    expect(toBackendId('10001')).toBe('M-100001')
    expect(toBackendId('10002')).toBe('M-100002')
    expect(toBackendId('10003')).toBe('M-100003')
    expect(toBackendId('10004')).toBe('M-100001') // DRO variant
  })

  it('pads generic numeric IDs to 6 digits', () => {
    expect(toBackendId('100001')).toBe('M-100001')
    expect(toBackendId('1')).toBe('M-000001')
  })

  it('passes through already-prefixed IDs', () => {
    expect(toBackendId('M-100001')).toBe('M-100001')
  })
})

describe('fromBackendId', () => {
  it('strips M- prefix and leading zeros', () => {
    expect(fromBackendId('M-100001')).toBe('100001')
    expect(fromBackendId('M-010001')).toBe('10001')
    expect(fromBackendId('M-000001')).toBe('1')
  })

  it('passes through unprefixed IDs', () => {
    expect(fromBackendId('10001')).toBe('10001')
  })
})

describe('mapMember', () => {
  it('renames status_code to status and formats dates', () => {
    const goResp = {
      member_id: '10001',
      first_name: 'Robert',
      last_name: 'Martinez',
      date_of_birth: '1963-03-08T00:00:00Z',
      hire_date: '1997-06-15T00:00:00Z',
      tier: 1,
      status_code: 'ACTIVE',
      department: 'Public Works',
      position: 'Senior Engineer',
      annual_salary: 128000,
      termination_date: null,
    }
    const m = mapMember(goResp)
    expect(m.status).toBe('ACTIVE')
    expect(m.date_of_birth).toBe('1963-03-08')
    expect(m.hire_date).toBe('1997-06-15')
    expect(m.termination_date).toBeUndefined()
    expect(m.member_id).toBe('10001')
    expect(m.tier).toBe(1)
  })

  it('handles already-formatted date strings', () => {
    const m = mapMember({ member_id: '1', date_of_birth: '1970-01-01', hire_date: '2000-06-01', status_code: 'A' })
    expect(m.date_of_birth).toBe('1970-01-01')
  })

  it('strips M- prefix from backend member_id', () => {
    const m = mapMember({ member_id: 'M-010001', first_name: 'Test', status_code: 'A' })
    expect(m.member_id).toBe('10001')
  })
})

describe('mapBeneficiaries', () => {
  it('extracts from wrapper and combines first/last name', () => {
    const goResp = {
      member_id: '10003',
      beneficiaries: [
        {
          beneficiary_id: 1,
          member_id: '10003',
          first_name: 'Maria',
          last_name: 'Davis',
          relationship: 'Spouse',
          allocation_percentage: 100,
          date_of_birth: '1970-05-15T00:00:00Z',
        },
      ],
    }
    const result = mapBeneficiaries(goResp)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Maria Davis')
    expect(result[0].allocation_pct).toBe(100)
    expect(result[0].date_of_birth).toBe('1970-05-15')
  })
})

describe('mapServiceCredit', () => {
  it('extracts summary and renames fields', () => {
    const goResp = {
      member_id: '10002',
      records: [],
      summary: {
        earned_years: 15.5,
        purchased_years: 3.0,
        military_years: 0,
        leave_years: 0,
        total_for_benefit: 18.5,
        total_for_eligibility: 15.5,
        total_for_ipr: 15.5,
      },
    }
    const s = mapServiceCredit(goResp)
    expect(s.earned_service_years).toBe(15.5)
    expect(s.purchased_service_years).toBe(3.0)
    expect(s.military_service_years).toBe(0)
    expect(s.total_service_years).toBe(18.5)
    expect(s.total_for_benefit).toBe(18.5)
    expect(s.total_for_eligibility).toBe(15.5)
  })
})

describe('mapDRORecords', () => {
  it('extracts dros array, coerces dro_id to string, renames status_code', () => {
    const goResp = {
      member_id: '10003',
      has_dro: true,
      dro_count: 1,
      dros: [
        {
          dro_id: 301,
          case_number: '2018-DR-4567',
          alternate_payee_name: 'Jane Davis',
          division_method: 'TIME_RULE',
          division_percentage: 50,
          marriage_date: '1998-06-20T00:00:00Z',
          divorce_date: '2018-03-15T00:00:00Z',
          status_code: 'APPROVED',
        },
      ],
    }
    const result = mapDRORecords(goResp)
    expect(result).toHaveLength(1)
    expect(result[0].dro_id).toBe('301')
    expect(result[0].status).toBe('APPROVED')
    expect(result[0].marriage_date).toBe('1998-06-20')
    expect(result[0].division_pct).toBe(50)
  })

  it('returns empty array when no dros', () => {
    const goResp = { member_id: '10001', has_dro: false, dro_count: 0, dros: [] }
    expect(mapDRORecords(goResp)).toEqual([])
  })
})

describe('mapEligibility', () => {
  it('derives eligible=true and builds conditions from flags', () => {
    const goResp = {
      member_id: '10001',
      tier: 1,
      age_at_retirement: 63.05,
      total_service_years: 28.75,
      earned_service_years: 28.75,
      vested: true,
      normal_retirement_eligible: false,
      rule_of_n_applicable: '75',
      rule_of_n_sum: 91.8,
      rule_of_n_qualifies: true,
      rule_of_n_min_age_met: true,
      early_retirement_eligible: true,
      early_retirement_reduction_percent: 0,
      reduction_factor: 1.0,
      years_under_65: 2,
      leave_payout_eligible: true,
      retirement_type: 'rule_of_75',
    }
    const result = mapEligibility(goResp, '2026-04-01')
    expect(result.eligible).toBe(true)
    expect(result.retirement_type).toBe('rule_of_75')
    expect(result.rule_of_n_value).toBe(91.8)
    expect(result.rule_of_n_threshold).toBe(75)
    expect(result.reduction_factor).toBe(1.0)
    expect(result.conditions_met).toContain('Vested (5+ years)')
    expect(result.conditions_met).toContain('Rule of 75')
    expect(result.audit_trail.length).toBeGreaterThan(0)
    expect(result.retirement_date).toBe('2026-04-01')
  })

  it('derives eligible=false for deferred retirement', () => {
    const goResp = {
      member_id: '10004',
      tier: 3,
      age_at_retirement: 30,
      vested: true,
      retirement_type: 'deferred',
      reduction_factor: 1,
    }
    const result = mapEligibility(goResp, '2026-01-01')
    expect(result.eligible).toBe(false)
  })
})

describe('mapBenefit', () => {
  it('extracts AMS from nested object and computes amounts', () => {
    const goResp = {
      member_id: '10001',
      retirement_date: '2026-04-01',
      tier: 1,
      retirement_type: 'rule_of_75',
      ams_calculation: {
        window_months: 36,
        window_start: '2023-04-01',
        window_end: '2026-03-31',
        ams: 10639.45,
      },
      multiplier: 0.02,
      service_years_for_benefit: 28.75,
      formula: '$10,639.45 × 2.0% × 28.75',
      unreduced_monthly_benefit: 6117.68,
      reduction_percent: 0,
      reduction_factor: 1.0,
      reduced_monthly_benefit: 6117.68,
      maximum_monthly_benefit: 6117.68,
      ipr: {
        service_years_for_ipr: 28.75,
        pre_medicare_rate: 12.51,
        post_medicare_rate: 4.54,
        pre_medicare_monthly: 359.66,
        post_medicare_monthly: 130.52,
      },
      death_benefit: {
        retirement_type: 'rule_of_75',
        tier: 1,
        base_amount: 5000,
        lump_sum_amount: 5000,
        installment_50: 100,
        installment_100: 50,
      },
    }
    const b = mapBenefit(goResp)
    expect(b.ams).toBe(10639.45)
    expect(b.ams_window_months).toBe(36)
    expect(b.net_monthly_benefit).toBe(6117.68)
    expect(b.multiplier).toBe(0.02)
    expect(b.service_years_for_benefit).toBe(28.75)
    expect(b.reduction_factor).toBe(1.0)
    expect(b.ipr).toBeDefined()
    expect(b.ipr!.monthly_amount).toBe(359.66)
    expect(b.death_benefit).toBeDefined()
    expect(b.death_benefit!.amount).toBe(5000)
    expect(b.audit_trail.length).toBeGreaterThan(0)
  })
})

describe('mapPaymentOptions', () => {
  it('converts named options to array', () => {
    const goResp = {
      payment_options: {
        member_id: '10001',
        base_benefit: 6117.68,
        maximum: { name: 'Maximum', factor: 1.0, monthly_benefit: 6117.68 },
        joint_survivor_100: { name: 'J&S 100%', factor: 0.88, monthly_benefit: 5383.56, survivor_benefit: 5383.56 },
        joint_survivor_75: { name: 'J&S 75%', factor: 0.92, monthly_benefit: 5628.27, survivor_benefit: 4221.20 },
        joint_survivor_50: { name: 'J&S 50%', factor: 0.95, monthly_benefit: 5811.80, survivor_benefit: 2905.90 },
      },
      dro: null,
    }
    const result = mapPaymentOptions(goResp)
    expect(result.base_monthly_benefit).toBe(6117.68)
    expect(result.options).toHaveLength(4)
    expect(result.options[0].option_type).toBe('maximum')
    expect(result.options[0].monthly_amount).toBe(6117.68)
    expect(result.options[1].option_type).toBe('joint_survivor_100')
    expect(result.options[1].survivor_pct).toBe(100)
  })
})

describe('mapScenarios', () => {
  it('flattens nested eligibility+benefit into ScenarioResult[]', () => {
    const goResp = {
      member_id: '10001',
      scenarios: [
        {
          retirement_date: '2026-04-01',
          eligibility: {
            retirement_type: 'rule_of_75',
            age_at_retirement: 63.05,
            reduction_factor: 1.0,
          },
          benefit: {
            maximum_monthly_benefit: 6117.68,
          },
        },
        {
          retirement_date: '2028-03-08',
          eligibility: {
            retirement_type: 'normal',
            age_at_retirement: 65.0,
            reduction_factor: 1.0,
          },
          benefit: {
            maximum_monthly_benefit: 6117.68,
          },
        },
      ],
    }
    const result = mapScenarios(goResp)
    expect(result).toHaveLength(2)
    expect(result[0].eligible).toBe(true)
    expect(result[0].net_monthly_benefit).toBe(6117.68)
    expect(result[0].annual_benefit).toBeCloseTo(6117.68 * 12)
    expect(result[1].retirement_type).toBe('normal')
  })

  it('marks not_eligible scenarios as ineligible', () => {
    const goResp = {
      scenarios: [{
        retirement_date: '2024-01-01',
        eligibility: { retirement_type: 'not_eligible', age_at_retirement: 50, reduction_factor: 1 },
        benefit: null,
      }],
    }
    const result = mapScenarios(goResp)
    expect(result[0].eligible).toBe(false)
    expect(result[0].net_monthly_benefit).toBe(0)
  })
})

describe('mapDROResult', () => {
  it('extracts from dro_calculation wrapper and renames fields', () => {
    const goResp = {
      dro_calculation: {
        member_id: '10003',
        total_service_years: 25.0,
        marriage_start: '1998-06-20',
        marriage_end: '2018-03-15',
        service_during_marriage_years: 19.74,
        marital_fraction: 0.7896,
        maximum_benefit: 4500.00,
        marital_share_of_benefit: 3553.20,
        dro_percentage: 50,
        alternate_payee_share: 1776.60,
        member_remaining_benefit: 2723.40,
        alternate_payee_name: 'Jane Davis',
      },
      payment_options: {},
      benefit: {},
    }
    const r = mapDROResult(goResp)
    expect(r.marital_service_years).toBe(19.74)
    expect(r.marital_fraction).toBe(0.7896)
    expect(r.alternate_payee_amount).toBe(1776.60)
    expect(r.member_net_after_dro).toBe(2723.40)
    expect(r.member_gross_benefit).toBe(4500.00)
    expect(r.alternate_payee_name).toBe('Jane Davis')
    expect(r.audit_trail).toHaveLength(1)
  })
})

describe('buildSyntheticIntake', () => {
  it('returns sensible defaults', () => {
    const member = {
      member_id: '10001', first_name: 'Robert', last_name: 'Martinez',
      date_of_birth: '1963-03-08', hire_date: '1997-06-15', tier: 1,
      status: 'Active', department: 'PW', position: 'Eng',
    }
    const intake = buildSyntheticIntake(member)
    expect(intake.package_complete).toBe(false)
    expect(intake.documents).toEqual([])
    expect(intake.notarization_confirmed).toBe(false)
  })
})
