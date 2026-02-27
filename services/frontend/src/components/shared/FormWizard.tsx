/**
 * Generic data-driven form wizard — renders any FormDefinition as a multi-step form.
 * Reuses the same visual structure (progress bar, step header, navigation) as ApplicationWizard.
 * Consumed by: LifeEventFlow, FormWizardPage
 * Depends on: FormDefinition types, FormField dispatcher, PortalTheme
 */
import { useReducer } from 'react'
import { useTheme } from '@/theme'
import { FormField } from '@/components/forms'
import type { FormDefinition, FormFieldDef } from '@/types/FormDefinition'

interface FormWizardProps {
  definition: FormDefinition
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
}

type FormState = { step: number; data: Record<string, unknown> }
type FormAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE'; key: string; value: unknown }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step }
    case 'UPDATE': return { ...state, data: { ...state.data, [action.key]: action.value } }
    default: return state
  }
}

/** Evaluate conditional visibility for a field based on current form data */
function isFieldVisible(field: FormFieldDef, data: Record<string, unknown>): boolean {
  if (!field.conditionalOn) return true
  const { field: depField, operator, value } = field.conditionalOn
  const depValue = data[depField]
  switch (operator) {
    case 'equals': return depValue === value
    case 'not_equals': return depValue !== value
    case 'truthy': return !!depValue
    default: return true
  }
}

export function FormWizard({ definition, initialData, onSubmit, onCancel }: FormWizardProps) {
  const T = useTheme()
  const [state, dispatch] = useReducer(formReducer, {
    step: 0,
    data: initialData || {},
  })

  const { step, data } = state
  const steps = definition.steps
  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1

  const visibleFields = currentStep.fields.filter(f => isFieldVisible(f, data))

  const canContinue = currentStep.canContinue ? currentStep.canContinue(data) : true

  const handleChange = (key: string, value: unknown) => {
    dispatch({ type: 'UPDATE', key, value })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ flex: 1, textAlign: 'center' as const }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: i < step ? T.status.success : i === step ? T.accent.primary : T.border.subtle,
              transition: 'background 0.3s', marginBottom: 6,
            }} />
            <div style={{
              fontSize: 9, fontWeight: i === step ? 700 : 500,
              color: i === step ? T.accent.primary : i < step ? T.status.success : T.text.muted,
            }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* Step header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: T.accent.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: T.accent.on, flexShrink: 0,
        }}>{step + 1}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>{currentStep.title}</div>
          <div style={{ fontSize: 12, color: T.text.secondary }}>{currentStep.description}</div>
        </div>
      </div>

      {/* Fields */}
      <div style={{
        background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`,
        padding: 20, marginBottom: 20,
      }}>
        {visibleFields.map(field => (
          <FormField
            key={field.key}
            field={field}
            value={data[field.key]}
            onChange={handleChange}
            T={T}
            readOnly={field.readOnly}
          />
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={step === 0 ? onCancel : () => dispatch({ type: 'SET_STEP', step: step - 1 })} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: `1px solid ${T.border.base}`, background: 'transparent', color: T.text.secondary,
          cursor: 'pointer',
        }}>{step === 0 ? 'Cancel' : 'Back'}</button>

        <button
          onClick={isLastStep ? () => onSubmit(data) : () => dispatch({ type: 'SET_STEP', step: step + 1 })}
          disabled={!canContinue}
          style={{
            padding: '8px 24px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: 'none', background: canContinue ? T.accent.primary : T.border.subtle,
            color: canContinue ? T.accent.on : T.text.muted,
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >{isLastStep ? 'Complete Form' : 'Continue'}</button>
      </div>
    </div>
  )
}
