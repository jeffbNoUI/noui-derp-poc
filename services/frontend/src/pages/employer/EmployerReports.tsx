/**
 * Employer reports catalog — report cards with generate/download workflow.
 * Consumed by: router.tsx (employer/reports route)
 * Depends on: employerTheme
 */
import { useState } from 'react'
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
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())

  const handleGenerate = (reportId: string) => {
    setGenerating(reportId)
    // Simulate report generation
    setTimeout(() => {
      setGenerating(null)
      setGenerated(prev => new Set(prev).add(reportId))
    }, 1200)
  }

  const handleDownload = (report: ReportCard) => {
    // Simulate CSV download
    const csvContent = `Report: ${report.title}\nGenerated: ${new Date().toISOString()}\nFrequency: ${report.frequency}\nLast Generated: ${report.lastGenerated}\n`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 16 }}>
        Reports
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {REPORT_CATALOG.map(report => {
          const isGenerating = generating === report.id
          const isGenerated = generated.has(report.id)
          return (
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
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isGenerated && (
                    <button
                      onClick={() => handleDownload(report)}
                      style={{
                        padding: '6px 12px', background: T.status.successBg,
                        color: T.status.success, border: `1px solid ${T.status.success}30`,
                        borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      }}
                    >Download</button>
                  )}
                  <button
                    onClick={() => handleGenerate(report.id)}
                    disabled={isGenerating}
                    style={{
                      padding: '6px 14px',
                      background: isGenerating ? T.border.subtle : T.accent.primary,
                      color: isGenerating ? T.text.muted : '#ffffff',
                      border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: isGenerating ? 'default' : 'pointer',
                    }}
                  >
                    {isGenerating ? 'Generating...' : isGenerated ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
