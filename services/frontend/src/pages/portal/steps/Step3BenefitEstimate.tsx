/**
 * Wizard Step 3 — Benefit Estimate display.
 * Hero benefit amount, formula, reduction callout, IPR preview.
 * All numbers come from the rules engine — portal never calculates.
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (benefit, eligibility data), fmt
 */
import type { StepProps } from './StepProps'
import { fmt } from '@/lib/constants'

export function Step3BenefitEstimate({ T, elig, ben }: StepProps) {
  if (!ben) return null

  return (
    <div>
      {/* Hero benefit card */}
      <div style={{
        padding: 20, background: T.accent.surface, borderRadius: 10,
        border: `1px solid ${T.accent.light}`, textAlign: 'center' as const, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11, color: T.text.muted, letterSpacing: 1,
          textTransform: 'uppercase' as const, marginBottom: 4,
        }}>Your Estimated Monthly Benefit</div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: T.accent.primary,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{fmt(ben.net_monthly_benefit)}</div>
        <div style={{ fontSize: 12, color: T.text.secondary, marginTop: 6 }}>
          {ben.formula_display}
        </div>
      </div>

      {/* No reduction callout */}
      {ben.reduction_factor >= 1 && (
        <div style={{
          padding: '12px 16px', background: T.status.successBg, borderRadius: 8,
          borderLeft: `3px solid ${T.status.success}`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.status.success }}>No Early Retirement Reduction</div>
          <div style={{ fontSize: 12, color: T.status.success }}>
            You've met the Rule of {elig?.rule_of_n_threshold} and receive your full benefit.
          </div>
        </div>
      )}

      {/* Reduction callout */}
      {ben.reduction_factor < 1 && (
        <div style={{
          padding: '12px 16px', background: T.status.warningBg, borderRadius: 8,
          borderLeft: `3px solid ${T.status.warning}`, marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.status.warning }}>
            Early Retirement Reduction: {((1 - ben.reduction_factor) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 12, color: T.status.warning }}>
            Unreduced benefit: {fmt(ben.gross_monthly_benefit)} → Reduced: {fmt(ben.net_monthly_benefit)}
          </div>
        </div>
      )}

      {/* IPR preview */}
      {ben.ipr && (
        <div style={{
          padding: '12px 16px', background: T.status.infoBg, borderRadius: 8,
          borderLeft: `3px solid ${T.status.info}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.status.info }}>
            Insurance Premium Reduction: {fmt(ben.ipr.monthly_amount)}/mo
          </div>
          <div style={{ fontSize: 12, color: T.status.info }}>
            {ben.ipr.eligible_service_years} years x ${ben.ipr.medicare_eligible ? '6.25' : '12.50'}/year
          </div>
        </div>
      )}
    </div>
  )
}
