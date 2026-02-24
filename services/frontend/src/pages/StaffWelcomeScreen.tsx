/**
 * Staff welcome screen — grid of 4 demo case cards for selection.
 * Consumed by: router.tsx (index route under /staff)
 * Depends on: Badge, DEMO_CASES, theme (C, tierMeta), react-router-dom
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEMO_CASES } from '@/lib/constants'


export function StaffWelcomeScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'expert' | 'guided'>('expert')

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center', gap: '16px',
      height: '100%',
    }}>
      <div style={{
        fontSize: '11px', color: C.accent, textTransform: 'uppercase' as const,
        letterSpacing: '2px', fontWeight: 600,
      }}>Phase 1: Transparent</div>
      <div style={{ color: C.text, fontSize: '18px', fontWeight: 700 }}>
        Retirement Application Workspace
      </div>
      <div style={{
        color: C.textSecondary, fontSize: '12px', maxWidth: '400px',
        textAlign: 'center' as const, lineHeight: '1.5',
      }}>
        Select a mode and demo case below to load a member's retirement workspace.
        Every calculation is transparent and verifiable.
      </div>

      {/* Mode selector */}
      <div data-discovery="mode-toggle" style={{
        display: 'flex', borderRadius: '6px', overflow: 'hidden',
        border: `1px solid ${C.border}`,
      }}>
        <button onClick={() => setMode('expert')} style={{
          padding: '6px 16px', border: 'none', cursor: 'pointer',
          fontSize: '11px', fontWeight: mode === 'expert' ? 600 : 400,
          color: mode === 'expert' ? C.accent : C.textMuted,
          background: mode === 'expert' ? C.accentMuted : 'transparent',
          letterSpacing: '0.5px',
        }}>Expert</button>
        <button onClick={() => setMode('guided')} style={{
          padding: '6px 16px', border: 'none', borderLeft: `1px solid ${C.border}`,
          cursor: 'pointer', fontSize: '11px', fontWeight: mode === 'guided' ? 600 : 400,
          color: mode === 'guided' ? C.accent : C.textMuted,
          background: mode === 'guided' ? C.accentMuted : 'transparent',
          letterSpacing: '0.5px',
        }}>Guided</button>
      </div>
      <div style={{ color: C.textDim, fontSize: '10px', maxWidth: '350px', textAlign: 'center' as const }}>
        {mode === 'expert'
          ? 'All panels visible. Click to expand, confirm in any order.'
          : 'Step-by-step processing with contextual help and rule citations.'}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px', marginTop: '8px', width: '480px', maxWidth: '95vw',
      }}>
        {DEMO_CASES.map(c => {
          const t = tierMeta[c.tier]
          return (
            <button key={c.id} onClick={() => navigate(`/staff/case/${c.id}${mode === 'guided' ? '/guided' : ''}`)} style={{
              padding: '14px', background: C.surface,
              border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
              cursor: 'pointer', textAlign: 'left' as const,
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>{c.name}</span>
                <Badge text={`T${c.tier}`} bg={t.muted} color={t.color} />
              </div>
              <div style={{ color: C.textMuted, fontSize: '10px' }}>
                Case {c.id === '10004' ? '4' : Number(c.id) - 10000}
              </div>
              <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>{c.label}</div>
            </button>
          )
        })}
      </div>
      <div style={{
        color: C.textDim, fontSize: '10px', maxWidth: '350px',
        textAlign: 'center' as const, marginTop: '8px',
      }}>
        The rules engine is configured with certified plan provisions.
        AI composes the workspace; the rules engine determines the numbers.
      </div>
    </div>
  )
}
