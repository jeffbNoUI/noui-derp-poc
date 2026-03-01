/**
 * Error path tests — verifies graceful handling of invalid inputs across demo APIs.
 * Tests unknown member IDs, null/undefined values to fmt(), invalid tier lookups, etc.
 * Consumed by: CI test suite
 * Depends on: demo-data.ts (demoApi), refund-demo-data.ts (refundDemoApi),
 *   death-survivor-demo-data.ts (deathSurvivorDemoApi), constants.ts (fmt), theme/legacy.ts (tierMeta)
 *
 * TOUCHPOINTS:
 *   Upstream: demo-data.ts, refund-demo-data.ts, death-survivor-demo-data.ts, constants.ts, theme/legacy.ts
 *   Downstream: None (leaf test)
 *   Shared: None
 */
import { describe, it, expect } from 'vitest'
import { demoApi } from '@/api/demo-data'
import { refundDemoApi } from '@/api/refund-demo-data'
import { deathSurvivorDemoApi } from '@/api/death-survivor-demo-data'
import { fmt } from '@/lib/constants'
import { tierMeta } from '@/theme'

describe('Error Handling', () => {

  describe('demoApi with unknown member IDs', () => {
    it('getMember rejects with descriptive error for unknown ID', async () => {
      await expect(demoApi.getMember('99999')).rejects.toThrow(/99999/)
    })

    it('evaluateEligibility rejects for unknown ID', async () => {
      await expect(demoApi.evaluateEligibility('99999', '2026-04-01')).rejects.toThrow()
    })

    it('calculateBenefit rejects for unknown ID', async () => {
      await expect(demoApi.calculateBenefit('99999', '2026-04-01')).rejects.toThrow()
    })

    it('calculatePaymentOptions rejects for unknown ID', async () => {
      await expect(demoApi.calculatePaymentOptions('99999', '2026-04-01')).rejects.toThrow()
    })

    it('calculateDRO rejects for unknown member', async () => {
      await expect(demoApi.calculateDRO('99999')).rejects.toThrow()
    })

    it('getPurchaseQuote rejects for unknown member', async () => {
      await expect(demoApi.getPurchaseQuote('99999')).rejects.toThrow()
    })

    it('getApplicationIntake rejects for unknown ID', async () => {
      await expect(demoApi.getApplicationIntake('99999')).rejects.toThrow()
    })

    it('getEmployment returns empty array for unknown ID', async () => {
      const events = await demoApi.getEmployment('99999')
      expect(events).toEqual([])
    })

    it('getServiceCredit returns zeros for unknown ID', async () => {
      const sc = await demoApi.getServiceCredit('99999')
      expect(sc.total_service_years).toBe(0)
      expect(sc.earned_service_years).toBe(0)
    })

    it('getBeneficiaries returns empty array for unknown ID', async () => {
      const b = await demoApi.getBeneficiaries('99999')
      expect(b).toEqual([])
    })

    it('getDROs returns empty array for unknown ID', async () => {
      const dros = await demoApi.getDROs('99999')
      expect(dros).toEqual([])
    })

    it('calculateScenarios returns empty array for unknown ID', async () => {
      const scenarios = await demoApi.calculateScenarios('99999', ['2026-04-01'])
      expect(scenarios).toEqual([])
    })
  })

  describe('refundDemoApi with unknown member IDs', () => {
    it('getRefundMember rejects for unknown ID', async () => {
      await expect(refundDemoApi.getRefundMember('99999')).rejects.toThrow(/99999/)
    })

    it('calculateRefund rejects for unknown ID', async () => {
      await expect(refundDemoApi.calculateRefund('99999')).rejects.toThrow()
    })
  })

  describe('deathSurvivorDemoApi with unknown member IDs', () => {
    it('getDeathStatus returns has_death_record=false for unknown ID', async () => {
      const status = await deathSurvivorDemoApi.getDeathStatus('99999')
      expect(status.has_death_record).toBe(false)
      expect(status.member_id).toBe('99999')
    })
  })

  describe('fmt() with edge cases', () => {
    it('returns dash for null', () => {
      expect(fmt(null)).toBe('\u2014')
    })

    it('returns dash for undefined', () => {
      expect(fmt(undefined)).toBe('\u2014')
    })

    it('formats zero correctly', () => {
      expect(fmt(0)).toBe('$0.00')
    })

    it('formats positive number with commas', () => {
      expect(fmt(6117.68)).toBe('$6,117.68')
    })

    it('formats large number correctly', () => {
      expect(fmt(1000000)).toBe('$1,000,000.00')
    })

    it('formats negative number', () => {
      const result = fmt(-500)
      expect(result).toContain('500.00')
    })

    it('formats number with more than 2 decimal places (rounds to 2)', () => {
      const result = fmt(123.456)
      expect(result).toBe('$123.46')
    })

    it('formats number with 1 decimal place (pads to 2)', () => {
      expect(fmt(100.5)).toBe('$100.50')
    })

    it('formats integer (adds .00)', () => {
      expect(fmt(5000)).toBe('$5,000.00')
    })
  })

  describe('divisionMeta with edge cases', () => {
    it('State division has correct properties', () => {
      const t = tierMeta['State']
      expect(t).toBeDefined()
      expect(t.label).toBe('State Division')
      expect(t.color).toBeTruthy()
      expect(t.muted).toBeTruthy()
    })

    it('School division has correct properties', () => {
      const t = tierMeta['School']
      expect(t).toBeDefined()
      expect(t.label).toBe('School Division')
    })

    it('DPS division has correct properties', () => {
      const t = tierMeta['DPS']
      expect(t).toBeDefined()
      expect(t.label).toBe('DPS Division')
    })

    it('unknown division is undefined', () => {
      expect(tierMeta['Unknown']).toBeUndefined()
    })

    it('numeric key is undefined (no longer tier-based)', () => {
      expect(tierMeta[0 as unknown as string]).toBeUndefined()
    })
  })

  describe('demoApi.saveElection smoke test', () => {
    it('returns success response for valid election', async () => {
      const result = await demoApi.saveElection({
        member_id: '10001',
        retirement_date: '2026-04-01',
        payment_option: 'j&s_75',
        monthly_benefit: 5597.68,
        gross_benefit: 6117.68,
        reduction_factor: 1.0,
      })
      expect(result.member_id).toBe('10001')
      expect(result.status).toBe('IN_REVIEW')
      expect(result.case_id).toBeDefined()
    })
  })
})
