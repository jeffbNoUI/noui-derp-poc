/**
 * Contribution Refund workspace — sequential stage-by-stage refund processing.
 * Distinct from the retirement GuidedWorkspace: different data model (RefundCalculation),
 * different stages (eligibility → contributions → interest → options → [vested decision] → review).
 * Vested members see an additional Decision Moment stage comparing refund vs deferred pension.
 * Consumed by: StaffRefundView (via /staff/refund/:memberId route)
 * Depends on: refund stage components, refund-demo-data.ts, theme (C, tierMeta, fmt)
 */
import { useState, useEffect, useCallback } from 'react'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { refundDemoApi, DEMO_REFUND_MEMBERS } from '@/api/refund-demo-data'
import type { RefundCalculation } from '@/types/Refund'
import { RefundEligibility } from './stages/refund/RefundEligibility'
import { ContributionSummary } from './stages/refund/ContributionSummary'
import { InterestCalculation } from './stages/refund/InterestCalculation'
import { RefundOptions } from './stages/refund/RefundOptions'
import { VestedDecisionMoment } from './stages/refund/VestedDecisionMoment'
import { RefundReview } from './stages/refund/RefundReview'

// ─── Stage definitions ───────────────────────────────────────────────────

interface RefundStage {
  id: string
  title: string
  icon: string
  subtitle: string
  /** If present, stage is only shown when this returns true */
  conditional?: (calc: RefundCalculation) => boolean
}

const REFUND_STAGE_DEFS: RefundStage[] = [
  { id: 'refund-eligibility', title: 'Refund Eligibility', icon: '\u2705', subtitle: 'Verify termination, vesting, and waiting period' },
  { id: 'contribution-summary', title: 'Contribution Summary', icon: '\uD83D\uDCCA', subtitle: 'Review contribution accumulation history' },
  { id: 'interest-calculation', title: 'Interest Calculation', icon: '\uD83D\uDCB2', subtitle: 'Review interest compounding schedule' },
  { id: 'refund-options', title: 'Distribution Options', icon: '\uD83D\uDCE4', subtitle: 'Compare tax treatment by election type' },
  {
    id: 'vested-decision', title: 'Decision Moment', icon: '\u26A0\uFE0F',
    subtitle: 'Compare refund vs deferred pension benefit',
    conditional: (calc) => calc.eligibility.vested,
  },
  { id: 'refund-review', title: 'Final Review', icon: '\uD83D\uDCCB', subtitle: 'Review all amounts and confirm' },
]

// ─── Main Component ──────────────────────────────────────────────────────

export function RefundWorkspace({ memberId }: { memberId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [calc, setCalc] = useState<RefundCalculation | null>(null)
  const [error, setError] = useState('')

  const m = DEMO_REFUND_MEMBERS[memberId] ?? null

  useEffect(() => {
    setCurrentIndex(0)
    setConfirmed(new Set())
    setCalc(null)
    refundDemoApi.calculateRefund(memberId)
      .then(setCalc)
      .catch((err: Error) => setError(err.message))
  }, [memberId])

  // Filter stages based on conditions (vested decision only for vested members)
  const stages = calc
    ? REFUND_STAGE_DEFS.filter(s => !s.conditional || s.conditional(calc))
    : REFUND_STAGE_DEFS.filter(s => !s.conditional) // show non-conditional while loading

  const handleConfirm = useCallback(() => {
    const stage = stages[currentIndex]
    if (!stage || confirmed.has(stage.id)) return
    setConfirmed(prev => new Set(prev).add(stage.id))
    if (currentIndex < stages.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, confirmed, stages])

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.danger, fontSize: '12px' }}>{error}</div>
      </div>
    )
  }

  if (!m || !calc) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: '12px' }}>Loading refund data...</div>
      </div>
    )
  }

  const tc = tierMeta[m.tier] || tierMeta[1]
  const currentStage = stages[currentIndex]
  const allConfirmed = stages.every(s => confirmed.has(s.id))

  // ─── Render current stage with its specific props ────────────────────
  function renderStage() {
    if (!calc || !m) return null
    switch (currentStage.id) {
      case 'refund-eligibility':
        return (
          <RefundEligibility
            eligibility={calc.eligibility}
            memberName={`${m.first_name} ${m.last_name}`}
            terminationDate={m.termination_date ?? ''}
          />
        )
      case 'contribution-summary':
        return <ContributionSummary contributions={calc.contributions} />
      case 'interest-calculation':
        return (
          <InterestCalculation
            interest={calc.interest}
            contributionTotal={calc.contributions.total_contributions}
          />
        )
      case 'refund-options':
        return <RefundOptions taxOptions={calc.tax_options} />
      case 'vested-decision':
        if (!calc.deferred_comparison) return null
        return (
          <VestedDecisionMoment
            comparison={calc.deferred_comparison}
            serviceYears={calc.eligibility.service_years}
            memberAge={calcAge(m.date_of_birth)}
          />
        )
      case 'refund-review':
        return (
          <RefundReview
            calculation={calc}
            memberName={`${m.first_name} ${m.last_name}`}
          />
        )
      default:
        return null
    }
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
              {m.member_id} {'\u00B7'} {m.department} {'\u00B7'} Terminated {m.termination_date}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <Badge text="Contribution Refund" bg={C.warmMuted} color={C.warm} />
          <Badge text={tc.label} bg={tc.muted} color={tc.color} />
          <Badge text={calc.eligibility.vested ? 'Vested' : 'Non-Vested'} bg={calc.eligibility.vested ? C.dangerMuted : C.accentMuted} color={calc.eligibility.vested ? C.danger : C.accent} />
          {allConfirmed && <Badge text="Complete" bg={C.successMuted} color={C.success} />}
          {/* Gross refund amount */}
          <div style={{
            padding: '4px 12px', borderRadius: '6px', background: C.accentMuted,
            border: `1px solid ${C.accentSolid}`, textAlign: 'right' as const,
          }}>
            <div style={{ color: C.textMuted, fontSize: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.8px' }}>Gross Refund</div>
            <div style={{
              color: C.accent, fontWeight: 700, fontFamily: "'SF Mono',monospace", fontSize: '15px',
            }}>{fmt(calc.gross_refund)}</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', padding: '0 16px', borderBottom: `1px solid ${C.borderSubtle}`,
        background: C.surface, flexShrink: 0,
      }}>
        {stages.map((stage, i) => {
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
          {renderStage()}
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
          : currentIndex === stages.length - 1 ? 'Confirm & Process Refund' : 'Confirm & Continue'
        }</button>
      </div>
    </div>
  )
}

/** Calculate age from date of birth */
function calcAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}
