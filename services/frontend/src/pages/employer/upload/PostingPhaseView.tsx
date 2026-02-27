/**
 * Posting phase — summary grid, certification checkbox, post button, and success state.
 * Consumed by: ContributionUpload page
 * Depends on: employerTheme, fmt, ContributionFileMetadata, ValidationSummary
 */
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { ContributionFileMetadata, ValidationSummary } from '@/types/Employer'

interface Props {
  metadata: ContributionFileMetadata
  summary: ValidationSummary
  certified: boolean
  onCertify: (val: boolean) => void
  onPost: () => void
  postedReportId: string | null
}

export function PostingPhaseView({ metadata, summary, certified, onCertify, onPost, postedReportId }: Props) {
  // Success state after posting
  if (postedReportId) {
    return (
      <div style={{
        background: T.status.successBg, border: `1px solid rgba(22,163,74,0.2)`, borderRadius: 10,
        padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{'\u2705'}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.status.success, marginBottom: 8 }}>
          Report Posted Successfully
        </div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 4 }}>
          Report ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{postedReportId}</span>
        </div>
        <div style={{ fontSize: 12, color: T.text.muted }}>
          The contribution report has been submitted for verification by DERP staff.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary grid */}
      <div style={{
        background: T.surface.card, border: `1px solid ${T.border.base}`, borderRadius: 10,
        padding: 20, marginBottom: 20, boxShadow: T.shadow,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 16 }}>
          Contribution Report Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{metadata.period}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{metadata.department}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Employees</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{summary.total_rows}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Total Payroll</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{fmt(summary.total_payroll)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>EE Contributions (8.45%)</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{fmt(summary.total_ee_contributions)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>ER Contributions (17.95%)</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{fmt(summary.total_er_contributions)}</div>
          </div>
        </div>
      </div>

      {/* Certification */}
      <div style={{
        background: T.surface.card, border: `1px solid ${T.border.base}`, borderRadius: 10,
        padding: 20, marginBottom: 20, boxShadow: T.shadow,
      }}>
        <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={certified}
            onChange={e => onCertify(e.target.checked)}
            style={{ marginTop: 2, width: 18, height: 18, cursor: 'pointer' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>
              I certify this contribution data is accurate and complete
            </div>
            <div style={{ fontSize: 11, color: T.text.muted, marginTop: 4 }}>
              By checking this box, I confirm that the reported earnings and contribution amounts
              are correct for all employees listed and that all discrepancies have been reviewed and resolved.
            </div>
          </div>
        </label>
      </div>

      {/* Post button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onPost}
          disabled={!certified}
          style={{
            padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: certified ? T.status.success : T.border.base,
            color: certified ? '#fff' : T.text.muted,
            border: 'none', cursor: certified ? 'pointer' : 'not-allowed',
          }}
        >
          Post Contribution Report
        </button>
      </div>
    </div>
  )
}
