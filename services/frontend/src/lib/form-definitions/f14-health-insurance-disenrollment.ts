/**
 * F14 Health Insurance Disenrollment — cancel COPERA health insurance coverage.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f14HealthInsuranceDisenrollment: FormDefinition = {
  formId: 'F14',
  formName: 'Health Insurance Disenrollment',
  formDescription: 'Cancel your COPERA health insurance coverage.',
  processType: 'life-change',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'member-info',
      title: 'Member Information',
      description: 'Confirm your identity.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'current_coverage', type: 'display', label: 'Current Coverage Type', prepopulateFrom: 'insurance.coverage_type' },
      ],
    },
    {
      id: 'reason',
      title: 'Reason for Disenrollment',
      description: 'Tell us why you\u2019re canceling.',
      fields: [
        { key: 'reason', type: 'radio', label: 'Reason', required: true, options: [
          { value: 'other_coverage', label: 'Obtained other coverage (Medicare, employer, etc.)' },
          { value: 'cost', label: 'Premium cost' },
          { value: 'medicare', label: 'Enrolled in Medicare' },
          { value: 'other', label: 'Other reason' },
        ]},
        { key: 'reason_detail', type: 'textarea', label: 'Additional Details', conditionalOn: { field: 'reason', operator: 'equals', value: 'other' } },
        { key: 'effective_date', type: 'date', label: 'Requested Effective Date', required: true },
      ],
    },
    {
      id: 'acknowledgement',
      title: 'Acknowledgement',
      description: 'Understand the impact of disenrollment.',
      fields: [
        { key: 'info_warning', type: 'info_block', label: 'Important', infoText: 'Once you disenroll from COPERA health insurance, you may not be able to re-enroll unless you experience a qualifying life event. Please consider this carefully.' },
        { key: 'ack_understand', type: 'checkbox', label: 'I understand I may not be able to re-enroll', required: true },
      ],
      canContinue: (state) => !!state.ack_understand,
    },
    {
      id: 'signature',
      title: 'Signature',
      description: 'Sign to confirm disenrollment.',
      fields: [
        { key: 'member_esign', type: 'esign', label: 'Member Signature', required: true },
      ],
      canContinue: (state) => !!state.member_esign,
    },
  ],
}
