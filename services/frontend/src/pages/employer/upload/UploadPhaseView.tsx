/**
 * Upload phase — file drop zone (visual), demo file button, metadata preview.
 * Consumed by: ContributionUpload page
 * Depends on: employerTheme, ContributionFileMetadata type
 */
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { ContributionFileMetadata } from '@/types/Employer'

interface Props {
  metadata: ContributionFileMetadata | null
  onLoadDemo: () => void
  onValidate: () => void
  isValidating: boolean
}

export function UploadPhaseView({ metadata, onLoadDemo, onValidate, isValidating }: Props) {
  return (
    <div>
      {/* Drop zone (visual only for POC — real upload not wired) */}
      {!metadata && (
        <div style={{
          border: `2px dashed ${T.border.base}`, borderRadius: 12, padding: '48px 24px',
          textAlign: 'center', background: T.surface.cardAlt, marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, color: T.text.secondary, marginBottom: 8 }}>
            Drag &amp; drop a contribution CSV file here
          </div>
          <div style={{ fontSize: 12, color: T.text.muted, marginBottom: 20 }}>
            or
          </div>
          <button
            onClick={onLoadDemo}
            style={{
              padding: '10px 24px', background: T.accent.primary, color: T.accent.on,
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Use Demo File
          </button>
          <div style={{ fontSize: 11, color: T.text.muted, marginTop: 12 }}>
            Loads PW_contributions_2026-04.csv with 4 intentional issues for demonstration
          </div>
        </div>
      )}

      {/* File metadata preview */}
      {metadata && (
        <div style={{
          background: T.surface.card, border: `1px solid ${T.border.base}`, borderRadius: 10,
          padding: 20, marginBottom: 16, boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>
            File Loaded
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>File Name</div>
              <div style={{ fontSize: 12, color: T.text.primary, fontFamily: 'monospace' }}>{metadata.file_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Period</div>
              <div style={{ fontSize: 12, color: T.text.primary }}>{metadata.period}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
              <div style={{ fontSize: 12, color: T.text.primary }}>{metadata.department}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Rows</div>
              <div style={{ fontSize: 12, color: T.text.primary }}>{metadata.row_count}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>File Size</div>
              <div style={{ fontSize: 12, color: T.text.primary }}>{fmt(metadata.file_size_bytes).replace('$', '')} bytes</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>Uploaded</div>
              <div style={{ fontSize: 12, color: T.text.primary }}>{new Date(metadata.uploaded_at).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={onValidate}
              disabled={isValidating}
              style={{
                padding: '10px 24px', background: T.accent.primary, color: T.accent.on,
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: isValidating ? 0.6 : 1,
              }}
            >
              {isValidating ? 'Validating...' : 'Validate File'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
