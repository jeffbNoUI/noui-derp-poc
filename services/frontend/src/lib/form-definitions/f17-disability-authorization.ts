/**
 * F17 Disability Medical Authorization — authorize release of medical records.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f17DisabilityAuthorization: FormDefinition = {
  formId: 'F17',
  formName: 'Disability Medical Authorization',
  formDescription: 'Authorize release of medical records for disability retirement evaluation.',
  processType: 'disability',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'patient-info',
      title: 'Patient Information',
      description: 'Confirm your identity for medical record release.',
      fields: [
        { key: 'patient_name', type: 'display', label: 'Patient Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'patient_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
        { key: 'provider_name', type: 'text', label: 'Medical Provider/Facility Name', required: true },
        { key: 'provider_address', type: 'address', label: 'Provider Address' },
        { key: 'records_from', type: 'date', label: 'Records From (Date)' },
        { key: 'records_to', type: 'date', label: 'Records To (Date)' },
      ],
    },
    {
      id: 'authorization',
      title: 'Authorization',
      description: 'Sign the authorization.',
      fields: [
        { key: 'info_scope', type: 'info_block', label: 'Scope of Authorization', infoText: 'This authorization permits the named provider to release medical records to Colorado PERA solely for the purpose of evaluating your disability retirement application. This authorization expires 12 months from the date of signature.' },
        { key: 'patient_esign', type: 'esign', label: 'Patient Signature', helpText: 'I authorize release of my medical records as described above', required: true },
      ],
      canContinue: (state) => !!state.patient_esign,
    },
  ],
}
