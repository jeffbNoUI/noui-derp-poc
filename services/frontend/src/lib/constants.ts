/**
 * Shared constants — single source of truth for values used across staff and portal.
 * Consumed by: BenefitWorkspace, MemberDashboard, ApplicationWizard, StaffWelcomeScreen
 * Depends on: Nothing
 */

/** Default retirement dates per demo case — drives eligibility and benefit calculations */
export const DEFAULT_RETIREMENT_DATES: Record<string, string> = {
  'COPERA-001': '2026-01-01', // Maria Garcia — Normal/Rule of 80
  'COPERA-002': '2026-07-01', // James Chen — Early retirement
  'COPERA-003': '2026-06-01', // Sarah Williams — Rule of 80 (DPS)
}

/** Demo case metadata used by staff case picker and portal auth */
export const DEMO_CASES = [
  { id: 'COPERA-001', name: 'Maria Garcia', division: 'State', has_table: 1, label: 'State | PERA 1 | Rule of 80 | Normal Retirement' },
  { id: 'COPERA-002', name: 'James Chen', division: 'School', has_table: 6, label: 'School | PERA 6 | Early Retirement | Anti-Spiking' },
  { id: 'COPERA-003', name: 'Sarah Williams', division: 'DPS', has_table: 10, label: 'DPS | DPS 1 | Rule of 80 | DPS Options' },
] as const

/** Process type for Phase 2 cases — drives route selection */
export type ProcessType = 'retirement' | 'refund' | 'death'

/** Currency formatter — full precision, USD with 2 decimal places */
export function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
