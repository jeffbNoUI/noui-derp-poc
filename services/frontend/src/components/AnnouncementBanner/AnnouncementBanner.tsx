/**
 * Dismissible announcement banner — shows new feature names with "New" badges.
 * Renders between the top bar and main content in StaffLayout.
 * Consumed by: StaffLayout.tsx
 * Depends on: banner-data.ts, Badge, theme (C)
 */
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { CURRENT_BATCH } from './banner-data'

const STORAGE_KEY = 'noui:announcements:dismissed'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function dismissBatch(batchId: string) {
  const dismissed = getDismissed()
  dismissed.add(batchId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
}

export function AnnouncementBanner() {
  const location = useLocation()
  const isKiosk = location.search.includes('kiosk')
  const [dismissed, setDismissed] = useState(() => getDismissed().has(CURRENT_BATCH.id))

  if (dismissed || isKiosk) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '5px 14px', background: `linear-gradient(90deg, ${C.accentMuted}, transparent)`,
      borderBottom: `1px solid ${C.accentSolid}`, flexShrink: 0,
    }}>
      <span style={{
        color: C.accent, fontSize: '10px', fontWeight: 600,
        textTransform: 'uppercase' as const, letterSpacing: '0.8px',
        flexShrink: 0,
      }}>New in this release</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, flexWrap: 'wrap' as const }}>
        {CURRENT_BATCH.features.map(f => (
          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: C.text, fontSize: '11px', fontWeight: 500 }}>{f}</span>
            <Badge text="New" bg={C.accent} color="#fff" />
          </span>
        ))}
      </div>
      <button
        onClick={() => { dismissBatch(CURRENT_BATCH.id); setDismissed(true) }}
        style={{
          background: 'none', border: 'none', color: C.textMuted,
          cursor: 'pointer', fontSize: '14px', padding: '0 2px',
          lineHeight: 1, flexShrink: 0,
        }}
        aria-label="Dismiss announcement"
      >{'\u2715'}</button>
    </div>
  )
}
