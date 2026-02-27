/**
 * F12 Unpaid Benefit Application — claim for benefits accrued but not yet paid at death.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f12UnpaidBenefit: FormDefinition = {
  formId: 'F12',
  formName: 'Unpaid Benefit Application',
  formDescription: 'Claim for retirement benefits that accrued but were not paid before the retiree\u2019s death.',
  processType: 'death',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'deceased-info',
      title: 'Deceased Retiree',
      description: 'Identify the deceased retiree.',
      fields: [
        { key: 'deceased_name', type: 'text', label: 'Retiree Name', required: true },
        { key: 'deceased_dod', type: 'date', label: 'Date of Death', required: true },
        { key: 'last_benefit_date', type: 'date', label: 'Last Benefit Payment Received', helpText: 'Date of last check or deposit' },
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
        { key: 'estate_docs', type: 'file_upload', label: 'Estate/Probate Documents', conditionalOn: { field: 'claimant_relationship', operator: 'equals', value: 'estate' }, helpText: 'Letters testamentary or court appointment' },
      ],
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Payment method for unpaid benefits.',
      fields: [
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
        { key: 'claimant_esign', type: 'esign', label: 'I certify the above information is true', required: true },
      ],
      canContinue: (state) => !!state.claimant_esign,
    },
  ],
}
