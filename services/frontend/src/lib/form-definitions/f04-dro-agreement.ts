/**
 * F04 Domestic Relations Order Agreement — terms of benefit division in divorce.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f04DroAgreement: FormDefinition = {
  formId: 'F04',
  formName: 'Domestic Relations Order Agreement',
  formDescription: 'Agreement between member and former spouse for division of retirement benefits.',
  processType: 'dro',
  estimatedMinutes: 25,
  steps: [
    {
      id: 'parties',
      title: 'Party Information',
      description: 'Identify both parties to the DRO.',
      fields: [
        { key: 'section_member', type: 'section_header', label: 'Member (Plan Participant)' },
        { key: 'member_name', type: 'display', label: 'Member Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
        { key: 'member_ssn', type: 'ssn', label: 'Member SSN', prepopulateFrom: 'member.ssn' },
        { key: 'section_alt_payee', type: 'section_header', label: 'Alternate Payee (Former Spouse)' },
        { key: 'alt_payee_name', type: 'text', label: 'Former Spouse Full Legal Name', required: true },
        { key: 'alt_payee_dob', type: 'date', label: 'Former Spouse Date of Birth', required: true },
        { key: 'alt_payee_ssn_last4', type: 'text', label: 'Former Spouse SSN (Last 4)', required: true },
        { key: 'alt_payee_address', type: 'address', label: 'Former Spouse Mailing Address', required: true },
      ],
    },
    {
      id: 'marriage-divorce',
      title: 'Marriage & Divorce Details',
      description: 'Dates relevant to the marital fraction calculation.',
      fields: [
        { key: 'info_marital', type: 'info_block', label: 'Why These Dates Matter', infoText: 'DERP uses the marital fraction (overlap of marriage and DERP membership) to determine the portion of benefits subject to division. Only service earned during the marriage is divisible.' },
        { key: 'marriage_date', type: 'date', label: 'Date of Marriage', required: true },
        { key: 'divorce_date', type: 'date', label: 'Date of Divorce (or expected)', required: true },
        { key: 'member_hire_date', type: 'display', label: 'DERP Membership Start', prepopulateFrom: 'member.hire_date', readOnly: true },
      ],
    },
    {
      id: 'division-terms',
      title: 'Benefit Division Terms',
      description: 'Specify how the benefit will be divided.',
      fields: [
        { key: 'division_method', type: 'radio', label: 'Division Method', required: true, options: [
          { value: 'percentage', label: 'Percentage of marital portion' },
          { value: 'fixed', label: 'Fixed dollar amount' },
        ]},
        { key: 'division_percentage', type: 'text', label: 'Percentage to Alternate Payee', helpText: 'e.g., 50', conditionalOn: { field: 'division_method', operator: 'equals', value: 'percentage' } },
        { key: 'division_amount', type: 'currency', label: 'Fixed Monthly Amount', conditionalOn: { field: 'division_method', operator: 'equals', value: 'fixed' } },
        { key: 'cola_included', type: 'radio', label: 'Does alternate payee share in COLA adjustments?', options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]},
      ],
    },
    {
      id: 'payment-terms',
      title: 'Payment Terms',
      description: 'When and how the alternate payee receives benefits.',
      fields: [
        { key: 'payment_start', type: 'radio', label: 'When does alternate payee\u2019s benefit begin?', required: true, options: [
          { value: 'member_retirement', label: 'When the member retires' },
          { value: 'member_eligible', label: 'When member first becomes eligible' },
          { value: 'immediate', label: 'Immediately (if member is already retired)' },
        ]},
        { key: 'payment_duration', type: 'radio', label: 'Duration of alternate payee\u2019s benefit', required: true, options: [
          { value: 'alt_payee_life', label: 'Lifetime of alternate payee' },
          { value: 'member_life', label: 'Lifetime of member' },
        ]},
        { key: 'death_benefit_provision', type: 'radio', label: 'If alternate payee dies before member:', options: [
          { value: 'revert', label: 'Benefit reverts to member' },
          { value: 'estate', label: 'Benefit goes to alternate payee\u2019s estate' },
        ]},
      ],
    },
    {
      id: 'signatures',
      title: 'Signatures',
      description: 'Both parties must sign the agreement.',
      fields: [
        { key: 'info_legal', type: 'info_block', label: 'Legal Notice', infoText: 'This agreement must be incorporated into a court order and submitted to DERP for approval. DERP will review the order to ensure it complies with plan provisions. Both parties should seek independent legal counsel.' },
        { key: 'member_esign', type: 'esign', label: 'Member Signature', helpText: 'I agree to the terms of this domestic relations order', required: true },
        { key: 'alt_payee_esign', type: 'esign', label: 'Alternate Payee Signature', helpText: 'I agree to the terms of this domestic relations order', required: true },
      ],
      canContinue: (state) => !!state.member_esign && !!state.alt_payee_esign,
    },
  ],
}
