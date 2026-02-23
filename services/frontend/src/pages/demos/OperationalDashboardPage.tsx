/**
 * Operational Dashboard page — processing times, exception frequencies, workflow patterns.
 * Reimplements OperationalDashboard concept with inline styles (no Tailwind dependency).
 * Consumed by: router.tsx (/demos/operational route)
 * Depends on: React (useState)
 */
import { useState } from 'react'

const C = {
  bg: '#f6f9f9', surface: '#ffffff', surfaceAlt: '#eef5f5',
  primary: '#00796b', primarySurface: '#e0f2f1', primaryLight: '#b2dfdb',
  accent: '#e65100', accentLight: '#fff3e0',
  success: '#2e7d32', successLight: '#e8f5e9',
  danger: '#c62828', dangerLight: '#ffebee',
  text: '#1a2e2e', textSecondary: '#4a6767', textTertiary: '#7a9696',
  border: '#d0dede',
  sidebar: '#00363a', sidebarText: '#a0c4c4', sidebarActive: '#4db6ac',
}
const FONT = `'Plus Jakarta Sans', 'Source Sans 3', -apple-system, sans-serif`
const MONO = `'JetBrains Mono', 'SF Mono', monospace`

const PROCESSING_TIMES = [
  { caseType: 'Normal Retirement', tier: 'All', avgDays: 12.3, medianDays: 10.0, p95Days: 28.5, sample: 1247 },
  { caseType: 'Early Retirement', tier: 'T1/T2', avgDays: 15.8, medianDays: 13.0, p95Days: 35.2, sample: 823 },
  { caseType: 'Early Retirement', tier: 'T3', avgDays: 14.1, medianDays: 12.0, p95Days: 31.0, sample: 412 },
  { caseType: 'DRO Cases', tier: 'All', avgDays: 24.6, medianDays: 22.0, p95Days: 48.3, sample: 365 },
]

const EXCEPTIONS = [
  { type: 'Missing Spousal Consent', count: 187, pct: 22, trend: 'stable' },
  { type: 'AMS Window Discrepancy', count: 134, pct: 16, trend: 'decreasing' },
  { type: 'Leave Payout Verification', count: 112, pct: 13, trend: 'increasing' },
  { type: 'Purchased Service Documentation', count: 98, pct: 12, trend: 'stable' },
  { type: 'Late Application Filing', count: 76, pct: 9, trend: 'decreasing' },
  { type: 'DRO Calculation Mismatch', count: 52, pct: 6, trend: 'increasing' },
]

const WORKFLOW_PATTERNS = [
  { name: 'Standard Processing', freq: 1847, avgDays: 11.2, steps: ['Intake', 'Eligibility', 'Calculation', 'Review', 'Approval'], desc: 'Most common flow — no exceptions, straightforward case' },
  { name: 'Leave Payout Review', freq: 412, avgDays: 16.8, steps: ['Intake', 'Eligibility', 'Leave Verify', 'Calculation', 'Review', 'Approval'], desc: 'Pre-2010 hire members with sick/vacation cash-out requiring AMS impact verification' },
  { name: 'DRO Split Processing', freq: 365, avgDays: 24.6, steps: ['Intake', 'Eligibility', 'DRO Review', 'Split Calc', 'Dual Review', 'Approval'], desc: 'Cases with active Domestic Relations Orders requiring marital fraction and dual notifications' },
  { name: 'Exception Recovery', freq: 223, avgDays: 22.4, steps: ['Intake', 'Eligibility', 'Exception', 'Correction', 'Re-Calc', 'Review', 'Approval'], desc: 'Cases that hit a validation exception and require correction before proceeding' },
]

function TrendBadge({ trend }: { trend: string }) {
  const cfg: Record<string, { arrow: string; color: string; bg: string }> = {
    increasing: { arrow: '\u2191', color: C.danger, bg: C.dangerLight },
    stable: { arrow: '\u2192', color: C.textTertiary, bg: C.surfaceAlt },
    decreasing: { arrow: '\u2193', color: C.success, bg: C.successLight },
  }
  const c = cfg[trend] ?? cfg.stable
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, fontFamily: MONO, padding: '2px 6px',
      borderRadius: 4, background: c.bg, color: c.color,
    }}>{c.arrow}</span>
  )
}

export function OperationalDashboardPage() {
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null)

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
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Operational Dashboard</span>
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
          Operational patterns inform orchestration and workspace composition only — not business rules.
          All insights are observations presented for human review.
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Cases Analyzed', value: '2,847' },
            { label: 'Date Range', value: 'Jan 2024 – Feb 2026' },
            { label: 'Workflow Patterns', value: '4' },
          ].map(s => (
            <div key={s.label} style={{
              background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
              padding: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: MONO }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Processing Times */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: C.text }}>
            Processing Time by Case Type
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Case Type', 'Tier', 'Avg Days', 'Median', 'P95', 'Sample'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Case Type' ? 'left' : 'right', padding: '8px 12px',
                      color: C.textTertiary, fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROCESSING_TIMES.map((pt, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{pt.caseType}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.textSecondary }}>{pt.tier}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO, fontWeight: 600 }}>{pt.avgDays.toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO }}>{pt.medianDays.toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO }}>{pt.p95Days.toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: C.textSecondary }}>{pt.sample.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exception Frequencies */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: C.text }}>
            Exception Frequencies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EXCEPTIONS.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, width: 200, flexShrink: 0, color: C.text }}>{ex.type}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 8, background: C.surfaceAlt, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(ex.pct * 2, 100)}%`, height: '100%',
                    borderRadius: 8, background: C.accent, opacity: 0.7,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <span style={{ fontSize: 12, fontFamily: MONO, width: 48, textAlign: 'right', fontWeight: 600 }}>{ex.count}</span>
                <TrendBadge trend={ex.trend} />
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Patterns */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: C.text }}>
            Detected Workflow Patterns
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WORKFLOW_PATTERNS.map((wp, i) => (
              <div key={i}
                onClick={() => setSelectedPattern(selectedPattern === i ? null : i)}
                style={{
                  padding: 14, borderRadius: 10, cursor: 'pointer',
                  background: selectedPattern === i ? C.primarySurface : C.surfaceAlt,
                  border: `1px solid ${selectedPattern === i ? C.primaryLight : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{wp.name}</span>
                  <span style={{ fontSize: 11, color: C.textTertiary }}>
                    {wp.freq} occurrences | avg {wp.avgDays} days
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>{wp.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {wp.steps.map((step, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: C.surface, border: `1px solid ${C.border}`,
                        color: C.text, fontWeight: 500,
                      }}>{step}</span>
                      {j < wp.steps.length - 1 && (
                        <span style={{ fontSize: 10, color: C.textTertiary }}>{'\u2192'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
