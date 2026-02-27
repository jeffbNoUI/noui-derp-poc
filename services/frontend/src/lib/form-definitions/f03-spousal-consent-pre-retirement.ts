/**
 * F03 Spousal Consent Pre-Retirement — spouse consents to beneficiary designation change.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f03SpousalConsentPreRetirement: FormDefinition = {
  formId: 'F03',
  formName: 'Spousal Consent (Pre-Retirement)',
  formDescription: 'Required when an active married member changes their beneficiary designation.',
  processType: 'life-change',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'member-spouse-info',
      title: 'Member & Spouse Information',
      description: 'Confirm member and spouse identity.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Member Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'spouse_name', type: 'text', label: 'Spouse Full Legal Name', required: true },
        { key: 'spouse_dob', type: 'date', label: 'Spouse Date of Birth', required: true },
        { key: 'marriage_date', type: 'date', label: 'Date of Marriage', required: true },
      ],
    },
    {
      id: 'beneficiary-change',
      title: 'Beneficiary Change Details',
      description: 'Review the proposed beneficiary change.',
      fields: [
        { key: 'info_beneficiary', type: 'info_block', label: 'About This Change', infoText: 'As a spouse, you have certain rights regarding pre-retirement death benefits. Your consent is required when the member designates a non-spouse beneficiary.' },
        { key: 'new_beneficiary_name', type: 'text', label: 'New Beneficiary Name', required: true },
        { key: 'new_beneficiary_relationship', type: 'text', label: 'Relationship to Member', required: true },
        { key: 'acknowledge_change', type: 'checkbox', label: 'I understand this change affects my rights to pre-retirement death benefits', required: true },
      ],
      canContinue: (state) => !!state.acknowledge_change,
    },
    {
      id: 'consent-signature',
      title: 'Consent & Signature',
      description: 'Sign to confirm your consent.',
      fields: [
        { key: 'spouse_esign', type: 'esign', label: 'I consent to the beneficiary change described above', helpText: 'Electronic signature with timestamp', required: true },
      ],
      canContinue: (state) => !!state.spouse_esign,
    },
  ],
}
