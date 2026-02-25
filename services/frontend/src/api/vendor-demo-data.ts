/**
 * Vendor portal demo data fixtures — enrollment queue, IPR verifications, dashboard stats.
 * IPR uses EARNED service years only — purchased service credit is EXCLUDED (RMC §18-412).
 * Pre-Medicare rate: earned_years * $12.50/month; Post-Medicare rate: earned_years * $6.25/month.
 * Consumed by: VendorDashboard, VendorMemberDetail, vendor-demo-data.test.ts
 * Depends on: Vendor.ts types, demo-data.ts member fixtures (shared member IDs 10001-10004)
 */
import type { EnrollmentQueueItem, IPRVerification, VendorDashboardStats } from '@/types/Vendor'

// ─── IPR Rate Constants ──────────────────────────────────────────────────────
// Source: RMC §18-412 — Insurance Premium Reimbursement
const IPR_PRE_MEDICARE_RATE = 12.50 // $/month per earned service year
const IPR_POST_MEDICARE_RATE = 6.25 // $/month per earned service year

// ─── Enrollment Queue ────────────────────────────────────────────────────────
// 6 items: Cases 1-3 as new_retiree, 3 coverage_change items

export const DEMO_ENROLLMENT_QUEUE: EnrollmentQueueItem[] = [
  // Case 1: Robert Martinez — Tier 1, Rule of 75, 28.75 earned years
  {
    member_id: '10001',
    member_name: 'Robert Martinez',
    tier: 1,
    retirement_date: '2026-04-01',
    enrollment_type: 'new_retiree',
    status: 'pending_verification',
    ipr_eligible: true,
    ipr_monthly: Math.round(28.75 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $359.38
    assigned_at: '2026-03-15',
  },
  // Case 2: Jennifer Kim — Tier 2, Early Retirement, 18.17 earned years (purchased service excluded)
  {
    member_id: '10002',
    member_name: 'Jennifer Kim',
    tier: 2,
    retirement_date: '2026-05-01',
    enrollment_type: 'new_retiree',
    status: 'pending_verification',
    ipr_eligible: true,
    // Purchased 3.00 years excluded from IPR — only 18.17 earned years count
    ipr_monthly: Math.round(18.17 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $227.13
    assigned_at: '2026-04-10',
  },
  // Case 3: David Washington — Tier 3, Early Retirement, 13.58 earned years
  {
    member_id: '10003',
    member_name: 'David Washington',
    tier: 3,
    retirement_date: '2026-04-01',
    enrollment_type: 'new_retiree',
    status: 'verified',
    ipr_eligible: true,
    ipr_monthly: Math.round(13.58 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $169.75
    assigned_at: '2026-03-18',
  },
  // Coverage change items
  {
    member_id: '10004',
    member_name: 'Robert Martinez (DRO)',
    tier: 1,
    retirement_date: '2026-04-01',
    enrollment_type: 'coverage_change',
    status: 'enrolled',
    ipr_eligible: true,
    ipr_monthly: 359.38,
    assigned_at: '2026-02-01',
  },
  {
    member_id: '10005',
    member_name: 'Margaret Thompson',
    tier: 1,
    retirement_date: '2024-07-01',
    enrollment_type: 'coverage_change',
    status: 'verified',
    ipr_eligible: true,
    ipr_monthly: 312.50,
    assigned_at: '2026-01-15',
  },
  {
    member_id: '10006',
    member_name: 'Patricia Gonzalez',
    tier: 2,
    retirement_date: '2025-09-01',
    enrollment_type: 'coverage_change',
    status: 'pending_verification',
    ipr_eligible: false,
    assigned_at: '2026-03-20',
  },
]

// ─── IPR Verification Data ──────────────────────────────────────────────────
// Detailed IPR calculations for Cases 1-3, showing formula transparency

export const DEMO_IPR_VERIFICATIONS: Record<string, IPRVerification> = {
  // Case 1: Robert Martinez — 28.75 earned years, Tier 1, pre-Medicare
  '10001': {
    member_id: '10001',
    member_name: 'Robert Martinez',
    tier: 1,
    earned_service_years: 28.75,
    pre_medicare_monthly: Math.round(28.75 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $359.38
    post_medicare_monthly: Math.round(28.75 * IPR_POST_MEDICARE_RATE * 100) / 100, // $179.69
    medicare_eligible_date: '2028-03-08', // age 65
    current_phase: 'pre_medicare',
    monthly_ipr: Math.round(28.75 * IPR_PRE_MEDICARE_RATE * 100) / 100,
  },
  // Case 2: Jennifer Kim — 18.17 EARNED years (3.00 purchased excluded), Tier 2, pre-Medicare
  '10002': {
    member_id: '10002',
    member_name: 'Jennifer Kim',
    tier: 2,
    earned_service_years: 18.17, // total_service_years=21.17, but purchased 3.00 excluded from IPR
    pre_medicare_monthly: Math.round(18.17 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $227.13
    post_medicare_monthly: Math.round(18.17 * IPR_POST_MEDICARE_RATE * 100) / 100, // $113.56
    medicare_eligible_date: '2035-06-22', // age 65
    current_phase: 'pre_medicare',
    monthly_ipr: Math.round(18.17 * IPR_PRE_MEDICARE_RATE * 100) / 100,
  },
  // Case 3: David Washington — 13.58 earned years, Tier 3, pre-Medicare
  '10003': {
    member_id: '10003',
    member_name: 'David Washington',
    tier: 3,
    earned_service_years: 13.58,
    pre_medicare_monthly: Math.round(13.58 * IPR_PRE_MEDICARE_RATE * 100) / 100, // $169.75
    post_medicare_monthly: Math.round(13.58 * IPR_POST_MEDICARE_RATE * 100) / 100, // $84.88
    medicare_eligible_date: '2028-02-14', // age 65
    current_phase: 'pre_medicare',
    monthly_ipr: Math.round(13.58 * IPR_PRE_MEDICARE_RATE * 100) / 100,
  },
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

function computeStats(): VendorDashboardStats {
  const pending = DEMO_ENROLLMENT_QUEUE.filter(e => e.status === 'pending_verification').length
  const verified = DEMO_ENROLLMENT_QUEUE.filter(e => e.status === 'verified').length
  const enrolled = DEMO_ENROLLMENT_QUEUE.filter(e => e.status === 'enrolled').length
  return {
    pending_enrollments: pending,
    verified_this_month: verified,
    total_active_enrollees: enrolled + verified + pending,
    avg_processing_days: 3.2,
  }
}

// ─── Demo API (simulates async network calls) ──────────────────────────────

function delay<T>(data: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export const vendorDemoApi = {
  getQueue: () => delay(DEMO_ENROLLMENT_QUEUE),

  getIPRVerification: (memberId: string) => {
    const v = DEMO_IPR_VERIFICATIONS[memberId]
    if (!v) return Promise.reject(new Error(`No IPR verification for member ${memberId}`))
    return delay(v)
  },

  getStats: () => delay(computeStats()),
}
