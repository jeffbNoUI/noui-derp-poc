import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   NoUI — Operational Intelligence Dashboard
   The management layer that knows the plan rules, the member population,
   and the team's capability — and uses all three to predict, explain,
   and optimize pension operations.
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Design Tokens ───────────────────────────────────────────────────
const C = {
  pri: "#00796b", priH: "#00695c", priL: "#b2dfdb", priS: "#e0f2f1",
  acc: "#e65100", accL: "#fff3e0",
  ok: "#2e7d32", okL: "#e8f5e9",
  err: "#c62828", errL: "#ffebee",
  inf: "#0d47a1", infL: "#e3f2fd",
  warn: "#f57f17", warnL: "#fffde7",
  purple: "#6a1b9a", purpleL: "#f3e5f5",
  bg: "#f6f9f9", srf: "#fff", srfA: "#eef5f5",
  tx: "#1a2e2e", txS: "#4a6767", txT: "#7a9696", txD: "#c0d0d0",
  brd: "#d0dede", brdS: "#e8f0f0",
  sbBg: "#00363a", sbTx: "#a0c4c4", sbAc: "#4db6ac", sbHv: "#004d40",
};

const I = ({ n, s = 15, c = "currentColor" }) => {
  const st = { width: s, height: s, fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 };
  const d = {
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    bar: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    chevD: <polyline points="6 9 12 15 18 9"/>,
    chevR: <polyline points="9 18 15 12 9 6"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46"/>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    shield: <><path d="M12 2l7 4v5c0 5.25-3.5 10-7 11.5C8.5 21 5 16.25 5 11V6z"/><path d="M9 12l2 2 4-4"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  };
  return <svg viewBox="0 0 24 24" style={st}>{d[n]}</svg>;
};

// ─── Shared Components ───────────────────────────────────────────────
const Pill = ({ children, bg, color, style: s }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: bg, color, letterSpacing: "0.02em", whiteSpace: "nowrap", ...s }}>{children}</span>
);
const Card = ({ children, style, ...p }) => (
  <div style={{ background: C.srf, borderRadius: 10, border: `1px solid ${C.brd}`, overflow: "hidden", ...style }} {...p}>{children}</div>
);
const SH = ({ icon, title, sub, right, noBorder }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: noBorder ? "none" : `1px solid ${C.brdS}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <I n={icon} s={14} c={C.pri} /><div><div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{title}</div>{sub && <div style={{ fontSize: 10, color: C.txT, marginTop: 1 }}>{sub}</div>}</div>
    </div>
    {right}
  </div>
);
const Metric = ({ icon, label, value, delta, deltaDir, color, sub }) => (
  <div style={{ padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.srf, flex: 1, minWidth: 140 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <I n={icon} s={14} c={color} />
      </div>
      <span style={{ fontSize: 10, color: C.txS, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: C.tx, letterSpacing: "-0.02em" }}>{value}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
      {delta && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, color: deltaDir === "up" ? C.ok : deltaDir === "down" ? C.err : C.txT }}>
          {deltaDir === "up" && <I n="arrowUp" s={10} c={C.ok} />}
          {deltaDir === "down" && <I n="arrowDown" s={10} c={C.err} />}
          {delta}
        </span>
      )}
      {sub && <span style={{ fontSize: 10, color: C.txT }}>{sub}</span>}
    </div>
  </div>
);

// ─── Bar chart helper ────────────────────────────────────────────────
const Bar = ({ data, maxH = 120, color, labelKey = "label", valueKey = "value", showValues = true, highlight }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: maxH + 28, padding: "0 4px" }}>
    {data.map((d, i) => {
      const max = Math.max(...data.map(x => x[valueKey]));
      const h = max > 0 ? (d[valueKey] / max) * maxH : 0;
      const isHl = highlight === i;
      return (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {showValues && <span style={{ fontSize: 10, fontWeight: 600, color: isHl ? color : C.tx }}>{d[valueKey]}</span>}
          <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: isHl ? color : `${color}40`, transition: "height 0.3s" }} />
          <span style={{ fontSize: 8, color: C.txT, textAlign: "center" }}>{d[labelKey]}</span>
        </div>
      );
    })}
  </div>
);

// ─── Sparkline ───────────────────────────────────────────────────────
const Spark = ({ data, w = 80, h = 24, color }) => {
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h} style={{ flexShrink: 0 }}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
};

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

// Period-over-period data
const PERIODS = {
  current: { label: "Feb 2026", cases: 127, avgDays: 3.2, accuracy: 99.97, onTime: 96.8, complexPct: 18 },
  prior: { label: "Jan 2026", cases: 118, avgDays: 3.5, accuracy: 99.94, onTime: 95.1, complexPct: 15 },
};

// Monthly volume (6 months)
const VOLUME = [
  { label: "Sep", value: 98 }, { label: "Oct", value: 112 }, { label: "Nov", value: 105 },
  { label: "Dec", value: 89 }, { label: "Jan", value: 118 }, { label: "Feb", value: 127 },
];

// Predictive eligibility wave (next 12 months)
const ELIG_WAVE = [
  { month: "Mar", normal: 4, rule75: 7, early: 3, total: 14 },
  { month: "Apr", normal: 3, rule75: 5, early: 4, total: 12 },
  { month: "May", normal: 5, rule75: 8, early: 2, total: 15 },
  { month: "Jun", normal: 6, rule75: 12, early: 5, total: 23 },
  { month: "Jul", normal: 8, rule75: 15, early: 6, total: 29 },
  { month: "Aug", normal: 4, rule75: 9, early: 3, total: 16 },
  { month: "Sep", normal: 5, rule75: 6, early: 4, total: 15 },
  { month: "Oct", normal: 3, rule75: 4, early: 2, total: 9 },
  { month: "Nov", normal: 4, rule75: 5, early: 3, total: 12 },
  { month: "Dec", normal: 7, rule75: 10, early: 4, total: 21 },
  { month: "Jan '27", normal: 9, rule75: 14, early: 7, total: 30 },
  { month: "Feb '27", normal: 5, rule75: 8, early: 3, total: 16 },
];

// Flow / bottleneck analysis
const FLOW_STAGES = [
  { name: "Application Review", active: 8, avgDays: 0.8, waitHuman: 5, waitExternal: 2, waitSystem: 1, bottleneck: false },
  { name: "Eligibility Review", active: 12, avgDays: 1.1, waitHuman: 4, waitExternal: 6, waitSystem: 2, bottleneck: true },
  { name: "Benefit Calculation", active: 9, avgDays: 0.9, waitHuman: 7, waitExternal: 0, waitSystem: 2, bottleneck: false },
  { name: "Payment Options", active: 7, avgDays: 1.4, waitHuman: 2, waitExternal: 4, waitSystem: 1, bottleneck: true },
  { name: "Approval", active: 5, avgDays: 0.6, waitHuman: 4, waitExternal: 0, waitSystem: 1, bottleneck: false },
];

// Team proficiency distribution
const TEAM = [
  { name: "Sarah Chen", std: "Proficient", elv: "Proficient", cpx: "Developing", cases: 14, capacity: 82, spark: [8,10,12,14,11,13,14] },
  { name: "Marcus Rivera", std: "Proficient", elv: "Developing", cpx: "Learning", cases: 9, capacity: 58, spark: [5,7,6,8,9,7,9] },
  { name: "Lisa Park", std: "Proficient", elv: "Proficient", cpx: "Proficient", cases: 16, capacity: 94, spark: [12,14,15,13,16,15,16] },
  { name: "James Foster", std: "Developing", elv: "Learning", cpx: "—", cases: 6, capacity: 35, spark: [2,3,4,4,5,5,6] },
];

// Operational calendar events
const CAL_EVENTS = [
  { date: "Mar 1", type: "cutoff", title: "March payment cutoff", desc: "Complete packages due by Feb 15 for March 1 payment", status: "upcoming", daysOut: 7 },
  { date: "Mar 10", type: "deadline", title: "DRO-2026-0031 response due", desc: "Court order response for Martinez DRO case", status: "urgent", daysOut: 16 },
  { date: "Mar 15", type: "cutoff", title: "April payment cutoff", desc: "Complete packages due for April 1 payment", status: "upcoming", daysOut: 21 },
  { date: "Mar 20", type: "board", title: "DERP Board Meeting", desc: "Quarterly board meeting — COLA review on agenda", status: "upcoming", daysOut: 26 },
  { date: "Apr 1", type: "milestone", title: "Q2 begins / Retirements spike", desc: "Historically highest retirement volume quarter", status: "planning", daysOut: 38 },
  { date: "Apr 15", type: "cutoff", title: "May payment cutoff", desc: "Complete packages due for May 1 payment", status: "planning", daysOut: 52 },
  { date: "Jun 30", type: "milestone", title: "Fiscal year end", desc: "Annual member statements generated, actuarial valuation data frozen", status: "planning", daysOut: 128 },
  { date: "Jul 1", type: "milestone", title: "New fiscal year", desc: "Contribution rate adjustments effective, tier date boundary", status: "planning", daysOut: 129 },
];

const EFFICIENCY_GROUPS = [
  { label: "High Throughput", count: 2, color: C.ok, names: "Sarah C., Lisa P.", desc: "Proficient across Standard + Elevated. Processing at full capacity with sustained accuracy.", metrics: "Avg 3.1 complexity-adjusted cases/day, 98.5% accuracy" },
  { label: "Building Proficiency", count: 1, color: C.inf, names: "Marcus R.", desc: "Proficient at Standard, developing at Elevated. Increasing velocity as familiarity grows.", metrics: "Avg 2.4 complexity-adjusted cases/day, 94% accuracy" },
  { label: "Guided Development", count: 1, color: C.purple, names: "James F.", desc: "New hire building foundations. System providing full guidance. Expected growth trajectory.", metrics: "Avg 1.2 complexity-adjusted cases/day, 89% accuracy" },
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// ─── 1. KPI Strip ────────────────────────────────────────────────────
const KPIStrip = () => {
  const d = (cur, prev, fmt = v => v, invert = false) => {
    const pct = prev !== 0 ? ((cur - prev) / prev * 100).toFixed(1) : 0;
    const dir = pct > 0 ? (invert ? "down" : "up") : pct < 0 ? (invert ? "up" : "down") : "flat";
    return { delta: `${pct > 0 ? "+" : ""}${pct}%`, deltaDir: dir };
  };
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Metric icon="inbox" label="Cases This Period" value={PERIODS.current.cases} {...d(PERIODS.current.cases, PERIODS.prior.cases)} color={C.pri} sub={`vs ${PERIODS.prior.cases} prior`} />
      <Metric icon="clock" label="Avg Processing" value={`${PERIODS.current.avgDays}d`} {...d(PERIODS.current.avgDays, PERIODS.prior.avgDays, v=>v, true)} color={C.inf} sub="Complexity-adjusted" />
      <Metric icon="shield" label="Accuracy" value={`${PERIODS.current.accuracy}%`} {...d(PERIODS.current.accuracy, PERIODS.prior.accuracy)} color={C.ok} sub="Zero recalculations" />
      <Metric icon="check" label="On-Time Rate" value={`${PERIODS.current.onTime}%`} {...d(PERIODS.current.onTime, PERIODS.prior.onTime)} color={C.pri} sub="SLA compliance" />
      <Metric icon="layers" label="Complex Mix" value={`${PERIODS.current.complexPct}%`} delta={`+${PERIODS.current.complexPct - PERIODS.prior.complexPct}pts`} deltaDir="flat" color={C.purple} sub="Elevated + Complex" />
    </div>
  );
};

// ─── 2. Predictive Workload ──────────────────────────────────────────
const PredictiveWorkload = () => {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const maxTotal = Math.max(...ELIG_WAVE.map(e => e.total));
  const peakMonth = ELIG_WAVE.reduce((a, b) => b.total > a.total ? b : a);
  const next3 = ELIG_WAVE.slice(0, 3).reduce((s, e) => s + e.total, 0);
  const capacity = TEAM.reduce((s, t) => s + 18, 0); // ~18 cases/month per analyst assumed baseline

  return (
    <Card>
      <SH icon="trending" title="Eligibility Wave Forecast" sub="Predicted retirements from member population + plan rules" right={
        <Pill bg={C.accL} color={C.acc}>Rule-based prediction</Pill>
      } />
      <div style={{ padding: 16 }}>
        {/* Insight banner */}
        <div style={{ padding: "10px 14px", borderRadius: 8, background: `${C.acc}08`, border: `1px solid ${C.acc}20`, marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <I n="zap" s={16} c={C.acc} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.acc }}>Capacity Alert: Jul 2026 Surge</div>
            <div style={{ fontSize: 11, color: C.txS, marginTop: 2 }}>
              {peakMonth.total} members projected to reach eligibility in {peakMonth.month} — {Math.round((peakMonth.total / capacity) * 100)}% of current team capacity.
              {peakMonth.total > capacity ? " Temporary staffing or overtime may be needed." : ""} {next3} projected in the next 90 days at current team capacity of ~{capacity} cases/month.
            </div>
          </div>
        </div>

        {/* Stacked bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 170, padding: "0 2px" }}>
          {ELIG_WAVE.map((e, i) => {
            const hovered = hoveredMonth === i;
            const scale = 140 / maxTotal;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: hoveredMonth !== null && !hovered ? 0.5 : 1, transition: "opacity 0.15s" }}
                onMouseEnter={() => setHoveredMonth(i)} onMouseLeave={() => setHoveredMonth(null)}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.tx }}>{e.total}</span>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                  <div style={{ height: e.early * scale, background: C.acc, borderRadius: "3px 3px 0 0" }} title={`Early: ${e.early}`} />
                  <div style={{ height: e.rule75 * scale, background: C.pri }} title={`Rule of 75/85: ${e.rule75}`} />
                  <div style={{ height: e.normal * scale, background: C.inf, borderRadius: "0 0 3px 3px" }} title={`Normal: ${e.normal}`} />
                </div>
                <span style={{ fontSize: 8, color: hovered ? C.tx : C.txT, fontWeight: hovered ? 600 : 400 }}>{e.month}</span>
              </div>
            );
          })}
          {/* Capacity line reference */}
          <div style={{ position: "absolute", display: "none" }} /> {/* placeholder for capacity overlay concept */}
        </div>

        {/* Legend + hovered detail */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "8px 0", borderTop: `1px solid ${C.brdS}` }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[{ color: C.inf, label: "Normal (65+)" }, { color: C.pri, label: "Rule of 75/85" }, { color: C.acc, label: "Early Retirement" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: C.txS }}>{l.label}</span>
              </div>
            ))}
          </div>
          {hoveredMonth !== null && (
            <div style={{ fontSize: 10, color: C.txS }}>
              <strong>{ELIG_WAVE[hoveredMonth].month}:</strong> {ELIG_WAVE[hoveredMonth].normal} normal, {ELIG_WAVE[hoveredMonth].rule75} rule, {ELIG_WAVE[hoveredMonth].early} early
            </div>
          )}
        </div>

        {/* How this works */}
        <div style={{ padding: "8px 12px", borderRadius: 6, background: C.priS, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.pri, marginBottom: 2 }}>How this forecast works</div>
          <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>
            The system evaluates every active member's age, service credit, and tier against plan eligibility rules. Members projected to cross a retirement threshold (age 65, Rule of 75/85, or early retirement minimum) within each month are counted. This is not historical trending — it is a deterministic projection from the actual member population.
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── 3. Flow & Bottleneck Analysis ───────────────────────────────────
const FlowAnalysis = () => (
  <Card>
    <SH icon="filter" title="Processing Flow & Bottleneck Analysis" sub="Where cases spend time — and why" />
    <div style={{ padding: 16 }}>
      {/* Flow pipeline */}
      <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
        {FLOW_STAGES.map((s, i) => {
          const maxActive = Math.max(...FLOW_STAGES.map(x => x.active));
          const w = (s.active / maxActive) * 100;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.bottleneck ? C.acc : C.tx }}>{s.name}</span>
                {s.bottleneck && <Pill bg={C.accL} color={C.acc} style={{ fontSize: 8 }}>Bottleneck</Pill>}
              </div>
              <div style={{ height: 36, background: s.bottleneck ? `${C.acc}15` : C.srfA, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: s.bottleneck ? `1px solid ${C.acc}30` : `1px solid ${C.brdS}` }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: s.bottleneck ? C.acc : C.tx }}>{s.active}</span>
              </div>
              <div style={{ fontSize: 10, color: C.txT, textAlign: "center" }}>Avg {s.avgDays}d</div>
              {/* Wait breakdown */}
              <div style={{ display: "flex", gap: 1, height: 8, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ flex: s.waitHuman, background: C.inf }} title={`Analyst action: ${s.waitHuman}`} />
                <div style={{ flex: s.waitExternal, background: C.acc }} title={`External wait: ${s.waitExternal}`} />
                <div style={{ flex: s.waitSystem, background: C.txD }} title={`System/data: ${s.waitSystem}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Wait type legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
        {[{ color: C.inf, label: "Awaiting analyst action" }, { color: C.acc, label: "External dependency (forms, court orders)" }, { color: C.txD, label: "System / data quality hold" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 6, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 10, color: C.txS }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Bottleneck explanation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "10px 14px", borderRadius: 8, background: `${C.acc}06`, border: `1px solid ${C.acc}18` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.acc, marginBottom: 4 }}>Eligibility Review — 12 cases</div>
          <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>
            <strong>Root cause:</strong> 6 of 12 cases awaiting external input — spousal consent forms (3), employer salary verification (2), purchased service documentation (1). This is not a staffing bottleneck; it is a dependency bottleneck. <strong>Action:</strong> Automated reminder workflow for pending documents would reduce dwell time.
          </div>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 8, background: `${C.acc}06`, border: `1px solid ${C.acc}18` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.acc, marginBottom: 4 }}>Payment Options — 7 cases</div>
          <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>
            <strong>Root cause:</strong> 4 of 7 cases waiting for spousal consent at retirement form (married members must elect J&S option). Average wait: 5.2 days. <strong>Action:</strong> Member portal pre-submission of spousal consent would eliminate this stage delay for digitally-active members.
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// ─── 4. Period-over-Period Efficiency ────────────────────────────────
const EfficiencyComparison = () => {
  const metrics = [
    { label: "Cases Completed", cur: 127, prev: 118, unit: "", higher: "better" },
    { label: "Avg Processing Days", cur: 3.2, prev: 3.5, unit: "d", higher: "worse" },
    { label: "Accuracy Rate", cur: 99.97, prev: 99.94, unit: "%", higher: "better" },
    { label: "On-Time Rate", cur: 96.8, prev: 95.1, unit: "%", higher: "better" },
    { label: "Complexity-Adj. Throughput", cur: 142, prev: 128, unit: " CU", higher: "better" },
    { label: "QA Returns", cur: 1, prev: 2, unit: "", higher: "worse" },
  ];

  return (
    <Card>
      <SH icon="activity" title="Period-over-Period Efficiency" sub="Feb 2026 vs Jan 2026 — with causal analysis" right={
        <div style={{ display: "flex", gap: 4 }}>
          <Pill bg={C.okL} color={C.ok}>5 improved</Pill>
          <Pill bg={C.srfA} color={C.txT}>1 stable</Pill>
        </div>
      } />
      <div style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {metrics.map((m, i) => {
            const pctChange = m.prev !== 0 ? ((m.cur - m.prev) / m.prev * 100) : 0;
            const improved = m.higher === "better" ? pctChange > 0 : pctChange < 0;
            const declined = m.higher === "better" ? pctChange < 0 : pctChange > 0;
            const color = improved ? C.ok : declined ? C.err : C.txT;
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: `${color}06`, border: `1px solid ${color}15` }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: C.txT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.tx }}>{m.cur}{m.unit}</span>
                  <span style={{ fontSize: 11, color: C.txT }}>← {m.prev}{m.unit}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                  <I n={improved ? "arrowUp" : declined ? "arrowDown" : "pause"} s={10} c={color} />
                  <span style={{ fontSize: 10, fontWeight: 600, color }}>{Math.abs(pctChange).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Causal explanation — the "Why" */}
        <div style={{ padding: "12px 16px", borderRadius: 8, background: C.priS, border: `1px solid ${C.pri}20` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.pri, marginBottom: 6 }}>What Changed — AI-Assisted Causal Analysis</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.ok, marginBottom: 3 }}>Improvements</div>
              <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.6 }}>
                Processing time decreased 0.3 days despite higher volume. Primary driver: Lisa Park's promotion to Proficient on Complex cases reduced DRO processing from 6.1d to 3.8d average. Secondary: 3 cases that would have stalled at Eligibility Review were caught early by the pre-submission document checklist in the Member Portal.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.acc, marginBottom: 3 }}>Watch Areas</div>
              <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.6 }}>
                Complex case mix increased from 15% to 18% — driven by 3 additional DRO cases. Current team has only 1 analyst (Lisa) at Proficient for Complex. If mix continues trending upward, routing will concentrate on a single analyst. Recommend advancing Sarah's Complex proficiency (currently Developing with 8 cases, 94% accuracy).
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── 5. Team Capability & Efficiency Grouping ────────────────────────
const TeamCapability = () => {
  const profColor = { Proficient: C.ok, Developing: C.inf, Learning: C.purple, "—": C.txD };
  const profBg = { Proficient: C.okL, Developing: C.infL, Learning: C.purpleL, "—": C.srfA };

  return (
    <Card>
      <SH icon="users" title="Team Capability & Operational Grouping" sub="Skills-based grouping — not speed ranking" right={
        <Pill bg={C.priS} color={C.pri}>Proficiency Model</Pill>
      } />
      <div style={{ padding: 16 }}>
        {/* Efficiency groups */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {EFFICIENCY_GROUPS.map((g, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${g.color}25`, background: `${g.color}06` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.count}</span>
              </div>
              <div style={{ fontSize: 10, color: C.txS, marginBottom: 4 }}>{g.names}</div>
              <div style={{ fontSize: 10, color: C.txT, lineHeight: 1.5, marginBottom: 6 }}>{g.desc}</div>
              <div style={{ fontSize: 9, fontWeight: 500, color: g.color, padding: "4px 8px", borderRadius: 4, background: `${g.color}10` }}>{g.metrics}</div>
            </div>
          ))}
        </div>

        {/* Detail matrix */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.brd}` }}>
            {["Analyst", "Standard", "Elevated", "Complex", "Active Cases", "Capacity Used", "7-Day Trend"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.txT, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {TEAM.map((t, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.brdS}` }}>
                <td style={{ padding: "8px", fontWeight: 500, color: C.tx }}>{t.name}</td>
                {[t.std, t.elv, t.cpx].map((p, j) => (
                  <td key={j} style={{ padding: "8px" }}>
                    <Pill bg={profBg[p]} color={profColor[p]}>{p}</Pill>
                  </td>
                ))}
                <td style={{ padding: "8px", fontWeight: 600, color: C.tx }}>{t.cases}</td>
                <td style={{ padding: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 50, height: 6, borderRadius: 3, background: C.srfA, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${t.capacity}%`, borderRadius: 3, background: t.capacity > 85 ? C.acc : t.capacity > 60 ? C.pri : C.inf }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: t.capacity > 85 ? C.acc : C.tx }}>{t.capacity}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px" }}>
                  <Spark data={t.spark} color={C.pri} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Capacity insight */}
        <div style={{ padding: "10px 14px", borderRadius: 8, background: C.warnL, border: `1px solid ${C.warn}25`, marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <I n="alert" s={14} c={C.warn} />
          <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>
            <strong style={{ color: C.warn }}>Capacity Risk:</strong> Lisa Park is at 94% capacity and is the only Complex-proficient team member. Current routing concentrates all DRO and multi-factor cases on one person. Recommend: (1) prioritize Sarah Chen's Complex development (8 cases completed, 94% accuracy — near Proficient threshold), (2) cap Lisa's assignment to 90% to preserve bandwidth for mentoring.
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── 6. Operational Calendar ─────────────────────────────────────────
const OperationalCalendar = () => {
  const typeStyles = {
    cutoff: { icon: "clock", color: C.err, bg: C.errL, label: "Cutoff" },
    deadline: { icon: "alert", color: C.acc, bg: C.accL, label: "Deadline" },
    board: { icon: "users", color: C.inf, bg: C.infL, label: "Board" },
    milestone: { icon: "target", color: C.purple, bg: C.purpleL, label: "Milestone" },
  };

  return (
    <Card>
      <SH icon="calendar" title="Operational Calendar & Upcoming Events" sub="Pension-specific deadlines, cutoffs, and milestones" right={
        <div style={{ display: "flex", gap: 4 }}>
          <Pill bg={C.errL} color={C.err}>2 this week</Pill>
          <Pill bg={C.accL} color={C.acc}>1 urgent</Pill>
        </div>
      } />
      <div style={{ padding: 0 }}>
        {CAL_EVENTS.map((ev, i) => {
          const ts = typeStyles[ev.type];
          const isUrgent = ev.daysOut <= 14;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
              borderBottom: i < CAL_EVENTS.length - 1 ? `1px solid ${C.brdS}` : "none",
              background: isUrgent ? `${ts.color}04` : "transparent",
            }}>
              {/* Date block */}
              <div style={{ width: 52, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isUrgent ? ts.color : C.tx }}>{ev.date.split(" ")[0]}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? ts.color : C.tx }}>{ev.date.split(" ")[1]}</div>
              </div>

              {/* Type indicator */}
              <div style={{ width: 28, height: 28, borderRadius: 6, background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <I n={ts.icon} s={13} c={ts.color} />
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{ev.title}</span>
                  <Pill bg={ts.bg} color={ts.color}>{ts.label}</Pill>
                  {ev.status === "urgent" && <Pill bg={C.errL} color={C.err}>Action Required</Pill>}
                </div>
                <div style={{ fontSize: 10, color: C.txT, marginTop: 2 }}>{ev.desc}</div>
              </div>

              {/* Days out */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? ts.color : C.txS }}>{ev.daysOut}d</div>
                <div style={{ fontSize: 9, color: C.txT }}>from today</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─── 7. Complexity-Adjusted Capacity Gauge ───────────────────────────
const CapacityGauge = () => {
  // Standard = 1 CU, Elevated = 1.5 CU, Complex = 2.5 CU
  const currentLoad = { standard: 22, elevated: 13, complex: 6 };
  const cuLoad = currentLoad.standard * 1 + currentLoad.elevated * 1.5 + currentLoad.complex * 2.5;
  const cuCapacity = 80; // team capacity in CU
  const utilization = Math.round((cuLoad / cuCapacity) * 100);

  return (
    <Card>
      <SH icon="target" title="Complexity-Adjusted Capacity" sub="Weighted workload: Standard=1, Elevated=1.5, Complex=2.5 CU" />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Gauge */}
          <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke={C.brdS} strokeWidth="10" />
              <circle cx="55" cy="55" r="46" fill="none" stroke={utilization > 85 ? C.acc : C.pri} strokeWidth="10"
                strokeDasharray={`${(utilization / 100) * 289} 289`}
                strokeLinecap="round" transform="rotate(-90 55 55)" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: utilization > 85 ? C.acc : C.tx }}>{utilization}%</div>
              <div style={{ fontSize: 8, color: C.txT }}>utilized</div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[
                { label: "Standard", count: currentLoad.standard, cu: currentLoad.standard, color: C.inf },
                { label: "Elevated", count: currentLoad.elevated, cu: currentLoad.elevated * 1.5, color: C.acc },
                { label: "Complex", count: currentLoad.complex, cu: currentLoad.complex * 2.5, color: C.purple },
              ].map(c => (
                <div key={c.label} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: `${c.color}08`, border: `1px solid ${c.color}15` }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: c.color, textTransform: "uppercase" }}>{c.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.tx }}>{c.count} <span style={{ fontSize: 10, color: C.txT }}>cases</span></div>
                  <div style={{ fontSize: 10, color: C.txT }}>{c.cu} CU</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.txS }}>
              <span>Total: <strong>{cuLoad} CU</strong> of {cuCapacity} CU capacity</span>
              <span>Raw cases: <strong>{currentLoad.standard + currentLoad.elevated + currentLoad.complex}</strong></span>
            </div>
            <div style={{ fontSize: 10, color: C.txT, marginTop: 6, fontStyle: "italic" }}>
              Without complexity weighting, this team appears at {Math.round(((currentLoad.standard + currentLoad.elevated + currentLoad.complex) / (cuCapacity / 1.3)) * 100)}% capacity. The adjusted view reveals actual cognitive load is {utilization > 80 ? "significantly higher" : "more moderate"} due to case mix.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP SHELL
// ═══════════════════════════════════════════════════════════════════════
export default function OperationalIntelligence() {
  const [activeView, setActiveView] = useState("dashboard");

  const navItems = [
    { key: "dashboard", icon: "grid", label: "Dashboard" },
    { key: "forecast", icon: "trending", label: "Workload Forecast" },
    { key: "flow", icon: "filter", label: "Flow Analysis" },
    { key: "efficiency", icon: "activity", label: "Efficiency" },
    { key: "team", icon: "users", label: "Team Capability" },
    { key: "calendar", icon: "calendar", label: "Calendar" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Source Sans 3', system-ui, sans-serif", background: C.bg, color: C.tx, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: C.sbBg, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 10px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>NoUI</div>
          <div style={{ fontSize: 8, color: C.sbTx, letterSpacing: "0.04em", marginTop: 1 }}>OPERATIONAL INTELLIGENCE</div>
        </div>
        <div style={{ padding: "4px 8px", borderTop: `1px solid ${C.sbHv}` }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: C.sbTx, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 6px 4px" }}>Views</div>
          {navItems.map(n => (
            <button key={n.key} onClick={() => setActiveView(n.key)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 5, border: "none",
              background: activeView === n.key ? C.sbHv : "transparent", color: activeView === n.key ? C.sbAc : C.sbTx,
              cursor: "pointer", fontSize: 11, fontWeight: 500, marginBottom: 1, textAlign: "left", transition: "all 0.1s",
            }}>
              <I n={n.icon} s={13} />{n.label}
            </button>
          ))}
        </div>

        {/* Workspace role indicator */}
        <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: `1px solid ${C.sbHv}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.sbHv, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I n="compass" s={13} c={C.sbAc} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Supervisor</div>
              <div style={{ fontSize: 9, color: C.sbTx }}>Operations Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "10px 20px", background: C.srf, borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: C.tx, margin: 0 }}>
              {navItems.find(n => n.key === activeView)?.label || "Dashboard"}
            </h1>
            <div style={{ fontSize: 10, color: C.txT, marginTop: 1 }}>
              {activeView === "dashboard" ? "Complete operational picture — KPIs, capacity, forecasts, and calendar" :
               activeView === "forecast" ? "Predicted retirements from member population analysis + plan eligibility rules" :
               activeView === "flow" ? "Stage-level dwell time analysis with root cause identification" :
               activeView === "efficiency" ? "Period-over-period metrics with AI-assisted causal explanation" :
               activeView === "team" ? "Skills-based capability distribution and capacity utilization" :
               "Pension-specific deadlines, cutoffs, board meetings, and compliance milestones"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill bg={C.priS} color={C.pri}>Feb 2026</Pill>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: C.okL, border: `1px solid ${C.ok}30` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ok }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.ok }}>All Systems Healthy</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activeView === "dashboard" && (<>
              <KPIStrip />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <PredictiveWorkload />
                <CapacityGauge />
              </div>
              <FlowAnalysis />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <EfficiencyComparison />
                <TeamCapability />
              </div>
              <OperationalCalendar />
            </>)}
            {activeView === "forecast" && <PredictiveWorkload />}
            {activeView === "flow" && <FlowAnalysis />}
            {activeView === "efficiency" && <EfficiencyComparison />}
            {activeView === "team" && <TeamCapability />}
            {activeView === "calendar" && <OperationalCalendar />}

            {/* Full-page views get additional context */}
            {activeView === "forecast" && (
              <Card>
                <SH icon="eye" title="Planning Implications" />
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 8, background: C.okL }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.ok, marginBottom: 4 }}>Next 90 Days</div>
                      <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>{ELIG_WAVE.slice(0,3).reduce((s,e)=>s+e.total,0)} projected retirements. Current capacity sufficient. No action required.</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: C.accL }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.acc, marginBottom: 4 }}>Q3 2026 Surge</div>
                      <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>Jun–Aug projects {ELIG_WAVE.slice(3,6).reduce((s,e)=>s+e.total,0)} retirements — well above baseline. Begin cross-training now. Consider temporary assignment or overtime allocation for July.</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: C.infL }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.inf, marginBottom: 4 }}>Jan 2027 Peak</div>
                      <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>New year historically drives highest volume. 30 projected — near maximum team capacity. Plan headcount decision by Q3 2026.</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeView === "team" && (
              <Card>
                <SH icon="compass" title="Development Recommendations" sub="AI-suggested growth paths based on team capability gaps" />
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { analyst: "Sarah Chen", priority: "High", action: "Advance Complex proficiency", detail: "8 Complex cases at 94% accuracy. Near Proficient threshold. Assign 2–3 DRO cases in March with Assisted mode + Lisa as mentor. Would give team a second Complex-proficient analyst before Q3 surge.", color: C.acc },
                      { analyst: "Marcus Rivera", priority: "Medium", action: "Deepen Elevated skills", detail: "12 Elevated cases at 91%. Accuracy trending up. Continue current trajectory — system will suggest graduation to Proficient at Elevated within approximately 4–6 weeks at current pace.", color: C.inf },
                      { analyst: "James Foster", priority: "Standard", action: "Build Standard foundations", detail: "9 Standard cases at 89%. Validation warnings decreasing. Guided mode appropriate. Focus on completing Standard proficiency before introducing Elevated work. Target: Developing at Standard by end of March.", color: C.purple },
                      { analyst: "Lisa Park", priority: "Protect", action: "Reduce concentration risk", detail: "Only Complex-proficient analyst. At 94% capacity. Cap assignment at 90%. Assign 2 hours/week for mentoring Sarah on DRO cases. This is a team investment, not a productivity reduction.", color: C.err },
                    ].map((r, i) => (
                      <div key={i} style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${r.color}20`, background: `${r.color}04` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{r.analyst}</span>
                          <Pill bg={`${r.color}15`} color={r.color}>{r.priority}</Pill>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.action}</div>
                        <div style={{ fontSize: 10, color: C.txS, lineHeight: 1.5 }}>{r.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.brd}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
