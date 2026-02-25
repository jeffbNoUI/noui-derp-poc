/**
 * Vendor member detail — IPR verification panel with formula transparency.
 * Shows earned service years (purchased excluded), pre/post-Medicare rates, and current IPR.
 * Consumed by: router.tsx (/vendor/member/:memberId route)
 * Depends on: vendor-demo-data.ts (IPR verifications, queue), useTheme, fmt
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { fmt } from '@/lib/constants'
import { vendorDemoApi, DEMO_ENROLLMENT_QUEUE } from '@/api/vendor-demo-data'
import type { IPRVerification, EnrollmentQueueItem } from '@/types/Vendor'

const TIER_COLORS: Record<number, { color: string; bg: string }> = {
  1: { color: '#1565c0', bg: 'rgba(21,101,192,0.08)' },
  2: { color: '#e65100', bg: 'rgba(230,81,0,0.08)' },
  3: { color: '#2e7d32', bg: 'rgba(46,125,50,0.08)' },
}

export function VendorMemberDetail() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = useParams<{ memberId: string }>()
  const [ipr, setIpr] = useState<IPRVerification | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Find the enrollment queue item for additional context
  const queueItem: EnrollmentQueueItem | undefined =
    DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === memberId)

  useEffect(() => {
    if (!memberId) return
    vendorDemoApi.getIPRVerification(memberId)
      .then(setIpr)
      .catch(() => setError(`No IPR verification data for member ${memberId}`))
  }, [memberId])

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: T.status.danger, marginBottom: 12 }}>{error}</div>
        <button onClick={() => navigate('/vendor')} style={{
          padding: '8px 16px', background: T.accent.primary, color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        }}>Back to Queue</button>
      </div>
    )
  }

  if (!ipr) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', textAlign: 'center', color: T.text.muted }}>
        Loading IPR verification...
      </div>
    )
  }

  const tierStyle = TIER_COLORS[ipr.tier] ?? TIER_COLORS[1]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      {/* Back link */}
      <button onClick={() => navigate('/vendor')} style={{
        background: 'none', border: 'none', color: T.accent.primary,
        cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 16, padding: 0,
      }}>Back to Queue</button>

      {/* Member header */}
      <div style={{
        background: T.surface.card, borderRadius: 10, padding: 20,
        border: `1px solid ${T.border.base}`, marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text.primary, margin: 0 }}>
            {ipr.member_name}
          </h1>
          <div style={{ fontSize: 12, color: T.text.muted, marginTop: 4 }}>
            Member ID: {ipr.member_id}
            {queueItem && ` | Retirement: ${queueItem.retirement_date}`}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: tierStyle.color,
          background: tierStyle.bg, padding: '4px 12px', borderRadius: 10,
        }}>Tier {ipr.tier}</span>
      </div>

      {/* IPR Verification Panel */}
      <div style={{
        background: T.surface.card, borderRadius: 10, padding: 24,
        border: `1px solid ${T.border.base}`, marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginTop: 0, marginBottom: 16 }}>
          IPR Verification
        </h2>
        <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 16 }}>
          Insurance Premium Reimbursement — RMC §18-412
        </div>

        {/* Earned service years */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: T.surface.cardAlt, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>
              Earned Service Years
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.accent.primary }}>
              {ipr.earned_service_years.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: T.status.warning, fontWeight: 500, marginTop: 4 }}>
              Purchased service excluded from IPR
            </div>
          </div>
          <div style={{ background: T.surface.cardAlt, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>
              Current Monthly IPR
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.accent.primary }}>
              {fmt(ipr.monthly_ipr)}
            </div>
            <div style={{ fontSize: 10, color: T.text.muted, fontWeight: 500, marginTop: 4 }}>
              Phase: {ipr.current_phase === 'pre_medicare' ? 'Pre-Medicare' : 'Post-Medicare'}
            </div>
          </div>
        </div>

        {/* Rate breakdown with formula transparency */}
        <div style={{
          background: T.surface.bg, borderRadius: 8, padding: 16,
          border: `1px solid ${T.border.subtle}`, marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary, marginBottom: 12 }}>
            Rate Calculation (RMC §18-412)
          </div>

          {/* Pre-Medicare */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>Pre-Medicare Rate</div>
              <div style={{ fontSize: 11, color: T.text.muted, fontFamily: 'monospace' }}>
                {ipr.earned_service_years.toFixed(2)} years x $12.50/mo = {fmt(ipr.pre_medicare_monthly)}/mo
              </div>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: ipr.current_phase === 'pre_medicare' ? T.accent.primary : T.text.muted,
            }}>
              {fmt(ipr.pre_medicare_monthly)}
              {ipr.current_phase === 'pre_medicare' && (
                <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6, color: T.status.success }}>ACTIVE</span>
              )}
            </div>
          </div>

          {/* Post-Medicare */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>Post-Medicare Rate</div>
              <div style={{ fontSize: 11, color: T.text.muted, fontFamily: 'monospace' }}>
                {ipr.earned_service_years.toFixed(2)} years x $6.25/mo = {fmt(ipr.post_medicare_monthly)}/mo
              </div>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: ipr.current_phase === 'post_medicare' ? T.accent.primary : T.text.muted,
            }}>
              {fmt(ipr.post_medicare_monthly)}
              {ipr.current_phase === 'post_medicare' && (
                <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6, color: T.status.success }}>ACTIVE</span>
              )}
            </div>
          </div>
        </div>

        {/* Medicare eligibility */}
        {ipr.medicare_eligible_date && (
          <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 16 }}>
            Medicare eligibility date: <strong>{ipr.medicare_eligible_date}</strong> (age 65)
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button style={{
            padding: '8px 20px', background: T.accent.primary, color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Verify IPR</button>
          <button style={{
            padding: '8px 20px', background: T.status.success, color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Confirm Enrollment</button>
          <button style={{
            padding: '8px 20px', background: 'transparent', color: T.status.danger,
            border: `1px solid ${T.status.danger}`, borderRadius: 6, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>Flag Issue</button>
        </div>
      </div>
    </div>
  )
}
