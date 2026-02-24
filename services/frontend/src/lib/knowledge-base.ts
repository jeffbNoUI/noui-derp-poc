/**
 * DERP plan provision knowledge base — searchable provisions with statutory citations.
 * Shared data extracted from standalone KnowledgeAssistant demo for reuse by mini-panel.
 * Consumed by: KnowledgeAssistant.tsx (standalone demo), KnowledgeMiniPanel.tsx (utility rail)
 * Depends on: none (pure data)
 */

export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  provision: string
  citation: string
  tier: string
  related: string[]
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "rule-75",
    keywords: ["rule of 75", "rule 75", "unreduced", "age plus service"],
    title: "Rule of 75 (Tier 1 & Tier 2)",
    provision: "Members qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 75, provided the member has attained a minimum age of 55. Only earned service credit counts toward Rule of 75 eligibility \u2014 purchased service is excluded.",
    citation: "RMC \u00A718-403(a)",
    tier: "Tier 1 & 2",
    related: ["purchased-service-eligibility", "early-retirement"],
  },
  {
    id: "rule-85",
    keywords: ["rule of 85", "rule 85", "tier 3 unreduced"],
    title: "Rule of 85 (Tier 3)",
    provision: "Tier 3 members qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 85, provided the member has attained a minimum age of 60. Only earned service credit counts \u2014 purchased service is excluded from the Rule of 85 calculation.",
    citation: "RMC \u00A718-403(b)",
    tier: "Tier 3",
    related: ["early-retirement-tier3"],
  },
  {
    id: "purchased-service-eligibility",
    keywords: ["purchased service", "service purchase", "buy service", "purchased service eligibility", "purchased service rule of 75", "purchased service rule of 85"],
    title: "Purchased Service \u2014 Eligibility Impact",
    provision: "Purchased service credit counts toward the benefit calculation formula (multiplier \u00D7 AMS \u00D7 total years of service including purchased) but is excluded from Rule of 75/85 eligibility determinations (age + earned service only). Purchased service also does not count toward the Insurance Premium Reduction (IPR) benefit calculation.",
    citation: "RMC \u00A718-403, \u00A718-411",
    tier: "All Tiers",
    related: ["rule-75", "rule-85", "benefit-formula"],
  },
  {
    id: "early-retirement",
    keywords: ["early retirement", "early retirement reduction", "reduced benefit", "retire early", "reduction factor"],
    title: "Early Retirement Reduction (Tier 1 & Tier 2)",
    provision: "Members age 55 or older with at least 5 years of service who do not meet Rule of 75 may elect early retirement with a permanent reduction of 3% per year for each year the member's age is below 65 at retirement. The reduction uses completed years \u2014 partial years are not prorated. The reduction is applied to the unreduced benefit amount.",
    citation: "RMC \u00A718-404(a)",
    tier: "Tier 1 & 2",
    related: ["rule-75", "normal-retirement"],
  },
  {
    id: "early-retirement-tier3",
    keywords: ["early retirement tier 3", "tier 3 reduction", "6 percent", "6% reduction"],
    title: "Early Retirement Reduction (Tier 3)",
    provision: "Tier 3 members age 60 or older with at least 5 years of service who do not meet Rule of 85 may elect early retirement with a permanent reduction of 6% per year for each year the member's age is below 65 at retirement. The reduction uses completed years. Note the higher minimum age (60 vs. 55) and steeper reduction rate (6% vs. 3%) compared to Tier 1 and Tier 2.",
    citation: "RMC \u00A718-404(b)",
    tier: "Tier 3",
    related: ["rule-85", "normal-retirement"],
  },
  {
    id: "benefit-formula",
    keywords: ["benefit formula", "calculation", "multiplier", "how calculated", "benefit amount", "ams"],
    title: "Benefit Calculation Formula",
    provision: "The monthly retirement benefit is calculated as: Multiplier \u00D7 AMS \u00D7 Years of Service. Tier 1: 2.0% multiplier, AMS = highest 36 consecutive months. Tier 2: 1.5% multiplier, AMS = highest 36 consecutive months. Tier 3: 1.5% multiplier, AMS = highest 60 consecutive months. Total years of service includes both earned and purchased service credit.",
    citation: "RMC \u00A718-401, \u00A718-402",
    tier: "All Tiers",
    related: ["ams-window", "purchased-service-eligibility"],
  },
  {
    id: "ams-window",
    keywords: ["ams", "average monthly salary", "highest salary", "salary window", "36 months", "60 months", "consecutive months"],
    title: "Average Monthly Salary (AMS) Window",
    provision: "AMS is the average of the member's highest consecutive months of pensionable compensation. Tier 1 and Tier 2: highest 36 consecutive months. Tier 3: highest 60 consecutive months. Leave payouts (sick/vacation cash-out) included in final month's compensation for members hired before January 1, 2010. Furlough periods within the AMS window may reduce the average; members can purchase furlough days to negate the impact.",
    citation: "RMC \u00A718-391(3), \u00A718-401",
    tier: "All Tiers",
    related: ["leave-payout", "benefit-formula"],
  },
  {
    id: "leave-payout",
    keywords: ["leave payout", "sick leave", "vacation", "cash out", "leave cashout", "unused leave"],
    title: "Leave Payout Impact on Pension",
    provision: "Members hired before January 1, 2010 who receive a lump-sum payout for unused sick and/or vacation leave at separation have that amount included in their final month's pensionable compensation. This can significantly increase the AMS if the final month falls within the highest-salary window. Members hired on or after January 1, 2010 do not receive this benefit. The leave payout is subject to employee pension contributions (8.45%).",
    citation: "RMC \u00A718-391(13), \u00A718-396",
    tier: "Tier 1 & 2 (pre-2010 hire)",
    related: ["ams-window", "benefit-formula"],
  },
  {
    id: "payment-options",
    keywords: ["payment option", "joint and survivor", "j&s", "maximum", "single life", "annuity", "payment choices"],
    title: "Payment Options at Retirement",
    provision: "Four payment options available: Maximum (Single Life) \u2014 highest monthly amount, payments cease at death. 100% Joint & Survivor \u2014 reduced monthly amount, surviving beneficiary receives 100% of the benefit. 75% J&S \u2014 slightly higher than 100% J&S, survivor receives 75%. 50% J&S \u2014 highest J&S option, survivor receives 50%. If married, spouse must be named as beneficiary for at least 50% J&S unless spouse provides notarized consent to a different election. Payment option is irrevocable after first payment.",
    citation: "RMC \u00A718-405, \u00A718-406",
    tier: "All Tiers",
    related: ["spousal-consent"],
  },
  {
    id: "spousal-consent",
    keywords: ["spousal consent", "spouse", "married", "consent form", "notarized"],
    title: "Spousal Consent Requirement",
    provision: "If a member is married at retirement, the spouse must be designated as beneficiary for at least a 50% Joint & Survivor option. If the member wishes to elect a different option (Maximum/Single Life or naming someone other than spouse), the spouse must provide notarized written consent. Spousal consent must be executed on the DERP-provided form and submitted with the retirement application.",
    citation: "RMC \u00A718-406(c)",
    tier: "All Tiers",
    related: ["payment-options"],
  },
  {
    id: "dro-basics",
    keywords: ["dro", "domestic relations order", "qdro", "divorce", "marital share", "ex-spouse", "former spouse"],
    title: "Domestic Relations Orders (DRO)",
    provision: "A DRO divides a member's pension benefit with a former spouse. The division is based on the marital share: the portion of service credit earned during the marriage while employed in a DERP-covered position. The marital fraction is: months of service during marriage \u00F7 total months of service at retirement. The DRO can award a percentage or specific dollar amount of the marital share to the alternate payee. The alternate payee's benefit begins when the member retires.",
    citation: "RMC \u00A718-430.1 through \u00A718-430.7",
    tier: "All Tiers",
    related: ["payment-options"],
  },
  {
    id: "vesting",
    keywords: ["vesting", "vested", "5 years", "refund", "non-vested"],
    title: "Vesting Requirement",
    provision: "Members vest after 5 years of service credit. Non-vested members who separate from employment may request a refund of their employee contributions plus accumulated interest. A 90-day waiting period from separation is required before refund eligibility. Vested members who separate before retirement eligibility retain a deferred benefit payable at retirement age.",
    citation: "RMC \u00A718-397, \u00A718-398",
    tier: "All Tiers",
    related: [],
  },
  {
    id: "lump-sum-death",
    keywords: ["death benefit", "lump sum", "lump-sum death", "death", "survivor"],
    title: "Lump-Sum Death Benefit",
    provision: "At retirement, members elect a lump-sum death benefit payable as 50 or 100 monthly installments. Election is irrevocable. For normal retirement or Rule of 75/85: $5,000. For early retirement Tier 1 & 2: $5,000 minus $250 per year under age 65. For early retirement Tier 3: $5,000 minus $500 per year under age 65. The installment option determines the monthly payment amount to the beneficiary.",
    citation: "RMC \u00A718-407",
    tier: "All Tiers",
    related: ["early-retirement", "early-retirement-tier3"],
  },
  {
    id: "application-deadline",
    keywords: ["application deadline", "30 days", "filing window", "notarized", "application timing"],
    title: "Retirement Application Filing Deadline",
    provision: "The retirement application must be received by DERP within 30 days of the member's last day worked. The application must be notarized. Processing cutoff: complete retirement packages received by the 15th of the month prior to the retirement effective date ensure on-time first payment processing.",
    citation: "RMC \u00A718-400",
    tier: "All Tiers",
    related: [],
  },
  {
    id: "ipr",
    keywords: ["ipr", "insurance premium reduction", "health insurance", "medicare"],
    title: "Insurance Premium Reduction (IPR)",
    provision: "Retirees may receive an Insurance Premium Reduction to offset health insurance costs. Rate: $6.25 per year of earned service credit for Medicare-eligible retirees. $12.50 per year of earned service for non-Medicare-eligible retirees. Only earned service counts \u2014 purchased service and military service credit are excluded from IPR calculation.",
    citation: "RMC \u00A718-412",
    tier: "All Tiers",
    related: ["purchased-service-eligibility"],
  },
]

/** Search knowledge base by query string, returning scored results */
export function searchKnowledge(query: string): (KnowledgeEntry & { score: number })[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const terms = q.split(/\s+/)
  return KNOWLEDGE_BASE.map(entry => {
    let score = 0
    const allText = [entry.title, ...entry.keywords, entry.provision].join(' ').toLowerCase()
    for (const term of terms) {
      if (entry.keywords.some(k => k.includes(term))) score += 10
      if (entry.title.toLowerCase().includes(term)) score += 5
      if (allText.includes(term)) score += 2
    }
    if (entry.keywords.some(k => k.includes(q))) score += 20
    return { ...entry, score }
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
}
