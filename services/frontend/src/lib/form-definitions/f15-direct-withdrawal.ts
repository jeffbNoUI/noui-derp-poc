/**
 * F15 Direct Withdrawal/Refund Request — request withdrawal of member contributions.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f15DirectWithdrawal: FormDefinition = {
  formId: 'F15',
  formName: 'Direct Withdrawal/Refund Request',
  formDescription: 'Request withdrawal of your employee contributions upon separation from service.',
  processType: 'account',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'member-info',
      title: 'Member & Employment Information',
      description: 'Confirm your information and separation details.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'separation_date', type: 'date', label: 'Last Day of Employment', required: true },
        { key: 'separation_reason', type: 'select', label: 'Reason for Separation', required: true, options: [
          { value: 'resignation', label: 'Resignation' },
          { value: 'termination', label: 'Termination' },
          { value: 'layoff', label: 'Layoff' },
          { value: 'other', label: 'Other' },
        ]},
        { key: 'info_vesting', type: 'info_block', label: 'Vesting Notice', infoText: 'If you have 5 or more years of service, you are vested and may be entitled to a deferred retirement benefit. Withdrawing contributions means forfeiting this benefit. Contact COPERA for a comparison.' },
        { key: 'payment_method', type: 'radio', label: 'Payment Method', required: true, options: [
          { value: 'direct_rollover', label: 'Direct rollover to IRA/401k (no tax withholding)' },
          { value: 'direct_payment', label: 'Direct payment to me (20% federal tax withheld)' },
          { value: 'split', label: 'Split between rollover and direct payment' },
        ]},
        { key: 'rollover_institution', type: 'text', label: 'Rollover Institution Name', conditionalOn: { field: 'payment_method', operator: 'not_equals', value: 'direct_payment' }, helpText: 'Name of IRA custodian or 401k plan' },
        { key: 'rollover_account', type: 'text', label: 'Rollover Account Number', conditionalOn: { field: 'payment_method', operator: 'not_equals', value: 'direct_payment' } },
      ],
    },
    {
      id: 'signature',
      title: 'Certification & Signature',
      description: 'Acknowledge and sign.',
      fields: [
        { key: 'ack_forfeit', type: 'checkbox', label: 'I understand that by withdrawing my contributions, I forfeit any future retirement benefit from COPERA', required: true },
        { key: 'ack_tax', type: 'checkbox', label: 'I understand the tax implications of my payment election', required: true },
        { key: 'member_esign', type: 'esign', label: 'Member Signature', required: true },
      ],
      canContinue: (state) => !!state.ack_forfeit && !!state.ack_tax && !!state.member_esign,
    },
  ],
}
