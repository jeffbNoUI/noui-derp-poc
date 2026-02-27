/**
 * F10 Survivor Benefit Application — surviving spouse/beneficiary applies for ongoing benefit.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f10SurvivorBenefit: FormDefinition = {
  formId: 'F10',
  formName: 'Survivor Benefit Application',
  formDescription: 'Application for ongoing survivor benefits after a retiree\u2019s death.',
  processType: 'death',
  estimatedMinutes: 20,
  steps: [
    {
      id: 'deceased-info',
      title: 'Deceased Member/Retiree',
      description: 'Information about the deceased.',
      fields: [
        { key: 'deceased_name', type: 'text', label: 'Name of Deceased', required: true },
        { key: 'deceased_dob', type: 'date', label: 'Date of Birth', required: true },
        { key: 'deceased_dod', type: 'date', label: 'Date of Death', required: true },
        { key: 'deceased_ssn_last4', type: 'text', label: 'SSN (Last 4)', required: true },
        { key: 'deceased_status', type: 'radio', label: 'Status at Time of Death', required: true, options: [
          { value: 'retired', label: 'Retired (receiving benefit)' },
          { value: 'active', label: 'Active Employee' },
          { value: 'deferred', label: 'Deferred Vested' },
        ]},
      ],
    },
    {
      id: 'applicant-info',
      title: 'Applicant Information',
      description: 'Your information as the survivor.',
      fields: [
        { key: 'applicant_name', type: 'text', label: 'Full Legal Name', required: true },
        { key: 'applicant_dob', type: 'date', label: 'Date of Birth', required: true },
        { key: 'applicant_ssn_last4', type: 'text', label: 'SSN (Last 4)', required: true },
        { key: 'applicant_address', type: 'address', label: 'Mailing Address', required: true },
        { key: 'applicant_phone', type: 'phone', label: 'Phone Number', required: true },
        { key: 'applicant_email', type: 'email', label: 'Email Address' },
      ],
    },
    {
      id: 'relationship',
      title: 'Relationship to Deceased',
      description: 'Establish your eligibility for survivor benefits.',
      fields: [
        { key: 'relationship', type: 'radio', label: 'Your Relationship', required: true, options: [
          { value: 'spouse', label: 'Spouse' },
          { value: 'domestic_partner', label: 'Domestic Partner' },
          { value: 'child', label: 'Dependent Child' },
          { value: 'beneficiary', label: 'Named Beneficiary' },
        ]},
        { key: 'marriage_date', type: 'date', label: 'Date of Marriage/Partnership', conditionalOn: { field: 'relationship', operator: 'equals', value: 'spouse' } },
      ],
    },
    {
      id: 'documents',
      title: 'Supporting Documents',
      description: 'Upload required documentation.',
      fields: [
        { key: 'death_certificate', type: 'file_upload', label: 'Death Certificate', required: true, helpText: 'Certified copy' },
        { key: 'marriage_certificate', type: 'file_upload', label: 'Marriage Certificate', conditionalOn: { field: 'relationship', operator: 'equals', value: 'spouse' } },
        { key: 'birth_certificate', type: 'file_upload', label: 'Your Birth Certificate' },
      ],
    },
    {
      id: 'payment-setup',
      title: 'Payment Setup',
      description: 'How you would like to receive survivor benefits.',
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
      id: 'tax-withholding',
      title: 'Tax Withholding',
      description: 'Tax withholding preferences for survivor benefit.',
      fields: [
        { key: 'federal_tax', type: 'select', label: 'Federal Tax', required: true, options: [
          { value: 'standard', label: 'Standard' },
          { value: 'none', label: 'None' },
          { value: 'custom', label: 'Custom' },
        ]},
        { key: 'state_tax', type: 'select', label: 'Colorado State Tax', required: true, options: [
          { value: 'standard', label: 'Standard' },
          { value: 'none', label: 'None' },
          { value: 'custom', label: 'Custom' },
        ]},
      ],
    },
    {
      id: 'signature',
      title: 'Certification',
      description: 'Certify and sign your application.',
      fields: [
        { key: 'ack_truthful', type: 'checkbox', label: 'I certify all information is true and complete', required: true },
        { key: 'ack_notify', type: 'checkbox', label: 'I agree to notify DERP of any changes to my eligibility', required: true },
        { key: 'applicant_esign', type: 'esign', label: 'Applicant Signature', required: true },
      ],
      canContinue: (state) => !!state.ack_truthful && !!state.ack_notify && !!state.applicant_esign,
    },
  ],
}
