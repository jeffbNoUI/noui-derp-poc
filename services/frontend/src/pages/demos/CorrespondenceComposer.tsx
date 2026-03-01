/**
 * Correspondence Composer demo — context-aware letter assembly from structured content blocks.
 * Shows provenance tracking, conditional block inclusion, and four demo cases.
 * Consumed by: router.tsx (/demos/correspondence route)
 * Depends on: React (useState, useEffect, useMemo, useCallback)
 */
// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
// Shared templates available in @/lib/correspondence-templates — this standalone demo
// uses its own inline block-generation engine but the mini-panel imports from there.

// ============================================================
// NoUI Correspondence Composer Prototype
// Demonstrates: Context-aware letter assembly from structured
//               content blocks, full provenance tracking,
//               conditional block inclusion based on rules,
//               four demo cases showing different compositions
// ============================================================

const C = {
  bg: "#f6f9f9", surface: "#ffffff", surfaceAlt: "#eef5f5",
  primary: "#00796b", primaryHover: "#00695c", primaryLight: "#b2dfdb", primarySurface: "#e0f2f1",
  accent: "#e65100", accentLight: "#fff3e0",
  success: "#2e7d32", successLight: "#e8f5e9",
  danger: "#c62828", dangerLight: "#ffebee",
  info: "#0369a1", infoLight: "#e0f2fe",
  text: "#1a2e2e", textSecondary: "#4a6767", textTertiary: "#7a9696",
  border: "#d0dede", borderSubtle: "#e2ecec",
  sidebar: "#00363a", sidebarText: "#a0c4c4", sidebarActive: "#4db6ac",
  tier1: "#1565c0", tier1Bg: "#e3f2fd",
  tier2: "#e65100", tier2Bg: "#fff3e0",
  tier3: "#2e7d32", tier3Bg: "#e8f5e9",
  blockData: "#e8eaf6", blockDataBorder: "#9fa8da",
  blockRule: "#fce4ec", blockRuleBorder: "#f48fb1",
  blockKB: "#e0f2f1", blockKBBorder: "#80cbc4",
  blockProcess: "#fff8e1", blockProcessBorder: "#ffd54f",
};
const FONT = `'Plus Jakarta Sans', 'Source Sans 3', -apple-system, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', monospace`;

// ============================================================
// Demo Cases
// ============================================================
const CASES = {
  case1: {
    id: "case1", label: "Case 1", member: "Robert Martinez", tier: 1,
    summary: "Tier 1, Rule of 75, Leave Payout, 75% J&S",
    retirementType: "Rule of 75", retirementDate: "April 1, 2026",
    lastDayWorked: "March 31, 2026",
    age: 63, earnedService: "28 years, 9 months",
    ruleResult: "91.75 ≥ 75 — MET", reduction: null,
    ams: "$11,218.33", amsWindow: "36 months (Tier 1)",
    leavePayout: "$52,000",
    benefitMaximum: "$6,438.06",
    paymentOption: "75% Joint & Survivor",
    benefitElected: "$5,857.89",
    spouse: { name: "Elena Martinez", age: 59 },
    survivorBenefit: "$4,393.42",
    deathBenefit: "$5,000", deathInstallments: 100, deathMonthly: "$50.00",
    dro: null,
    applicationReceived: "March 10, 2026",
    processingCutoff: "March 15, 2026",
  },
  case2: {
    id: "case2", label: "Case 2", member: "Jennifer Kim", tier: 2,
    summary: "Tier 2, Early Retirement, Purchased Service",
    retirementType: "Early Retirement", retirementDate: "May 1, 2026",
    lastDayWorked: "April 30, 2026",
    age: 55, earnedService: "18 years, 2 months",
    purchasedService: "3 years",
    ruleResult: "73.17 < 75 — NOT MET", reduction: "30% (3% × 10 years under 65)",
    ams: "$9,175.00", amsWindow: "36 months (Tier 2)",
    leavePayout: null,
    benefitMaximum: "$2,332.96",
    benefitReduced: "$1,633.07",
    paymentOption: "Maximum (Single Life)",
    benefitElected: "$1,633.07",
    spouse: null,
    deathBenefit: "$2,500", deathInstallments: 50, deathMonthly: "$50.00",
    deathCalc: "$5,000 − ($250 × 10 years) = $2,500",
    dro: null,
    applicationReceived: "April 8, 2026",
    processingCutoff: "April 15, 2026",
  },
  case3: {
    id: "case3", label: "Case 3", member: "David Washington", tier: 3,
    summary: "Tier 3, Early Retirement, 60-month AMS",
    retirementType: "Early Retirement", retirementDate: "April 1, 2026",
    lastDayWorked: "March 31, 2026",
    age: 63, earnedService: "13 years, 7 months",
    ruleResult: "76.58 < 85 — NOT MET (Rule of 85)", reduction: "12% (6% × 2 years under 65)",
    ams: "$8,750.00", amsWindow: "60 months (Tier 3)",
    leavePayout: null,
    benefitMaximum: "$1,784.06",
    benefitReduced: "$1,569.97",
    paymentOption: "50% Joint & Survivor",
    benefitElected: "$1,491.47",
    spouse: { name: "Maria Washington", age: 61 },
    survivorBenefit: "$745.74",
    deathBenefit: "$4,000", deathInstallments: 100, deathMonthly: "$40.00",
    deathCalc: "$5,000 − ($500 × 2 years) = $4,000",
    dro: null,
    applicationReceived: "March 12, 2026",
    processingCutoff: "March 15, 2026",
  },
  case4: {
    id: "case4", label: "Case 4", member: "Robert Martinez (DRO)", tier: 1,
    summary: "Tier 1, Rule of 75, DRO with Former Spouse",
    retirementType: "Rule of 75", retirementDate: "April 1, 2026",
    lastDayWorked: "March 31, 2026",
    age: 63, earnedService: "28 years, 9 months",
    ruleResult: "91.75 ≥ 75 — MET", reduction: null,
    ams: "$11,218.33", amsWindow: "36 months (Tier 1)",
    leavePayout: "$52,000",
    benefitMaximum: "$6,438.06",
    paymentOption: "75% Joint & Survivor",
    benefitElected: "$5,857.89",
    spouse: { name: "Elena Martinez", age: 59 },
    survivorBenefit: "$4,393.42",
    deathBenefit: "$5,000", deathInstallments: 100, deathMonthly: "$50.00",
    dro: {
      alternatePayer: "Patricia Martinez",
      marriageDate: "August 15, 1999",
      divorceDate: "November 3, 2017",
      maritalMonths: "219 months (18 years, 3 months)",
      totalMonths: "345 months (28 years, 9 months)",
      maritalFraction: "63.48%",
      awardPercentage: "40%",
      alternateBenefit: "$1,487.27",
      memberNetBenefit: "$4,370.62",
    },
    applicationReceived: "March 10, 2026",
    processingCutoff: "March 15, 2026",
  },
};

// ============================================================
// Content Block Engine
// Each block has: id, title, layer source, condition, content generator
// ============================================================
function generateBlocks(caseData) {
  const blocks = [];
  const c = caseData;

  // BLOCK 1: Salutation (Layer 1 — member data)
  blocks.push({
    id: "salutation", title: "Salutation", layer: 1, tier: 1,
    source: "Layer 1: Member Record",
    condition: "Always included",
    content: `Dear ${c.member.split(" (")[0]},`,
  });

  // BLOCK 2: Approval statement (Layer 2 — Process Orchestrator)
  blocks.push({
    id: "approval", title: "Retirement Approval", layer: 2, tier: 1,
    source: "Layer 2: Process Orchestrator",
    condition: "Case stage = Approved",
    content: `We are pleased to confirm that your application for ${c.retirementType} retirement from the Colorado Public Employees' Retirement Association has been approved, effective ${c.retirementDate}. Your last day of active employment is recorded as ${c.lastDayWorked}.`,
  });

  // BLOCK 3: Tier and eligibility (Layer 2 — Rules Engine)
  const eligContent = c.retirementType.includes("Rule of")
    ? `As a Tier ${c.tier} member with ${c.earnedService} of credited service, you qualify for ${c.retirementType} retirement. Your eligibility calculation: age ${c.age} + ${c.earnedService} of earned service = ${c.ruleResult.split(" —")[0]}. No early retirement reduction applies to your benefit.`
    : `As a Tier ${c.tier} member with ${c.earnedService} of credited service, you are eligible for Early Retirement. Eligibility: ${c.ruleResult}. An early retirement reduction of ${c.reduction} has been applied to your benefit as a permanent adjustment.`;
  blocks.push({
    id: "eligibility", title: "Eligibility Determination", layer: 2, tier: 1,
    source: "Layer 2: Rules Engine",
    condition: "Always included",
    citation: c.retirementType.includes("Rule of") ? "C.R.S. §24-51-601" : "C.R.S. §24-51-602",
    content: eligContent,
  });

  // BLOCK 4: Purchased service note (conditional — Layer 2 Rules + Layer 3 Relevance)
  if (c.purchasedService) {
    blocks.push({
      id: "purchased-service", title: "Purchased Service Note", layer: 3, tier: 2,
      source: "Layer 3: Relevance Engine (conditional)",
      condition: "Member has purchased service credit",
      citation: "C.R.S. §24-51-601, §24-51-611",
      content: `Your ${c.purchasedService} of purchased service credit is included in your benefit calculation but was excluded from the Rule of 75 eligibility determination, as required by statute. Your total service for benefit calculation purposes is ${c.earnedService} earned + ${c.purchasedService} purchased.`,
    });
  }

  // BLOCK 5: Leave payout impact (conditional — Layer 1 data + Layer 2 rules)
  if (c.leavePayout) {
    blocks.push({
      id: "leave-payout", title: "Leave Payout Impact", layer: 3, tier: 2,
      source: "Layer 3: Relevance Engine (conditional)",
      condition: "Member hired before Jan 1, 2010 AND leave payout exists",
      citation: "C.R.S. §24-51-101(42), §24-51-606",
      content: `Your leave payout of ${c.leavePayout} for unused sick and vacation leave has been included in your final month's pensionable compensation. This amount is reflected in the Average Monthly Salary (AMS) calculation shown below, as you were hired before January 1, 2010 and qualify for this provision.`,
    });
  }

  // BLOCK 6: Benefit calculation (Layer 1 data + Layer 2 rules)
  let calcContent = `Your monthly retirement benefit has been calculated as follows:\n\n`;
  calcContent += `  Average Monthly Salary (AMS):  ${c.ams}\n`;
  calcContent += `  AMS Calculation Window:        ${c.amsWindow}\n`;
  calcContent += `  Benefit Multiplier:            ${c.tier === 1 ? "2.0%" : "1.5%"} (Tier ${c.tier})\n`;
  calcContent += `  Years of Service:              ${c.earnedService}${c.purchasedService ? " + " + c.purchasedService + " purchased" : ""}\n`;
  calcContent += `  Unreduced Benefit:             ${c.benefitMaximum}/month\n`;
  if (c.benefitReduced) {
    calcContent += `  Early Retirement Reduction:    ${c.reduction}\n`;
    calcContent += `  Reduced Benefit:               ${c.benefitReduced}/month\n`;
  }
  blocks.push({
    id: "calculation", title: "Benefit Calculation", layer: 1, tier: 1,
    source: "Layer 1: Calculation Engine + Layer 2: Rules",
    condition: "Always included",
    citation: "C.R.S. §24-51-601, §24-51-602",
    content: calcContent,
    isMonospace: true,
  });

  // BLOCK 7: Payment option election (Layer 1 + Layer 2)
  let payContent = `You have elected the ${c.paymentOption} payment option:\n\n`;
  payContent += `  Monthly Benefit:  ${c.benefitElected}\n`;
  if (c.survivorBenefit) {
    payContent += `  Survivor Benefit: ${c.survivorBenefit}/month to ${c.spouse.name} (age ${c.spouse.age})\n`;
  }
  payContent += `\nThis election is irrevocable after your first benefit payment is processed.`;
  blocks.push({
    id: "payment-option", title: "Payment Option Election", layer: 2, tier: 1,
    source: "Layer 2: Rules Engine + Layer 1: Member Election",
    condition: "Always included",
    citation: "C.R.S. §24-51-604, §24-51-605",
    content: payContent,
    isMonospace: true,
  });

  // BLOCK 8: Spousal consent (conditional — Layer 3 relevance)
  if (c.spouse && c.paymentOption !== "Maximum (Single Life)") {
    blocks.push({
      id: "spousal-consent", title: "Spousal Consent Confirmation", layer: 3, tier: 2,
      source: "Layer 3: Relevance Engine (conditional)",
      condition: "Member is married AND elected J&S option",
      citation: "C.R.S. §24-51-605",
      content: `As you are married, your spouse ${c.spouse.name} has been designated as your Joint & Survivor beneficiary. We have received the required spousal consent documentation. If your spouse wishes to review this election, please contact our office before your first benefit payment is processed.`,
    });
  }

  // BLOCK 9: DRO block (conditional — only Case 4)
  if (c.dro) {
    blocks.push({
      id: "dro-notice", title: "Domestic Relations Order", layer: 3, tier: 2,
      source: "Layer 3: Relevance Engine (conditional)",
      condition: "Active DRO on file",
      citation: "C.R.S. §24-51-801 through §24-51-807",
      content: `A Domestic Relations Order (DRO) is on file for your retirement account. The following division has been applied per the court order:\n\n` +
        `  Alternate Payee:     ${c.dro.alternatePayer}\n` +
        `  Marriage Period:     ${c.dro.marriageDate} to ${c.dro.divorceDate}\n` +
        `  Marital Service:    ${c.dro.maritalMonths}\n` +
        `  Total Service:      ${c.dro.totalMonths}\n` +
        `  Marital Fraction:   ${c.dro.maritalFraction}\n` +
        `  DRO Award:          ${c.dro.awardPercentage} of marital share\n\n` +
        `  Alternate Payee Benefit: ${c.dro.alternateBenefit}/month\n` +
        `  Your Net Benefit:        ${c.dro.memberNetBenefit}/month\n\n` +
        `The alternate payee will receive separate correspondence regarding their benefit and payment options.`,
      isMonospace: true,
    });
  }

  // BLOCK 10: Death benefit (Layer 2 rules)
  let deathContent = `You have elected to receive a lump-sum death benefit of ${c.deathBenefit}`;
  if (c.deathCalc) deathContent += ` (calculated as ${c.deathCalc})`;
  deathContent += `, payable as ${c.deathInstallments} monthly installments of ${c.deathMonthly} to your designated beneficiary. This election is irrevocable.`;
  blocks.push({
    id: "death-benefit", title: "Lump-Sum Death Benefit", layer: 2, tier: 1,
    source: "Layer 2: Rules Engine",
    condition: "Always included",
    citation: "C.R.S. §24-51-607",
    content: deathContent,
  });

  // BLOCK 11: Early retirement note (conditional)
  if (c.reduction) {
    blocks.push({
      id: "early-reduction-note", title: "Early Retirement Reduction Notice", layer: 3, tier: 2,
      source: "Layer 3: Relevance Engine (conditional)",
      condition: "Retirement type = Early",
      citation: "C.R.S. §24-51-602",
      content: `Please note that the early retirement reduction of ${c.reduction} is a permanent adjustment to your benefit amount. This reduction remains in effect for the duration of your retirement and will also apply to any cost-of-living adjustments that may be approved by the Board in future years.`,
    });
  }

  // BLOCK 12: Closing (Layer 2 — Process Orchestrator)
  blocks.push({
    id: "closing", title: "Closing", layer: 2, tier: 1,
    source: "Layer 2: Process Orchestrator",
    condition: "Always included",
    content: `Your first retirement benefit payment will be processed on ${c.retirementDate}, contingent upon receipt of all required documentation. If you have questions about this determination, please contact the COPERA office at (303) 839-5419.\n\nSincerely,\n\nColorado Public Employees' Retirement Association\nBenefits Administration`,
  });

  return blocks;
}

// ============================================================
// Components
// ============================================================

const LAYER_COLORS = {
  1: { bg: C.blockData, border: C.blockDataBorder, label: "Layer 1 · Data", icon: "📊" },
  2: { bg: C.blockKB, border: C.blockKBBorder, label: "Layer 2 · Rules", icon: "📖" },
  3: { bg: C.blockRule, border: C.blockRuleBorder, label: "Layer 3 · Relevance", icon: "🎯" },
  4: { bg: C.blockProcess, border: C.blockProcessBorder, label: "Layer 4 · Workspace", icon: "🖥️" },
};

function BlockProvenance({ block, show }) {
  const lc = LAYER_COLORS[block.layer];
  if (!show) return null;
  return (
    <div style={{
      display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6,
      padding: "6px 10px", borderRadius: 6,
      background: lc.bg, border: `1px solid ${lc.border}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: C.text, letterSpacing: 0.5 }}>
        {lc.icon} {lc.label}
      </span>
      <span style={{ fontSize: 10, color: C.textSecondary }}>·</span>
      <span style={{ fontSize: 10, color: C.textSecondary }}>{block.source}</span>
      {block.citation && (
        <>
          <span style={{ fontSize: 10, color: C.textSecondary }}>·</span>
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: MONO, padding: "0 5px", borderRadius: 3,
            background: "rgba(255,255,255,0.6)", color: C.primary,
          }}>§ {block.citation}</span>
        </>
      )}
      <span style={{ fontSize: 10, color: C.textSecondary }}>·</span>
      <span style={{ fontSize: 10, color: C.textTertiary, fontStyle: "italic" }}>
        Tier {block.tier} composition · {block.condition}
      </span>
    </div>
  );
}

function LetterBlock({ block, showProvenance, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 40); return () => clearTimeout(t); }, [index]);

  const isHeader = block.id === "salutation" || block.id === "closing";
  return (
    <div style={{
      marginBottom: 4,
      borderLeft: showProvenance ? `3px solid ${LAYER_COLORS[block.layer].border}` : "3px solid transparent",
      paddingLeft: showProvenance ? 12 : 0,
      transition: "all 0.3s ease",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(4px)",
    }}>
      <BlockProvenance block={block} show={showProvenance} />
      {block.isMonospace ? (
        <pre style={{
          fontSize: 13, lineHeight: 1.6, color: C.text, margin: "0 0 12px",
          fontFamily: MONO, whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>{block.content}</pre>
      ) : (
        <p style={{
          fontSize: 14, lineHeight: 1.7, color: C.text, margin: "0 0 12px",
          fontFamily: FONT, fontWeight: isHeader ? 400 : 400,
        }}>{block.content}</p>
      )}
    </div>
  );
}

function BlockInventory({ blocks }) {
  const byLayer = { 1: [], 2: [], 3: [] };
  blocks.forEach(b => { if (byLayer[b.layer]) byLayer[b.layer].push(b); });

  return (
    <div style={{
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
      padding: 16, marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12, letterSpacing: -0.3 }}>
        Content Block Inventory
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(byLayer).map(([layer, items]) => {
          if (items.length === 0) return null;
          const lc = LAYER_COLORS[layer];
          return (
            <div key={layer}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: 0.5,
                textTransform: "uppercase", marginBottom: 4,
              }}>{lc.icon} {lc.label} — {items.length} block{items.length > 1 ? "s" : ""}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {items.map(b => (
                  <span key={b.id} style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 4,
                    background: lc.bg, border: `1px solid ${lc.border}`,
                    color: C.text, fontWeight: 500,
                  }}>{b.title}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, padding: "8px 10px", borderRadius: 6,
        background: C.surfaceAlt, fontSize: 11, color: C.textSecondary,
        display: "flex", gap: 12, flexWrap: "wrap",
      }}>
        <span><strong>{blocks.filter(b => b.tier === 1).length}</strong> Tier 1 blocks (deterministic)</span>
        <span><strong>{blocks.filter(b => b.tier === 2).length}</strong> Tier 2 blocks (rule-based, conditional)</span>
        <span><strong>0</strong> Tier 3 blocks (AI — not needed)</span>
      </div>
    </div>
  );
}

function CaseSelector({ selected, onChange }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20,
    }}>
      {Object.values(CASES).map(c => {
        const active = selected === c.id;
        const tierC = { 1: C.tier1, 2: C.tier2, 3: C.tier3 };
        const tierBg = { 1: C.tier1Bg, 2: C.tier2Bg, 3: C.tier3Bg };
        return (
          <button key={c.id} onClick={() => onChange(c.id)}
            style={{
              padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: active ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: active ? C.primarySurface : C.surface,
              transition: "all 0.2s", fontFamily: FONT,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                background: tierBg[c.tier], color: tierC[c.tier],
              }}>T{c.tier}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.3 }}>{c.member.split(" (")[0]}</div>
            <div style={{ fontSize: 10, color: C.textTertiary, marginTop: 2 }}>{c.summary}</div>
          </button>
        );
      })}
    </div>
  );
}

function ComparisonHighlight({ case1Blocks, case4Blocks }) {
  const case1Ids = new Set(case1Blocks.map(b => b.id));
  const case4Ids = new Set(case4Blocks.map(b => b.id));
  const shared = [...case1Ids].filter(id => case4Ids.has(id));
  const added = [...case4Ids].filter(id => !case1Ids.has(id));
  const removed = [...case1Ids].filter(id => !case4Ids.has(id));

  if (added.length === 0 && removed.length === 0) return null;

  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${C.primaryLight}`,
      padding: 14, marginBottom: 16,
      background: `linear-gradient(135deg, ${C.primarySurface} 0%, #f0faf9 100%)`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.primary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, animation: "pulse 2s infinite" }} />
        DRO IMPACT — Automatic Content Adaptation
      </div>
      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
        When this case includes a DRO, the Correspondence Composer automatically adds {added.length} content block{added.length > 1 ? "s" : ""} without any manual intervention. The system detected the active DRO in the member record and included the required disclosures.
      </div>
      {added.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.success }}>+ Added:</span>
          {added.map(id => {
            const block = case4Blocks.find(b => b.id === id);
            return block ? (
              <span key={id} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 4,
                background: C.successLight, color: C.success, border: `1px solid #a5d6a7`,
              }}>{block.title}</span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Application
// ============================================================
export function CorrespondenceComposer() {
  const [selectedCase, setSelectedCase] = useState("case1");
  const [showProvenance, setShowProvenance] = useState(true);
  const [showInventory, setShowInventory] = useState(true);
  const [letterKey, setLetterKey] = useState(0);

  const caseData = CASES[selectedCase];
  const blocks = useMemo(() => generateBlocks(caseData), [selectedCase]);
  const case1Blocks = useMemo(() => generateBlocks(CASES.case1), []);
  const case4Blocks = useMemo(() => generateBlocks(CASES.case4), []);

  const handleCaseChange = useCallback((id) => {
    setSelectedCase(id);
    setLetterKey(k => k + 1);
  }, []);

  const conditionalCount = blocks.filter(b => b.tier === 2).length;
  const tierColors = { 1: C.tier1, 2: C.tier2, 3: C.tier3 };

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
        borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>NoUI</span>
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Correspondence Composer</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(77,182,172,0.15)", color: C.sidebarActive, border: "1px solid rgba(77,182,172,0.3)", letterSpacing: 0.5 }}>PREMIUM</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowInventory(!showInventory)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)",
              background: showInventory ? "rgba(77,182,172,0.2)" : "rgba(255,255,255,0.06)",
              color: showInventory ? C.sidebarActive : C.sidebarText,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
            }}>Block Inventory</button>
          <button onClick={() => setShowProvenance(!showProvenance)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)",
              background: showProvenance ? "rgba(77,182,172,0.2)" : "rgba(255,255,255,0.06)",
              color: showProvenance ? C.sidebarActive : C.sidebarText,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
            }}>Show Provenance</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>
        {/* Case selector */}
        <CaseSelector selected={selectedCase} onChange={handleCaseChange} />

        {/* Case 4 comparison highlight */}
        {selectedCase === "case4" && (
          <ComparisonHighlight case1Blocks={case1Blocks} case4Blocks={case4Blocks} />
        )}

        {/* Block inventory */}
        {showInventory && <BlockInventory blocks={blocks} />}

        {/* The Letter */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: "32px 36px", marginBottom: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          {/* Letter header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 24, paddingBottom: 20, borderBottom: `2px solid ${C.primary}`,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: -0.3 }}>
                COLORADO PUBLIC EMPLOYEES' RETIREMENT ASSOCIATION
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                777 Pearl Street · Denver, CO 80203 · (303) 839-5419
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                {caseData.retirementDate.replace(/(\w+) (\d+), (\d+)/, (_, m, d, y) => `${m} ${parseInt(d) - 5}, ${y}`)}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, marginTop: 4,
                background: tierColors[caseData.tier] === C.tier1 ? C.tier1Bg : caseData.tier === 2 ? C.tier2Bg : C.tier3Bg,
                color: tierColors[caseData.tier], display: "inline-block",
              }}>RETIREMENT APPROVAL — TIER {caseData.tier}</div>
            </div>
          </div>

          {/* Letter content — composed from blocks */}
          <div key={letterKey}>
            {blocks.map((block, i) => (
              <LetterBlock key={block.id} block={block} showProvenance={showProvenance} index={i} />
            ))}
          </div>
        </div>

        {/* Composition summary */}
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: C.primarySurface, border: `1px solid ${C.primaryLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, flexShrink: 0, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>
              {blocks.length} content blocks assembled · {conditionalCount} conditional (Tier 2) · 0 AI-generated (Tier 3) · All deterministic
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              padding: "6px 16px", borderRadius: 6, border: `1px solid ${C.primary}`,
              background: C.primary, color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT,
            }}>Approve & Generate PDF</button>
            <button style={{
              padding: "6px 16px", borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.surface, color: C.textSecondary, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT,
            }}>Return for Edits</button>
          </div>
        </div>
      </div>
    </div>
  );
}
