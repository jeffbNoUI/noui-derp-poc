import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
// NoUI Multi-Portal Design System Prototype
// ═══════════════════════════════════════════════════════════════════════
// Four portal personalities, one shared component architecture:
//   1. Staff Portal (LOB)    — High density, keyboard-first, command palette
//   2. Member Portal          — DERP brand, progressive disclosure, friendly
//   3. Employer Portal        — Professional, reporting-focused
//   4. Vendor Portal          — Clean transactional, enrollment-focused
// ═══════════════════════════════════════════════════════════════════════

// ── PORTAL THEME DEFINITIONS ─────────────────────────────────────────
const PORTALS = {
  staff: {
    id: "staff", name: "Staff Portal", subtitle: "Service Retirement Workspace",
    user: { name: "Sarah Chen", role: "Benefits Analyst", initials: "SC" },
    // Linear-inspired: deep sidebar, controlled density, monochrome with accent
    sidebar: { bg: "#00363a", text: "#8fb8b8", active: "#4db6ac", hover: "#004d40", brand: "#fff", accent: "#00bfa5" },
    surface: { bg: "#f4f7f7", card: "#ffffff", cardAlt: "#eef5f5", elevated: "#ffffff" },
    text: { primary: "#1a2e2e", secondary: "#4a6767", muted: "#7a9696", dim: "#a8c0c0" },
    border: { base: "#d0dede", subtle: "#e8eef0", active: "#00796b", focus: "#00796b" },
    accent: { primary: "#00796b", primaryHover: "#00695c", light: "#b2dfdb", surface: "#e0f2f1", on: "#fff" },
    status: { success: "#2e7d32", successBg: "#e8f5e9", warning: "#e65100", warningBg: "#fff3e0", danger: "#c62828", dangerBg: "#ffebee", info: "#0369a1", infoBg: "#e0f2fe" },
    tier: { t1: "#1565c0", t1bg: "rgba(21,101,192,0.08)", t2: "#e65100", t2bg: "rgba(230,81,0,0.08)", t3: "#2e7d32", t3bg: "rgba(46,125,50,0.08)" },
    shadow: "0 1px 3px rgba(0,54,58,0.06)", shadowLg: "0 8px 24px rgba(0,54,58,0.10)",
    btn: { bg: "#00796b", text: "#fff", hover: "#00695c" },
    density: "high", layout: "sidebar",
  },
  member: {
    id: "member", name: "Member Portal", subtitle: "MyDERP · Your Retirement Journey",
    user: { name: "Robert Martinez", role: "Active Member · Tier 1", initials: "RM" },
    // DERP Brand: warm teal, orange accents, inviting and clear
    sidebar: null, // No sidebar — top nav
    surface: { bg: "#f6f9f9", card: "#ffffff", cardAlt: "#f0f6f6", elevated: "#ffffff" },
    text: { primary: "#1a2e2e", secondary: "#4a6363", muted: "#728f8f", dim: "#9bb0b0" },
    border: { base: "#d4e0e0", subtle: "#e8efef", active: "#00796b", focus: "#00796b" },
    accent: { primary: "#00796b", primaryHover: "#00695c", light: "#b2dfdb", surface: "#e0f2f1", on: "#fff" },
    warm: { primary: "#e65100", light: "#fff3e0", mid: "#ff8f00" },
    status: { success: "#2e7d32", successBg: "#e8f5e9", warning: "#e65100", warningBg: "#fff3e0", danger: "#c62828", dangerBg: "#ffebee", info: "#0369a1", infoBg: "#e0f2fe" },
    shadow: "0 2px 8px rgba(0,54,58,0.06)", shadowLg: "0 8px 24px rgba(0,54,58,0.08)",
    btn: { bg: "#00796b", text: "#fff", hover: "#00695c" },
    density: "comfortable", layout: "topnav",
  },
  employer: {
    id: "employer", name: "Employer Portal", subtitle: "Denver Payroll & Reporting",
    user: { name: "Maria Gonzalez", role: "Payroll Manager · Public Works", initials: "MG" },
    // Professional slate-blue, data-focused
    sidebar: { bg: "#1e293b", text: "#94a3b8", active: "#60a5fa", hover: "#334155", brand: "#fff", accent: "#3b82f6" },
    surface: { bg: "#f8fafc", card: "#ffffff", cardAlt: "#f1f5f9", elevated: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569", muted: "#94a3b8", dim: "#cbd5e1" },
    border: { base: "#cbd5e1", subtle: "#e2e8f0", active: "#3b82f6", focus: "#3b82f6" },
    accent: { primary: "#3b82f6", primaryHover: "#2563eb", light: "#bfdbfe", surface: "#eff6ff", on: "#fff" },
    status: { success: "#059669", successBg: "#ecfdf5", warning: "#d97706", warningBg: "#fffbeb", danger: "#dc2626", dangerBg: "#fef2f2", info: "#0284c7", infoBg: "#e0f2fe" },
    shadow: "0 1px 3px rgba(15,23,42,0.05)", shadowLg: "0 8px 24px rgba(15,23,42,0.08)",
    btn: { bg: "#3b82f6", text: "#fff", hover: "#2563eb" },
    density: "high", layout: "sidebar",
  },
  vendor: {
    id: "vendor", name: "Vendor Portal", subtitle: "Health Insurance Enrollment",
    user: { name: "James Park", role: "Enrollment Specialist · Kaiser", initials: "JP" },
    // Clean, transactional green-teal — healthcare-adjacent
    sidebar: null,
    surface: { bg: "#f7faf9", card: "#ffffff", cardAlt: "#f0f5f4", elevated: "#ffffff" },
    text: { primary: "#14312d", secondary: "#3d6660", muted: "#6b9691", dim: "#a3bfbb" },
    border: { base: "#c8dbd8", subtle: "#e2edeb", active: "#0d9488", focus: "#0d9488" },
    accent: { primary: "#0d9488", primaryHover: "#0f766e", light: "#99f6e4", surface: "#f0fdfa", on: "#fff" },
    status: { success: "#059669", successBg: "#ecfdf5", warning: "#d97706", warningBg: "#fffbeb", danger: "#dc2626", dangerBg: "#fef2f2", info: "#0284c7", infoBg: "#e0f2fe" },
    shadow: "0 1px 3px rgba(20,49,45,0.05)", shadowLg: "0 8px 24px rgba(20,49,45,0.08)",
    btn: { bg: "#0d9488", text: "#fff", hover: "#0f766e" },
    density: "comfortable", layout: "topnav",
  },
};

const fmt = n => n != null ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

// ── DEMO MEMBER DATA ─────────────────────────────────────────────────
const MEMBER = {
  name: "Robert Martinez", id: "M-100001", tier: 1, dept: "Public Works",
  dob: "1963-03-08", hireDate: "1997-06-15", retDate: "2026-04-01",
  age: 63, service: 28.75, ruleSum: 91.75, ruleMet: true,
  ams: 10639.45, multiplier: "2.0%", benefit: 6117.68,
  leave: 52000, amsWithout: 9194.45,
  spouse: "Elena Martinez", spouseAge: 59,
  opts: { max: 6117.68, js100: 5414.15, js75: 5597.68, js50: 5781.21 },
  ipr: { pre: 359.38, post: 179.69 },
  deathBenefit: 5000,
  elected: "js75", survivorAmt: 4198.26,
};

// ── SHARED UI PRIMITIVES ─────────────────────────────────────────────

function Badge({ text, color, bg }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: bg, color, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>{text}</span>
  );
}

function KBD({ children, T }) {
  return (
    <kbd style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: T.surface.cardAlt, border: `1px solid ${T.border.subtle}`, color: T.text.muted, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{children}</kbd>
  );
}

// ── COMMAND PALETTE ──────────────────────────────────────────────────
function CommandPalette({ open, onClose, T }) {
  const ref = useRef(null);
  const [query, setQuery] = useState("");
  const commands = [
    { id: "member", icon: "👤", label: "Search Member", hint: "Find by name, ID, or SSN" },
    { id: "case", icon: "📋", label: "Open Case", hint: "Jump to case by number" },
    { id: "calc", icon: "🔢", label: "Run Calculation", hint: "Estimate benefit for current member" },
    { id: "queue", icon: "📥", label: "My Queue", hint: "View assigned work items" },
    { id: "approve", icon: "✅", label: "Pending Approvals", hint: "Items awaiting supervisor review" },
    { id: "docs", icon: "📄", label: "Document Checklist", hint: "Outstanding documents for case" },
    { id: "rules", icon: "📖", label: "Rule Reference", hint: "Search DERP governing rules" },
    { id: "msg", icon: "💬", label: "Messages", hint: "Member communications" },
  ];
  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.hint.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { if (open && ref.current) { ref.current.focus(); setQuery(""); } }, [open]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120, backdropFilter: "blur(2px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: T.surface.card, borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.2)", border: `1px solid ${T.border.base}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border.subtle}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.text.muted, fontSize: 16 }}>⌘</span>
          <input ref={ref} value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a command or search…" style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: T.text.primary, background: "transparent", fontFamily: "'Source Sans 3', sans-serif" }} />
          <KBD T={T}>esc</KBD>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0" }}>
          {filtered.map((c, i) => (
            <div key={c.id} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: i === 0 ? T.accent.surface : "transparent", borderLeft: i === 0 ? `2px solid ${T.accent.primary}` : "2px solid transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.accent.surface; }}
              onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{c.label}</div>
                <div style={{ fontSize: 11, color: T.text.muted }}>{c.hint}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "20px 16px", textAlign: "center", color: T.text.muted, fontSize: 13 }}>No commands match "{query}"</div>}
        </div>
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border.subtle}`, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.text.dim }}>↑↓ Navigate</span>
          <span style={{ fontSize: 10, color: T.text.dim }}>↵ Select</span>
          <span style={{ fontSize: 10, color: T.text.dim }}>esc Close</span>
        </div>
      </div>
    </div>
  );
}

// ── STAFF PORTAL: PIPELINE WORKSPACE ─────────────────────────────────
function StaffWorkspace({ T }) {
  const [step, setStep] = useState(0);
  const M = MEMBER;
  const tierColor = T.tier?.t1 || T.accent.primary;
  const tierBg = T.tier?.t1bg || T.accent.surface;

  const steps = [
    { id: "confirm", icon: "📋", title: "Confirm Retirement", heroValue: "No Reduction", heroColor: T.status.success,
      preview: `Rule of 75: ${M.ruleSum} ✓ · Age ${M.age}` },
    { id: "eligibility", icon: "✓", title: "Eligibility & Service", heroValue: `${M.service}y`, heroColor: tierColor,
      preview: `Tier 1 · Vested · Leave payout $52K` },
    { id: "salary", icon: "💰", title: "Salary & AMS", heroValue: fmt(M.ams) + "/mo", heroColor: T.accent.primary,
      preview: `36-mo window · +$52K leave boost` },
    { id: "calculation", icon: "🔢", title: "Benefit Calculation", heroValue: fmt(M.benefit) + "/mo", heroColor: T.accent.primary,
      preview: `2.0% × ${fmt(M.ams)} × ${M.service}y` },
    { id: "payment", icon: "💳", title: "Payment Option", heroValue: fmt(M.opts.js75) + "/mo", heroColor: T.accent.primary,
      preview: `75% J&S · Survivor: ${fmt(M.survivorAmt)}` },
    { id: "certify", icon: "✅", title: "Certification", heroValue: "Ready", heroColor: T.status.success,
      preview: `IPR ${fmt(M.ipr.pre)}/mo · Death ${fmt(M.deathBenefit)}` },
  ];

  const completed = steps.slice(0, step);
  const active = steps[step];
  const upcoming = steps.slice(step + 1);

  const Field = ({ label, value, highlight, badge: b, sub }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border.subtle}` }}>
      <div>
        <span style={{ color: T.text.secondary, fontSize: 12 }}>{label}</span>
        {sub && <span style={{ display: "block", color: T.text.muted, fontSize: 10, marginTop: 1 }}>{sub}</span>}
      </div>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {b && <Badge text={b.text} color={b.color} bg={b.bg} />}
        <span style={{ color: highlight ? T.accent.primary : T.text.primary, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{value}</span>
      </span>
    </div>
  );

  const Callout = ({ type, title, text }) => {
    const s = { success: { bg: T.status.successBg, color: T.status.success }, warning: { bg: T.status.warningBg, color: T.status.warning }, info: { bg: T.status.infoBg, color: T.status.info } }[type] || { bg: T.status.infoBg, color: T.status.info };
    return (
      <div style={{ marginTop: 10, padding: "8px 12px", background: s.bg, borderRadius: 6, borderLeft: `3px solid ${s.color}` }}>
        {title && <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 2 }}>{title}</div>}
        <div style={{ fontSize: 11, color: s.color, lineHeight: 1.5 }}>{text}</div>
      </div>
    );
  };

  const stepContent = {
    confirm: () => (
      <>
        <Field label="Retirement Date" value="April 1, 2026" highlight />
        <Field label="Type" value="Service — Unreduced" />
        <Field label="Age" value="63 years" />
        <Field label="Service" value="28.75 years" />
        <Field label="Rule of 75" value="91.75 ≥ 75" highlight badge={{ text: "Met", bg: T.status.successBg, color: T.status.success }} />
        <Callout type="success" title="Rule of 75 Satisfied" text="Age 63 + Service 28.75 = 91.75 ≥ 75. No early retirement reduction." />
      </>
    ),
    eligibility: () => (
      <>
        <Field label="Benefit Tier" value="Tier 1" badge={{ text: "Pre-2004", bg: tierBg, color: tierColor }} sub="Hired before Sept 1, 2004" />
        <Field label="Vesting" value="28.75y ≥ 5y" badge={{ text: "Met", bg: T.status.successBg, color: T.status.success }} />
        <Field label="Leave Payout" value={fmt(52000)} highlight sub="Hired before Jan 1, 2010" />
        <Field label="Minimum Age" value="63 ≥ 55" badge={{ text: "Met", bg: T.status.successBg, color: T.status.success }} />
      </>
    ),
    salary: () => (
      <>
        <Field label="AMS Window" value="36 consecutive months" sub="Tiers 1/2 use 36-month window" />
        <Field label="Period" value="Apr 2023 — Mar 2026" highlight />
        <Field label="Base Total" value={fmt(331020.24)} />
        <Field label="+ Leave Payout" value={fmt(52000)} badge={{ text: "Boost", bg: T.status.warningBg, color: T.status.warning }} />
        <Field label="AMS Result" value={fmt(M.ams)} highlight />
        <Callout type="warning" title="Leave Payout Impact" text={`Without: ${fmt(M.amsWithout)}/mo → With: ${fmt(M.ams)}/mo (+${fmt(M.ams - M.amsWithout)}/mo)`} />
      </>
    ),
    calculation: () => (
      <>
        <div style={{ padding: 14, background: T.accent.surface, borderRadius: 8, textAlign: "center", marginBottom: 12, border: `1px solid ${T.accent.light}` }}>
          <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 1, textTransform: "uppercase" }}>Monthly Benefit</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.accent.primary, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(M.benefit)}</div>
        </div>
        <Field label="Formula" value={`2.0% × ${fmt(M.ams)} × 28.75`} highlight />
        <Field label="Annual" value={fmt(M.benefit * 12)} />
        <Field label="Source" value="RMC §18-401" sub="Tier 1 multiplier rate" />
      </>
    ),
    payment: () => (
      <>
        {[
          { key: "max", label: "Maximum", amt: M.opts.max, surv: 0 },
          { key: "js100", label: "100% J&S", amt: M.opts.js100, surv: M.opts.js100 },
          { key: "js75", label: "75% J&S", amt: M.opts.js75, surv: M.survivorAmt },
          { key: "js50", label: "50% J&S", amt: M.opts.js50, surv: 2890.61 },
        ].map(o => (
          <div key={o.key} style={{ padding: "10px 12px", marginBottom: 6, borderRadius: 6, border: `1px solid ${M.elected === o.key ? T.border.active : T.border.subtle}`, background: M.elected === o.key ? T.accent.surface : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>{o.label}</span>
              {M.elected === o.key && <Badge text="Elected" color={T.accent.primary} bg={T.accent.surface} />}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: M.elected === o.key ? T.accent.primary : T.text.primary }}>{fmt(o.amt)}</div>
              {o.surv > 0 && <div style={{ fontSize: 10, color: T.text.muted }}>Survivor: {fmt(o.surv)}</div>}
            </div>
          </div>
        ))}
        <Field label="Beneficiary" value="Elena Martinez (Spouse)" />
      </>
    ),
    certify: () => (
      <>
        <Field label="IPR (pre-Medicare)" value={fmt(M.ipr.pre) + "/mo"} highlight sub="28.75y × $12.50" />
        <Field label="IPR (post-Medicare)" value={fmt(M.ipr.post) + "/mo"} sub="28.75y × $6.25" />
        <Field label="Death Benefit" value={fmt(M.deathBenefit)} />
        <Field label="Application Deadline" value="30 days from last day worked" />
        <Callout type="success" title="Ready for Certification" text={`${M.name} · Rule of 75 met · ${fmt(M.benefit)}/mo (75% J&S) · IPR ${fmt(M.ipr.pre)}/mo`} />
      </>
    ),
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: upcoming.length > 0 ? "1fr 260px" : "1fr", gap: 16, padding: 16 }}>
      {/* Active Panel */}
      <div>
        {/* Completed chips */}
        {completed.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            {completed.map((s, i) => (
              <div key={s.id} onClick={() => setStep(i)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: T.status.successBg, border: `1px solid rgba(46,125,50,0.12)`, fontSize: 11, color: T.status.success, fontWeight: 600 }}>
                <span style={{ fontSize: 11 }}>{s.icon}</span>✓ {s.title}
              </div>
            ))}
          </div>
        )}
        {/* Active step card */}
        <div style={{ background: T.surface.card, borderRadius: 8, border: `1px solid ${T.border.base}`, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border.subtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{active.icon}</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.text.primary }}>{active.title}</span>
                <span style={{ fontSize: 10, color: T.text.muted, marginLeft: 8 }}>Step {step + 1}/{steps.length}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {steps.map((_, i) => <div key={i} style={{ width: i === step ? 16 : 6, height: 3, borderRadius: 2, background: i < step ? T.status.success : i === step ? T.accent.primary : T.border.subtle, transition: "all 0.2s" }} />)}
            </div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {stepContent[active.id]?.() || null}
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border.subtle}`, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: step === 0 ? "default" : "pointer", border: `1px solid ${T.border.base}`, background: "transparent", color: step === 0 ? T.text.dim : T.text.secondary, opacity: step === 0 ? 0.4 : 1 }}>← Back</button>
            <button onClick={() => step < steps.length - 1 && setStep(s => s + 1)} style={{ padding: "6px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: T.btn.bg, color: T.btn.text }}>
              {step < steps.length - 1 ? <>Confirm → <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 11 }}>{steps[step + 1]?.title}</span></> : "Complete ✓"}
            </button>
          </div>
        </div>
      </div>
      {/* Pipeline preview */}
      {upcoming.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.text.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Coming Up</div>
          {upcoming.map(s => (
            <div key={s.id} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: T.surface.cardAlt, border: `1px solid ${T.border.subtle}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary }}>{s.title}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: s.heroColor, marginBottom: 2 }}>{s.heroValue}</div>
              <div style={{ fontSize: 10, color: T.text.muted, lineHeight: 1.3 }}>{s.preview}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MEMBER PORTAL: PROGRESSIVE DISCLOSURE ────────────────────────────
function MemberWorkspace({ T }) {
  const [wizardStep, setWizardStep] = useState(0);
  const M = MEMBER;
  const wSteps = [
    { id: "info", title: "Your Information", icon: "👤", desc: "Review and confirm your details" },
    { id: "benefit", title: "Your Benefit Estimate", icon: "💰", desc: "See your retirement benefit options" },
    { id: "election", title: "Choose Payment Option", icon: "💳", desc: "Select how you'd like to receive your benefit" },
    { id: "insurance", title: "Health Insurance", icon: "🏥", desc: "Review insurance premium reduction" },
    { id: "review", title: "Review & Submit", icon: "✅", desc: "Confirm your choices" },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Welcome back, Robert</div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginTop: 4 }}>You're on track for retirement. Let's walk through your application together.</div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {wSteps.map((s, i) => (
          <div key={s.id} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= wizardStep ? T.accent.primary : T.border.subtle, transition: "background 0.3s", marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: i === wizardStep ? 700 : 500, color: i <= wizardStep ? T.accent.primary : T.text.muted }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* Active step card — large, friendly */}
      <div style={{ background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`, boxShadow: T.shadowLg, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border.subtle}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{wSteps[wizardStep].icon}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{wSteps[wizardStep].title}</div>
              <div style={{ fontSize: 13, color: T.text.muted }}>{wSteps[wizardStep].desc}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {wizardStep === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
              {[
                ["Name", M.name], ["Date of Birth", "March 8, 1963"], ["Member ID", M.id], ["Department", M.dept],
                ["Hire Date", "June 15, 1997"], ["Benefit Tier", "Tier 1"], ["Years of Service", `${M.service} years`], ["Marital Status", "Married"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: T.text.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1/-1", padding: "12px 16px", background: T.accent.surface, borderRadius: 8, border: `1px solid ${T.accent.light}`, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: T.accent.primary, fontWeight: 600 }}>✓ Everything look correct? Click Continue to see your benefit estimate.</div>
                <div style={{ fontSize: 11, color: T.text.muted, marginTop: 4 }}>If anything needs updating, contact DERP at (303) 839-5419 before submitting your application.</div>
              </div>
            </div>
          )}
          {wizardStep === 1 && (
            <div>
              <div style={{ padding: 20, background: T.accent.surface, borderRadius: 10, border: `1px solid ${T.accent.light}`, textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: T.text.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Your Estimated Monthly Benefit</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: T.accent.primary, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(M.benefit)}</div>
                <div style={{ fontSize: 12, color: T.text.secondary, marginTop: 6 }}>{M.multiplier} × {fmt(M.ams)} × {M.service} years</div>
              </div>
              <div style={{ padding: "12px 16px", background: T.status.successBg, borderRadius: 8, borderLeft: `3px solid ${T.status.success}`, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.status.success }}>No Early Retirement Reduction</div>
                <div style={{ fontSize: 12, color: T.status.success }}>You've met the Rule of 75 (age {M.age} + service {M.service} = {M.ruleSum}). You receive your full benefit.</div>
              </div>
              <div style={{ padding: "12px 16px", background: T.status.warningBg, borderRadius: 8, borderLeft: `3px solid ${T.status.warning}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.status.warning }}>Leave Payout Included</div>
                <div style={{ fontSize: 12, color: T.status.warning }}>Your ${M.leave.toLocaleString()} leave payout increases your monthly benefit by {fmt(M.ams - M.amsWithout)}.</div>
              </div>
            </div>
          )}
          {wizardStep === 2 && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>Choose how you'd like to receive your monthly benefit. This election is <strong>irrevocable</strong> after your first payment.</div>
              {[
                { key: "max", label: "Maximum Benefit", desc: "Highest monthly payment. No survivor benefit.", amt: M.opts.max, surv: null },
                { key: "js100", label: "100% Joint & Survivor", desc: "Elena receives 100% of your benefit after your passing.", amt: M.opts.js100, surv: M.opts.js100 },
                { key: "js75", label: "75% Joint & Survivor", desc: "Elena receives 75% of your benefit after your passing.", amt: M.opts.js75, surv: M.survivorAmt },
                { key: "js50", label: "50% Joint & Survivor", desc: "Elena receives 50% of your benefit after your passing.", amt: M.opts.js50, surv: 2890.61 },
              ].map(o => (
                <div key={o.key} style={{ padding: "16px 18px", marginBottom: 8, borderRadius: 8, cursor: "pointer", border: `2px solid ${M.elected === o.key ? T.accent.primary : T.border.subtle}`, background: M.elected === o.key ? T.accent.surface : T.surface.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>{o.label}</div>
                      <div style={{ fontSize: 12, color: T.text.muted, marginTop: 2 }}>{o.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: M.elected === o.key ? T.accent.primary : T.text.primary }}>{fmt(o.amt)}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
                      {o.surv && <div style={{ fontSize: 11, color: T.text.muted }}>Survivor: {fmt(o.surv)}/mo</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {wizardStep === 3 && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>DERP can reduce your health insurance premiums. This is called the Insurance Premium Reduction (IPR).</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 16, background: T.accent.surface, borderRadius: 8, textAlign: "center", border: `1px solid ${T.accent.light}` }}>
                  <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Before Medicare (Age 65)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.accent.primary, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(M.ipr.pre)}</div>
                  <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{M.service}y × $12.50/year</div>
                </div>
                <div style={{ padding: 16, background: T.surface.cardAlt, borderRadius: 8, textAlign: "center", border: `1px solid ${T.border.subtle}` }}>
                  <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>After Medicare (Age 65+)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.text.primary, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(M.ipr.post)}</div>
                  <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{M.service}y × $6.25/year</div>
                </div>
              </div>
              <div style={{ padding: "12px 16px", background: T.status.infoBg, borderRadius: 8, borderLeft: `3px solid ${T.status.info}` }}>
                <div style={{ fontSize: 12, color: T.status.info }}>To receive the IPR, you must enroll in a DERP group health insurance plan. If you elect insurance, a Health Insurance Election Form will be added to your required documents.</div>
              </div>
            </div>
          )}
          {wizardStep === 4 && (
            <div>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 16 }}>Please review your selections below. After submitting, you'll need to print, sign before a notary, and return the application.</div>
              {[
                ["Retirement Date", "April 1, 2026"], ["Benefit Tier", "Tier 1"], ["Monthly Benefit", fmt(M.benefit)],
                ["Payment Option", "75% Joint & Survivor"], ["Your Payment", fmt(M.opts.js75) + "/mo"], ["Survivor Payment", fmt(M.survivorAmt) + "/mo"],
                ["Beneficiary", "Elena Martinez (Spouse)"], ["IPR (pre-Medicare)", fmt(M.ipr.pre) + "/mo"], ["Death Benefit", fmt(M.deathBenefit)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border.subtle}` }}>
                  <span style={{ fontSize: 13, color: T.text.secondary }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border.subtle}`, display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => wizardStep > 0 && setWizardStep(s => s - 1)} disabled={wizardStep === 0} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${T.border.base}`, background: "transparent", color: wizardStep === 0 ? T.text.dim : T.text.secondary, cursor: wizardStep === 0 ? "default" : "pointer", opacity: wizardStep === 0 ? 0.4 : 1 }}>← Back</button>
          <button onClick={() => wizardStep < wSteps.length - 1 && setWizardStep(s => s + 1)} style={{ padding: "8px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none", background: T.btn.bg, color: T.btn.text, cursor: "pointer" }}>
            {wizardStep < wSteps.length - 1 ? "Continue →" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EMPLOYER PORTAL: TABLE/REPORTING VIEW ────────────────────────────
function EmployerWorkspace({ T }) {
  const rows = [
    { id: "M-100001", name: "Robert Martinez", dept: "Public Works", status: "Retirement Pending", date: "Apr 1, 2026", salary: 9702.83, tier: 1 },
    { id: "M-100002", name: "Jennifer Kim", dept: "Finance", status: "Retirement Pending", date: "May 1, 2026", salary: 7731.50, tier: 2 },
    { id: "M-100045", name: "Lisa Thompson", dept: "Public Works", status: "Active", date: "—", salary: 8544.33, tier: 1 },
    { id: "M-100112", name: "Carlos Rivera", dept: "Public Works", status: "Active", date: "—", salary: 6250.00, tier: 3 },
    { id: "M-100003", name: "David Washington", dept: "Parks & Rec", status: "Retirement Pending", date: "Apr 1, 2026", salary: 7386.82, tier: 3 },
  ];
  const stats = [
    { label: "Active Employees", value: "847", change: "-3 this month" },
    { label: "Pending Retirements", value: "12", change: "+2 this quarter" },
    { label: "Monthly Payroll", value: "$6.2M", change: "Current period" },
    { label: "Avg Service", value: "14.3y", change: "Across active" },
  ];
  return (
    <div style={{ padding: 16 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: "14px 16px", background: T.surface.card, borderRadius: 8, border: `1px solid ${T.border.base}`, boxShadow: T.shadow }}>
            <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text.primary, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>{s.change}</div>
          </div>
        ))}
      </div>
      {/* Employee table */}
      <div style={{ background: T.surface.card, borderRadius: 8, border: `1px solid ${T.border.base}`, boxShadow: T.shadow, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border.subtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Department Roster</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Filter employees…" style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border.base}`, fontSize: 12, color: T.text.primary, background: T.surface.cardAlt, outline: "none", width: 180 }} />
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surface.cardAlt }}>
              {["ID", "Employee", "Dept", "Tier", "Status", "Retirement Date", "Monthly Salary"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: T.text.muted, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", borderBottom: `1px solid ${T.border.subtle}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.border.subtle}` }} onMouseEnter={e => e.currentTarget.style.background = T.accent.surface} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", color: T.text.muted }}>{r.id}</td>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: T.text.primary }}>{r.name}</td>
                <td style={{ padding: "8px 12px", color: T.text.secondary }}>{r.dept}</td>
                <td style={{ padding: "8px 12px" }}><Badge text={`T${r.tier}`} color={r.tier === 1 ? (T.tier?.t1 || T.accent.primary) : r.tier === 2 ? (T.tier?.t2 || T.status.warning) : (T.tier?.t3 || T.status.success)} bg={r.tier === 1 ? (T.tier?.t1bg || T.accent.surface) : r.tier === 2 ? (T.tier?.t2bg || T.status.warningBg) : (T.tier?.t3bg || T.status.successBg)} /></td>
                <td style={{ padding: "8px 12px" }}><Badge text={r.status} color={r.status === "Active" ? T.status.success : T.status.warning} bg={r.status === "Active" ? T.status.successBg : T.status.warningBg} /></td>
                <td style={{ padding: "8px 12px", color: T.text.secondary }}>{r.date}</td>
                <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: T.text.primary }}>{fmt(r.salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── VENDOR PORTAL: ENROLLMENT QUEUE ──────────────────────────────────
function VendorWorkspace({ T }) {
  const queue = [
    { id: "ENR-2026-0041", member: "Robert Martinez", plan: "Kaiser HMO", status: "Pending Verification", date: "Mar 15, 2026", ipr: 359.38 },
    { id: "ENR-2026-0038", member: "David Washington", plan: "Kaiser HMO", status: "Enrolled", date: "Mar 12, 2026", ipr: 169.75 },
    { id: "ENR-2026-0035", member: "Patricia Morales", plan: "Cigna PPO", status: "Pending Docs", date: "Mar 10, 2026", ipr: 212.50 },
    { id: "ENR-2026-0029", member: "James Butler", plan: "Kaiser HMO", status: "Enrolled", date: "Mar 5, 2026", ipr: 293.75 },
  ];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[{ label: "Pending Enrollments", value: "6" }, { label: "Enrolled This Month", value: "23" }, { label: "Avg IPR Benefit", value: "$258.84" }].map(s => (
          <div key={s.label} style={{ padding: "16px", background: T.surface.card, borderRadius: 8, border: `1px solid ${T.border.base}`, textAlign: "center", boxShadow: T.shadow }}>
            <div style={{ fontSize: 10, color: T.text.muted, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text.primary, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.surface.card, borderRadius: 8, border: `1px solid ${T.border.base}`, boxShadow: T.shadow, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border.subtle}` }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Enrollment Queue</span>
        </div>
        {queue.map(q => (
          <div key={q.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border.subtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{q.member}</div>
              <div style={{ fontSize: 11, color: T.text.muted }}>{q.id} · {q.plan} · {q.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: T.text.muted }}>IPR</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: T.accent.primary }}>{fmt(q.ipr)}</div>
              </div>
              <Badge text={q.status} color={q.status === "Enrolled" ? T.status.success : q.status === "Pending Docs" ? T.status.warning : T.accent.primary} bg={q.status === "Enrolled" ? T.status.successBg : q.status === "Pending Docs" ? T.status.warningBg : T.accent.surface} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP SHELL ───────────────────────────────────────────────────
export default function NoUIMultiPortal() {
  const [portalKey, setPortalKey] = useState("staff");
  const [cmdOpen, setCmdOpen] = useState(false);
  const P = PORTALS[portalKey];

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const hasSidebar = P.layout === "sidebar" && P.sidebar;

  const sidebarNav = [
    { icon: "📥", label: "Queue", shortcut: "G Q" },
    { icon: "📋", label: "Cases", shortcut: "G C", active: true },
    { icon: "👤", label: "Members", shortcut: "G M" },
    { icon: "🔢", label: "Calculations", shortcut: "G L" },
    { icon: "📊", label: "Reports", shortcut: "G R" },
    { icon: "📖", label: "Rules", shortcut: "G U" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: P.surface.bg, fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", color: P.text.primary, transition: "background 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet" />

      {/* Command palette (staff/employer only) */}
      {(portalKey === "staff" || portalKey === "employer") && <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} T={P} />}

      {/* ── PORTAL SWITCHER (meta — top bar) ──────────────────── */}
      <div style={{ padding: "6px 16px", display: "flex", justifyContent: "center", alignItems: "center", gap: 4, background: P.surface.cardAlt, borderBottom: `1px solid ${P.border.subtle}` }}>
        <span style={{ fontSize: 10, color: P.text.muted, marginRight: 8, fontWeight: 600 }}>PORTAL:</span>
        {Object.entries(PORTALS).map(([k, v]) => (
          <button key={k} onClick={() => setPortalKey(k)} style={{
            padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer",
            border: portalKey === k ? `1.5px solid ${P.accent.primary}` : `1px solid transparent`,
            background: portalKey === k ? P.accent.surface : "transparent",
            color: portalKey === k ? P.accent.primary : P.text.muted,
          }}>{v.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 32px)" }}>
        {/* ── SIDEBAR (staff/employer) ─────────────────────────── */}
        {hasSidebar && (
          <div style={{ width: 200, background: P.sidebar.bg, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Brand */}
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: P.sidebar.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>N</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: P.sidebar.brand, letterSpacing: -0.3 }}>NoUI</div>
                <div style={{ fontSize: 9, color: P.sidebar.text }}>{P.subtitle}</div>
              </div>
            </div>
            {/* Search trigger */}
            <div onClick={() => setCmdOpen(true)} style={{ margin: "0 10px 12px", padding: "6px 10px", borderRadius: 6, border: `1px solid ${P.sidebar.hover}`, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: P.sidebar.text }}>⌘</span>
              <span style={{ fontSize: 11, color: P.sidebar.text, flex: 1 }}>Search…</span>
              <span style={{ fontSize: 9, color: P.sidebar.text, padding: "1px 4px", borderRadius: 3, background: P.sidebar.hover }}>⌘K</span>
            </div>
            {/* Nav */}
            <div style={{ flex: 1, padding: "0 6px" }}>
              {sidebarNav.map(n => (
                <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 1, cursor: "pointer", background: n.active ? P.sidebar.hover : "transparent" }}>
                  <span style={{ fontSize: 14, width: 20 }}>{n.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: n.active ? 600 : 400, color: n.active ? P.sidebar.active : P.sidebar.text }}>{n.label}</span>
                  <span style={{ fontSize: 9, color: P.sidebar.text, opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{n.shortcut}</span>
                </div>
              ))}
            </div>
            {/* User */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${P.sidebar.hover}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: P.sidebar.hover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: P.sidebar.active }}>{P.user.initials}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: P.sidebar.brand }}>{P.user.name}</div>
                <div style={{ fontSize: 9, color: P.sidebar.text }}>{P.user.role}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* ── TOP NAV (member/vendor) ──────────────────────── */}
          {!hasSidebar && (
            <div style={{ background: P.surface.card, borderBottom: `1px solid ${P.border.base}`, boxShadow: P.shadow }}>
              <div style={{ maxWidth: 900, margin: "0 auto", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {portalKey === "member" ? (
                    <>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: P.accent.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>D</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: P.text.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MyDERP</div>
                        <div style={{ fontSize: 10, color: P.text.muted }}>Powering Your Future, Together</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: P.accent.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>N</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: P.text.primary }}>{P.name}</div>
                        <div style={{ fontSize: 10, color: P.text.muted }}>{P.subtitle}</div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {portalKey === "member" && ["Dashboard", "My Application", "Messages", "Documents"].map((l, i) => (
                    <span key={l} style={{ fontSize: 12, fontWeight: i === 1 ? 700 : 500, color: i === 1 ? P.accent.primary : P.text.secondary, cursor: "pointer", borderBottom: i === 1 ? `2px solid ${P.accent.primary}` : "2px solid transparent", paddingBottom: 2 }}>{l}</span>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 6, background: P.surface.cardAlt }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: P.accent.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: P.accent.primary }}>{P.user.initials}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: P.text.primary }}>{P.user.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MEMBER BANNER (staff only) ────────────────────── */}
          {portalKey === "staff" && (
            <div style={{ padding: "10px 16px", background: P.surface.card, borderBottom: `1px solid ${P.border.base}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: P.tier?.t1bg, border: `2px solid ${P.tier?.t1}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: P.tier?.t1 }}>RM</div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Robert Martinez</span>
                  <span style={{ fontSize: 11, color: P.text.muted, marginLeft: 8 }}>M-100001 · Public Works</span>
                </div>
                <Badge text="Tier 1" color={P.tier?.t1} bg={P.tier?.t1bg} />
                <Badge text="Leave Payout" color={P.status.warning} bg={P.status.warningBg} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <KBD T={P}>⌘K</KBD>
                <span style={{ fontSize: 10, color: P.text.dim }}>Command Palette</span>
              </div>
            </div>
          )}

          {/* ── WORKSPACE CONTENT ─────────────────────────────── */}
          <div style={{ flex: 1 }}>
            {portalKey === "staff" && <StaffWorkspace T={P} />}
            {portalKey === "member" && <MemberWorkspace T={P} />}
            {portalKey === "employer" && <EmployerWorkspace T={P} />}
            {portalKey === "vendor" && <VendorWorkspace T={P} />}
          </div>
        </div>
      </div>
    </div>
  );
}
