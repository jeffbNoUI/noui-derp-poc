/**
 * F13 Health Insurance Election — enroll in COPERA health insurance at retirement.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f13HealthInsuranceElection: FormDefinition = {
  formId: 'F13',
  formName: 'Health Insurance Election',
  formDescription: 'Elect health insurance coverage through COPERA upon retirement.',
  processType: 'retirement',
  estimatedMinutes: 15,
  steps: [
    {
      id: 'member-info',
      title: 'Member Information',
      description: 'Confirm your identity.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
        { key: 'retirement_date', type: 'display', label: 'Retirement Date', prepopulateFrom: 'benefit.retirement_date', readOnly: true },
      ],
    },
    {
      id: 'coverage-election',
      title: 'Coverage Election',
      description: 'Choose your coverage level.',
      fields: [
        { key: 'elect_insurance', type: 'radio', label: 'Do you want to enroll in COPERA health insurance?', required: true, options: [
          { value: 'yes', label: 'Yes, I want to enroll' },
          { value: 'no', label: 'No, I decline coverage' },
        ]},
        { key: 'coverage_type', type: 'radio', label: 'Coverage Type', conditionalOn: { field: 'elect_insurance', operator: 'equals', value: 'yes' }, options: [
          { value: 'member_only', label: 'Member Only' },
          { value: 'member_spouse', label: 'Member + Spouse' },
          { value: 'member_family', label: 'Member + Family' },
        ]},
      ],
    },
    {
      id: 'dependents',
      title: 'Dependents',
      description: 'List dependents to be covered.',
      fields: [
        { key: 'dependents', type: 'repeating_group', label: 'Covered Dependents', conditionalOn: { field: 'coverage_type', operator: 'not_equals', value: 'member_only' }, groupFields: [
          { key: 'dep_name', type: 'text', label: 'Name' },
          { key: 'dep_dob', type: 'date', label: 'Date of Birth' },
          { key: 'dep_relationship', type: 'text', label: 'Relationship' },
          { key: 'dep_ssn_last4', type: 'text', label: 'SSN (Last 4)' },
        ]},
      ],
    },
    {
      id: 'current-coverage',
      title: 'Current Coverage',
      description: 'Your current insurance status.',
      fields: [
        { key: 'has_current_coverage', type: 'radio', label: 'Do you currently have health insurance?', options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]},
        { key: 'current_carrier', type: 'text', label: 'Current Insurance Carrier', conditionalOn: { field: 'has_current_coverage', operator: 'equals', value: 'yes' } },
        { key: 'current_policy', type: 'text', label: 'Policy/Group Number', conditionalOn: { field: 'has_current_coverage', operator: 'equals', value: 'yes' } },
      ],
    },
    {
      id: 'premium',
      title: 'Premium Deduction',
      description: 'How premiums will be paid.',
      fields: [
        { key: 'info_ipr', type: 'info_block', label: 'Insurance Premium Reduction (IPR)', infoText: 'If you are eligible, COPERA may apply an Insurance Premium Reduction to offset your premium costs. This is calculated based on your years of service and tier.' },
        { key: 'premium_method', type: 'radio', label: 'Premium Payment Method', required: true, options: [
          { value: 'benefit_deduction', label: 'Deduct from monthly benefit (recommended)' },
          { value: 'direct_pay', label: 'Pay premiums directly' },
        ]},
      ],
    },
    {
      id: 'signature',
      title: 'Authorization',
      description: 'Authorize enrollment and premium deduction.',
      fields: [
        { key: 'ack_terms', type: 'checkbox', label: 'I understand the coverage terms and premium obligations', required: true },
        { key: 'member_esign', type: 'esign', label: 'Member Signature', required: true },
      ],
      canContinue: (state) => !!state.ack_terms && !!state.member_esign,
    },
  ],
}
