/**
 * Case complete summary — read-only structured review after retirement election save.
 * Sections: case header, eligibility, salary/AMS, benefit, payment option, DRO, IPR, certification.
 * Consumed by: BenefitWorkspace.tsx, GuidedWorkspace.tsx (when saveStatus === 'saved')
 * Depends on: Member types, theme (C, tierMeta, fmt)
 */
import { C, tierMeta, fmt } from '@/theme'
import type { Member, BenefitResult, EligibilityResult, PaymentOptionsResult, DROResult, ServiceCreditSummary } from '@/types/Member'

interface CaseCompleteSummaryProps {
  caseId: number | null
  member: Member
  eligibility: EligibilityResult
  benefit: BenefitResult
  paymentOptions: PaymentOptionsResult | undefined
  droCalc: DROResult | undefined
  serviceCredit: ServiceCreditSummary | undefined
  retirementDate: string
  electedOption: string
  leavePayout: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-print="calc-panel" style={{
      marginBottom: 12, borderRadius: 6,
      border: `1px solid ${C.borderSubtle}`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '6px 10px', background: C.elevated, fontSize: 10,
        fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' as const,
        letterSpacing: '1px', borderBottom: `1px solid ${C.borderSubtle}`,
      }}>{title}</div>
      <div style={{ padding: '8px 10px' }}>{children}</div>
    </div>
  )
}

function Row({ label, value, highlight, mono }: {
  label: string; value: string; highlight?: boolean; mono?: boolean
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '3px 0', fontSize: 11,
    }}>
      <span style={{ color: C.textSecondary }}>{label}</span>
      <span style={{
        color: highlight ? C.accent : C.text, fontWeight: highlight ? 700 : 600,
        fontFamily: mono !== false ? "'SF Mono',monospace" : 'inherit',
        textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{value}</span>
    </div>
  )
}

export function CaseCompleteSummary({
  caseId, member: m, eligibility: elig, benefit: ben, paymentOptions: opts,
  droCalc: dro, serviceCredit: sc, retirementDate, electedOption, leavePayout,
}: CaseCompleteSummaryProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'
  const ruleTarget = m.tier === 3 ? 85 : 75
  const ruleSum = elig.rule_of_n_value ?? 0
  const ruleMet = elig.retirement_type === 'rule_of_75' || elig.retirement_type === 'rule_of_85'
  const reductionPct = Math.round((1 - elig.reduction_factor) * 100)
  const elOpt = opts?.options.find(o => o.option_type === electedOption)
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return (
    <div data-print="worksheet" style={{ padding: '4px 0' }}>
      {/* Case Header */}
      <div data-print="member-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 10px', marginBottom: 12, borderRadius: 6,
        background: C.successMuted, border: `1px solid ${C.successBorder}`,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.success }}>
            Case Complete — Retirement Application
          </div>
          <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
            {m.first_name} {m.last_name} ({m.member_id}) · {tc.label} · Retiring {retirementDate}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: C.success,
            fontFamily: "'SF Mono',monospace",
          }}>#{caseId}</div>
          <div style={{ fontSize: 9, color: C.textMuted }}>{timestamp}</div>
        </div>
      </div>

      {/* Eligibility */}
      <Section title="Eligibility">
        <Row label="Retirement Type" value={elig.retirement_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} mono={false} />
        <Row label="Age at Retirement" value={`${elig.age_at_retirement}`} />
        <Row label="Service" value={`${sc?.total_service_years ?? ben.service_years_for_benefit}y`} />
        <Row label={ruleType} value={`${ruleSum.toFixed(2)} ${ruleMet ? '≥' : '<'} ${ruleTarget}`} highlight={ruleMet} />
        <Row label="Reduction" value={reductionPct === 0 ? 'None' : `${reductionPct}%`} />
      </Section>

      {/* Salary & AMS */}
      <Section title={`Salary / AMS (${ben.ams_window_months}-month window)`}>
        <Row label="AMS" value={fmt(ben.ams)} highlight />
        {leavePayout > 0 && (
          <Row label="Leave Payout" value={fmt(leavePayout)} />
        )}
      </Section>

      {/* Benefit Calculation */}
      <Section title="Benefit Calculation">
        <div data-print="formula" style={{
          padding: '8px 10px', marginBottom: 6, borderRadius: 4,
          background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
          textAlign: 'center' as const,
        }}>
          <div style={{
            fontSize: 9, color: C.textMuted, textTransform: 'uppercase' as const,
            letterSpacing: 1, marginBottom: 2,
          }}>{(ben.multiplier * 100).toFixed(1)}% x AMS x Service</div>
          <div style={{
            fontSize: 20, fontWeight: 700, color: C.accent,
            fontFamily: "'SF Mono',monospace",
          }}>{fmt(ben.net_monthly_benefit)}/mo</div>
          <div style={{ fontSize: 10, color: C.textSecondary, fontFamily: 'monospace', marginTop: 2 }}>
            {ben.formula_display}
          </div>
        </div>
        <Row label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}% (${tc.label})`} />
        <Row label="AMS" value={fmt(ben.ams)} />
        <Row label="Service (for benefit)" value={`${ben.service_years_for_benefit}y`} />
        <Row label="Gross Benefit" value={fmt(ben.gross_monthly_benefit)} />
        {reductionPct > 0 && (
          <Row label={`Reduction (${reductionPct}%)`} value={`-${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}`} />
        )}
        <Row label="Net Benefit" value={fmt(ben.net_monthly_benefit)} highlight />
      </Section>

      {/* Elected Payment Option */}
      {elOpt && (
        <Section title="Elected Payment Option">
          <Row label="Option" value={elOpt.option_name} mono={false} />
          <Row label="Monthly Amount" value={fmt(elOpt.monthly_amount)} highlight />
          <Row label="Factor" value={elOpt.reduction_factor.toFixed(4)} />
          {elOpt.survivor_pct ? (
            <Row label="Survivor Benefit" value={`${fmt(elOpt.monthly_amount * elOpt.survivor_pct / 100)}/mo (${elOpt.survivor_pct}%)`} />
          ) : (
            <Row label="Survivor Benefit" value="None" />
          )}
        </Section>
      )}

      {/* DRO Impact (conditional) */}
      {dro && (
        <Section title="DRO Impact">
          <Row label="Alternate Payee" value={dro.alternate_payee_name} mono={false} />
          <Row label="Marital Fraction" value={`${(dro.marital_fraction * 100).toFixed(2)}%`} />
          <Row label="Payee Amount" value={fmt(dro.alternate_payee_amount)} />
          <Row label="Member After DRO" value={fmt(dro.member_net_after_dro)} highlight />
        </Section>
      )}

      {/* IPR & Death Benefit */}
      <Section title="Supplemental">
        {ben.ipr && (
          <>
            <Row label="IPR (pre-Medicare)" value={`${fmt(ben.ipr.monthly_amount)}/mo`} />
            <Row label="IPR (post-Medicare)" value={`${fmt(ben.ipr.monthly_amount / 2)}/mo`} />
          </>
        )}
        {ben.death_benefit && (
          <Row label="Death Benefit" value={fmt(ben.death_benefit.amount)} />
        )}
      </Section>

      {/* Certification Footer */}
      <div data-print="audit" style={{
        padding: '8px 10px', borderRadius: 6,
        background: C.surface, border: `1px solid ${C.borderSubtle}`,
        fontSize: 9, color: C.textMuted, lineHeight: 1.5,
      }}>
        Calculated by deterministic rules engine executing certified plan provisions.
        All formulas, inputs, and intermediate steps are available in the calculation audit trail.
        <br />
        {timestamp} · Case #{caseId} · {m.member_id}
      </div>
    </div>
  )
}
