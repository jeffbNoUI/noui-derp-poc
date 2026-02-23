/**
 * Member portal Documents page — mock document library with retirement paperwork.
 * Shows documents with status badges (Received, Pending, Draft) per demo member.
 * Consumed by: router.tsx (/portal/documents route)
 * Depends on: useTheme (memberTheme), usePortalAuth (current member ID)
 */
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'

interface Document {
  id: string
  name: string
  type: string
  status: 'received' | 'pending' | 'draft' | 'signed'
  date: string
  description: string
}

const DOCUMENTS: Record<string, Document[]> = {
  '10001': [
    { id: 'd1', name: 'Retirement Application', type: 'PDF', status: 'received', date: '03-10-2026', description: 'Notarized retirement application for service retirement effective April 1, 2026.' },
    { id: 'd2', name: 'Benefit Estimate Letter', type: 'PDF', status: 'received', date: '03-12-2026', description: 'Official benefit estimate showing 75% J&S option at $5,857.89/month.' },
    { id: 'd3', name: 'Spousal Consent Form', type: 'PDF', status: 'signed', date: '03-10-2026', description: 'Elena Martinez consent for 75% Joint & Survivor election. Notarized.' },
    { id: 'd4', name: 'Leave Payout Verification', type: 'PDF', status: 'received', date: '03-14-2026', description: 'HR verification of $52,000 sick/vacation leave payout included in final month salary.' },
    { id: 'd5', name: 'Tax Withholding Election (W-4P)', type: 'PDF', status: 'pending', date: '', description: 'Federal tax withholding election for retirement benefit payments.' },
    { id: 'd6', name: 'Direct Deposit Authorization', type: 'PDF', status: 'pending', date: '', description: 'Bank account information for benefit payment deposit.' },
  ],
  '10002': [
    { id: 'd1', name: 'Retirement Application', type: 'PDF', status: 'received', date: '04-08-2026', description: 'Notarized retirement application for early retirement effective May 1, 2026.' },
    { id: 'd2', name: 'Benefit Estimate Letter', type: 'PDF', status: 'received', date: '04-10-2026', description: 'Official benefit estimate showing Maximum option at $1,633.07/month (after 30% reduction).' },
    { id: 'd3', name: 'Service Purchase Agreement', type: 'PDF', status: 'received', date: '04-11-2026', description: 'Verification of 3 years purchased service credit. Included in benefit, excluded from Rule of 75.' },
    { id: 'd4', name: 'Tax Withholding Election (W-4P)', type: 'PDF', status: 'draft', date: '', description: 'Federal tax withholding election for retirement benefit payments.' },
  ],
  '10003': [
    { id: 'd1', name: 'Retirement Application', type: 'PDF', status: 'received', date: '03-12-2026', description: 'Notarized retirement application for Tier 3 early retirement effective April 1, 2026.' },
    { id: 'd2', name: 'Benefit Estimate Letter', type: 'PDF', status: 'received', date: '03-16-2026', description: 'Official benefit estimate showing 50% J&S option at $1,491.47/month.' },
    { id: 'd3', name: 'Spousal Consent Form', type: 'PDF', status: 'pending', date: '', description: 'Maria Washington consent for 50% Joint & Survivor election. Requires notarization.' },
    { id: 'd4', name: 'Tax Withholding Election (W-4P)', type: 'PDF', status: 'draft', date: '', description: 'Federal tax withholding election for retirement benefit payments.' },
  ],
  '10004': [
    { id: 'd1', name: 'Retirement Application', type: 'PDF', status: 'received', date: '03-10-2026', description: 'Notarized retirement application for service retirement with DRO effective April 1, 2026.' },
    { id: 'd2', name: 'Domestic Relations Order', type: 'PDF', status: 'received', date: '03-13-2026', description: 'Court-certified DRO dividing benefit with Patricia Martinez. Marital fraction: 63.48%.' },
    { id: 'd3', name: 'DRO Benefit Division Letter', type: 'PDF', status: 'received', date: '03-15-2026', description: 'Net benefit after DRO: $4,370.62/month. Alternate payee benefit: $1,487.27/month.' },
    { id: 'd4', name: 'Spousal Consent Form', type: 'PDF', status: 'signed', date: '03-10-2026', description: 'Elena Martinez consent for 75% Joint & Survivor election. Notarized.' },
    { id: 'd5', name: 'Tax Withholding Election (W-4P)', type: 'PDF', status: 'pending', date: '', description: 'Federal tax withholding election for retirement benefit payments.' },
  ],
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  received: { label: 'Received', color: '#2e7d32', bg: '#e8f5e9' },
  signed: { label: 'Signed', color: '#2e7d32', bg: '#e8f5e9' },
  pending: { label: 'Pending', color: '#e65100', bg: '#fff3e0' },
  draft: { label: 'Draft', color: '#5a7878', bg: '#eef5f5' },
}

export function DocumentsPage() {
  const T = useTheme()
  const { memberId } = usePortalAuth()
  const docs = DOCUMENTS[memberId] ?? DOCUMENTS['10001']

  const received = docs.filter(d => d.status === 'received' || d.status === 'signed').length
  const pending = docs.filter(d => d.status === 'pending').length

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text.primary, margin: '0 0 4px' }}>Documents</h2>
      <p style={{ fontSize: 12, color: T.text.muted, margin: '0 0 20px' }}>
        {received} received &middot; {pending} pending
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => {
          const status = STATUS_CONFIG[doc.status]
          return (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
              background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
              boxShadow: T.shadow,
            }}>
              {/* File icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: T.accent.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: T.accent.primary,
              }}>{doc.type}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{doc.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: status.bg, color: status.color,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{status.label}</span>
                </div>
                <div style={{ fontSize: 12, color: T.text.muted, lineHeight: 1.5 }}>{doc.description}</div>
                {doc.date && (
                  <div style={{ fontSize: 11, color: T.text.dim, marginTop: 4 }}>
                    {doc.status === 'signed' ? 'Signed' : 'Received'}: {doc.date}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
