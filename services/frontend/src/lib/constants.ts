/**
 * Shared constants — single source of truth for values used across staff and portal.
 * Consumed by: BenefitWorkspace, MemberDashboard, ApplicationWizard, StaffWelcomeScreen
 * Depends on: Nothing
 */

/** Default retirement dates per demo case — drives eligibility and benefit calculations */
export const DEFAULT_RETIREMENT_DATES: Record<string, string> = {
  '10001': '2026-04-01', // Robert Martinez — Rule of 75
  '10002': '2026-05-01', // Jennifer Kim — Early retirement
  '10003': '2026-04-01', // David Washington — Early retirement Tier 3
  '10004': '2026-04-01', // Robert Martinez DRO variant
}

/** Demo case metadata used by staff case picker and portal auth */
export const DEMO_CASES = [
  { id: '10001', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | Leave Payout' },
  { id: '10002', name: 'Jennifer Kim', tier: 2, label: 'Tier 2 | Purchased Svc | 30% Reduction' },
  { id: '10003', name: 'David Washington', tier: 3, label: 'Tier 3 | 60-Mo AMS | 12% Reduction' },
  { id: '10004', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | DRO', suffix: ' +DRO' as const },
] as const

/** Process type for Phase 2 cases — drives route selection */
export type ProcessType = 'retirement' | 'refund' | 'death'

/** Demo refund cases — contribution refund processing */
export const DEMO_REFUND_CASES = [
  { id: '10007', name: 'Maria Santos', tier: 2, label: 'Non-Vested | 3.83yr | $18,639 Gross', processType: 'refund' as const },
  { id: '10008', name: 'Thomas Chen', tier: 1, label: 'Vested | 7.08yr | Forfeiture Decision', processType: 'refund' as const },
] as const

/** Demo death/survivor cases — death benefit processing */
export const DEMO_DEATH_CASES = [
  { id: '10009', name: 'Margaret Thompson', tier: 1, label: 'Retired | 75% J&S | $2,436/mo Survivor', processType: 'death' as const },
  { id: '10010', name: 'James Rivera', tier: 3, label: 'Active | Non-Vested | Contribution Refund', processType: 'death' as const },
] as const

/** Currency formatter — full precision, USD with 2 decimal places */
export function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
