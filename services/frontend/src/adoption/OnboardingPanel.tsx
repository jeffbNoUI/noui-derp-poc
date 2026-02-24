/**
 * Onboarding panel — slide-out panel from top-right showing analyst milestones.
 * Progress bar, numbered milestones with check/circle, celebration on completion.
 * Consumed by: StaffLayout.tsx
 * Depends on: useOnboardingChecklist.ts, theme (C)
 */
import { C } from '@/theme'
import { useOnboardingChecklist } from './useOnboardingChecklist'

export function OnboardingPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { milestones, completedCount, totalCount } = useOnboardingChecklist()

  if (!open) return null

  const allComplete = completedCount === totalCount
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          zIndex: 8000,
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: '44px', right: '12px',
        width: '320px', maxHeight: 'calc(100vh - 80px)',
        background: C.surface, borderRadius: '10px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 8001, overflow: 'auto',
        padding: '16px 18px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '13px' }}>Getting Started</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: C.textMuted,
              cursor: 'pointer', fontSize: '14px',
            }}
          >{'\u2715'}</button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{ color: C.textSecondary, fontSize: '10px' }}>
              {completedCount} of {totalCount} complete
            </span>
            <span style={{ color: C.accent, fontSize: '10px', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{
            height: '4px', borderRadius: '2px',
            background: C.borderSubtle, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: allComplete ? C.success : C.accent,
              width: `${pct}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Milestones */}
        {milestones.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', gap: '10px', padding: '8px 0',
            borderBottom: i < milestones.length - 1 ? `1px solid ${C.borderSubtle}` : 'none',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, marginTop: '1px',
              background: m.completed ? C.success : C.elevated,
              color: m.completed ? '#fff' : C.textDim,
              border: m.completed ? 'none' : `1px solid ${C.border}`,
            }}>
              {m.completed ? '\u2713' : i + 1}
            </div>
            <div>
              <div style={{
                color: m.completed ? C.success : C.text,
                fontSize: '11.5px', fontWeight: 600,
                textDecoration: m.completed ? 'line-through' : 'none',
                opacity: m.completed ? 0.7 : 1,
              }}>{m.label}</div>
              <div style={{
                color: C.textMuted, fontSize: '10px', marginTop: '1px',
              }}>{m.description}</div>
            </div>
          </div>
        ))}

        {/* Celebration */}
        {allComplete && (
          <div style={{
            marginTop: '14px', padding: '10px',
            background: `linear-gradient(135deg, ${C.successMuted}, transparent)`,
            borderRadius: '8px', textAlign: 'center' as const,
            border: `1px solid ${C.successBorder}`,
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{'\uD83C\uDF89'}</div>
            <div style={{ color: C.success, fontSize: '12px', fontWeight: 700 }}>
              All milestones complete!
            </div>
            <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
              You're ready to process cases like a pro.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
