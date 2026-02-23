/**
 * Knowledge Assistant demo — searchable DERP plan provisions with statutory citations.
 * Standalone mode (general provisions) and Connected mode (member-specific analysis).
 * Consumed by: router.tsx (/demos/knowledge-assistant route)
 * Depends on: React (useState, useEffect, useRef, useCallback)
 */
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// NoUI Knowledge Assistant Prototype
// Demonstrates: Standalone mode (browser tab, no member data)
//               Connected mode (workspace-integrated, member-specific)
// ============================================================

const C = {
  bg: "#f6f9f9",
  surface: "#ffffff",
  surfaceAlt: "#eef5f5",
  primary: "#00796b",
  primaryHover: "#00695c",
  primaryLight: "#b2dfdb",
  primarySurface: "#e0f2f1",
  accent: "#e65100",
  accentLight: "#fff3e0",
  success: "#2e7d32",
  successLight: "#e8f5e9",
  danger: "#c62828",
  dangerLight: "#ffebee",
  info: "#0369a1",
  infoLight: "#e0f2fe",
  text: "#1a2e2e",
  textSecondary: "#4a6767",
  textTertiary: "#7a9696",
  border: "#d0dede",
  borderSubtle: "#e2ecec",
  sidebar: "#00363a",
  sidebarText: "#a0c4c4",
  sidebarActive: "#4db6ac",
  tier1: "#1565c0",
  tier1Bg: "#e3f2fd",
  tier2: "#e65100",
  tier2Bg: "#fff3e0",
  tier3: "#2e7d32",
  tier3Bg: "#e8f5e9",
};

const FONT = `'Plus Jakarta Sans', 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`;

const KNOWLEDGE_BASE = [
  {
    id: "rule-75",
    keywords: ["rule of 75", "rule 75", "unreduced", "age plus service"],
    title: "Rule of 75 (Tier 1 & Tier 2)",
    provision: "Members qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 75, provided the member has attained a minimum age of 55. Only earned service credit counts toward Rule of 75 eligibility — purchased service is excluded.",
    citation: "RMC §18-403(a)",
    tier: "Tier 1 & 2",
    related: ["purchased-service-eligibility", "early-retirement"],
  },
  {
    id: "rule-85",
    keywords: ["rule of 85", "rule 85", "tier 3 unreduced"],
    title: "Rule of 85 (Tier 3)",
    provision: "Tier 3 members qualify for unreduced retirement benefits when age plus years of credited service equals or exceeds 85, provided the member has attained a minimum age of 60. Only earned service credit counts — purchased service is excluded from the Rule of 85 calculation.",
    citation: "RMC §18-403(b)",
    tier: "Tier 3",
    related: ["early-retirement-tier3"],
  },
  {
    id: "purchased-service-eligibility",
    keywords: ["purchased service", "service purchase", "buy service", "purchased service eligibility", "purchased service rule of 75", "purchased service rule of 85"],
    title: "Purchased Service — Eligibility Impact",
    provision: "Purchased service credit counts toward the benefit calculation formula (multiplier × AMS × total years of service including purchased) but is excluded from Rule of 75/85 eligibility determinations (age + earned service only). Purchased service also does not count toward the Insurance Premium Reduction (IPR) benefit calculation.",
    citation: "RMC §18-403, §18-411",
    tier: "All Tiers",
    related: ["rule-75", "rule-85", "benefit-formula"],
  },
  {
    id: "early-retirement",
    keywords: ["early retirement", "early retirement reduction", "reduced benefit", "retire early", "reduction factor"],
    title: "Early Retirement Reduction (Tier 1 & Tier 2)",
    provision: "Members age 55 or older with at least 5 years of service who do not meet Rule of 75 may elect early retirement with a permanent reduction of 3% per year for each year the member's age is below 65 at retirement. The reduction uses completed years — partial years are not prorated. The reduction is applied to the unreduced benefit amount.",
    citation: "RMC §18-404(a)",
    tier: "Tier 1 & 2",
    related: ["rule-75", "normal-retirement"],
  },
  {
    id: "early-retirement-tier3",
    keywords: ["early retirement tier 3", "tier 3 reduction", "6 percent", "6% reduction"],
    title: "Early Retirement Reduction (Tier 3)",
    provision: "Tier 3 members age 60 or older with at least 5 years of service who do not meet Rule of 85 may elect early retirement with a permanent reduction of 6% per year for each year the member's age is below 65 at retirement. The reduction uses completed years. Note the higher minimum age (60 vs. 55) and steeper reduction rate (6% vs. 3%) compared to Tier 1 and Tier 2.",
    citation: "RMC §18-404(b)",
    tier: "Tier 3",
    related: ["rule-85", "normal-retirement"],
  },
  {
    id: "benefit-formula",
    keywords: ["benefit formula", "calculation", "multiplier", "how calculated", "benefit amount", "ams"],
    title: "Benefit Calculation Formula",
    provision: "The monthly retirement benefit is calculated as: Multiplier × AMS × Years of Service. Tier 1: 2.0% multiplier, AMS = highest 36 consecutive months. Tier 2: 1.5% multiplier, AMS = highest 36 consecutive months. Tier 3: 1.5% multiplier, AMS = highest 60 consecutive months. Total years of service includes both earned and purchased service credit.",
    citation: "RMC §18-401, §18-402",
    tier: "All Tiers",
    related: ["ams-window", "purchased-service-eligibility"],
  },
  {
    id: "ams-window",
    keywords: ["ams", "average monthly salary", "highest salary", "salary window", "36 months", "60 months", "consecutive months"],
    title: "Average Monthly Salary (AMS) Window",
    provision: "AMS is the average of the member's highest consecutive months of pensionable compensation. Tier 1 and Tier 2: highest 36 consecutive months. Tier 3: highest 60 consecutive months. Leave payouts (sick/vacation cash-out) included in final month's compensation for members hired before January 1, 2010. Furlough periods within the AMS window may reduce the average; members can purchase furlough days to negate the impact.",
    citation: "RMC §18-391(3), §18-401",
    tier: "All Tiers",
    related: ["leave-payout", "benefit-formula"],
  },
  {
    id: "leave-payout",
    keywords: ["leave payout", "sick leave", "vacation", "cash out", "leave cashout", "unused leave"],
    title: "Leave Payout Impact on Pension",
    provision: "Members hired before January 1, 2010 who receive a lump-sum payout for unused sick and/or vacation leave at separation have that amount included in their final month's pensionable compensation. This can significantly increase the AMS if the final month falls within the highest-salary window. Members hired on or after January 1, 2010 do not receive this benefit. The leave payout is subject to employee pension contributions (8.45%).",
    citation: "RMC §18-391(13), §18-396",
    tier: "Tier 1 & 2 (pre-2010 hire)",
    related: ["ams-window", "benefit-formula"],
  },
  {
    id: "payment-options",
    keywords: ["payment option", "joint and survivor", "j&s", "maximum", "single life", "annuity", "payment choices"],
    title: "Payment Options at Retirement",
    provision: "Four payment options available: Maximum (Single Life) — highest monthly amount, payments cease at death. 100% Joint & Survivor — reduced monthly amount, surviving beneficiary receives 100% of the benefit. 75% J&S — slightly higher than 100% J&S, survivor receives 75%. 50% J&S — highest J&S option, survivor receives 50%. If married, spouse must be named as beneficiary for at least 50% J&S unless spouse provides notarized consent to a different election. Payment option is irrevocable after first payment.",
    citation: "RMC §18-405, §18-406",
    tier: "All Tiers",
    related: ["spousal-consent"],
  },
  {
    id: "spousal-consent",
    keywords: ["spousal consent", "spouse", "married", "consent form", "notarized"],
    title: "Spousal Consent Requirement",
    provision: "If a member is married at retirement, the spouse must be designated as beneficiary for at least a 50% Joint & Survivor option. If the member wishes to elect a different option (Maximum/Single Life or naming someone other than spouse), the spouse must provide notarized written consent. Spousal consent must be executed on the DERP-provided form and submitted with the retirement application.",
    citation: "RMC §18-406(c)",
    tier: "All Tiers",
    related: ["payment-options"],
  },
  {
    id: "dro-basics",
    keywords: ["dro", "domestic relations order", "qdro", "divorce", "marital share", "ex-spouse", "former spouse"],
    title: "Domestic Relations Orders (DRO)",
    provision: "A DRO divides a member's pension benefit with a former spouse. The division is based on the marital share: the portion of service credit earned during the marriage while employed in a DERP-covered position. The marital fraction is: months of service during marriage ÷ total months of service at retirement. The DRO can award a percentage or specific dollar amount of the marital share to the alternate payee. The alternate payee's benefit begins when the member retires.",
    citation: "RMC §18-430.1 through §18-430.7",
    tier: "All Tiers",
    related: ["payment-options"],
  },
  {
    id: "vesting",
    keywords: ["vesting", "vested", "5 years", "refund", "non-vested"],
    title: "Vesting Requirement",
    provision: "Members vest after 5 years of service credit. Non-vested members who separate from employment may request a refund of their employee contributions plus accumulated interest. A 90-day waiting period from separation is required before refund eligibility. Vested members who separate before retirement eligibility retain a deferred benefit payable at retirement age.",
    citation: "RMC §18-397, §18-398",
    tier: "All Tiers",
    related: [],
  },
  {
    id: "lump-sum-death",
    keywords: ["death benefit", "lump sum", "lump-sum death", "death", "survivor"],
    title: "Lump-Sum Death Benefit",
    provision: "At retirement, members elect a lump-sum death benefit payable as 50 or 100 monthly installments. Election is irrevocable. For normal retirement or Rule of 75/85: $5,000. For early retirement Tier 1 & 2: $5,000 minus $250 per year under age 65. For early retirement Tier 3: $5,000 minus $500 per year under age 65. The installment option determines the monthly payment amount to the beneficiary.",
    citation: "RMC §18-407",
    tier: "All Tiers",
    related: ["early-retirement", "early-retirement-tier3"],
  },
  {
    id: "application-deadline",
    keywords: ["application deadline", "30 days", "filing window", "notarized", "application timing"],
    title: "Retirement Application Filing Deadline",
    provision: "The retirement application must be received by DERP within 30 days of the member's last day worked. The application must be notarized. Processing cutoff: complete retirement packages received by the 15th of the month prior to the retirement effective date ensure on-time first payment processing.",
    citation: "RMC §18-400",
    tier: "All Tiers",
    related: [],
  },
  {
    id: "ipr",
    keywords: ["ipr", "insurance premium reduction", "health insurance", "medicare"],
    title: "Insurance Premium Reduction (IPR)",
    provision: "Retirees may receive an Insurance Premium Reduction to offset health insurance costs. Rate: $6.25 per year of earned service credit for Medicare-eligible retirees. $12.50 per year of earned service for non-Medicare-eligible retirees. Only earned service counts — purchased service and military service credit are excluded from IPR calculation.",
    citation: "RMC §18-412",
    tier: "All Tiers",
    related: ["purchased-service-eligibility"],
  },
];

const JENNIFER_KIM = {
  name: "Jennifer Kim",
  memberId: "DERP-2008-04421",
  dob: "June 22, 1970",
  age: 55,
  hireDate: "March 1, 2008",
  tier: 2,
  earnedService: { years: 18, months: 2, decimal: 18.17 },
  purchasedService: { years: 3, months: 0, decimal: 3.0 },
  totalService: { years: 21, months: 2, decimal: 21.17 },
  retirementDate: "May 1, 2026",
  ams: "$9,175.00",
  maritalStatus: "Single",
  ruleOf75: { value: 73.17, met: false, formula: "55 + 18.17 = 73.17" },
};

function searchKnowledge(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    const allText = [entry.title, ...entry.keywords, entry.provision].join(" ").toLowerCase();
    for (const term of terms) {
      if (entry.keywords.some(k => k.includes(term))) score += 10;
      if (entry.title.toLowerCase().includes(term)) score += 5;
      if (allText.includes(term)) score += 2;
    }
    if (entry.keywords.some(k => k.includes(q))) score += 20;
    return { ...entry, score };
  }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
}

function getConnectedEnhancement(entryId, member) {
  const m = member;
  const enhancements = {
    "rule-75": {
      label: "MEMBER-SPECIFIC ANALYSIS",
      content: `${m.name} — Earned service: ${m.earnedService.years}y ${m.earnedService.months}m (${m.earnedService.decimal}). Purchased service: ${m.purchasedService.years}y (excluded from Rule of 75).\n\nRule of 75 calculation: ${m.age} + ${m.earnedService.decimal} = ${m.ruleOf75.value}\nResult: NOT MET (75 required, ${m.ruleOf75.value} actual)\n\nEarly retirement reduction of 30% applies (3% × 10 years under 65).`,
      status: "not-met",
      insight: `${m.name} is ${(75 - m.ruleOf75.value).toFixed(2)} points from Rule of 75. At current accrual rate, she would meet Rule of 75 at age 56 (56 + 19.17 = 75.17). Waiting one year eliminates the 30% reduction — the scenario modeler can show the benefit impact.`,
    },
    "purchased-service-eligibility": {
      label: "MEMBER-SPECIFIC ANALYSIS",
      content: `${m.name} — Total service: ${m.totalService.decimal} years (${m.earnedService.decimal} earned + ${m.purchasedService.decimal} purchased).\n\nFor benefit calculation: 1.5% × $${m.ams.replace("$", "")} × ${m.totalService.decimal} = uses all ${m.totalService.decimal} years\nFor Rule of 75 eligibility: ${m.age} + ${m.earnedService.decimal} = ${m.ruleOf75.value} (uses only ${m.earnedService.decimal} earned years)\n\nThe ${m.purchasedService.decimal} years of purchased service add approximately $413/month to the benefit amount but do not help meet Rule of 75.`,
      status: "caution",
    },
    "early-retirement": {
      label: "MEMBER-SPECIFIC ANALYSIS",
      content: `${m.name} — Age at retirement: ${m.age}. Years under 65: 10.\nReduction: 3% × 10 = 30% permanent reduction.\n\nUnreduced benefit (estimated): $2,332.96/month\nAfter 30% reduction: $1,633.07/month\n\nDifference: $699.89/month ($8,398.68/year) for life.`,
      status: "not-met",
      insight: `The early retirement reduction is permanent and substantial. If ${m.name} can wait one year, she reaches Rule of 75 and eliminates the entire 30% reduction — increasing the monthly benefit by approximately $885 (from ~$1,633 to ~$2,518).`,
    },
    "benefit-formula": {
      label: "MEMBER-SPECIFIC CALCULATION",
      content: `${m.name} — Tier ${m.tier}\n\nFormula: 1.5% × ${m.ams} × ${m.totalService.decimal} years\n= 0.015 × ${m.ams.replace("$", "")} × ${m.totalService.decimal}\n= $2,914.70/month (unreduced)\n\nWith early retirement reduction (30%): $2,040.29/month\n\nNote: Purchased service (${m.purchasedService.decimal} years) is included in the formula. Without purchased service, the unreduced benefit would be $2,502.73.`,
      status: "info",
    },
    "ams-window": {
      label: "MEMBER-SPECIFIC DATA",
      content: `${m.name} — Tier ${m.tier}: AMS uses highest 36 consecutive months.\nCurrent AMS: ${m.ams}\n\nHired: ${m.hireDate} (after Jan 1, 2010 cutoff — NO, hired before)\nLeave payout eligibility: YES (hired before January 1, 2010)\n\nIf leave payout is received at separation, it will be included in the final month's compensation and may affect the AMS window.`,
      status: "info",
    },
    "leave-payout": {
      label: "MEMBER-SPECIFIC ANALYSIS",
      content: `${m.name} — Hired: ${m.hireDate}\nHire date is BEFORE January 1, 2010.\n\nLeave payout eligibility: YES\nAny unused sick/vacation leave cashed out at separation will be included in the final month's pensionable compensation. This could significantly boost the AMS if that month falls within the highest 36-month window.`,
      status: "met",
    },
    "application-deadline": {
      label: "MEMBER-SPECIFIC TIMELINE",
      content: `${m.name} — Planned retirement: ${m.retirementDate}\nLast day worked: April 30, 2026 (assumed)\n\nApplication deadline: 30 days from last day worked = May 30, 2026\nProcessing cutoff: April 15, 2026 (for May 1 first payment)\n\nApplication received: April 8, 2026 ✓ (within both deadlines)`,
      status: "met",
    },
    "lump-sum-death": {
      label: "MEMBER-SPECIFIC CALCULATION",
      content: `${m.name} — Early retirement, Tier ${m.tier}. Age at retirement: ${m.age}.\nYears under 65: 10\n\nLump-sum death benefit: $5,000 − ($250 × 10) = $2,500\n\nElection: 50 monthly installments = $50/month to beneficiary\n         100 monthly installments = $25/month to beneficiary`,
      status: "info",
    },
    "payment-options": {
      label: "MEMBER-SPECIFIC OPTIONS",
      content: `${m.name} — Marital status: ${m.maritalStatus}\n\nSince member is not married, no spousal consent requirement applies. All four payment options are available without restriction.\n\nReduced benefit amounts for each option would be calculated based on the $1,633.07 monthly benefit (after early retirement reduction) and actuarial factors for the member's age and any named beneficiary's age.`,
      status: "info",
    },
  };
  return enhancements[entryId] || null;
}

function SearchInput({ value, onChange, onClear, placeholder, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: C.textTertiary, fontSize: 18, pointerEvents: "none",
      }}>&#x2315;</div>
      <input ref={ref} type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "14px 40px 14px 42px", fontSize: 15, fontFamily: FONT,
          border: `2px solid ${C.border}`, borderRadius: 12, background: C.surface,
          color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primarySurface}`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
      />
      {value && (
        <button onClick={onClear} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: C.surfaceAlt, border: "none", borderRadius: 6, width: 24, height: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: C.textSecondary, fontSize: 12, fontFamily: FONT,
        }}>&#x2715;</button>
      )}
    </div>
  );
}

function CitationBadge({ citation }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: C.primarySurface, color: C.primary, fontSize: 11, fontWeight: 700,
      fontFamily: MONO, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.3,
      border: `1px solid ${C.primaryLight}`,
    }}>
      &sect; {citation}
    </span>
  );
}

function TierBadge({ tier }) {
  const colors = {
    "Tier 1": { bg: C.tier1Bg, color: C.tier1, border: "#90caf9" },
    "Tier 2": { bg: C.tier2Bg, color: C.tier2, border: "#ffcc80" },
    "Tier 3": { bg: C.tier3Bg, color: C.tier3, border: "#a5d6a7" },
    "Tier 1 & 2": { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
    "Tier 1 & 2 (pre-2010 hire)": { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
    "All Tiers": { bg: C.surfaceAlt, color: C.textSecondary, border: C.border },
  };
  const c = colors[tier] || colors["All Tiers"];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>{tier}</span>
  );
}

function StatusIndicator({ status }) {
  const config = {
    met: { icon: "\u2713", label: "Met", bg: C.successLight, color: C.success, border: "#a5d6a7" },
    "not-met": { icon: "\u2717", label: "Not Met", bg: C.dangerLight, color: C.danger, border: "#ef9a9a" },
    caution: { icon: "\u26A0", label: "Caution", bg: C.accentLight, color: C.accent, border: "#ffcc80" },
    info: { icon: "\u2139", label: "Info", bg: C.infoLight, color: C.info, border: "#90caf9" },
  };
  const c = config[status] || config.info;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function ResultCard({ entry, isConnected, member, isExpanded, onToggle, animDelay }) {
  const enhancement = isConnected && member ? getConnectedEnhancement(entry.id, member) : null;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay || 0);
    return () => clearTimeout(t);
  }, [animDelay]);

  return (
    <div onClick={onToggle} style={{
      background: C.surface, border: `1px solid ${isExpanded ? C.primary : C.border}`,
      borderRadius: 10, overflow: "hidden", cursor: "pointer",
      transition: "all 0.3s ease, opacity 0.4s ease, transform 0.4s ease",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
      boxShadow: isExpanded ? `0 2px 12px rgba(0,121,107,0.1)` : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "14px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONT }}>{entry.title}</span>
            <TierBadge tier={entry.tier} />
            {enhancement && <StatusIndicator status={enhancement.status} />}
          </div>
          <CitationBadge citation={entry.citation} />
        </div>
        <div style={{
          fontSize: 12, color: C.textTertiary, transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s", flexShrink: 0, marginTop: 4,
        }}>{"\u25BC"}</div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              PLAN PROVISION
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: C.text, margin: 0, fontFamily: FONT }}>
              {entry.provision}
            </p>
          </div>

          {enhancement && (
            <div style={{
              margin: "0 12px 12px", padding: "14px 16px", borderRadius: 8,
              background: `linear-gradient(135deg, ${C.primarySurface} 0%, #f0faf9 100%)`,
              border: `1px solid ${C.primaryLight}`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: C.primary, letterSpacing: 1.2,
                marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.primary,
                  display: "inline-block", animation: "pulse 2s infinite",
                }} />
                {enhancement.label}
              </div>
              <pre style={{
                fontSize: 13, lineHeight: 1.6, color: C.text, margin: 0,
                fontFamily: MONO, whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {enhancement.content}
              </pre>
              {enhancement.insight && (
                <div style={{
                  marginTop: 12, padding: "10px 12px", borderRadius: 6,
                  background: "rgba(255,255,255,0.7)", border: `1px solid ${C.primaryLight}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 0.8, marginBottom: 4 }}>
                    THRESHOLD PROXIMITY INSIGHT
                  </div>
                  <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.55, fontFamily: FONT }}>
                    {enhancement.insight}
                  </p>
                </div>
              )}
            </div>
          )}

          {entry.related.length > 0 && (
            <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${C.borderSubtle}` }}>
              <span style={{ fontSize: 11, color: C.textTertiary, marginRight: 8 }}>Related:</span>
              {entry.related.map(id => {
                const rel = KNOWLEDGE_BASE.find(e => e.id === id);
                return rel ? (
                  <span key={id} style={{
                    fontSize: 11, color: C.primary, background: C.primarySurface,
                    padding: "2px 8px", borderRadius: 4, marginRight: 6, cursor: "pointer",
                    display: "inline-block", marginBottom: 2,
                  }}>{rel.title}</span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberBanner({ member }) {
  const tierColors = { 1: C.tier1, 2: C.tier2, 3: C.tier3 };
  const tierBgs = { 1: C.tier1Bg, 2: C.tier2Bg, 3: C.tier3Bg };
  return (
    <div style={{
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
      padding: "12px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          background: tierBgs[member.tier], color: tierColors[member.tier], fontWeight: 800, fontSize: 14,
          border: `2px solid ${tierColors[member.tier]}`,
        }}>T{member.tier}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{member.name}</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>{member.memberId} &middot; Age {member.age} &middot; Retiring {member.retirementDate}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Earned", value: `${member.earnedService.years}y ${member.earnedService.months}m` },
          { label: "Purchased", value: `${member.purchasedService.years}y` },
          { label: "AMS", value: member.ams },
          { label: "Rule of 75", value: member.ruleOf75.met ? "MET" : "NOT MET", status: member.ruleOf75.met },
        ].map(f => (
          <div key={f.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textTertiary, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{f.label}</div>
            <div style={{
              fontSize: 13, fontWeight: 700, fontFamily: MONO,
              color: f.status !== undefined ? (f.status ? C.success : C.danger) : C.text,
            }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ isConnected }) {
  const suggestions = [
    "purchased service Rule of 75",
    "early retirement reduction",
    "leave payout",
    "payment options",
    "DRO marital share",
    "application deadline",
  ];
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>&#x1F4D6;</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
        Search DERP Plan Provisions
      </div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
        Type a question or topic to find the authoritative provision with statutory citation.
        {isConnected && " Results will include member-specific analysis."}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {suggestions.map(s => (
          <span key={s} style={{
            fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
            background: C.surfaceAlt, color: C.textSecondary, border: `1px solid ${C.borderSubtle}`,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.target.style.background = C.primarySurface; e.target.style.color = C.primary; e.target.style.borderColor = C.primaryLight; }}
            onMouseLeave={e => { e.target.style.background = C.surfaceAlt; e.target.style.color = C.textSecondary; e.target.style.borderColor = C.borderSubtle; }}
          >{s}</span>
        ))}
      </div>
    </div>
  );
}

export function KnowledgeAssistant() {
  const [mode, setMode] = useState("standalone");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchCount, setSearchCount] = useState(0);

  const isConnected = mode === "connected";

  const handleSearch = useCallback((q) => {
    setQuery(q);
    setExpandedId(null);
    if (q.trim().length > 1) {
      const r = searchKnowledge(q);
      setResults(r);
      if (r.length > 0) setSearchCount(c => c + 1);
    } else {
      setResults([]);
    }
  }, []);

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Top bar */}
      <div style={{
        background: C.sidebar, padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>NoUI</span>
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Knowledge Assistant</span>
          {isConnected && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: "rgba(77,182,172,0.15)", color: C.sidebarActive,
              border: `1px solid rgba(77,182,172,0.3)`, letterSpacing: 0.5,
            }}>CONNECTED</span>
          )}
          {!isConnected && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: "rgba(160,196,196,0.1)", color: C.sidebarText,
              border: `1px solid rgba(160,196,196,0.2)`, letterSpacing: 0.5,
            }}>STANDALONE</span>
          )}
        </div>
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        }}>
          {[
            { id: "standalone", label: "Standalone", desc: "Plan provisions only" },
            { id: "connected", label: "Connected", desc: "Member-specific" },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setExpandedId(null); }}
              title={m.desc}
              style={{
                padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 12,
                fontWeight: mode === m.id ? 700 : 500, fontFamily: FONT, letterSpacing: 0.2,
                background: mode === m.id ? "rgba(77,182,172,0.2)" : "transparent",
                color: mode === m.id ? C.sidebarActive : C.sidebarText,
                transition: "all 0.2s",
              }}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        {isConnected && <MemberBanner member={JENNIFER_KIM} />}

        <SearchInput
          value={query}
          onChange={handleSearch}
          onClear={() => handleSearch("")}
          placeholder={isConnected
            ? `Search provisions for ${JENNIFER_KIM.name}...`
            : "Search DERP plan provisions..."}
          autoFocus
        />

        <div style={{
          display: "flex", alignItems: "center", gap: 8, margin: "12px 0 16px",
          padding: "8px 12px", borderRadius: 8,
          background: isConnected ? C.primarySurface : C.surfaceAlt,
          border: `1px solid ${isConnected ? C.primaryLight : C.borderSubtle}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isConnected ? C.primary : C.textTertiary,
            boxShadow: isConnected ? `0 0 6px ${C.primary}` : "none",
          }} />
          <span style={{ fontSize: 12, color: isConnected ? C.primary : C.textSecondary, fontWeight: 600 }}>
            {isConnected
              ? `Connected to member record — results include analysis for ${JENNIFER_KIM.name}`
              : "Standalone mode — general plan provisions with statutory citations"}
          </span>
        </div>

        {results.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: C.textTertiary, fontWeight: 600 }}>
              {results.length} provision{results.length !== 1 ? "s" : ""} found
            </div>
            {results.map((entry, i) => (
              <ResultCard
                key={`${entry.id}-${searchCount}`}
                entry={entry}
                isConnected={isConnected}
                member={JENNIFER_KIM}
                isExpanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                animDelay={i * 80}
              />
            ))}
          </div>
        ) : query.length > 1 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: C.textSecondary }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>&#x1F50D;</div>
            <div style={{ fontSize: 14 }}>No provisions found for &ldquo;{query}&rdquo;</div>
            <div style={{ fontSize: 12, marginTop: 4, color: C.textTertiary }}>Try different terms or check spelling</div>
          </div>
        ) : (
          <EmptyState isConnected={isConnected} />
        )}
      </div>
    </div>
  );
}
