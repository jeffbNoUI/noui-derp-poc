/**
 * Wizard Step 2 — Retirement Date & Eligibility display.
 * Shows effective date, age, retirement type, Rule of N, and conditions met/unmet.
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (draft.retirement_date, eligibility data)
 */
import type { StepProps } from './StepProps'

export function Step2RetirementDate({ T, draft, elig }: StepProps) {
  if (!elig) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 }}>Effective Retirement Date</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>
            {new Date(draft.retirement_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 }}>Age at Retirement</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{elig.age_at_retirement} years</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 }}>Retirement Type</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>
            {elig.retirement_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 2, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 }}>
            Rule of {elig.rule_of_n_threshold}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>
            {(elig.rule_of_n_value ?? 0).toFixed(2)} / {elig.rule_of_n_threshold ?? '--'}
          </div>
        </div>
      </div>

      {/* Conditions met — green callouts */}
      {elig.conditions_met.map((c, i) => (
        <div key={i} style={{
          padding: '8px 12px', marginBottom: 4, borderRadius: 6,
          background: T.status.successBg, borderLeft: `3px solid ${T.status.success}`,
          fontSize: 12, color: T.status.success,
        }}>{c}</div>
      ))}

      {/* Conditions unmet — warning callouts */}
      {elig.conditions_unmet.map((c, i) => (
        <div key={i} style={{
          padding: '8px 12px', marginBottom: 4, borderRadius: 6,
          background: T.status.warningBg, borderLeft: `3px solid ${T.status.warning}`,
          fontSize: 12, color: T.status.warning,
        }}>{c}</div>
      ))}
    </div>
  )
}
