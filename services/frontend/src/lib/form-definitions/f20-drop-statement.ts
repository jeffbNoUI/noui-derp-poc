/**
 * F20 DROP Statement Request — request a statement of the Deferred Retirement Option Plan balance.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f20DropStatement: FormDefinition = {
  formId: 'F20',
  formName: 'DROP Statement Request',
  formDescription: 'Request a statement of your Deferred Retirement Option Plan (DROP) account balance.',
  processType: 'account',
  estimatedMinutes: 3,
  steps: [
    {
      id: 'member-info',
      title: 'Member Information',
      description: 'Confirm your identity and request details.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_ssn', type: 'ssn', label: 'SSN', prepopulateFrom: 'member.ssn' },
        { key: 'statement_type', type: 'radio', label: 'Statement Type', required: true, options: [
          { value: 'current', label: 'Current balance statement' },
          { value: 'projection', label: 'Projected balance at retirement date' },
        ]},
        { key: 'projected_date', type: 'date', label: 'Projected Retirement Date', conditionalOn: { field: 'statement_type', operator: 'equals', value: 'projection' } },
      ],
    },
    {
      id: 'delivery',
      title: 'Delivery & Signature',
      description: 'How would you like to receive the statement?',
      fields: [
        { key: 'delivery_method', type: 'radio', label: 'Delivery Method', required: true, options: [
          { value: 'portal', label: 'View in portal (immediate)' },
          { value: 'email', label: 'Email' },
          { value: 'mail', label: 'US Mail' },
        ]},
        { key: 'member_esign', type: 'esign', label: 'Member Signature', required: true },
      ],
      canContinue: (state) => !!state.member_esign,
    },
  ],
}
