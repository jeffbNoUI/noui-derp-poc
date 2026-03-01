/**
 * Wizard Step 7 — Review & Submit.
 * Full summary of all elections, plus final irrevocability and notarization
 * acknowledgments that gate the Submit button.
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (all data), fmt
 */
import type { StepProps } from './StepProps'
import { fmt } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export function Step7ReviewSubmit({ T, draft, onUpdate, member: m, ben, opts }: StepProps) {
  if (!ben) return null

  /** Summary rows: [label, value] pairs covering all elections */
  const rows: [string, string][] = [
    ['Retirement Date', formatDate(draft.retirement_date)],
    ['Benefit Tier', m ? `Tier ${m.tier}` : '--'],
    ['Monthly Benefit', fmt(ben.net_monthly_benefit)],
    ['Payment Option', opts?.options.find(o => o.option_type === draft.payment_option)?.option_name || '--'],
    ['Death Benefit', fmt(ben.death_benefit?.amount)],
    ['Death Benefit Election', draft.death_benefit_election === 'DRAW_50' ? '50 Installments' : draft.death_benefit_election === 'DRAW_100' ? '100 Installments' : draft.death_benefit_election === 'NO_DRAW' ? 'Lump Sum' : '--'],
    ['IPR (pre-Medicare)', ben.ipr ? fmt(ben.ipr.monthly_amount) + '/mo' : 'N/A'],
    ['Health Insurance', draft.insurance_elected ? 'Elected' : 'Not elected'],
  ]

  return (
    <div>
      <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
        Please review your selections below. After submitting, you'll need to print, sign before a notary, and return the application.
      </div>

      {/* Election summary table */}
      {rows.map(([l, v]) => (
        <div key={l} style={{
          display: 'flex', justifyContent: 'space-between', padding: '8px 0',
          borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <span style={{ fontSize: 13, color: T.text.secondary }}>{l}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{v}</span>
        </div>
      ))}

      {/* Final acknowledgments — both required before Submit is enabled */}
      <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>
        Final Acknowledgments
      </div>
      {[
        { key: 'ack_irrevocable' as const, label: 'I understand that once retirement benefits begin, neither the selected benefit option nor the designated beneficiary can ever be changed.' },
        { key: 'ack_notarize' as const, label: 'I understand I must print, sign before a notary, and submit the notarized application to Colorado PERA.' },
      ].map(ack => (
        <label key={ack.key} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
          padding: '10px 0', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <input type="checkbox" checked={draft[ack.key]}
            onChange={e => onUpdate({ [ack.key]: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5, fontWeight: 500 }}>{ack.label}</div>
        </label>
      ))}
    </div>
  )
}
