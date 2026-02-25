/**
 * Guided mode Stage 8 — Review & Certify.
 * Final summary of all confirmed stages with key values, submit action.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, tierMeta, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '50% 1fr',
      alignItems: 'center', padding: '6px 0',
      borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <span style={{ color: C.textSecondary, fontSize: '12.5px' }}>{label}</span>
      <span style={{
        color: color || C.text, fontFamily: 'monospace', fontSize: '13px',
        fontWeight: 600, textAlign: 'right' as const,
      }}>{value}</span>
    </div>
  )
}

export function Stage8ReviewCertify({
  member: m, serviceCredit: sc, eligibility: elig, benefit: ben,
  paymentOptions: opts, droCalc: dro, retirementDate, electedOption, leavePayout,
}: StageProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'
  const ruleMet = elig?.retirement_type === 'rule_of_75' || elig?.retirement_type === 'rule_of_85'
  const reductionPct = elig ? Math.round((1 - elig.reduction_factor) * 100) : 0
  const elOpt = opts?.options.find(o => o.option_type === electedOption)

  return (
    <div>
      {/* Section summaries — benefit amount lives in the member banner */}
      <div style={{
        borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}`,
        marginBottom: '8px',
      }}>
        <div style={{
          padding: '6px 10px', background: C.elevated, fontSize: '9px', fontWeight: 600,
          color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>Member & Service</div>
        <div style={{ padding: '4px 10px' }}>
          <SummaryRow label="Member" value={`${m.first_name} ${m.last_name} (${m.member_id})`} />
          <SummaryRow label="Tier" value={tc.label} color={tc.color} />
          <SummaryRow label="Total Service" value={`${sc?.total_service_years ?? '\u2014'}y`} />
          {sc && sc.purchased_service_years > 0 && (
            <SummaryRow label="Purchased Service" value={`${sc.purchased_service_years}y`} color={C.warm} />
          )}
        </div>
      </div>

      <div style={{
        borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}`,
        marginBottom: '8px',
      }}>
        <div style={{
          padding: '6px 10px', background: C.elevated, fontSize: '9px', fontWeight: 600,
          color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>Eligibility & Benefit</div>
        <div style={{ padding: '4px 10px' }}>
          <SummaryRow label="Retirement Date" value={retirementDate} color={C.accent} />
          <SummaryRow label="Age at Retirement" value={`${elig?.age_at_retirement ?? '\u2014'}`} />
          <SummaryRow label={ruleType} value={ruleMet ? 'Met' : 'Not Met'}
            color={ruleMet ? C.success : C.danger} />
          {reductionPct > 0 && <SummaryRow label="Reduction" value={`${reductionPct}%`} color={C.danger} />}
          <SummaryRow label="AMS" value={fmt(ben?.ams)} />
          {leavePayout > 0 && <SummaryRow label="Leave Payout" value={fmt(leavePayout)} color={C.warm} />}
          <SummaryRow label="Gross Monthly" value={fmt(ben?.gross_monthly_benefit)} />
          <SummaryRow label="Net Monthly" value={fmt(ben?.net_monthly_benefit)} color={C.accent} />
        </div>
      </div>

      <div style={{
        borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}`,
        marginBottom: '8px',
      }}>
        <div style={{
          padding: '6px 10px', background: C.elevated, fontSize: '9px', fontWeight: 600,
          color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>Payment & Benefits</div>
        <div style={{ padding: '4px 10px' }}>
          {elOpt && <SummaryRow label="Payment Option" value={elOpt.option_name} />}
          {elOpt && <SummaryRow label="Monthly Amount" value={fmt(elOpt.monthly_amount)} color={C.accent} />}
          {elOpt?.survivor_pct && (
            <SummaryRow label="Survivor Benefit" value={`${fmt(elOpt.monthly_amount * elOpt.survivor_pct / 100)}/mo (${elOpt.survivor_pct}%)`} />
          )}
          {dro && (<>
            <SummaryRow label="DRO Deduction" value={fmt(dro.alternate_payee_amount)} color={C.warm} />
            <SummaryRow label="After DRO" value={fmt(dro.member_net_after_dro)} />
          </>)}
          {ben?.ipr && <SummaryRow label="IPR (Pre-Medicare)" value={fmt(ben.ipr.monthly_amount)} />}
          {ben?.death_benefit && <SummaryRow label="Death Benefit" value={fmt(ben.death_benefit.amount)} />}
        </div>
      </div>

      {/* Certification statement */}
      <div style={{
        marginTop: '8px', padding: '10px 12px', background: C.elevated,
        borderRadius: '6px', border: `1px solid ${C.border}`,
      }}>
        <div style={{ color: C.text, fontSize: '11.5px', lineHeight: '1.5' }}>
          By submitting this application, I certify that all values have been reviewed and verified.
          The rules engine calculated the benefit using certified plan provisions. Every calculation
          is transparent and verifiable.
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <Badge text="Phase 1" bg={C.accentMuted} color={C.accent} />
          <Badge text="Transparent" bg={C.accentMuted} color={C.accent} />
          <Badge text="Human Verified" bg={C.successMuted} color={C.success} />
        </div>
      </div>
    </div>
  )
}
