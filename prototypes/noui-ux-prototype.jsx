import { useState, useEffect, useRef, useCallback } from "react";

const colors = {
  bg: "#0F1419",
  surface: "#1A2332",
  elevated: "#243447",
  border: "#2A3F55",
  borderSubtle: "#1E3044",
  accent: "#22D3EE",
  accentMuted: "rgba(34,211,238,0.12)",
  accentGlow: "rgba(34,211,238,0.25)",
  warm: "#F59E0B",
  warmMuted: "rgba(245,158,11,0.12)",
  success: "#10B981",
  successMuted: "rgba(16,185,129,0.12)",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  tier1: "#3B82F6",
  tier1Muted: "rgba(59,130,246,0.15)",
};

const steps = [
  { id: "confirm-retirement", label: "Confirm Retirement", icon: "📋", description: "Verify retirement date and type" },
  { id: "verify-employment", label: "Verify Employment", icon: "📊", description: "Review employment history" },
  { id: "salary-ams", label: "Salary & AMS", icon: "💰", description: "Confirm salary data and AMS window" },
  { id: "eligibility", label: "Eligibility", icon: "✓", description: "Review eligibility determination" },
  { id: "benefit-calc", label: "Benefit Calculation", icon: "🔢", description: "Review calculated benefit amount" },
  { id: "payment-option", label: "Payment Option", icon: "💳", description: "Select payment option and beneficiary" },
  { id: "certification", label: "Final Certification", icon: "✅", description: "Final review and certification" },
];

function Field({ label, value, highlight, badge, compact }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: compact ? "6px 0" : "10px 0",
      borderBottom: `1px solid ${colors.borderSubtle}`,
    }}>
      <span style={{ color: colors.textMuted, fontSize: compact ? "12px" : "14px" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {badge && (
          <span style={{
            fontSize: "10px", padding: "2px 8px", borderRadius: "99px",
            background: badge.bg, color: badge.color, fontWeight: 600,
            letterSpacing: "0.5px", textTransform: "uppercase",
          }}>{badge.text}</span>
        )}
        <span style={{
          color: highlight ? colors.accent : colors.text,
          fontWeight: 600, fontFamily: "monospace",
          fontSize: compact ? "12px" : "14px",
          textShadow: highlight ? `0 0 20px ${colors.accentGlow}` : "none",
        }}>{value}</span>
      </span>
    </div>
  );
}

function StepContent({ stepId, compact = false }) {
  const contents = {
    "confirm-retirement": (
      <div>
        <Field label="Retirement Date" value="April 1, 2026" highlight compact={compact} />
        <Field label="Retirement Type" value="Service Retirement" compact={compact} />
        <Field label="Age at Retirement" value="63 years" compact={compact} />
        <Field label="Years of Service" value="28 years, 9 months" compact={compact} />
        <Field label="Rule of 75" value="91.75" highlight badge={{ text: "Met", bg: colors.successMuted, color: colors.success }} compact={compact} />
        <Field label="Reduction" value="None" compact={compact} />
        <div style={{
          marginTop: compact ? "8px" : "16px", padding: compact ? "8px" : "12px",
          background: colors.successMuted, borderRadius: "8px",
          border: "1px solid rgba(16,185,129,0.2)",
        }}>
          <span style={{ color: colors.success, fontSize: compact ? "11px" : "13px" }}>
            ✓ Age 63 + Service 28.75 = 91.75 — exceeds Rule of 75. No early retirement reduction.
          </span>
        </div>
      </div>
    ),
    "verify-employment": (
      <div>
        <Field label="Hire Date" value="June 15, 1997" compact={compact} />
        <Field label="Department" value="Public Works" compact={compact} />
        <Field label="Position" value="Senior Engineer" compact={compact} />
        <Field label="Employment Type" value="Full-time (1.0 FTE)" compact={compact} />
        <Field label="Total Records" value="4 periods — all shown" compact={compact} />
        <Field label="Gaps" value="None detected" badge={{ text: "Clean", bg: colors.successMuted, color: colors.success }} compact={compact} />
        <Field label="Purchased Service" value="None" compact={compact} />
      </div>
    ),
    "salary-ams": (
      <div>
        <Field label="AMS Window" value="36 consecutive months" compact={compact} />
        <Field label="Window Period" value="Apr 2023 — Mar 2026" highlight compact={compact} />
        <Field label="Average Monthly Salary" value="$8,542.31" highlight compact={compact} />
        <div style={{
          marginTop: compact ? "8px" : "14px", padding: compact ? "8px" : "12px",
          background: colors.warmMuted, borderRadius: "8px",
          border: "1px solid rgba(245,158,11,0.2)",
        }}>
          <span style={{ color: colors.warm, fontSize: compact ? "11px" : "13px", fontWeight: 600 }}>
            Leave Payout Impact
          </span>
          <div style={{ marginTop: "6px", color: colors.text, fontSize: compact ? "11px" : "13px" }}>
            $52,000 added to final month → AMS boosted by $214.32/mo
          </div>
        </div>
        <Field label="AMS Without Payout" value="$8,327.99" compact={compact} />
        <Field label="AMS With Payout" value="$8,542.31" highlight compact={compact} />
      </div>
    ),
    eligibility: (
      <div>
        <Field label="Tier" value="Tier 1" badge={{ text: "Pre-2004", bg: colors.tier1Muted, color: colors.tier1 }} compact={compact} />
        <Field label="Vested" value="Yes — 28.75 years" badge={{ text: "Met", bg: colors.successMuted, color: colors.success }} compact={compact} />
        <Field label="Normal Retirement (65)" value="Not yet" compact={compact} />
        <Field label="Rule of 75" value="91.75 ≥ 75" highlight badge={{ text: "Met", bg: colors.successMuted, color: colors.success }} compact={compact} />
        <Field label="Minimum Age (55)" value="63 — Met" badge={{ text: "Met", bg: colors.successMuted, color: colors.success }} compact={compact} />
        <Field label="Benefit Reduction" value="0%" highlight compact={compact} />
        <Field label="Leave Payout Eligible" value="Yes — hired before Jan 1, 2010" compact={compact} />
      </div>
    ),
    "benefit-calc": (
      <div>
        <div style={{
          padding: compact ? "10px" : "16px", background: colors.accentMuted,
          borderRadius: "8px", border: "1px solid rgba(34,211,238,0.15)",
          marginBottom: compact ? "10px" : "16px", textAlign: "center",
        }}>
          <div style={{ color: colors.textMuted, fontSize: compact ? "10px" : "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Formula: 2.0% × AMS × Years of Service
          </div>
          <div style={{
            color: colors.accent, fontSize: compact ? "18px" : "28px",
            fontWeight: 700, fontFamily: "monospace", marginTop: "8px",
            textShadow: `0 0 30px ${colors.accentGlow}`,
          }}>$4,911.83/mo</div>
          <div style={{ color: colors.textMuted, fontSize: compact ? "10px" : "12px", marginTop: "4px" }}>
            0.020 × $8,542.31 × 28.75
          </div>
        </div>
        <Field label="Multiplier" value="2.0% (Tier 1)" compact={compact} />
        <Field label="AMS" value="$8,542.31" compact={compact} />
        <Field label="Service Credit" value="28.75 years" compact={compact} />
        <Field label="Annual Benefit" value="$58,941.96" compact={compact} />
        <Field label="Monthly Benefit" value="$4,911.83" highlight compact={compact} />
      </div>
    ),
    "payment-option": (
      <div>
        {[
          { opt: "Maximum (Single Life)", amt: "$4,911.83", survivor: "—", selected: false },
          { opt: "100% Joint & Survivor", amt: "$4,224.17", survivor: "$4,224.17", selected: false },
          { opt: "75% Joint & Survivor", amt: "$4,420.65", survivor: "$3,315.49", selected: true },
          { opt: "50% Joint & Survivor", amt: "$4,617.12", survivor: "$2,308.56", selected: false },
        ].map((row) => (
          <div key={row.opt} style={{
            padding: compact ? "8px 10px" : "12px 16px", marginBottom: "6px",
            borderRadius: "8px",
            border: `1px solid ${row.selected ? colors.accent : colors.border}`,
            background: row.selected ? colors.accentMuted : "transparent",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            cursor: "pointer",
          }}>
            <div>
              <div style={{ color: row.selected ? colors.accent : colors.text, fontSize: compact ? "12px" : "14px", fontWeight: row.selected ? 600 : 400 }}>
                {row.selected ? "● " : "○ "}{row.opt}
              </div>
              <div style={{ color: colors.textDim, fontSize: compact ? "10px" : "12px", marginTop: "2px" }}>
                Survivor: {row.survivor}
              </div>
            </div>
            <span style={{ fontFamily: "monospace", color: row.selected ? colors.accent : colors.text, fontWeight: 600, fontSize: compact ? "13px" : "15px" }}>
              {row.amt}
            </span>
          </div>
        ))}
        <div style={{ marginTop: "10px", padding: compact ? "8px" : "12px", background: colors.warmMuted, borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)" }}>
          <span style={{ color: colors.warm, fontSize: compact ? "11px" : "13px" }}>
            ⚠ Elena Martinez (spouse, age 59) must be beneficiary for at least 50% J&S unless spousal consent waiver is signed.
          </span>
        </div>
      </div>
    ),
    certification: (
      <div>
        <Field label="Member" value="Robert Martinez" compact={compact} />
        <Field label="Effective Date" value="April 1, 2026" compact={compact} />
        <Field label="Monthly Benefit" value="$4,420.65" highlight compact={compact} />
        <Field label="Payment Option" value="75% J&S" compact={compact} />
        <Field label="Beneficiary" value="Elena Martinez (spouse)" compact={compact} />
        <Field label="Survivor Benefit" value="$3,315.49/mo" compact={compact} />
        <Field label="IPR Eligible" value="$179.69/mo (28.75 × $6.25)" compact={compact} />
        <div style={{
          marginTop: compact ? "10px" : "16px", padding: compact ? "10px" : "16px",
          background: colors.elevated, borderRadius: "8px",
          border: `1px solid ${colors.border}`, textAlign: "center",
        }}>
          <div style={{ color: colors.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Ready for Certification
          </div>
          <div style={{
            display: "inline-block", padding: "10px 32px",
            background: `linear-gradient(135deg, ${colors.accent}, #06B6D4)`,
            color: colors.bg, fontWeight: 700, borderRadius: "8px", fontSize: "14px", cursor: "pointer",
          }}>Certify & Submit</div>
        </div>
      </div>
    ),
  };
  return contents[stepId] || null;
}

function MemberBanner({ compact }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: compact ? "10px 16px" : "14px 24px",
      background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.elevated} 100%)`,
      borderBottom: `1px solid ${colors.border}`, flexWrap: "wrap", gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: compact ? "32px" : "40px", height: compact ? "32px" : "40px",
          borderRadius: "10px", background: colors.tier1Muted,
          border: `2px solid ${colors.tier1}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: colors.tier1, fontSize: compact ? "12px" : "14px",
        }}>T1</div>
        <div>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: compact ? "14px" : "16px" }}>Robert Martinez</div>
          <div style={{ color: colors.textMuted, fontSize: compact ? "11px" : "12px" }}>DERP-1997-04821 · Age 63 · 28y 9m service</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { label: "Status", value: "Active", color: colors.success },
          { label: "Dept", value: "Public Works" },
          { label: "Retiring", value: "Apr 1, 2026", color: colors.accent },
        ].map((t) => (
          <div key={t.label} style={{
            padding: "4px 10px", borderRadius: "6px",
            background: colors.surface, border: `1px solid ${colors.borderSubtle}`, fontSize: "11px",
          }}>
            <span style={{ color: colors.textDim }}>{t.label} </span>
            <span style={{ color: t.color || colors.text, fontWeight: 600 }}>{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ MODEL A: DECK ═══
function DeckModel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [anim, setAnim] = useState(false);

  const advance = () => {
    if (anim) return;
    setAnim(true);
    setCompleted((p) => new Set([...p, activeIdx]));
    setTimeout(() => {
      if (activeIdx < steps.length - 1) setActiveIdx(activeIdx + 1);
      setAnim(false);
    }, 400);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: colors.bg }}>
      <MemberBanner />
      <div style={{
        display: "flex", padding: "12px 24px", gap: "4px",
        background: colors.surface, borderBottom: `1px solid ${colors.borderSubtle}`,
      }}>
        {steps.map((s, i) => (
          <div key={s.id} onClick={() => !anim && (completed.has(i) || i <= activeIdx) && setActiveIdx(i)}
            style={{
              flex: 1, height: "4px", borderRadius: "2px",
              background: completed.has(i) ? colors.success : i === activeIdx ? colors.accent : colors.border,
              cursor: completed.has(i) || i <= activeIdx ? "pointer" : "default",
              transition: "all 0.4s", boxShadow: i === activeIdx ? `0 0 8px ${colors.accentGlow}` : "none",
            }} />
        ))}
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", padding: "24px" }}>
        {steps.map((step, i) => {
          const offset = i - activeIdx;
          if (Math.abs(offset) > 2) return null;
          const isActive = offset === 0;
          const isFuture = offset > 0;
          return (
            <div key={step.id} style={{
              position: "absolute", inset: "24px",
              transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isActive ? "translateX(0) scale(1)"
                : isFuture ? `translateX(${offset * 50}px) scale(${1 - offset * 0.07})`
                : `translateX(${offset * 60}px) scale(0.92)`,
              opacity: isActive ? 1 : offset < 0 ? 0 : 1 - offset * 0.3,
              zIndex: isActive ? 10 : 10 - Math.abs(offset),
              pointerEvents: isActive ? "auto" : "none",
            }}>
              <div style={{
                height: "100%",
                background: isActive ? `linear-gradient(180deg, ${colors.elevated}, ${colors.surface})` : colors.surface,
                borderRadius: "16px",
                border: `1px solid ${isActive ? colors.accent : colors.border}`,
                boxShadow: isActive ? `0 0 0 1px ${colors.accent}, 0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${colors.accentGlow}` : `0 4px 20px rgba(0,0,0,0.3)`,
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}>
                <div style={{
                  padding: "20px 24px", borderBottom: `1px solid ${colors.borderSubtle}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{step.icon}</span>
                    <div>
                      <div style={{ color: colors.text, fontWeight: 700, fontSize: "16px" }}>{step.label}</div>
                      <div style={{ color: colors.textMuted, fontSize: "12px" }}>Step {i + 1} of {steps.length} · {step.description}</div>
                    </div>
                  </div>
                  {completed.has(i) && (
                    <span style={{ padding: "4px 12px", borderRadius: "99px", background: colors.successMuted, color: colors.success, fontSize: "12px", fontWeight: 600 }}>✓ Complete</span>
                  )}
                </div>
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <StepContent stepId={step.id} />
                </div>
                {isActive && (
                  <div style={{
                    padding: "16px 24px", borderTop: `1px solid ${colors.borderSubtle}`,
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <button onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)} disabled={activeIdx === 0}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: "transparent", color: activeIdx === 0 ? colors.textDim : colors.textMuted, cursor: activeIdx === 0 ? "default" : "pointer", fontSize: "13px" }}>
                      ← Previous
                    </button>
                    <button onClick={advance}
                      style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: `linear-gradient(135deg, ${colors.accent}, #06B6D4)`, color: colors.bg, fontWeight: 700, cursor: "pointer", fontSize: "13px", boxShadow: `0 4px 15px ${colors.accentGlow}` }}>
                      {i === steps.length - 1 ? "Complete" : "Confirm & Continue →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ MODEL B: FLOW ═══
function FlowModel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const activeRef = useRef(null);

  const advance = () => {
    setCompleted((p) => new Set([...p, activeIdx]));
    if (activeIdx < steps.length - 1) setActiveIdx(activeIdx + 1);
  };

  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIdx]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: colors.bg }}>
      <MemberBanner />
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px 80px" }}>
        <div style={{ position: "relative", paddingLeft: "40px", marginTop: "16px" }}>
          <div style={{
            position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px",
            background: `linear-gradient(180deg, ${colors.accent} ${((activeIdx + 1) / steps.length) * 100}%, ${colors.border} ${((activeIdx + 1) / steps.length) * 100}%)`,
          }} />
          {steps.map((step, i) => {
            const isActive = i === activeIdx;
            const isDone = completed.has(i);
            const isFuture = i > activeIdx;
            return (
              <div key={step.id} ref={isActive ? activeRef : null} style={{ position: "relative", marginBottom: isActive ? "16px" : "8px", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
                <div style={{
                  position: "absolute", left: "-32px", top: isActive ? "20px" : "10px",
                  width: isActive ? "14px" : "10px", height: isActive ? "14px" : "10px",
                  borderRadius: "50%",
                  background: isDone ? colors.success : isActive ? colors.accent : colors.border,
                  border: `2px solid ${isDone ? colors.success : isActive ? colors.accent : colors.border}`,
                  boxShadow: isActive ? `0 0 12px ${colors.accentGlow}` : "none",
                  transition: "all 0.4s", zIndex: 2,
                }} />
                <div onClick={() => isDone && setActiveIdx(i)}
                  style={{
                    background: isActive ? colors.elevated : isDone ? colors.surface : "transparent",
                    borderRadius: "12px",
                    border: `1px solid ${isActive ? colors.accent : isDone ? colors.borderSubtle : "transparent"}`,
                    boxShadow: isActive ? `0 0 0 1px rgba(34,211,238,0.15), 0 8px 32px rgba(0,0,0,0.3)` : "none",
                    overflow: "hidden", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
                    cursor: isDone ? "pointer" : "default", opacity: isFuture ? 0.4 : 1,
                  }}>
                  <div style={{
                    padding: isActive ? "16px 20px" : "8px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: isActive ? "20px" : "14px", transition: "font-size 0.3s" }}>{step.icon}</span>
                      <span style={{
                        color: isActive ? colors.text : isDone ? colors.textMuted : colors.textDim,
                        fontWeight: isActive ? 700 : 500, fontSize: isActive ? "15px" : "13px",
                      }}>
                        {step.label}
                        {isDone && !isActive && <span style={{ color: colors.success, fontSize: "11px", marginLeft: "8px" }}>✓</span>}
                      </span>
                    </div>
                    {isActive && <span style={{ color: colors.textDim, fontSize: "11px" }}>Step {i + 1}/{steps.length}</span>}
                  </div>
                  {isActive && (
                    <div style={{ padding: "0 20px 20px" }}>
                      <StepContent stepId={step.id} />
                      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={(e) => { e.stopPropagation(); advance(); }}
                          style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: `linear-gradient(135deg, ${colors.accent}, #06B6D4)`, color: colors.bg, fontWeight: 700, cursor: "pointer", fontSize: "13px", boxShadow: `0 4px 15px ${colors.accentGlow}` }}>
                          {i === steps.length - 1 ? "Complete ✓" : "Confirm & Continue ↓"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══ MODEL C: ORBIT ═══
function OrbitModel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  const advance = () => {
    setCompleted((p) => new Set([...p, activeIdx]));
    if (activeIdx < steps.length - 1) setActiveIdx(activeIdx + 1);
  };

  const previews = {
    "verify-employment": "4 employment records, no gaps detected",
    "salary-ams": "AMS $8,542.31/mo — leave payout impact detected",
    eligibility: "Rule of 75: 91.75 — eligible, no reduction",
    "benefit-calc": "Estimated: $4,911.83/mo (Tier 1 formula)",
    "payment-option": "4 options — spouse consent may apply",
    certification: "All prior steps must be confirmed",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: colors.bg }}>
      <MemberBanner compact />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left rail: completed */}
        <div style={{
          width: activeIdx > 0 ? "56px" : "0px", transition: "width 0.5s",
          overflow: "hidden", borderRight: activeIdx > 0 ? `1px solid ${colors.borderSubtle}` : "none",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: "12px", gap: "4px", flexShrink: 0,
        }}>
          {steps.slice(0, activeIdx).map((s, i) => (
            <div key={s.id} onClick={() => setActiveIdx(i)} title={s.label}
              style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: completed.has(i) ? colors.successMuted : colors.surface,
                border: `1px solid ${completed.has(i) ? "rgba(16,185,129,0.3)" : colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", cursor: "pointer", transition: "all 0.3s",
              }}>
              {completed.has(i) ? <span style={{ color: colors.success, fontSize: "14px" }}>✓</span> : s.icon}
            </div>
          ))}
        </div>

        {/* Center: active step */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{
            padding: "16px 24px", borderBottom: `1px solid ${colors.borderSubtle}`,
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{ fontSize: "24px" }}>{steps[activeIdx].icon}</span>
            <div>
              <div style={{ color: colors.text, fontWeight: 700, fontSize: "16px" }}>{steps[activeIdx].label}</div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>{steps[activeIdx].description}</div>
            </div>
            <div style={{ marginLeft: "auto", color: colors.textDim, fontSize: "12px" }}>{activeIdx + 1} / {steps.length}</div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            <StepContent stepId={steps[activeIdx].id} />
          </div>
          <div style={{
            padding: "14px 24px", borderTop: `1px solid ${colors.borderSubtle}`,
            display: "flex", justifyContent: "space-between",
          }}>
            <button onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)} disabled={activeIdx === 0}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`, background: "transparent", color: activeIdx === 0 ? colors.textDim : colors.textMuted, cursor: activeIdx === 0 ? "default" : "pointer", fontSize: "13px" }}>
              ←
            </button>
            <button onClick={advance}
              style={{ padding: "10px 28px", borderRadius: "8px", border: "none", background: `linear-gradient(135deg, ${colors.accent}, #06B6D4)`, color: colors.bg, fontWeight: 700, cursor: "pointer", fontSize: "13px", boxShadow: `0 4px 15px ${colors.accentGlow}` }}>
              {activeIdx === steps.length - 1 ? "Complete ✓" : "Confirm →"}
            </button>
          </div>
        </div>

        {/* Right rail: upcoming */}
        <div style={{
          width: activeIdx < steps.length - 1 ? "220px" : "0px", transition: "width 0.5s",
          overflow: "hidden", borderLeft: `1px solid ${colors.borderSubtle}`,
          flexShrink: 0, display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "12px 16px", color: colors.textDim, fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>
            Coming Up
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 12px" }}>
            {steps.slice(activeIdx + 1).map((s, i) => {
              const isNext = i === 0;
              return (
                <div key={s.id} style={{
                  padding: "10px 12px", marginBottom: "6px", borderRadius: "10px",
                  background: isNext ? colors.accentMuted : "transparent",
                  border: `1px solid ${isNext ? "rgba(34,211,238,0.15)" : "transparent"}`,
                  opacity: 1 - i * 0.15, transition: "all 0.4s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{s.icon}</span>
                    <div>
                      <div style={{ color: isNext ? colors.accent : colors.textMuted, fontSize: "12px", fontWeight: isNext ? 600 : 400 }}>{s.label}</div>
                      <div style={{ color: colors.textDim, fontSize: "10px", marginTop: "2px" }}>{s.description}</div>
                    </div>
                  </div>
                  {isNext && previews[s.id] && (
                    <div style={{
                      marginTop: "8px", padding: "6px 8px", borderRadius: "6px",
                      background: colors.surface, border: `1px solid ${colors.borderSubtle}`,
                    }}>
                      <div style={{ color: colors.textDim, fontSize: "10px", fontStyle: "italic" }}>
                        Preview: {previews[s.id]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN ═══
export default function App() {
  const [model, setModel] = useState("deck");
  const models = [
    { key: "deck", label: "Deck", desc: "Stacked cards with depth — next steps peek behind" },
    { key: "flow", label: "Flow", desc: "Vertical stream — completed compresses, active expands" },
    { key: "orbit", label: "Orbit", desc: "Three-zone — past, present, future visible at once" },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: colors.bg, color: colors.text }}>
      <div style={{
        display: "flex", alignItems: "center", padding: "12px 20px", gap: "8px",
        borderBottom: `1px solid ${colors.border}`, background: colors.surface, flexWrap: "wrap",
      }}>
        <span style={{ color: colors.textDim, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginRight: "8px" }}>
          UX Model
        </span>
        {models.map((m) => (
          <button key={m.key} onClick={() => setModel(m.key)}
            style={{
              padding: "6px 14px", borderRadius: "8px",
              border: `1px solid ${model === m.key ? colors.accent : colors.border}`,
              background: model === m.key ? colors.accentMuted : "transparent",
              color: model === m.key ? colors.accent : colors.textMuted,
              cursor: "pointer", fontSize: "12px", fontWeight: model === m.key ? 600 : 400, transition: "all 0.2s",
            }}>{m.label}</button>
        ))}
        <span style={{ color: colors.textDim, fontSize: "11px", marginLeft: "12px", fontStyle: "italic" }}>
          {models.find((m) => m.key === model)?.desc}
        </span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {model === "deck" && <DeckModel key="deck" />}
        {model === "flow" && <FlowModel key="flow" />}
        {model === "orbit" && <OrbitModel key="orbit" />}
      </div>
    </div>
  );
}
