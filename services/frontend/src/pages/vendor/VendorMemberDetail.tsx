/**
 * Vendor member detail — IPR verification panel with formula transparency.
 * Shows earned service years (purchased excluded), pre/post-Medicare rates, and current IPR.
 * Full verification workflow: verify IPR, confirm enrollment, flag issues.
 * Consumed by: router.tsx (/vendor/member/:memberId route)
 * Depends on: vendor-demo-data.ts (IPR verifications, queue, mutations), useTheme, fmt
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { fmt } from '@/lib/constants'
import { useMember } from '@/hooks/useMember'
import { vendorDemoApi, DEMO_ENROLLMENT_QUEUE } from '@/api/vendor-demo-data'
import { KnowledgeSidebar, knowledgeColorsFromTheme } from '@/components/shared/knowledge'
import type { IPRVerification, EnrollmentQueueItem } from '@/types/Vendor'

const TIER_COLORS: Record<number, { color: string; bg: string }> = {
  1: { color: '#1565c0', bg: 'rgba(21,101,192,0.08)' },
  2: { color: '#e65100', bg: 'rgba(230,81,0,0.08)' },
  3: { color: '#2e7d32', bg: 'rgba(46,125,50,0.08)' },
}

type ActionStatus = 'idle' | 'verifying' | 'verified' | 'enrolling' | 'enrolled' | 'flagging' | 'flagged'

export function VendorMemberDetail() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = useParams<{ memberId: string }>()
  // Vendor member IDs (10001-10006) align with main demo fixtures
  const member = useMember(memberId ?? '')
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const [ipr, setIpr] = useState<IPRVerification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<ActionStatus>('idle')
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagText, setFlagText] = useState('')
  const [flaggedReason, setFlaggedReason] = useState('')

  // Find the enrollment queue item for additional context
  const queueItem: EnrollmentQueueItem | undefined =
    DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === memberId)

  // Seed initial status from queue item
  useEffect(() => {
    if (queueItem?.status === 'verified') setActionStatus('verified')
    else if (queueItem?.status === 'enrolled') setActionStatus('enrolled')
  }, [queueItem?.status])

  useEffect(() => {
    if (!memberId) return
    vendorDemoApi.getIPRVerification(memberId)
      .then(setIpr)
      .catch(() => setError(`No IPR verification data for member ${memberId}`))
  }, [memberId])

  const handleVerifyIPR = async () => {
    if (!memberId) return
    setActionStatus('verifying')
    await vendorDemoApi.updateEnrollmentStatus(memberId, 'verified')
    // Brief delay for UX feedback
    setTimeout(() => setActionStatus('verified'), 600)
  }

  const handleConfirmEnrollment = async () => {
    if (!memberId) return
    setActionStatus('enrolling')
    await vendorDemoApi.updateEnrollmentStatus(memberId, 'enrolled')
    setTimeout(() => setActionStatus('enrolled'), 600)
  }

  const handleFlagSubmit = async () => {
    if (!memberId || !flagText.trim()) return
    setActionStatus('flagging')
    await vendorDemoApi.updateEnrollmentStatus(memberId, 'declined')
    setFlaggedReason(flagText.trim())
    setFlagText('')
    setFlagModalOpen(false)
    setTimeout(() => setActionStatus('flagged'), 400)
  }

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

  // Action button states
  const isVerified = actionStatus === 'verified' || actionStatus === 'enrolled' || actionStatus === 'enrolling'
  const isEnrolled = actionStatus === 'enrolled'
  const isFlagged = actionStatus === 'flagged'

  return (
    <div style={{
      maxWidth: knowledgeOpen ? 1100 : 800, margin: '0 auto', padding: '24px 20px',
      display: 'flex', gap: 0, transition: 'max-width 0.3s ease',
    }}>
    <div style={{ flex: 1, minWidth: 0 }}>
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
            {queueItem?.assigned_at && ` | Assigned: ${new Date(queueItem.assigned_at).toLocaleDateString()}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Workflow status badge */}
          {(isVerified || isEnrolled || isFlagged) && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 10,
              color: isFlagged ? T.status.danger : isEnrolled ? T.status.success : T.status.info,
              background: isFlagged ? T.status.dangerBg : isEnrolled ? T.status.successBg : T.status.infoBg,
              textTransform: 'uppercase' as const, letterSpacing: 0.5,
            }}>
              {isFlagged ? 'Flagged' : isEnrolled ? 'Enrolled' : 'Verified'}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, color: tierStyle.color,
            background: tierStyle.bg, padding: '4px 12px', borderRadius: 10,
          }}>Tier {ipr.tier}</span>
        </div>
      </div>

      {/* Flagged issue banner */}
      {isFlagged && flaggedReason && (
        <div style={{
          background: T.status.dangerBg, borderRadius: 10, padding: 16, marginBottom: 20,
          border: `1px solid ${T.status.danger}30`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.status.danger, marginBottom: 4 }}>
            Issue Flagged
          </div>
          <div style={{ fontSize: 12, color: T.text.primary }}>{flaggedReason}</div>
          <div style={{ fontSize: 10, color: T.text.muted, marginTop: 6 }}>
            Flagged on {new Date().toLocaleDateString()} — pending resolution
          </div>
        </div>
      )}

      {/* Enrolled success banner */}
      {isEnrolled && (
        <div style={{
          background: T.status.successBg, borderRadius: 10, padding: 16, marginBottom: 20,
          border: `1px solid ${T.status.success}30`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.status.success, marginBottom: 4 }}>
            Enrollment Confirmed
          </div>
          <div style={{ fontSize: 12, color: T.text.primary }}>
            {ipr.member_name} has been enrolled with a monthly IPR of {fmt(ipr.monthly_ipr)}.
            Coverage is effective as of the retirement date.
          </div>
        </div>
      )}

      {/* IPR Verification Panel */}
      <div style={{
        background: T.surface.card, borderRadius: 10, padding: 24,
        border: `1px solid ${T.border.base}`, marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginTop: 0, marginBottom: 16 }}>
          IPR Verification
        </h2>
        <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 16 }}>
          Insurance Premium Reimbursement — C.R.S. §24-51-1201
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
            Rate Calculation (C.R.S. §24-51-1201)
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

        {/* Action buttons — state-driven */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {/* Verify IPR */}
          <button
            onClick={handleVerifyIPR}
            disabled={isVerified || isFlagged || actionStatus === 'verifying'}
            style={{
              padding: '8px 20px',
              background: isVerified ? T.status.successBg : actionStatus === 'verifying' ? T.border.subtle : T.accent.primary,
              color: isVerified ? T.status.success : actionStatus === 'verifying' ? T.text.muted : '#fff',
              border: isVerified ? `1px solid ${T.status.success}` : 'none',
              borderRadius: 6, cursor: isVerified || isFlagged ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 600, opacity: isFlagged ? 0.5 : 1,
            }}
          >
            {actionStatus === 'verifying' ? 'Verifying...' : isVerified ? '\u2713 IPR Verified' : 'Verify IPR'}
          </button>

          {/* Confirm Enrollment — only enabled after verification */}
          <button
            onClick={handleConfirmEnrollment}
            disabled={!isVerified || isEnrolled || isFlagged || actionStatus === 'enrolling'}
            style={{
              padding: '8px 20px',
              background: isEnrolled ? T.status.successBg
                : actionStatus === 'enrolling' ? T.border.subtle
                : isVerified && !isFlagged ? T.status.success : T.border.subtle,
              color: isEnrolled ? T.status.success
                : isVerified && !isFlagged ? '#fff' : T.text.muted,
              border: isEnrolled ? `1px solid ${T.status.success}` : 'none',
              borderRadius: 6,
              cursor: isVerified && !isEnrolled && !isFlagged ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {actionStatus === 'enrolling' ? 'Enrolling...' : isEnrolled ? '\u2713 Enrolled' : 'Confirm Enrollment'}
          </button>

          {/* Flag Issue */}
          <button
            onClick={() => setFlagModalOpen(true)}
            disabled={isEnrolled || isFlagged}
            style={{
              padding: '8px 20px', background: 'transparent',
              color: isFlagged ? T.text.muted : T.status.danger,
              border: `1px solid ${isFlagged ? T.border.subtle : T.status.danger}`,
              borderRadius: 6, cursor: isEnrolled || isFlagged ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 600,
              opacity: isEnrolled || isFlagged ? 0.5 : 1,
            }}
          >
            {isFlagged ? 'Issue Flagged' : 'Flag Issue'}
          </button>
        </div>
      </div>

      {/* Flag Issue Modal */}
      {flagModalOpen && (
        <>
          <div onClick={() => setFlagModalOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`,
            boxShadow: T.shadowLg, zIndex: 201, width: 420, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${T.border.subtle}`,
              fontSize: 14, fontWeight: 700, color: T.status.danger,
            }}>Flag Issue — {ipr.member_name}</div>
            <div style={{ padding: 20 }}>
              <div style={{
                fontSize: 11, color: T.text.muted, textTransform: 'uppercase' as const,
                letterSpacing: 0.5, fontWeight: 600, marginBottom: 6,
              }}>Describe the Issue</div>
              <textarea
                value={flagText}
                onChange={e => setFlagText(e.target.value)}
                placeholder="e.g., Earned service years do not match source records..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 6,
                  border: `1px solid ${T.border.base}`, background: T.surface.bg,
                  color: T.text.primary, fontFamily: 'inherit', resize: 'vertical' as const,
                  boxSizing: 'border-box' as const,
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                <button onClick={() => { setFlagModalOpen(false); setFlagText('') }} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12,
                  background: 'transparent', border: `1px solid ${T.border.base}`,
                  color: T.text.secondary, cursor: 'pointer',
                }}>Cancel</button>
                <button
                  onClick={handleFlagSubmit}
                  disabled={!flagText.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: flagText.trim() ? T.status.danger : T.border.subtle,
                    color: flagText.trim() ? '#fff' : T.text.muted,
                    border: 'none', cursor: flagText.trim() ? 'pointer' : 'default',
                  }}
                >Submit Flag</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    <KnowledgeSidebar
      collapsed={!knowledgeOpen}
      onToggle={() => setKnowledgeOpen(v => !v)}
      colors={knowledgeColorsFromTheme(T)}
      member={member.data}
    />
    </div>
  )
}
