/**
 * F07 DRO Release of Information (Member) — member authorizes release of benefit info for DRO.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f07DroReleaseMember: FormDefinition = {
  formId: 'F07',
  formName: 'DRO Release of Information (Member)',
  formDescription: 'Member authorizes COPERA to release benefit information for domestic relations proceedings.',
  processType: 'dro',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'member-id',
      title: 'Member Identification',
      description: 'Confirm your identity.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_ssn', type: 'ssn', label: 'SSN', prepopulateFrom: 'member.ssn' },
        { key: 'member_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
      ],
    },
    {
      id: 'release-scope',
      title: 'Release Authorization',
      description: 'Specify what information may be released.',
      fields: [
        { key: 'release_to', type: 'text', label: 'Release information to', required: true, helpText: 'Name of attorney or former spouse' },
        { key: 'info_scope', type: 'info_block', label: 'Information That May Be Released', infoText: 'Service credit history, estimated benefit amounts, benefit payment options, and any other information necessary for equitable division of retirement benefits.' },
        { key: 'authorize_release', type: 'checkbox', label: 'I authorize COPERA to release my benefit information as described above', required: true },
      ],
      canContinue: (state) => !!state.authorize_release,
    },
    {
      id: 'signature',
      title: 'Signature',
      description: 'Sign to authorize the release.',
      fields: [
        { key: 'member_esign', type: 'esign', label: 'Member Signature', helpText: 'I authorize the release of information described above', required: true },
      ],
      canContinue: (state) => !!state.member_esign,
    },
  ],
}
