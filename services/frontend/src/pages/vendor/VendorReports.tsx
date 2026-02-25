/**
 * Vendor reports page — list of available reports with descriptions and sample data previews.
 * Consumed by: router.tsx (/vendor/reports route)
 * Depends on: useTheme (vendor theme colors)
 */
import { useTheme } from '@/theme'

const REPORTS = [
  {
    title: 'Monthly Enrollment Summary',
    description: 'New retiree enrollments, coverage changes, and declines for the current month.',
    preview: '12 new enrollments | 3 coverage changes | 1 declined',
  },
  {
    title: 'IPR Verification Log',
    description: 'Audit log of all IPR verifications including earned service years, rates, and approval status.',
    preview: '47 verifications YTD | 2 flagged for review',
  },
  {
    title: 'Coverage Status',
    description: 'Current enrollment status for all active retirees — health, dental, vision breakdowns.',
    preview: '312 active health | 287 dental | 198 vision',
  },
]

export function VendorReports() {
  const T = useTheme()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: T.text.primary }}>
        Reports
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {REPORTS.map(report => (
          <div key={report.title} style={{
            background: T.surface.card, borderRadius: 10, padding: 20,
            border: `1px solid ${T.border.base}`, cursor: 'pointer',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowLg }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text.primary, marginBottom: 6 }}>
              {report.title}
            </div>
            <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 12 }}>
              {report.description}
            </div>
            <div style={{
              fontSize: 11, color: T.text.muted, padding: '8px 12px',
              background: T.surface.cardAlt, borderRadius: 6,
              fontFamily: 'monospace',
            }}>
              {report.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
