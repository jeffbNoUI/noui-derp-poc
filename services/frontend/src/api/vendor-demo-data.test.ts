/**
 * Vendor demo data verification — validates enrollment queue, IPR calculations, and stats.
 * IPR uses EARNED service years only — purchased service credit is EXCLUDED (C.R.S. §24-51-1201).
 *
 * TOUCHPOINTS for vendor-demo-data.test.ts:
 *   Upstream: vendor-demo-data.ts (fixtures), types/Vendor.ts (interfaces), demo-data.ts (shared member IDs)
 *   Downstream: None (leaf test)
 *   Shared: IPR rate constants ($12.50 pre-Medicare, $6.25 post-Medicare)
 */
import { describe, it, expect } from 'vitest'
import { vendorDemoApi, DEMO_ENROLLMENT_QUEUE, DEMO_IPR_VERIFICATIONS } from './vendor-demo-data'

function expectClose(actual: number, expected: number, label: string, tolerance = 0.01) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected).toFixed(4)})`
  ).toBeLessThanOrEqual(tolerance)
}

describe('Vendor Demo Data Verification', () => {
  describe('Enrollment Queue', () => {
    it('has 6 items total', () => {
      expect(DEMO_ENROLLMENT_QUEUE).toHaveLength(6)
    })

    it('first 3 items are new_retiree type', () => {
      for (let i = 0; i < 3; i++) {
        expect(DEMO_ENROLLMENT_QUEUE[i].enrollment_type).toBe('new_retiree')
      }
    })

    it('last 3 items are coverage_change type', () => {
      for (let i = 3; i < 6; i++) {
        expect(DEMO_ENROLLMENT_QUEUE[i].enrollment_type).toBe('coverage_change')
      }
    })

    it('member IDs 10001-10003 match existing demo case fixtures', () => {
      const ids = DEMO_ENROLLMENT_QUEUE.slice(0, 3).map(e => e.member_id)
      expect(ids).toEqual(['10001', '10002', '10003'])
    })

    it('all items have required fields', () => {
      for (const item of DEMO_ENROLLMENT_QUEUE) {
        expect(item.member_id).toBeTruthy()
        expect(item.member_name).toBeTruthy()
        expect(item.tier).toBeGreaterThanOrEqual(1)
        expect(item.tier).toBeLessThanOrEqual(3)
        expect(item.retirement_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(item.assigned_at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(['new_retiree', 'coverage_change', 'open_enrollment']).toContain(item.enrollment_type)
        expect(['pending_verification', 'verified', 'enrolled', 'declined']).toContain(item.status)
      }
    })
  })

  describe('IPR Calculations', () => {
    it('Case 1 (Robert Martinez): pre-Medicare = 28.75 * $12.50 = $359.38/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10001']
      expect(ipr.earned_service_years).toBe(28.75)
      expectClose(ipr.pre_medicare_monthly, 28.75 * 12.50, 'case1_pre_medicare')
      expectClose(ipr.pre_medicare_monthly, 359.38, 'case1_pre_medicare_exact')
    })

    it('Case 1 (Robert Martinez): post-Medicare = 28.75 * $6.25 = $179.69/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10001']
      expectClose(ipr.post_medicare_monthly, 28.75 * 6.25, 'case1_post_medicare')
      expectClose(ipr.post_medicare_monthly, 179.69, 'case1_post_medicare_exact')
    })

    it('Case 2 (Jennifer Kim): purchased service EXCLUDED — earned_service_years < total', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10002']
      // Jennifer Kim has 21.17 total service years but only 18.17 earned
      // 3.00 years of purchased service is excluded from IPR per C.R.S. §24-51-1201
      expect(ipr.earned_service_years).toBe(18.17)
      // Verify that earned_service_years is less than what total would be
      expect(ipr.earned_service_years).toBeLessThan(21.17) // total_service_years from demo-data.ts
    })

    it('Case 2 (Jennifer Kim): pre-Medicare = 18.17 * $12.50 = $227.13/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10002']
      expectClose(ipr.pre_medicare_monthly, 18.17 * 12.50, 'case2_pre_medicare')
      expectClose(ipr.pre_medicare_monthly, 227.13, 'case2_pre_medicare_exact')
    })

    it('Case 2 (Jennifer Kim): post-Medicare = 18.17 * $6.25 = $113.56/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10002']
      expectClose(ipr.post_medicare_monthly, 18.17 * 6.25, 'case2_post_medicare')
      expectClose(ipr.post_medicare_monthly, 113.56, 'case2_post_medicare_exact')
    })

    it('Case 3 (David Washington): pre-Medicare = 13.58 * $12.50 = $169.75/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10003']
      expect(ipr.earned_service_years).toBe(13.58)
      expectClose(ipr.pre_medicare_monthly, 13.58 * 12.50, 'case3_pre_medicare')
      expectClose(ipr.pre_medicare_monthly, 169.75, 'case3_pre_medicare_exact')
    })

    it('Case 3 (David Washington): post-Medicare = 13.58 * $6.25 = $84.88/mo', () => {
      const ipr = DEMO_IPR_VERIFICATIONS['10003']
      expectClose(ipr.post_medicare_monthly, 13.58 * 6.25, 'case3_post_medicare')
      expectClose(ipr.post_medicare_monthly, 84.88, 'case3_post_medicare_exact')
    })

    it('all IPR verifications have consistent current monthly based on phase', () => {
      for (const [id, ipr] of Object.entries(DEMO_IPR_VERIFICATIONS)) {
        if (ipr.current_phase === 'pre_medicare') {
          expectClose(ipr.monthly_ipr, ipr.pre_medicare_monthly, `${id}_monthly_matches_phase`)
        } else {
          expectClose(ipr.monthly_ipr, ipr.post_medicare_monthly, `${id}_monthly_matches_phase`)
        }
      }
    })
  })

  describe('Stats Aggregation', () => {
    it('stats pending count matches queue filter', async () => {
      const stats = await vendorDemoApi.getStats()
      const pending = DEMO_ENROLLMENT_QUEUE.filter(e => e.status === 'pending_verification').length
      expect(stats.pending_enrollments).toBe(pending)
    })

    it('stats verified count matches queue filter', async () => {
      const stats = await vendorDemoApi.getStats()
      const verified = DEMO_ENROLLMENT_QUEUE.filter(e => e.status === 'verified').length
      expect(stats.verified_this_month).toBe(verified)
    })

    it('stats total active enrollees is non-zero', async () => {
      const stats = await vendorDemoApi.getStats()
      expect(stats.total_active_enrollees).toBeGreaterThan(0)
    })

    it('stats avg processing days is reasonable', async () => {
      const stats = await vendorDemoApi.getStats()
      expect(stats.avg_processing_days).toBeGreaterThan(0)
      expect(stats.avg_processing_days).toBeLessThan(30)
    })
  })

  describe('API Methods', () => {
    it('getQueue returns all 6 items', async () => {
      const queue = await vendorDemoApi.getQueue()
      expect(queue).toHaveLength(6)
    })

    it('getIPRVerification returns correct member', async () => {
      const ipr = await vendorDemoApi.getIPRVerification('10001')
      expect(ipr.member_id).toBe('10001')
      expect(ipr.member_name).toBe('Robert Martinez')
    })

    it('getIPRVerification rejects unknown member ID', async () => {
      await expect(vendorDemoApi.getIPRVerification('99999')).rejects.toThrow()
    })
  })
})
