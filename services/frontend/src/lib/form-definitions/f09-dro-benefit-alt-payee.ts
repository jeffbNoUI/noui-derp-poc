/**
 * F09 DRO Benefit Application (Alternate Payee) — former spouse applies to receive divided benefit.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f09DroBenefitAltPayee: FormDefinition = {
  formId: 'F09',
  formName: 'DRO Benefit Application (Alternate Payee)',
  formDescription: 'Former spouse applies to receive their portion of the divided retirement benefit.',
  processType: 'dro',
  estimatedMinutes: 15,
  steps: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'Your identification and contact details.',
      fields: [
        { key: 'alt_payee_name', type: 'text', label: 'Full Legal Name', required: true },
        { key: 'alt_payee_dob', type: 'date', label: 'Date of Birth', required: true },
        { key: 'alt_payee_ssn_last4', type: 'text', label: 'SSN (Last 4 digits)', required: true },
        { key: 'alt_payee_address', type: 'address', label: 'Mailing Address', required: true },
        { key: 'alt_payee_phone', type: 'phone', label: 'Phone Number', required: true },
        { key: 'alt_payee_email', type: 'email', label: 'Email Address' },
      ],
    },
    {
      id: 'member-reference',
      title: 'COPERA Member Reference',
      description: 'Identify the member whose benefit is being divided.',
      fields: [
        { key: 'member_name', type: 'text', label: 'COPERA Member Name', required: true },
        { key: 'dro_case_number', type: 'text', label: 'Court Case Number', required: true },
        { key: 'dro_approval_date', type: 'date', label: 'Date DRO Was Approved by COPERA' },
      ],
    },
    {
      id: 'payment-setup',
      title: 'Payment Setup',
      description: 'How you would like to receive your benefit.',
      fields: [
        { key: 'payment_method', type: 'radio', label: 'Payment Method', required: true, options: [
          { value: 'direct_deposit', label: 'Direct Deposit (recommended)' },
          { value: 'check', label: 'Paper Check by Mail' },
        ]},
        { key: 'bank_name', type: 'text', label: 'Bank Name', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
        { key: 'routing_number', type: 'text', label: 'Routing Number', helpText: '9-digit ABA routing number', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
        { key: 'account_number', type: 'text', label: 'Account Number', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' } },
        { key: 'account_type', type: 'radio', label: 'Account Type', conditionalOn: { field: 'payment_method', operator: 'equals', value: 'direct_deposit' }, options: [
          { value: 'checking', label: 'Checking' },
          { value: 'savings', label: 'Savings' },
        ]},
      ],
    },
    {
      id: 'tax-withholding',
      title: 'Tax Withholding',
      description: 'Federal and state tax withholding preferences.',
      fields: [
        { key: 'federal_tax', type: 'select', label: 'Federal Tax Withholding', required: true, options: [
          { value: 'standard', label: 'Standard withholding (recommended)' },
          { value: 'none', label: 'No withholding' },
          { value: 'custom', label: 'Custom amount' },
        ]},
        { key: 'federal_custom_amount', type: 'currency', label: 'Custom Federal Amount', conditionalOn: { field: 'federal_tax', operator: 'equals', value: 'custom' } },
        { key: 'state_tax', type: 'select', label: 'Colorado State Tax Withholding', required: true, options: [
          { value: 'standard', label: 'Standard withholding' },
          { value: 'none', label: 'No withholding' },
          { value: 'custom', label: 'Custom amount' },
        ]},
        { key: 'state_custom_amount', type: 'currency', label: 'Custom State Amount', conditionalOn: { field: 'state_tax', operator: 'equals', value: 'custom' } },
      ],
    },
    {
      id: 'signature',
      title: 'Certification & Signature',
      description: 'Certify and sign your application.',
      fields: [
        { key: 'alt_payee_esign', type: 'esign', label: 'I certify that the information provided is true and complete', helpText: 'Electronic signature with timestamp', required: true },
      ],
      canContinue: (state) => !!state.alt_payee_esign,
    },
  ],
}
