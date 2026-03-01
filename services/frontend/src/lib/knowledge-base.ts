/**
 * COPERA plan provision knowledge base — searchable provisions with statutory citations.
 * Shared data extracted for reuse by knowledge panel components.
 * Consumed by: KnowledgeAssistant.tsx, KnowledgeMiniPanel.tsx
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
    id: "rule-of-80",
    keywords: ["rule of 80", "rule 80", "unreduced", "age plus service", "pera 1", "dps 1"],
    title: "Rule of 80 (Pre-2007 / DPS Pre-2005)",
    provision: "Members in HAS Tables PERA 1-3 or DPS 1 qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 80, provided the member has attained a minimum age of 50 (PERA 1) or 55 (others). Only earned service credit counts — purchased service is excluded.",
    citation: "C.R.S. §24-51-602",
    tier: "PERA 1-3, DPS 1",
    related: ["purchased-service-eligibility", "early-retirement"],
  },
  {
    id: "rule-of-85",
    keywords: ["rule of 85", "rule 85", "post-2011 unreduced", "pera 4", "pera 5", "pera 6"],
    title: "Rule of 85 (Post-2011, Vested Pre-2020)",
    provision: "Members in HAS Tables PERA 4-6 and DPS 2-3 qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 85, provided the member has attained a minimum age of 55. Only earned service credit counts — purchased service is excluded.",
    citation: "C.R.S. §24-51-602",
    tier: "PERA 4-6, DPS 2-3",
    related: ["rule-of-90", "early-retirement"],
  },
  {
    id: "rule-of-90",
    keywords: ["rule of 90", "rule 90", "post-2020 unreduced", "pera 7", "pera 8", "pera 9"],
    title: "Rule of 90 (Post-2020 Unvested)",
    provision: "Members in HAS Tables PERA 7-9 and DPS 4 qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 90, provided the member has attained a minimum age of 60. Only earned service credit counts — purchased service is excluded.",
    citation: "C.R.S. §24-51-602",
    tier: "PERA 7-9, DPS 4",
    related: ["rule-of-85", "early-retirement"],
  },
  {
    id: "purchased-service-eligibility",
    keywords: ["purchased service", "service purchase", "buy service", "purchased service eligibility"],
    title: "Purchased Service — Eligibility Impact",
    provision: "Purchased service credit counts toward the benefit calculation formula (2.5% x HAS x total years including purchased) but is excluded from Rule of N eligibility determinations (age + earned service only). Purchased service also does not count toward vesting.",
    citation: "C.R.S. §24-51-403, §24-51-503",
    tier: "All Divisions",
    related: ["rule-of-80", "rule-of-85", "benefit-formula"],
  },
  {
    id: "early-retirement",
    keywords: ["early retirement", "early retirement reduction", "reduced benefit", "retire early", "reduction factor"],
    title: "Early Retirement Reduction",
    provision: "Members who meet minimum age and service requirements but do not qualify for unreduced retirement may elect early retirement with a permanent reduction. Pre-2011 eligible (PERA 1-3, DPS 1): 3% per year under normal retirement age. Post-2011 (PERA 4-6): 4% per year. Post-2020 (PERA 7-9): 6% per year. Reduction is based on completed years under the applicable normal retirement age.",
    citation: "C.R.S. §24-51-602, §24-51-605",
    tier: "All Divisions (rate varies)",
    related: ["rule-of-80", "normal-retirement"],
  },
  {
    id: "benefit-formula",
    keywords: ["benefit formula", "calculation", "multiplier", "how calculated", "benefit amount", "has"],
    title: "Benefit Calculation Formula",
    provision: "The monthly retirement benefit is calculated as: 2.5% x HAS x Years of Service. The 2.5% multiplier applies to all COPERA divisions. HAS is the Highest Average Salary — the average of the highest consecutive months of pensionable compensation. HAS window: 36 months (vested before 1/1/2020) or 60 months (unvested as of 1/1/2020). Total service includes earned + purchased.",
    citation: "C.R.S. §24-51-603, §24-51-101(25.5)",
    tier: "All Divisions",
    related: ["has-window", "purchased-service-eligibility", "anti-spiking"],
  },
  {
    id: "has-window",
    keywords: ["has", "highest average salary", "highest salary", "salary window", "36 months", "60 months"],
    title: "Highest Average Salary (HAS) Window",
    provision: "HAS is the average of the member's highest consecutive months of pensionable compensation. Members vested before January 1, 2020 (HAS Tables 1-6, 10-12): highest 36 consecutive months. Members not vested as of January 1, 2020 (HAS Tables 7-9, 13): highest 60 consecutive months. Anti-spiking provisions apply to the HAS window.",
    citation: "C.R.S. §24-51-101(25.5), §24-51-603",
    tier: "All Divisions",
    related: ["anti-spiking", "benefit-formula"],
  },
  {
    id: "anti-spiking",
    keywords: ["anti-spiking", "anti spiking", "salary cap", "108%", "108 percent", "salary spike"],
    title: "Anti-Spiking Salary Cap",
    provision: "For purposes of the HAS calculation, each year's salary is capped at 108% of the prior year's salary (base year method). If a member's actual salary exceeds the 108% cap, the capped amount is used instead. This cascading cap prevents artificial benefit inflation from large salary increases near retirement. The base year is the year preceding the HAS window.",
    citation: "C.R.S. §24-51-101(25.5)",
    tier: "All Divisions",
    related: ["has-window", "benefit-formula"],
  },
  {
    id: "annual-increase",
    keywords: ["annual increase", "cola", "cost of living", "compound increase", "sb 18-200"],
    title: "Annual Increase (Post-Retirement)",
    provision: "Retirees receive a compound annual increase to their benefit, effective March 1 of the second calendar year after retirement. Pre-SB 18-200 eligible: 1.5% compound annually. Post-SB 18-200 (most current retirees): 1.0% compound annually. The increase is compounding — each year's increase is applied to the prior year's adjusted benefit amount.",
    citation: "C.R.S. §24-51-1001 through §24-51-1009",
    tier: "All Divisions",
    related: ["benefit-formula"],
  },
  {
    id: "payment-options-pera",
    keywords: ["payment option", "option 1", "option 2", "option 3", "joint and survivor", "maximum", "single life", "pera options"],
    title: "Payment Options — PERA Divisions",
    provision: "Three payment options for State, School, Local Government, and Judicial divisions: Option 1 (Maximum/Single Life) — highest monthly amount, payments cease at death. Option 2 (100% J&S) — reduced monthly, survivor receives 100% of benefit. Option 3 (50% J&S) — least reduction, survivor receives 50%. If married, spouse must provide notarized consent for options other than survivor elections.",
    citation: "C.R.S. §24-51-801 through §24-51-803",
    tier: "State, School, LocalGov, Judicial",
    related: ["payment-options-dps", "spousal-consent"],
  },
  {
    id: "payment-options-dps",
    keywords: ["dps options", "option a", "option b", "pop-up", "p2", "p3", "dps payment"],
    title: "Payment Options — DPS Division",
    provision: "Four payment options for DPS division: Option A (Maximum/Single Life) — highest monthly, payments cease at death. Option B (100% J&S) — reduced monthly, survivor receives 100%. Option P2 (75% J&S Pop-Up) — survivor receives 75%, with pop-up to full benefit if beneficiary predeceases. Option P3 (50% J&S Pop-Up) — survivor receives 50%, with pop-up feature. Pop-up returns benefit to full Option A amount if the designated beneficiary dies before the retiree.",
    citation: "C.R.S. §24-51-801 through §24-51-803",
    tier: "DPS",
    related: ["payment-options-pera"],
  },
  {
    id: "spousal-consent",
    keywords: ["spousal consent", "spouse", "married", "consent form", "notarized"],
    title: "Spousal Consent Requirement",
    provision: "If a member is married at retirement, the spouse must be designated as beneficiary for survivor options. If the member wishes to elect Maximum/Single Life (no survivor benefit), the spouse must provide notarized written consent.",
    citation: "C.R.S. §24-51-802",
    tier: "All Divisions",
    related: ["payment-options-pera", "payment-options-dps"],
  },
  {
    id: "vesting",
    keywords: ["vesting", "vested", "5 years", "refund", "non-vested"],
    title: "Vesting Requirement",
    provision: "Members vest after 5 years of earned service credit. Non-vested members who separate may request a refund of employee contributions plus accumulated interest. Vested members who separate before retirement eligibility retain a deferred benefit payable at retirement age.",
    citation: "C.R.S. §24-51-401 through §24-51-413",
    tier: "All Divisions",
    related: [],
  },
  {
    id: "contribution-rates",
    keywords: ["contribution", "employee contribution", "employer contribution", "ee rate", "er rate"],
    title: "Contribution Rates",
    provision: "State, School, Local Government, Judicial divisions: Employee (EE) 10.5%, Employer (ER) 21.4%. DPS division: Employee (EE) 12.0%, Employer (ER) 19.5%. Rates set by C.R.S. and adjusted per SB 18-200 schedule.",
    citation: "C.R.S. §24-51-401 through §24-51-413",
    tier: "All Divisions (rates vary by division)",
    related: ["vesting"],
  },
  {
    id: "application-deadline",
    keywords: ["application deadline", "filing window", "notarized", "application timing"],
    title: "Retirement Application Filing",
    provision: "The retirement application must be received by COPERA before the retirement effective date. The application must be notarized. Processing cutoff: complete retirement packages received by the 15th of the month prior to the retirement effective date ensure on-time first payment processing.",
    citation: "C.R.S. §24-51-601",
    tier: "All Divisions",
    related: [],
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
