/**
 * FormWizardPage — URL wrapper that looks up a form by :formId and renders FormWizard.
 * Consumed by: router.tsx (/portal/forms/:formId)
 * Depends on: FORM_REGISTRY, FormWizard, useMember, useTheme
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { FORM_REGISTRY } from '@/lib/form-definitions'
import { FormWizard } from '@/components/shared/FormWizard'
import { useMember } from '@/hooks/useMember'

export function FormWizardPage() {
  const T = useTheme()
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const { memberId } = usePortalAuth()
  const member = useMember(memberId)

  const def = formId ? FORM_REGISTRY[formId] : null

  if (!def) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 14, color: T.text.muted }}>Form not found: {formId}</div>
        <button onClick={() => navigate('/portal/life-events')} style={{
          marginTop: 12, padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`,
          background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer',
        }}>Back</button>
      </div>
    )
  }

  if (def.customComponent) {
    navigate('/portal/apply/new')
    return null
  }

  // Build initial data from prepopulation
  const initialData: Record<string, unknown> = {}
  const m = member.data
  if (m) {
    initialData['member.full_name'] = `${m.first_name} ${m.last_name}`
    initialData['member.dob'] = m.date_of_birth
    initialData['member.hire_date'] = m.hire_date
    // SSN not available in Member type — forms display masked placeholder
    initialData['member.ssn'] = 'XXX-XX-XXXX'
    initialData['member.employer'] = 'City and County of Denver'
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      <FormWizard
        definition={def}
        initialData={initialData}
        onSubmit={() => navigate('/portal/life-events')}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}
