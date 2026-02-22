import { useState } from 'react'
import { BenefitWorkspace } from '@/pages/BenefitWorkspace'
import { C, tierMeta } from '@/theme'

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const, lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}

const DEMO_CASES = [
  { id: '10001', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | Leave Payout' },
  { id: '10002', name: 'Jennifer Kim', tier: 2, label: 'Tier 2 | Purchased Svc | 30% Reduction' },
  { id: '10003', name: 'David Washington', tier: 3, label: 'Tier 3 | 60-Mo AMS | 12% Reduction' },
  { id: '10004', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | DRO', suffix: ' +DRO' },
] as const

function App() {
  const [memberId, setMemberId] = useState('')

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column' as const,
      background: C.bg, color: C.text, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '5px',
            background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '10px', color: C.bg,
          }}>N</div>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '13px' }}>NoUI</span>
          <span style={{ color: C.textMuted, fontSize: '11px' }}>Benefit Calculator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px' }}>DERP POC</span>
          <Badge text="Phase 1 · Transparent" bg={C.accentMuted} color={C.accent} />
        </div>
      </div>

      {/* Main content */}
      {memberId ? (
        <BenefitWorkspace memberId={memberId} />
      ) : (
        <WelcomeScreen onSelect={setMemberId} />
      )}

      {/* Case selector bottom bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '5px 12px', gap: '4px',
        borderTop: `1px solid ${C.border}`, background: C.surface,
        flexShrink: 0, flexWrap: 'wrap' as const,
      }}>
        <span style={{
          fontSize: '9px', color: C.textDim, textTransform: 'uppercase' as const,
          letterSpacing: '1px', marginRight: '4px',
        }}>Demo Case</span>
        {DEMO_CASES.map(c => {
          const t = tierMeta[c.tier]
          const isActive = memberId === c.id
          return (
            <button key={c.id} onClick={() => setMemberId(c.id)} style={{
              padding: '3px 9px', borderRadius: '5px',
              border: `1px solid ${isActive ? t.color : C.border}`,
              background: isActive ? t.muted : 'transparent',
              color: isActive ? t.color : C.textMuted,
              cursor: 'pointer', fontSize: '10px', fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {c.name.split(' ')[0]}{'suffix' in c ? c.suffix : ''}
            </button>
          )
        })}
        {memberId && (
          <span style={{ color: C.textDim, fontSize: '9.5px', marginLeft: '6px', fontStyle: 'italic' }}>
            {DEMO_CASES.find(c => c.id === memberId)?.label}
          </span>
        )}
      </div>
    </div>
  )
}

function WelcomeScreen({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center', gap: '16px',
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
        Select a demo case below to load a member's retirement workspace.
        Every calculation is transparent and verifiable.
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px', marginTop: '8px', width: '480px', maxWidth: '95vw',
      }}>
        {DEMO_CASES.map(c => {
          const t = tierMeta[c.tier]
          return (
            <button key={c.id} onClick={() => onSelect(c.id)} style={{
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

export default App
