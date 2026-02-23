/**
 * Data Entry Validator demo — real-time field validation against business rules.
 * Shows inline guidance with citations, corrections, and member-specific context.
 * Consumed by: router.tsx (/demos/data-validator route)
 * Depends on: React (useState, useEffect, useRef, useCallback)
 */
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// NoUI Contextual Data Entry Validator Prototype
// Demonstrates: Real-time validation against business rules,
//               member history, and governing documents.
//               Three severity levels: Error, Warning, Info
//               Inline guidance with citations and corrections
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
};
const FONT = `'Plus Jakarta Sans', 'Source Sans 3', -apple-system, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', monospace`;

// ============================================================
// Member context — Jennifer Kim (Case 2)
// The validator knows her entire history from Layer 1
// ============================================================
const MEMBER = {
  name: "Jennifer Kim",
  memberId: "DERP-2008-04421",
  dob: "1970-06-22",
  dobDisplay: "June 22, 1970",
  age: 55,
  hireDate: "2008-03-01",
  hireDateDisplay: "March 1, 2008",
  tier: 2,
  earnedService: { years: 18, months: 2, decimal: 18.17 },
  purchasedService: { years: 3, months: 0, decimal: 3.0 },
  totalService: { years: 21, months: 2, decimal: 21.17 },
  lastDayWorked: "2026-04-30",
  maritalStatus: "Single",
  salaryHistory: [
    { period: "Apr 2025", monthly: 9175 },
    { period: "Mar 2025", monthly: 9175 },
    { period: "Feb 2025", monthly: 9175 },
    { period: "Jan 2025", monthly: 9050 },
    { period: "Dec 2024", monthly: 9050 },
    { period: "Nov 2024", monthly: 9050 },
  ],
  currentAMS: 9175.00,
  previousMonthSalary: 9175,
};

// ============================================================
// Validation engine — rules from Layer 2
// ============================================================
function validateField(fieldId, value, allFields) {
  const validations = [];
  const v = value?.toString().trim();
  if (!v) return validations;

  switch (fieldId) {
    case "retirementDate": {
      const d = new Date(v);
      if (isNaN(d.getTime())) break;
      const ldw = new Date(MEMBER.lastDayWorked);
      const firstOfNextMonth = new Date(ldw.getFullYear(), ldw.getMonth() + 1, 1);
      
      // Error: retirement date before minimum age
      const ageAtRetirement = (d - new Date(MEMBER.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      const minAge = MEMBER.tier === 3 ? 60 : 55;
      if (ageAtRetirement < minAge) {
        validations.push({
          severity: "error",
          message: `Tier ${MEMBER.tier} minimum early retirement age is ${minAge}. ${MEMBER.name} would be ${ageAtRetirement.toFixed(1)} at this date.`,
          citation: MEMBER.tier === 3 ? "RMC §18-404(b)" : "RMC §18-404(a)",
        });
      }

      // Error: not first of month
      if (d.getDate() !== 1) {
        validations.push({
          severity: "error",
          message: `Retirement effective date must be the first of a month.`,
          suggestion: `Did you mean ${d.toLocaleDateString("en-US", { month: "long" })} 1, ${d.getFullYear()}?`,
          suggestedValue: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
          citation: "RMC §18-400",
        });
      }

      // Error: before last day worked
      if (d <= ldw) {
        validations.push({
          severity: "error",
          message: `Retirement date must be after the last day worked (${ldw.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}).`,
          suggestion: `The earliest valid retirement date is ${firstOfNextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
          suggestedValue: `${firstOfNextMonth.getFullYear()}-${String(firstOfNextMonth.getMonth() + 1).padStart(2, "0")}-01`,
          citation: "RMC §18-400",
        });
      }

      // Info: Rule of 75 analysis
      const yearsAtRetirement = MEMBER.earnedService.decimal + (d - new Date(MEMBER.lastDayWorked)) / (365.25 * 24 * 60 * 60 * 1000);
      const ruleSum = ageAtRetirement + MEMBER.earnedService.decimal;
      if (ruleSum < 75 && ageAtRetirement >= minAge) {
        const yearsUnder65 = Math.floor(65 - ageAtRetirement);
        const reduction = yearsUnder65 * 3;
        validations.push({
          severity: "info",
          message: `Earned service: ${MEMBER.earnedService.decimal} years. Purchased service: ${MEMBER.purchasedService.decimal} years (excluded from Rule of 75). Rule of 75: ${ageAtRetirement.toFixed(1)} + ${MEMBER.earnedService.decimal} = ${ruleSum.toFixed(2)} — not met. Early retirement reduction: ${reduction}% (3% × ${yearsUnder65} years under 65).`,
          citation: "RMC §18-403(a), §18-404(a)",
          insight: ruleSum > 73 ? `${MEMBER.name} is ${(75 - ruleSum).toFixed(2)} points from Rule of 75. The scenario modeler can show when this threshold is reached.` : null,
        });
      } else if (ruleSum >= 75 && ageAtRetirement >= minAge) {
        validations.push({
          severity: "info",
          message: `Rule of 75 met: ${ageAtRetirement.toFixed(1)} + ${MEMBER.earnedService.decimal} = ${ruleSum.toFixed(2)} ≥ 75. No early retirement reduction applies.`,
          citation: "RMC §18-403(a)",
          isPositive: true,
        });
      }

      // Warning: processing cutoff
      const cutoffDay = 15;
      const retMonth = d.getMonth();
      const retYear = d.getFullYear();
      const cutoff = new Date(retYear, retMonth - 1, cutoffDay);
      const today = new Date(2026, 2, 10); // March 10
      const daysToCutoff = Math.ceil((cutoff - today) / (1000 * 60 * 60 * 24));
      if (daysToCutoff > 0 && daysToCutoff <= 14) {
        validations.push({
          severity: "warning",
          message: `Processing cutoff for ${d.toLocaleDateString("en-US", { month: "long" })} 1 first payment is ${cutoff.toLocaleDateString("en-US", { month: "long", day: "numeric" })} — ${daysToCutoff} days from today. Ensure complete package is submitted by this date.`,
          citation: "Administrative Policy",
        });
      }
      break;
    }

    case "finalMonthSalary": {
      const salary = parseFloat(v.replace(/[$,]/g, ""));
      if (isNaN(salary)) break;
      const prev = MEMBER.previousMonthSalary;
      const pctChange = ((salary - prev) / prev) * 100;

      if (salary <= 0) {
        validations.push({ severity: "error", message: "Salary must be a positive amount.", citation: "Data Validation" });
        break;
      }

      if (pctChange > 25) {
        const hiredBefore2010 = new Date(MEMBER.hireDate) < new Date("2010-01-01");
        if (hiredBefore2010) {
          validations.push({
            severity: "warning",
            message: `This amount is ${pctChange.toFixed(0)}% higher than the previous month ($${prev.toLocaleString()}). ${MEMBER.name} was hired ${MEMBER.hireDateDisplay} (before Jan 1, 2010) and is eligible for leave payout inclusion. If a sick/vacation cash-out is included, this may be correct.`,
            citation: "RMC §18-391(13), §18-396",
            actions: ["Confirm leave payout included", "Correct the amount"],
          });
        } else {
          validations.push({
            severity: "warning",
            message: `This amount is ${pctChange.toFixed(0)}% higher than the previous month ($${prev.toLocaleString()}). ${MEMBER.name} was hired after Jan 1, 2010 and is NOT eligible for leave payout. Please verify this salary figure.`,
            citation: "RMC §18-391(13)",
          });
        }
      } else if (pctChange < -10) {
        validations.push({
          severity: "warning",
          message: `This amount is ${Math.abs(pctChange).toFixed(0)}% lower than the previous month ($${prev.toLocaleString()}). This may indicate a furlough or reduced schedule. If within the AMS window, the member may want to purchase furlough days to offset the impact.`,
          citation: "RMC §18-396(b)",
        });
      }

      // Info: AMS impact
      if (salary > MEMBER.currentAMS) {
        validations.push({
          severity: "info",
          message: `This amount ($${salary.toLocaleString()}) is above the current AMS ($${MEMBER.currentAMS.toLocaleString()}). If this month falls within the highest 36-month window, it will increase the AMS and benefit amount.`,
          citation: "RMC §18-391(3)",
          isPositive: true,
        });
      }
      break;
    }

    case "purchasedServiceYears": {
      const years = parseFloat(v);
      if (isNaN(years)) break;
      if (years < 0) {
        validations.push({ severity: "error", message: "Purchased service cannot be negative.", citation: "Data Validation" });
        break;
      }
      if (years !== MEMBER.purchasedService.decimal) {
        validations.push({
          severity: "error",
          message: `Member records show ${MEMBER.purchasedService.decimal} years of purchased service. The entered value (${years}) does not match. Purchased service amounts are established at time of purchase and cannot be changed during retirement processing.`,
          citation: "RMC §18-411",
          suggestion: `Correct value: ${MEMBER.purchasedService.decimal} years`,
          suggestedValue: MEMBER.purchasedService.decimal.toString(),
        });
      }
      // Always show the eligibility note
      validations.push({
        severity: "info",
        message: `Purchased service (${MEMBER.purchasedService.decimal} years) is included in the benefit formula (multiplier × AMS × ${MEMBER.totalService.decimal} total years) but excluded from Rule of 75 eligibility (age + ${MEMBER.earnedService.decimal} earned years only).`,
        citation: "RMC §18-403, §18-411",
      });
      break;
    }

    case "earnedServiceYears": {
      const years = parseFloat(v);
      if (isNaN(years)) break;
      const expected = MEMBER.earnedService.decimal;
      if (Math.abs(years - expected) > 0.1) {
        validations.push({
          severity: "warning",
          message: `Computed earned service from employment records is ${expected} years (${MEMBER.earnedService.years}y ${MEMBER.earnedService.months}m). The entered value (${years}) differs by ${Math.abs(years - expected).toFixed(2)} years. Please verify against employment history.`,
          citation: "RMC §18-391(16)",
          suggestion: `Expected: ${expected} years`,
          suggestedValue: expected.toString(),
        });
      }
      break;
    }

    case "paymentOption": {
      if (v === "maximum" && MEMBER.maritalStatus === "Married") {
        validations.push({
          severity: "warning",
          message: `${MEMBER.name} is married. Electing Maximum (Single Life) requires notarized spousal consent. Ensure DERP Spousal Consent form is submitted with the retirement package.`,
          citation: "RMC §18-406(c)",
          actions: ["Confirm spousal consent on file"],
        });
      }
      if (MEMBER.maritalStatus === "Single") {
        validations.push({
          severity: "info",
          message: `${MEMBER.name} is not married. No spousal consent required. All payment options are available without restriction.`,
          citation: "RMC §18-406(c)",
          isPositive: true,
        });
      }
      break;
    }

    case "beneficiaryAge": {
      const age = parseInt(v);
      if (isNaN(age)) break;
      if (age < 18) {
        validations.push({
          severity: "warning",
          message: `Beneficiary is a minor (age ${age}). A legal guardian or trust must be designated to receive benefits on behalf of the minor. Additional documentation may be required.`,
          citation: "RMC §18-405",
        });
      }
      if (age > 100) {
        validations.push({
          severity: "warning",
          message: `Beneficiary age of ${age} is unusual. Please verify the beneficiary's date of birth.`,
          citation: "Data Validation",
        });
      }
      break;
    }

    case "deathBenefitInstallments": {
      if (v !== "50" && v !== "100") {
        validations.push({
          severity: "error",
          message: `Lump-sum death benefit must be elected as either 50 or 100 monthly installments. "${v}" is not a valid election.`,
          citation: "RMC §18-407",
        });
      }
      if (v === "50" || v === "100") {
        // Calculate the LSDB for early retirement
        const yearsUnder65 = 10; // Jennifer is 55
        const lsdb = 5000 - (250 * yearsUnder65);
        const monthly = (lsdb / parseInt(v)).toFixed(2);
        validations.push({
          severity: "info",
          message: `Early retirement Tier ${MEMBER.tier}: $5,000 − ($250 × ${yearsUnder65} years under 65) = $${lsdb.toLocaleString()} lump-sum death benefit. At ${v} installments: $${monthly}/month to beneficiary. This election is irrevocable.`,
          citation: "RMC §18-407",
        });
      }
      break;
    }

    case "applicationDate": {
      const d = new Date(v);
      if (isNaN(d.getTime())) break;
      const ldw = new Date(MEMBER.lastDayWorked);
      const deadline = new Date(ldw);
      deadline.setDate(deadline.getDate() + 30);
      const daysAfterLDW = Math.ceil((d - ldw) / (1000 * 60 * 60 * 24));

      if (d > deadline) {
        validations.push({
          severity: "error",
          message: `Application received ${daysAfterLDW} days after last day worked. The 30-day filing window expired on ${deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. This application may be rejected.`,
          citation: "RMC §18-400",
        });
      } else if (d > ldw) {
        validations.push({
          severity: "info",
          message: `Application received ${daysAfterLDW} days after last day worked. Within the 30-day filing window (${30 - daysAfterLDW} days remaining). ✓`,
          citation: "RMC §18-400",
          isPositive: true,
        });
      } else if (d <= ldw) {
        validations.push({
          severity: "info",
          message: `Application received before last day worked. Filing window has not started yet — this is acceptable.`,
          citation: "RMC §18-400",
          isPositive: true,
        });
      }
      break;
    }
  }

  return validations;
}

// ============================================================
// Components
// ============================================================

function ValidationMessage({ validation, onApplySuggestion, animDelay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), animDelay || 0); return () => clearTimeout(t); }, [animDelay]);

  const config = {
    error: { icon: "✕", label: "ERROR", bg: C.dangerLight, color: C.danger, border: "#ef9a9a", iconBg: "#ffcdd2" },
    warning: { icon: "▲", label: "WARNING", bg: C.accentLight, color: C.accent, border: "#ffcc80", iconBg: "#ffe0b2" },
    info: { icon: validation.isPositive ? "✓" : "ℹ", label: validation.isPositive ? "VALID" : "INFO", bg: validation.isPositive ? C.successLight : C.infoLight, color: validation.isPositive ? C.success : C.info, border: validation.isPositive ? "#a5d6a7" : "#90caf9", iconBg: validation.isPositive ? "#c8e6c9" : "#bbdefb" },
  };
  const c = config[validation.severity];

  return (
    <div style={{
      background: c.bg, borderRadius: 8, border: `1px solid ${c.border}`,
      padding: "10px 12px", marginTop: 6,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-4px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: c.color,
        }}>{c.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: c.color, letterSpacing: 0.8 }}>{c.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: MONO, padding: "1px 6px", borderRadius: 3,
              background: "rgba(255,255,255,0.6)", color: C.primary, border: `1px solid ${C.primaryLight}`,
            }}>§ {validation.citation}</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: C.text, margin: 0, fontFamily: FONT }}>{validation.message}</p>

          {validation.suggestion && (
            <div style={{
              marginTop: 8, padding: "8px 10px", borderRadius: 6,
              background: "rgba(255,255,255,0.7)", border: `1px dashed ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 12, color: C.textSecondary }}>{validation.suggestion}</span>
              {validation.suggestedValue && (
                <button onClick={() => onApplySuggestion(validation.suggestedValue)} style={{
                  padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.primary}`,
                  background: C.primarySurface, color: C.primary, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: FONT, transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.target.style.background = C.primary; e.target.style.color = "#fff"; }}
                  onMouseLeave={e => { e.target.style.background = C.primarySurface; e.target.style.color = C.primary; }}
                >Apply Correction</button>
              )}
            </div>
          )}

          {validation.insight && (
            <div style={{
              marginTop: 8, padding: "8px 10px", borderRadius: 6,
              background: `linear-gradient(135deg, ${C.primarySurface} 0%, #f0faf9 100%)`,
              border: `1px solid ${C.primaryLight}`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 0.5 }}>💡 THRESHOLD INSIGHT: </span>
              <span style={{ fontSize: 12, color: C.text }}>{validation.insight}</span>
            </div>
          )}

          {validation.actions && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {validation.actions.map((action, i) => (
                <button key={i} style={{
                  padding: "5px 12px", borderRadius: 6, border: `1px solid ${c.border}`,
                  background: "rgba(255,255,255,0.7)", color: c.color, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: FONT,
                }}>{action}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidatedField({ id, label, type, value, onChange, validations, onApplySuggestion, hint, options, width }) {
  const hasError = validations.some(v => v.severity === "error");
  const hasWarning = validations.some(v => v.severity === "warning");
  const borderColor = hasError ? C.danger : hasWarning ? C.accent : value ? C.primary : C.border;

  return (
    <div style={{ flex: width || "1 1 auto", minWidth: 200 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textSecondary,
        marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase",
      }}>{label}</label>
      {type === "select" ? (
        <select value={value || ""} onChange={e => onChange(id, e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: FONT,
            border: `2px solid ${borderColor}`, borderRadius: 8, background: C.surface,
            color: C.text, outline: "none", transition: "border-color 0.2s",
            appearance: "none", cursor: "pointer",
          }}>
          <option value="">— Select —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type || "text"} value={value || ""} onChange={e => onChange(id, e.target.value)}
          placeholder={hint}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: type === "number" ? MONO : FONT,
            border: `2px solid ${borderColor}`, borderRadius: 8, background: C.surface,
            color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={e => { e.target.style.boxShadow = `0 0 0 3px ${hasError ? C.dangerLight : hasWarning ? C.accentLight : C.primarySurface}`; }}
          onBlur={e => { e.target.style.boxShadow = "none"; }}
        />
      )}
      {validations.map((v, i) => (
        <ValidationMessage key={i} validation={v} onApplySuggestion={(val) => onApplySuggestion(id, val)} animDelay={i * 100} />
      ))}
    </div>
  );
}

function MemberBanner() {
  const tierColors = { 1: C.tier1, 2: C.tier2, 3: C.tier3 };
  const tierBgs = { 1: C.tier1Bg, 2: C.tier2Bg, 3: C.tier3Bg };
  return (
    <div style={{
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
      padding: "12px 16px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          background: tierBgs[MEMBER.tier], color: tierColors[MEMBER.tier], fontWeight: 800, fontSize: 14,
          border: `2px solid ${tierColors[MEMBER.tier]}`,
        }}>T{MEMBER.tier}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{MEMBER.name}</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            {MEMBER.memberId} · DOB: {MEMBER.dobDisplay} · Hired: {MEMBER.hireDateDisplay}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Earned", value: `${MEMBER.earnedService.years}y ${MEMBER.earnedService.months}m` },
          { label: "Purchased", value: `${MEMBER.purchasedService.years}y` },
          { label: "AMS", value: `$${MEMBER.currentAMS.toLocaleString()}` },
          { label: "Last Day", value: "Apr 30, 2026" },
        ].map(f => (
          <div key={f.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textTertiary, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{f.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: C.text }}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationSummary({ fields }) {
  let errors = 0, warnings = 0, passed = 0;
  Object.values(fields).forEach(v => {
    if (!v) return;
    const vals = validateField(Object.keys(fields).find(k => fields[k] === v), v, fields);
    vals.forEach(val => {
      if (val.severity === "error") errors++;
      else if (val.severity === "warning") warnings++;
      else if (val.isPositive) passed++;
    });
  });
  const total = errors + warnings + passed;
  if (total === 0) return null;

  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 20, padding: "12px 16px",
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
      alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
        Validation Summary
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {errors > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: C.dangerLight, color: C.danger }}>
            {errors} error{errors > 1 ? "s" : ""}
          </span>
        )}
        {warnings > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: C.accentLight, color: C.accent }}>
            {warnings} warning{warnings > 1 ? "s" : ""}
          </span>
        )}
        {passed > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: C.successLight, color: C.success }}>
            {passed} passed
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Demo Presets — quickly populate fields to show validation
// ============================================================
const PRESETS = [
  {
    label: "Happy Path",
    description: "Correct data for Jennifer Kim",
    fields: {
      retirementDate: "2026-05-01",
      applicationDate: "2026-04-08",
      finalMonthSalary: "9175",
      earnedServiceYears: "18.17",
      purchasedServiceYears: "3",
      paymentOption: "maximum",
      deathBenefitInstallments: "50",
    },
  },
  {
    label: "Common Mistakes",
    description: "Typical data entry errors",
    fields: {
      retirementDate: "2026-04-15",
      applicationDate: "2026-04-08",
      finalMonthSalary: "14500",
      earnedServiceYears: "21.17",
      purchasedServiceYears: "4",
      paymentOption: "",
      deathBenefitInstallments: "75",
    },
  },
  {
    label: "Boundary Test",
    description: "Near-threshold scenarios",
    fields: {
      retirementDate: "2027-07-01",
      applicationDate: "",
      finalMonthSalary: "9175",
      earnedServiceYears: "18.17",
      purchasedServiceYears: "3",
      paymentOption: "",
      deathBenefitInstallments: "",
    },
  },
];

// ============================================================
// Main Application
// ============================================================
export function DataEntryValidator() {
  const [fields, setFields] = useState({
    retirementDate: "",
    applicationDate: "",
    finalMonthSalary: "",
    earnedServiceYears: "",
    purchasedServiceYears: "",
    paymentOption: "",
    beneficiaryAge: "",
    deathBenefitInstallments: "",
  });
  const [validationResults, setValidationResults] = useState({});

  const handleChange = useCallback((fieldId, value) => {
    setFields(prev => {
      const next = { ...prev, [fieldId]: value };
      // Revalidate this field
      const results = validateField(fieldId, value, next);
      setValidationResults(prev2 => ({ ...prev2, [fieldId]: results }));
      return next;
    });
  }, []);

  const handleApplySuggestion = useCallback((fieldId, value) => {
    handleChange(fieldId, value);
  }, [handleChange]);

  const applyPreset = useCallback((preset) => {
    const newFields = { ...fields };
    const newResults = {};
    Object.entries(preset.fields).forEach(([k, v]) => {
      newFields[k] = v;
      newResults[k] = validateField(k, v, preset.fields);
    });
    setFields(newFields);
    setValidationResults(newResults);
  }, [fields]);

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        * { box-sizing: border-box; }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%234a6767' stroke-width='1.5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
      `}</style>

      {/* Top bar */}
      <div style={{
        background: C.sidebar, padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>NoUI</span>
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Data Entry Validator</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(77,182,172,0.15)", color: C.sidebarActive, border: "1px solid rgba(77,182,172,0.3)", letterSpacing: 0.5 }}>PLATFORM CORE</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.sidebarText, alignSelf: "center", marginRight: 4 }}>Demo presets:</span>
          {PRESETS.map(preset => (
            <button key={preset.label} onClick={() => applyPreset(preset)}
              title={preset.description}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)", color: C.sidebarText, fontSize: 11,
                fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.background = "rgba(77,182,172,0.2)"; e.target.style.color = C.sidebarActive; }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = C.sidebarText; }}
            >{preset.label}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px" }}>
        <MemberBanner />
        <ValidationSummary fields={fields} />

        {/* Form Section: Retirement Basics */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 16,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>
            Retirement Details
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ValidatedField id="retirementDate" label="Retirement Effective Date" type="date"
              value={fields.retirementDate} onChange={handleChange}
              validations={validationResults.retirementDate || []} onApplySuggestion={handleApplySuggestion}
              hint="YYYY-MM-DD" />
            <ValidatedField id="applicationDate" label="Application Received Date" type="date"
              value={fields.applicationDate} onChange={handleChange}
              validations={validationResults.applicationDate || []} onApplySuggestion={handleApplySuggestion}
              hint="YYYY-MM-DD" />
          </div>
        </div>

        {/* Form Section: Service Credit */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 16,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>
            Service Credit
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ValidatedField id="earnedServiceYears" label="Earned Service (Years)" type="text"
              value={fields.earnedServiceYears} onChange={handleChange}
              validations={validationResults.earnedServiceYears || []} onApplySuggestion={handleApplySuggestion}
              hint="e.g. 18.17" />
            <ValidatedField id="purchasedServiceYears" label="Purchased Service (Years)" type="text"
              value={fields.purchasedServiceYears} onChange={handleChange}
              validations={validationResults.purchasedServiceYears || []} onApplySuggestion={handleApplySuggestion}
              hint="e.g. 3.0" />
          </div>
        </div>

        {/* Form Section: Salary */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 16,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>
            Final Month Salary
          </h3>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <ValidatedField id="finalMonthSalary" label="Final Month Compensation ($)" type="text"
              value={fields.finalMonthSalary} onChange={handleChange}
              validations={validationResults.finalMonthSalary || []} onApplySuggestion={handleApplySuggestion}
              hint="e.g. 9175" />
            <div style={{ flex: "1 1 200px", minWidth: 200, padding: "6px 12px", background: C.surfaceAlt, borderRadius: 8, marginTop: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textTertiary, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Recent Salary History</div>
              {MEMBER.salaryHistory.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < MEMBER.salaryHistory.length - 1 ? `1px solid ${C.borderSubtle}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.textSecondary }}>{s.period}</span>
                  <span style={{ fontSize: 12, fontFamily: MONO, color: C.text, fontWeight: 600 }}>${s.monthly.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section: Payment Election */}
        <div style={{
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 16,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>
            Payment Election
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ValidatedField id="paymentOption" label="Payment Option" type="select"
              value={fields.paymentOption} onChange={handleChange}
              validations={validationResults.paymentOption || []} onApplySuggestion={handleApplySuggestion}
              options={[
                { value: "maximum", label: "Maximum (Single Life)" },
                { value: "100js", label: "100% Joint & Survivor" },
                { value: "75js", label: "75% Joint & Survivor" },
                { value: "50js", label: "50% Joint & Survivor" },
              ]} />
            <ValidatedField id="deathBenefitInstallments" label="Death Benefit Installments" type="select"
              value={fields.deathBenefitInstallments} onChange={handleChange}
              validations={validationResults.deathBenefitInstallments || []} onApplySuggestion={handleApplySuggestion}
              options={[
                { value: "50", label: "50 Monthly Installments" },
                { value: "100", label: "100 Monthly Installments" },
              ]} />
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: C.primarySurface, border: `1px solid ${C.primaryLight}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, flexShrink: 0, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>
            All validations reference governing document provisions. Rules sourced from RMC §18-391 through §18-430.7.
          </span>
        </div>
      </div>
    </div>
  );
}
