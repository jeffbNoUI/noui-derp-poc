import { useState, useCallback, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// NoUI — Workflow Engine v2  (Post-Usability-Review Rebuild)
//
// Every card is a PROCESS STAGE (analyst decision), not a data category.
// Composition engine sets card depth per case complexity.
// Specific exit actions per stage. Interactive election recording.
// Guided (card-stack) + Expert (scrollable) modes.
// 70/30 layout. Confidence-signaled previews. Case status bar.
// ═══════════════════════════════════════════════════════════════════════════

/* ─── Theme tokens ─── */
const TH = {
  dark: {
    n: "Dark",
    bg: "#0B1017", sf: "#141D29", el: "#192435", card: "#16202E",
    bd: "#243040", bdS: "#1B2B3D", bdA: "#22D3EE",
    ac: "#22D3EE", acM: "rgba(34,211,238,.10)", acS: "rgba(34,211,238,.06)",
    wa: "#F59E0B", waM: "rgba(245,158,11,.10)", waB: "rgba(245,158,11,.25)",
    dg: "#EF4444", dgM: "rgba(239,68,68,.10)", dgB: "rgba(239,68,68,.24)",
    ok: "#10B981", okM: "rgba(16,185,129,.10)", okB: "rgba(16,185,129,.25)",
    tx: "#E2E8F0", t2: "#94A3B8", t3: "#64748B", t4: "#475569",
    t1c: "#3B82F6", t1m: "rgba(59,130,246,.12)",
    t2c: "#F59E0B", t2m: "rgba(245,158,11,.12)",
    t3c: "#10B981", t3m: "rgba(16,185,129,.12)",
    btnBg: "#22D3EE", btnTx: "#0B1017",
    btnSBg: "rgba(34,211,238,.08)", btnSTx: "#22D3EE",
    btnDBg: "rgba(239,68,68,.10)", btnDTx: "#EF4444",
    pvO: "rgba(11,16,23,.62)", pvT: "rgba(11,16,23,.82)",
    sh: "0 8px 32px rgba(0,0,0,.50)",
    inBg: "#192435", inBd: "#243040",
    stBg: "#10161F",
  },
  derp: {
    n: "DERP Brand",
    bg: "#EEF2F2", sf: "#FFFFFF", el: "#FFFFFF", card: "#FFFFFF",
    bd: "#C8D8D8", bdS: "#DEE8E8", bdA: "#00796B",
    ac: "#00796B", acM: "rgba(0,121,107,.08)", acS: "rgba(0,121,107,.04)",
    wa: "#E65100", waM: "rgba(230,81,0,.08)", waB: "rgba(230,81,0,.22)",
    dg: "#C62828", dgM: "rgba(198,40,40,.07)", dgB: "rgba(198,40,40,.20)",
    ok: "#2E7D32", okM: "rgba(46,125,50,.08)", okB: "rgba(46,125,50,.22)",
    tx: "#1A2E2E", t2: "#4A6363", t3: "#728F8F", t4: "#9BB0B0",
    t1c: "#1565C0", t1m: "rgba(21,101,192,.10)",
    t2c: "#E65100", t2m: "rgba(230,81,0,.10)",
    t3c: "#2E7D32", t3m: "rgba(46,125,50,.10)",
    btnBg: "#00796B", btnTx: "#FFF",
    btnSBg: "rgba(0,121,107,.06)", btnSTx: "#00796B",
    btnDBg: "rgba(198,40,40,.07)", btnDTx: "#C62828",
    pvO: "rgba(238,242,242,.58)", pvT: "rgba(255,255,255,.88)",
    sh: "0 6px 28px rgba(0,60,60,.09)",
    inBg: "#F6FAFA", inBd: "#C8D8D8",
    stBg: "#F2F6F6",
  },
  slate: {
    n: "Slate",
    bg: "#F0F4F8", sf: "#FFFFFF", el: "#FFFFFF", card: "#FFFFFF",
    bd: "#C4CEDB", bdS: "#DDE4ED", bdA: "#3B82F6",
    ac: "#3B82F6", acM: "rgba(59,130,246,.08)", acS: "rgba(59,130,246,.04)",
    wa: "#D97706", waM: "rgba(217,119,6,.08)", waB: "rgba(217,119,6,.22)",
    dg: "#DC2626", dgM: "rgba(220,38,38,.07)", dgB: "rgba(220,38,38,.20)",
    ok: "#059669", okM: "rgba(5,150,105,.08)", okB: "rgba(5,150,105,.22)",
    tx: "#0F172A", t2: "#475569", t3: "#94A3B8", t4: "#CBD5E1",
    t1c: "#3B82F6", t1m: "rgba(59,130,246,.10)",
    t2c: "#D97706", t2m: "rgba(217,119,6,.10)",
    t3c: "#059669", t3m: "rgba(5,150,105,.10)",
    btnBg: "#3B82F6", btnTx: "#FFF",
    btnSBg: "rgba(59,130,246,.06)", btnSTx: "#3B82F6",
    btnDBg: "rgba(220,38,38,.07)", btnDTx: "#DC2626",
    pvO: "rgba(240,244,248,.55)", pvT: "rgba(255,255,255,.88)",
    sh: "0 6px 28px rgba(15,23,42,.07)",
    inBg: "#F8FAFC", inBd: "#C4CEDB",
    stBg: "#F6F8FB",
  },
};

const $ = n => n != null ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014";
const tierKey = t => t === 1 ? "t1" : t === 2 ? "t2" : "t3";

/* ═══════════════ CASE DATA ═══════════════ */
const CASES = {
  case1: {
    m: { id: "M-100001", name: "Robert Martinez", tier: 1, dept: "Public Works", dob: "Mar 8 1963", hired: "Jun 15 1997", retDate: "Apr 1 2026", lastDay: "Mar 31 2026" },
    bene: { name: "Elena Martinez", rel: "Spouse", age: 59 },
    svc: { earned: 28.75, purchased: 0, total: 28.75, forRule: 28.75 },
    el: { age: 63, rule: "Rule of 75", sum: 91.75, tgt: 75, met: true, minAge: 55, redPct: 0, yrs: 2 },
    leave: { ok: true, amt: 52000 },
    ams: { mo: 36, start: "Apr 2023", end: "Mar 2026", val: 10639.45, noLeave: 9194.45,
      rows: [{ p: "2023 Apr\u2013Dec", n: 9, v: 8792.75 }, { p: "2024", n: 12, v: 9144.50 }, { p: "2025", n: 12, v: 9420.25 }, { p: "2026 Jan\u2013Mar", n: 3, v: 9702.83 }] },
    calc: { mult: 0.02, label: "2.0%", svc: 28.75, formula: "2.0% \u00d7 $10,639.45 \u00d7 28.75y", unred: 6117.68, red: 6117.68 },
    opts: { max: 6117.68, j100: { f: .885, m: 5414.15, s: 5414.15 }, j75: { f: .915, m: 5597.68, s: 4198.26 }, j50: { f: .945, m: 5781.21, s: 2890.61 } },
    ipr: { svc: 28.75, pre: 359.38, post: 179.69 }, deathBen: 5000, dro: null,
    docs: { app: true, notarized: true, birthMem: true, birthSp: true, marriage: true, medicare: false, spousal: false },
    appRx: "Mar 10 2026", dl30: true, cut15: true, marital: "married",
    flags: ["leave-payout"], scenario: null,
  },
  case2: {
    m: { id: "M-100002", name: "Jennifer Kim", tier: 2, dept: "Finance", dob: "Jun 22 1970", hired: "Mar 1 2008", retDate: "May 1 2026", lastDay: "Apr 30 2026" },
    bene: { name: "Estate", rel: "Estate", age: null },
    svc: { earned: 18.17, purchased: 3.00, total: 21.17, forRule: 18.17 },
    el: { age: 55, rule: "Rule of 75", sum: 73.17, tgt: 75, met: false, minAge: 55, redPct: 30, yrs: 10 },
    leave: { ok: true, amt: 0 },
    ams: { mo: 36, start: "May 2023", end: "Apr 2026", val: 7347.62, noLeave: 7347.62,
      rows: [{ p: "2023 May\u2013Dec", n: 8, v: 7007.42 }, { p: "2024", n: 12, v: 7287.75 }, { p: "2025", n: 12, v: 7506.33 }, { p: "2026 Jan\u2013Apr", n: 4, v: 7731.50 }] },
    calc: { mult: 0.015, label: "1.5%", svc: 21.17, formula: "1.5% \u00d7 $7,347.62 \u00d7 21.17y", unred: 2332.96, red: 1633.07 },
    opts: { max: 1633.07, j100: null, j75: null, j50: null },
    ipr: { svc: 18.17, pre: 227.13, post: 113.56 }, deathBen: 2500, dro: null,
    docs: { app: true, notarized: true, birthMem: true, birthSp: false, marriage: false, medicare: false, spousal: false },
    appRx: "Apr 8 2026", dl30: true, cut15: true, marital: "single",
    flags: ["early-retirement", "purchased-service"],
    scenario: { waitAge: 56, benefit: 2518, inc: "54%" },
  },
  case3: {
    m: { id: "M-100003", name: "David Washington", tier: 3, dept: "Parks & Rec", dob: "Feb 14 1963", hired: "Sep 1 2012", retDate: "Apr 1 2026", lastDay: "Mar 31 2026" },
    bene: { name: "Michelle Washington", rel: "Spouse", age: 61 },
    svc: { earned: 13.58, purchased: 0, total: 13.58, forRule: 13.58 },
    el: { age: 63, rule: "Rule of 85", sum: 76.58, tgt: 85, met: false, minAge: 60, redPct: 12, yrs: 2 },
    leave: { ok: false, amt: 0 },
    ams: { mo: 60, start: "Apr 2021", end: "Mar 2026", val: 6684.52, noLeave: 6684.52,
      rows: [{ p: "2021 Apr\u2013Dec", n: 9, v: 6250.00 }, { p: "2022", n: 12, v: 6437.50 }, { p: "2023", n: 12, v: 6695.00 }, { p: "2024", n: 12, v: 6962.80 }, { p: "2025", n: 12, v: 7171.67 }, { p: "2026 Q1", n: 3, v: 7386.82 }] },
    calc: { mult: 0.015, label: "1.5%", svc: 13.58, formula: "1.5% \u00d7 $6,684.52 \u00d7 13.58y", unred: 1361.62, red: 1198.23 },
    opts: { max: 1198.23, j100: { f: .880, m: 1054.44, s: 1054.44 }, j75: { f: .910, m: 1090.39, s: 817.79 }, j50: { f: .940, m: 1126.34, s: 563.17 } },
    ipr: { svc: 13.58, pre: 169.75, post: 84.88 }, deathBen: 4000, dro: null,
    docs: { app: true, notarized: true, birthMem: true, birthSp: true, marriage: true, medicare: false, spousal: false },
    appRx: "Mar 12 2026", dl30: true, cut15: true, marital: "married",
    flags: ["early-retirement"], scenario: null,
  },
  case4: {
    m: { id: "M-100001", name: "Robert Martinez", tier: 1, dept: "Public Works", dob: "Mar 8 1963", hired: "Jun 15 1997", retDate: "Apr 1 2026", lastDay: "Mar 31 2026" },
    bene: { name: "Elena Martinez", rel: "Spouse", age: 59 },
    svc: { earned: 28.75, purchased: 0, total: 28.75, forRule: 28.75 },
    el: { age: 63, rule: "Rule of 75", sum: 91.75, tgt: 75, met: true, minAge: 55, redPct: 0, yrs: 2 },
    leave: { ok: true, amt: 52000 },
    ams: { mo: 36, start: "Apr 2023", end: "Mar 2026", val: 10639.45, noLeave: 9194.45,
      rows: [{ p: "2023 Apr\u2013Dec", n: 9, v: 8792.75 }, { p: "2024", n: 12, v: 9144.50 }, { p: "2025", n: 12, v: 9420.25 }, { p: "2026 Jan\u2013Mar", n: 3, v: 9702.83 }] },
    calc: { mult: 0.02, label: "2.0%", svc: 28.75, formula: "2.0% \u00d7 $10,639.45 \u00d7 28.75y", unred: 6117.68, red: 6117.68 },
    opts: { max: 6117.68, j100: { f: .885, m: 5414.15, s: 5414.15 }, j75: { f: .915, m: 5597.68, s: 4198.26 }, j50: { f: .945, m: 5781.21, s: 2890.61 } },
    ipr: { svc: 28.75, pre: 359.38, post: 179.69 }, deathBen: 5000,
    dro: { alt: "Patricia Martinez", marYrs: 18.25, pct: 40, frac: 63.48 },
    docs: { app: true, notarized: true, birthMem: true, birthSp: true, marriage: true, medicare: false, spousal: false, droOrder: true },
    appRx: "Mar 10 2026", dl30: true, cut15: true, marital: "married",
    flags: ["leave-payout", "dro"], scenario: null,
  },
};

/* ═══════════════ COMPOSITION ENGINE ═══════════════ */
function compose(ck, elections) {
  const d = CASES[ck];
  const cards = [];
  const docKeys = Object.keys(d.docs);
  const docRx = docKeys.filter(k => d.docs[k]).length;

  // S1 — Application Intake (always first, always full)
  const allReqMet = d.docs.app && d.docs.notarized && d.docs.birthMem && (d.marital !== "married" || (d.docs.birthSp && d.docs.marriage)) && (!d.dro || d.docs.droOrder);
  cards.push({
    id: "intake", sid: "SVC-RET-INTAKE", title: "Application Intake",
    icon: "\ud83d\udccb", depth: "full",
    conf: allReqMet && d.dl30 ? "ok" : "issue",
    action: "Package Complete",
    sec: ["Pend for Documents", "Flag Issue"],
    hLabel: "Documents", hVal: `${docRx}/${docKeys.length}`,
  });

  // S2 — Eligibility Verification
  const eComplex = !d.el.met || d.svc.purchased > 0;
  cards.push({
    id: "elig", sid: "SVC-RET-ELIGIBILITY", title: "Eligibility Verification",
    icon: "\u2714", depth: eComplex ? "full" : "summary",
    conf: d.el.met && d.svc.purchased === 0 ? "ok" : "att",
    action: "Eligibility Confirmed",
    sec: ["Flag Discrepancy", "Return to Intake"],
    hLabel: d.el.rule, hVal: d.el.met ? "No Reduction" : `${d.el.redPct}% Reduction`,
  });

  // S2.5 — DRO Division (conditional)
  if (d.dro) {
    cards.push({
      id: "dro", sid: "SVC-RET-DRO", title: "DRO Division",
      icon: "\u2696\ufe0f", depth: "full", conf: "att",
      action: "DRO Verified",
      sec: ["Flag for Legal Review", "Return"],
      hLabel: "Marital Share", hVal: `${d.dro.frac}%`,
    });
  }

  // S3 — Benefit Verification
  const bComplex = d.leave.amt > 0 || d.el.redPct > 0 || d.dro;
  cards.push({
    id: "benefit", sid: "SVC-RET-CALCULATION", title: "Benefit Verification",
    icon: "\ud83d\udd22", depth: bComplex ? "full" : "summary",
    conf: bComplex ? "att" : "ok",
    action: "Calculation Verified",
    sec: ["Flag Discrepancy", "Request Recalc"],
    hLabel: "Monthly Benefit", hVal: $(d.calc.red),
  });

  // S4 — Election Recording (always full, interactive)
  const payLabel = elections.pay === "max" ? "Maximum" : elections.pay === "j100" ? "100% J&S" : elections.pay === "j75" ? "75% J&S" : elections.pay === "j50" ? "50% J&S" : "Pending";
  const allElected = elections.pay && elections.death && elections.ins;
  cards.push({
    id: "elect", sid: "SVC-RET-ELECTION", title: "Election Recording",
    icon: "\ud83d\udcdd", depth: "full", conf: allElected ? "ok" : "att",
    action: "Elections Recorded",
    sec: ["Pend for Member Response", "Flag Spousal Consent"],
    hLabel: "Payment", hVal: allElected ? payLabel : "Pending",
  });

  // S5 — Submit for Supervisor Review
  cards.push({
    id: "submit", sid: "SVC-RET-REVIEW", title: "Submit for Review",
    icon: "\ud83d\udce4", depth: "full", conf: "ok",
    action: "Submit to Supervisor",
    sec: ["Return to Prior Stage"],
    hLabel: "Status", hVal: "Ready",
  });

  return cards;
}

/* ─── Tiny helpers ─── */
const Dot = ({ conf, T, sz = 8 }) => {
  const c = conf === "ok" ? T.ok : conf === "att" ? T.wa : T.dg;
  return <span style={{ width: sz, height: sz, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} />;
};

const Badge = ({ text, bg, color }) => (
  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: bg, color, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: .3 }}>{text}</span>
);

const Row = ({ label, value, T, hi, badge, sub, mono = true }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.bdS}`, gap: 8 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ color: T.t2, fontSize: 12 }}>{label}</div>
      {sub && <div style={{ color: T.t3, fontSize: 10, marginTop: 1 }}>{sub}</div>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      {badge}
      <span style={{ color: hi ? T.ac : T.tx, fontWeight: 600, fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit", fontSize: 12 }}>{value}</span>
    </div>
  </div>
);

const Alert = ({ type, title, text, T }) => {
  const c = type === "ok" ? { bg: T.okM, bd: T.okB, c: T.ok } : type === "warn" ? { bg: T.waM, bd: T.waB, c: T.wa } : type === "danger" ? { bg: T.dgM, bd: T.dgB, c: T.dg } : { bg: T.acM, bd: T.bdA + "44", c: T.ac };
  return (
    <div style={{ margin: "8px 0", padding: "7px 11px", background: c.bg, borderRadius: 7, border: `1px solid ${c.bd}` }}>
      {title && <div style={{ color: c.c, fontSize: 11, fontWeight: 700, marginBottom: 1 }}>{title}</div>}
      <div style={{ color: c.c, fontSize: 11, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
};

const Section = ({ label }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: "inherit", opacity: .5, marginTop: 10, marginBottom: 4 }}>{label}</div>
);

/* ═══════════════ STAGE CONTENT ═══════════════ */

function StageIntake({ d, T }) {
  const list = [
    { l: "Retirement Application (signed)", rx: d.docs.app, req: true },
    { l: "Notarization", rx: d.docs.notarized, req: true },
    { l: "Birth Certificate \u2014 Member", rx: d.docs.birthMem, req: true },
    { l: "Birth Certificate \u2014 Spouse/Bene", rx: d.docs.birthSp, req: d.marital === "married" },
    { l: "Marriage Certificate", rx: d.docs.marriage, req: d.marital === "married" },
    { l: "Spousal Consent at Retirement", rx: d.docs.spousal, req: false },
    { l: "Medicare Card / Entitlement Letter", rx: d.docs.medicare, req: false },
  ];
  if (d.dro) list.push({ l: "Certified DRO Court Order", rx: d.docs.droOrder, req: true });
  const reqMet = list.filter(x => x.req && x.rx).length;
  const reqTotal = list.filter(x => x.req).length;

  return (<>
    <Row T={T} label="Retirement Date" value={d.m.retDate} hi />
    <Row T={T} label="Last Day Worked" value={d.m.lastDay} />
    <Row T={T} label="Application Received" value={d.appRx} badge={<Badge text={d.dl30 ? "Within 30d" : "LATE"} bg={d.dl30 ? T.okM : T.dgM} color={d.dl30 ? T.ok : T.dg} />} />
    <Row T={T} label="Processing Cutoff" value="15th of prior month" badge={<Badge text={d.cut15 ? "On Time" : "Delayed"} bg={d.cut15 ? T.okM : T.waM} color={d.cut15 ? T.ok : T.wa} />} />

    <Section label={`Document Checklist \u2014 ${reqMet}/${reqTotal} required`} />
    {list.map((x, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0", borderBottom: `1px solid ${T.bdS}` }}>
        <span style={{ width: 17, height: 17, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800,
          background: x.rx ? T.okM : x.req ? T.dgM : T.waM,
          color: x.rx ? T.ok : x.req ? T.dg : T.wa,
          border: `1px solid ${x.rx ? T.okB : x.req ? T.dgB : T.waB}`,
        }}>{x.rx ? "\u2713" : x.req ? "!" : "\u2014"}</span>
        <span style={{ flex: 1, fontSize: 12, color: T.tx }}>{x.l}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: x.rx ? T.ok : x.req ? T.dg : T.t3 }}>{x.rx ? "Received" : x.req ? "Required" : "N/A"}</span>
      </div>
    ))}

    {reqMet === reqTotal
      ? <Alert T={T} type="ok" title="Package Complete" text={`All ${reqTotal} required documents on file.`} />
      : <Alert T={T} type="danger" title="Incomplete" text={`${reqTotal - reqMet} required document(s) missing. Cannot advance.`} />}
  </>);
}

function StageElig({ d, T, summary, onExpand }) {
  const met = <Badge text="Met" bg={T.okM} color={T.ok} />;
  const notMet = <Badge text="Not Met" bg={T.dgM} color={T.dg} />;

  if (summary) return (<>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: T.t2, marginBottom: 6 }}>
      <span>Tier <b style={{ color: T.tx }}>{d.m.tier}</b></span>
      <span>Svc <b style={{ color: T.tx }}>{d.svc.total}y</b></span>
      <span>Age <b style={{ color: T.tx }}>{d.el.age}</b></span>
      <span>{d.el.rule} <b style={{ color: T.ok }}>{d.el.sum}/{d.el.tgt} \u2713</b></span>
    </div>
    <Alert T={T} type="ok" title="Pre-verified \u2014 No Flags" text={`${d.el.rule} satisfied (${d.el.sum} \u2265 ${d.el.tgt}). Vested. No reduction. No data quality issues.`} />
    {onExpand && <button onClick={onExpand} style={{ marginTop: 4, background: "none", border: "none", color: T.ac, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>Show full detail \u2192</button>}
  </>);

  return (<>
    <Row T={T} label="Benefit Tier" value={`Tier ${d.m.tier}`} badge={<Badge text={`Tier ${d.m.tier}`} bg={d.m.tier === 1 ? T.t1m : d.m.tier === 2 ? T.t2m : T.t3m} color={d.m.tier === 1 ? T.t1c : d.m.tier === 2 ? T.t2c : T.t3c} />} sub={d.m.tier === 1 ? "Hired before Sep 2004" : d.m.tier === 2 ? "Sep 2004\u2013Jun 2011" : "On/after Jul 2011"} />
    <Row T={T} label="Vesting (5y)" value={`${d.svc.earned}y`} badge={met} />
    <Row T={T} label="Earned Service" value={`${d.svc.earned}y`} hi />
    {d.svc.purchased > 0 && <Row T={T} label="Purchased Service" value={`${d.svc.purchased}y`} badge={<Badge text="Calc Only" bg={T.waM} color={T.wa} />} sub="Excluded from Rule of 75/85 and IPR" />}
    <Row T={T} label="Total for Benefit Calc" value={`${d.svc.total}y`} />
    <Row T={T} label={d.el.rule} value={`${d.el.sum} / ${d.el.tgt}`} hi badge={d.el.met ? met : notMet} />
    {!d.el.met && <Row T={T} label="Early Retirement Reduction" value={`${d.el.redPct}%`} badge={<Badge text={`${d.el.yrs}y \u00d7 ${d.m.tier < 3 ? "3" : "6"}%`} bg={T.dgM} color={T.dg} />} />}
    {d.el.met && <Alert T={T} type="ok" title={`${d.el.rule} Satisfied`} text={`Age ${d.el.age} + Service ${d.svc.forRule} = ${d.el.sum} \u2265 ${d.el.tgt}. No reduction.`} />}
    {!d.el.met && d.scenario && <Alert T={T} type="warn" title="Threshold Proximity" text={`Age ${d.scenario.waitAge} \u2192 Rule of 75 met \u2192 no reduction \u2192 ~${$(d.scenario.benefit)}/mo (+${d.scenario.inc}). Inform member before finalizing.`} />}
    {!d.el.met && !d.scenario && <Alert T={T} type="info" text={`Early retirement: ${d.m.tier < 3 ? "3" : "6"}% \u00d7 ${d.el.yrs}y under 65 = ${d.el.redPct}% reduction. RMC \u00a718-401.`} />}
  </>);
}

function StageDRO({ d, T }) {
  if (!d.dro) return null;
  const altAmt = d.calc.red * (d.dro.frac / 100) * (d.dro.pct / 100);
  return (<>
    <Alert T={T} type="info" text="DRO split applied before payment option selection. Alternate payee benefit is independent of member\u2019s J&S election." />
    <Row T={T} label="Alternate Payee" value={d.dro.alt} mono={false} />
    <Row T={T} label="Marital Service" value={`${d.dro.marYrs} of ${d.svc.total}y`} />
    <Row T={T} label="Marital Fraction" value={`${d.dro.frac}%`} hi sub={`${d.dro.marYrs} \u00f7 ${d.svc.total}`} />
    <Row T={T} label="Award Percentage" value={`${d.dro.pct}%`} />
    <Row T={T} label="Alternate Payee Share" value={$(altAmt)} hi sub={`${d.dro.pct}% of ${d.dro.frac}% of ${$(d.calc.red)}`} />
    <Row T={T} label="Member Retains" value={$(d.calc.red - altAmt)} hi />
  </>);
}

function StageBenefit({ d, T, summary, onExpand }) {
  if (summary) return (<>
    <div style={{ padding: 10, background: T.acS, borderRadius: 8, border: `1px solid ${T.acM}`, textAlign: "center", marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: T.t3, letterSpacing: 1, textTransform: "uppercase" }}>Monthly Benefit</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: T.ac, fontFamily: "'JetBrains Mono',monospace" }}>{$(d.calc.red)}</div>
    </div>
    <div style={{ display: "flex", gap: 8, fontSize: 11, color: T.t2, flexWrap: "wrap" }}>
      <span>AMS {$(d.ams.val)}</span><span>\u00d7 {d.calc.label}</span><span>\u00d7 {d.calc.svc}y</span>
    </div>
    <Alert T={T} type="ok" title="Pre-verified" text="Salary history complete. No data quality flags. Calculation verified." />
    {onExpand && <button onClick={onExpand} style={{ marginTop: 4, background: "none", border: "none", color: T.ac, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>Show full detail \u2192</button>}
  </>);

  return (<>
    <Section label="Average Monthly Salary" />
    <Row T={T} label="AMS Window" value={`${d.ams.mo} months`} sub={d.m.tier === 3 ? "Tier 3: 60-month" : "Tier 1/2: 36-month"} />
    <Row T={T} label="Period" value={`${d.ams.start} \u2013 ${d.ams.end}`} />
    <div style={{ borderRadius: 6, border: `1px solid ${T.bdS}`, overflow: "hidden", margin: "4px 0 8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 80px", padding: "3px 8px", background: T.acM, fontSize: 10, fontWeight: 600, color: T.t3 }}>
        <span>Period</span><span style={{ textAlign: "right" }}>Mo</span><span style={{ textAlign: "right" }}>Avg/mo</span>
      </div>
      {d.ams.rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 36px 80px", padding: "3px 8px", fontSize: 11, color: T.tx, borderTop: `1px solid ${T.bdS}` }}>
          <span>{r.p}</span><span style={{ textAlign: "right", color: T.t3 }}>{r.n}</span>
          <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{$(r.v)}</span>
        </div>
      ))}
    </div>
    {d.leave.amt > 0 && <Alert T={T} type="warn" title="Leave Payout Impact" text={`+$${d.leave.amt.toLocaleString()} in final month. AMS without: ${$(d.ams.noLeave)} \u2192 with: ${$(d.ams.val)} (+${$(d.ams.val - d.ams.noLeave)})`} />}
    <Row T={T} label="AMS" value={$(d.ams.val)} hi />

    <Section label="Benefit Calculation" />
    <div style={{ padding: 12, background: T.acS, borderRadius: 8, border: `1px solid ${T.acM}`, textAlign: "center", margin: "4px 0 8px" }}>
      <div style={{ fontSize: 9, color: T.t3, letterSpacing: 1, textTransform: "uppercase" }}>Monthly Benefit</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.ac, fontFamily: "'JetBrains Mono',monospace" }}>{$(d.calc.red)}</div>
      {d.calc.unred !== d.calc.red && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Unreduced: {$(d.calc.unred)} \u00d7 {100 - d.el.redPct}%</div>}
    </div>
    <Row T={T} label="Formula" value={d.calc.formula} />
    <Row T={T} label="Multiplier" value={d.calc.label} sub="RMC \u00a718-401" />
    {d.el.redPct > 0 && <Row T={T} label="Reduction" value={`\u2212${d.el.redPct}%`} badge={<Badge text={`${d.el.yrs}y under 65`} bg={T.dgM} color={T.dg} />} />}

    <Section label="Payment Options" />
    {[
      { k: "max", l: "Maximum (Single Life)", m: d.opts.max, s: 0 },
      d.opts.j100 && { k: "j100", l: "100% Joint & Survivor", m: d.opts.j100.m, s: d.opts.j100.s },
      d.opts.j75 && { k: "j75", l: "75% Joint & Survivor", m: d.opts.j75.m, s: d.opts.j75.s },
      d.opts.j50 && { k: "j50", l: "50% Joint & Survivor", m: d.opts.j50.m, s: d.opts.j50.s },
    ].filter(Boolean).map(o => (
      <div key={o.k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.bdS}`, fontSize: 12 }}>
        <span style={{ color: T.tx, fontWeight: 500 }}>{o.l}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: T.tx }}>
          {$(o.m)}{o.s > 0 && <span style={{ color: T.t3, fontWeight: 400 }}>{" / "}{$(o.s)}</span>}
        </span>
      </div>
    ))}
  </>);
}

function StageElection({ d, T, el, setEl }) {
  const optList = [
    { k: "max", l: "Maximum (Single Life)" },
    d.opts.j100 && { k: "j100", l: "100% Joint & Survivor" },
    d.opts.j75 && { k: "j75", l: "75% Joint & Survivor" },
    d.opts.j50 && { k: "j50", l: "50% Joint & Survivor" },
  ].filter(Boolean);

  return (<>
    <Section label="Part B \u2014 Payment Option Election" />
    {optList.map(o => {
      const sel = el.pay === o.k;
      const amt = o.k === "max" ? d.opts.max : d.opts[o.k]?.m;
      return (
        <div key={o.k} onClick={() => setEl(e => ({ ...e, pay: o.k }))} style={{
          padding: "8px 11px", marginBottom: 4, borderRadius: 8, cursor: "pointer", transition: "all .15s",
          border: `1.5px solid ${sel ? T.bdA : T.bdS}`, background: sel ? T.acS : "transparent",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${sel ? T.ac : T.t4}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.ac }} />}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.tx }}>{o.l}</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: sel ? T.ac : T.tx }}>{$(amt)}</span>
          </div>
        </div>
      );
    })}
    {d.marital === "married" && el.pay === "max" && (
      <Alert T={T} type="warn" title="Spousal Consent Required" text="Married member elected Maximum. Spousal Consent at Retirement form must be on file." />
    )}

    <Section label={`Part C \u2014 Death Benefit (${$(d.deathBen)})`} />
    <div style={{ display: "flex", gap: 5 }}>
      {["50 installments", "100 installments"].map(v => (
        <div key={v} onClick={() => setEl(e => ({ ...e, death: v }))} style={{
          flex: 1, padding: "7px", borderRadius: 7, cursor: "pointer", textAlign: "center", transition: "all .15s",
          border: `1.5px solid ${el.death === v ? T.bdA : T.bdS}`, background: el.death === v ? T.acS : "transparent",
          fontSize: 12, fontWeight: 600, color: el.death === v ? T.ac : T.tx,
        }}>{v}</div>
      ))}
    </div>

    <Section label="Part G \u2014 Health Insurance (IPR)" />
    <div style={{ display: "flex", gap: 5 }}>
      {["Enrolling", "Declining"].map(v => (
        <div key={v} onClick={() => setEl(e => ({ ...e, ins: v }))} style={{
          flex: 1, padding: "7px", borderRadius: 7, cursor: "pointer", textAlign: "center", transition: "all .15s",
          border: `1.5px solid ${el.ins === v ? T.bdA : T.bdS}`, background: el.ins === v ? T.acS : "transparent",
          fontSize: 12, fontWeight: 600, color: el.ins === v ? T.ac : T.tx,
        }}>{v}</div>
      ))}
    </div>
    {el.ins === "Enrolling" && <Row T={T} label="IPR Deduction" value={`${$(d.ipr.pre)}/mo (pre-Medicare)`} sub={`${d.ipr.svc}y earned \u00d7 $12.50`} />}

    <Section label="Beneficiary Confirmation" />
    <Row T={T} label="Designated Beneficiary" value={d.bene.name} mono={false} badge={<Badge text={d.bene.rel} bg={T.acM} color={T.ac} />} />
  </>);
}

function StageSubmit({ d, T, el }) {
  const payLabel = el.pay === "max" ? "Maximum" : el.pay === "j100" ? "100% J&S" : el.pay === "j75" ? "75% J&S" : "50% J&S";
  const payAmt = el.pay === "max" ? d.opts.max : d.opts[el.pay]?.m || d.opts.max;
  return (<>
    <Section label="Case Summary" />
    <Row T={T} label="Member" value={d.m.name} mono={false} />
    <Row T={T} label="Retirement Type" value={d.el.met ? `${d.el.rule} \u2014 Unreduced` : `Early \u2014 ${d.el.redPct}% Reduction`} mono={false} />
    <Row T={T} label="Monthly Benefit" value={$(d.calc.red)} hi />
    <Row T={T} label="Payment Option" value={payLabel} mono={false} />
    <Row T={T} label="Elected Amount" value={$(payAmt)} hi />
    <Row T={T} label="Death Benefit" value={`${$(d.deathBen)} \u2014 ${el.death || "\u2014"}`} mono={false} />
    <Row T={T} label="Insurance" value={el.ins || "\u2014"} mono={false} />
    {el.ins === "Enrolling" && <Row T={T} label="IPR" value={`${$(d.ipr.pre)}/mo`} />}
    <Row T={T} label="Beneficiary" value={`${d.bene.name} (${d.bene.rel})`} mono={false} />
    {d.dro && <Row T={T} label="DRO Payee" value={`${d.dro.alt} \u2014 ${$(d.calc.red * d.dro.frac / 100 * d.dro.pct / 100)}/mo`} mono={false} />}
    <Alert T={T} type="ok" title="Ready for Supervisor" text="All stages verified. Elections recorded. Documents complete. Will route to supervisor queue." />
  </>);
}

/* ─── Card content dispatcher ─── */
function CardContent({ card, d, T, el, setEl, forceDepth, onExpand }) {
  const depth = forceDepth || card.depth;
  switch (card.id) {
    case "intake":  return <StageIntake d={d} T={T} />;
    case "elig":    return <StageElig d={d} T={T} summary={depth === "summary"} onExpand={onExpand} />;
    case "dro":     return <StageDRO d={d} T={T} />;
    case "benefit": return <StageBenefit d={d} T={T} summary={depth === "summary"} onExpand={onExpand} />;
    case "elect":   return <StageElection d={d} T={T} el={el} setEl={setEl} />;
    case "submit":  return <StageSubmit d={d} T={T} el={el} />;
    default: return null;
  }
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function NoUIWorkflowEngine() {
  const [theme, setTheme] = useState("dark");
  const [ck, setCk] = useState("case1");
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(null);
  const [mode, setMode] = useState("guided"); // guided | expert
  const [expanded, setExpanded] = useState({}); // card.id -> true for summary cards force-expanded
  const [el, setEl] = useState({ pay: "j75", death: "100 installments", ins: "Enrolling" });

  const T = TH[theme];
  const d = CASES[ck];
  const cards = compose(ck, el);
  const tc = d.m.tier === 1 ? T.t1c : d.m.tier === 2 ? T.t2c : T.t3c;
  const tm = d.m.tier === 1 ? T.t1m : d.m.tier === 2 ? T.t2m : T.t3m;

  useEffect(() => { setStep(0); setAnim(null); setExpanded({}); setEl({ pay: ck === "case2" ? "max" : "j75", death: "100 installments", ins: "Enrolling" }); }, [ck]);

  const go = useCallback((dir) => {
    const next = step + dir;
    if (next < 0 || next >= cards.length || anim) return;
    setAnim("exit");
    setTimeout(() => { setStep(next); setAnim("enter"); setTimeout(() => setAnim(null), 320); }, 280);
  }, [step, cards.length, anim]);

  const jump = useCallback((i) => {
    if (i === step || anim || i < 0 || i >= cards.length) return;
    setAnim("exit");
    setTimeout(() => { setStep(i); setAnim("enter"); setTimeout(() => setAnim(null), 320); }, 280);
  }, [step, anim, cards.length]);

  useEffect(() => {
    const fn = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else { const n = parseInt(e.key); if (n >= 1 && n <= cards.length) { e.preventDefault(); jump(n - 1); } }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [go, jump, cards.length]);

  const active = cards[step];
  const upcoming = cards.slice(step + 1, step + 4);
  const completed = cards.slice(0, step);

  const confColor = c => c === "ok" ? T.ok : c === "att" ? T.wa : T.dg;
  const confLabel = c => c === "ok" ? "Pre-verified" : c === "att" ? "Needs Review" : "Issue Found";

  /* ═══ EXPERT MODE (scrollable) ═══ */
  if (mode === "expert") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Source Sans 3','Segoe UI',sans-serif", color: T.tx }}>
        <Fonts />
        <Header T={T} theme={theme} setTheme={setTheme} mode={mode} setMode={setMode} />
        <MemberBanner T={T} d={d} ck={ck} setCk={setCk} tc={tc} tm={tm} />
        <StatusBar T={T} d={d} active={active} />

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px" }}>
          {cards.map((card, i) => {
            const isExpanded = expanded[card.id];
            const effectiveDepth = isExpanded ? "full" : card.depth;
            return (
              <div key={card.id} style={{ marginBottom: 12, background: T.sf, borderRadius: 10, border: `1px solid ${i === step ? T.bdA : T.bd}`, boxShadow: i === step ? `0 0 0 1px ${T.bdA}` : "none", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.bd}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => jump(i)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Dot conf={i < step ? "ok" : card.conf} T={T} sz={9} />
                    <span style={{ fontSize: 15 }}>{card.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Plus Jakarta Sans'", color: T.tx }}>{card.title}</span>
                    <span style={{ fontSize: 10, color: T.t3 }}>{card.sid}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i < step && <Badge text="\u2713 Done" bg={T.okM} color={T.ok} />}
                    {i > step && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: confColor(card.conf) }}>{card.hVal}</span>}
                  </div>
                </div>
                <div style={{ padding: "10px 16px" }}>
                  <CardContent card={card} d={d} T={T} el={el} setEl={setEl} forceDepth={effectiveDepth} onExpand={() => setExpanded(x => ({ ...x, [card.id]: true }))} />
                </div>
                <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {card.sec.map(s => (
                      <button key={s} style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${s.includes("Flag") || s.includes("Return") ? T.dgB : T.bd}`,
                        background: s.includes("Flag") || s.includes("Return") ? T.btnDBg : T.btnSBg,
                        color: s.includes("Flag") || s.includes("Return") ? T.btnDTx : T.btnSTx,
                      }}>{s}</button>
                    ))}
                  </div>
                  <button style={{ padding: "5px 16px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: T.btnBg, color: T.btnTx }}>{card.action} \u2713</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══ GUIDED MODE (card-stack) ═══ */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Source Sans 3','Segoe UI',sans-serif", color: T.tx }}>
      <Fonts />
      <Header T={T} theme={theme} setTheme={setTheme} mode={mode} setMode={setMode} />
      <MemberBanner T={T} d={d} ck={ck} setCk={setCk} tc={tc} tm={tm} />
      <StatusBar T={T} d={d} active={active} />

      {/* Completed chips */}
      {completed.length > 0 && (
        <div style={{ padding: "6px 20px", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {completed.map((c, i) => (
            <button key={c.id} onClick={() => jump(i)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, cursor: "pointer", border: "none", background: T.okM, fontSize: 10, fontWeight: 500, color: T.t2 }}>
              <Dot conf="ok" T={T} sz={5} />
              <span style={{ color: T.ok, fontWeight: 700 }}>\u2713</span> {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Card stack workspace */}
      <div style={{ padding: "14px 20px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

          {/* ─── ACTIVE CARD (70%) ─── */}
          <div style={{ flex: upcoming.length > 0 ? "0 0 70%" : "1 1 100%", minWidth: 0, position: "relative", zIndex: 10 }}>
            <div key={step} style={{ animation: anim === "enter" ? "noui-in .32s ease-out" : "none" }}>
              <div style={{ background: T.sf, borderRadius: 12, border: `1px solid ${T.bd}`, boxShadow: T.sh, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "11px 16px", borderBottom: `1px solid ${T.bd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Dot conf={active.conf} T={T} sz={10} />
                    <span style={{ fontSize: 16 }}>{active.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Plus Jakarta Sans'", color: T.tx }}>{active.title}</div>
                      <div style={{ fontSize: 10, color: T.t3 }}>{active.sid} \u00b7 Step {step + 1}/{cards.length}</div>
                    </div>
                  </div>
                  {/* Step pips */}
                  <div style={{ display: "flex", gap: 3 }}>
                    {cards.map((c, i) => (
                      <div key={i} onClick={() => jump(i)} style={{ width: i === step ? 18 : 6, height: 5, borderRadius: 3, cursor: "pointer", background: i < step ? T.ok : i === step ? T.ac : T.bdS, transition: "all .25s" }} />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "12px 16px", maxHeight: 470, overflowY: "auto" }}>
                  <CardContent card={active} d={d} T={T} el={el} setEl={setEl}
                    forceDepth={expanded[active.id] ? "full" : undefined}
                    onExpand={() => setExpanded(x => ({ ...x, [active.id]: true }))} />
                </div>

                {/* Footer — SPECIFIC ACTIONS (F-3) */}
                <div style={{ padding: "9px 16px", borderTop: `1px solid ${T.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {step > 0 && <button onClick={() => go(-1)} style={{ padding: "6px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.bd}`, background: "transparent", color: T.t2 }}>\u2190 Back</button>}
                    {active.sec.map(s => (
                      <button key={s} style={{
                        padding: "6px 11px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${s.includes("Flag") || s.includes("Return") ? T.dgB : T.bd}`,
                        background: s.includes("Flag") || s.includes("Return") ? T.btnDBg : T.btnSBg,
                        color: s.includes("Flag") || s.includes("Return") ? T.btnDTx : T.btnSTx,
                      }}>{s}</button>
                    ))}
                  </div>
                  <button onClick={() => go(1)} style={{
                    padding: "7px 18px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: "none", background: T.btnBg, color: T.btnTx,
                    opacity: step >= cards.length - 1 ? .65 : 1,
                  }}>
                    {active.action} {step < cards.length - 1 ? "\u2192" : "\u2713"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── PREVIEW STACK (30%) — Confidence signals (F-5) ─── */}
          {upcoming.length > 0 && (
            <div style={{ flex: "1 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((card, i) => {
                const cc = confColor(card.conf);
                const cl = confLabel(card.conf);
                // Preview with rendered content scaled to ~30%
                return (
                  <div key={card.id} onClick={() => jump(step + 1 + i)} style={{
                    position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer",
                    border: `1px solid ${T.bdS}`, boxShadow: "0 4px 14px rgba(0,0,0,.08)",
                    height: 150, transition: "transform .2s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    {/* Rendered content at 640px width, scaled down */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: 640, transformOrigin: "top left", transform: "scale(0.34)", overflow: "hidden", pointerEvents: "none" }}>
                      <div style={{ background: T.sf, padding: "12px 16px" }}>
                        <CardContent card={card} d={d} T={T} el={el} setEl={() => {}} />
                      </div>
                    </div>

                    {/* Overlay with confidence signal */}
                    <div style={{ position: "absolute", inset: 0, background: T.pvO, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
                      <div style={{ background: T.pvT, padding: "7px 14px", borderRadius: 7, textAlign: "center", backdropFilter: "blur(6px)", border: `1px solid ${T.bdS}`, minWidth: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", marginBottom: 3 }}>
                          <Dot conf={card.conf} T={T} sz={7} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: T.tx }}>{card.title}</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 800, color: cc }}>{card.hVal}</div>
                        <div style={{ fontSize: 9, color: T.t3, marginTop: 2, fontWeight: 500 }}>{cl}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <span style={{ fontSize: 10, color: T.t4 }}>\u2190\u2192 navigate \u00b7 1\u2013{cards.length} jump \u00b7 click previews to skip ahead</span>
        </div>
      </div>

      <style>{`
        @keyframes noui-in {
          0%   { transform: scale(.93) translateX(24px); opacity: .2; }
          100% { transform: scale(1) translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Shared chrome components ─── */
function Fonts() {
  return <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />;
}

function Header({ T, theme, setTheme, mode, setMode }) {
  return (
    <div style={{ padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bd}`, background: T.sf }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: T.ac, fontFamily: "'Plus Jakarta Sans'" }}>NoUI</span>
        <div style={{ width: 1, height: 14, background: T.bd }} />
        <span style={{ fontSize: 11, color: T.t3 }}>Service Retirement</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Mode toggle (F-6) */}
        <div style={{ display: "flex", borderRadius: 6, border: `1px solid ${T.bd}`, overflow: "hidden" }}>
          {["guided", "expert"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "3px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none",
              background: mode === m ? T.acM : "transparent", color: mode === m ? T.ac : T.t3,
              textTransform: "capitalize",
            }}>{m}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 14, background: T.bd }} />
        {Object.entries(TH).map(([k, v]) => (
          <button key={k} onClick={() => setTheme(k)} style={{
            padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
            border: theme === k ? `1.5px solid ${T.ac}` : `1px solid ${T.bd}`,
            background: theme === k ? T.acM : "transparent", color: theme === k ? T.ac : T.t3,
          }}>{v.n}</button>
        ))}
      </div>
    </div>
  );
}

function MemberBanner({ T, d, ck, setCk, tc, tm }) {
  const flagStyles = { "leave-payout": { bg: T.waM, c: T.wa, l: "LEAVE" }, "dro": { bg: T.waM, c: T.wa, l: "DRO" }, "early-retirement": { bg: T.dgM, c: T.dg, l: "EARLY" }, "purchased-service": { bg: T.waM, c: T.wa, l: "PURCH SVC" } };
  return (
    <div style={{ padding: "7px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.el, borderBottom: `1px solid ${T.bd}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: tm, border: `2px solid ${tc}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: tc }}>
          {d.m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: T.tx }}>{d.m.name}</span>
        <span style={{ fontSize: 10, color: T.t3 }}>{d.m.id}</span>
        <Badge text={`T${d.m.tier}`} bg={tm} color={tc} />
        {d.flags.map(f => { const s = flagStyles[f]; return s ? <Badge key={f} text={s.l} bg={s.bg} color={s.c} /> : null; })}
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Object.keys(CASES).map(k => (
          <button key={k} onClick={() => setCk(k)} style={{
            padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 500, cursor: "pointer",
            border: ck === k ? `1.5px solid ${T.ac}` : `1px solid ${T.bd}`,
            background: ck === k ? T.acM : "transparent", color: ck === k ? T.ac : T.t3,
          }}>{k === "case4" ? "4 DRO" : k.slice(-1)}</button>
        ))}
      </div>
    </div>
  );
}

function StatusBar({ T, d, active }) {
  return (
    <div style={{ padding: "5px 20px", display: "flex", gap: 14, alignItems: "center", background: T.stBg, borderBottom: `1px solid ${T.bdS}`, fontSize: 10 }}>
      <span style={{ color: T.t3 }}>Stage <b style={{ color: T.ac }}>{active.sid}</b></span>
      <span style={{ color: T.t3 }}>Received <b style={{ color: T.tx }}>{d.appRx}</b></span>
      <span style={{ color: T.t3 }}>Effective <b style={{ color: T.tx }}>{d.m.retDate}</b></span>
      <span style={{ color: T.t3 }}>Assigned <b style={{ color: T.tx }}>Current User</b></span>
      <span style={{ color: T.t3 }}>Routes to <b style={{ color: T.t2 }}>Supervisor Queue</b></span>
    </div>
  );
}
