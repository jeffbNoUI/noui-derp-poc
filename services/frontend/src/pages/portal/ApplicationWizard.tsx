/** Retirement application wizard — 7-step guided form */
import { useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, usePaymentOptions } from '@/hooks/useCalculations'
import { useSubmitApplication } from '@/hooks/usePortal'
import { INITIAL_DRAFT, type ApplicationDraft } from '@/types/Portal'

const DEFAULT_DATES: Record<string, string> = {
  '10001': '2026-04-01', '10002': '2026-05-01',
  '10003': '2026-04-01', '10004': '2026-04-01',
}

const fmt = (n: number | undefined | null): string => {
  if (n == null) return '--'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type DraftAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE'; payload: Partial<ApplicationDraft> }

function draftReducer(state: ApplicationDraft, action: DraftAction): ApplicationDraft {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step }
    case 'UPDATE': return { ...state, ...action.payload }
    default: return state
  }
}

const STEPS = [
  { title: 'Your Information', icon: '1', desc: 'Review and confirm your personal details' },
  { title: 'Retirement Date', icon: '2', desc: 'Choose your effective retirement date' },
  { title: 'Benefit Estimate', icon: '3', desc: 'See your calculated retirement benefit' },
  { title: 'Payment Option', icon: '4', desc: 'Select how you receive your benefit' },
  { title: 'Death Benefit', icon: '5', desc: 'Lump-sum death benefit election' },
  { title: 'Insurance & Acknowledgments', icon: '6', desc: 'Health insurance and final acknowledgments' },
  { title: 'Review & Submit', icon: '7', desc: 'Confirm your elections and submit' },
]

export function ApplicationWizard() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const retDate = DEFAULT_DATES[memberId] || '2026-04-01'

  const member = useMember(memberId)
  const service = useServiceCredit(memberId)
  const eligibility = useEligibility(memberId, retDate)
  const benefit = useBenefitCalculation(memberId, retDate)
  const paymentOptions = usePaymentOptions(memberId, retDate)
  const submitMutation = useSubmitApplication()

  const [draft, dispatch] = useReducer(draftReducer, {
    ...INITIAL_DRAFT,
    retirement_date: retDate,
    last_day_worked: retDate ? new Date(new Date(retDate + 'T12:00:00').getTime() - 86400000).toISOString().split('T')[0] : '',
  })

  const m = member.data
  const svc = service.data
  const elig = eligibility.data
  const ben = benefit.data
  const opts = paymentOptions.data

  const step = draft.step

  const canContinue = (): boolean => {
    if (step === 0) return draft.personal_confirmed
    if (step === 3) return draft.payment_option !== ''
    if (step === 4) return draft.death_benefit_election !== ''
    if (step === 6) return draft.ack_irrevocable && draft.ack_notarize && draft.ack_reemployment
    return true
  }

  const handleSubmit = () => {
    submitMutation.mutate(
      { memberId, retirementDate: draft.retirement_date, paymentOption: draft.payment_option },
      {
        onSuccess: (data) => {
          navigate(`/portal/status/${data.app_id}`)
        },
      },
    )
  }

  if (member.isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading application...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s.title} style={{ flex: 1, textAlign: 'center' as const }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: i < step ? T.status.success : i === step ? T.accent.primary : T.border.subtle,
              transition: 'background 0.3s', marginBottom: 6,
            }} />
            <div style={{
              fontSize: 9, fontWeight: i === step ? 700 : 500,
              color: i <= step ? T.accent.primary : T.text.muted,
            }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* Step card */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadowLg,
        overflow: 'hidden',
      }}>
        {/* Step header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: T.accent.surface, border: `2px solid ${T.accent.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: T.accent.primary,
            }}>{STEPS[step].icon}</div>
            <div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: T.text.primary,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>{STEPS[step].title}</div>
              <div style={{ fontSize: 13, color: T.text.muted }}>{STEPS[step].desc}</div>
            </div>
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '20px 24px' }}>
          {step === 0 && m && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                {[
                  ['Name', `${m.first_name} ${m.last_name}`],
                  ['Date of Birth', new Date(m.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                  ['Member ID', m.member_id],
                  ['Department', m.department],
                  ['Hire Date', new Date(m.hire_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                  ['Benefit Tier', `Tier ${m.tier}`],
                  ['Years of Service', svc ? `${svc.total_service_years} years` : '--'],
                  ['Position', m.position],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{
                      fontSize: 11, color: T.text.muted, marginBottom: 2,
                      textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600,
                    }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{
                gridColumn: '1/-1', padding: '12px 16px', marginTop: 16,
                background: T.accent.surface, borderRadius: 8, border: `1px solid ${T.accent.light}`,
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={draft.personal_confirmed}
                    onChange={e => dispatch({ type: 'UPDATE', payload: { personal_confirmed: e.target.checked } })}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: T.accent.primary, fontWeight: 600 }}>
                      I confirm this information is correct
                    </div>
                    <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
                      If anything needs updating, contact DERP at (303) 839-5419 before submitting your application.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 1 && elig && (
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
              {elig.conditions_met.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 12px', marginBottom: 4, borderRadius: 6,
                  background: T.status.successBg, borderLeft: `3px solid ${T.status.success}`,
                  fontSize: 12, color: T.status.success,
                }}>{c}</div>
              ))}
              {elig.conditions_unmet.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 12px', marginBottom: 4, borderRadius: 6,
                  background: T.status.warningBg, borderLeft: `3px solid ${T.status.warning}`,
                  fontSize: 12, color: T.status.warning,
                }}>{c}</div>
              ))}
            </div>
          )}

          {step === 2 && ben && (
            <div>
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
          )}

          {step === 3 && opts && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
                Choose how you'd like to receive your monthly benefit.
                This election is <strong>irrevocable</strong> after your first payment.
              </div>
              {opts.options.map(o => {
                const isSelected = draft.payment_option === o.option_type
                return (
                  <div key={o.option_type}
                    onClick={() => dispatch({ type: 'UPDATE', payload: { payment_option: o.option_type as ApplicationDraft['payment_option'] } })}
                    style={{
                      padding: '16px 18px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${isSelected ? T.accent.primary : T.border.subtle}`,
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
          )}

          {step === 4 && ben && ben.death_benefit && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
                Your lump-sum death benefit is payable to your designated beneficiary.
              </div>
              <div style={{
                padding: 16, background: T.accent.surface, borderRadius: 8,
                border: `1px solid ${T.accent.light}`, textAlign: 'center' as const, marginBottom: 16,
              }}>
                <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>Death Benefit Amount</div>
                <div style={{
                  fontSize: 28, fontWeight: 800, color: T.accent.primary,
                  fontFamily: "'JetBrains Mono', monospace", marginTop: 4,
                }}>{fmt(ben.death_benefit.amount)}</div>
              </div>
              <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 12 }}>
                Choose how the death benefit should be paid:
              </div>
              {[
                { key: 'DRAW_50', label: '50 Monthly Installments', desc: `${fmt(ben.death_benefit.amount / 50)}/month for 50 months` },
                { key: 'DRAW_100', label: '100 Monthly Installments', desc: `${fmt(ben.death_benefit.amount / 100)}/month for 100 months` },
                { key: 'NO_DRAW', label: 'Lump Sum', desc: 'Full amount paid at once' },
              ].map(opt => {
                const isSelected = draft.death_benefit_election === opt.key
                return (
                  <div key={opt.key}
                    onClick={() => dispatch({ type: 'UPDATE', payload: { death_benefit_election: opt.key as ApplicationDraft['death_benefit_election'] } })}
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
          )}

          {step === 5 && ben && (
            <div>
              {/* IPR Section */}
              {ben.ipr && (
                <>
                  <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
                    DERP can reduce your health insurance premiums through the Insurance Premium Reduction (IPR).
                  </div>
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
                      To receive the IPR, you must enroll in a DERP group health insurance plan.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
                    <input type="checkbox" checked={draft.insurance_elected === true}
                      onChange={e => dispatch({ type: 'UPDATE', payload: { insurance_elected: e.target.checked } })}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>
                        I want to enroll in DERP health insurance
                      </div>
                      <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
                        A Health Insurance Election Form will be added to your required documents.
                      </div>
                    </div>
                  </label>
                </>
              )}
              {/* Acknowledgments */}
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
                    onChange={e => dispatch({ type: 'UPDATE', payload: { [ack.key]: e.target.checked } })}
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5 }}>{ack.label}</div>
                </label>
              ))}
            </div>
          )}

          {step === 6 && ben && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>
                Please review your selections below. After submitting, you'll need to print, sign before a notary, and return the application.
              </div>
              {[
                ['Retirement Date', new Date(draft.retirement_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
                ['Benefit Tier', m ? `Tier ${m.tier}` : '--'],
                ['Monthly Benefit', fmt(ben.net_monthly_benefit)],
                ['Payment Option', opts?.options.find(o => o.option_type === draft.payment_option)?.option_name || '--'],
                ['Death Benefit', fmt(ben.death_benefit?.amount)],
                ['Death Benefit Election', draft.death_benefit_election === 'DRAW_50' ? '50 Installments' : draft.death_benefit_election === 'DRAW_100' ? '100 Installments' : draft.death_benefit_election === 'NO_DRAW' ? 'Lump Sum' : '--'],
                ['IPR (pre-Medicare)', ben.ipr ? fmt(ben.ipr.monthly_amount) + '/mo' : 'N/A'],
                ['Health Insurance', draft.insurance_elected ? 'Elected' : 'Not elected'],
              ].map(([l, v]) => (
                <div key={l} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: `1px solid ${T.border.subtle}`,
                }}>
                  <span style={{ fontSize: 13, color: T.text.secondary }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>
                Final Acknowledgments
              </div>
              {[
                { key: 'ack_irrevocable' as const, label: 'I understand that once retirement benefits begin, neither the selected benefit option nor the designated beneficiary can ever be changed.' },
                { key: 'ack_notarize' as const, label: 'I understand I must print, sign before a notary, and submit the notarized application to DERP.' },
              ].map(ack => (
                <label key={ack.key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                  padding: '10px 0', borderBottom: `1px solid ${T.border.subtle}`,
                }}>
                  <input type="checkbox" checked={draft[ack.key]}
                    onChange={e => dispatch({ type: 'UPDATE', payload: { [ack.key]: e.target.checked } })}
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5, fontWeight: 500 }}>{ack.label}</div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${T.border.subtle}`,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <button onClick={() => step > 0 ? dispatch({ type: 'SET_STEP', step: step - 1 }) : navigate('/portal')} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${T.border.base}`, background: 'transparent',
            color: T.text.secondary, cursor: 'pointer',
          }}>{step === 0 ? '← Dashboard' : '← Back'}</button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => dispatch({ type: 'SET_STEP', step: step + 1 })}
              disabled={!canContinue()}
              style={{
                padding: '8px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                border: 'none', background: canContinue() ? T.accent.primary : T.border.subtle,
                color: canContinue() ? T.accent.on : T.text.muted, cursor: canContinue() ? 'pointer' : 'default',
              }}
            >Continue →</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canContinue() || submitMutation.isPending}
              style={{
                padding: '8px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                border: 'none', background: canContinue() ? T.accent.primary : T.border.subtle,
                color: canContinue() ? T.accent.on : T.text.muted,
                cursor: canContinue() && !submitMutation.isPending ? 'pointer' : 'default',
              }}
            >{submitMutation.isPending ? 'Submitting...' : 'Submit Application'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
