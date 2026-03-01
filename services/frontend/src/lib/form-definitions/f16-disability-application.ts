/**
 * F16 Disability Retirement Application — apply for disability retirement benefits.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f16DisabilityApplication: FormDefinition = {
  formId: 'F16',
  formName: 'Disability Retirement Application',
  formDescription: 'Apply for disability retirement benefits due to inability to perform job duties.',
  processType: 'disability',
  estimatedMinutes: 30,
  steps: [
    {
      id: 'member-info',
      title: 'Member Information',
      description: 'Confirm your personal information.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
        { key: 'member_address', type: 'address', label: 'Current Mailing Address', required: true },
        { key: 'member_phone', type: 'phone', label: 'Phone Number', required: true },
        { key: 'member_email', type: 'email', label: 'Email Address' },
      ],
    },
    {
      id: 'employment',
      title: 'Employment Details',
      description: 'Current employment status and job information.',
      fields: [
        { key: 'employer', type: 'display', label: 'Employer', prepopulateFrom: 'member.employer', readOnly: true },
        { key: 'job_title', type: 'text', label: 'Job Title', required: true },
        { key: 'last_day_worked', type: 'date', label: 'Last Day Worked', required: true },
        { key: 'currently_working', type: 'radio', label: 'Are you currently working?', required: true, options: [
          { value: 'yes', label: 'Yes, with modifications' },
          { value: 'leave', label: 'No, on leave' },
          { value: 'no', label: 'No, separated from employment' },
        ]},
      ],
    },
    {
      id: 'disability-info',
      title: 'Disability Information',
      description: 'Describe your disabling condition.',
      fields: [
        { key: 'condition_description', type: 'textarea', label: 'Description of Disabling Condition', required: true, helpText: 'Describe the condition(s) that prevent you from performing your job duties' },
        { key: 'onset_date', type: 'date', label: 'Date Condition Began', required: true },
        { key: 'work_related', type: 'radio', label: 'Is this condition work-related?', required: true, options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ]},
        { key: 'workers_comp', type: 'radio', label: 'Have you filed a workers\u2019 compensation claim?', options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]},
      ],
    },
    {
      id: 'medical',
      title: 'Medical Provider Information',
      description: 'List your treating physicians.',
      fields: [
        { key: 'providers', type: 'repeating_group', label: 'Medical Providers', groupFields: [
          { key: 'provider_name', type: 'text', label: 'Physician/Provider Name' },
          { key: 'provider_specialty', type: 'text', label: 'Specialty' },
          { key: 'provider_phone', type: 'text', label: 'Phone' },
          { key: 'first_visit', type: 'date', label: 'First Visit Date' },
          { key: 'last_visit', type: 'date', label: 'Last Visit Date' },
        ]},
        { key: 'medical_records_upload', type: 'file_upload', label: 'Medical Records (if available)', helpText: 'Upload relevant medical documentation' },
      ],
    },
    {
      id: 'other-benefits',
      title: 'Other Benefits',
      description: 'Are you receiving or applying for other disability benefits?',
      fields: [
        { key: 'ssdi_applied', type: 'radio', label: 'Applied for Social Security Disability?', options: [
          { value: 'yes_approved', label: 'Yes, approved' },
          { value: 'yes_pending', label: 'Yes, pending' },
          { value: 'no', label: 'No' },
        ]},
        { key: 'other_disability', type: 'radio', label: 'Receiving other disability benefits?', options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]},
        { key: 'other_disability_detail', type: 'text', label: 'Describe other disability benefits', conditionalOn: { field: 'other_disability', operator: 'equals', value: 'yes' } },
      ],
    },
    {
      id: 'signature',
      title: 'Authorization & Signature',
      description: 'Authorize medical record release and sign.',
      fields: [
        { key: 'ack_medical_release', type: 'checkbox', label: 'I authorize my medical providers to release records to COPERA for evaluation of this application', required: true },
        { key: 'ack_exam', type: 'checkbox', label: 'I understand COPERA may require an independent medical examination', required: true },
        { key: 'ack_truthful', type: 'checkbox', label: 'I certify all information is true and complete', required: true },
        { key: 'member_esign', type: 'esign', label: 'Applicant Signature', required: true },
      ],
      canContinue: (state) => !!state.ack_medical_release && !!state.ack_exam && !!state.ack_truthful && !!state.member_esign,
    },
  ],
}
