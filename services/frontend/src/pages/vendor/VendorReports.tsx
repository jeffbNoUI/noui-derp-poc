/**
 * Vendor reports page — report cards with generate/download workflow and preview data.
 * Consumed by: router.tsx (/vendor/reports route)
 * Depends on: useTheme (vendor theme colors)
 */
import { useState } from 'react'
import { useTheme } from '@/theme'

interface ReportDef {
  id: string
  title: string
  description: string
  preview: string
  lastGenerated?: string
}

const REPORTS: ReportDef[] = [
  {
    id: 'enrollment-summary',
    title: 'Monthly Enrollment Summary',
    description: 'New retiree enrollments, coverage changes, and declines for the current month.',
    preview: '12 new enrollments | 3 coverage changes | 1 declined',
    lastGenerated: '2026-02-15',
  },
  {
    id: 'ipr-verification',
    title: 'IPR Verification Log',
    description: 'Audit log of all IPR verifications including earned service years, rates, and approval status.',
    preview: '47 verifications YTD | 2 flagged for review',
    lastGenerated: '2026-02-20',
  },
  {
    id: 'coverage-status',
    title: 'Coverage Status',
    description: 'Current enrollment status for all active retirees — health, dental, vision breakdowns.',
    preview: '312 active health | 287 dental | 198 vision',
    lastGenerated: '2026-01-31',
  },
]

export function VendorReports() {
  const T = useTheme()
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())

  const handleGenerate = (reportId: string) => {
    setGenerating(reportId)
    // Simulate report generation
    setTimeout(() => {
      setGenerating(null)
      setGenerated(prev => new Set(prev).add(reportId))
    }, 1500)
  }

  const handleDownload = (report: ReportDef) => {
    // Simulate CSV download by creating a blob
    const csvContent = `Report: ${report.title}\nGenerated: ${new Date().toISOString()}\n\n${report.preview.replace(/ \| /g, '\n')}\n`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: T.text.primary }}>
        Reports
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {REPORTS.map(report => {
          const isGenerating = generating === report.id
          const isGenerated = generated.has(report.id)
          return (
            <div key={report.id} style={{
              background: T.surface.card, borderRadius: 10, padding: 20,
              border: `1px solid ${T.border.base}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>
                  {report.title}
                </div>
                {report.lastGenerated && (
                  <span style={{ fontSize: 10, color: T.text.muted, whiteSpace: 'nowrap' as const }}>
                    Last: {new Date(report.lastGenerated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 12 }}>
                {report.description}
              </div>
              <div style={{
                fontSize: 11, color: T.text.muted, padding: '8px 12px',
                background: T.surface.cardAlt, borderRadius: 6,
                fontFamily: 'monospace', marginBottom: 14,
              }}>
                {report.preview}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleGenerate(report.id)}
                  disabled={isGenerating}
                  style={{
                    padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: isGenerating ? T.border.subtle : T.accent.primary,
                    color: isGenerating ? T.text.muted : '#fff',
                    border: 'none', cursor: isGenerating ? 'default' : 'pointer',
                  }}
                >
                  {isGenerating ? 'Generating...' : isGenerated ? 'Regenerate' : 'Generate Report'}
                </button>
                {isGenerated && (
                  <button
                    onClick={() => handleDownload(report)}
                    style={{
                      padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: T.status.successBg, color: T.status.success,
                      border: `1px solid ${T.status.success}30`, cursor: 'pointer',
                    }}
                  >
                    Download CSV
                  </button>
                )}
                {isGenerated && (
                  <span style={{
                    fontSize: 10, color: T.status.success, fontWeight: 600,
                    alignSelf: 'center', marginLeft: 4,
                  }}>
                    {'\u2713'} Ready
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
