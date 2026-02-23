/**
 * Workflow Dashboard demo — supervisor workspace with pipeline, caseload, reassignment, and deadline views.
 * Shows processing pipeline, analyst utilization heatmap, case reassignment, and deadline risk aggregation.
 * Consumed by: router.tsx (/demos/workflow route)
 * Depends on: React (useState, useEffect, useMemo, useCallback)
 */
// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";

// ============================================================
// NoUI Workflow Management Dashboard Prototype
// Supervisor workspace variant with four views:
// 1. Processing Pipeline (cases by stage, aging, bottlenecks)
// 2. Caseload Heatmap (analyst utilization)
// 3. Direct Case Reassignment (action-based)
// 4. Deadline Risk Aggregation (team-wide)
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

const TODAY = new Date(2026, 2, 10);

function daysSince(d) { return Math.ceil((TODAY - new Date(d)) / (1000 * 60 * 60 * 24)); }
function daysUntil(d) { return Math.ceil((new Date(d) - TODAY) / (1000 * 60 * 60 * 24)); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

// ============================================================
// Simulated Data
// ============================================================
const ANALYSTS = [
  { id: "SC", name: "Sarah Chen", capacity: 12, mode: "Expert" },
  { id: "MW", name: "Marcus Williams", capacity: 10, mode: "Assisted" },
  { id: "RP", name: "Rachel Park", capacity: 8, mode: "Guided" },
];

const STAGES = [
  { id: "received", label: "Application Received", sla: 3, order: 0 },
  { id: "eligibility", label: "Eligibility Review", sla: 5, order: 1 },
  { id: "calculation", label: "Benefit Calculation", sla: 5, order: 2 },
  { id: "election", label: "Payment Election", sla: 3, order: 3 },
  { id: "approval", label: "Supervisory Approval", sla: 2, order: 4 },
  { id: "payment", label: "Payment Setup", sla: 3, order: 5 },
];

function generateCases() {
  return [
    // Four demo cases
    { id: "C001", member: "Robert Martinez", tier: 1, type: "Rule of 75", stage: "approval", analyst: "SC", stageEnteredDate: "2026-03-08", applicationDate: "2026-03-01", complexity: "moderate", retirementDate: "2026-04-01", deadlines: [{ type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    { id: "C002", member: "Jennifer Kim", tier: 2, type: "Early + Purchased", stage: "calculation", analyst: "MW", stageEnteredDate: "2026-03-07", applicationDate: "2026-03-03", complexity: "complex", retirementDate: "2026-05-01", deadlines: [{ type: "cutoff", label: "May payment cutoff", date: "2026-04-15" }] },
    { id: "C003", member: "David Washington", tier: 3, type: "Early Retirement", stage: "election", analyst: "SC", stageEnteredDate: "2026-03-06", applicationDate: "2026-02-28", complexity: "moderate", retirementDate: "2026-04-01", deadlines: [{ type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    { id: "C004", member: "Robert Martinez (DRO)", tier: 1, type: "Rule of 75 + DRO", stage: "calculation", analyst: "SC", stageEnteredDate: "2026-03-05", applicationDate: "2026-03-01", complexity: "complex", retirementDate: "2026-04-01", deadlines: [{ type: "hard", label: "DRO legal review", date: "2026-03-20" }, { type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    // Additional synthetic cases
    { id: "C005", member: "Linda Torres", tier: 2, type: "Rule of 75", stage: "received", analyst: "MW", stageEnteredDate: "2026-03-10", applicationDate: "2026-03-10", complexity: "simple", retirementDate: "2026-06-01", deadlines: [] },
    { id: "C006", member: "James Okafor", tier: 1, type: "Normal Retirement", stage: "eligibility", analyst: "RP", stageEnteredDate: "2026-03-04", applicationDate: "2026-02-25", complexity: "simple", retirementDate: "2026-04-01", deadlines: [{ type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    { id: "C007", member: "Patricia Nguyen", tier: 3, type: "Early Retirement", stage: "calculation", analyst: "RP", stageEnteredDate: "2026-03-03", applicationDate: "2026-02-20", complexity: "moderate", retirementDate: "2026-05-01", deadlines: [{ type: "cutoff", label: "May payment cutoff", date: "2026-04-15" }] },
    { id: "C008", member: "Michael Brown", tier: 1, type: "Rule of 75", stage: "payment", analyst: "SC", stageEnteredDate: "2026-03-09", applicationDate: "2026-02-15", complexity: "simple", retirementDate: "2026-04-01", deadlines: [{ type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    { id: "C009", member: "Susan Lee", tier: 2, type: "Normal Retirement", stage: "approval", analyst: "MW", stageEnteredDate: "2026-03-09", applicationDate: "2026-02-18", complexity: "simple", retirementDate: "2026-04-01", deadlines: [{ type: "cutoff", label: "April payment cutoff", date: "2026-03-15" }] },
    { id: "C010", member: "Amy Nguyen", tier: 3, type: "Refund", stage: "received", analyst: "RP", stageEnteredDate: "2026-03-08", applicationDate: "2026-03-08", complexity: "simple", retirementDate: null, deadlines: [{ type: "waiting", label: "90-day separation", date: "2026-04-15" }] },
    { id: "C011", member: "Carlos Reyes", tier: 1, type: "Disability", stage: "eligibility", analyst: "SC", stageEnteredDate: "2026-02-28", applicationDate: "2026-02-20", complexity: "complex", retirementDate: "2026-04-01", deadlines: [{ type: "hard", label: "Medical review", date: "2026-03-14" }] },
    { id: "C012", member: "Diana Foster", tier: 2, type: "Survivor Benefit", stage: "calculation", analyst: "MW", stageEnteredDate: "2026-03-02", applicationDate: "2026-02-22", complexity: "complex", retirementDate: null, deadlines: [{ type: "hard", label: "Death cert deadline", date: "2026-03-22" }] },
  ];
}

function getStageAging(c) {
  const days = daysSince(c.stageEnteredDate);
  const stage = STAGES.find(s => s.id === c.stage);
  const sla = stage?.sla || 5;
  const pct = days / sla;
  if (pct > 1) return { level: "overdue", color: C.danger, bg: C.dangerLight, label: `${days}d / ${sla}d SLA` };
  if (pct > 0.8) return { level: "warning", color: C.accent, bg: C.accentLight, label: `${days}d / ${sla}d SLA` };
  return { level: "ok", color: C.success, bg: C.successLight, label: `${days}d / ${sla}d SLA` };
}

const COMPLEXITY_WEIGHT = { simple: 1, moderate: 1.5, complex: 2.5 };

// ============================================================
// View: Processing Pipeline
// ============================================================
function PipelineView({ cases, onSelectCase, selectedCase }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`, gap: 8, minWidth: 960 }}>
        {STAGES.map(stage => {
          const stageCases = cases.filter(c => c.stage === stage.id).sort((a, b) => daysSince(b.stageEnteredDate) - daysSince(a.stageEnteredDate));
          const hasBottleneck = stageCases.length > 2;
          return (
            <div key={stage.id} style={{
              background: hasBottleneck ? C.accentLight : C.surfaceAlt,
              borderRadius: 10, padding: 10, minHeight: 300,
              border: `1px solid ${hasBottleneck ? C.accent : C.borderSubtle}`,
              transition: "all 0.3s",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `2px solid ${hasBottleneck ? C.accent : C.border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: hasBottleneck ? C.accent : C.text, letterSpacing: 0.3 }}>
                  {stage.label}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, fontFamily: MONO, minWidth: 24, textAlign: "center",
                  padding: "2px 6px", borderRadius: 4,
                  background: hasBottleneck ? C.accent : C.primary,
                  color: "#fff",
                }}>{stageCases.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stageCases.map(c => {
                  const aging = getStageAging(c);
                  const tierC = { 1: C.tier1, 2: C.tier2, 3: C.tier3 };
                  const selected = selectedCase === c.id;
                  return (
                    <div key={c.id} onClick={() => onSelectCase(c.id)}
                      style={{
                        background: selected ? C.primarySurface : C.surface,
                        borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                        border: `1.5px solid ${selected ? C.primary : aging.level === "overdue" ? C.danger : C.borderSubtle}`,
                        transition: "all 0.2s",
                        boxShadow: selected ? `0 0 0 2px ${C.primaryLight}` : "none",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                          {c.member.split(" (")[0]}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 3,
                          background: tierC[c.tier] === C.tier1 ? C.tier1Bg : c.tier === 2 ? C.tier2Bg : C.tier3Bg,
                          color: tierC[c.tier],
                        }}>T{c.tier}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, fontFamily: MONO,
                          padding: "1px 5px", borderRadius: 3,
                          background: aging.bg, color: aging.color,
                        }}>{aging.label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: C.textTertiary,
                          width: 22, height: 22, borderRadius: 6,
                          background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{ANALYSTS.find(a => a.id === c.analyst)?.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// View: Caseload Heatmap
// ============================================================
function HeatmapView({ cases }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ANALYSTS.map(analyst => {
        const myCases = cases.filter(c => c.analyst === analyst.id);
        const weightedLoad = myCases.reduce((sum, c) => sum + (COMPLEXITY_WEIGHT[c.complexity] || 1), 0);
        const utilization = Math.round((weightedLoad / analyst.capacity) * 100);
        const utilColor = utilization > 100 ? C.danger : utilization > 85 ? C.accent : utilization > 70 ? "#f9a825" : C.success;
        const simple = myCases.filter(c => c.complexity === "simple").length;
        const moderate = myCases.filter(c => c.complexity === "moderate").length;
        const complex = myCases.filter(c => c.complexity === "complex").length;

        return (
          <div key={analyst.id} style={{
            background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
            padding: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: utilization > 100 ? C.dangerLight : C.primarySurface,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: utilization > 100 ? C.danger : C.primary,
                border: `2px solid ${utilColor}`,
              }}>{analyst.id}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{analyst.name}</div>
                <div style={{ fontSize: 11, color: C.textTertiary }}>{analyst.mode} mode · Cap: {analyst.capacity}</div>
              </div>
            </div>

            {/* Utilization bar */}
            <div style={{ flex: "1 1 200px", minWidth: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Utilization</span>
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: utilColor }}>{utilization}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: C.surfaceAlt, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${Math.min(utilization, 120)}%`, background: utilColor,
                  transition: "width 0.5s ease, background 0.3s",
                }} />
              </div>
            </div>

            {/* Complexity breakdown */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {[
                { label: "Simple", count: simple, color: C.success, bg: C.successLight },
                { label: "Moderate", count: moderate, color: C.accent, bg: C.accentLight },
                { label: "Complex", count: complex, color: C.danger, bg: C.dangerLight },
              ].map(item => (
                <div key={item.label} style={{
                  textAlign: "center", padding: "6px 12px", borderRadius: 6,
                  background: item.bg, minWidth: 60,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: item.color, letterSpacing: 0.3, textTransform: "uppercase" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              textAlign: "center", padding: "6px 14px", borderRadius: 6,
              background: C.surfaceAlt, border: `1px solid ${C.borderSubtle}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: C.text }}>{myCases.length}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.textTertiary, letterSpacing: 0.3, textTransform: "uppercase" }}>Cases</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// View: Reassignment Panel
// ============================================================
function ReassignmentView({ cases, onReassign }) {
  const [selected, setSelected] = useState(new Set());
  const [targetAnalyst, setTargetAnalyst] = useState("");
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleCase = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleReassign = () => {
    if (selected.size > 0 && targetAnalyst && reason) {
      onReassign([...selected], targetAnalyst, reason);
      setSelected(new Set());
      setTargetAnalyst("");
      setReason("");
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* Case list */}
      <div style={{ flex: "1 1 400px", minWidth: 300 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" }}>
          Select cases to reassign ({selected.size} selected)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 440, overflowY: "auto" }}>
          {cases.map(c => {
            const isSelected = selected.has(c.id);
            const analyst = ANALYSTS.find(a => a.id === c.analyst);
            const aging = getStageAging(c);
            return (
              <div key={c.id} onClick={() => toggleCase(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderRadius: 8, cursor: "pointer",
                  background: isSelected ? C.primarySurface : C.surface,
                  border: `1.5px solid ${isSelected ? C.primary : C.borderSubtle}`,
                  transition: "all 0.15s",
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${isSelected ? C.primary : C.border}`,
                  background: isSelected ? C.primary : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12, fontWeight: 800,
                }}>{isSelected ? "✓" : ""}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{c.member.split(" (")[0]}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: c.complexity === "complex" ? C.dangerLight : c.complexity === "moderate" ? C.accentLight : C.successLight, color: c.complexity === "complex" ? C.danger : c.complexity === "moderate" ? C.accent : C.success, textTransform: "uppercase" }}>{c.complexity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textTertiary }}>
                    {STAGES.find(s => s.id === c.stage)?.label} · {analyst?.name}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, padding: "2px 6px", borderRadius: 3, background: aging.bg, color: aging.color }}>{aging.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reassignment controls */}
      <div style={{ flex: "0 0 280px", minWidth: 280 }}>
        <div style={{
          background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: 16,
          position: "sticky", top: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Reassign To</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {ANALYSTS.map(a => {
              const load = cases.filter(c => c.analyst === a.id).reduce((s, c) => s + (COMPLEXITY_WEIGHT[c.complexity] || 1), 0);
              const util = Math.round((load / a.capacity) * 100);
              const isTarget = targetAnalyst === a.id;
              return (
                <div key={a.id} onClick={() => setTargetAnalyst(a.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    background: isTarget ? C.primarySurface : C.surfaceAlt,
                    border: `1.5px solid ${isTarget ? C.primary : "transparent"}`,
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      background: isTarget ? C.primary : C.primarySurface, color: isTarget ? "#fff" : C.primary,
                      fontSize: 11, fontWeight: 700,
                    }}>{a.id}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{a.name}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: MONO,
                    color: util > 100 ? C.danger : util > 85 ? C.accent : C.success,
                  }}>{util}%</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>Reason (required)</div>
            <select value={reason} onChange={e => setReason(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: FONT,
                border: `1.5px solid ${reason ? C.primary : C.border}`, borderRadius: 8,
                background: C.surface, color: C.text, outline: "none",
              }}>
              <option value="">Select reason...</option>
              <option value="balance">Workload Balancing</option>
              <option value="expertise">Expertise Match</option>
              <option value="pto">PTO Coverage</option>
              <option value="escalation">Escalation</option>
              <option value="training">Training Opportunity</option>
            </select>
          </div>

          <button onClick={handleReassign}
            disabled={selected.size === 0 || !targetAnalyst || !reason}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 8,
              border: "none", fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: selected.size > 0 && targetAnalyst && reason ? "pointer" : "not-allowed",
              background: selected.size > 0 && targetAnalyst && reason ? C.primary : C.border,
              color: selected.size > 0 && targetAnalyst && reason ? "#fff" : C.textTertiary,
              transition: "all 0.2s",
            }}>
            Reassign {selected.size} Case{selected.size !== 1 ? "s" : ""}
          </button>

          {showConfirm && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: C.successLight, border: `1px solid #a5d6a7`,
              fontSize: 12, color: C.success, fontWeight: 600, textAlign: "center",
            }}>✓ Reassignment recorded with audit trail</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// View: Deadline Risk Aggregation
// ============================================================
function DeadlineRiskView({ cases }) {
  const allDeadlines = [];
  cases.forEach(c => {
    c.deadlines.forEach(d => {
      const days = daysUntil(d.date);
      allDeadlines.push({ ...d, caseId: c.id, member: c.member, tier: c.tier, analyst: c.analyst, days });
    });
  });

  const critical = allDeadlines.filter(d => d.days >= 0 && d.days <= 3);
  const warning = allDeadlines.filter(d => d.days > 3 && d.days <= 7);
  const upcoming = allDeadlines.filter(d => d.days > 7 && d.days <= 30);
  const overdue = allDeadlines.filter(d => d.days < 0);

  const groups = [
    { label: "OVERDUE", items: overdue, color: "#fff", bg: C.danger, border: C.danger },
    { label: "CRITICAL (0-3 days)", items: critical, color: C.danger, bg: C.dangerLight, border: "#ef9a9a" },
    { label: "WARNING (4-7 days)", items: warning, color: C.accent, bg: C.accentLight, border: "#ffcc80" },
    { label: "UPCOMING (8-30 days)", items: upcoming, color: C.info, bg: C.infoLight, border: "#90caf9" },
  ];

  // By-analyst aggregation
  const byAnalyst = {};
  allDeadlines.filter(d => d.days <= 7 && d.days >= 0).forEach(d => {
    if (!byAnalyst[d.analyst]) byAnalyst[d.analyst] = [];
    byAnalyst[d.analyst].push(d);
  });

  return (
    <div>
      {/* Analyst quick-view */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap",
      }}>
        {ANALYSTS.map(a => {
          const urgent = byAnalyst[a.id] || [];
          const hasCritical = urgent.some(d => d.days <= 3);
          return (
            <div key={a.id} style={{
              flex: "1 1 200px", padding: "10px 14px", borderRadius: 10,
              background: C.surface, border: `1.5px solid ${hasCritical ? C.danger : C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</span>
                <span style={{
                  fontSize: 12, fontWeight: 800, fontFamily: MONO,
                  color: hasCritical ? C.danger : urgent.length > 0 ? C.accent : C.success,
                }}>{urgent.length}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textTertiary }}>
                {urgent.length === 0 ? "No urgent deadlines" : `${urgent.filter(d => d.days <= 3).length} critical, ${urgent.filter(d => d.days > 3).length} warning`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped deadline list */}
      {groups.map(group => {
        if (group.items.length === 0) return null;
        return (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              padding: "6px 12px", borderRadius: 6,
              background: group.bg, border: `1px solid ${group.border}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: group.color, letterSpacing: 0.5 }}>{group.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 800, fontFamily: MONO,
                padding: "1px 8px", borderRadius: 4,
                background: group.color === "#fff" ? "rgba(255,255,255,0.3)" : `${group.color}20`,
                color: group.color,
              }}>{group.items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {group.items.sort((a, b) => a.days - b.days).map((d, i) => {
                const analyst = ANALYSTS.find(a => a.id === d.analyst);
                const typeColor = d.type === "hard" ? C.danger : d.type === "cutoff" ? C.accent : d.type === "waiting" ? C.info : C.success;
                return (
                  <div key={`${d.caseId}-${i}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8,
                    background: C.surface, border: `1px solid ${C.borderSubtle}`,
                    gap: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: C.textSecondary, flexShrink: 0 }}>{d.member.split(" (")[0]}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, flexShrink: 0 }}>{analyst?.id}</span>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.textTertiary, flexShrink: 0, minWidth: 60, textAlign: "right" }}>{fmtDate(d.date)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, fontFamily: MONO, flexShrink: 0,
                      padding: "2px 8px", borderRadius: 4, minWidth: 40, textAlign: "center",
                      background: d.days < 0 ? C.danger : d.days <= 3 ? C.dangerLight : d.days <= 7 ? C.accentLight : C.infoLight,
                      color: d.days < 0 ? "#fff" : d.days <= 3 ? C.danger : d.days <= 7 ? C.accent : C.info,
                    }}>{d.days < 0 ? `${Math.abs(d.days)}d late` : `${d.days}d`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Compliance footer */}
      <div style={{
        marginTop: 16, padding: "10px 14px", borderRadius: 8,
        background: C.surfaceAlt, border: `1px solid ${C.borderSubtle}`,
        display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12,
      }}>
        {[
          { label: "30-day compliance", value: "94%", color: C.success },
          { label: "90-day compliance", value: "97%", color: C.success },
          { label: "365-day compliance", value: "96%", color: C.success },
        ].map(m => (
          <div key={m.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: C.textTertiary, letterSpacing: 0.3 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================
export function WorkflowDashboard() {
  const [view, setView] = useState("pipeline");
  const [cases, setCases] = useState(() => generateCases());
  const [selectedCase, setSelectedCase] = useState(null);

  const handleReassign = useCallback((caseIds, targetAnalyst, reason) => {
    setCases(prev => prev.map(c =>
      caseIds.includes(c.id) ? { ...c, analyst: targetAnalyst } : c
    ));
  }, []);

  // Summary stats
  const totalActive = cases.length;
  const overCapacity = ANALYSTS.filter(a => {
    const load = cases.filter(c => c.analyst === a.id).reduce((s, c) => s + (COMPLEXITY_WEIGHT[c.complexity] || 1), 0);
    return (load / a.capacity) > 1;
  }).length;
  const criticalDeadlines = cases.flatMap(c => c.deadlines).filter(d => {
    const days = daysUntil(d.date);
    return days >= 0 && days <= 3;
  }).length;
  const unassigned = cases.filter(c => !c.analyst).length;

  const views = [
    { id: "pipeline", label: "Pipeline", icon: "▤" },
    { id: "heatmap", label: "Caseload", icon: "◫" },
    { id: "reassign", label: "Reassign", icon: "⇄" },
    { id: "deadlines", label: "Deadlines", icon: "⏱" },
  ];

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        background: C.sidebar, padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>NoUI</span>
          <span style={{ color: C.sidebarText, fontSize: 13 }}>Workflow Management</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(77,182,172,0.15)", color: C.sidebarActive, border: "1px solid rgba(77,182,172,0.3)", letterSpacing: 0.5 }}>SUPERVISOR</span>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          {views.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 12, fontFamily: FONT,
                fontWeight: view === v.id ? 700 : 500, letterSpacing: 0.2,
                background: view === v.id ? "rgba(77,182,172,0.2)" : "transparent",
                color: view === v.id ? C.sidebarActive : C.sidebarText, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <span style={{ fontSize: 14 }}>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px" }}>
        {/* Summary bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20,
        }}>
          {[
            { label: "Active Cases", value: totalActive, color: C.primary },
            { label: "Analysts Over Capacity", value: overCapacity, color: overCapacity > 0 ? C.danger : C.success },
            { label: "Critical Deadlines", value: criticalDeadlines, color: criticalDeadlines > 0 ? C.danger : C.success },
            { label: "Unassigned", value: unassigned, color: unassigned > 0 ? C.accent : C.success },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
              padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: MONO, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Date reference */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
          padding: "8px 12px", borderRadius: 6,
          background: C.primarySurface, border: `1px solid ${C.primaryLight}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.primary }}>
            Reference: {TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {ANALYSTS.length} analysts · {cases.length} active cases
          </span>
        </div>

        {/* View content */}
        {view === "pipeline" && <PipelineView cases={cases} onSelectCase={setSelectedCase} selectedCase={selectedCase} />}
        {view === "heatmap" && <HeatmapView cases={cases} />}
        {view === "reassign" && <ReassignmentView cases={cases} onReassign={handleReassign} />}
        {view === "deadlines" && <DeadlineRiskView cases={cases} />}
      </div>
    </div>
  );
}
