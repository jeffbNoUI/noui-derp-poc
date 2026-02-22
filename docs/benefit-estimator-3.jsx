import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// NoUI Navigation Pattern Prototypes
// Three models: Nav Rail · Accordion · Dashboard Cards
// Case: Robert Martinez — Tier 1, Rule of 75, Leave Payout
// ═══════════════════════════════════════════════════════════════

const C = {
  bg:"#0B1017",sf:"#131C27",el:"#1A2736",
  bd:"#243447",bs:"#1B2D40",
  ac:"#22D3EE",am:"rgba(34,211,238,0.10)",ag:"rgba(34,211,238,0.20)",as:"rgba(34,211,238,0.15)",
  wm:"#F59E0B",wmm:"rgba(245,158,11,0.10)",wmb:"rgba(245,158,11,0.25)",
  dn:"#EF4444",dnm:"rgba(239,68,68,0.10)",
  ok:"#10B981",okm:"rgba(16,185,129,0.10)",okb:"rgba(16,185,129,0.25)",
  tx:"#E2E8F0",t2:"#94A3B8",t3:"#64748B",t4:"#475569",
  t1c:"#3B82F6",t1m:"rgba(59,130,246,0.12)",
};
const $ = n => "$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

const PANELS = [
  { id:"confirm", icon:"📋", label:"Confirm Retirement", preview:"Apr 1, 2026 · Age 63",
    summary:"Service retirement effective April 1, 2026", keyVal:"Apr 1, 2026",
    fields:[
      {l:"Retirement Date",v:"2026-04-01",hi:true},{l:"Type",v:"Service Retirement"},
      {l:"Age at Retirement",v:"63 years"},{l:"Years of Service",v:"28.75 years"},
    ],
    callout:{type:"success",title:"Rule of 75 Satisfied",text:"Age 63 + Service 28.75 = 91.75 ≥ 75. No reduction."},
  },
  { id:"elig", icon:"✓", label:"Eligibility", preview:"Tier 1 · Vested · No reduction",
    summary:"Tier 1, Rule of 75 met, no benefit reduction", keyVal:"No reduction",
    fields:[
      {l:"Tier",v:"Tier 1",bg:{t:"Pre-2004",bg:C.t1m,c:C.t1c}},
      {l:"Vested",v:"Yes — 28.75y",bg:{t:"Met",bg:C.okm,c:C.ok}},
      {l:"Rule of 75",v:"91.75 ≥ 75",hi:true,bg:{t:"Met",bg:C.okm,c:C.ok}},
      {l:"Min Age (55)",v:"63 — Met",bg:{t:"Met",bg:C.okm,c:C.ok}},
      {l:"Reduction",v:"0%",hi:true},
      {l:"Leave Payout",v:"Yes — $52,000",sub:"Hired before Jan 1, 2010"},
    ],
  },
  { id:"salary", icon:"💰", label:"Salary & AMS", preview:`AMS ${$(10639.45)} · 36-mo window`,
    summary:`AMS ${$(10639.45)}/mo (36-month window, includes $52K leave payout)`, keyVal:$(10639.45),
    fields:[
      {l:"AMS Window",v:"36 consecutive months"},{l:"Period",v:"Apr 2023 — Mar 2026",hi:true},
      {l:"Base Salary Total",v:$(331020.24)},{l:"+ Leave Payout",v:$(52000),bg:{t:"Boost",bg:C.wmm,c:C.wm}},
      {l:"Grand Total",v:$(383020.24)},{l:"÷ 36 months",v:$(10639.45),hi:true},
    ],
    callout:{type:"warning",title:"Leave Payout Impact",text:`$52,000 added. Without: ${$(9194.45)} → With: ${$(10639.45)} (+${$(1445.00)}/mo)`},
  },
  { id:"benefit", icon:"🔢", label:"Benefit Calculation", preview:`${$(6117.68)}/mo · 2.0% × AMS × 28.75`,
    summary:`${$(6117.68)}/mo — 2.0% × ${$(10639.45)} × 28.75 years`, keyVal:$(6117.68)+"/mo", hero:true,
    fields:[
      {l:"Multiplier",v:"2.0% (Tier 1)",sub:"RMC §18-401"},{l:"AMS",v:$(10639.45)},
      {l:"Service",v:"28.75 years"},{l:"Unreduced Benefit",v:$(6117.68),hi:true},
      {l:"Annual Benefit",v:$(73412.16)},
    ],
    callout:{type:"success",title:"No Reduction",text:"Rule of 75 met — 100% of calculated benefit."},
  },
  { id:"payment", icon:"💳", label:"Payment Option", preview:"75% J&S elected · Elena (Spouse)",
    summary:`75% J&S elected — ${$(5597.68)}/mo · Survivor: ${$(4198.26)}/mo`, keyVal:$(5597.68)+"/mo",
    fields:[
      {l:"Maximum (Single Life)",v:$(6117.68)},{l:"100% J&S (× 0.8850)",v:$(5414.15)},
      {l:"75% J&S (× 0.9150)",v:$(5597.68),hi:true,bg:{t:"Elected",bg:C.as,c:C.ac}},
      {l:"50% J&S (× 0.9450)",v:$(5781.21)},{l:"Beneficiary",v:"Elena Martinez (Spouse)"},
      {l:"Survivor Benefit",v:$(4198.26)+"/mo"},
    ],
    callout:{type:"warning",title:"Spousal Consent",text:"Elena must be beneficiary for ≥50% J&S unless waiver. RMC §18-403(d)."},
  },
  { id:"ipr", icon:"🏥", label:"IPR", preview:`Pre-Medicare: ${$(359.38)} · Post: ${$(179.69)}`,
    summary:`Pre-Medicare: ${$(359.38)}/mo · Post-Medicare: ${$(179.69)}/mo`, keyVal:$(359.38)+"/mo",
    fields:[
      {l:"Service for IPR",v:"28.75 years",sub:"Earned only"},
      {l:"Pre-Medicare (< 65)",v:$(359.38),hi:true,sub:"$12.50 × 28.75"},
      {l:"Post-Medicare (≥ 65)",v:$(179.69),sub:"$6.25 × 28.75"},
    ],
  },
  { id:"cert", icon:"✅", label:"Final Certification", preview:"All steps must be confirmed",
    summary:"Ready for certification when all panels confirmed", keyVal:"Pending", isCert:true,
    fields:[
      {l:"Member",v:"Robert Martinez"},{l:"Effective Date",v:"2026-04-01"},
      {l:"Monthly Benefit",v:$(5597.68),hi:true},{l:"Option",v:"75% Joint & Survivor"},
      {l:"Beneficiary",v:"Elena Martinez (Spouse)"},{l:"Survivor",v:$(4198.26)+"/mo"},
      {l:"IPR (pre-Medicare)",v:$(359.38)+"/mo"},
    ],
    govRefs:["§18-393 (Tier 1)","§18-391(3) (AMS 36mo)","§18-401(a) (2.0%)","§18-401(b) (Rule of 75)","§18-401.5 (Leave)","§18-403 (Options)","§18-412 (IPR)"],
  },
];

// ═══ MICRO-COMPONENTS ═══
function Bg({t,c:cl,bg}){return <span style={{display:"inline-block",fontSize:"9px",padding:"2px 6px",borderRadius:"99px",background:bg,color:cl,fontWeight:600,letterSpacing:"0.3px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t}</span>}

function Fd({l,v,hi,bg,sub}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.bs}`}}>
      <div style={{minWidth:0,flex:1}}>
        <span style={{color:C.t2,fontSize:"12px"}}>{l}</span>
        {sub && <div style={{color:C.t3,fontSize:"10px",marginTop:"1px"}}>{sub}</div>}
      </div>
      <span style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
        {bg && <Bg {...bg}/>}
        <span style={{color:hi?C.ac:C.tx,fontWeight:600,fontFamily:"'SF Mono',monospace",fontSize:"12px",textShadow:hi?`0 0 12px ${C.ag}`:"none"}}>{v}</span>
      </span>
    </div>
  );
}

function Ca({type,title,text}){
  const m={success:{b:C.okm,d:C.okb,c:C.ok},warning:{b:C.wmm,d:C.wmb,c:C.wm},info:{b:C.am,d:C.as,c:C.ac}}[type]||{b:C.am,d:C.as,c:C.ac};
  return(
    <div style={{padding:"8px 10px",background:m.b,borderRadius:"6px",border:`1px solid ${m.d}`,marginTop:"6px"}}>
      {title && <div style={{color:m.c,fontSize:"10.5px",fontWeight:600,marginBottom:"2px"}}>{title}</div>}
      <div style={{color:C.tx,fontSize:"11px",lineHeight:"1.45"}}>{text}</div>
    </div>
  );
}

function PanelContent({p, onConfirm, confirmed}){
  return(
    <div>
      {p.hero && (
        <div style={{padding:"12px",background:C.am,borderRadius:"7px",border:`1px solid ${C.as}`,textAlign:"center",marginBottom:"8px"}}>
          <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px"}}>2.0% × AMS × Service</div>
          <div style={{color:C.ac,fontSize:"26px",fontWeight:700,fontFamily:"monospace",marginTop:"4px",textShadow:`0 0 25px ${C.ag}`}}>{$(6117.68)}/mo</div>
          <div style={{color:C.t2,fontSize:"10.5px",marginTop:"3px",fontFamily:"monospace"}}>2.0% × {$(10639.45)} × 28.75</div>
        </div>
      )}
      {p.fields.map((f,i) => <Fd key={i} {...f}/>)}
      {p.callout && <Ca {...p.callout}/>}
      {p.govRefs && (
        <div style={{marginTop:"8px",padding:"7px 9px",background:C.el,borderRadius:"6px",border:`1px solid ${C.bs}`}}>
          <div style={{color:C.t3,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"3px"}}>Governing Authority</div>
          {p.govRefs.map((r,i)=><div key={i} style={{color:C.t3,fontSize:"9.5px"}}>· {r}</div>)}
        </div>
      )}
      <div style={{marginTop:"10px",display:"flex",justifyContent:"flex-end"}}>
        {!confirmed ? (
          <button onClick={onConfirm} style={{padding:"6px 18px",borderRadius:"6px",border:"none",background:`linear-gradient(135deg,${C.ac},#06B6D4)`,color:C.bg,fontWeight:700,cursor:"pointer",fontSize:"11.5px",boxShadow:`0 2px 8px ${C.ag}`}}>
            {p.isCert ? "Certify & Submit ✓" : "Confirm ✓"}
          </button>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:C.ok,fontSize:"11px",fontWeight:600}}>✓ Confirmed</span>
            <button onClick={onConfirm} style={{padding:"3px 10px",borderRadius:"5px",border:`1px solid ${C.bd}`,background:"transparent",color:C.t3,cursor:"pointer",fontSize:"10px"}}>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Banner(){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",background:`linear-gradient(135deg,${C.sf},${C.el})`,borderBottom:`1px solid ${C.bd}`,flexWrap:"wrap",gap:"6px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:"30px",height:"30px",borderRadius:"7px",background:C.t1m,border:`2px solid ${C.t1c}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:C.t1c,fontSize:"10px"}}>T1</div>
        <div>
          <div style={{color:C.tx,fontWeight:700,fontSize:"13px"}}>Robert Martinez</div>
          <div style={{color:C.t2,fontSize:"10px"}}>M-100001 · Age 63 · 28.75y · Public Works</div>
        </div>
      </div>
      <div style={{display:"flex",gap:"4px"}}>
        {[{l:"Retiring",v:"04-01",x:C.ac},{l:"Tier 1",v:"Pre-2004",x:C.t1c},{l:"Leave",v:$(52000),x:C.wm}].map(t=>
          <div key={t.l} style={{padding:"2px 7px",borderRadius:"4px",background:C.sf,border:`1px solid ${C.bs}`,fontSize:"9.5px"}}>
            <span style={{color:C.t3}}>{t.l} </span><span style={{color:t.x,fontWeight:600}}>{t.v}</span>
          </div>)}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MODEL B: VERTICAL NAV RAIL
// Left rail: icon + label + preview value. Center: active panel.
// Rail IS the summary — no separate sidebar needed.
// ═══════════════════════════════════════════════════════════════
function NavRailModel({ conf, toggle }){
  const [active, setActive] = useState("confirm");
  const ap = PANELS.find(p=>p.id===active);

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Nav Rail */}
      <div style={{width:"195px",borderRight:`1px solid ${C.bd}`,background:C.sf,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"8px 10px",color:C.t4,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:600,borderBottom:`1px solid ${C.bs}`}}>Workspace</div>
        <div style={{flex:1,overflow:"auto"}}>
          {PANELS.map((p,i)=>{
            const isA = p.id===active;
            const isD = conf.has(p.id);
            const isNext = !isD && !isA && PANELS.findIndex(x=>!conf.has(x.id) && x.id!==active)===i;
            return(
              <div key={p.id} onClick={()=>setActive(p.id)} style={{
                padding:"8px 10px",margin:"2px 5px",borderRadius:"7px",cursor:"pointer",transition:"all 0.15s",
                background:isA?C.am:isNext?`rgba(34,211,238,0.04)`:"transparent",
                border:`1px solid ${isA?C.as:isNext?"rgba(34,211,238,0.08)":"transparent"}`,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"5px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",flexShrink:0,
                    background:isD?C.okm:isA?C.am:"transparent",
                    border:isD?`1px solid rgba(16,185,129,0.3)`:isA?`1px solid ${C.as}`:`1px solid ${C.bs}`,
                  }}>
                    {isD ? <span style={{color:C.ok,fontSize:"10px"}}>✓</span> : <span>{p.icon}</span>}
                  </div>
                  <span style={{color:isA?C.ac:isD?C.ok:C.tx,fontSize:"11px",fontWeight:isA?600:400}}>{p.label}</span>
                </div>
                {/* Preview line */}
                <div style={{marginTop:"3px",marginLeft:"27px",fontSize:"9.5px",fontFamily:isD?"'SF Mono',monospace":"inherit",
                  color:isD?C.ok:C.t4,
                }}>
                  {isD ? p.keyVal : p.preview}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${C.bs}`,display:"flex",alignItems:"center",gap:"10px",flexShrink:0,background:C.el}}>
          <span style={{fontSize:"18px"}}>{ap.icon}</span>
          <div style={{flex:1}}>
            <div style={{color:C.tx,fontWeight:700,fontSize:"13.5px"}}>{ap.label}</div>
            <div style={{color:C.t3,fontSize:"10.5px"}}>{ap.summary}</div>
          </div>
          {conf.has(ap.id) ? <Bg t="Confirmed" bg={C.okm} c={C.ok}/> : <Bg t="Needs review" bg={C.wmm} c={C.wm}/>}
        </div>
        <div style={{flex:1,overflow:"auto",padding:"14px 18px"}}>
          <PanelContent p={ap} confirmed={conf.has(ap.id)} onConfirm={()=>toggle(ap.id)}/>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MODEL C: ACCORDION STACK
// All panels stacked vertically. Collapsed = summary + status.
// Expanded = full detail + confirm. Multiple can be open.
// ═══════════════════════════════════════════════════════════════
function AccordionModel({ conf, toggle }){
  const [expanded, setExpanded] = useState(new Set(["confirm"]));
  const flip = useCallback((id)=>{setExpanded(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})},[]);

  return(
    <div style={{flex:1,overflow:"auto",padding:"8px 12px 60px"}}>
      {PANELS.map((p,i)=>{
        const isOpen = expanded.has(p.id);
        const isDone = conf.has(p.id);
        const isNext = !isDone && !isOpen && PANELS.findIndex(x=>!conf.has(x.id))===i;
        const borderColor = isOpen?C.ac:isDone?C.ok:isNext?"rgba(34,211,238,0.25)":C.bs;

        return(
          <div key={p.id} style={{marginBottom:"5px",borderRadius:"8px",border:`1px solid ${borderColor}`,background:C.sf,overflow:"hidden",transition:"border-color 0.2s, box-shadow 0.2s",
            boxShadow:isOpen?`0 0 0 1px ${C.ac}22, 0 4px 16px rgba(0,0,0,0.25)`:"none",
          }}>
            {/* Header */}
            <div onClick={()=>flip(p.id)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"9px 12px",cursor:"pointer",
              background:isOpen?C.el:isNext?"rgba(34,211,238,0.03)":"transparent",
              borderBottom:isOpen?`1px solid ${C.bs}`:"none",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1,minWidth:0}}>
                <div style={{width:"22px",height:"22px",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",flexShrink:0,
                  background:isDone?C.okm:"transparent",border:`1px solid ${isDone?"rgba(16,185,129,0.3)":"transparent"}`,
                }}>
                  {isDone ? <span style={{color:C.ok,fontSize:"11px"}}>✓</span> : <span>{p.icon}</span>}
                </div>
                <span style={{color:isOpen?C.tx:isDone?C.ok:C.t2,fontWeight:600,fontSize:"12px"}}>{p.label}</span>
                {!isOpen && (
                  <span style={{color:isDone?C.ok:C.t4,fontSize:"10px",marginLeft:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    fontFamily:isDone?"'SF Mono',monospace":"inherit",
                  }}>
                    — {isDone ? p.keyVal : p.preview}
                  </span>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                {isDone && !isOpen && <Bg t="Confirmed" bg={C.okm} c={C.ok}/>}
                {!isDone && !isOpen && isNext && <Bg t="Up next" bg={C.am} c={C.ac}/>}
                {!isDone && !isOpen && !isNext && <Bg t="Pending" bg={C.wmm} c={C.wm}/>}
                <span style={{color:C.t4,fontSize:"11px",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
              </div>
            </div>
            {/* Content */}
            {isOpen && (
              <div style={{padding:"10px 12px"}}>
                <PanelContent p={p} confirmed={isDone} onConfirm={()=>toggle(p.id)}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MODEL E: DASHBOARD CARDS
// 2-col grid of summary cards. Click to drill into modal overlay.
// The grid IS the summary — worker sees all key values at once.
// ═══════════════════════════════════════════════════════════════
function CardsModel({ conf, toggle }){
  const [drill, setDrill] = useState(null);
  const dp = drill ? PANELS.find(p=>p.id===drill) : null;

  return(
    <div style={{flex:1,position:"relative",overflow:"hidden"}}>
      {/* Card grid */}
      <div style={{height:"100%",overflow:"auto",padding:"10px 12px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
          {PANELS.map((p,i)=>{
            const isDone = conf.has(p.id);
            const isNext = !isDone && PANELS.findIndex(x=>!conf.has(x.id))===i;
            return(
              <div key={p.id} onClick={()=>setDrill(p.id)} style={{
                padding:"11px",borderRadius:"8px",cursor:"pointer",transition:"all 0.15s",
                background:C.sf,
                border:`1px solid ${isDone?C.ok:isNext?C.ac:C.bs}`,
                boxShadow:isNext?`0 0 12px rgba(34,211,238,0.08)`:"none",
              }}>
                {/* Card header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{fontSize:"13px"}}>{p.icon}</span>
                    <span style={{color:isDone?C.ok:C.tx,fontSize:"11px",fontWeight:600}}>{p.label}</span>
                  </div>
                  {isDone ? <Bg t="✓" bg={C.okm} c={C.ok}/> : isNext ? <Bg t="Next" bg={C.am} c={C.ac}/> : <Bg t="Review" bg={C.wmm} c={C.wm}/>}
                </div>
                {/* Key value hero */}
                <div style={{
                  padding:"7px",borderRadius:"6px",marginBottom:"5px",textAlign:"center",
                  background:isDone?C.okm:C.am,border:`1px solid ${isDone?C.okb:C.as}`,
                }}>
                  <div style={{color:isDone?C.ok:C.ac,fontSize:"15px",fontWeight:700,fontFamily:"'SF Mono',monospace"}}>{p.keyVal}</div>
                </div>
                {/* Preview */}
                <div style={{color:C.t3,fontSize:"9.5px",lineHeight:"1.4"}}>{p.preview}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-in overlay */}
      {dp && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",zIndex:20}} onClick={()=>setDrill(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"92%",maxWidth:"480px",maxHeight:"82%",borderRadius:"12px",overflow:"hidden",
            background:C.sf,border:`1px solid ${C.ac}`,
            boxShadow:`0 0 0 1px ${C.ac}33, 0 20px 60px rgba(0,0,0,0.5)`,
            display:"flex",flexDirection:"column",
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${C.bs}`,background:C.el,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"16px"}}>{dp.icon}</span>
                <div>
                  <div style={{color:C.tx,fontWeight:700,fontSize:"13px"}}>{dp.label}</div>
                  <div style={{color:C.t3,fontSize:"10px"}}>{dp.summary}</div>
                </div>
              </div>
              <button onClick={()=>setDrill(null)} style={{background:"none",border:"none",color:C.t3,fontSize:"18px",cursor:"pointer",padding:"4px 8px",lineHeight:1}}>×</button>
            </div>
            <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
              <PanelContent p={dp} confirmed={conf.has(dp.id)} onConfirm={()=>toggle(dp.id)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══ MAIN APP ═══
export default function App(){
  const [model, setModel] = useState("rail");
  const [conf, setConf] = useState(new Set());
  const toggle = useCallback((id)=>{setConf(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})},[]);

  const models = [
    {key:"rail", label:"Nav Rail", desc:"Left rail shows all panels with preview values — center shows active detail"},
    {key:"accordion", label:"Accordion", desc:"All panels stacked — collapsed shows summary, expanded shows detail"},
    {key:"cards", label:"Dashboard Cards", desc:"Summary grid at a glance — drill into any card for full detail"},
  ];

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",background:C.bg,color:C.tx,overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.bd};border-radius:3px}`}</style>

      {/* Model switcher */}
      <div style={{display:"flex",alignItems:"center",padding:"7px 14px",gap:"6px",borderBottom:`1px solid ${C.bd}`,background:C.sf,flexWrap:"wrap",flexShrink:0}}>
        <span style={{color:C.t4,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:600,marginRight:"4px"}}>Pattern</span>
        {models.map(m=>(
          <button key={m.key} onClick={()=>setModel(m.key)} style={{
            padding:"5px 12px",borderRadius:"7px",
            border:`1px solid ${model===m.key?C.ac:C.bd}`,
            background:model===m.key?C.am:"transparent",
            color:model===m.key?C.ac:C.t3,
            cursor:"pointer",fontSize:"11px",fontWeight:model===m.key?600:400,transition:"all 0.15s",
          }}>{m.label}</button>
        ))}
        <span style={{color:C.t4,fontSize:"10px",marginLeft:"8px",fontStyle:"italic"}}>{models.find(m=>m.key===model)?.desc}</span>
      </div>

      {/* Header bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 14px",borderBottom:`1px solid ${C.bd}`,background:C.sf,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <div style={{width:"22px",height:"22px",borderRadius:"5px",background:`linear-gradient(135deg,${C.ac},#06B6D4)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"10px",color:C.bg}}>N</div>
          <span style={{color:C.tx,fontWeight:700,fontSize:"12.5px"}}>NoUI</span>
          <span style={{color:C.t3,fontSize:"10.5px"}}>Benefit Calculator</span>
        </div>
        <Bg t="Phase 1 · Transparent" bg={C.am} c={C.ac}/>
      </div>

      {/* Member banner */}
      <Banner/>

      {/* Progress bar */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 14px",background:C.sf,borderBottom:`1px solid ${C.bs}`,flexShrink:0}}>
        <div style={{flex:1,display:"flex",gap:"3px"}}>
          {PANELS.map(p=>(
            <div key={p.id} style={{flex:1,height:"3px",borderRadius:"2px",background:conf.has(p.id)?C.ok:C.bd,transition:"background 0.3s"}}/>
          ))}
        </div>
        <span style={{color:conf.size===PANELS.length?C.ok:C.t3,fontSize:"10px",fontWeight:600,flexShrink:0}}>{conf.size}/{PANELS.length}</span>
      </div>

      {/* Active model */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {model==="rail" && <NavRailModel key="r" conf={conf} toggle={toggle}/>}
        {model==="accordion" && <AccordionModel key="a" conf={conf} toggle={toggle}/>}
        {model==="cards" && <CardsModel key="c" conf={conf} toggle={toggle}/>}
      </div>
    </div>
  );
}