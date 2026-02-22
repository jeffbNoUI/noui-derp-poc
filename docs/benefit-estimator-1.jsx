import { useState, useEffect, useCallback } from "react";

const colors = {
  bg: "#0B1017", surface: "#131C27", elevated: "#1A2736",
  border: "#243447", borderSubtle: "#1B2D40",
  accent: "#22D3EE", accentMuted: "rgba(34,211,238,0.10)", accentGlow: "rgba(34,211,238,0.20)", accentSolid: "rgba(34,211,238,0.15)",
  warm: "#F59E0B", warmMuted: "rgba(245,158,11,0.10)", warmBorder: "rgba(245,158,11,0.25)",
  danger: "#EF4444", dangerMuted: "rgba(239,68,68,0.10)", dangerBorder: "rgba(239,68,68,0.25)",
  success: "#10B981", successMuted: "rgba(16,185,129,0.10)", successBorder: "rgba(16,185,129,0.25)",
  text: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B", textDim: "#475569",
  tier1: "#3B82F6", tier1Muted: "rgba(59,130,246,0.12)",
  tier2: "#F59E0B", tier2Muted: "rgba(245,158,11,0.12)",
  tier3: "#10B981", tier3Muted: "rgba(16,185,129,0.12)",
};
const tierMeta = {
  1: { main: colors.tier1, muted: colors.tier1Muted, label: "Tier 1", sub: "Pre-2004" },
  2: { main: colors.tier2, muted: colors.tier2Muted, label: "Tier 2", sub: "2004-2011" },
  3: { main: colors.tier3, muted: colors.tier3Muted, label: "Tier 3", sub: "Post-2011" },
};
const fmt = (n) => n != null ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

const CASES = {
  case1: {
    member: { id: "M-100001", name: "Robert Martinez", retDate: "2026-04-01", tier: 1, dept: "Public Works" },
    beneficiary: { name: "Elena Martinez", rel: "Spouse" },
    service: { earned: 28.75, purchased: 0, total: 28.75, forRule: 28.75 },
    elig: { age: 63, ruleType: "Rule of 75", ruleSum: 91.75, target: 75, met: true, minAge: 55, redPct: 0, factor: 1.0, yrsU65: 2 },
    leave: { eligible: true, amount: 52000 },
    ams: { months: 36, start: "Apr 2023", end: "Mar 2026", base: 331020.24, total: 383020.24, ams: 10639.45, noP: 9194.45,
      rows: [{ p:"2023 (Apr-Dec)",m:9,s:8792.75},{p:"2024 (Jan-Dec)",m:12,s:9144.50},{p:"2025 (Jan-Dec)",m:12,s:9420.25},{p:"2026 (Jan-Mar)",m:3,s:9702.83}] },
    ben: { mult: 0.02, mL: "2.0%", svc: 28.75, form: "2.0% x $10,639.45 x 28.75", unred: 6117.68, red: 6117.68 },
    opts: { max: 6117.68, js100:{f:0.8850,mo:5414.15,sv:5414.15}, js75:{f:0.9150,mo:5597.68,sv:4198.26}, js50:{f:0.9450,mo:5781.21,sv:2890.61}, elected:"js75" },
    ipr: { svc: 28.75, pre: 359.38, post: 179.69 },
    dro: null, scenario: null, flags: ["leave-payout"],
    label: "Tier 1 | Rule of 75 | Leave Payout",
  },
  case2: {
    member: { id: "M-100002", name: "Jennifer Kim", retDate: "2026-05-01", tier: 2, dept: "Finance" },
    beneficiary: { name: "Estate", rel: "Estate" },
    service: { earned: 18.17, purchased: 3.00, total: 21.17, forRule: 18.17 },
    elig: { age: 55, ruleType: "Rule of 75", ruleSum: 73.17, target: 75, met: false, minAge: 55, redPct: 60, factor: 0.40, yrsU65: 10 },
    leave: { eligible: true, amount: 0 },
    ams: { months: 36, start: "May 2023", end: "Apr 2026", base: 264514.32, total: 264514.32, ams: 7347.62, noP: 7347.62,
      rows: [{ p:"2023 (May-Dec)",m:8,s:7007.42},{p:"2024 (Jan-Dec)",m:12,s:7287.75},{p:"2025 (Jan-Dec)",m:12,s:7506.33},{p:"2026 (Jan-Apr)",m:4,s:7731.50}] },
    ben: { mult: 0.015, mL: "1.5%", svc: 21.17, form: "1.5% x $7,347.62 x 21.17", unred: 2332.96, red: 933.18 },
    opts: { max: 933.18, js100:null, js75:null, js50:null, elected:"max" },
    ipr: { svc: 18.17, pre: 227.13, post: 113.56 },
    dro: null,
    scenario: { waitDate:"May 2028", waitAge:57, benefit:2711.00, mult:"~3x", met:true, sum:77.17 },
    flags: ["early-retirement","purchased-service"],
    label: "Tier 2 | Purchased Svc | 60% Reduction",
  },
  case3: {
    member: { id: "M-100003", name: "David Washington", retDate: "2026-04-01", tier: 3, dept: "Parks & Rec" },
    beneficiary: { name: "Michelle Washington", rel: "Spouse" },
    service: { earned: 13.58, purchased: 0, total: 13.58, forRule: 13.58 },
    elig: { age: 63, ruleType: "Rule of 85", ruleSum: 76.58, target: 85, met: false, minAge: 60, redPct: 12, factor: 0.88, yrsU65: 2 },
    leave: { eligible: false, amount: 0 },
    ams: { months: 60, start: "Apr 2021", end: "Mar 2026", base: 401071.20, total: 401071.20, ams: 6684.52, noP: 6684.52,
      rows: [{ p:"2021 (Apr-Dec)",m:9,s:6250.00},{p:"2022 (Jan-Dec)",m:12,s:6437.50},{p:"2023 (Jan-Dec)",m:12,s:6695.00},{p:"2024 (Jan-Dec)",m:12,s:6962.80},{p:"2025 (Jan-Dec)",m:12,s:7171.67},{p:"2026 (Jan-Mar)",m:3,s:7386.82}] },
    ben: { mult: 0.015, mL: "1.5%", svc: 13.58, form: "1.5% x $6,684.52 x 13.58", unred: 1361.40, red: 1198.03 },
    opts: { max: 1198.03, js100:{f:0.8850,mo:1060.26,sv:1060.26}, js75:{f:0.9050,mo:1084.22,sv:813.17}, js50:{f:0.9350,mo:1132.14,sv:566.07}, elected:"js50" },
    ipr: { svc: 13.58, pre: 169.75, post: 84.88 },
    dro: null,
    scenario: { waitDate:"Apr 2028", waitAge:65, benefit:1535.00, mult:null, met:false, note:"Normal retirement at 65 — no reduction regardless of Rule of 85" },
    flags: ["early-retirement"],
    label: "Tier 3 | 60-Mo AMS | Rule of 85 | 12% Reduction",
  },
  case4: {
    member: { id: "M-100001", name: "Robert Martinez", retDate: "2026-04-01", tier: 1, dept: "Public Works" },
    beneficiary: { name: "Elena Martinez", rel: "Spouse" },
    service: { earned: 28.75, purchased: 0, total: 28.75, forRule: 28.75 },
    elig: { age: 63, ruleType: "Rule of 75", ruleSum: 91.75, target: 75, met: true, minAge: 55, redPct: 0, factor: 1.0, yrsU65: 2 },
    leave: { eligible: true, amount: 52000 },
    ams: { months: 36, start: "Apr 2023", end: "Mar 2026", base: 331020.24, total: 383020.24, ams: 10639.45, noP: 9194.45,
      rows: [{ p:"2023 (Apr-Dec)",m:9,s:8792.75},{p:"2024 (Jan-Dec)",m:12,s:9144.50},{p:"2025 (Jan-Dec)",m:12,s:9420.25},{p:"2026 (Jan-Mar)",m:3,s:9702.83}] },
    ben: { mult: 0.02, mL: "2.0%", svc: 28.75, form: "2.0% x $10,639.45 x 28.75", unred: 6117.68, red: 6117.68 },
    opts: { max: 6117.68, js100:{f:0.8850,mo:5414.15,sv:5414.15}, js75:{f:0.9150,mo:5597.68,sv:4198.26}, js50:{f:0.9450,mo:5781.21,sv:2890.61}, elected:"js75" },
    ipr: { svc: 28.75, pre: 359.38, post: 179.69 },
    dro: { former:"Patricia Martinez", marriage:"Aug 15, 1999", divorce:"Nov 3, 2017",
      svcM:18.25, frac:0.6348, mShare:3883.10, pct:0.40, alt:1553.24, after:4564.44,
      postJs75:{f:0.9150,mo:4176.46,sv:3132.35}, elected:4176.46, loss:1421.22 },
    scenario: null, flags: ["leave-payout","dro"],
    label: "Tier 1 | Rule of 75 | Leave Payout | DRO",
  },
};

function Badge({text,color,bg}){return <span style={{display:"inline-block",fontSize:"9.5px",padding:"2px 7px",borderRadius:"99px",background:bg,color,fontWeight:600,letterSpacing:"0.4px",textTransform:"uppercase",lineHeight:"15px",whiteSpace:"nowrap"}}>{text}</span>}

function Field({label,value,highlight,badge,sub}){
  return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${colors.borderSubtle}`}}>
    <div><span style={{color:colors.textSecondary,fontSize:"12.5px"}}>{label}</span>
    {sub&&<div style={{color:colors.textMuted,fontSize:"10.5px",marginTop:"1px"}}>{sub}</div>}</div>
    <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
      {badge&&<Badge {...badge}/>}
      <span style={{color:highlight?colors.accent:colors.text,fontWeight:600,fontFamily:"'SF Mono',monospace",fontSize:"12.5px",textShadow:highlight?`0 0 14px ${colors.accentGlow}`:"none"}}>{value}</span>
    </span></div>)
}

function Callout({type="info",title,children}){
  const s={info:{bg:colors.accentMuted,bd:colors.accentSolid,c:colors.accent,i:"i"},success:{bg:colors.successMuted,bd:colors.successBorder,c:colors.success,i:"✓"},warning:{bg:colors.warmMuted,bd:colors.warmBorder,c:colors.warm,i:"⚠"},danger:{bg:colors.dangerMuted,bd:colors.dangerBorder,c:colors.danger,i:"!"}}[type];
  return(<div style={{padding:"9px 12px",background:s.bg,borderRadius:"7px",border:`1px solid ${s.bd}`,marginTop:"8px"}}>
    {title&&<div style={{color:s.c,fontSize:"11px",fontWeight:600,marginBottom:"3px"}}>{s.i} {title}</div>}
    <div style={{color:colors.text,fontSize:"11.5px",lineHeight:"1.5"}}>{children}</div></div>)
}

function buildSteps(c){
  const tc=tierMeta[c.member.tier]; const e=c.elig; const steps=[];

  steps.push({id:"confirm",label:"Confirm Retirement",icon:"📋",desc:"Verify retirement date and type",
    preview:`Age ${e.age} · ${c.service.total}y · ${e.ruleType}: ${e.ruleSum}`,
    content:(<div>
      <Field label="Retirement Date" value={c.member.retDate} highlight/>
      <Field label="Type" value="Service Retirement"/>
      <Field label="Age at Retirement" value={`${e.age} years`}/>
      <Field label="Years of Service" value={`${c.service.total} years`}/>
      <Field label={e.ruleType} value={e.ruleSum.toFixed(2)} highlight badge={{text:e.met?"Met":"Not Met",bg:e.met?colors.successMuted:colors.dangerMuted,color:e.met?colors.success:colors.danger}}/>
      <Field label="Reduction" value={e.redPct===0?"None":`${e.redPct}%`} badge={e.redPct>0?{text:`${e.yrsU65}y under 65`,bg:colors.dangerMuted,color:colors.danger}:null}/>
      {e.met?<Callout type="success" title={`${e.ruleType} Satisfied`}>Age {e.age} + Service {c.service.forRule} = {e.ruleSum.toFixed(2)} ≥ {e.target}. No reduction.</Callout>
        :<Callout type="danger" title="Early Retirement Reduction">{e.yrsU65} years × 6%/yr = {e.redPct}% reduction. Member receives {100-e.redPct}% of calculated benefit.</Callout>}
    </div>)});

  steps.push({id:"eligibility",label:"Eligibility",icon:"✓",desc:"Full eligibility determination",
    preview:`${tc.label} · Vested · ${e.met?"No reduction":e.redPct+"% reduction"}`,
    content:(<div>
      <Field label="Tier" value={tc.label} badge={{text:tc.sub,bg:tc.muted,color:tc.main}}/>
      <Field label="Vested" value={`Yes — ${c.service.earned}y earned`} badge={{text:"Met",bg:colors.successMuted,color:colors.success}}/>
      {c.service.purchased>0&&<Field label="Purchased Service" value={`${c.service.purchased} years`} sub="Included in benefit, excluded from eligibility" badge={{text:"Excluded",bg:colors.warmMuted,color:colors.warm}}/>}
      <Field label={e.ruleType} value={`${e.ruleSum.toFixed(2)} ${e.met?"≥":"<"} ${e.target}`} highlight={e.met} badge={{text:e.met?"Met":"Not Met",bg:e.met?colors.successMuted:colors.dangerMuted,color:e.met?colors.success:colors.danger}}/>
      <Field label={`Min Age (${e.minAge})`} value={`${e.age} — Met`} badge={{text:"Met",bg:colors.successMuted,color:colors.success}}/>
      <Field label="Benefit Reduction" value={e.redPct===0?"0%":`${e.redPct}%`} highlight={e.redPct===0}/>
      <Field label="Leave Payout" value={c.leave.eligible?(c.leave.amount>0?`Yes — ${fmt(c.leave.amount)}`:"Eligible — none claimed"):"Not eligible"} sub={c.leave.eligible?"Hired before Jan 1, 2010":"Hired after Jan 1, 2010"}/>
      {c.service.purchased>0&&<Callout type="warning" title="Purchased Service Exclusion">If counted: {e.age} + {c.service.total} = {(e.age+c.service.total).toFixed(2)} — would qualify. Per RMC §18-407, excluded.</Callout>}
    </div>)});

  if(c.service.purchased>0){
    const wo=+(c.ams.ams*c.ben.mult*c.service.earned*e.factor).toFixed(2);
    steps.push({id:"purchased",label:"Purchased Service",icon:"📎",desc:"Impact on benefit vs eligibility",
      preview:`${c.service.purchased}y purchased — benefit +${fmt(c.ben.red-wo)}/mo`,
      content:(<div>
        <Field label="Earned Service" value={`${c.service.earned} years`}/>
        <Field label="Purchased" value={`${c.service.purchased} years`} badge={{text:"RMC §18-407",bg:colors.warmMuted,color:colors.warm}}/>
        <Field label="Total for Benefit" value={`${c.service.total} years`} highlight/>
        <Field label={`Total for ${e.ruleType}`} value={`${c.service.forRule} years`} badge={{text:"Excluded",bg:colors.dangerMuted,color:colors.danger}}/>
        <div style={{marginTop:"10px",borderRadius:"7px",overflow:"hidden",border:`1px solid ${colors.borderSubtle}`}}>
          <div style={{padding:"7px 10px",background:colors.elevated,fontSize:"10px",fontWeight:600,color:colors.textSecondary,textTransform:"uppercase",letterSpacing:"1px"}}>Impact Analysis</div>
          {[{l:"Without purchased",v:fmt(wo),c:colors.textSecondary},{l:"With purchased",v:fmt(c.ben.red),c:colors.accent},{l:"Additional",v:`+${fmt(c.ben.red-wo)}`,c:colors.success}].map(r=>
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",borderTop:`1px solid ${colors.borderSubtle}`,fontSize:"11.5px"}}>
              <span style={{color:colors.text}}>{r.l}</span><span style={{color:r.c,fontFamily:"monospace",fontWeight:600}}>{r.v}</span></div>)}
        </div>
      </div>)});
  }

  steps.push({id:"salary",label:"Salary & AMS",icon:"💰",desc:`${c.ams.months}-month AMS window`,
    preview:`AMS ${fmt(c.ams.ams)}/mo${c.leave.amount>0?" — leave payout impact":""} · ${c.ams.months}-mo`,
    content:(<div>
      <Field label="AMS Window" value={`${c.ams.months} consecutive months`} sub={c.member.tier===3?"Tier 3: 60-month (vs 36 for Tier 1/2)":null} badge={c.member.tier===3?{text:"60 months",bg:colors.tier3Muted,color:colors.tier3}:null}/>
      <Field label="Period" value={`${c.ams.start} — ${c.ams.end}`} highlight/>
      <div style={{margin:"8px 0",borderRadius:"7px",overflow:"hidden",border:`1px solid ${colors.borderSubtle}`}}>
        <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.8fr 1.2fr 1.2fr",padding:"6px 10px",background:colors.elevated,fontSize:"9.5px",textTransform:"uppercase",letterSpacing:"0.8px",color:colors.textMuted,fontWeight:600}}>
          <span>Period</span><span style={{textAlign:"right"}}>Mo</span><span style={{textAlign:"right"}}>Monthly</span><span style={{textAlign:"right"}}>Subtotal</span></div>
        {c.ams.rows.map((r,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"2.2fr 0.8fr 1.2fr 1.2fr",padding:"5px 10px",fontSize:"11px",borderTop:`1px solid ${colors.borderSubtle}`,background:i===c.ams.rows.length-1&&c.leave.amount>0?colors.warmMuted:"transparent"}}>
          <span style={{color:colors.text}}>{r.p}</span>
          <span style={{textAlign:"right",color:colors.textSecondary,fontFamily:"monospace"}}>{r.m}</span>
          <span style={{textAlign:"right",color:colors.text,fontFamily:"monospace"}}>{fmt(r.s)}</span>
          <span style={{textAlign:"right",color:colors.textSecondary,fontFamily:"monospace"}}>{fmt(r.m*r.s)}</span></div>)}
        {c.leave.amount>0&&<div style={{display:"grid",gridTemplateColumns:"2.2fr 0.8fr 1.2fr 1.2fr",padding:"5px 10px",fontSize:"11px",borderTop:`1px solid ${colors.warmBorder}`,background:colors.warmMuted}}>
          <span style={{color:colors.warm,fontWeight:600}}>+ Leave Payout</span><span/><span/>
          <span style={{textAlign:"right",color:colors.warm,fontFamily:"monospace",fontWeight:600}}>+{fmt(c.leave.amount)}</span></div>}
        <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.8fr 1.2fr 1.2fr",padding:"6px 10px",fontSize:"11px",background:colors.elevated,borderTop:`1px solid ${colors.border}`,fontWeight:600}}>
          <span style={{color:colors.text}}>Total</span><span style={{textAlign:"right",color:colors.textSecondary,fontFamily:"monospace"}}>{c.ams.months}</span><span/>
          <span style={{textAlign:"right",color:colors.accent,fontFamily:"monospace"}}>{fmt(c.ams.total)}</span></div>
      </div>
      <Field label={`÷ ${c.ams.months} months`} value={fmt(c.ams.ams)} highlight/>
      {c.leave.amount>0&&<Callout type="warning" title="Leave Payout Impact">{fmt(c.leave.amount)} added to final month. Without: {fmt(c.ams.noP)} → With: {fmt(c.ams.ams)} (+{fmt(c.ams.ams-c.ams.noP)}/mo)</Callout>}
    </div>)});

  steps.push({id:"benefit",label:"Benefit Calculation",icon:"🔢",desc:`${tc.label} — ${c.ben.mL} multiplier`,
    preview:`${fmt(c.ben.red)}/mo${e.redPct>0?` (after ${e.redPct}% reduction)`:""}`,
    content:(<div>
      <div style={{padding:"14px",background:colors.accentMuted,borderRadius:"8px",border:`1px solid ${colors.accentSolid}`,textAlign:"center",marginBottom:"10px"}}>
        <div style={{color:colors.textMuted,fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px"}}>{c.ben.mL} × AMS × Years of Service</div>
        <div style={{color:colors.accent,fontSize:"28px",fontWeight:700,fontFamily:"monospace",marginTop:"6px",textShadow:`0 0 30px ${colors.accentGlow}`}}>{fmt(c.ben.red)}/mo</div>
        <div style={{color:colors.textSecondary,fontSize:"11px",marginTop:"4px",fontFamily:"monospace"}}>{c.ben.form}</div>
        {e.redPct>0&&<div style={{color:colors.danger,fontSize:"10px",marginTop:"4px",fontWeight:600}}>After {e.redPct}% early retirement reduction</div>}
      </div>
      <Field label="Multiplier" value={`${c.ben.mL} (${tc.label})`} sub="RMC §18-401"/>
      <Field label="AMS" value={fmt(c.ams.ams)}/>
      <Field label="Service (for benefit)" value={`${c.ben.svc} years`}/>
      <Field label="Unreduced Benefit" value={fmt(c.ben.unred)}/>
      {e.redPct>0&&<>
        <Field label="Reduction" value={`× ${e.factor.toFixed(2)} (−${e.redPct}%)`} badge={{text:`−${fmt(c.ben.unred-c.ben.red)}/mo`,bg:colors.dangerMuted,color:colors.danger}}/>
        <Field label="Reduced Benefit" value={fmt(c.ben.red)} highlight/>
        <Callout type="danger" title="Reduction Impact">
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
            {[{l:"Unreduced",v:fmt(c.ben.unred),cl:colors.text},{l:"Lost",v:`-${fmt(c.ben.unred-c.ben.red)}`,cl:colors.danger},{l:"Actual",v:fmt(c.ben.red),cl:colors.accent}].map(x=>
              <div key={x.l} style={{textAlign:"center",flex:1}}><div style={{color:colors.textMuted,fontSize:"9px",textTransform:"uppercase"}}>{x.l}</div>
                <div style={{color:x.cl,fontSize:"15px",fontFamily:"monospace",fontWeight:600}}>{x.v}</div></div>)}
          </div></Callout></>}
      {e.redPct===0&&<Callout type="success" title="No Reduction">{e.ruleType} met — 100% of calculated benefit.</Callout>}
      <Field label="Annual Benefit" value={fmt(c.ben.red*12)}/>
    </div>)});

  if(c.dro){const d=c.dro;
    steps.push({id:"dro",label:"DRO Impact",icon:"⚖️",desc:`${d.former} — ${(d.frac*100).toFixed(1)}% marital`,
      preview:`${d.former.split(" ")[0]}: ${fmt(d.alt)}/mo · Robert: ${fmt(d.after)}/mo`,
      content:(<div>
        <Field label="Former Spouse" value={d.former}/>
        <Field label="Marriage" value={`${d.marriage} — ${d.divorce}`}/>
        <Field label="Service During Marriage" value={`${d.svcM} years`}/>
        <div style={{margin:"10px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
            <span style={{color:colors.textSecondary,fontSize:"11px"}}>Marital Fraction</span>
            <span style={{color:colors.accent,fontSize:"12px",fontFamily:"monospace",fontWeight:600}}>{d.svcM} / {c.service.total} = {(d.frac*100).toFixed(2)}%</span></div>
          <div style={{height:"7px",borderRadius:"4px",background:colors.elevated,overflow:"hidden"}}>
            <div style={{width:`${d.frac*100}%`,height:"100%",borderRadius:"4px",background:`linear-gradient(90deg,${colors.warm},${colors.danger})`}}/></div>
        </div>
        <Field label="Max Benefit" value={fmt(c.ben.red)}/>
        <Field label="Marital Share" value={fmt(d.mShare)} sub={`${fmt(c.ben.red)} × ${(d.frac*100).toFixed(2)}%`}/>
        <Field label="DRO Award" value={`${d.pct*100}% of marital`}/>
        <Field label={`${d.former.split(" ")[0]}'s Monthly`} value={fmt(d.alt)} highlight/>
        <Field label="Robert's Remaining" value={fmt(d.after)} highlight/>
        <div style={{marginTop:"8px",borderRadius:"7px",overflow:"hidden",border:`1px solid ${colors.borderSubtle}`}}>
          <div style={{padding:"6px 10px",background:colors.elevated,fontSize:"10px",fontWeight:600,color:colors.textSecondary,textTransform:"uppercase",letterSpacing:"1px"}}>Monthly Summary</div>
          {[{w:"Robert (75% J&S)",a:d.elected,cl:colors.accent},{w:`${d.former.split(" ")[0]} (DRO)`,a:d.alt,cl:colors.warm}].map(r=>
            <div key={r.w} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderTop:`1px solid ${colors.borderSubtle}`,fontSize:"11px"}}>
              <span style={{color:colors.text}}>{r.w}</span><span style={{color:r.cl,fontFamily:"monospace",fontWeight:600}}>{fmt(r.a)}</span></div>)}
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderTop:`1px solid ${colors.border}`,fontSize:"11px",fontWeight:600,background:colors.elevated}}>
            <span style={{color:colors.text}}>Total DERP</span><span style={{fontFamily:"monospace",color:colors.text}}>{fmt(d.elected+d.alt)}</span></div>
        </div>
        <Callout type="info" title="Sequence">DRO split before payment option. Options on {fmt(d.after)}, not {fmt(c.ben.red)}. RMC §18-408.</Callout>
      </div>)});}

  if(c.scenario){const sc=c.scenario;
    steps.push({id:"scenario",label:"Scenario Modeler",icon:"📊",desc:"Retire now vs wait",
      preview:sc.mult?`Wait → ${sc.mult} benefit`:`Wait to age ${sc.waitAge} → ${fmt(sc.benefit)}/mo`,
      content:(<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
          <div style={{padding:"12px",borderRadius:"8px",border:`1px solid ${colors.dangerBorder}`,background:colors.dangerMuted,textAlign:"center"}}>
            <div style={{color:colors.textMuted,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px"}}>Retire Now</div>
            <div style={{color:colors.danger,fontSize:"22px",fontWeight:700,fontFamily:"monospace",marginTop:"4px"}}>{fmt(c.ben.red)}</div>
            <div style={{color:colors.textMuted,fontSize:"10px",marginTop:"3px"}}>Age {e.age} · −{e.redPct}%</div></div>
          <div style={{padding:"12px",borderRadius:"8px",border:`1px solid ${colors.successBorder}`,background:colors.successMuted,textAlign:"center"}}>
            <div style={{color:colors.textMuted,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px"}}>Wait to {sc.waitDate}</div>
            <div style={{color:colors.success,fontSize:"22px",fontWeight:700,fontFamily:"monospace",marginTop:"4px"}}>{fmt(sc.benefit)}</div>
            <div style={{color:colors.textMuted,fontSize:"10px",marginTop:"3px"}}>Age {sc.waitAge} · {sc.met?"No reduction":"Normal ret."}</div></div>
        </div>
        {sc.mult&&<div style={{padding:"10px",background:colors.elevated,borderRadius:"7px",textAlign:"center",border:`1px solid ${colors.border}`}}>
          <span style={{color:colors.textSecondary,fontSize:"11px"}}>Waiting {sc.waitAge-e.age} years → </span>
          <span style={{color:colors.success,fontSize:"13px",fontWeight:700}}>{sc.mult} monthly benefit</span></div>}
        {sc.met?<Callout type="success" title="Analysis">At age {sc.waitAge}, {e.ruleType}: {sc.sum?.toFixed(2)} ≥ {e.target}. Reduction eliminated.</Callout>
          :<Callout type="info">{sc.note||`At age ${sc.waitAge}, normal retirement — no reduction.`}</Callout>}
      </div>)});}

  const o=c.opts; const rows=[
    {k:"max",l:"Maximum (Single Life)",mo:c.dro?c.dro.after:o.max,f:1.0,sv:"—"},
    o.js100&&{k:"js100",l:"100% Joint & Survivor",mo:o.js100.mo,f:o.js100.f,sv:fmt(o.js100.sv)},
    o.js75&&{k:"js75",l:"75% Joint & Survivor",mo:c.dro?c.dro.postJs75.mo:o.js75.mo,f:o.js75.f,sv:fmt(c.dro?c.dro.postJs75.sv:o.js75.sv)},
    o.js50&&{k:"js50",l:"50% Joint & Survivor",mo:o.js50.mo,f:o.js50.f,sv:fmt(o.js50.sv)},
  ].filter(Boolean);

  steps.push({id:"payment",label:"Payment Option",icon:"💳",desc:"Select payment and beneficiary",
    preview:`${rows.length} options · ${c.beneficiary.rel==="Spouse"?"Spousal consent applies":c.beneficiary.rel}`,
    content:(<div>
      {c.dro&&<Callout type="info" title="DRO Applied">Options on post-DRO benefit: {fmt(c.dro.after)}</Callout>}
      <div style={{marginTop:c.dro?"8px":0}}>
        {rows.map(r=>{const el=o.elected===r.k; return(
          <div key={r.k} style={{padding:"10px 14px",marginBottom:"5px",borderRadius:"7px",border:`1px solid ${el?colors.accent:colors.border}`,background:el?colors.accentMuted:"transparent"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{color:el?colors.accent:colors.text,fontSize:"12px",fontWeight:el?600:400,display:"flex",alignItems:"center",gap:"5px"}}>
                <span>{el?"●":"○"}</span>{r.l}{el&&<Badge text="Elected" bg={colors.accentSolid} color={colors.accent}/>}</div>
                <div style={{color:colors.textMuted,fontSize:"10px",marginTop:"2px",marginLeft:"17px"}}>Factor: {r.f.toFixed(4)} · Survivor: {r.sv}</div></div>
              <span style={{fontFamily:"monospace",color:el?colors.accent:colors.text,fontWeight:600,fontSize:"14px",textShadow:el?`0 0 14px ${colors.accentGlow}`:"none"}}>{fmt(r.mo)}</span>
            </div></div>)})}
      </div>
      {c.beneficiary.rel==="Spouse"&&<Callout type="warning" title="Spousal Consent">{c.beneficiary.name} must be beneficiary for ≥50% J&S unless waiver signed. RMC §18-403(d).</Callout>}
      {!o.js100&&<Callout type="info">J&S options N/A — beneficiary is {c.beneficiary.name} ({c.beneficiary.rel}).</Callout>}
    </div>)});

  steps.push({id:"ipr",label:"IPR",icon:"🏥",desc:"Insurance Premium Reduction",
    preview:`Pre-Medicare: ${fmt(c.ipr.pre)}/mo · Post: ${fmt(c.ipr.post)}/mo`,
    content:(<div>
      <Field label="Service for IPR" value={`${c.ipr.svc} years`} sub="Earned only — purchased excluded"/>
      <Field label="Pre-Medicare (< 65)" value={fmt(c.ipr.pre)} highlight sub={`$12.50 × ${c.ipr.svc}`}/>
      <Field label="Post-Medicare (≥ 65)" value={fmt(c.ipr.post)} sub={`$6.25 × ${c.ipr.svc}`}/>
      <Callout type="info">IPR offsets health insurance premiums. Rate changes at Medicare eligibility (age 65). RMC §18-412.</Callout>
    </div>)});

  const elMo=c.dro?c.dro.elected:(o.elected==="max"?o.max:o[o.elected]?.mo);
  const svMo=c.dro?c.dro.postJs75?.sv:(o[o.elected]?.sv||0);
  const oL={max:"Maximum",js100:"100% J&S",js75:"75% J&S",js50:"50% J&S"};
  steps.push({id:"cert",label:"Final Certification",icon:"✅",desc:"Review and certify",
    preview:"All prior steps must be confirmed",
    content:(<div>
      <Field label="Member" value={c.member.name}/>
      <Field label="Effective Date" value={c.member.retDate}/>
      <Field label={c.dro?"Monthly (after DRO)":"Monthly Benefit"} value={fmt(elMo)} highlight/>
      <Field label="Payment Option" value={oL[o.elected]}/>
      <Field label="Beneficiary" value={`${c.beneficiary.name} (${c.beneficiary.rel})`}/>
      {svMo>0&&<Field label="Survivor Benefit" value={`${fmt(svMo)}/mo`}/>}
      {c.dro&&<Field label={`${c.dro.former.split(" ")[0]} (DRO)`} value={`${fmt(c.dro.alt)}/mo`}/>}
      <Field label="IPR (pre-Medicare)" value={`${fmt(c.ipr.pre)}/mo`}/>
      <div style={{marginTop:"10px",padding:"8px 10px",background:colors.elevated,borderRadius:"7px",border:`1px solid ${colors.borderSubtle}`}}>
        <div style={{color:colors.textMuted,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Governing Authority</div>
        <div style={{color:colors.textSecondary,fontSize:"10px",lineHeight:"1.6"}}>
          Revised Municipal Code, City and County of Denver
          {[`§18-393 (${tc.label})`,`§18-391(3) (AMS ${c.ams.months}mo)`,`§18-401(a) (${c.ben.mL})`,`§18-401(b) (${e.ruleType})`,
            e.redPct>0?"§18-401(c) (Reduction)":null,c.leave.eligible?"§18-401.5 (Leave)":null,
            "§18-403 (Options)",c.dro?"§18-408 (DRO)":null,"§18-412 (IPR)"].filter(Boolean).map((r,i)=>
              <div key={i} style={{color:colors.textMuted,fontSize:"10px"}}>· {r}</div>)}
        </div></div>
      <div style={{marginTop:"12px",textAlign:"center"}}>
        <div style={{display:"inline-block",padding:"10px 32px",background:`linear-gradient(135deg,${colors.accent},#06B6D4)`,color:colors.bg,fontWeight:700,borderRadius:"8px",fontSize:"13px",cursor:"pointer",boxShadow:`0 4px 15px ${colors.accentGlow}`}}>Certify & Submit</div>
      </div>
    </div>)});

  return steps;
}

export default function App(){
  const [caseKey,setCaseKey]=useState("case1");
  const [activeIdx,setActiveIdx]=useState(0);
  const [completed,setCompleted]=useState(new Set());
  const c=CASES[caseKey]; const steps=buildSteps(c); const tc=tierMeta[c.member.tier];

  useEffect(()=>{setActiveIdx(0);setCompleted(new Set())},[caseKey]);
  const advance=useCallback(()=>{
    setCompleted(p=>new Set([...p,activeIdx]));
    if(activeIdx<steps.length-1)setActiveIdx(activeIdx+1);
  },[activeIdx,steps.length]);

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",background:colors.bg,color:colors.text,overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${colors.border};border-radius:3px}`}</style>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",borderBottom:`1px solid ${colors.border}`,background:colors.surface,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"24px",height:"24px",borderRadius:"6px",background:`linear-gradient(135deg,${colors.accent},#06B6D4)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"11px",color:colors.bg}}>N</div>
          <span style={{color:colors.text,fontWeight:700,fontSize:"13px"}}>NoUI</span>
          <span style={{color:colors.textMuted,fontSize:"11px"}}>Benefit Calculator</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{fontSize:"9px",color:colors.textMuted,textTransform:"uppercase",letterSpacing:"1px"}}>DERP POC</span>
          <Badge text="Phase 1 · Transparent" bg={colors.accentMuted} color={colors.accent}/>
        </div>
      </div>

      {/* Member banner */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 16px",background:`linear-gradient(135deg,${colors.surface},${colors.elevated})`,borderBottom:`1px solid ${colors.border}`,flexWrap:"wrap",gap:"8px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"34px",height:"34px",borderRadius:"8px",background:tc.muted,border:`2px solid ${tc.main}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:tc.main,fontSize:"11px"}}>T{c.member.tier}</div>
          <div>
            <div style={{color:colors.text,fontWeight:700,fontSize:"14px"}}>{c.member.name}</div>
            <div style={{color:colors.textSecondary,fontSize:"10.5px"}}>{c.member.id} · Age {c.elig.age} · {c.service.total}y service · {c.member.dept}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
          {[{l:"Retiring",v:c.member.retDate.slice(5),c:colors.accent},{l:tc.label,v:tc.sub,c:tc.main},
            ...c.flags.map(f=>f==="dro"?{l:"DRO",v:"Active",c:"#A855F7"}:f==="early-retirement"?{l:"Reduction",v:`${c.elig.redPct}%`,c:colors.danger}:f==="leave-payout"?{l:"Leave",v:fmt(c.leave.amount),c:colors.warm}:f==="purchased-service"?{l:"Purch Svc",v:`${c.service.purchased}y`,c:colors.warm}:null).filter(Boolean),
          ].map(t=><div key={t.l} style={{padding:"2px 8px",borderRadius:"5px",background:colors.surface,border:`1px solid ${colors.borderSubtle}`,fontSize:"10px"}}>
            <span style={{color:colors.textMuted}}>{t.l} </span><span style={{color:t.c||colors.text,fontWeight:600}}>{t.v}</span></div>)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{display:"flex",padding:"8px 16px",gap:"3px",background:colors.surface,borderBottom:`1px solid ${colors.borderSubtle}`,flexShrink:0}}>
        {steps.map((s,i)=><div key={s.id} onClick={()=>(completed.has(i)||i<=activeIdx)&&setActiveIdx(i)} style={{
          flex:1,height:"3px",borderRadius:"2px",cursor:completed.has(i)||i<=activeIdx?"pointer":"default",
          background:completed.has(i)?colors.success:i===activeIdx?colors.accent:colors.border,
          transition:"all 0.3s",boxShadow:i===activeIdx?`0 0 6px ${colors.accentGlow}`:"none"}}/>)}
      </div>

      {/* Three-zone layout */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LEFT: completed */}
        <div style={{width:activeIdx>0?"52px":"0px",transition:"width 0.4s",overflow:"hidden",borderRight:activeIdx>0?`1px solid ${colors.borderSubtle}`:"none",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"10px",gap:"4px",flexShrink:0}}>
          {steps.slice(0,activeIdx).map((s,i)=>
            <div key={s.id} onClick={()=>setActiveIdx(i)} title={s.label} style={{width:"34px",height:"34px",borderRadius:"9px",background:completed.has(i)?colors.successMuted:colors.surface,border:`1px solid ${completed.has(i)?"rgba(16,185,129,0.3)":colors.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",cursor:"pointer",transition:"all 0.2s"}}>
              {completed.has(i)?<span style={{color:colors.success,fontSize:"13px"}}>✓</span>:s.icon}</div>)}
        </div>

        {/* CENTER: active */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div style={{padding:"12px 20px",borderBottom:`1px solid ${colors.borderSubtle}`,display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
            <span style={{fontSize:"20px"}}>{steps[activeIdx].icon}</span>
            <div style={{flex:1}}>
              <div style={{color:colors.text,fontWeight:700,fontSize:"14px"}}>{steps[activeIdx].label}</div>
              <div style={{color:colors.textMuted,fontSize:"11px"}}>{steps[activeIdx].desc}</div>
            </div>
            <div style={{color:colors.textDim,fontSize:"11px"}}>{activeIdx+1} / {steps.length}</div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>{steps[activeIdx].content}</div>
          <div style={{padding:"10px 20px",borderTop:`1px solid ${colors.borderSubtle}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
            <button onClick={()=>activeIdx>0&&setActiveIdx(activeIdx-1)} disabled={activeIdx===0}
              style={{padding:"7px 14px",borderRadius:"7px",border:`1px solid ${colors.border}`,background:"transparent",color:activeIdx===0?colors.textDim:colors.textMuted,cursor:activeIdx===0?"default":"pointer",fontSize:"12px"}}>←</button>
            <button onClick={advance}
              style={{padding:"8px 24px",borderRadius:"7px",border:"none",background:`linear-gradient(135deg,${colors.accent},#06B6D4)`,color:colors.bg,fontWeight:700,cursor:"pointer",fontSize:"12px",boxShadow:`0 4px 12px ${colors.accentGlow}`}}>
              {activeIdx===steps.length-1?"Complete ✓":"Confirm →"}</button>
          </div>
        </div>

        {/* RIGHT: upcoming */}
        <div style={{width:activeIdx<steps.length-1?"240px":"0px",transition:"width 0.4s",overflow:"hidden",borderLeft:`1px solid ${colors.borderSubtle}`,flexShrink:0,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 14px",color:colors.textDim,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:600,flexShrink:0}}>Coming Up</div>
          <div style={{flex:1,overflow:"auto",padding:"0 10px"}}>
            {steps.slice(activeIdx+1).map((s,i)=>{const isNext=i===0; return(
              <div key={s.id} style={{padding:"8px 10px",marginBottom:"5px",borderRadius:"8px",background:isNext?colors.accentMuted:"transparent",border:`1px solid ${isNext?"rgba(34,211,238,0.15)":"transparent"}`,opacity:Math.max(0.3,1-i*0.15),transition:"all 0.3s"}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                  <span style={{fontSize:"13px"}}>{s.icon}</span>
                  <div><div style={{color:isNext?colors.accent:colors.textMuted,fontSize:"11px",fontWeight:isNext?600:400}}>{s.label}</div>
                    <div style={{color:colors.textDim,fontSize:"9.5px",marginTop:"1px"}}>{s.desc}</div></div>
                </div>
                {isNext&&s.preview&&<div style={{marginTop:"6px",padding:"5px 7px",borderRadius:"5px",background:colors.surface,border:`1px solid ${colors.borderSubtle}`}}>
                  <div style={{color:colors.textDim,fontSize:"9.5px",fontStyle:"italic"}}>Preview: {s.preview}</div></div>}
              </div>)})}
          </div>
        </div>
      </div>

      {/* Case selector (POC demo only) */}
      <div style={{display:"flex",alignItems:"center",padding:"6px 12px",gap:"4px",borderTop:`1px solid ${colors.border}`,background:colors.surface,flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:"9px",color:colors.textDim,textTransform:"uppercase",letterSpacing:"1px",marginRight:"4px"}}>Demo Case</span>
        {Object.entries(CASES).map(([k,v])=>{const t=tierMeta[v.member.tier]; return(
          <button key={k} onClick={()=>setCaseKey(k)} style={{padding:"4px 10px",borderRadius:"6px",border:`1px solid ${caseKey===k?t.main:colors.border}`,background:caseKey===k?t.muted:"transparent",color:caseKey===k?t.main:colors.textMuted,cursor:"pointer",fontSize:"10.5px",fontWeight:caseKey===k?600:400,transition:"all 0.15s"}}>
            {v.member.name.split(" ")[0]}{k==="case4"?" +DRO":""}</button>)})}
        <span style={{color:colors.textDim,fontSize:"10px",marginLeft:"8px",fontStyle:"italic"}}>{c.label}</span>
      </div>
    </div>);
}