/**
 * Case status bar — displays received date, case age, deadline, and assigned analyst.
 * Sits between the member banner and the progress bar.
 * Consumed by: GuidedWorkspace
 * Depends on: Member types (ApplicationIntake), theme (C)
 */
import { C } from '@/theme'
import { formatDate } from '@/lib/utils'
import type { ApplicationIntake } from '@/types/Member'

export interface CaseStatusBarProps {
  intake?: ApplicationIntake
}

/** Compute the number of days between two date strings (YYYY-MM-DD) */
function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function CaseStatusBar({ intake }: CaseStatusBarProps) {
  if (!intake) return null

  // Use current date (or today) to compute case age
  const today = new Date().toISOString().slice(0, 10)
  const caseAge = daysBetween(intake.application_received_date, today)

  const items = [
    { label: 'Received', value: formatDate(intake.application_received_date) },
    { label: 'Case Age', value: `${caseAge} days` },
    { label: 'Deadline', value: formatDate(intake.cutoff_date) },
    { label: 'Analyst', value: 'Current User' },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '4px 14px', background: C.elevated,
      borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
    }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && (
            <span style={{ color: C.borderSubtle, fontSize: '10px', margin: '0 4px' }}>{'\u2502'}</span>
          )}
          <span style={{ color: C.textMuted, fontSize: '9.5px' }}>{item.label}:</span>
          <span style={{ color: C.textSecondary, fontSize: '9.5px', fontWeight: 600 }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}
