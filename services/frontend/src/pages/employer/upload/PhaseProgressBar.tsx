/**
 * Phase progress indicator — horizontal step bar for contribution upload workflow.
 * Consumed by: ContributionUpload page
 * Depends on: employerTheme, UploadPhase type
 */
import { employerTheme as T } from '@/theme'
import type { UploadPhase } from './useContributionUpload'

const PHASES: { key: UploadPhase; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'remediation', label: 'Validate & Fix' },
  { key: 'posting', label: 'Post' },
  { key: 'complete', label: 'Complete' },
]

// Map internal phases to display step index
function phaseIndex(phase: UploadPhase): number {
  if (phase === 'validating') return 0 // Still on upload step visually
  return PHASES.findIndex(p => p.key === phase)
}

export function PhaseProgressBar({ phase }: { phase: UploadPhase }) {
  const activeIdx = phaseIndex(phase)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {PHASES.map((step, i) => {
        const isActive = i === activeIdx
        const isDone = i < activeIdx
        const dotColor = isDone ? T.status.success : isActive ? T.accent.primary : T.border.base
        const labelColor = isDone ? T.status.success : isActive ? T.accent.primary : T.text.muted

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < PHASES.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone || isActive ? dotColor : 'transparent',
                border: `2px solid ${dotColor}`,
                color: isDone || isActive ? '#fff' : T.text.muted,
                fontSize: 12, fontWeight: 700,
              }}>
                {isDone ? '\u2713' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: labelColor, whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginLeft: 12, marginRight: 12,
                background: isDone ? T.status.success : T.border.base,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
