/**
 * F06 DRO Parties Information — detailed contact and employment information for both parties.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f06DroPartiesInfo: FormDefinition = {
  formId: 'F06',
  formName: 'DRO Parties Information Sheet',
  formDescription: 'Detailed information for both parties involved in the domestic relations order.',
  processType: 'dro',
  estimatedMinutes: 15,
  steps: [
    {
      id: 'member-detail',
      title: 'Member Details',
      description: 'Confirm member employment and contact information.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Full Legal Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_address', type: 'address', label: 'Current Mailing Address', required: true },
        { key: 'member_phone', type: 'phone', label: 'Phone Number', required: true },
        { key: 'member_email', type: 'email', label: 'Email Address' },
        { key: 'member_employer', type: 'display', label: 'Employer', prepopulateFrom: 'member.employer', readOnly: true },
      ],
    },
    {
      id: 'alt-payee-detail',
      title: 'Alternate Payee Details',
      description: 'Former spouse contact and identification.',
      fields: [
        { key: 'alt_payee_name', type: 'text', label: 'Full Legal Name', required: true },
        { key: 'alt_payee_maiden', type: 'text', label: 'Maiden Name (if applicable)' },
        { key: 'alt_payee_dob', type: 'date', label: 'Date of Birth', required: true },
        { key: 'alt_payee_address', type: 'address', label: 'Current Mailing Address', required: true },
        { key: 'alt_payee_phone', type: 'phone', label: 'Phone Number', required: true },
        { key: 'alt_payee_email', type: 'email', label: 'Email Address' },
      ],
    },
    {
      id: 'benefit-history',
      title: 'Employment & Benefit History',
      description: 'Key dates for marital fraction calculation.',
      fields: [
        { key: 'member_hire_date', type: 'display', label: 'COPERA Membership Start', prepopulateFrom: 'member.hire_date', readOnly: true },
        { key: 'marriage_date', type: 'date', label: 'Date of Marriage', required: true },
        { key: 'separation_date', type: 'date', label: 'Date of Separation' },
        { key: 'divorce_date', type: 'date', label: 'Date of Divorce Decree' },
        { key: 'member_retirement_status', type: 'radio', label: 'Member\u2019s Current Status', options: [
          { value: 'active', label: 'Active Employee' },
          { value: 'retired', label: 'Retired' },
          { value: 'deferred', label: 'Deferred Vested' },
        ]},
      ],
    },
    {
      id: 'contact-prefs',
      title: 'Contact Preferences',
      description: 'How should COPERA communicate regarding this DRO?',
      fields: [
        { key: 'contact_member_via', type: 'select', label: 'Member preferred contact', options: [
          { value: 'mail', label: 'Mail' },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
        ]},
        { key: 'contact_alt_payee_via', type: 'select', label: 'Alternate payee preferred contact', options: [
          { value: 'mail', label: 'Mail' },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
        ]},
        { key: 'info_privacy', type: 'info_block', label: 'Privacy Notice', infoText: 'COPERA will communicate separately with each party. Neither party will receive copies of correspondence sent to the other party.' },
      ],
    },
  ],
}
