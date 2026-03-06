import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   NoUI Platform — Complete User Experience Vision
   Based on: Application Management Services Inventory (30 services)
   Demonstrates: 9 roles, Guided→Assisted→Expert, 4-layer architecture
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Design Tokens ───────────────────────────────────────────────────
const C = {
  pri: "#00796b", priH: "#00695c", priL: "#b2dfdb", priS: "#e0f2f1", priOn: "#fff",
  acc: "#e65100", accM: "#ff8f00", accL: "#fff3e0",
  ok: "#2e7d32", okL: "#e8f5e9", err: "#c62828", errL: "#ffebee",
  inf: "#0369a1", infL: "#e0f2fe", warn: "#ff8f00", warnL: "#fff8e1",
  purple: "#7b1fa2", purpleL: "#f3e5f5",
  bg: "#f6f9f9", srf: "#fff", srfA: "#eef5f5",
  tx: "#1a2e2e", txS: "#4a6767", txT: "#7a9696", txD: "#a8c0c0",
  brd: "#d0dede", brdS: "#e2ecec",
  sbBg: "#00363a", sbTx: "#a0c4c4", sbAc: "#4db6ac", sbHv: "#004d40",
};

// ─── SVG Icons ───────────────────────────────────────────────────────
const I = ({ n, s = 15, c = "currentColor", ...p }) => {
  const st = { width: s, height: s, fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 };
  const d = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    shield: <><path d="M12 2l7 4v5c0 5.25-3.5 10-7 11.5C8.5 21 5 16.25 5 11V6z"/><path d="M9 12l2 2 4-4"/></>,
    activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    bar: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    chevR: <><polyline points="9 18 15 12 9 6"/></>,
    chevD: <><polyline points="6 9 12 15 18 9"/></>,
    arrowR: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>,
    box: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    gitBranch: <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></>,
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
    play: <><polygon points="5 3 19 12 5 21"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
  };
  return <svg viewBox="0 0 24 24" style={st} {...p}>{d[n]}</svg>;
};

// ─── Shared Components ───────────────────────────────────────────────
const Pill = ({ children, bg, color, ...p }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: bg, color, letterSpacing: "0.02em", whiteSpace: "nowrap", ...p.style }}>{children}</span>
);

const Card = ({ children, style, onClick, ...p }) => (
  <div onClick={onClick} style={{ background: C.srf, borderRadius: 10, border: `1px solid ${C.brd}`, overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s, border-color 0.15s", ...style }} {...p}>{children}</div>
);

const SH = ({ icon, title, sub, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.brdS}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <I n={icon} s={14} c={C.pri} /><div><div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{title}</div>{sub && <div style={{ fontSize: 10, color: C.txT, marginTop: 1 }}>{sub}</div>}</div>
    </div>
    {right}
  </div>
);

const Metric = ({ icon, label, value, color, sub, small }) => (
  <div style={{ padding: small ? "10px 12px" : "14px 16px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.srf, flex: 1, minWidth: small ? 100 : 130 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <div style={{ width: small ? 22 : 26, height: small ? 22 : 26, borderRadius: 6, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <I n={icon} s={small ? 11 : 13} c={color} />
      </div>
      <span style={{ fontSize: 10, color: C.txS, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: small ? 18 : 22, fontWeight: 700, color: C.tx, letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 9, color: C.txT, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ─── Role Definitions ────────────────────────────────────────────────
const ROLES = [
  { key: "analyst", label: "Benefits Analyst", icon: "inbox", entry: "Work Queue", nav: "Task-focused", scope: "Assigned cases", color: C.pri },
  { key: "csr", label: "CSR", icon: "phone", entry: "Member Lookup", nav: "Broad, rapid", scope: "All members", color: C.inf },
  { key: "counselor", label: "Counselor", icon: "compass", entry: "Appointment", nav: "Scenario-focused", scope: "Member + projections", color: "#6a1b9a" },
  { key: "supervisor", label: "Supervisor", icon: "users", entry: "Team Dashboard", nav: "Oversight", scope: "Team aggregate", color: C.acc },
  { key: "qa", label: "QA / Compliance", icon: "shield", entry: "Audit Selector", nav: "Cross-case", scope: "Sample sets", color: C.err },
  { key: "employer", label: "Employer Services", icon: "briefcase", entry: "Employer Lookup", nav: "Batch", scope: "Employer + members", color: "#37474f" },
  { key: "finance", label: "Finance", icon: "dollar", entry: "Payment Dashboard", nav: "Aggregate", scope: "Financial data", color: "#1565c0" },
  { key: "executive", label: "Executive", icon: "bar", entry: "Exec Dashboard", nav: "Top-down", scope: "KPIs only", color: "#00363a" },
  { key: "member", label: "Member Portal", icon: "globe", entry: "Self-Service", nav: "Guided journey", scope: "Own data only", color: "#4db6ac" },
];

// ─── Service Categories ──────────────────────────────────────────────
const SERVICES = [
  { cat: "Workflow & Process", services: [
    { name: "Process Orchestrator", rec: "BUILD", poc: true, desc: "Stage-based lifecycle with entry/exit criteria" },
    { name: "Work Queue Management", rec: "BUILD", poc: true, desc: "Priority-driven case assignment and tracking" },
    { name: "Task Scheduling & SLA", rec: "BUILD", poc: false, desc: "Deadline tracking, 15th-of-month cutoffs" },
    { name: "Business Rules Engine", rec: "BUILD", poc: true, desc: "Deterministic calculations, all tiers" },
  ]},
  { cat: "Case Management", services: [
    { name: "Case Lifecycle Tracking", rec: "BUILD", poc: true, desc: "State-driven workspace composition" },
    { name: "Multi-party Management", rec: "BUILD", poc: false, desc: "DRO, survivor, multi-party relationships" },
    { name: "Case Notes & Annotations", rec: "BUILD", poc: false, desc: "Integrated notes with audit trail" },
  ]},
  { cat: "Document Management", services: [
    { name: "Document Intake & Imaging", rec: "HYBRID", poc: false, desc: "NoUI logic + agency DMS storage" },
    { name: "Document Generation", rec: "HYBRID", poc: false, desc: "NoUI triggers + template engine" },
    { name: "Document Retention", rec: "BUY", poc: false, desc: "Agency-managed retention tools" },
  ]},
  { cat: "Communication", services: [
    { name: "Member Messaging", rec: "BUILD", poc: "proto", desc: "Application status, secure messages" },
    { name: "Notification Engine", rec: "BUILD", poc: false, desc: "Event-driven email/SMS delivery" },
    { name: "Call Logging", rec: "HYBRID", poc: false, desc: "CTI integration or manual entry" },
  ]},
  { cat: "Reporting & Analytics", services: [
    { name: "Operational Reporting", rec: "BUILD", poc: false, desc: "Real-time processing metrics" },
    { name: "Regulatory & Board Reporting", rec: "HYBRID", poc: false, desc: "NoUI data + BI presentation" },
    { name: "Ad-hoc Analytics", rec: "HYBRID", poc: false, desc: "API export + BI tool integration" },
  ]},
  { cat: "Audit & Compliance", services: [
    { name: "Audit Trail", rec: "BUILD", poc: true, desc: "Append-only, cryptographic integrity" },
    { name: "Calculation Verification", rec: "BUILD", poc: true, desc: "Independent re-calculation, sampling" },
    { name: "Compliance Monitoring", rec: "BUILD", poc: false, desc: "Rule change tracking, drift detection" },
    { name: "Quality Checkpoints", rec: "BUILD", poc: false, desc: "Dual-verification, approval routing" },
  ]},
  { cat: "Identity & Access", services: [
    { name: "Authentication", rec: "BUY", poc: false, desc: "Agency IdP via OIDC/SAML" },
    { name: "Authorization (RBAC)", rec: "BUILD", poc: "proto", desc: "Workspace composition IS authorization" },
    { name: "User Provisioning", rec: "BUY", poc: false, desc: "Agency directory sync" },
  ]},
  { cat: "Data Management", services: [
    { name: "Data Connector", rec: "BUILD", poc: true, desc: "On-premises legacy abstraction" },
    { name: "Data Quality Engine", rec: "BUILD", poc: true, desc: "Structural, consistency, pattern checks" },
    { name: "Progressive Migration", rec: "BUILD", poc: false, desc: "AI-supervised schema modernization" },
    { name: "External Integration", rec: "HYBRID", poc: false, desc: "Adapters for pension interfaces" },
  ]},
  { cat: "Digital Adoption", services: [
    { name: "Guided Mode (DAP)", rec: "BUILD", poc: true, desc: "Native training — not a bolt-on overlay" },
    { name: "Contextual Help", rec: "BUILD", poc: true, desc: "Knowledge Base-powered rule citations" },
    { name: "Proficiency Tracking", rec: "BUILD", poc: false, desc: "Graduation signals, supervisor controls" },
  ]},
  { cat: "Infrastructure", services: [
    { name: "Health Monitoring", rec: "HYBRID", poc: false, desc: "NoUI metrics + Prometheus/Grafana" },
    { name: "Configuration Management", rec: "BUILD", poc: false, desc: "Multi-tenant, feature flags" },
    { name: "Backup & DR", rec: "BUY", poc: false, desc: "Cloud provider capabilities" },
  ]},
];

// ─── Demo Case Data ──────────────────────────────────────────────────
const QUEUE_ITEMS = [
  { id: "RET-2026-0147", member: "Robert Martinez", tier: 1, type: "Service Retirement", stage: "Benefit Calculation", priority: "Standard", daysOpen: 3, sla: "On Track", dueDate: "Mar 15", hasFlag: false, rule75: true },
  { id: "RET-2026-0152", member: "Jennifer Kim", tier: 2, type: "Service Retirement", stage: "Eligibility Review", priority: "Attention", daysOpen: 5, sla: "At Risk", dueDate: "Apr 15", hasFlag: true, rule75: false },
  { id: "RET-2026-0159", member: "David Washington", tier: 3, type: "Service Retirement", stage: "Document Verification", priority: "Standard", daysOpen: 2, sla: "On Track", dueDate: "Mar 15", hasFlag: false, rule75: false },
  { id: "DRO-2026-0031", member: "Robert Martinez (DRO)", tier: 1, type: "DRO Processing", stage: "Marital Share Calc", priority: "High", daysOpen: 8, sla: "Urgent", dueDate: "Mar 10", hasFlag: true, rule75: true },
];

const TEAM_MEMBERS = [
  { name: "Sarah Chen", cases: 12, mode: "Expert", avgDays: 2.8, efficiency: 96 },
  { name: "Marcus Rivera", cases: 9, mode: "Assisted", avgDays: 3.5, efficiency: 88 },
  { name: "Lisa Park", cases: 14, mode: "Expert", avgDays: 2.1, efficiency: 98 },
  { name: "James Foster", cases: 6, mode: "Guided", avgDays: 5.2, efficiency: 72 },
];

// ═══════════════════════════════════════════════════════════════════════
// WORKSPACE VIEWS
// ═══════════════════════════════════════════════════════════════════════

// ─── Benefits Analyst: Guided Task Workspace ─────────────────────────
const AnalystView = ({ profMode }) => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [helpExpanded, setHelpExpanded] = useState(profMode === "Guided");
  const stages = ["Application Review", "Eligibility Review", "Benefit Calculation", "Payment Options", "Approval & Finalization"];
  const currentStage = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Proficiency Mode Banner */}
      {profMode === "Guided" && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: `${C.pri}08`, border: `1px solid ${C.pri}20`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.priS, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I n="compass" s={14} c={C.pri} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.pri }}>Guided Mode</span>
            <span style={{ fontSize: 11, color: C.txS, marginLeft: 8 }}>Follow the stages in order. Contextual help explains each step.</span>
          </div>
          <Pill bg={C.priS} color={C.pri}>Stage 3 of 5</Pill>
        </div>
      )}

      {/* Work Queue */}
      {!selectedCase ? (
        <Card>
          <SH icon="inbox" title="My Work Queue" sub={`${QUEUE_ITEMS.length} active cases`} right={
            <div style={{ display: "flex", gap: 6 }}>
              <Pill bg={C.okL} color={C.ok}>3 On Track</Pill>
              <Pill bg={C.errL} color={C.err}>1 Urgent</Pill>
            </div>
          } />
          <div>
            {QUEUE_ITEMS.map((item, i) => (
              <div key={item.id} onClick={() => setSelectedCase(item)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderBottom: i < QUEUE_ITEMS.length - 1 ? `1px solid ${C.brdS}` : "none",
                cursor: "pointer", transition: "background 0.1s",
              }} onMouseEnter={e => e.currentTarget.style.background = C.srfA} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: item.sla === "Urgent" ? C.err : item.sla === "At Risk" ? C.acc : C.ok }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{item.member}</span>
                    <Pill bg={`${[C.pri, C.inf, C.acc][item.tier - 1]}15`} color={[C.pri, C.inf, C.acc][item.tier - 1]}>Tier {item.tier}</Pill>
                    {item.hasFlag && <I n="alert" s={12} c={C.acc} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.txS }}>{item.type} · {item.stage}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: item.sla === "Urgent" ? C.err : C.txS }}>{item.sla}</div>
                  <div style={{ fontSize: 10, color: C.txT }}>Due {item.dueDate} · Day {item.daysOpen}</div>
                </div>
                <I n="chevR" s={14} c={C.txT} />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Case Workspace */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => setSelectedCase(null)} style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.brd}`, background: C.srf, color: C.txS, fontSize: 11, cursor: "pointer" }}>← Back to Queue</button>

          {/* Member Banner */}
          <Card style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.priS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.pri }}>
                  {selectedCase.member.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.tx }}>{selectedCase.member}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                    <Pill bg={`${[C.pri, C.inf, C.acc][selectedCase.tier - 1]}15`} color={[C.pri, C.inf, C.acc][selectedCase.tier - 1]}>TIER {selectedCase.tier}</Pill>
                    <Pill bg={C.okL} color={C.ok}>{selectedCase.rule75 ? "Rule of 75 ✓" : "Early Retirement"}</Pill>
                    <Pill bg={C.infL} color={C.inf}>{selectedCase.id}</Pill>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Pill bg={selectedCase.sla === "Urgent" ? C.errL : C.okL} color={selectedCase.sla === "Urgent" ? C.err : C.ok}>{selectedCase.sla}</Pill>
              </div>
            </div>
          </Card>

          {/* Process Stage Navigator */}
          <Card>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {stages.map((stage, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: i < currentStage ? C.ok : i === currentStage ? C.pri : C.srfA,
                        border: `2px solid ${i < currentStage ? C.ok : i === currentStage ? C.pri : C.brd}`,
                      }}>
                        {i < currentStage ? <I n="check" s={12} c="#fff" /> : <span style={{ fontSize: 10, fontWeight: 700, color: i === currentStage ? "#fff" : C.txT }}>{i + 1}</span>}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: i === currentStage ? 700 : 500, color: i === currentStage ? C.pri : C.txT, textAlign: "center", maxWidth: 80 }}>{stage}</span>
                    </div>
                    {i < stages.length - 1 && <div style={{ height: 2, flex: 0.5, background: i < currentStage ? C.ok : C.brdS, marginBottom: 18 }} />}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Workspace Panels */}
          <div style={{ display: "grid", gridTemplateColumns: helpExpanded ? "1fr 300px" : "1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Benefit Calculation Panel */}
              <Card>
                <SH icon="activity" title="Benefit Calculation" sub="Deterministic · All inputs shown" right={<Pill bg={C.priS} color={C.pri}>Show Derivation</Pill>} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "AMS (36 mo)", value: "$8,847.22", note: "Highest consecutive" },
                      { label: "Service Credit", value: "28y 9m", note: "28.75 years" },
                      { label: "Multiplier", value: "2.0%", note: "Tier 1 rate" },
                    ].map((f, i) => (
                      <div key={i} style={{ padding: 10, borderRadius: 6, background: C.srfA }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: C.txT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.tx, marginTop: 2 }}>{f.value}</div>
                        <div style={{ fontSize: 9, color: C.txT }}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  {/* Formula */}
                  <div style={{ padding: 12, borderRadius: 8, background: `${C.pri}06`, border: `1px solid ${C.pri}15` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.pri, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Formula — RMC §18-401(a)</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: C.tx }}>2.0% × $8,847.22 × 28.75 = <strong style={{ fontSize: 16, color: C.pri }}>$5,087.15</strong>/month</div>
                  </div>
                </div>
              </Card>

              {/* Payment Options */}
              <Card>
                <SH icon="dollar" title="Payment Options" sub="Spousal consent required — Married" />
                <div style={{ padding: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr style={{ borderBottom: `1px solid ${C.brd}` }}>
                      {["Option", "Monthly", "Survivor", "Reduction"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.txT, textTransform: "uppercase" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[
                        { opt: "Maximum (Single Life)", monthly: "$5,087.15", survivor: "None", reduction: "—" },
                        { opt: "100% J&S", monthly: "$4,374.95", survivor: "$4,374.95", reduction: "14.0%" },
                        { opt: "75% J&S ★", monthly: "$4,578.44", survivor: "$3,433.83", reduction: "10.0%", selected: true },
                        { opt: "50% J&S", monthly: "$4,781.92", survivor: "$2,390.96", reduction: "6.0%" },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.brdS}`, background: row.selected ? C.priS : "transparent" }}>
                          <td style={{ padding: "8px", fontWeight: row.selected ? 600 : 400, color: C.tx }}>{row.opt}</td>
                          <td style={{ padding: "8px", fontWeight: 600, color: row.selected ? C.pri : C.tx }}>{row.monthly}</td>
                          <td style={{ padding: "8px", color: C.txS }}>{row.survivor}</td>
                          <td style={{ padding: "8px", color: C.txS }}>{row.reduction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Contextual Help Panel (Guided/Assisted mode) */}
            {helpExpanded && (
              <Card style={{ alignSelf: "flex-start", position: "sticky", top: 0 }}>
                <SH icon="book" title={profMode === "Guided" ? "Guided Help" : "Quick Reference"} right={
                  <button onClick={() => setHelpExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <I n="x" s={14} c={C.txT} />
                  </button>
                } />
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 8 }}>Stage 3: Benefit Calculation</div>
                  <div style={{ fontSize: 11, color: C.txS, lineHeight: 1.6, marginBottom: 12 }}>
                    The system has automatically calculated the benefit using the member's tier-specific formula. Your job is to verify the inputs are correct.
                  </div>
                  <div style={{ padding: 10, borderRadius: 6, background: C.priS, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.pri, marginBottom: 4 }}>✓ What to check:</div>
                    <div style={{ fontSize: 11, color: C.tx, lineHeight: 1.5 }}>
                      AMS uses the highest 36 consecutive months (Tier 1). Verify the salary records are complete and the window is correct.
                    </div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 6, background: C.infL, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.inf, marginBottom: 4 }}>📖 Rule Reference</div>
                    <div style={{ fontSize: 11, color: C.tx }}>RMC §18-401(a) — Benefit formula</div>
                    <div style={{ fontSize: 11, color: C.tx }}>RMC §18-401(d) — AMS definition</div>
                  </div>
                  {profMode === "Guided" && (
                    <div style={{ padding: 10, borderRadius: 6, background: C.accL }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.acc, marginBottom: 4 }}>⚡ Next Action</div>
                      <div style={{ fontSize: 11, color: C.tx }}>Review the salary table, confirm AMS window, then click "Verify & Continue" to advance to Payment Options.</div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CSR: Member Context Hub ─────────────────────────────────────────
const CSRView = () => {
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const members = [
    { id: "M-4721", name: "Robert Martinez", tier: 1, status: "Active", dept: "Public Works", alert: "Retirement app in progress" },
    { id: "M-8293", name: "Jennifer Kim", tier: 2, status: "Active", dept: "Parks & Recreation", alert: "Approaching Rule of 75" },
    { id: "M-6102", name: "David Washington", tier: 3, status: "Active", dept: "Finance", alert: null },
  ];
  const filtered = query.length > 0 ? members.filter(m => m.name.toLowerCase().includes(query.toLowerCase())) : [];

  const cards = selectedMember ? [
    { icon: "inbox", title: "Open Tasks", content: selectedMember.alert || "No open tasks", highlight: !!selectedMember.alert },
    { icon: "clock", title: "Recent Activity", content: "Salary update posted Feb 1, 2026" },
    { icon: "activity", title: "Benefit Estimate", content: selectedMember.tier === 1 ? "$5,087/mo (Rule of 75)" : "$1,633/mo (early)" },
    { icon: "award", title: "Service Credit", content: selectedMember.tier === 1 ? "28y 9m earned" : "18y 2m earned + 3y purchased" },
    { icon: "dollar", title: "Contributions", content: "$142,847.33 total contributions" },
    { icon: "users", title: "Beneficiary Info", content: selectedMember.tier === 1 ? "Elena Martinez (spouse)" : "No beneficiary on file ⚠" },
    { icon: "file", title: "Documents", content: "3 documents on file" },
    { icon: "mail", title: "Contact Info", content: "303-555-0147 · robert.m@email.com" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Search Bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: C.srfA, border: `1px solid ${C.brd}` }}>
          <I n="search" s={16} c={C.txT} />
          <input value={query} onChange={e => { setQuery(e.target.value); setSelectedMember(null); }} placeholder="Search by name, member ID, or last 4 SSN..."
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 14, color: C.tx, fontFamily: "inherit" }} />
          {query && <button onClick={() => { setQuery(""); setSelectedMember(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><I n="x" s={14} c={C.txT} /></button>}
        </div>
        {/* Search Results Dropdown */}
        {filtered.length > 0 && !selectedMember && (
          <div style={{ marginTop: 8, borderRadius: 6, border: `1px solid ${C.brd}`, overflow: "hidden" }}>
            {filtered.map((m, i) => (
              <div key={m.id} onClick={() => { setSelectedMember(m); setQuery(m.name); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer",
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.brdS}` : "none",
                transition: "background 0.1s",
              }} onMouseEnter={e => e.currentTarget.style.background = C.srfA} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.priS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.pri }}>
                  {m.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.txT }}>{m.id} · {m.dept} · {m.status}</div>
                </div>
                <Pill bg={`${[C.pri, C.inf, C.acc][m.tier - 1]}15`} color={[C.pri, C.inf, C.acc][m.tier - 1]}>Tier {m.tier}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Member Context Hub */}
      {selectedMember && (
        <>
          {/* Member Banner + Alert */}
          <Card style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.priS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.pri }}>
                {selectedMember.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.tx }}>{selectedMember.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <Pill bg={`${[C.pri, C.inf, C.acc][selectedMember.tier - 1]}15`} color={[C.pri, C.inf, C.acc][selectedMember.tier - 1]}>TIER {selectedMember.tier}</Pill>
                  <Pill bg={C.okL} color={C.ok}>{selectedMember.status}</Pill>
                  <span style={{ fontSize: 11, color: C.txS }}>{selectedMember.dept} · {selectedMember.id}</span>
                </div>
              </div>
              <button style={{ padding: "6px 14px", borderRadius: 6, background: C.pri, color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <I n="phone" s={12} c="#fff" /> Log Call
              </button>
            </div>
            {selectedMember.alert && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: C.accL, display: "flex", alignItems: "center", gap: 8 }}>
                <I n="alert" s={13} c={C.acc} />
                <span style={{ fontSize: 11, fontWeight: 500, color: C.acc }}>{selectedMember.alert}</span>
              </div>
            )}
          </Card>

          {/* Navigation Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {cards.map((card, i) => (
              <Card key={i} onClick={() => {}} style={{ cursor: "pointer", border: card.highlight ? `1px solid ${C.acc}40` : `1px solid ${C.brd}` }}>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: card.highlight ? C.accL : C.priS, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <I n={card.icon} s={13} c={card.highlight ? C.acc : C.pri} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{card.title}</span>
                    <I n="chevR" s={12} c={C.txT} style={{ marginLeft: "auto" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.txS, paddingLeft: 34 }}>{card.content}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!selectedMember && !query && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <I n="search" s={32} c={C.txD} />
          <div style={{ fontSize: 14, color: C.txS, marginTop: 12 }}>Search for a member to view their context hub</div>
          <div style={{ fontSize: 11, color: C.txT, marginTop: 4 }}>Search by name, member ID, or last 4 digits of SSN</div>
        </div>
      )}
    </div>
  );
};

// ─── Supervisor: Team Dashboard ──────────────────────────────────────
const SupervisorView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Metric icon="inbox" label="Active Cases" value="41" color={C.pri} sub="Across 4 analysts" />
      <Metric icon="clock" label="Avg Processing" value="3.2d" color={C.inf} sub="Target: 5 days" />
      <Metric icon="alert" label="At Risk" value="3" color={C.acc} sub="Approaching SLA" />
      <Metric icon="check" label="Completed (30d)" value="127" color={C.ok} sub="98.4% accuracy" />
      <Metric icon="shield" label="QA Findings" value="2" color={C.err} sub="Pending resolution" />
    </div>

    {/* Team Performance + Proficiency */}
    <Card>
      <SH icon="users" title="Team Performance & Proficiency" sub="Guided → Assisted → Expert progression" />
      <div style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `1px solid ${C.brd}` }}>
            {["Analyst", "Cases", "Mode", "Avg Days", "Efficiency", "Proficiency Signal", "Actions"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.txT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {TEAM_MEMBERS.map((tm, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.brdS}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 500, color: C.tx }}>{tm.name}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{tm.cases}</td>
                <td style={{ padding: "10px 12px" }}>
                  <Pill bg={tm.mode === "Expert" ? C.okL : tm.mode === "Assisted" ? C.infL : C.priS}
                    color={tm.mode === "Expert" ? C.ok : tm.mode === "Assisted" ? C.inf : C.pri}>
                    {tm.mode}
                  </Pill>
                </td>
                <td style={{ padding: "10px 12px", color: tm.avgDays > 4 ? C.acc : C.txS }}>{tm.avgDays}d</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 60, height: 6, borderRadius: 3, background: C.srfA, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${tm.efficiency}%`, borderRadius: 3, background: tm.efficiency > 90 ? C.ok : tm.efficiency > 80 ? C.inf : C.acc }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.tx }}>{tm.efficiency}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 10, color: C.txS }}>
                  {tm.mode === "Guided" && tm.efficiency > 70 ? (
                    <span style={{ color: C.pri, fontWeight: 600 }}>↑ Ready for Assisted</span>
                  ) : tm.mode === "Assisted" && tm.efficiency > 90 ? (
                    <span style={{ color: C.ok, fontWeight: 600 }}>↑ Near Expert level</span>
                  ) : (
                    <span>Stable</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.brd}`, background: C.srf, fontSize: 10, color: C.txS, cursor: "pointer" }}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Queue Overview + Aging */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Card>
        <SH icon="bar" title="Caseload by Stage" />
        <div style={{ padding: 14 }}>
          {stages_data.map(s => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 120, fontSize: 11, color: C.txS }}>{s.name}</span>
              <div style={{ flex: 1, height: 16, background: C.srfA, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.count / 15) * 100}%`, borderRadius: 4, background: `${C.pri}50` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.tx, width: 20, textAlign: "right" }}>{s.count}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SH icon="clock" title="Approval Queue" sub="Cases awaiting your review" />
        <div style={{ padding: 14 }}>
          {[
            { case: "RET-2026-0139", member: "Thomas Clark", action: "Final calculation approval", days: 1 },
            { case: "RET-2026-0141", member: "Maria Gonzalez", action: "High-value review ($6,200/mo)", days: 0 },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 1 ? `1px solid ${C.brdS}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.tx }}>{item.member}</div>
                <div style={{ fontSize: 10, color: C.txT }}>{item.action}</div>
              </div>
              <button style={{ padding: "4px 10px", borderRadius: 5, background: C.pri, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Review</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const stages_data = [
  { name: "Application Review", count: 8 },
  { name: "Eligibility Review", count: 12 },
  { name: "Benefit Calculation", count: 9 },
  { name: "Payment Options", count: 7 },
  { name: "Approval", count: 5 },
];

// ─── Member Portal: Self-Service ─────────────────────────────────────
const MemberView = () => {
  const [appStep, setAppStep] = useState(3);
  const steps = ["Personal Info", "Employment Verification", "Retirement Date", "Payment Election", "Review & Submit"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720, margin: "0 auto" }}>
      {/* Welcome */}
      <Card style={{ padding: "20px 24px", background: `linear-gradient(135deg, ${C.pri}, ${C.priH})`, border: "none", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Robert Martinez</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill bg="rgba(255,255,255,0.2)" color="#fff">Tier 1</Pill>
          <Pill bg="rgba(255,255,255,0.2)" color="#fff">28y 9m service</Pill>
          <Pill bg="rgba(255,255,255,0.2)" color="#fff">Member since 1997</Pill>
        </div>
      </Card>

      {/* Application Progress */}
      <Card>
        <SH icon="file" title="Retirement Application" sub="Started Feb 15, 2026" right={<Pill bg={C.accL} color={C.acc}>In Progress</Pill>} />
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: i < appStep ? C.ok : i === appStep ? C.pri : C.srfA,
                    border: `2px solid ${i < appStep ? C.ok : i === appStep ? C.pri : C.brd}`,
                    fontSize: 10, fontWeight: 700, color: i <= appStep ? "#fff" : C.txT,
                  }}>
                    {i < appStep ? <I n="check" s={10} c="#fff" /> : i + 1}
                  </div>
                  <span style={{ fontSize: 8, fontWeight: i === appStep ? 700 : 400, color: i === appStep ? C.pri : C.txT, textAlign: "center", maxWidth: 65 }}>{step}</span>
                </div>
                {i < steps.length - 1 && <div style={{ height: 2, flex: 0.5, background: i < appStep ? C.ok : C.brdS, marginBottom: 14 }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: 14, borderRadius: 8, background: C.priS }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.pri, marginBottom: 4 }}>Current Step: Payment Election</div>
            <div style={{ fontSize: 11, color: C.txS, lineHeight: 1.5 }}>Choose your monthly benefit payment option. If you're married, your spouse must be your beneficiary for at least 50% Joint & Survivor unless they consent to a different option.</div>
            <button style={{ marginTop: 10, padding: "8px 20px", borderRadius: 6, background: C.pri, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Continue Application →</button>
          </div>
        </div>
      </Card>

      {/* Quick Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <I n="activity" s={14} c={C.pri} /><span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>Estimated Benefit</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.pri }}>$4,578/mo</div>
          <div style={{ fontSize: 10, color: C.txT }}>75% J&S · No reduction (Rule of 75)</div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <I n="bell" s={14} c={C.inf} /><span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>Messages</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>1 new message</div>
          <div style={{ fontSize: 10, color: C.txT, marginTop: 4 }}>"Your application has been received and is being reviewed."</div>
        </Card>
      </div>
    </div>
  );
};

// ─── Platform Services Map ───────────────────────────────────────────
const ServicesMapView = () => {
  const [expanded, setExpanded] = useState(null);
  const recColor = { BUILD: C.ok, HYBRID: C.inf, BUY: C.txT };
  const totals = { BUILD: 0, HYBRID: 0, BUY: 0 };
  SERVICES.forEach(cat => cat.services.forEach(s => totals[s.rec]++));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: 10 }}>
        <Metric icon="box" label="Total Services" value={Object.values(totals).reduce((a,b) => a+b, 0)} color={C.pri} sub="Across 10 categories" />
        <Metric icon="check" label="BUILD" value={totals.BUILD} color={C.ok} sub="Native to platform" />
        <Metric icon="layers" label="HYBRID" value={totals.HYBRID} color={C.inf} sub="NoUI logic + 3rd party" />
        <Metric icon="globe" label="BUY" value={totals.BUY} color={C.txT} sub="Third-party tools" />
      </div>

      {/* Four-Layer Architecture */}
      <Card>
        <SH icon="layers" title="Four-Layer Architecture" sub="Services span all layers — not a new layer" />
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { layer: "L1: Data Connector", color: "#37474f", services: ["Data Quality", "Legacy Adapter", "Backup/DR"] },
            { layer: "L2: Business Intelligence", color: C.pri, services: ["Rules Engine", "Process Orchestrator", "Knowledge Base", "Compliance"] },
            { layer: "L3: Relevance Engine", color: C.acc, services: ["Queue Priority", "Predictive Routing", "Proficiency Tracking"] },
            { layer: "L4: Dynamic Workspace", color: "#6a1b9a", services: ["Guided/Expert Mode", "Notifications", "Document UI", "Case Notes"] },
          ].map((l, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, background: `${l.color}08`, border: `1px solid ${l.color}20` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: l.color, marginBottom: 8 }}>{l.layer}</div>
              {l.services.map((s, j) => (
                <div key={j} style={{ fontSize: 10, color: C.txS, padding: "2px 0" }}>• {s}</div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Service Inventory */}
      {SERVICES.map((cat, ci) => (
        <Card key={ci}>
          <div onClick={() => setExpanded(expanded === ci ? null : ci)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", cursor: "pointer",
            background: expanded === ci ? C.srfA : C.srf,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{cat.cat}</span>
              <span style={{ fontSize: 10, color: C.txT }}>({cat.services.length} services)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {["BUILD", "HYBRID", "BUY"].map(r => {
                const c = cat.services.filter(s => s.rec === r).length;
                return c > 0 ? <Pill key={r} bg={`${recColor[r]}15`} color={recColor[r]}>{c} {r}</Pill> : null;
              })}
              <I n={expanded === ci ? "chevD" : "chevR"} s={14} c={C.txT} />
            </div>
          </div>
          {expanded === ci && (
            <div style={{ padding: 0 }}>
              {cat.services.map((s, si) => (
                <div key={si} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: `1px solid ${C.brdS}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: recColor[s.rec] }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.tx }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.txT }}>{s.desc}</div>
                  </div>
                  <Pill bg={`${recColor[s.rec]}15`} color={recColor[s.rec]}>{s.rec}</Pill>
                  <Pill bg={s.poc === true ? C.okL : s.poc === "proto" ? C.infL : C.srfA}
                    color={s.poc === true ? C.ok : s.poc === "proto" ? C.inf : C.txT}>
                    {s.poc === true ? "IN POC" : s.poc === "proto" ? "PROTOTYPE" : "DEFERRED"}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// ─── Executive Dashboard ─────────────────────────────────────────────
const ExecutiveView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Metric icon="inbox" label="Cases This Month" value="127" color={C.pri} sub="+12% vs last month" />
      <Metric icon="check" label="On-Time Rate" value="96.8%" color={C.ok} sub="Target: 95%" />
      <Metric icon="activity" label="Avg Processing" value="3.2d" color={C.inf} sub="Best: 2.1d (Lisa P.)" />
      <Metric icon="shield" label="Accuracy Rate" value="99.97%" color={C.ok} sub="1 variance in 312 calcs" />
      <Metric icon="database" label="Data Quality" value="4 open" color={C.acc} sub="2 critical this month" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
      <Card>
        <SH icon="bar" title="Processing Volume — 6 Month Trend" />
        <div style={{ padding: 16, display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
          {[{ m: "Sep", v: 98 }, { m: "Oct", v: 112 }, { m: "Nov", v: 105 }, { m: "Dec", v: 89 }, { m: "Jan", v: 118 }, { m: "Feb", v: 127 }].map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.tx }}>{d.v}</span>
              <div style={{ width: "100%", height: `${(d.v / 130) * 120}px`, borderRadius: "4px 4px 0 0", background: i === 5 ? C.pri : `${C.pri}40` }} />
              <span style={{ fontSize: 9, color: C.txT }}>{d.m}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SH icon="shield" title="System Health" />
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: "Data Connector", status: "Healthy", color: C.ok },
            { name: "Rules Engine", status: "Healthy", color: C.ok },
            { name: "Composition Engine", status: "Healthy", color: C.ok },
            { name: "AI Services", status: "Healthy", color: C.ok },
            { name: "Data Quality Engine", status: "2 findings", color: C.acc },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, animation: s.color === C.ok ? "none" : "pulse 2s infinite" }} />
              <span style={{ flex: 1, fontSize: 11, color: C.txS }}>{s.name}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: s.color }}>{s.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP SHELL
// ═══════════════════════════════════════════════════════════════════════
export default function NoUIPlatformVision() {
  const [activeRole, setActiveRole] = useState("analyst");
  const [profMode, setProfMode] = useState("Guided");
  const [showServices, setShowServices] = useState(false);

  const role = ROLES.find(r => r.key === activeRole);

  const renderView = () => {
    if (showServices) return <ServicesMapView />;
    switch (activeRole) {
      case "analyst": return <AnalystView profMode={profMode} />;
      case "csr": return <CSRView />;
      case "supervisor": return <SupervisorView />;
      case "member": return <MemberView />;
      case "executive": return <ExecutiveView />;
      default: return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${role.color}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <I n={role.icon} s={24} c={role.color} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.tx }}>{role.label} Workspace</div>
          <div style={{ fontSize: 12, color: C.txS, marginTop: 6 }}>Entry: {role.entry} · Navigation: {role.nav}</div>
          <div style={{ fontSize: 12, color: C.txS }}>Data Scope: {role.scope}</div>
          <div style={{ fontSize: 11, color: C.txT, marginTop: 12, maxWidth: 400, margin: "12px auto 0" }}>
            This workspace variant shares the same component library, composition engine, and degradation hierarchy. What differs is the entry point, layout shell, and composition logic.
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Source Sans 3', system-ui, sans-serif", background: C.bg, color: C.tx, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 208, background: C.sbBg, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>NoUI</div>
          <div style={{ fontSize: 9, color: C.sbTx, marginTop: 1, letterSpacing: "0.04em" }}>DENVER EMPLOYEES RETIREMENT</div>
        </div>

        {/* Role Switcher */}
        <div style={{ padding: "6px 8px 4px", borderTop: `1px solid ${C.sbHv}` }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: C.sbTx, textTransform: "uppercase", letterSpacing: "0.1em", padding: "6px 8px 4px" }}>Workspace Roles</div>
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => { setActiveRole(r.key); setShowServices(false); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "6px 8px", borderRadius: 5, border: "none",
                background: activeRole === r.key && !showServices ? C.sbHv : "transparent",
                color: activeRole === r.key && !showServices ? C.sbAc : C.sbTx,
                cursor: "pointer", fontSize: 11, fontWeight: 500, marginBottom: 1,
                transition: "all 0.12s", textAlign: "left",
              }}>
                <I n={r.icon} s={13} />
                <span style={{ flex: 1 }}>{r.label}</span>
                {r.key === "member" && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: `${C.sbAc}30`, color: C.sbAc }}>PORTAL</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Nav */}
        <div style={{ padding: "6px 8px", borderTop: `1px solid ${C.sbHv}` }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: C.sbTx, textTransform: "uppercase", letterSpacing: "0.1em", padding: "6px 8px 4px" }}>Platform</div>
          <button onClick={() => setShowServices(true)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "6px 8px", borderRadius: 5, border: "none",
            background: showServices ? C.sbHv : "transparent",
            color: showServices ? C.sbAc : C.sbTx,
            cursor: "pointer", fontSize: 11, fontWeight: 500,
          }}>
            <I n="grid" s={13} />
            <span>Service Map (30)</span>
          </button>
        </div>

        {/* Proficiency Mode */}
        {["analyst", "csr"].includes(activeRole) && !showServices && (
          <div style={{ padding: "6px 12px", borderTop: `1px solid ${C.sbHv}` }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: C.sbTx, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Proficiency Mode</div>
            {["Guided", "Assisted", "Expert"].map(m => (
              <button key={m} onClick={() => setProfMode(m)} style={{
                display: "block", width: "100%", padding: "4px 8px", borderRadius: 4,
                border: "none", textAlign: "left",
                background: profMode === m ? C.sbHv : "transparent",
                color: profMode === m ? C.sbAc : C.sbTx,
                cursor: "pointer", fontSize: 10, fontWeight: 500, marginBottom: 1,
              }}>
                {m === "Guided" ? "🧭" : m === "Assisted" ? "💡" : "⚡"} {m}
              </button>
            ))}
          </div>
        )}

        {/* Architecture Layers */}
        <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: `1px solid ${C.sbHv}` }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: C.sbTx, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Architecture</div>
          {[
            { name: "L4 Dynamic Workspace", color: "#b39ddb" },
            { name: "L3 Relevance Engine", color: C.accM },
            { name: "L2 Business Intelligence", color: C.sbAc },
            { name: "L1 Data Connector", color: "#78909c" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 9, color: C.sbTx }}>{l.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "10px 20px", background: C.srf, borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: C.tx, margin: 0 }}>
                {showServices ? "Platform Service Map" : `${role.label} Workspace`}
              </h1>
              {!showServices && (
                <Pill bg={`${role.color}15`} color={role.color}>{role.entry}</Pill>
              )}
              {!showServices && ["analyst", "csr"].includes(activeRole) && (
                <Pill bg={profMode === "Guided" ? C.priS : profMode === "Assisted" ? C.infL : C.okL}
                  color={profMode === "Guided" ? C.pri : profMode === "Assisted" ? C.inf : C.ok}>
                  {profMode} Mode
                </Pill>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.txT, marginTop: 2 }}>
              {showServices ? "30 application management services · 20 BUILD · 7 HYBRID · 3 BUY" : `${role.nav} · ${role.scope}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: C.okL, border: `1px solid ${C.ok}30` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ok }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.ok }}>All Systems Healthy</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {renderView()}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.brd}; border-radius: 3px; }
        input::placeholder { color: ${C.txT}; }
      `}</style>
    </div>
  );
}
