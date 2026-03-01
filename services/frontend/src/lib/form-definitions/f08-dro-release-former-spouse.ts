/**
 * F08 DRO Release of Information (Former Spouse) — former spouse requests benefit info.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f08DroReleaseFormerSpouse: FormDefinition = {
  formId: 'F08',
  formName: 'DRO Release of Information (Former Spouse)',
  formDescription: 'Former spouse requests release of member benefit information for DRO proceedings.',
  processType: 'dro',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'requester-info',
      title: 'Requester Information',
      description: 'Identify yourself as the former spouse.',
      fields: [
        { key: 'requester_name', type: 'text', label: 'Your Full Legal Name', required: true },
        { key: 'requester_dob', type: 'date', label: 'Your Date of Birth', required: true },
        { key: 'requester_address', type: 'address', label: 'Your Mailing Address', required: true },
        { key: 'member_name', type: 'text', label: 'COPERA Member Name', required: true },
      ],
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis',
      description: 'Provide documentation of the divorce proceedings.',
      fields: [
        { key: 'case_number', type: 'text', label: 'Court Case Number', required: true },
        { key: 'court_name', type: 'text', label: 'Court Name', required: true },
        { key: 'court_order_upload', type: 'file_upload', label: 'Court Order or Filing (if available)', helpText: 'Upload a copy of the divorce decree or pending case filing' },
      ],
    },
    {
      id: 'signature',
      title: 'Signature',
      description: 'Sign the request.',
      fields: [
        { key: 'info_notice', type: 'info_block', label: 'Notice', infoText: 'COPERA may require additional verification or a signed release from the member before disclosing certain information. You will be notified of any additional requirements.' },
        { key: 'requester_esign', type: 'esign', label: 'Requester Signature', helpText: 'I certify the information provided is true and correct', required: true },
      ],
      canContinue: (state) => !!state.requester_esign,
    },
  ],
}
