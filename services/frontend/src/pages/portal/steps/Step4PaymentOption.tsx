/**
 * Wizard Step 4 — Payment Option election.
 * Card-style selector for Maximum, J&S 50%, J&S 75%, J&S 100%.
 * Election is irrevocable after first payment — warning shown above options.
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (draft.payment_option, opts), fmt
 */
import type { StepProps } from './StepProps'
import type { ApplicationDraft } from '@/types/Portal'
import { fmt } from '@/lib/constants'

export function Step4PaymentOption({ T, draft, onUpdate, opts }: StepProps) {
  if (!opts) return null

  return (
    <div>
      <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
        Choose how you'd like to receive your monthly benefit.
        This election is <strong>irrevocable</strong> after your first payment.
      </div>
      {opts.options.map(o => {
        const isSelected = draft.payment_option === o.option_type
        return (
          <div key={o.option_type}
            onClick={() => onUpdate({ payment_option: o.option_type as ApplicationDraft['payment_option'] })}
            style={{
              padding: '16px 18px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${isSelected ? T.accent.primary : T.border.base}`,
              background: isSelected ? T.accent.surface : T.surface.card,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>{o.option_name}</div>
                <div style={{ fontSize: 12, color: T.text.muted, marginTop: 2 }}>{o.description}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800,
                  color: isSelected ? T.accent.primary : T.text.primary,
                }}>{fmt(o.monthly_amount)}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
                {o.survivor_pct && (
                  <div style={{ fontSize: 11, color: T.text.muted }}>
                    Survivor: {fmt(o.monthly_amount * (o.survivor_pct / 100))}/mo
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
