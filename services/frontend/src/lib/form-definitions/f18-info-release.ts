/**
 * F18 Information Release Authorization — authorize COPERA to share info with a third party.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f18InfoRelease: FormDefinition = {
  formId: 'F18',
  formName: 'Information Release Authorization',
  formDescription: 'Authorize COPERA to release your account information to a designated third party.',
  processType: 'account',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'member-info',
      title: 'Member Information',
      description: 'Confirm your identity.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_ssn', type: 'ssn', label: 'SSN', prepopulateFrom: 'member.ssn' },
      ],
    },
    {
      id: 'release-details',
      title: 'Release Details',
      description: 'Specify who can access your information.',
      fields: [
        { key: 'release_to', type: 'text', label: 'Release Information To', required: true, helpText: 'Name of person, attorney, or organization' },
        { key: 'release_relationship', type: 'text', label: 'Their Relationship to You', required: true },
        { key: 'purpose', type: 'text', label: 'Purpose of Release', required: true, helpText: 'e.g., Financial planning, legal proceedings' },
        { key: 'info_types', type: 'radio', label: 'Scope of Information', required: true, options: [
          { value: 'all', label: 'All account information' },
          { value: 'limited', label: 'Limited (specify below)' },
        ]},
        { key: 'info_limited_detail', type: 'textarea', label: 'Specific Information to Release', conditionalOn: { field: 'info_types', operator: 'equals', value: 'limited' } },
        { key: 'expiration', type: 'date', label: 'Authorization Expiration Date', helpText: 'Leave blank for 12-month default' },
      ],
    },
    {
      id: 'signature',
      title: 'Signature',
      description: 'Authorize the release.',
      fields: [
        { key: 'member_esign', type: 'esign', label: 'Member Signature', helpText: 'I authorize the release of information as described above', required: true },
      ],
      canContinue: (state) => !!state.member_esign,
    },
  ],
}
