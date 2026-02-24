/**
 * WhatIfSection — collapsible "What If?" scenario cards for the Learning Module.
 * Pre-written scenarios referencing actual demo case numbers (not computed).
 * Consumed by: LearningModule.tsx (inside onboarding layer)
 * Depends on: guided-help.ts (WhatIfScenario), theme (C)
 */
import { useState } from 'react'
import { C } from '@/theme'
import type { WhatIfScenario } from './guided-help'

const DELTA_ICONS: Record<string, { icon: string; color: string }> = {
  increase: { icon: '\u2191', color: C.success },
  decrease: { icon: '\u2193', color: C.danger },
  neutral: { icon: '\u2194', color: C.accent },
}

export function WhatIfSection({ scenarios }: { scenarios: WhatIfScenario[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => {
          setOpen(v => !v)
          localStorage.setItem('noui:adoption:used-whatif', 'true')
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px', width: '100%',
          padding: '4px 0', background: 'none', border: 'none',
          color: C.accent, fontSize: '10px', fontWeight: 600,
          cursor: 'pointer', textTransform: 'uppercase' as const,
          letterSpacing: '0.8px',
        }}
      >
        <span style={{ fontSize: '11px' }}>{open ? '\u25BC' : '\u25B6'}</span>
        What If?
        <span style={{
          color: C.textDim, fontSize: '9px', fontWeight: 400,
          textTransform: 'none' as const, letterSpacing: '0',
        }}>({scenarios.length})</span>
      </button>
      {open && scenarios.map((s, i) => {
        const d = DELTA_ICONS[s.delta]
        return (
          <div key={i} style={{
            padding: '6px 8px', margin: '4px 0',
            background: C.surface, borderRadius: '5px',
            border: `1px solid ${C.borderSubtle}`,
          }}>
            <div style={{
              color: C.text, fontSize: '11px', fontWeight: 600,
              lineHeight: '1.4', marginBottom: '3px',
            }}>{s.question}</div>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '4px',
            }}>
              <span style={{
                color: d.color, fontSize: '12px', fontWeight: 700,
                lineHeight: '1.3', flexShrink: 0,
              }}>{d.icon}</span>
              <span style={{
                color: C.textSecondary, fontSize: '10.5px', lineHeight: '1.45',
              }}>{s.answer}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
