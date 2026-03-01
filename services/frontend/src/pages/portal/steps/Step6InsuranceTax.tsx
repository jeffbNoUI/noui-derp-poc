/**
 * Wizard Step 6 — Insurance Premium Reduction (IPR) & Acknowledgments.
 * Displays pre-/post-Medicare IPR amounts, insurance enrollment checkbox,
 * and two preliminary acknowledgments (electronic communications, re-employment).
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (draft checkboxes, ben.ipr), fmt
 */
import type { StepProps } from './StepProps'
import { fmt } from '@/lib/constants'

export function Step6InsuranceTax({ T, draft, onUpdate, ben }: StepProps) {
  if (!ben) return null

  return (
    <div>
      {/* IPR Section — only shown if member qualifies */}
      {ben.ipr && (
        <>
          <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
            Colorado PERA can reduce your health insurance premiums through the Insurance Premium Reduction (IPR).
          </div>

          {/* Pre-Medicare vs Post-Medicare comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{
              padding: 16, background: T.accent.surface, borderRadius: 8,
              textAlign: 'center' as const, border: `1px solid ${T.accent.light}`,
            }}>
              <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>Before Medicare (Age 65)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.accent.primary, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(ben.ipr.monthly_amount)}</div>
              <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{ben.ipr.eligible_service_years}y x $12.50/year</div>
            </div>
            <div style={{
              padding: 16, background: T.surface.cardAlt, borderRadius: 8,
              textAlign: 'center' as const, border: `1px solid ${T.border.subtle}`,
            }}>
              <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>After Medicare (Age 65+)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text.primary, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(ben.ipr.eligible_service_years * 6.25)}
              </div>
              <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{ben.ipr.eligible_service_years}y x $6.25/year</div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px', background: T.status.infoBg, borderRadius: 8,
            borderLeft: `3px solid ${T.status.info}`, marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: T.status.info }}>
              To receive the IPR, you must enroll in a Colorado PERA group health insurance plan.
            </div>
          </div>

          {/* Insurance enrollment election */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={draft.insurance_elected === true}
              onChange={e => onUpdate({ insurance_elected: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>
                I want to enroll in Colorado PERA health insurance
              </div>
              <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
                A Health Insurance Election Form will be added to your required documents.
              </div>
            </div>
          </label>
        </>
      )}

      {/* Preliminary acknowledgments */}
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>Acknowledgments</div>
      {[
        { key: 'ack_electronic_comm' as const, label: 'I acknowledge that pay advices and 1099-R forms will be available electronically.' },
        { key: 'ack_reemployment' as const, label: 'I understand that re-employment with a covered employer is limited to 1,000 hours annually, with a 30-day minimum separation.' },
      ].map(ack => (
        <label key={ack.key} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
          padding: '8px 0', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <input type="checkbox" checked={draft[ack.key]}
            onChange={e => onUpdate({ [ack.key]: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5 }}>{ack.label}</div>
        </label>
      ))}
    </div>
  )
}
