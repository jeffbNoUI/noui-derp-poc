/**
 * Data Quality Dashboard page — severity summary, category breakdown, filterable findings.
 * Reimplements DataQualityDashboard concept with inline styles (no Tailwind dependency).
 * Consumed by: router.tsx (/demos/data-quality route)
 * Depends on: React (useState)
 */
import { useState } from 'react'

const C = {
  bg: '#f6f9f9', surface: '#ffffff', surfaceAlt: '#eef5f5',
  primary: '#00796b', primarySurface: '#e0f2f1', primaryLight: '#b2dfdb',
  accent: '#e65100', accentLight: '#fff3e0',
  success: '#2e7d32', successLight: '#e8f5e9',
  danger: '#c62828', dangerLight: '#ffebee',
  info: '#0369a1', infoLight: '#e0f2fe',
  text: '#1a2e2e', textSecondary: '#4a6767', textTertiary: '#7a9696',
  border: '#d0dede',
  sidebar: '#00363a', sidebarText: '#a0c4c4', sidebarActive: '#4db6ac',
}
const FONT = `'Plus Jakarta Sans', 'Source Sans 3', -apple-system, sans-serif`
const MONO = `'JetBrains Mono', 'SF Mono', monospace`

type Severity = 'critical' | 'warning' | 'info'
type Category = 'structural' | 'calculation' | 'balance'

interface Finding {
  id: string
  severity: Severity
  category: Category
  memberId: string
  description: string
  details: Record<string, string>
  proposedResolution: string | null
}

const FINDINGS: Finding[] = [
  { id: 'DQ-001', severity: 'critical', category: 'calculation', memberId: '10002', description: 'AMS window contains furlough months that reduce the average. Member may be eligible to purchase furlough days.', details: { 'Affected Months': '3', 'AMS Impact': '-$127/month' }, proposedResolution: 'Recalculate AMS excluding furlough months and present purchase option to member.' },
  { id: 'DQ-002', severity: 'critical', category: 'structural', memberId: '10004', description: 'DRO marriage date in member record (1999-08-15) does not match court order document (1999-09-15).', details: { 'Record Date': '1999-08-15', 'Court Order Date': '1999-09-15' }, proposedResolution: 'Update member record to match court order date. Recalculate marital fraction.' },
  { id: 'DQ-003', severity: 'warning', category: 'balance', memberId: '10001', description: 'Employee contribution total differs from expected amount by $42.17. May indicate missed contribution period.', details: { 'Expected': '$68,421.30', 'Actual': '$68,379.13', 'Difference': '$42.17' }, proposedResolution: 'Review payroll records for contribution gaps in 2019-2020 period.' },
  { id: 'DQ-004', severity: 'warning', category: 'structural', memberId: '10002', description: 'Purchased service effective date precedes hire date by 2 months. Verify service purchase agreement.', details: { 'Purchase Date': '2008-01-01', 'Hire Date': '2008-03-01' }, proposedResolution: 'Review original service purchase agreement for correct effective date.' },
  { id: 'DQ-005', severity: 'warning', category: 'calculation', memberId: '10003', description: 'Tier 3 early retirement reduction uses age 63 but member DOB calculation yields 62.97 years. Verify completed-years logic.', details: { 'DOB': '1963-04-22', 'Retirement': '2026-04-01', 'Exact Age': '62.945' }, proposedResolution: 'Confirm reduction uses floor(age) = 62, yielding 3 years under 65 = 18% reduction.' },
  { id: 'DQ-006', severity: 'info', category: 'structural', memberId: '10001', description: 'Member has 3 beneficiary designations on file. Only most recent (2024-01-15) will be used for retirement processing.', details: { 'Designations': '3', 'Most Recent': '2024-01-15' }, proposedResolution: null },
  { id: 'DQ-007', severity: 'info', category: 'balance', memberId: '10002', description: 'Salary history shows consistent biweekly pay. Monthly aggregation uses standard 26-pay-period method.', details: { 'Pay Frequency': 'Biweekly', 'Method': '26-period annual' }, proposedResolution: null },
  { id: 'DQ-008', severity: 'info', category: 'structural', memberId: '10003', description: 'Address on file was last updated 4 years ago. Verify current mailing address before sending retirement package.', details: { 'Last Updated': '2022-03-15' }, proposedResolution: null },
  { id: 'DQ-009', severity: 'critical', category: 'calculation', memberId: '10001', description: 'Leave payout amount ($52,000) exceeds typical range for this salary level. Verify against HR separation records.', details: { 'Payout': '$52,000', 'Monthly Salary': '$11,218' }, proposedResolution: 'Cross-reference with HR department leave balance report and separation agreement.' },
  { id: 'DQ-010', severity: 'warning', category: 'balance', memberId: '10004', description: 'Employer contribution rate changed mid-year 2023. Verify correct rate applied for each pay period.', details: { 'Old Rate': '11.00%', 'New Rate': '17.95%', 'Change Date': '2023-07-01' }, proposedResolution: 'Audit 2023 employer contributions for correct rate application across the transition.' },
]

const SEVERITY_CONFIG: Record<Severity, { icon: string; label: string; color: string; bg: string; border: string }> = {
  critical: { icon: '\u2717', label: 'Critical', color: C.danger, bg: C.dangerLight, border: '#ef9a9a' },
  warning: { icon: '\u26A0', label: 'Warning', color: C.accent, bg: C.accentLight, border: '#ffcc80' },
  info: { icon: '\u2139', label: 'Info', color: C.info, bg: C.infoLight, border: '#90caf9' },
}

const bySeverity = {
  critical: FINDINGS.filter(f => f.severity === 'critical').length,
  warning: FINDINGS.filter(f => f.severity === 'warning').length,
  info: FINDINGS.filter(f => f.severity === 'info').length,
}
const byCategory = {
  structural: FINDINGS.filter(f => f.category === 'structural').length,
  calculation: FINDINGS.filter(f => f.category === 'calculation').length,
  balance: FINDINGS.filter(f => f.category === 'balance').length,
}

export function DataQualityDashboardPage() {
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const filtered = filter === 'all' ? FINDINGS : FINDINGS.filter(f => f.severity === filter)

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* Top bar */}
      <div style={{
        background: C.sidebar, padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>NoUI</span>
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Data Quality Dashboard</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            background: 'rgba(77,182,172,0.15)', color: C.sidebarActive,
            border: '1px solid rgba(77,182,172,0.3)', letterSpacing: 0.5,
          }}>PLATFORM INTELLIGENCE</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
        {/* Transparency note */}
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 20,
          background: C.primarySurface, border: `1px solid ${C.primaryLight}`,
          fontSize: 12, color: C.primary, fontWeight: 500, lineHeight: 1.5,
        }}>
          All findings are presented for human review. Proposed corrections require verification
          before any changes are made.
        </div>

        {/* Summary cards — clickable filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { key: 'all' as const, label: 'Total', count: FINDINGS.length, color: C.text },
            { key: 'critical' as const, label: 'Critical', count: bySeverity.critical, color: C.danger },
            { key: 'warning' as const, label: 'Warning', count: bySeverity.warning, color: C.accent },
            { key: 'info' as const, label: 'Info', count: bySeverity.info, color: C.info },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)} style={{
              padding: 14, borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              background: C.surface, fontFamily: FONT,
              border: filter === s.key ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: MONO }}>{s.count}</div>
              <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Category breakdown */}
        <div style={{
          display: 'flex', gap: 16, fontSize: 12, color: C.textTertiary, marginBottom: 20,
          padding: '8px 0',
        }}>
          <span>Structural: <strong style={{ color: C.text }}>{byCategory.structural}</strong></span>
          <span>Calculation: <strong style={{ color: C.text }}>{byCategory.calculation}</strong></span>
          <span>Balance: <strong style={{ color: C.text }}>{byCategory.balance}</strong></span>
        </div>

        {/* Findings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(finding => {
            const cfg = SEVERITY_CONFIG[finding.severity]
            return (
              <div key={finding.id} style={{
                padding: 16, borderRadius: 10,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: cfg.color,
                  }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, color: C.textTertiary }}>
                        {finding.category} | Member: {finding.memberId} | {finding.id}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.55 }}>{finding.description}</p>

                    {Object.keys(finding.details).length > 0 && (
                      <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8,
                        fontSize: 12,
                      }}>
                        {Object.entries(finding.details).map(([key, value]) => (
                          <div key={key}>
                            <span style={{ color: C.textTertiary }}>{key}: </span>
                            <span style={{ fontFamily: MONO, fontWeight: 600, color: C.text }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {finding.proposedResolution && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.6)', border: `1px dashed ${cfg.border}`,
                        fontSize: 12, lineHeight: 1.5,
                      }}>
                        <span style={{ fontWeight: 700, color: C.textSecondary }}>Proposed correction (awaiting review): </span>
                        <span style={{ color: C.text }}>{finding.proposedResolution}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: C.textTertiary, fontSize: 13 }}>
            No findings match the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}
