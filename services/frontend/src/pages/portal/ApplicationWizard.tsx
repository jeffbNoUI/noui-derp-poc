/**
 * Retirement application wizard — 7-step guided form container.
 * Owns all data fetching, draft state (useReducer), and step navigation.
 * Step content is delegated to individual components in ./steps/.
 * Consumed by: router.tsx (route /portal/apply/:appId)
 * Depends on: useTheme, usePortalAuth, useMember, useCalculations, usePortal, step components
 */
import { useReducer, useCallback, useEffect } from 'react'
import { useKioskRegister } from '@/kiosk'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, usePaymentOptions } from '@/hooks/useCalculations'
import { useSubmitApplication } from '@/hooks/usePortal'
import { INITIAL_DRAFT, type ApplicationDraft } from '@/types/Portal'
import { DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import {
  Step1PersonalInfo, Step2RetirementDate, Step3BenefitEstimate,
  Step4PaymentOption, Step5DeathBenefit, Step6InsuranceTax, Step7ReviewSubmit,
} from './steps'

// ─── Draft state reducer ────────────────────────────────────────

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

// ─── Step metadata (title shown in header + progress bar) ───────

const STEPS = [
  { title: 'Your Information', icon: '1', desc: 'Review and confirm your personal details' },
  { title: 'Retirement Date', icon: '2', desc: 'Choose your effective retirement date' },
  { title: 'Benefit Estimate', icon: '3', desc: 'See your calculated retirement benefit' },
  { title: 'Payment Option', icon: '4', desc: 'Select how you receive your benefit' },
  { title: 'Death Benefit', icon: '5', desc: 'Lump-sum death benefit election' },
  { title: 'Insurance & Acknowledgments', icon: '6', desc: 'Health insurance and final acknowledgments' },
  { title: 'Review & Submit', icon: '7', desc: 'Confirm your elections and submit' },
]

// ─── Wizard Container ───────────────────────────────────────────

export function ApplicationWizard() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const retDate = DEFAULT_RETIREMENT_DATES[memberId] || '2026-04-01'

  // Data hooks — same fixtures used by staff workspace for consistency
  const member = useMember(memberId)
  const service = useServiceCredit(memberId)
  const eligibility = useEligibility(memberId, retDate)
  const benefit = useBenefitCalculation(memberId, retDate)
  const paymentOptions = usePaymentOptions(memberId, retDate)
  const submitMutation = useSubmitApplication()

  // Rec #5,6,9-12: auto-save draft to sessionStorage to prevent abandonment
  const DRAFT_KEY = 'noui:wizard-draft'
  const [draft, dispatch] = useReducer(draftReducer, undefined, () => {
    const saved = sessionStorage.getItem(DRAFT_KEY)
    if (saved) {
      try { return { ...INITIAL_DRAFT, ...JSON.parse(saved) } }
      catch { /* fall through */ }
    }
    return {
      ...INITIAL_DRAFT,
      retirement_date: retDate,
      last_day_worked: retDate ? new Date(new Date(retDate + 'T12:00:00').getTime() - 86400000).toISOString().split('T')[0] : '',
    }
  })
  useKioskRegister('wizard', dispatch as (action: Record<string, unknown>) => void)

  // Persist draft on every change
  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft])

  // Warn before navigating away with unsaved progress
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draft.step > 0 || draft.personal_confirmed) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [draft.step, draft.personal_confirmed])

  const step = draft.step

  /** Callback passed to step components for updating draft fields */
  const handleUpdate = useCallback((payload: Partial<ApplicationDraft>) => {
    dispatch({ type: 'UPDATE', payload })
  }, [])

  /** Per-step validation — determines whether Continue button is enabled */
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
      { onSuccess: (data) => {
        sessionStorage.removeItem(DRAFT_KEY)
        navigate(`/portal/status/${data.app_id}`)
      }},
    )
  }

  if (member.isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading application...</div>
      </div>
    )
  }

  // Shared props passed to every step component
  const stepProps = {
    T, draft, onUpdate: handleUpdate,
    member: member.data, service: service.data,
    elig: eligibility.data, ben: benefit.data, opts: paymentOptions.data,
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* 7-segment progress bar */}
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

      {/* Step card container */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadowLg,
        overflow: 'hidden',
      }}>
        {/* Step header with number badge */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border.subtle}` }}>
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

        {/* Step content — delegated to individual step components */}
        <div style={{ padding: '20px 24px' }}>
          {step === 0 && <Step1PersonalInfo {...stepProps} />}
          {step === 1 && <Step2RetirementDate {...stepProps} />}
          {step === 2 && <Step3BenefitEstimate {...stepProps} />}
          {step === 3 && <Step4PaymentOption {...stepProps} />}
          {step === 4 && <Step5DeathBenefit {...stepProps} />}
          {step === 5 && <Step6InsuranceTax {...stepProps} />}
          {step === 6 && <Step7ReviewSubmit {...stepProps} />}
        </div>

        {/* Navigation: Back / Continue / Submit */}
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
