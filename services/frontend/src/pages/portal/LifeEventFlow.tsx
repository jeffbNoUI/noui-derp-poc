/**
 * Life event flow — multi-phase page: triage -> form bundle -> fill forms -> review/submit.
 * Handles the full lifecycle from answering triage questions to submitting a form bundle.
 * Consumed by: router.tsx (/portal/life-events/:eventId)
 * Depends on: life-events, FORM_REGISTRY, FormWizard, formSubmissionApi, useTheme
 */
import { useReducer } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { getLifeEvent } from '@/lib/life-events'
import { FORM_REGISTRY } from '@/lib/form-definitions'
import { FormWizard } from '@/components/shared/FormWizard'
import { formSubmissionApi } from '@/api/form-submission-store'
import type { FormBundleSubmission } from '@/types/LifeEvent'

type Phase = 'triage' | 'bundle' | 'filling' | 'review'
type State = {
  phase: Phase
  triageAnswers: Record<string, string>
  formIds: string[]
  bundle: FormBundleSubmission | null
  currentFormIdx: number
  completedFormIds: string[]
}
type Action =
  | { type: 'ANSWER_TRIAGE'; questionId: string; value: string }
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'SET_BUNDLE'; bundle: FormBundleSubmission }
  | { type: 'SET_FORM_IDS'; formIds: string[] }
  | { type: 'START_FORM'; idx: number }
  | { type: 'COMPLETE_FORM'; formId: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ANSWER_TRIAGE': return { ...state, triageAnswers: { ...state.triageAnswers, [action.questionId]: action.value } }
    case 'SET_PHASE': return { ...state, phase: action.phase }
    case 'SET_BUNDLE': return { ...state, bundle: action.bundle }
    case 'SET_FORM_IDS': return { ...state, formIds: action.formIds }
    case 'START_FORM': return { ...state, phase: 'filling', currentFormIdx: action.idx }
    case 'COMPLETE_FORM': return { ...state, completedFormIds: [...state.completedFormIds, action.formId], phase: 'bundle' }
    default: return state
  }
}

export function LifeEventFlow() {
  const T = useTheme()
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const { memberId } = usePortalAuth()
  const event = getLifeEvent(eventId || '')

  const [state, dispatch] = useReducer(reducer, {
    phase: 'triage', triageAnswers: {}, formIds: [], bundle: null, currentFormIdx: 0, completedFormIds: [],
  })

  if (!event) {
    return <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 14, color: T.text.muted }}>Life event not found.</div>
      <button onClick={() => navigate('/portal/life-events')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`, background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer' }}>Back to Life Events</button>
    </div>
  }

  // If no triage questions, skip straight to bundle
  const needsTriage = event.triage.length > 0
  const allTriageAnswered = event.triage.every(q => state.triageAnswers[q.id])

  const handleResolve = async () => {
    const formIds = event.formResolver(state.triageAnswers)
    dispatch({ type: 'SET_FORM_IDS', formIds })
    const forms = formIds.map(id => ({ formId: id, formName: FORM_REGISTRY[id]?.formName || id }))
    const bundle = await formSubmissionApi.createBundle(memberId, event.eventId, state.triageAnswers, forms)
    dispatch({ type: 'SET_BUNDLE', bundle })
    dispatch({ type: 'SET_PHASE', phase: 'bundle' })
  }

  const handleFormSubmit = async (formId: string, data: Record<string, unknown>) => {
    if (state.bundle) {
      await formSubmissionApi.updateFormInBundle(state.bundle.bundleId, formId, data)
      await formSubmissionApi.completeFormInBundle(state.bundle.bundleId, formId)
    }
    dispatch({ type: 'COMPLETE_FORM', formId })
  }

  const handleSubmitAll = async () => {
    if (state.bundle) {
      await formSubmissionApi.submitBundle(state.bundle.bundleId)
      navigate(`/portal/submissions/${state.bundle.bundleId}`)
    }
  }

  // TRIAGE PHASE
  if (state.phase === 'triage') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: event.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: event.color }}>{event.iconLabel}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text.primary }}>{event.title}</div>
            <div style={{ fontSize: 12, color: T.text.secondary }}>{event.description}</div>
          </div>
        </div>

        {!needsTriage ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
            <button onClick={handleResolve} style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', background: T.accent.primary, color: T.accent.on, cursor: 'pointer' }}>Get Started</button>
          </div>
        ) : (
          <div style={{ background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, marginBottom: 16 }}>A few quick questions to prepare your forms:</div>
            {event.triage.map(q => (
              <div key={q.id} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary, marginBottom: 8 }}>{q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {q.options.map(opt => {
                    const checked = state.triageAnswers[q.id] === opt.value
                    return (
                      <label key={opt.value} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${checked ? event.color : T.border.base}`,
                        background: checked ? event.colorBg : T.surface.card, cursor: 'pointer',
                      }}>
                        <input type="radio" name={q.id} value={opt.value} checked={checked}
                          onChange={() => dispatch({ type: 'ANSWER_TRIAGE', questionId: q.id, value: opt.value })}
                          style={{ accentColor: event.color }}
                        />
                        <div>
                          <div style={{ fontSize: 13, color: T.text.primary }}>{opt.label}</div>
                          {opt.helpText && <div style={{ fontSize: 11, color: T.text.muted }}>{opt.helpText}</div>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button onClick={() => navigate('/portal/life-events')} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`, background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer' }}>Back</button>
              <button onClick={handleResolve} disabled={!allTriageAnswered} style={{
                padding: '8px 24px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
                background: allTriageAnswered ? T.accent.primary : T.border.subtle,
                color: allTriageAnswered ? T.accent.on : T.text.muted,
                cursor: allTriageAnswered ? 'pointer' : 'not-allowed',
              }}>See My Forms</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // FILLING PHASE — render FormWizard for current form
  if (state.phase === 'filling') {
    const formId = state.formIds[state.currentFormIdx]
    const def = FORM_REGISTRY[formId]
    if (!def) return null

    // F01 is customComponent — link to existing wizard
    if (def.customComponent) {
      return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 8 }}>{def.formName}</div>
          <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 20 }}>{def.formDescription}</div>
          <button onClick={() => navigate('/portal/apply/new')} style={{
            padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            border: 'none', background: T.accent.primary, color: T.accent.on, cursor: 'pointer',
          }}>Open Application Wizard</button>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => dispatch({ type: 'COMPLETE_FORM', formId })} style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 11, border: `1px solid ${T.border.base}`,
              background: 'transparent', color: T.text.muted, cursor: 'pointer',
            }}>Mark as Complete & Return</button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 4 }}>Form {state.currentFormIdx + 1} of {state.formIds.length}</div>
        <FormWizard
          definition={def}
          onSubmit={(data) => handleFormSubmit(formId, data)}
          onCancel={() => dispatch({ type: 'SET_PHASE', phase: 'bundle' })}
        />
      </div>
    )
  }

  // BUNDLE PHASE — show form checklist
  if (state.phase === 'bundle') {
    const allDone = state.formIds.every(id => state.completedFormIds.includes(id))
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: event.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: event.color }}>{event.iconLabel}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text.primary }}>{event.title}</div>
            <div style={{ fontSize: 12, color: T.text.secondary }}>
              {state.completedFormIds.length} of {state.formIds.length} forms complete
            </div>
          </div>
        </div>

        <div style={{ background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`, overflow: 'hidden', marginBottom: 20 }}>
          {state.formIds.map((formId, idx) => {
            const def = FORM_REGISTRY[formId]
            const done = state.completedFormIds.includes(formId)
            return (
              <div key={formId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', borderBottom: idx < state.formIds.length - 1 ? `1px solid ${T.border.subtle}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: done ? T.status.success : T.surface.cardAlt,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: done ? '#fff' : T.text.muted,
                  }}>{done ? '\u2713' : idx + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{def?.formName || formId}</div>
                    <div style={{ fontSize: 11, color: T.text.muted }}>{def?.estimatedMinutes || 0} min</div>
                  </div>
                </div>
                {done ? (
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.status.success, background: T.status.successBg, padding: '2px 8px', borderRadius: 4 }}>Complete</span>
                ) : (
                  <button onClick={() => dispatch({ type: 'START_FORM', idx })} style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: 'none', background: T.accent.primary, color: T.accent.on, cursor: 'pointer',
                  }}>{def?.customComponent ? 'Open Wizard' : 'Start'}</button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/portal/life-events')} style={{
            padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`,
            background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer',
          }}>Back to Life Events</button>
          <button onClick={handleSubmitAll} disabled={!allDone} style={{
            padding: '8px 24px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: allDone ? T.accent.primary : T.border.subtle,
            color: allDone ? T.accent.on : T.text.muted,
            cursor: allDone ? 'pointer' : 'not-allowed',
          }}>Submit All Forms</button>
        </div>
      </div>
    )
  }

  return null
}
