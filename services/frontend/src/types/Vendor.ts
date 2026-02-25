/**
 * Vendor portal type definitions — enrollment queue, IPR verification, dashboard stats.
 * Consumed by: vendor-demo-data.ts, VendorDashboard, VendorMemberDetail, VendorReports
 * Depends on: nothing (standalone type definitions)
 */

export interface EnrollmentQueueItem {
  member_id: string
  member_name: string
  tier: number
  retirement_date: string
  enrollment_type: 'new_retiree' | 'coverage_change' | 'open_enrollment'
  status: 'pending_verification' | 'verified' | 'enrolled' | 'declined'
  ipr_eligible: boolean
  ipr_monthly?: number
  assigned_at: string
}

export interface IPRVerification {
  member_id: string
  member_name: string
  tier: number
  earned_service_years: number // purchased service EXCLUDED from IPR — RMC §18-412
  pre_medicare_monthly: number // earned_years * $12.50
  post_medicare_monthly: number // earned_years * $6.25
  medicare_eligible_date?: string
  current_phase: 'pre_medicare' | 'post_medicare'
  monthly_ipr: number
}

export interface VendorDashboardStats {
  pending_enrollments: number
  verified_this_month: number
  total_active_enrollees: number
  avg_processing_days: number
}
