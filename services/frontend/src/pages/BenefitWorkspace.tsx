import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useMember, useServiceCredit, useDROs } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, usePaymentOptions, useDROCalculation, useSaveElection } from '@/hooks/useCalculations'
import type { BenefitResult, ServiceCreditSummary, DROResult, PaymentOptionsResult } from '@/types/Member'
import { C, tierMeta, fmt } from '@/theme'

// ─── Default retirement dates per demo case ─────────────────────
const DEFAULT_DATES: Record<string, string> = {
  '10001': '2026-04-01', '10002': '2026-05-01',
  '10003': '2026-04-01', '10004': '2026-04-01',
}

// ─── Supplemental salary period data for demo display ───────────
const SALARY_ROWS: Record<string, { period: string; months: number; monthly: number }[]> = {
  '10001': [
    { period: '2023 (Apr-Dec)', months: 9, monthly: 8792.75 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 9144.50 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 9420.25 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 9702.83 },
  ],
  '10002': [
    { period: '2023 (May-Dec)', months: 8, monthly: 7007.42 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 7287.75 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 7506.33 },
    { period: '2026 (Jan-Apr)', months: 4, monthly: 7731.50 },
  ],
  '10003': [
    { period: '2021 (Apr-Dec)', months: 9, monthly: 6250.00 },
    { period: '2022 (Jan-Dec)', months: 12, monthly: 6437.50 },
    { period: '2023 (Jan-Dec)', months: 12, monthly: 6695.00 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 6962.80 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 7171.67 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 7386.82 },
  ],
  '10004': [
    { period: '2023 (Apr-Dec)', months: 9, monthly: 8792.75 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 9144.50 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 9420.25 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 9702.83 },
  ],
}

const LEAVE_PAYOUTS: Record<string, number> = {
  '10001': 52000, '10002': 0, '10003': 0, '10004': 52000,
}

const AMS_NO_LEAVE: Record<string, number> = {
  '10001': 9194.45, '10004': 9194.45,
}

// ─── Micro Components ───────────────────────────────────────────

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const,
      lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}

function Field({ label, value, highlight, badge, sub }: {
  label: string; value: string; highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null; sub?: string | null
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ color: C.textSecondary, fontSize: '12px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {badge && <Badge {...badge} />}
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '12px',
          textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
        }}>{value}</span>
      </span>
    </div>
  )
}

function Callout({ type = 'info', title, children }: {
  type?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: ReactNode
}) {
  const s = {
    info: { bg: C.accentMuted, bd: C.accentSolid, c: C.accent },
    success: { bg: C.successMuted, bd: C.successBorder, c: C.success },
    warning: { bg: C.warmMuted, bd: C.warmBorder, c: C.warm },
    danger: { bg: C.dangerMuted, bd: C.dangerBorder, c: C.danger },
  }[type]
  return (
    <div style={{
      padding: '8px 10px', background: s.bg, borderRadius: '6px',
      border: `1px solid ${s.bd}`, marginTop: '6px',
    }}>
      {title && <div style={{ color: s.c, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
      <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>{children}</div>
    </div>
  )
}

// ─── Panel Component ────────────────────────────────────────────

function Panel({ id, title, icon, isConfirmed, isFocused, alert, onFocus, onConfirm, children }: {
  id: string; title: string; icon: string; isConfirmed: boolean; isFocused: boolean
  alert?: string | null; onFocus: (id: string) => void
  onConfirm: (id: string, toggle?: boolean) => void; children: ReactNode
}) {
  const borderColor = isFocused ? C.accent : isConfirmed ? C.success : alert ? C.danger : C.borderSubtle
  return (
    <div onClick={() => !isFocused && onFocus(id)} style={{
      background: C.surface, borderRadius: '8px',
      border: `1px solid ${borderColor}`,
      boxShadow: isFocused ? `0 0 0 1px ${C.accent}22, 0 4px 20px rgba(0,0,0,0.3)` : 'none',
      marginBottom: '8px', overflow: 'hidden', transition: 'all 0.2s',
      cursor: isFocused ? 'default' : 'pointer',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: isFocused ? C.elevated : 'transparent',
        borderBottom: isFocused ? `1px solid ${C.borderSubtle}` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ color: isFocused ? C.text : C.textSecondary, fontWeight: 600, fontSize: '12.5px' }}>{title}</span>
          {alert && !isConfirmed && <Badge text={alert} bg={C.dangerMuted} color={C.danger} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isConfirmed && <Badge text="Confirmed" bg={C.successMuted} color={C.success} />}
          {!isConfirmed && !isFocused && <Badge text="Needs review" bg={C.warmMuted} color={C.warm} />}
        </div>
      </div>
      {isFocused && (
        <div style={{ padding: '10px 12px' }}>
          {children}
          {!isConfirmed && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={e => { e.stopPropagation(); onConfirm(id) }} style={{
                padding: '6px 18px', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
                color: C.bg, fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: `0 2px 8px ${C.accentGlow}`,
              }}>Confirm ✓</button>
            </div>
          )}
          {isConfirmed && (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.success, fontSize: '11px', fontWeight: 600 }}>✓ Confirmed</span>
              <button onClick={e => { e.stopPropagation(); onConfirm(id, true) }} style={{
                padding: '4px 12px', borderRadius: '5px', border: `1px solid ${C.border}`,
                background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '10.5px',
              }}>Edit</button>
            </div>
          )}
        </div>
      )}
      {!isFocused && (
        <div style={{ padding: '6px 12px 8px', fontSize: '11px', color: C.textMuted }}>
          {isConfirmed ? <span style={{ color: C.success }}>✓ Data confirmed</span> : 'Click to review and confirm'}
        </div>
      )}
    </div>
  )
}

// ─── Salary Table ───────────────────────────────────────────────

function SalaryTable({ memberId, windowMonths, leavePayout }: {
  memberId: string; windowMonths: number; leavePayout: number
}) {
  const rows = SALARY_ROWS[memberId] || []
  if (rows.length === 0) return null
  return (
    <div style={{ margin: '6px 0', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
        padding: '5px 8px', background: C.elevated, fontSize: '9px',
        textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: C.textMuted, fontWeight: 600,
      }}>
        <span>Period</span><span style={{ textAlign: 'right' }}>Mo</span>
        <span style={{ textAlign: 'right' }}>Monthly</span><span style={{ textAlign: 'right' }}>Subtotal</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
          padding: '4px 8px', fontSize: '10.5px', borderTop: `1px solid ${C.borderSubtle}`,
          background: i === rows.length - 1 && leavePayout > 0 ? C.warmMuted : 'transparent',
        }}>
          <span style={{ color: C.text }}>{r.period}</span>
          <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{r.months}</span>
          <span style={{ textAlign: 'right', color: C.text, fontFamily: 'monospace' }}>{fmt(r.monthly)}</span>
          <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{fmt(r.months * r.monthly)}</span>
        </div>
      ))}
      {leavePayout > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
          padding: '4px 8px', fontSize: '10.5px', borderTop: `1px solid ${C.warmBorder}`, background: C.warmMuted,
        }}>
          <span style={{ color: C.warm, fontWeight: 600 }}>+ Leave Payout</span><span /><span />
          <span style={{ textAlign: 'right', color: C.warm, fontFamily: 'monospace', fontWeight: 600 }}>+{fmt(leavePayout)}</span>
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
        padding: '5px 8px', fontSize: '10.5px', background: C.elevated,
        borderTop: `1px solid ${C.border}`, fontWeight: 600,
      }}>
        <span style={{ color: C.text }}>Total</span>
        <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{windowMonths}</span>
        <span />
        <span style={{ textAlign: 'right', color: C.accent, fontFamily: 'monospace' }}>
          {fmt(rows.reduce((s, r) => s + r.months * r.monthly, 0) + leavePayout)}
        </span>
      </div>
    </div>
  )
}

// ─── Summary Row ────────────────────────────────────────────────

function SumRow({ label, value, done, color }: {
  label: string; value: string; done: boolean; color?: string
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      opacity: done ? 1 : 0.45, transition: 'opacity 0.3s',
    }}>
      <span style={{ color: C.textSecondary, fontSize: '11px' }}>{label}</span>
      <span style={{ color: color || C.text, fontFamily: 'monospace', fontSize: '11px', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

// ─── Live Summary Sidebar ───────────────────────────────────────

function LiveSummary({
  confirmed, panelCount, ben, opts, dro, sc, electedOption,
  leavePayout, tc, ruleType, ruleSum, ruleMet, reductionPct, onSave,
}: {
  confirmed: Set<string>; panelCount: number
  ben?: BenefitResult; opts?: PaymentOptionsResult; dro?: DROResult
  sc?: ServiceCreditSummary; electedOption: string; leavePayout: number
  tc: { color: string; muted: string; label: string; sub: string }
  ruleType: string; ruleSum: number; ruleMet: boolean; reductionPct: number
  onSave: () => void
}) {
  const allDone = confirmed.size >= panelCount
  const elOpt = opts?.options.find(o => o.option_type === electedOption)
  const monthlyBenefit = elOpt?.monthly_amount ?? ben?.net_monthly_benefit ?? 0
  const survivorAmt = elOpt && elOpt.survivor_pct
    ? elOpt.monthly_amount * (elOpt.survivor_pct / 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          color: C.textDim, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.5px', fontWeight: 600,
        }}>Live Calculation</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {/* Hero benefit amount */}
        <div style={{
          textAlign: 'center' as const, padding: '14px 8px', background: C.accentMuted,
          borderRadius: '8px', border: `1px solid ${C.accentSolid}`, marginBottom: '10px',
        }}>
          <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            {dro ? 'Monthly (after DRO)' : 'Monthly Benefit'}
          </div>
          <div style={{
            color: confirmed.has('benefit') ? C.accent : C.textMuted,
            fontSize: '26px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px',
            textShadow: confirmed.has('benefit') ? `0 0 25px ${C.accentGlow}` : 'none',
            opacity: confirmed.has('benefit') ? 1 : 0.5,
          }}>
            {fmt(monthlyBenefit)}
          </div>
          {ben && (
            <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '2px' }}>
              {ben.formula_display?.split('=')[0]?.trim()}
            </div>
          )}
          {!confirmed.has('benefit') && (
            <div style={{ color: C.warm, fontSize: '9px', marginTop: '4px', fontStyle: 'italic' }}>Pending confirmation</div>
          )}
        </div>

        {/* Line items */}
        <div style={{ fontSize: '11px' }}>
          <SumRow label={tc.label} value={tc.sub} done={confirmed.has('elig')} color={tc.color} />
          <SumRow label={ruleType} value={`${ruleSum.toFixed(2)} ${ruleMet ? '✓' : '✕'}`}
            done={confirmed.has('confirm')} color={ruleMet ? C.success : C.danger} />
          {reductionPct > 0 && <SumRow label="Reduction" value={`${reductionPct}%`} done={confirmed.has('elig')} color={C.danger} />}
          {ben && <SumRow label="AMS" value={fmt(ben.ams)} done={confirmed.has('salary')} />}
          {leavePayout > 0 && <SumRow label="Leave Payout" value={fmt(leavePayout)} done={confirmed.has('salary')} color={C.warm} />}
          {sc && sc.purchased_service_years > 0 && (
            <SumRow label="Purchased Svc" value={`${sc.purchased_service_years}y`} done={confirmed.has('purch')} color={C.warm} />
          )}
          {ben && <SumRow label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}%`} done={confirmed.has('benefit')} />}
          {ben && <SumRow label="Service" value={`${ben.service_years_for_benefit}y`} done={confirmed.has('benefit')} />}

          {dro && (<>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <SumRow label="DRO Split" value={fmt(dro.alternate_payee_amount)} done={confirmed.has('dro')} color="#A855F7" />
            <SumRow label="After DRO" value={fmt(dro.member_net_after_dro)} done={confirmed.has('dro')} />
          </>)}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
          {elOpt && <SumRow label="Option" value={elOpt.option_name} done={confirmed.has('payment')} />}
          {survivorAmt > 0 && <SumRow label="Survivor" value={`${fmt(survivorAmt)}/mo`} done={confirmed.has('payment')} />}
          {ben?.ipr && <SumRow label="IPR" value={fmt(ben.ipr.monthly_amount)} done={confirmed.has('ipr')} />}
        </div>
      </div>

      {/* Progress + actions */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: C.textMuted, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Progress</span>
          <span style={{ color: allDone ? C.success : C.textMuted, fontSize: '10px', fontWeight: 600 }}>
            {confirmed.size} / {panelCount}
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: C.border, overflow: 'hidden' }}>
          <div style={{
            width: `${(confirmed.size / panelCount) * 100}%`,
            height: '100%', borderRadius: '2px',
            background: allDone ? C.success : `linear-gradient(90deg,${C.accent},#06B6D4)`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {allDone && (
          <button onClick={onSave} style={{
            width: '100%', marginTop: '8px', padding: '8px', borderRadius: '6px', border: 'none',
            background: `linear-gradient(135deg,${C.success},#059669)`,
            color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
          }}>
            Save & Submit
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Workspace Component ───────────────────────────────────

export function BenefitWorkspace({ memberId }: { memberId: string }) {
  const [retirementDate, setRetirementDate] = useState(DEFAULT_DATES[memberId] || '')
  const [confirmed, setConfirmed] = useState(new Set<string>())
  const [focused, setFocused] = useState('confirm')
  const [electedOption, setElectedOption] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [savedCaseId, setSavedCaseId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Data hooks
  const member = useMember(memberId)
  const serviceCredit = useServiceCredit(memberId)
  const dros = useDROs(memberId)
  const eligibility = useEligibility(memberId, retirementDate)
  const benefit = useBenefitCalculation(memberId, retirementDate)
  const paymentOptions = usePaymentOptions(memberId, retirementDate)
  const hasDRO = !!dros.data && dros.data.length > 0
  const droCalc = useDROCalculation(memberId, retirementDate !== '' && hasDRO)
  const saveElection = useSaveElection()

  // Reset state when member changes
  useEffect(() => {
    setRetirementDate(DEFAULT_DATES[memberId] || '')
    setConfirmed(new Set())
    setFocused('confirm')
    setElectedOption('')
    setSaveStatus('idle')
    setSaveError('')
    setSavedCaseId(null)
  }, [memberId])

  // Set default elected option when payment options load
  useEffect(() => {
    if (paymentOptions.data && !electedOption) {
      setElectedOption(hasDRO ? 'j&s_75' : 'maximum')
    }
  }, [paymentOptions.data, electedOption, hasDRO])

  // Shorthand
  const m = member.data
  const sc = serviceCredit.data
  const elig = eligibility.data
  const ben = benefit.data
  const opts = paymentOptions.data
  const dro = hasDRO ? droCalc.data : undefined

  const handleConfirm = useCallback((id: string, toggle?: boolean) => {
    setConfirmed(prev => {
      const next = new Set(prev)
      if (toggle && next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!ben || !elig) return
    setSaveStatus('saving')
    setSaveError('')
    const elOpt = opts?.options.find(o => o.option_type === (electedOption || (hasDRO ? 'j&s_75' : 'maximum')))
    saveElection.mutate({
      member_id: memberId,
      retirement_date: retirementDate,
      payment_option: elOpt?.option_type ?? 'maximum',
      monthly_benefit: elOpt?.monthly_amount ?? ben.net_monthly_benefit,
      gross_benefit: ben.gross_monthly_benefit,
      reduction_factor: elig.reduction_factor,
      dro_deduction: dro?.alternate_payee_amount,
      ipr_amount: ben.ipr?.monthly_amount,
      death_benefit_amount: ben.death_benefit?.amount,
    }, {
      onSuccess: (result) => {
        setSaveStatus('saved')
        setSavedCaseId(result.case_id)
      },
      onError: (err) => {
        setSaveStatus('error')
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
      },
    })
  }, [memberId, retirementDate, ben, elig, electedOption, hasDRO, opts, dro, saveElection])

  if (!m) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: '12px' }}>Loading member data...</div>
      </div>
    )
  }

  const tc = tierMeta[m.tier] || tierMeta[1]
  const leavePayout = LEAVE_PAYOUTS[memberId] || 0
  const isLeaveEligible = m.tier <= 2 && new Date(m.hire_date) < new Date('2010-01-01')

  // Derived eligibility values
  const age = elig?.age_at_retirement ?? 0
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'
  const ruleTarget = m.tier === 3 ? 85 : 75
  const ruleSum = elig?.rule_of_n_value ?? 0
  const ruleMet = elig?.retirement_type === 'rule_of_75' || elig?.retirement_type === 'rule_of_85'
  const reductionPct = elig ? Math.round((1 - elig.reduction_factor) * 100) : 0
  const yrsUnder65 = elig ? Math.max(0, 65 - elig.age_at_retirement) : 0
  const reductionRate = m.tier === 3 ? 6 : 3

  // Build panel list (composition engine)
  const panelIds: string[] = ['confirm', 'elig']
  if (sc && sc.purchased_service_years > 0) panelIds.push('purch')
  panelIds.push('salary', 'benefit')
  if (hasDRO) panelIds.push('dro')
  panelIds.push('payment', 'ipr')

  // Elected option
  const elOpt = electedOption || (hasDRO ? 'j&s_75' : 'maximum')

  // Flags for banner chips
  const flags: { l: string; v: string; c: string }[] = [
    { l: 'Retiring', v: retirementDate.slice(5), c: C.accent },
    { l: tc.label, v: tc.sub, c: tc.color },
  ]
  if (hasDRO) flags.push({ l: 'DRO', v: 'Active', c: '#A855F7' })
  if (reductionPct > 0) flags.push({ l: 'Reduction', v: `${reductionPct}%`, c: C.danger })
  if (leavePayout > 0) flags.push({ l: 'Leave', v: fmt(leavePayout), c: C.warm })
  if (sc && sc.purchased_service_years > 0) flags.push({ l: 'Purch Svc', v: `${sc.purchased_service_years}y`, c: C.warm })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
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
              {m.member_id} · Age {age || '—'} · {sc?.total_service_years ?? '—'}y · {m.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          {flags.map(t => (
            <div key={t.l} style={{
              padding: '2px 7px', borderRadius: '4px', background: C.surface,
              border: `1px solid ${C.borderSubtle}`, fontSize: '9.5px',
            }}>
              <span style={{ color: C.textMuted }}>{t.l} </span>
              <span style={{ color: t.c, fontWeight: 600 }}>{t.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', background: C.surface,
        borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
          {panelIds.map(id => (
            <div key={id} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: confirmed.has(id) ? C.success : id === focused ? C.accent : C.border,
              transition: 'background 0.3s',
              boxShadow: id === focused ? `0 0 6px ${C.accentGlow}` : 'none',
            }} />
          ))}
        </div>
        <span style={{
          color: confirmed.size === panelIds.length ? C.success : C.textMuted,
          fontSize: '10px', fontWeight: 600, flexShrink: 0,
        }}>
          {confirmed.size}/{panelIds.length}
        </span>
      </div>

      {/* Save status banner */}
      {saveStatus !== 'idle' && (
        <div style={{
          padding: '6px 14px',
          background: saveStatus === 'saved' ? C.successMuted : saveStatus === 'error' ? C.dangerMuted : C.accentMuted,
          borderBottom: `1px solid ${saveStatus === 'saved' ? C.successBorder : saveStatus === 'error' ? C.dangerBorder : C.accentSolid}`,
          fontSize: '11px', fontWeight: 600, flexShrink: 0,
          color: saveStatus === 'saved' ? C.success : saveStatus === 'error' ? C.danger : C.accent,
        }}>
          {saveStatus === 'saving' && 'Saving to database...'}
          {saveStatus === 'saved' && `✓ Saved successfully — retirement application submitted. Case #${savedCaseId ?? ''} created for review.`}
          {saveStatus === 'error' && `✕ Save failed: ${saveError}`}
        </div>
      )}

      {/* Workspace: panels + sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* PANELS (scrollable) */}
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '10px 14px 60px' }}>

          {/* ─── Panel: Confirm Retirement ─── */}
          <Panel id="confirm" title="Confirm Retirement" icon="📋"
            isConfirmed={confirmed.has('confirm')} isFocused={focused === 'confirm'}
            alert={reductionPct > 0 ? `${reductionPct}% reduction` : null}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {elig ? (<>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
                borderBottom: `1px solid ${C.borderSubtle}`,
              }}>
                <span style={{ color: C.textSecondary, fontSize: '12px', flex: 1 }}>Retirement Date</span>
                <input type="date" value={retirementDate}
                  onChange={e => setRetirementDate(e.target.value)}
                  style={{
                    background: C.elevated, border: `1px solid ${C.border}`, borderRadius: '4px',
                    color: C.accent, padding: '3px 8px', fontSize: '12px', fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
              <Field label="Type" value="Service Retirement" />
              <Field label="Age at Retirement" value={`${age} years`} />
              <Field label="Years of Service" value={`${sc?.total_service_years ?? 0} years`} />
              <Field label={ruleType} value={ruleSum.toFixed(2)} highlight={ruleMet}
                badge={{ text: ruleMet ? 'Met' : 'Not Met', bg: ruleMet ? C.successMuted : C.dangerMuted, color: ruleMet ? C.success : C.danger }} />
              <Field label="Reduction" value={reductionPct === 0 ? 'None' : `${reductionPct}%`}
                badge={reductionPct > 0 ? { text: `${yrsUnder65}y under 65`, bg: C.dangerMuted, color: C.danger } : null} />
              {ruleMet
                ? <Callout type="success" title={`${ruleType} Satisfied`}>Age {age} + Service {sc?.total_for_eligibility ?? 0} = {ruleSum.toFixed(2)} ≥ {ruleTarget}. No reduction.</Callout>
                : <Callout type="danger" title="Early Retirement Reduction">{yrsUnder65} years × {reductionRate}%/yr = {reductionPct}% reduction. Member receives {100 - reductionPct}% of benefit.</Callout>
              }
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading eligibility...</div>}
          </Panel>

          {/* ─── Panel: Eligibility ─── */}
          <Panel id="elig" title="Eligibility Determination" icon="✓"
            isConfirmed={confirmed.has('elig')} isFocused={focused === 'elig'}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {elig && sc ? (<>
              <Field label="Tier" value={tc.label} badge={{ text: tc.sub, bg: tc.muted, color: tc.color }} />
              <Field label="Vested" value={`Yes — ${sc.earned_service_years}y earned`}
                badge={{ text: 'Met', bg: C.successMuted, color: C.success }} />
              {sc.purchased_service_years > 0 && (
                <Field label="Purchased Service" value={`${sc.purchased_service_years} years`}
                  sub="Included in benefit, excluded from eligibility"
                  badge={{ text: 'Excluded', bg: C.warmMuted, color: C.warm }} />
              )}
              <Field label={ruleType} value={`${ruleSum.toFixed(2)} ${ruleMet ? '≥' : '<'} ${ruleTarget}`}
                highlight={ruleMet}
                badge={{ text: ruleMet ? 'Met' : 'Not Met', bg: ruleMet ? C.successMuted : C.dangerMuted, color: ruleMet ? C.success : C.danger }} />
              <Field label={`Min Age (${m.tier === 3 ? 60 : 55})`} value={`${age} — Met`}
                badge={{ text: 'Met', bg: C.successMuted, color: C.success }} />
              <Field label="Benefit Reduction" value={reductionPct === 0 ? '0%' : `${reductionPct}%`} highlight={reductionPct === 0} />
              <Field label="Leave Payout"
                value={isLeaveEligible ? (leavePayout > 0 ? `Yes — ${fmt(leavePayout)}` : 'Eligible — none claimed') : 'Not eligible'}
                sub={isLeaveEligible ? 'Hired before Jan 1, 2010' : 'Hired after Jan 1, 2010'} />
              {sc.purchased_service_years > 0 && (
                <Callout type="warning" title="Purchased Service Exclusion">
                  If counted: {age} + {sc.total_service_years} = {(age + sc.total_service_years).toFixed(2)} — would qualify.
                  Per RMC §18-407, purchased service is excluded from {ruleType}.
                </Callout>
              )}
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading...</div>}
          </Panel>

          {/* ─── Panel: Purchased Service (conditional) ─── */}
          {sc && sc.purchased_service_years > 0 && ben && elig && (
            <Panel id="purch" title="Purchased Service Impact" icon="📎"
              isConfirmed={confirmed.has('purch')} isFocused={focused === 'purch'}
              onFocus={setFocused} onConfirm={handleConfirm}>
              {(() => {
                const withoutPurch = +(ben.ams * ben.multiplier * sc.earned_service_years * elig.reduction_factor).toFixed(2)
                return (<>
                  <Field label="Earned Service" value={`${sc.earned_service_years}y`} />
                  <Field label="Purchased" value={`${sc.purchased_service_years}y`}
                    badge={{ text: 'RMC §18-407', bg: C.warmMuted, color: C.warm }} />
                  <Field label="Total for Benefit" value={`${sc.total_for_benefit}y`} highlight />
                  <Field label={`Total for ${ruleType}`} value={`${sc.total_for_eligibility}y`}
                    badge={{ text: 'Excluded', bg: C.dangerMuted, color: C.danger }} />
                  <div style={{ marginTop: '6px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
                    <div style={{
                      padding: '6px 8px', background: C.elevated, fontSize: '9px', fontWeight: 600,
                      color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
                    }}>Impact Analysis</div>
                    {[
                      { l: 'Without purchased', v: fmt(withoutPurch), c: C.textSecondary },
                      { l: 'With purchased', v: fmt(ben.net_monthly_benefit), c: C.accent },
                      { l: 'Additional', v: `+${fmt(ben.net_monthly_benefit - withoutPurch)}`, c: C.success },
                    ].map(r => (
                      <div key={r.l} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '5px 8px',
                        borderTop: `1px solid ${C.borderSubtle}`, fontSize: '11px',
                      }}>
                        <span style={{ color: C.text }}>{r.l}</span>
                        <span style={{ color: r.c, fontFamily: 'monospace', fontWeight: 600 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </>)
              })()}
            </Panel>
          )}

          {/* ─── Panel: Salary & AMS ─── */}
          <Panel id="salary" title={`Salary & AMS (${ben?.ams_window_months ?? '—'}-month window)`} icon="💰"
            isConfirmed={confirmed.has('salary')} isFocused={focused === 'salary'}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {ben ? (<>
              <Field label="AMS Window" value={`${ben.ams_window_months} consecutive months`}
                sub={m.tier === 3 ? 'Tier 3: 60-month (vs 36 for Tier 1/2)' : null}
                badge={m.tier === 3 ? { text: '60 months', bg: C.tier3Muted, color: C.tier3 } : null} />
              <SalaryTable memberId={memberId} windowMonths={ben.ams_window_months} leavePayout={leavePayout} />
              <Field label={`÷ ${ben.ams_window_months} months`} value={fmt(ben.ams)} highlight />
              {leavePayout > 0 && (
                <Callout type="warning" title="Leave Payout Impact">
                  {fmt(leavePayout)} added to final month. Without: {fmt(AMS_NO_LEAVE[memberId])} → With: {fmt(ben.ams)} (+{fmt(ben.ams - (AMS_NO_LEAVE[memberId] ?? ben.ams))}/mo)
                </Callout>
              )}
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading...</div>}
          </Panel>

          {/* ─── Panel: Benefit Calculation ─── */}
          <Panel id="benefit" title="Benefit Calculation" icon="🔢"
            isConfirmed={confirmed.has('benefit')} isFocused={focused === 'benefit'}
            alert={reductionPct > 0 ? `${reductionPct}% reduced` : null}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {ben ? (<>
              <div style={{
                padding: '12px', background: C.accentMuted, borderRadius: '7px',
                border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, marginBottom: '8px',
              }}>
                <div style={{
                  color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px',
                }}>{(ben.multiplier * 100).toFixed(1)}% × AMS × Service</div>
                <div style={{
                  color: C.accent, fontSize: '26px', fontWeight: 700, fontFamily: 'monospace',
                  marginTop: '4px', textShadow: `0 0 25px ${C.accentGlow}`,
                }}>{fmt(ben.net_monthly_benefit)}/mo</div>
                <div style={{ color: C.textSecondary, fontSize: '10.5px', marginTop: '3px', fontFamily: 'monospace' }}>
                  {ben.formula_display}
                </div>
                {reductionPct > 0 && (
                  <div style={{ color: C.danger, fontSize: '9.5px', marginTop: '3px', fontWeight: 600 }}>
                    After {reductionPct}% early retirement reduction
                  </div>
                )}
              </div>
              <Field label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}% (${tc.label})`} sub="RMC §18-401" />
              <Field label="AMS" value={fmt(ben.ams)} />
              <Field label="Service (for benefit)" value={`${ben.service_years_for_benefit}y`} />
              <Field label="Unreduced Benefit" value={fmt(ben.gross_monthly_benefit)} />
              {reductionPct > 0 && (<>
                <Field label="Reduction" value={`× ${ben.reduction_factor.toFixed(2)} (−${reductionPct}%)`}
                  badge={{ text: `−${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}/mo`, bg: C.dangerMuted, color: C.danger }} />
                <Field label="Reduced Benefit" value={fmt(ben.net_monthly_benefit)} highlight />
                <Callout type="danger" title="Reduction Impact">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    {[
                      { l: 'Unreduced', v: fmt(ben.gross_monthly_benefit), cl: C.text },
                      { l: 'Lost', v: `-${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}`, cl: C.danger },
                      { l: 'Actual', v: fmt(ben.net_monthly_benefit), cl: C.accent },
                    ].map(x => (
                      <div key={x.l} style={{ textAlign: 'center' as const, flex: 1 }}>
                        <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const }}>{x.l}</div>
                        <div style={{ color: x.cl, fontSize: '15px', fontFamily: 'monospace', fontWeight: 600 }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </Callout>
              </>)}
              {reductionPct === 0 && <Callout type="success" title="No Reduction">{ruleType} met — 100% of calculated benefit.</Callout>}
              <Field label="Annual Benefit" value={fmt(ben.net_monthly_benefit * 12)} />
              {ben.death_benefit && <Field label="Death Benefit" value={fmt(ben.death_benefit.amount)} sub={`Lump sum — ${ben.retirement_type}`} />}
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading...</div>}
          </Panel>

          {/* ─── Panel: DRO Impact (conditional) ─── */}
          {hasDRO && dro && (
            <Panel id="dro" title="DRO Impact" icon="⚖️"
              isConfirmed={confirmed.has('dro')} isFocused={focused === 'dro'}
              onFocus={setFocused} onConfirm={handleConfirm}>
              <Field label="Former Spouse" value={dro.alternate_payee_name} />
              {dros.data && dros.data[0] && (<>
                <Field label="Marriage" value={`${dros.data[0].marriage_date} — ${dros.data[0].divorce_date}`} />
              </>)}
              <Field label="Service During Marriage" value={`${dro.marital_service_years}y`} />
              <div style={{ margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: C.textSecondary, fontSize: '10.5px' }}>Marital Fraction</span>
                  <span style={{ color: C.accent, fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
                    {dro.marital_service_years} / {dro.total_service_years} = {(dro.marital_fraction * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: C.elevated, overflow: 'hidden' }}>
                  <div style={{
                    width: `${dro.marital_fraction * 100}%`, height: '100%', borderRadius: '3px',
                    background: `linear-gradient(90deg,${C.warm},${C.danger})`,
                  }} />
                </div>
              </div>
              <Field label="Gross Benefit" value={fmt(dro.member_gross_benefit)} />
              <Field label="Marital Share" value={fmt(dro.marital_share)}
                sub={`${fmt(dro.member_gross_benefit)} × ${(dro.marital_fraction * 100).toFixed(2)}%`} />
              <Field label="DRO Award" value={`${Math.round((dro.alternate_payee_amount / dro.marital_share) * 100)}% of marital`} />
              <Field label={`${dro.alternate_payee_name.split(' ')[0]}'s Monthly`} value={fmt(dro.alternate_payee_amount)} highlight />
              <Field label="Member's Remaining" value={fmt(dro.member_net_after_dro)} highlight />
              <div style={{
                marginTop: '8px', borderRadius: '6px', overflow: 'hidden',
                border: `1px solid ${C.borderSubtle}`,
              }}>
                <div style={{
                  padding: '6px 10px', background: C.elevated, fontSize: '10px', fontWeight: 600,
                  color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
                }}>Monthly Summary</div>
                {[
                  { w: `${m.first_name} (75% J&S)`, a: opts?.options.find(o => o.option_type === 'j&s_75')?.monthly_amount ?? dro.member_net_after_dro, cl: C.accent },
                  { w: `${dro.alternate_payee_name.split(' ')[0]} (DRO)`, a: dro.alternate_payee_amount, cl: C.warm },
                ].map(r => (
                  <div key={r.w} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
                    borderTop: `1px solid ${C.borderSubtle}`, fontSize: '11px',
                  }}>
                    <span style={{ color: C.text }}>{r.w}</span>
                    <span style={{ color: r.cl, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(r.a)}</span>
                  </div>
                ))}
              </div>
              <Callout type="info" title="Sequence">
                DRO split before payment option. Options on {fmt(dro.member_net_after_dro)}, not {fmt(dro.member_gross_benefit)}. RMC §18-408.
              </Callout>
            </Panel>
          )}

          {/* ─── Panel: Payment Option ─── */}
          <Panel id="payment" title="Payment Option" icon="💳"
            isConfirmed={confirmed.has('payment')} isFocused={focused === 'payment'}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {opts ? (<>
              {dro && <Callout type="info" title="DRO Applied">Options on post-DRO benefit: {fmt(dro.member_net_after_dro)}</Callout>}
              <div style={{ marginTop: dro ? '8px' : 0 }}>
                {opts.options.map(opt => {
                  const isElected = opt.option_type === elOpt
                  return (
                    <div key={opt.option_type}
                      onClick={() => setElectedOption(opt.option_type)}
                      style={{
                        padding: '8px 10px', marginTop: '4px', borderRadius: '6px',
                        border: `1px solid ${isElected ? C.accent : C.border}`,
                        background: isElected ? C.accentMuted : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{
                            color: isElected ? C.accent : C.text, fontSize: '11.5px',
                            fontWeight: isElected ? 600 : 400, display: 'flex', alignItems: 'center', gap: '5px',
                          }}>
                            <span>{isElected ? '●' : '○'}</span>
                            {opt.option_name}
                            {isElected && <Badge text="Elected" bg={C.accentSolid} color={C.accent} />}
                          </div>
                          <div style={{ color: C.textMuted, fontSize: '9.5px', marginTop: '1px', marginLeft: '14px' }}>
                            Factor: {opt.reduction_factor.toFixed(4)}
                            {opt.survivor_pct
                              ? ` · Survivor: ${fmt(opt.monthly_amount * opt.survivor_pct / 100)}/mo`
                              : ' · No survivor benefit'}
                          </div>
                        </div>
                        <span style={{
                          fontFamily: 'monospace', color: isElected ? C.accent : C.text,
                          fontWeight: 600, fontSize: '13px',
                          textShadow: isElected ? `0 0 14px ${C.accentGlow}` : 'none',
                        }}>{fmt(opt.monthly_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading...</div>}
          </Panel>

          {/* ─── Panel: IPR ─── */}
          <Panel id="ipr" title="IPR" icon="🏥"
            isConfirmed={confirmed.has('ipr')} isFocused={focused === 'ipr'}
            onFocus={setFocused} onConfirm={handleConfirm}>
            {ben?.ipr ? (<>
              <Field label="Service for IPR" value={`${ben.ipr.eligible_service_years}y`} sub="Earned only — purchased excluded" />
              <Field label="Pre-Medicare (< 65)" value={fmt(ben.ipr.monthly_amount)} highlight
                sub={`$12.50 × ${ben.ipr.eligible_service_years}`} />
              <Field label="Post-Medicare (≥ 65)" value={fmt(ben.ipr.monthly_amount / 2)}
                sub={`$6.25 × ${ben.ipr.eligible_service_years}`} />
              <Callout type="info">
                IPR offsets health insurance premiums. Rate changes at Medicare eligibility (age 65). RMC §18-412.
              </Callout>
            </>) : <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading...</div>}
          </Panel>

        </div>

        {/* LIVE SUMMARY SIDEBAR */}
        <div style={{
          width: '220px', borderLeft: `1px solid ${C.border}`, flexShrink: 0,
          background: C.surface, display: 'flex', flexDirection: 'column' as const,
        }}>
          <LiveSummary
            confirmed={confirmed}
            panelCount={panelIds.length}
            ben={ben}
            opts={opts}
            dro={dro}
            sc={sc}
            electedOption={elOpt}
            leavePayout={leavePayout}
            tc={tc}
            ruleType={ruleType}
            ruleSum={ruleSum}
            ruleMet={ruleMet}
            reductionPct={reductionPct}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
