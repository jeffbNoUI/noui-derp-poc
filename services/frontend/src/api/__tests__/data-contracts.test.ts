/**
 * Data contract tests — verifies demo data fixtures conform to expected shapes.
 * Ensures all member records, benefit results, eligibility, refund, and death data
 * have required fields and cross-module consistency.
 * Consumed by: CI test suite
 * Depends on: demo-data.ts, portal-demo-data.ts, refund-demo-data.ts, death-survivor-demo-data.ts, constants.ts
 *
 * TOUCHPOINTS:
 *   Upstream: demo-data.ts, portal-demo-data.ts, refund-demo-data.ts, death-survivor-demo-data.ts
 *   Downstream: None (leaf test)
 *   Shared: DEMO_CASES, DEMO_REFUND_CASES, DEMO_DEATH_CASES (constants.ts)
 */
import { describe, it, expect } from 'vitest'
import { demoApi } from '@/api/demo-data'
import { portalDemoApi } from '@/api/portal-demo-data'
import { refundDemoApi, DEMO_REFUND_MEMBERS, DEMO_REFUND_CALCULATIONS } from '@/api/refund-demo-data'
import {
  DEMO_DEATH_RECORDS, DEMO_DEATH_SUMMARIES,
  case9Member, case10Member,
} from '@/api/death-survivor-demo-data'
import { DEMO_CASES, DEMO_REFUND_CASES, DEMO_DEATH_CASES } from '@/lib/constants'

describe('Data Contracts', () => {

  describe('Retirement case members — required fields', () => {
    const memberIds = DEMO_CASES.map(c => c.id)

    for (const id of memberIds) {
      it(`member ${id} has all required fields`, async () => {
        const m = await demoApi.getMember(id)
        // Case 10004 (DRO variant) shares the same underlying member as 10001
        if (id === '10004') {
          expect(m.member_id).toBe('10001')
        } else {
          expect(m.member_id).toBe(id)
        }
        expect(m.first_name).toBeTruthy()
        expect(m.last_name).toBeTruthy()
        expect([1, 2, 3]).toContain(m.tier)
        expect(m.hire_date).toBeTruthy()
        expect(m.date_of_birth).toBeTruthy()
        expect(m.status).toBeTruthy()
        // Dates should be valid ISO format
        expect(new Date(m.hire_date).toString()).not.toBe('Invalid Date')
        expect(new Date(m.date_of_birth).toString()).not.toBe('Invalid Date')
      })
    }
  })

  describe('Retirement case benefits — positive amounts', () => {
    const caseDates: [string, string][] = [
      ['10001', '2026-04-01'],
      ['10002', '2026-05-01'],
      ['10003', '2026-04-01'],
      ['10004', '2026-04-01'],
    ]

    for (const [id, date] of caseDates) {
      it(`benefit for ${id} has monthly_benefit > 0`, async () => {
        const b = await demoApi.calculateBenefit(id, date)
        expect(b.net_monthly_benefit).toBeGreaterThan(0)
        expect(b.ams).toBeGreaterThan(0)
        expect(b.service_years_for_benefit).toBeGreaterThan(0)
        expect(b.multiplier).toBeGreaterThan(0)
        expect(b.reduction_factor).toBeGreaterThan(0)
        expect(b.reduction_factor).toBeLessThanOrEqual(1.0)
      })
    }
  })

  describe('Retirement case eligibility — retirement type strings', () => {
    const caseDates: [string, string][] = [
      ['10001', '2026-04-01'],
      ['10002', '2026-05-01'],
      ['10003', '2026-04-01'],
      ['10004', '2026-04-01'],
    ]

    const validTypes = ['normal', 'rule_of_75', 'rule_of_85', 'early', 'deferred']

    for (const [id, date] of caseDates) {
      it(`eligibility for ${id} has valid retirement_type`, async () => {
        const e = await demoApi.evaluateEligibility(id, date)
        expect(e.eligible).toBe(true)
        expect(validTypes).toContain(e.retirement_type)
        // Case 10004 (DRO variant) shares eligibility with 10001
        if (id === '10004') {
          expect(e.member_id).toBe('10001')
        } else {
          expect(e.member_id).toBe(id)
        }
        expect(e.tier).toBeGreaterThanOrEqual(1)
        expect(e.tier).toBeLessThanOrEqual(3)
      })
    }
  })

  describe('Refund calculations — positive refund amounts', () => {
    it('Case 7 refund has total_refund > 0', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expect(r.contributions.total_contributions).toBeGreaterThan(0)
      expect(r.interest.total_interest).toBeGreaterThan(0)
      // gross_refund is a top-level field on RefundCalculation, not nested under tax_withholding
      expect(r.gross_refund).toBeGreaterThan(0)
      expect(r.tax_options.length).toBeGreaterThan(0)
    })

    it('Case 8 refund has total_refund > 0', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      expect(r.contributions.total_contributions).toBeGreaterThan(0)
      expect(r.interest.total_interest).toBeGreaterThan(0)
      // gross_refund is a top-level field on RefundCalculation, not nested under tax_withholding
      expect(r.gross_refund).toBeGreaterThan(0)
      expect(r.tax_options.length).toBeGreaterThan(0)
    })
  })

  describe('Refund members — required fields', () => {
    for (const caseId of Object.keys(DEMO_REFUND_MEMBERS)) {
      it(`refund member ${caseId} has required fields`, () => {
        const m = DEMO_REFUND_MEMBERS[caseId]
        expect(m.member_id).toBe(caseId)
        expect(m.first_name).toBeTruthy()
        expect(m.last_name).toBeTruthy()
        expect([1, 2, 3]).toContain(m.tier)
        expect(m.status).toBe('Terminated')
        expect(m.termination_date).toBeTruthy()
      })
    }
  })

  describe('Death records — valid status strings', () => {
    for (const caseId of Object.keys(DEMO_DEATH_RECORDS)) {
      it(`death record ${caseId} has valid structure`, () => {
        const d = DEMO_DEATH_RECORDS[caseId]
        expect(d.member_id).toBe(caseId)
        expect(d.has_death_record).toBe(true)
        expect(d.death_record).toBeDefined()
        expect(d.death_record!.death_date).toBeTruthy()
        expect(new Date(d.death_record!.death_date).toString()).not.toBe('Invalid Date')
        const validStatuses = ['REPORTED', 'VERIFIED', 'PROCESSING', 'CLOSED']
        expect(validStatuses).toContain(d.death_record!.status)
      })
    }
  })

  describe('Death processing summaries — required fields', () => {
    for (const caseId of Object.keys(DEMO_DEATH_SUMMARIES)) {
      it(`death summary ${caseId} has notification data`, () => {
        const s = DEMO_DEATH_SUMMARIES[caseId]
        expect(s.member_id).toBe(caseId)
        expect(s.notification).toBeDefined()
        expect(typeof s.notification.benefit_suspended).toBe('boolean')
        expect(typeof s.notification.certificate_required).toBe('boolean')
        expect(s.notification.status_transition).toBeTruthy()
      })
    }
  })

  describe('Cross-module consistency', () => {
    it('DEMO_CASES IDs match demoApi member IDs', async () => {
      for (const c of DEMO_CASES) {
        const m = await demoApi.getMember(c.id)
        // Case 10004 (DRO variant) shares the same underlying member as 10001
        if (c.id === '10004') {
          expect(m.member_id).toBe('10001')
        } else {
          expect(m.member_id).toBe(c.id)
        }
        expect(m.tier).toBe(c.tier)
      }
    })

    it('DEMO_CASES names match demoApi member names', async () => {
      for (const c of DEMO_CASES) {
        const m = await demoApi.getMember(c.id)
        // Case 4 (10004) shares the same name as Case 1
        const expectedFirst = c.name.split(' ')[0]
        expect(m.first_name).toBe(expectedFirst)
      }
    })

    it('DEMO_REFUND_CASES IDs exist in refund demo data', () => {
      for (const c of DEMO_REFUND_CASES) {
        expect(DEMO_REFUND_MEMBERS[c.id]).toBeDefined()
        expect(DEMO_REFUND_CALCULATIONS[c.id]).toBeDefined()
      }
    })

    it('DEMO_DEATH_CASES IDs exist in death demo data', () => {
      for (const c of DEMO_DEATH_CASES) {
        expect(DEMO_DEATH_RECORDS[c.id]).toBeDefined()
        expect(DEMO_DEATH_SUMMARIES[c.id]).toBeDefined()
      }
    })

    it('portal demo data covers all 4 retirement cases', async () => {
      for (const c of DEMO_CASES) {
        // Should not throw — returns null or app
        const app = await portalDemoApi.getApplication(c.id)
        // Type check: null or object
        expect(app === null || typeof app === 'object').toBe(true)
      }
    })

    it('death case members exist', () => {
      expect(case9Member.member_id).toBe('10009')
      expect(case10Member.member_id).toBe('10010')
    })

    it('refund tiers match DEMO_REFUND_CASES tiers', () => {
      for (const c of DEMO_REFUND_CASES) {
        const m = DEMO_REFUND_MEMBERS[c.id]
        expect(m.tier).toBe(c.tier)
      }
    })
  })
})
