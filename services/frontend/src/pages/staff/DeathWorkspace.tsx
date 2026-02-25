/**
 * Death processing workspace — sequential stage-by-stage death benefit processing.
 * Distinct from the retirement GuidedWorkspace: different data model (DeathStageProps),
 * different stages (notification → survivor → calculation → overpayment → installments → review).
 * Consumed by: StaffDeathView (via /staff/death/:memberId route)
 * Depends on: death stage components, death-survivor-demo-data.ts, theme (C, tierMeta, fmt)
 */
import { useState, useEffect, useCallback } from 'react'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import {
  deathSurvivorDemoApi,
  case9Member, case10Member,
} from '@/api/death-survivor-demo-data'
import type { Member } from '@/types/Member'

// ─── Member lookup for demo cases ────────────────────────────────────────
const DEATH_MEMBERS: Record<string, Member> = {
  '10009': case9Member,
  '10010': case10Member,
}
import type {
  DeathBenefitStatus,
  DeathProcessingSummary,
} from '@/types/DeathSurvivor'
import type { DeathStageProps } from './stages/death'
import {
  DeathNotification, SurvivorDetermination, SurvivorBenefitCalc,
  OverpaymentReview, DeathBenefitContinuation, DeathProcessingReview,
} from './stages/death'

// ─── Stage definitions ───────────────────────────────────────────────────

interface DeathStage {
  id: string
  title: string
  icon: string
  subtitle: string
  component: React.ComponentType<DeathStageProps>
}

const DEATH_STAGES: DeathStage[] = [
  { id: 'death-notification', title: 'Death Notification', icon: '\uD83D\uDCC4', subtitle: 'Record notification and verify certificate', component: DeathNotification },
  { id: 'survivor-determination', title: 'Survivor Determination', icon: '\uD83D\uDC65', subtitle: 'Identify survivors and beneficiaries', component: SurvivorDetermination },
  { id: 'survivor-benefit', title: 'Benefit Calculation', icon: '\uD83D\uDCB0', subtitle: 'Calculate survivor or refund amount', component: SurvivorBenefitCalc },
  { id: 'overpayment-review', title: 'Overpayment Review', icon: '\uD83D\uDD0D', subtitle: 'Detect and review post-death payments', component: OverpaymentReview },
  { id: 'death-benefit-installments', title: 'Death Benefit Installments', icon: '\uD83D\uDCC5', subtitle: 'Review installment election status', component: DeathBenefitContinuation },
  { id: 'processing-review', title: 'Final Review', icon: '\u2705', subtitle: 'Review all actions and close case', component: DeathProcessingReview },
]

// ─── Main Component ──────────────────────────────────────────────────────

export function DeathWorkspace({ memberId }: { memberId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<DeathBenefitStatus | null>(null)
  const [summary, setSummary] = useState<DeathProcessingSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setCurrentIndex(0)
    setConfirmed(new Set())
    deathSurvivorDemoApi.getDeathStatus(memberId)
      .then(setStatus)
      .catch((err: Error) => setError(err.message))
    deathSurvivorDemoApi.getProcessingSummary(memberId)
      .then(setSummary)
      .catch(() => {}) // summary may not exist for all members
  }, [memberId])

  const m = DEATH_MEMBERS[memberId] ?? null

  const handleConfirm = useCallback(() => {
    const stage = DEATH_STAGES[currentIndex]
    if (!stage || confirmed.has(stage.id)) return
    setConfirmed(prev => new Set(prev).add(stage.id))
    if (currentIndex < DEATH_STAGES.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, confirmed])

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.danger, fontSize: '12px' }}>{error}</div>
      </div>
    )
  }

  if (!status || !m) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: '12px' }}>Loading death processing data...</div>
      </div>
    )
  }

  const tc = tierMeta[m.tier] || tierMeta[1]
  const currentStage = DEATH_STAGES[currentIndex]
  const StageComponent = currentStage.component
  const allConfirmed = DEATH_STAGES.every(s => confirmed.has(s.id))

  // Build DeathStageProps from loaded data
  const stageProps: DeathStageProps = {
    member: m,
    deathRecord: status.death_record ?? undefined,
    survivorClaims: status.survivor_claims,
    deathBenefitElection: status.death_benefit_election ?? undefined,
    overpaymentInfo: summary?.overpayment,
    survivorBenefit: summary?.survivor_benefit,
    installments: summary?.death_benefit_installments,
    activeMemberDeath: summary?.active_member_death,
    processingSummary: summary ?? undefined,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
      {/* Member banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: `linear-gradient(135deg,${C.surface},${C.elevated})`,
        borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' as const, gap: '6px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '7px', background: tc.muted,
            border: `2px solid ${tc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: tc.color, fontSize: '10px',
          }}>T{m.tier}</div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: '13.5px' }}>{m.first_name} {m.last_name}</div>
            <div style={{ color: C.textSecondary, fontSize: '10px' }}>
              {m.member_id} {'\u00B7'} {m.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          <Badge text="Death Processing" bg={C.dangerMuted} color={C.danger} />
          <Badge text={tc.label} bg={tc.muted} color={tc.color} />
          <Badge text={status.death_record?.status ?? 'PENDING'} bg={C.warmMuted} color={C.warm} />
          {allConfirmed && <Badge text="Complete" bg={C.successMuted} color={C.success} />}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', padding: '0 16px', borderBottom: `1px solid ${C.borderSubtle}`,
        background: C.surface, flexShrink: 0,
      }}>
        {DEATH_STAGES.map((stage, i) => {
          const isActive = i === currentIndex
          const isDone = confirmed.has(stage.id)
          return (
            <button key={stage.id} onClick={() => setCurrentIndex(i)} style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
              background: 'transparent', position: 'relative',
              borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: isDone ? C.success : isActive ? C.accent : C.textDim,
                }} />
                <span style={{
                  fontSize: '9px', fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.accent : isDone ? C.success : C.textMuted,
                }}>{stage.title}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Stage title */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', background: C.elevated,
        borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px' }}>{currentStage.icon}</span>
        <span style={{ color: C.text, fontWeight: 600, fontSize: '13px' }}>{currentStage.title}</span>
        <span style={{ color: C.textMuted, fontSize: '11px', marginLeft: '4px' }}>
          {'\u2014'} {currentStage.subtitle}
        </span>
        <div style={{ flex: 1 }} />
        {confirmed.has(currentStage.id) && <Badge text="Confirmed" bg={C.successMuted} color={C.success} />}
      </div>

      {/* Stage content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <StageComponent {...stageProps} />
        </div>
      </div>

      {/* Bottom navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderTop: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          style={{
            padding: '7px 18px', borderRadius: '6px',
            border: `1px solid ${currentIndex === 0 ? C.borderSubtle : C.border}`,
            background: 'transparent',
            color: currentIndex === 0 ? C.textDim : C.textSecondary,
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            fontSize: '11.5px', fontWeight: 500,
          }}
        >{'\u2190'} Back</button>
        <button
          onClick={handleConfirm}
          disabled={confirmed.has(currentStage.id)}
          style={{
            padding: '7px 22px', borderRadius: '6px', border: 'none',
            background: confirmed.has(currentStage.id) ? C.borderSubtle : C.accent,
            color: confirmed.has(currentStage.id) ? C.textDim : '#fff',
            cursor: confirmed.has(currentStage.id) ? 'default' : 'pointer',
            fontSize: '11.5px', fontWeight: 600,
          }}
        >{confirmed.has(currentStage.id)
          ? '\u2713 Confirmed'
          : currentIndex === DEATH_STAGES.length - 1 ? 'Confirm & Close Case' : 'Confirm & Continue'
        }</button>
      </div>
    </div>
  )
}

