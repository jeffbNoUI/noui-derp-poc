import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// NoUI DERP Benefit Calculator — Workspace Model
// All panels visible. Worker confirms/enters data in any order.
// Right sidebar: live calculation summary updates as panels confirm.
// ═══════════════════════════════════════════════════════════════

const C = {
  bg:"#0B1017",sf:"#131C27",el:"#1A2736",
  bd:"#243447",bs:"#1B2D40",
  ac:"#22D3EE",am:"rgba(34,211,238,0.10)",ag:"rgba(34,211,238,0.20)",as:"rgba(34,211,238,0.15)",
  wm:"#F59E0B",wmm:"rgba(245,158,11,0.10)",wmb:"rgba(245,158,11,0.25)",
  dn:"#EF4444",dnm:"rgba(239,68,68,0.10)",dnb:"rgba(239,68,68,0.25)",
  ok:"#10B981",okm:"rgba(16,185,129,0.10)",okb:"rgba(16,185,129,0.25)",
  tx:"#E2E8F0",t2:"#94A3B8",t3:"#64748B",t4:"#475569",
  t1c:"#3B82F6",t1m:"rgba(59,130,246,0.12)",
  t2c:"#F59E0B",t2m:"rgba(245,158,11,0.12)",
  t3c:"#10B981",t3m:"rgba(16,185,129,0.12)",
};
const TM = {
  1:{c:C.t1c,m:C.t1m,l:"Tier 1",s:"Pre-2004"},
  2:{c:C.t2c,m:C.t2m,l:"Tier 2",s:"2004-2011"},
  3:{c:C.t3c,m:C.t3m,l:"Tier 3",s:"Post-2011"},
};
const $ = n => n!=null ? "$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—";

// ═══ CASE DATA ═══
const DATA = {
  c1:{
    mb:{id:"M-100001",nm:"Robert Martinez",rd:"2026-04-01",t:1,dp:"Public Works"},
    bf:{nm:"Elena Martinez",rl:"Spouse"},
    sv:{e:28.75,p:0,tot:28.75,fr:28.75},
    el:{age:63,rt:"Rule of 75",rs:91.75,tg:75,met:true,ma:55,rp:0,rf:1.0,yu:2},
    lv:{ok:true,amt:52000},
    am:{mo:36,st:"Apr 2023",en:"Mar 2026",tot:383020.24,ams:10639.45,np:9194.45,
      r:[{p:"2023 (Apr-Dec)",m:9,s:8792.75},{p:"2024 (Jan-Dec)",m:12,s:9144.50},{p:"2025 (Jan-Dec)",m:12,s:9420.25},{p:"2026 (Jan-Mar)",m:3,s:9702.83}]},
    bn:{mu:0.02,ml:"2.0%",sy:28.75,fm:"2.0% × $10,639.45 × 28.75",ur:6117.68,rd:6117.68},
    op:{mx:6117.68,j1:{f:0.885,m:5414.15,s:5414.15},j7:{f:0.915,m:5597.68,s:4198.26},j5:{f:0.945,m:5781.21,s:2890.61},el:"j7"},
    ip:{sv:28.75,pr:359.38,po:179.69},
    dr:null,sc:null,fl:["leave-payout"],lb:"Tier 1 | Rule of 75 | Leave Payout"
  },
  c2:{
    mb:{id:"M-100002",nm:"Jennifer Kim",rd:"2026-05-01",t:2,dp:"Finance"},
    bf:{nm:"Estate",rl:"Estate"},
    sv:{e:18.17,p:3.00,tot:21.17,fr:18.17},
    el:{age:55,rt:"Rule of 75",rs:73.17,tg:75,met:false,ma:55,rp:60,rf:0.40,yu:10},
    lv:{ok:true,amt:0},
    am:{mo:36,st:"May 2023",en:"Apr 2026",tot:264514.32,ams:7347.62,np:7347.62,
      r:[{p:"2023 (May-Dec)",m:8,s:7007.42},{p:"2024 (Jan-Dec)",m:12,s:7287.75},{p:"2025 (Jan-Dec)",m:12,s:7506.33},{p:"2026 (Jan-Apr)",m:4,s:7731.50}]},
    bn:{mu:0.015,ml:"1.5%",sy:21.17,fm:"1.5% × $7,347.62 × 21.17",ur:2332.96,rd:933.18},
    op:{mx:933.18,j1:null,j7:null,j5:null,el:"mx"},
    ip:{sv:18.17,pr:227.13,po:113.56},
    dr:null,
    sc:{wd:"May 2028",wa:57,b:2711.00,mu:"~3×",mt:true,sm:77.17},
    fl:["early-retirement","purchased-service"],lb:"Tier 2 | Purchased Svc | 60% Reduction"
  },
  c3:{
    mb:{id:"M-100003",nm:"David Washington",rd:"2026-04-01",t:3,dp:"Parks & Rec"},
    bf:{nm:"Michelle Washington",rl:"Spouse"},
    sv:{e:13.58,p:0,tot:13.58,fr:13.58},
    el:{age:63,rt:"Rule of 85",rs:76.58,tg:85,met:false,ma:60,rp:12,rf:0.88,yu:2},
    lv:{ok:false,amt:0},
    am:{mo:60,st:"Apr 2021",en:"Mar 2026",tot:401071.20,ams:6684.52,np:6684.52,
      r:[{p:"2021 (Apr-Dec)",m:9,s:6250.00},{p:"2022 (Jan-Dec)",m:12,s:6437.50},{p:"2023 (Jan-Dec)",m:12,s:6695.00},{p:"2024 (Jan-Dec)",m:12,s:6962.80},{p:"2025 (Jan-Dec)",m:12,s:7171.67},{p:"2026 (Jan-Mar)",m:3,s:7386.82}]},
    bn:{mu:0.015,ml:"1.5%",sy:13.58,fm:"1.5% × $6,684.52 × 13.58",ur:1361.40,rd:1198.03},
    op:{mx:1198.03,j1:{f:0.885,m:1060.26,s:1060.26},j7:{f:0.905,m:1084.22,s:813.17},j5:{f:0.935,m:1132.14,s:566.07},el:"j5"},
    ip:{sv:13.58,pr:169.75,po:84.88},
    dr:null,
    sc:{wd:"Apr 2028",wa:65,b:1535.00,mu:null,mt:false,nt:"Normal retirement at 65 — no reduction regardless of Rule of 85"},
    fl:["early-retirement"],lb:"Tier 3 | 60-Mo AMS | Rule of 85 | 12% Reduction"
  },
  c4:{
    mb:{id:"M-100001",nm:"Robert Martinez",rd:"2026-04-01",t:1,dp:"Public Works"},
    bf:{nm:"Elena Martinez",rl:"Spouse"},
    sv:{e:28.75,p:0,tot:28.75,fr:28.75},
    el:{age:63,rt:"Rule of 75",rs:91.75,tg:75,met:true,ma:55,rp:0,rf:1.0,yu:2},
    lv:{ok:true,amt:52000},
    am:{mo:36,st:"Apr 2023",en:"Mar 2026",tot:383020.24,ams:10639.45,np:9194.45,
      r:[{p:"2023 (Apr-Dec)",m:9,s:8792.75},{p:"2024 (Jan-Dec)",m:12,s:9144.50},{p:"2025 (Jan-Dec)",m:12,s:9420.25},{p:"2026 (Jan-Mar)",m:3,s:9702.83}]},
    bn:{mu:0.02,ml:"2.0%",sy:28.75,fm:"2.0% × $10,639.45 × 28.75",ur:6117.68,rd:6117.68},
    op:{mx:6117.68,j1:{f:0.885,m:5414.15,s:5414.15},j7:{f:0.915,m:5597.68,s:4198.26},j5:{f:0.945,m:5781.21,s:2890.61},el:"j7"},
    ip:{sv:28.75,pr:359.38,po:179.69},
    dr:{fn:"Patricia Martinez",md:"Aug 15, 1999",dd:"Nov 3, 2017",sm:18.25,fr:0.6348,ms:3883.10,pc:0.40,ap:1553.24,af:4564.44,pj:{f:0.915,m:4176.46,s:3132.35},em:4176.46,ls:1421.22},
    sc:null,fl:["leave-payout","dro"],lb:"Tier 1 | Rule of 75 | Leave Payout | DRO"
  }
};

// ═══ MICRO-COMPONENTS ═══
function Bg({t,c:cl,bg}){
  return <span style={{display:"inline-block",fontSize:"9px",padding:"2px 6px",borderRadius:"99px",background:bg,color:cl,fontWeight:600,letterSpacing:"0.3px",textTransform:"uppercase",lineHeight:"14px",whiteSpace:"nowrap"}}>{t}</span>;
}

function Fd({l,v,hi,bg,sub}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.bs}`}}>
      <div style={{minWidth:0,flex:1}}>
        <span style={{color:C.t2,fontSize:"12px"}}>{l}</span>
        {sub && <div style={{color:C.t3,fontSize:"10px",marginTop:"1px"}}>{sub}</div>}
      </div>
      <span style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
        {bg && <Bg {...bg}/>}
        <span style={{color:hi?C.ac:C.tx,fontWeight:600,fontFamily:"'SF Mono',monospace",fontSize:"12px",textShadow:hi?`0 0 14px ${C.ag}`:"none"}}>{v}</span>
      </span>
    </div>
  );
}

function Ca({type="info",title,children}){
  const m={info:{b:C.am,d:C.as,c:C.ac},success:{b:C.okm,d:C.okb,c:C.ok},warning:{b:C.wmm,d:C.wmb,c:C.wm},danger:{b:C.dnm,d:C.dnb,c:C.dn}}[type];
  return(
    <div style={{padding:"8px 10px",background:m.b,borderRadius:"6px",border:`1px solid ${m.d}`,marginTop:"6px"}}>
      {title && <div style={{color:m.c,fontSize:"10.5px",fontWeight:600,marginBottom:"2px"}}>{title}</div>}
      <div style={{color:C.tx,fontSize:"11px",lineHeight:"1.45"}}>{children}</div>
    </div>
  );
}

// Panel wrapper with confirm/status
function Panel({id, title, icon, status, onConfirm, focused, onFocus, children, alert}) {
  const ref = useRef(null);
  const isConfirmed = status === "confirmed";
  const borderColor = focused ? C.ac : isConfirmed ? C.ok : alert ? C.dn : C.bs;

  return (
    <div ref={ref} onClick={() => !focused && onFocus(id)} style={{
      background: C.sf, borderRadius:"8px",
      border: `1px solid ${borderColor}`,
      boxShadow: focused ? `0 0 0 1px ${C.ac}22, 0 4px 20px rgba(0,0,0,0.3)` : "none",
      marginBottom:"8px", overflow:"hidden",
      transition:"all 0.2s",
      cursor: focused ? "default" : "pointer",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 12px",
        background: focused ? C.el : "transparent",
        borderBottom: focused ? `1px solid ${C.bs}` : "none",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"14px"}}>{icon}</span>
          <span style={{color:focused?C.tx:C.t2,fontWeight:600,fontSize:"12.5px"}}>{title}</span>
          {alert && !isConfirmed && <Bg t={alert} bg={C.dnm} c={C.dn}/>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          {isConfirmed && <Bg t="Confirmed" bg={C.okm} c={C.ok}/>}
          {!isConfirmed && !focused && <Bg t="Needs review" bg={C.wmm} c={C.wm}/>}
        </div>
      </div>
      {/* Content - always visible when focused, summary when collapsed */}
      {focused && (
        <div style={{padding:"10px 12px"}}>
          {children}
          {!isConfirmed && (
            <div style={{marginTop:"10px",display:"flex",justifyContent:"flex-end"}}>
              <button onClick={(e) => {e.stopPropagation(); onConfirm(id);}}
                style={{padding:"6px 18px",borderRadius:"6px",border:"none",
                  background:`linear-gradient(135deg,${C.ac},#06B6D4)`,
                  color:C.bg,fontWeight:700,cursor:"pointer",fontSize:"11.5px",
                  boxShadow:`0 2px 8px ${C.ag}`}}>
                Confirm ✓
              </button>
            </div>
          )}
          {isConfirmed && (
            <div style={{marginTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.ok,fontSize:"11px",fontWeight:600}}>✓ Confirmed</span>
              <button onClick={(e) => {e.stopPropagation(); onConfirm(id, true);}}
                style={{padding:"4px 12px",borderRadius:"5px",border:`1px solid ${C.bd}`,
                  background:"transparent",color:C.t3,cursor:"pointer",fontSize:"10.5px"}}>
                Edit
              </button>
            </div>
          )}
        </div>
      )}
      {!focused && (
        <div style={{padding:"6px 12px 8px",fontSize:"11px",color:C.t3}}>
          {isConfirmed ? <span style={{color:C.ok}}>✓ Data confirmed</span> : "Click to review and confirm"}
        </div>
      )}
    </div>
  );
}

// ═══ LIVE SUMMARY SIDEBAR ═══
function LiveSummary({c, confirmed}) {
  const e = c.el;
  const tc = TM[c.mb.t];
  const allDone = confirmed.size >= getPanelCount(c);
  const elMo = c.dr ? c.dr.em : (c.op.el==="mx"?c.op.mx:c.op.el==="j7"?c.op.j7?.m:c.op.el==="j5"?c.op.j5?.m:c.op.j1?.m);
  const svMo = c.dr ? c.dr.pj?.s : (c.op.el==="j7"?c.op.j7?.s:c.op.el==="j5"?c.op.j5?.s:c.op.el==="j1"?c.op.j1?.s:0);
  const oLbl = {mx:"Maximum",j1:"100% J&S",j7:"75% J&S",j5:"50% J&S"};

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bs}`}}>
        <div style={{color:C.t4,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:600}}>
          Live Calculation
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"10px 12px"}}>
        {/* Hero benefit amount */}
        <div style={{textAlign:"center",padding:"14px 8px",background:C.am,borderRadius:"8px",border:`1px solid ${C.as}`,marginBottom:"10px"}}>
          <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px"}}>
            {c.dr ? "Monthly (after DRO)" : "Monthly Benefit"}
          </div>
          <div style={{
            color: confirmed.has("benefit") ? C.ac : C.t3,
            fontSize:"26px",fontWeight:700,fontFamily:"monospace",marginTop:"4px",
            textShadow: confirmed.has("benefit") ? `0 0 25px ${C.ag}` : "none",
            opacity: confirmed.has("benefit") ? 1 : 0.5,
          }}>
            {$(elMo)}
          </div>
          <div style={{color:C.t3,fontSize:"10px",marginTop:"2px"}}>
            {c.bn.fm}
          </div>
          {!confirmed.has("benefit") && (
            <div style={{color:C.wm,fontSize:"9px",marginTop:"4px",fontStyle:"italic"}}>Pending confirmation</div>
          )}
        </div>

        {/* Line items */}
        <div style={{fontSize:"11px"}}>
          <SumRow label={tc.l} value={tc.s} done={confirmed.has("elig")} color={tc.c} />
          <SumRow label={e.rt} value={`${e.rs.toFixed(2)} ${e.met?"✓":"✕"}`} done={confirmed.has("confirm")} color={e.met?C.ok:C.dn} />
          {e.rp > 0 && <SumRow label="Reduction" value={`${e.rp}%`} done={confirmed.has("elig")} color={C.dn} />}
          <SumRow label="AMS" value={$(c.am.ams)} done={confirmed.has("salary")} />
          {c.lv.amt > 0 && <SumRow label="Leave Payout" value={$(c.lv.amt)} done={confirmed.has("salary")} color={C.wm} />}
          {c.sv.p > 0 && <SumRow label="Purchased Svc" value={`${c.sv.p}y`} done={confirmed.has("purch")} color={C.wm} />}
          <SumRow label="Multiplier" value={c.bn.ml} done={confirmed.has("benefit")} />
          <SumRow label="Service" value={`${c.bn.sy}y`} done={confirmed.has("benefit")} />

          {c.dr && (
            <>
              <div style={{borderTop:`1px solid ${C.bd}`,margin:"6px 0"}} />
              <SumRow label="DRO Split" value={$(c.dr.ap)} done={confirmed.has("dro")} color="#A855F7" />
              <SumRow label="After DRO" value={$(c.dr.af)} done={confirmed.has("dro")} />
            </>
          )}

          <div style={{borderTop:`1px solid ${C.bd}`,margin:"6px 0"}} />
          <SumRow label="Option" value={oLbl[c.op.el]} done={confirmed.has("payment")} />
          {svMo > 0 && <SumRow label="Survivor" value={`${$(svMo)}/mo`} done={confirmed.has("payment")} />}
          <SumRow label="IPR" value={$(c.ip.pr)} done={confirmed.has("ipr")} />
        </div>
      </div>

      {/* Certification readiness */}
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.bs}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
          <span style={{color:C.t3,fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Progress</span>
          <span style={{color:allDone?C.ok:C.t3,fontSize:"10px",fontWeight:600}}>
            {confirmed.size} / {getPanelCount(c)}
          </span>
        </div>
        <div style={{height:"4px",borderRadius:"2px",background:C.bd,overflow:"hidden"}}>
          <div style={{
            width:`${(confirmed.size / getPanelCount(c)) * 100}%`,
            height:"100%",borderRadius:"2px",
            background: allDone ? C.ok : `linear-gradient(90deg,${C.ac},#06B6D4)`,
            transition:"width 0.4s ease",
          }} />
        </div>
        {allDone && (
          <button style={{
            width:"100%",marginTop:"8px",padding:"8px",borderRadius:"6px",border:"none",
            background:`linear-gradient(135deg,${C.ok},#059669)`,
            color:"white",fontWeight:700,fontSize:"12px",cursor:"pointer",
            boxShadow:`0 2px 10px rgba(16,185,129,0.3)`,
          }}>
            Certify & Submit
          </button>
        )}
      </div>
    </div>
  );
}

function SumRow({label, value, done, color}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",opacity:done?1:0.45,transition:"opacity 0.3s"}}>
      <span style={{color:C.t2,fontSize:"11px"}}>{label}</span>
      <span style={{color:color||C.tx,fontFamily:"monospace",fontSize:"11px",fontWeight:600}}>{value}</span>
    </div>
  );
}

function getPanelCount(c) {
  let n = 5; // confirm, elig, salary, benefit, payment, ipr → but payment+ipr = 2 more = 7 base
  n = 7;
  if (c.sv.p > 0) n++;
  if (c.dr) n++;
  if (c.sc) n++;
  return n;
}

// ═══ SALARY TABLE ═══
function SalaryTable({c}) {
  return (
    <div style={{margin:"6px 0",borderRadius:"6px",overflow:"hidden",border:`1px solid ${C.bs}`}}>
      <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.6fr 1fr 1fr",padding:"5px 8px",background:C.el,fontSize:"9px",textTransform:"uppercase",letterSpacing:"0.8px",color:C.t3,fontWeight:600}}>
        <span>Period</span><span style={{textAlign:"right"}}>Mo</span><span style={{textAlign:"right"}}>Monthly</span><span style={{textAlign:"right"}}>Subtotal</span>
      </div>
      {c.am.r.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"2.2fr 0.6fr 1fr 1fr",padding:"4px 8px",fontSize:"10.5px",borderTop:`1px solid ${C.bs}`,background:i===c.am.r.length-1&&c.lv.amt>0?C.wmm:"transparent"}}>
          <span style={{color:C.tx}}>{r.p}</span>
          <span style={{textAlign:"right",color:C.t2,fontFamily:"monospace"}}>{r.m}</span>
          <span style={{textAlign:"right",color:C.tx,fontFamily:"monospace"}}>{$(r.s)}</span>
          <span style={{textAlign:"right",color:C.t2,fontFamily:"monospace"}}>{$(r.m*r.s)}</span>
        </div>
      ))}
      {c.lv.amt>0 && (
        <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.6fr 1fr 1fr",padding:"4px 8px",fontSize:"10.5px",borderTop:`1px solid ${C.wmb}`,background:C.wmm}}>
          <span style={{color:C.wm,fontWeight:600}}>+ Leave Payout</span><span/><span/>
          <span style={{textAlign:"right",color:C.wm,fontFamily:"monospace",fontWeight:600}}>+{$(c.lv.amt)}</span>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"2.2fr 0.6fr 1fr 1fr",padding:"5px 8px",fontSize:"10.5px",background:C.el,borderTop:`1px solid ${C.bd}`,fontWeight:600}}>
        <span style={{color:C.tx}}>Total</span>
        <span style={{textAlign:"right",color:C.t2,fontFamily:"monospace"}}>{c.am.mo}</span><span/>
        <span style={{textAlign:"right",color:C.ac,fontFamily:"monospace"}}>{$(c.am.tot)}</span>
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function App() {
  const [ck, setCk] = useState("c1");
  const [confirmed, setConfirmed] = useState(new Set());
  const [focused, setFocused] = useState("confirm");
  const scrollRef = useRef(null);

  const c = DATA[ck];
  const e = c.el;
  const tc = TM[c.mb.t];

  useEffect(() => { setConfirmed(new Set()); setFocused("confirm"); }, [ck]);

  const handleConfirm = useCallback((id, toggle) => {
    setConfirmed(prev => {
      const next = new Set(prev);
      if (toggle && next.has(id)) { next.delete(id); }
      else { next.add(id); }
      return next;
    });
  }, []);

  // Build panel list based on case (composition engine)
  const panels = [];
  panels.push("confirm", "elig");
  if (c.sv.p > 0) panels.push("purch");
  panels.push("salary", "benefit");
  if (c.dr) panels.push("dro");
  if (c.sc) panels.push("scenario");
  panels.push("payment", "ipr");

  const wo = c.sv.p > 0 ? +(c.am.ams * c.bn.mu * c.sv.e * e.rf).toFixed(2) : 0;

  const oRows = [
    {k:"mx",l:"Maximum (Single Life)",m:c.dr?c.dr.af:c.op.mx,f:1.0,s:"—"},
    c.op.j1 && {k:"j1",l:"100% Joint & Survivor",m:c.op.j1.m,f:c.op.j1.f,s:$(c.op.j1.s)},
    c.op.j7 && {k:"j7",l:"75% J&S",m:c.dr?c.dr.pj.m:c.op.j7.m,f:c.op.j7.f,s:$(c.dr?c.dr.pj.s:c.op.j7.s)},
    c.op.j5 && {k:"j5",l:"50% J&S",m:c.op.j5.m,f:c.op.j5.f,s:$(c.op.j5.s)},
  ].filter(Boolean);

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",background:C.bg,color:C.tx,overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.bd};border-radius:3px}`}</style>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 16px",borderBottom:`1px solid ${C.bd}`,background:C.sf,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"22px",height:"22px",borderRadius:"5px",background:`linear-gradient(135deg,${C.ac},#06B6D4)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"10px",color:C.bg}}>N</div>
          <span style={{color:C.tx,fontWeight:700,fontSize:"13px"}}>NoUI</span>
          <span style={{color:C.t3,fontSize:"11px"}}>Benefit Calculator</span>
        </div>
        <Bg t="Phase 1 · Transparent" bg={C.am} c={C.ac}/>
      </div>

      {/* Member banner */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:`linear-gradient(135deg,${C.sf},${C.el})`,borderBottom:`1px solid ${C.bd}`,flexWrap:"wrap",gap:"6px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"32px",height:"32px",borderRadius:"7px",background:tc.m,border:`2px solid ${tc.c}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:tc.c,fontSize:"10px"}}>T{c.mb.t}</div>
          <div>
            <div style={{color:C.tx,fontWeight:700,fontSize:"13.5px"}}>{c.mb.nm}</div>
            <div style={{color:C.t2,fontSize:"10px"}}>{c.mb.id} · Age {e.age} · {c.sv.tot}y · {c.mb.dp}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {[
            {l:"Retiring",v:c.mb.rd.slice(5),x:C.ac},
            {l:tc.l,v:tc.s,x:tc.c},
            ...c.fl.map(f => f==="dro"?{l:"DRO",v:"Active",x:"#A855F7"}:f==="early-retirement"?{l:"Reduction",v:`${e.rp}%`,x:C.dn}:f==="leave-payout"&&c.lv.amt>0?{l:"Leave",v:$(c.lv.amt),x:C.wm}:f==="purchased-service"?{l:"Purch Svc",v:`${c.sv.p}y`,x:C.wm}:null).filter(Boolean)
          ].map(t => (
            <div key={t.l} style={{padding:"2px 7px",borderRadius:"4px",background:C.sf,border:`1px solid ${C.bs}`,fontSize:"9.5px"}}>
              <span style={{color:C.t3}}>{t.l} </span>
              <span style={{color:t.x,fontWeight:600}}>{t.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main workspace: panels + summary sidebar */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* PANELS (scrollable) */}
        <div ref={scrollRef} style={{flex:1,overflow:"auto",padding:"10px 14px 60px"}}>

          {/* Confirm Retirement */}
          <Panel id="confirm" title="Confirm Retirement" icon="📋" status={confirmed.has("confirm")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="confirm"} onFocus={setFocused} alert={e.rp>0?`${e.rp}% reduction`:null}>
            <Fd l="Retirement Date" v={c.mb.rd} hi/>
            <Fd l="Type" v="Service Retirement"/>
            <Fd l="Age at Retirement" v={`${e.age} years`}/>
            <Fd l="Years of Service" v={`${c.sv.tot} years`}/>
            <Fd l={e.rt} v={e.rs.toFixed(2)} hi bg={{t:e.met?"Met":"Not Met",bg:e.met?C.okm:C.dnm,c:e.met?C.ok:C.dn}}/>
            <Fd l="Reduction" v={e.rp===0?"None":`${e.rp}%`} bg={e.rp>0?{t:`${e.yu}y under 65`,bg:C.dnm,c:C.dn}:null}/>
            {e.met
              ? <Ca type="success" title={`${e.rt} Satisfied`}>Age {e.age} + Service {c.sv.fr} = {e.rs.toFixed(2)} ≥ {e.tg}. No reduction.</Ca>
              : <Ca type="danger" title="Early Retirement Reduction">{e.yu}y × 6%/yr = {e.rp}%. Member receives {100-e.rp}% of benefit.</Ca>}
          </Panel>

          {/* Eligibility */}
          <Panel id="elig" title="Eligibility Determination" icon="✓" status={confirmed.has("elig")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="elig"} onFocus={setFocused}>
            <Fd l="Tier" v={tc.l} bg={{t:tc.s,bg:tc.m,c:tc.c}}/>
            <Fd l="Vested" v={`Yes — ${c.sv.e}y earned`} bg={{t:"Met",bg:C.okm,c:C.ok}}/>
            {c.sv.p>0 && <Fd l="Purchased Service" v={`${c.sv.p} years`} sub="In benefit, excluded from eligibility" bg={{t:"Excluded",bg:C.wmm,c:C.wm}}/>}
            <Fd l={e.rt} v={`${e.rs.toFixed(2)} ${e.met?"≥":"<"} ${e.tg}`} hi={e.met} bg={{t:e.met?"Met":"Not Met",bg:e.met?C.okm:C.dnm,c:e.met?C.ok:C.dn}}/>
            <Fd l={`Min Age (${e.ma})`} v={`${e.age} — Met`} bg={{t:"Met",bg:C.okm,c:C.ok}}/>
            <Fd l="Leave Payout" v={c.lv.ok?(c.lv.amt>0?`Yes — ${$(c.lv.amt)}`:"Eligible — none claimed"):"Not eligible"} sub={c.lv.ok?"Before Jan 1, 2010":"After Jan 1, 2010"}/>
            {c.sv.p>0 && <Ca type="warning" title="Purchased Service">If counted: {e.age}+{c.sv.tot}={(e.age+c.sv.tot).toFixed(2)} — would qualify. Per RMC §18-407, excluded.</Ca>}
          </Panel>

          {/* Purchased Service (conditional) */}
          {c.sv.p > 0 && (
            <Panel id="purch" title="Purchased Service Impact" icon="📎" status={confirmed.has("purch")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="purch"} onFocus={setFocused}>
              <Fd l="Earned" v={`${c.sv.e}y`}/><Fd l="Purchased" v={`${c.sv.p}y`} bg={{t:"RMC §18-407",bg:C.wmm,c:C.wm}}/>
              <Fd l="For Benefit" v={`${c.sv.tot}y`} hi/><Fd l={`For ${e.rt}`} v={`${c.sv.fr}y`} bg={{t:"Excluded",bg:C.dnm,c:C.dn}}/>
              <div style={{marginTop:"6px",borderRadius:"6px",overflow:"hidden",border:`1px solid ${C.bs}`}}>
                {[{l:"Without purchased",v:$(wo),x:C.t2},{l:"With purchased",v:$(c.bn.rd),x:C.ac},{l:"Additional",v:`+${$(c.bn.rd-wo)}`,x:C.ok}].map(r=>(
                  <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderTop:`1px solid ${C.bs}`,fontSize:"11px"}}>
                    <span style={{color:C.tx}}>{r.l}</span><span style={{color:r.x,fontFamily:"monospace",fontWeight:600}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Salary & AMS */}
          <Panel id="salary" title={`Salary & AMS (${c.am.mo}-month window)`} icon="💰" status={confirmed.has("salary")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="salary"} onFocus={setFocused}>
            <Fd l="AMS Window" v={`${c.am.mo} months`} bg={c.mb.t===3?{t:"60-mo (Tier 3)",bg:C.t3m,c:C.t3c}:null}/>
            <Fd l="Period" v={`${c.am.st} — ${c.am.en}`} hi/>
            <SalaryTable c={c}/>
            <Fd l={`÷ ${c.am.mo} months`} v={$(c.am.ams)} hi/>
            {c.lv.amt>0 && <Ca type="warning" title="Leave Payout">{$(c.lv.amt)} in final month. Without: {$(c.am.np)} → With: {$(c.am.ams)} (+{$(c.am.ams-c.am.np)}/mo)</Ca>}
          </Panel>

          {/* Benefit Calculation */}
          <Panel id="benefit" title="Benefit Calculation" icon="🔢" status={confirmed.has("benefit")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="benefit"} onFocus={setFocused} alert={e.rp>0?`${e.rp}% reduced`:null}>
            <div style={{padding:"12px",background:C.am,borderRadius:"7px",border:`1px solid ${C.as}`,textAlign:"center",marginBottom:"8px"}}>
              <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px"}}>{c.bn.ml} × AMS × Service</div>
              <div style={{color:C.ac,fontSize:"26px",fontWeight:700,fontFamily:"monospace",marginTop:"4px",textShadow:`0 0 25px ${C.ag}`}}>{$(c.bn.rd)}/mo</div>
              <div style={{color:C.t2,fontSize:"10.5px",marginTop:"3px",fontFamily:"monospace"}}>{c.bn.fm}</div>
              {e.rp>0 && <div style={{color:C.dn,fontSize:"9.5px",marginTop:"3px",fontWeight:600}}>After {e.rp}% reduction</div>}
            </div>
            <Fd l="Multiplier" v={`${c.bn.ml} (${tc.l})`} sub="RMC §18-401"/><Fd l="AMS" v={$(c.am.ams)}/><Fd l="Service" v={`${c.bn.sy}y`}/><Fd l="Unreduced" v={$(c.bn.ur)}/>
            {e.rp>0 && (<>
              <Fd l="Reduction" v={`× ${e.rf.toFixed(2)} (−${e.rp}%)`} bg={{t:`−${$(c.bn.ur-c.bn.rd)}/mo`,bg:C.dnm,c:C.dn}}/>
              <Fd l="Reduced" v={$(c.bn.rd)} hi/>
            </>)}
            {e.rp===0 && <Ca type="success" title="No Reduction">{e.rt} met — 100% of benefit.</Ca>}
          </Panel>

          {/* DRO (conditional) */}
          {c.dr && (
            <Panel id="dro" title="DRO Impact" icon="⚖️" status={confirmed.has("dro")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="dro"} onFocus={setFocused}>
              <Fd l="Former Spouse" v={c.dr.fn}/><Fd l="Marriage" v={`${c.dr.md} — ${c.dr.dd}`}/>
              <Fd l="Service During Marriage" v={`${c.dr.sm}y`}/>
              <div style={{margin:"8px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{color:C.t2,fontSize:"10.5px"}}>Marital Fraction</span>
                  <span style={{color:C.ac,fontSize:"11px",fontFamily:"monospace",fontWeight:600}}>{c.dr.sm}/{c.sv.tot} = {(c.dr.fr*100).toFixed(2)}%</span>
                </div>
                <div style={{height:"6px",borderRadius:"3px",background:C.el,overflow:"hidden"}}>
                  <div style={{width:`${c.dr.fr*100}%`,height:"100%",borderRadius:"3px",background:`linear-gradient(90deg,${C.wm},${C.dn})`}}/>
                </div>
              </div>
              <Fd l="Marital Share" v={$(c.dr.ms)}/><Fd l="DRO Award" v={`${c.dr.pc*100}% of marital`}/>
              <Fd l={`${c.dr.fn.split(" ")[0]}'s Monthly`} v={$(c.dr.ap)} hi/>
              <Fd l="Robert's Remaining" v={$(c.dr.af)} hi/>
              <Ca type="info" title="Sequence">DRO split before payment option. RMC §18-408.</Ca>
            </Panel>
          )}

          {/* Scenario (conditional) */}
          {c.sc && (
            <Panel id="scenario" title="Scenario Modeler" icon="📊" status={confirmed.has("scenario")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="scenario"} onFocus={setFocused}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"8px"}}>
                <div style={{padding:"10px",borderRadius:"7px",border:`1px solid ${C.dnb}`,background:C.dnm,textAlign:"center"}}>
                  <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase"}}>Retire Now</div>
                  <div style={{color:C.dn,fontSize:"20px",fontWeight:700,fontFamily:"monospace",marginTop:"3px"}}>{$(c.bn.rd)}</div>
                  <div style={{color:C.t3,fontSize:"9.5px",marginTop:"2px"}}>Age {e.age} · −{e.rp}%</div>
                </div>
                <div style={{padding:"10px",borderRadius:"7px",border:`1px solid ${C.okb}`,background:C.okm,textAlign:"center"}}>
                  <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase"}}>Wait to {c.sc.wd}</div>
                  <div style={{color:C.ok,fontSize:"20px",fontWeight:700,fontFamily:"monospace",marginTop:"3px"}}>{$(c.sc.b)}</div>
                  <div style={{color:C.t3,fontSize:"9.5px",marginTop:"2px"}}>Age {c.sc.wa} · {c.sc.mt?"No reduction":"Normal ret."}</div>
                </div>
              </div>
              {c.sc.mu && <div style={{padding:"8px",background:C.el,borderRadius:"6px",textAlign:"center",border:`1px solid ${C.bd}`,fontSize:"11px"}}>
                <span style={{color:C.t2}}>Waiting {c.sc.wa-e.age}y → </span><span style={{color:C.ok,fontWeight:700}}>{c.sc.mu} benefit</span>
              </div>}
              {c.sc.mt
                ? <Ca type="success">At age {c.sc.wa}, {e.rt}: {c.sc.sm?.toFixed(2)} ≥ {e.tg}. Reduction eliminated.</Ca>
                : <Ca type="info">{c.sc.nt || `At age ${c.sc.wa}, normal retirement.`}</Ca>}
            </Panel>
          )}

          {/* Payment Options */}
          <Panel id="payment" title="Payment Option" icon="💳" status={confirmed.has("payment")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="payment"} onFocus={setFocused}>
            {c.dr && <Ca type="info" title="DRO Applied">Options on post-DRO: {$(c.dr.af)}</Ca>}
            {oRows.map(r => {
              const el = c.op.el===r.k;
              return (
                <div key={r.k} style={{padding:"8px 10px",marginTop:"4px",borderRadius:"6px",border:`1px solid ${el?C.ac:C.bd}`,background:el?C.am:"transparent"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{color:el?C.ac:C.tx,fontSize:"11.5px",fontWeight:el?600:400}}>
                        <span>{el?"● ":"○ "}</span>{r.l}{el && <span style={{marginLeft:"5px"}}><Bg t="Elected" bg={C.as} c={C.ac}/></span>}
                      </div>
                      <div style={{color:C.t3,fontSize:"9.5px",marginTop:"1px",marginLeft:"14px"}}>Factor: {r.f.toFixed(4)} · Survivor: {r.s}</div>
                    </div>
                    <span style={{fontFamily:"monospace",color:el?C.ac:C.tx,fontWeight:600,fontSize:"13px"}}>{$(r.m)}</span>
                  </div>
                </div>
              );
            })}
            {c.bf.rl==="Spouse" && <Ca type="warning" title="Spousal Consent">{c.bf.nm} must be beneficiary for ≥50% J&S unless waiver. RMC §18-403(d).</Ca>}
            {!c.op.j1 && <Ca type="info">J&S N/A — beneficiary: {c.bf.nm} ({c.bf.rl}).</Ca>}
          </Panel>

          {/* IPR */}
          <Panel id="ipr" title="IPR" icon="🏥" status={confirmed.has("ipr")?"confirmed":"pending"} onConfirm={handleConfirm} focused={focused==="ipr"} onFocus={setFocused}>
            <Fd l="Service for IPR" v={`${c.ip.sv}y`} sub="Earned only"/>
            <Fd l="Pre-Medicare (< 65)" v={$(c.ip.pr)} hi sub={`$12.50 × ${c.ip.sv}`}/>
            <Fd l="Post-Medicare (≥ 65)" v={$(c.ip.po)} sub={`$6.25 × ${c.ip.sv}`}/>
          </Panel>

        </div>

        {/* LIVE SUMMARY SIDEBAR */}
        <div style={{width:"220px",borderLeft:`1px solid ${C.bd}`,flexShrink:0,background:C.sf,display:"flex",flexDirection:"column"}}>
          <LiveSummary c={c} confirmed={confirmed}/>
        </div>
      </div>

      {/* Case selector (POC only) */}
      <div style={{display:"flex",alignItems:"center",padding:"5px 12px",gap:"4px",borderTop:`1px solid ${C.bd}`,background:C.sf,flexShrink:0}}>
        <span style={{fontSize:"9px",color:C.t4,textTransform:"uppercase",letterSpacing:"1px",marginRight:"4px"}}>Demo</span>
        {Object.entries(DATA).map(([k,v])=>{const t=TM[v.mb.t]; return(
          <button key={k} onClick={()=>setCk(k)} style={{padding:"3px 9px",borderRadius:"5px",border:`1px solid ${ck===k?t.c:C.bd}`,background:ck===k?t.m:"transparent",color:ck===k?t.c:C.t3,cursor:"pointer",fontSize:"10px",fontWeight:ck===k?600:400}}>
            {v.mb.nm.split(" ")[0]}{k==="c4"?" +DRO":""}
          </button>
        )})}
        <span style={{color:C.t4,fontSize:"9.5px",marginLeft:"6px",fontStyle:"italic"}}>{c.lb}</span>
      </div>
    </div>
  );
}