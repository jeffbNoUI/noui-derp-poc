/**
 * Member portal Messages page — mock inbox with retirement-related messages.
 * Displays read/unread messages with timestamps per demo member.
 * Consumed by: router.tsx (/portal/messages route)
 * Depends on: useTheme (memberTheme), usePortalAuth (current member ID)
 */
import { useState } from 'react'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'

interface Message {
  id: string
  from: string
  subject: string
  preview: string
  date: string
  read: boolean
}

const MESSAGES: Record<string, Message[]> = {
  'COPERA-001': [
    { id: 'm1', from: 'COPERA Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear Maria, we have received your retirement application dated December 15, 2025. Your assigned analyst will review your package within 5 business days...', date: '12-15-2025', read: true },
    { id: 'm2', from: 'COPERA Benefits Team', subject: 'Benefit Estimate Available', preview: 'Your estimated monthly benefit under the PERA Option 1 (Maximum) is ready for review. This estimate is based on your Highest Average Salary...', date: '12-18-2025', read: true },
    { id: 'm3', from: 'COPERA Document Center', subject: 'Service Credit Verification Complete', preview: 'Your service credit has been verified against employer records and confirmed for your benefit calculation...', date: '12-20-2025', read: false },
    { id: 'm4', from: 'COPERA Benefits Team', subject: 'Action Required: Confirm Payment Election', preview: 'Please review and confirm your payment option election before your retirement effective date of January 1, 2026. This election is irrevocable...', date: '12-22-2025', read: false },
  ],
  'COPERA-002': [
    { id: 'm1', from: 'COPERA Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear James, we have received your retirement application dated June 15, 2026. Your early retirement package is being reviewed...', date: '06-15-2026', read: true },
    { id: 'm2', from: 'COPERA Benefits Team', subject: 'Early Retirement Reduction Notice', preview: 'As a PERA 6 member retiring early, a permanent reduction will apply to your benefit based on years under the normal retirement age...', date: '06-17-2026', read: true },
    { id: 'm3', from: 'COPERA Document Center', subject: 'Anti-Spiking Review Complete', preview: 'Your salary history has been reviewed under the anti-spiking provisions of C.R.S. §24-51-101(24.5). No salary spiking adjustments were necessary...', date: '06-19-2026', read: false },
  ],
  'COPERA-003': [
    { id: 'm1', from: 'COPERA Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear Sarah, we have received your retirement application dated May 15, 2026. As a DPS Division member, your benefit will be calculated using DPS-specific provisions...', date: '05-15-2026', read: true },
    { id: 'm2', from: 'COPERA Benefits Team', subject: 'DPS Division Benefit Calculation', preview: 'Your DPS Division retirement benefit has been calculated under the DPS 1 benefit structure. Please review the enclosed calculation worksheet...', date: '05-18-2026', read: false },
    { id: 'm3', from: 'COPERA Benefits Team', subject: 'Payment Option Election Required', preview: 'Please select your payment option: Option A (Maximum), Option B (Modified), or one of the DPS survivor options (P2 or P3)...', date: '05-20-2026', read: false },
  ],
}

export function MessagesPage() {
  const T = useTheme()
  const { memberId } = usePortalAuth()
  const baseMessages = MESSAGES[memberId] ?? MESSAGES['COPERA-001']
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    new Set(baseMessages.filter(m => m.read).map(m => m.id))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const messages = baseMessages.map(m => ({ ...m, read: readIds.has(m.id) }))
  const selected = messages.find(m => m.id === selectedId)

  const openMessage = (id: string) => {
    setSelectedId(id)
    setReadIds(prev => new Set(prev).add(id))
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text.primary, margin: '0 0 4px' }}>Messages</h2>
      <p style={{ fontSize: 12, color: T.text.muted, margin: '0 0 20px' }}>
        {messages.filter(m => !m.read).length} unread message{messages.filter(m => !m.read).length !== 1 ? 's' : ''}
      </p>

      {selected ? (
        <div>
          <button onClick={() => setSelectedId(null)} style={{
            fontSize: 12, color: T.accent.primary, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: 16, fontWeight: 600,
          }}>{'\u2190'} Back to inbox</button>
          <div style={{
            background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
            padding: 24, boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 8 }}>{selected.subject}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: T.text.secondary }}>{selected.from}</span>
              <span style={{ fontSize: 12, color: T.text.muted }}>{selected.date}</span>
            </div>
            <div style={{ fontSize: 14, color: T.text.primary, lineHeight: 1.7 }}>{selected.preview}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(msg => (
            <button key={msg.id} onClick={() => openMessage(msg.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
              background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              boxShadow: T.shadow, transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}>
              {/* Unread dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                background: msg.read ? 'transparent' : T.accent.primary,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 12, color: T.text.secondary,
                    fontWeight: msg.read ? 400 : 700,
                  }}>{msg.from}</span>
                  <span style={{ fontSize: 11, color: T.text.muted, flexShrink: 0 }}>{msg.date}</span>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: msg.read ? 400 : 700,
                  color: T.text.primary, marginBottom: 4,
                }}>{msg.subject}</div>
                <div style={{
                  fontSize: 12, color: T.text.muted, lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{msg.preview}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
