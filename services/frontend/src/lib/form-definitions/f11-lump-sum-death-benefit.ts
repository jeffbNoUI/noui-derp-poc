/**
 * F11 Lump Sum Death Benefit Application — beneficiary applies for one-time death benefit.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f11LumpSumDeathBenefit: FormDefinition = {
  formId: 'F11',
  formName: 'Lump Sum Death Benefit Application',
  formDescription: 'Application for the one-time $5,000 death benefit payment.',
  processType: 'death',
  estimatedMinutes: 15,
  steps: [
    {
      id: 'deceased-info',
      title: 'Deceased Member Information',
      description: 'Identify the deceased member.',
      fields: [
        { key: 'deceased_name', type: 'text', label: 'Full Name of Deceased', required: true },
        { key: 'deceased_dod', type: 'date', label: 'Date of Death', required: true },
        { key: 'deceased_ssn_last4', type: 'text', label: 'SSN (Last 4)', required: true },
      ],
    },
    {
      id: 'claimant-info',
      title: 'Claimant Information',
      description: 'Your information.',
      fields: [
        { key: 'claimant_name', type: 'text', label: 'Full Legal Name', required: true },
        { key: 'claimant_relationship', type: 'select', label: 'Relationship to Deceased', required: true, options: [
          { value: 'spouse', label: 'Spouse' },
          { value: 'child', label: 'Child' },
          { value: 'parent', label: 'Parent' },
          { value: 'estate', label: 'Estate Representative' },
          { value: 'beneficiary', label: 'Named Beneficiary' },
        ]},
        { key: 'claimant_address', type: 'address', label: 'Mailing Address', required: true },
        { key: 'claimant_phone', type: 'phone', label: 'Phone Number', required: true },
      ],
    },
    {
      id: 'documents',
      title: 'Supporting Documents',
      description: 'Required documentation.',
      fields: [
        { key: 'death_certificate', type: 'file_upload', label: 'Death Certificate', required: true },
        { key: 'proof_of_relationship', type: 'file_upload', label: 'Proof of Relationship', helpText: 'Marriage cert, birth cert, or beneficiary designation' },
      ],
    },
    {
      id: 'payment',
      title: 'Payment Method',
      description: 'How to receive the death benefit.',
      fields: [
        { key: 'info_amount', type: 'info_block', label: 'Death Benefit Amount', infoText: 'The standard COPERA death benefit is $5,000. For early retirees, the amount may be reduced based on age at death.' },
        { key: 'payment_method', type: 'radio', label: 'Payment Method', required: true, options: [
          { value: 'direct_deposit', label: 'Direct Deposit' },
          { value: 'check', label: 'Paper Check' },
        ]},
        { key: 'bank_name', type: 'text', label: 'Bank Name', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
        { key: 'routing_number', type: 'text', label: 'Routing Number', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
        { key: 'account_number', type: 'text', label: 'Account Number', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
      ],
    },
    {
      id: 'signature',
      title: 'Certification',
      description: 'Certify and sign.',
      fields: [
        { key: 'claimant_esign', type: 'esign', label: 'I certify the above information is true and complete', required: true },
      ],
      canContinue: (state) => !!state.claimant_esign,
    },
  ],
}
