/**
 * Wizard Step 5 — Death Benefit election.
 * Shows lump-sum amount and 3 payout options (50 draws, 100 draws, lump sum).
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (draft.death_benefit_election, ben.death_benefit), fmt
 */
import type { StepProps } from './StepProps'
import type { ApplicationDraft } from '@/types/Portal'
import { fmt } from '@/lib/constants'

export function Step5DeathBenefit({ T, draft, onUpdate, ben }: StepProps) {
  if (!ben || !ben.death_benefit) return null

  const amount = ben.death_benefit.amount
  const options = [
    { key: 'DRAW_50', label: '50 Monthly Installments', desc: `${fmt(amount / 50)}/month for 50 months` },
    { key: 'DRAW_100', label: '100 Monthly Installments', desc: `${fmt(amount / 100)}/month for 100 months` },
    { key: 'NO_DRAW', label: 'Lump Sum', desc: 'Full amount paid at once' },
  ]

  return (
    <div>
      <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
        Your lump-sum death benefit is payable to your designated beneficiary.
      </div>

      {/* Death benefit hero amount */}
      <div style={{
        padding: 16, background: T.accent.surface, borderRadius: 8,
        border: `1px solid ${T.accent.light}`, textAlign: 'center' as const, marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>Death Benefit Amount</div>
        <div style={{
          fontSize: 28, fontWeight: 800, color: T.accent.primary,
          fontFamily: "'JetBrains Mono', monospace", marginTop: 4,
        }}>{fmt(amount)}</div>
      </div>

      <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 12 }}>
        Choose how the death benefit should be paid:
      </div>

      {/* Payout option cards */}
      {options.map(opt => {
        const isSelected = draft.death_benefit_election === opt.key
        return (
          <div key={opt.key}
            onClick={() => onUpdate({ death_benefit_election: opt.key as ApplicationDraft['death_benefit_election'] })}
            style={{
              padding: '12px 16px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${isSelected ? T.accent.primary : T.border.subtle}`,
              background: isSelected ? T.accent.surface : T.surface.card,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{opt.desc}</div>
          </div>
        )
      })}
    </div>
  )
}
