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
  '10001': [
    { id: 'm1', from: 'DERP Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear Robert, we have received your retirement application dated March 10, 2026. Your assigned analyst will review your package within 5 business days...', date: '03-10-2026', read: true },
    { id: 'm2', from: 'DERP Benefits Team', subject: 'Benefit Estimate Available', preview: 'Your estimated monthly benefit under the 75% Joint & Survivor option is $5,857.89. This estimate is based on your current AMS of $11,218.33...', date: '03-12-2026', read: true },
    { id: 'm3', from: 'DERP Document Center', subject: 'Leave Payout Verification Complete', preview: 'Your leave payout of $52,000 has been verified against HR records and included in your final month compensation for AMS calculation...', date: '03-14-2026', read: false },
    { id: 'm4', from: 'DERP Benefits Team', subject: 'Action Required: Confirm Payment Election', preview: 'Please review and confirm your 75% Joint & Survivor election before your retirement effective date of April 1, 2026. This election is irrevocable...', date: '03-15-2026', read: false },
  ],
  '10002': [
    { id: 'm1', from: 'DERP Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear Jennifer, we have received your retirement application dated April 8, 2026. Your early retirement package is being reviewed...', date: '04-08-2026', read: true },
    { id: 'm2', from: 'DERP Benefits Team', subject: 'Early Retirement Reduction Notice', preview: 'As a Tier 2 member retiring at age 55, a permanent reduction of 30% (3% per year for 10 years under age 65) will apply to your benefit...', date: '04-10-2026', read: true },
    { id: 'm3', from: 'DERP Document Center', subject: 'Purchased Service Credit Confirmed', preview: 'Your 3 years of purchased service credit has been verified and included in your benefit calculation. Note: purchased service is excluded from Rule of 75...', date: '04-11-2026', read: false },
  ],
  '10003': [
    { id: 'm1', from: 'DERP Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear David, we have received your retirement application dated March 12, 2026. As a Tier 3 member, your 60-month AMS window is being calculated...', date: '03-12-2026', read: true },
    { id: 'm2', from: 'DERP Benefits Team', subject: 'Spousal Consent Form Required', preview: 'Your election of the 50% Joint & Survivor option requires spousal consent documentation. Please submit the notarized DERP Spousal Consent form...', date: '03-14-2026', read: false },
    { id: 'm3', from: 'DERP Benefits Team', subject: 'Benefit Calculation Complete', preview: 'Your Tier 3 early retirement benefit has been calculated. Unreduced: $1,784.06/month. After 12% reduction (6% x 2 years): $1,569.97/month...', date: '03-16-2026', read: false },
  ],
  '10004': [
    { id: 'm1', from: 'DERP Benefits Team', subject: 'Your Retirement Application Has Been Received', preview: 'Dear Robert, we have received your retirement application. Please note that an active Domestic Relations Order is on file for your account...', date: '03-10-2026', read: true },
    { id: 'm2', from: 'DERP Legal Services', subject: 'DRO Division Calculation', preview: 'The marital share calculation for DRO case #DRO-2017-0891 has been completed. Marital fraction: 63.48%. Alternate payee benefit: $1,487.27/month...', date: '03-13-2026', read: true },
    { id: 'm3', from: 'DERP Benefits Team', subject: 'DRO Net Benefit Summary', preview: 'After DRO division, your net monthly benefit under the 75% J&S option is $4,370.62. A separate notification has been sent to the alternate payee...', date: '03-15-2026', read: false },
  ],
}

export function MessagesPage() {
  const T = useTheme()
  const { memberId } = usePortalAuth()
  const baseMessages = MESSAGES[memberId] ?? MESSAGES['10001']
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
