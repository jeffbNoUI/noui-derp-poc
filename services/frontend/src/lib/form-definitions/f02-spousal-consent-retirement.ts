/**
 * F02 Spousal Consent for Retirement — spouse acknowledges benefit election.
 * Required when member is married and elects non-maximum benefit option.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f02SpousalConsentRetirement: FormDefinition = {
  formId: 'F02',
  formName: 'Spousal Consent for Retirement',
  formDescription: 'Required when a married member retires. Spouse acknowledges the benefit election.',
  processType: 'retirement',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'spouse-info',
      title: 'Spouse Information',
      description: 'Confirm spouse identity and contact details.',
      fields: [
        { key: 'member_name', type: 'display', label: 'Member Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_ssn', type: 'ssn', label: 'Member SSN', prepopulateFrom: 'member.ssn' },
        { key: 'spouse_name', type: 'text', label: 'Spouse Full Legal Name', required: true },
        { key: 'spouse_dob', type: 'date', label: 'Spouse Date of Birth', required: true },
        { key: 'spouse_ssn_last4', type: 'text', label: 'Spouse SSN (Last 4 digits)', required: true, helpText: 'Last 4 digits only' },
        { key: 'spouse_address', type: 'address', label: 'Spouse Mailing Address', required: true },
        { key: 'spouse_phone', type: 'phone', label: 'Spouse Phone' },
        { key: 'spouse_email', type: 'email', label: 'Spouse Email' },
      ],
    },
    {
      id: 'election-awareness',
      title: 'Benefit Election Awareness',
      description: 'Review the member\u2019s selected benefit option and its impact on survivor benefits.',
      fields: [
        { key: 'info_election', type: 'info_block', label: 'About Benefit Elections', infoText: 'Your spouse has chosen a benefit payment option. Some options provide ongoing payments to you after the member\u2019s death, while others provide a higher monthly benefit but no survivor continuation. Your consent is required for certain elections.' },
        { key: 'payment_option', type: 'display', label: 'Member\u2019s Selected Payment Option', prepopulateFrom: 'benefit.payment_option' },
        { key: 'survivor_benefit', type: 'display', label: 'Survivor Benefit (if applicable)', prepopulateFrom: 'benefit.survivor_amount' },
        { key: 'acknowledge_election', type: 'checkbox', label: 'I understand the benefit election and its impact on survivor benefits', required: true },
      ],
      canContinue: (state) => !!state.acknowledge_election,
    },
    {
      id: 'consent-signature',
      title: 'Consent & Signature',
      description: 'Sign to confirm your consent to the benefit election.',
      fields: [
        { key: 'consent_statement', type: 'info_block', label: 'Consent Statement', infoText: 'By signing below, I acknowledge that I have been informed of my spouse\u2019s retirement benefit election. I understand the impact on any survivor benefits I may be entitled to receive.' },
        { key: 'spouse_esign', type: 'esign', label: 'I consent to the benefit election described above', helpText: 'This electronic signature will be recorded with a timestamp', required: true },
        { key: 'notarize_info', type: 'info_block', label: 'Notarization Required', infoText: 'A notarized copy of this consent form must be submitted to DERP before the retirement application can be finalized.' },
      ],
      canContinue: (state) => !!state.spouse_esign,
    },
  ],
}
