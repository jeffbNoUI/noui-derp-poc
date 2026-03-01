/**
 * Correspondence letter templates for COPERA retirement processing.
 * Extracted from standalone CorrespondenceComposer demo for reuse by mini-panel.
 * Consumed by: CorrespondenceComposer.tsx (standalone demo), CorrespondenceMiniPanel.tsx (utility rail)
 * Depends on: none (pure data)
 */

export interface CorrespondenceTemplate {
  id: string
  title: string
  description: string
  category: 'approval' | 'request' | 'notice' | 'acknowledgment'
  variables: string[]
  body: string
}

export const CORRESPONDENCE_TEMPLATES: CorrespondenceTemplate[] = [
  {
    id: 'retirement-approval',
    title: 'Retirement Approval Letter',
    description: 'Official notification of approved retirement application with benefit details',
    category: 'approval',
    variables: ['member_name', 'retirement_type', 'retirement_date', 'last_day_worked', 'benefit_amount', 'payment_option'],
    body: `Dear {{member_name}},

We are pleased to confirm that your application for {{retirement_type}} retirement from the Colorado Public Employees' Retirement Association has been approved, effective {{retirement_date}}. Your last day of active employment is recorded as {{last_day_worked}}.

Your elected monthly benefit amount is {{benefit_amount}} under the {{payment_option}} payment option. This election is irrevocable after your first benefit payment is processed.

Your first retirement benefit payment will be processed on {{retirement_date}}, contingent upon receipt of all required documentation.

Sincerely,
Colorado Public Employees' Retirement Association
Benefits Administration`,
  },
  {
    id: 'missing-documents',
    title: 'Missing Documents Request',
    description: 'Request for outstanding documents needed to complete retirement processing',
    category: 'request',
    variables: ['member_name', 'retirement_date', 'missing_items'],
    body: `Dear {{member_name}},

We are writing regarding your pending retirement application with an effective date of {{retirement_date}}. To complete processing, we require the following documentation:

{{missing_items}}

Please submit these items at your earliest convenience. Applications received after the 15th of the month prior to the retirement effective date may experience delayed first payment processing.

If you have questions, please contact COPERA Member Services at 1-800-759-7372.

Sincerely,
Colorado Public Employees' Retirement Association
Benefits Administration`,
  },
  {
    id: 'early-retirement-notice',
    title: 'Early Retirement Reduction Notice',
    description: 'Formal notice of permanent early retirement benefit reduction',
    category: 'notice',
    variables: ['member_name', 'reduction_percent', 'years_under_65', 'unreduced_amount', 'reduced_amount'],
    body: `Dear {{member_name}},

This letter serves as formal notice that your retirement benefit includes a permanent early retirement reduction of {{reduction_percent}} ({{years_under_65}} years under age 65).

Unreduced benefit: {{unreduced_amount}}/month
After reduction: {{reduced_amount}}/month

This reduction is a permanent adjustment and will remain in effect for the duration of your retirement. It also applies to any future cost-of-living adjustments that may be approved by the Board.

Sincerely,
Colorado Public Employees' Retirement Association
Benefits Administration`,
  },
  {
    id: 'application-received',
    title: 'Application Acknowledgment',
    description: 'Acknowledgment of received retirement application with processing timeline',
    category: 'acknowledgment',
    variables: ['member_name', 'received_date', 'retirement_date'],
    body: `Dear {{member_name}},

This letter confirms that your retirement application was received on {{received_date}}. Your requested retirement effective date is {{retirement_date}}.

Your application is now in processing. A benefits analyst will review your application and verify all information. You will receive a detailed benefit determination letter once processing is complete.

If you have questions about the status of your application, please contact COPERA Member Services at 1-800-759-7372.

Sincerely,
Colorado Public Employees' Retirement Association
Benefits Administration`,
  },
  {
    id: 'dro-notice',
    title: 'DRO Division Notice',
    description: 'Notice of benefit division per Domestic Relations Order',
    category: 'notice',
    variables: ['member_name', 'alternate_payee', 'marital_fraction', 'award_percentage', 'member_net_benefit', 'alternate_benefit'],
    body: `Dear {{member_name}},

A Domestic Relations Order (DRO) is on file for your retirement account. The following division has been applied per the court order:

Alternate Payee: {{alternate_payee}}
Marital Fraction: {{marital_fraction}}
DRO Award: {{award_percentage}} of marital share

Your Net Benefit: {{member_net_benefit}}/month
Alternate Payee Benefit: {{alternate_benefit}}/month

The alternate payee will receive separate correspondence regarding their benefit and payment options.

Sincerely,
Colorado Public Employees' Retirement Association
Benefits Administration`,
  },
]

/** Interpolate template variables into body text */
export function interpolateTemplate(
  template: CorrespondenceTemplate,
  values: Record<string, string>,
): string {
  let result = template.body
  for (const [key, val] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
  }
  return result
}
