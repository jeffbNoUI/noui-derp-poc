/**
 * Employer reports catalog — report cards with descriptions, last-generated dates, generate buttons.
 * Consumed by: router.tsx (employer/reports route)
 * Depends on: employerTheme
 */
import { employerTheme as T } from '@/theme'

interface ReportCard {
  id: string
  title: string
  description: string
  lastGenerated: string
  frequency: string
}

const REPORT_CATALOG: ReportCard[] = [
  {
    id: 'monthly-contribution',
    title: 'Monthly Contribution Summary',
    description: 'Consolidated report of employee and employer contributions by department, including variance analysis against expected amounts.',
    lastGenerated: '2026-02-15',
    frequency: 'Monthly',
  },
  {
    id: 'annual-census',
    title: 'Annual Census',
    description: 'Complete employee census data including tier assignments, service years, salary, and beneficiary designations. Used for actuarial valuations.',
    lastGenerated: '2026-01-15',
    frequency: 'Annual',
  },
  {
    id: 'termination-report',
    title: 'Termination Report',
    description: 'Summary of employee terminations, including vesting status, refund eligibility, and contribution balances. Required within 30 days of termination.',
    lastGenerated: '2026-02-01',
    frequency: 'As needed',
  },
  {
    id: 'retirement-activity',
    title: 'Retirement Activity',
    description: 'Active retirement applications, processing status, projected retirement dates, and estimated benefit amounts for workforce planning.',
    lastGenerated: '2026-02-20',
    frequency: 'Monthly',
  },
]

export function EmployerReports() {
  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 16 }}>
        Reports
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {REPORT_CATALOG.map(report => (
          <div
            key={report.id}
            style={{
              background: T.surface.card, borderRadius: 10,
              border: `1px solid ${T.border.base}`,
              padding: 20, boxShadow: T.shadow,
              display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>
                  {report.title}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                  color: T.accent.primary, background: T.accent.surface,
                  textTransform: 'uppercase' as const, letterSpacing: 0.3,
                }}>
                  {report.frequency}
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5, marginBottom: 14 }}>
                {report.description}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 10, color: T.text.muted }}>
                Last generated: {new Date(report.lastGenerated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <button style={{
                padding: '6px 14px', background: T.accent.primary, color: '#ffffff',
                border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}>Generate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
