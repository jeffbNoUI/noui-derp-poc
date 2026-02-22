/**
 * Guided mode Stage 5 — Payment Options.
 * 4 option cards with survivor amounts, spousal consent, irrevocability warning.
 * Analyst entry section: beneficiary name, death benefit installments, spousal consent (F-4).
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, guided-types.ts (AnalystInputs), theme (C, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'

export function Stage5PaymentOptions({
  paymentOptions: opts, droCalc: dro,
  electedOption, onElectOption,
  analystInputs, onUpdateAnalystInput,
}: StageProps) {
  if (!opts) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading payment options...</div>
  }

  const isJointSurvivor = electedOption.startsWith('j&s_')

  return (
    <div>
      {/* DRO context note */}
      {dro && (
        <div style={{
          padding: '8px 10px', background: C.accentMuted,
          borderRadius: '6px', border: `1px solid ${C.accentSolid}`, marginBottom: '8px',
        }}>
          <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            DRO Applied
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            Payment options are calculated on the post-DRO benefit: {fmt(dro.member_net_after_dro)}
          </div>
        </div>
      )}

      {/* Option cards */}
      {opts.options.map(opt => {
        const isElected = opt.option_type === electedOption
        const survivorAmt = opt.survivor_pct ? opt.monthly_amount * opt.survivor_pct / 100 : 0
        return (
          <div key={opt.option_type}
            onClick={() => onElectOption(opt.option_type)}
            style={{
              padding: '10px 12px', marginTop: '6px', borderRadius: '7px',
              border: `1px solid ${isElected ? C.accent : C.border}`,
              background: isElected ? C.accentMuted : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{
                  color: isElected ? C.accent : C.text, fontSize: '12px',
                  fontWeight: isElected ? 600 : 400, display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>{isElected ? '\u25CF' : '\u25CB'}</span>
                  {opt.option_name}
                  {isElected && <Badge text="Elected" bg={C.accentSolid} color={C.accent} />}
                </div>
                <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '2px', marginLeft: '16px' }}>
                  Factor: {opt.reduction_factor.toFixed(4)}
                  {opt.survivor_pct
                    ? ` · Survivor: ${fmt(survivorAmt)}/mo (${opt.survivor_pct}%)`
                    : ' · No survivor benefit'}
                </div>
              </div>
              <span style={{
                fontFamily: 'monospace', color: isElected ? C.accent : C.text,
                fontWeight: 600, fontSize: '14px',
                textShadow: isElected ? `0 0 14px ${C.accentGlow}` : 'none',
              }}>{fmt(opt.monthly_amount)}</span>
            </div>
          </div>
        )
      })}

      {/* ─── Analyst Entry — From Application (F-4) ──────────── */}
      {analystInputs && onUpdateAnalystInput && (
        <div style={{
          marginTop: '12px', padding: '10px 12px', background: C.elevated,
          borderRadius: '7px', border: `1px solid ${C.border}`,
        }}>
          <div style={{
            color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '1px', fontWeight: 600, marginBottom: '8px',
          }}>Analyst Entry {'\u2014'} From Application</div>

          {/* Beneficiary Name — visible when J&S option elected */}
          {isJointSurvivor && (
            <div style={{ marginBottom: '8px' }}>
              <label style={{ color: C.textSecondary, fontSize: '10.5px', display: 'block', marginBottom: '3px' }}>
                Beneficiary Name
              </label>
              <input
                type="text"
                value={analystInputs.beneficiaryName}
                onChange={(e) => onUpdateAnalystInput('beneficiaryName', e.target.value)}
                placeholder="Enter beneficiary name from application"
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: '4px',
                  background: C.elevated, border: `1px solid ${C.border}`,
                  color: C.accent, fontSize: '11.5px',
                  outline: 'none', boxSizing: 'border-box' as const,
                }}
              />
            </div>
          )}

          {/* Death Benefit Installments — always visible */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ color: C.textSecondary, fontSize: '10.5px', display: 'block', marginBottom: '3px' }}>
              Death Benefit Installments
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {([50, 100] as const).map(n => {
                const active = analystInputs.deathBenefitInstallments === n
                return (
                  <button key={n}
                    onClick={() => onUpdateAnalystInput('deathBenefitInstallments', n)}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: '4px', fontSize: '10.5px',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${active ? C.accentSolid : C.border}`,
                      background: active ? C.accentMuted : 'transparent',
                      color: active ? C.accent : C.textMuted,
                    }}
                  >{n} Monthly</button>
                )
              })}
            </div>
          </div>

          {/* Spousal Consent — visible when Maximum elected */}
          {electedOption === 'maximum' && (
            <div>
              <label
                onClick={() => onUpdateAnalystInput('spousalConsentObtained', !analystInputs.spousalConsentObtained)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', color: C.textSecondary, fontSize: '10.5px',
                }}>
                <span style={{
                  color: analystInputs.spousalConsentObtained ? C.success : C.textDim,
                  fontSize: '13px',
                }}>
                  {analystInputs.spousalConsentObtained ? '\u2611' : '\u2610'}
                </span>
                Spousal consent obtained (RMC {'\u00A7'}18-410(b))
              </label>
            </div>
          )}
        </div>
      )}

      {/* Spousal consent & irrevocability warnings */}
      <div style={{
        marginTop: '10px', padding: '8px 10px', background: C.warmMuted,
        borderRadius: '6px', border: `1px solid ${C.warmBorder}`,
      }}>
        <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Spousal Consent Required
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          If the member is married and elects the Maximum option (no survivor benefit),
          spousal consent is required per RMC {'\u00A7'}18-410(b).
        </div>
      </div>

      <div style={{
        marginTop: '6px', padding: '8px 10px', background: C.dangerMuted,
        borderRadius: '6px', border: `1px solid ${C.dangerBorder}`,
      }}>
        <div style={{ color: C.danger, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Irrevocable Election
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          The payment option election becomes irrevocable once the first benefit payment is received.
          Ensure the member understands this before confirming.
        </div>
      </div>
    </div>
  )
}
