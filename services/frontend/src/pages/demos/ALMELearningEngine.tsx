/**
 * ALME Learning Engine demo — "Duolingo for Pension Administration" adaptive learning system.
 * Interactive warm-up, scenario practice, conversation exercises, mastery map, and supervisor view.
 * Consumed by: router.tsx (/demos/learning-engine route)
 * Depends on: React (useState, useEffect, useCallback)
 */
// @ts-nocheck
import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   NoUI — Adaptive Learning & Mastery Engine (ALME)
   Interactive Prototype · COPERA POC · February 2026
   "Duolingo for Pension Administration"
   ═══════════════════════════════════════════════════════════════════ */

// ─── Design Tokens (from noui-design-system.css) ────────────────
const T = {
  primary: "#00796b", primaryDk: "#004d40", primaryLt: "#b2dfdb", primarySf: "#e0f2f1",
  accent: "#e65100", accentLt: "#fff3e0",
  success: "#2e7d32", successLt: "#e8f5e9", successBg: "#c8e6c9",
  error: "#c62828", errorLt: "#ffebee",
  info: "#0369a1", infoLt: "#e0f2fe",
  warn: "#ff8f00", warnLt: "#fff8e1",
  purple: "#7b1fa2", purpleLt: "#f3e5f5",
  text: "#1a2e2e", textSec: "#4a6767", textTer: "#6b8a8a",
  bg: "#f6f9f9", white: "#ffffff", border: "#d0dede",
  altRow: "#eef5f5", surface: "#fafcfc",
  gold: "#f59e0b", goldLt: "#fef3c7",
  streak: "#ff6d00",
};

const font = "'Plus Jakarta Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', monospace";

// ─── Data: Learning Content ─────────────────────────────────────
const WARM_UP_QUESTIONS = [
  { q: "What is the benefit multiplier for Tier 1 members?", options: ["1.5%", "2.0%", "2.5%", "3.0%"], correct: 1, rule: "RULE-CALC-T1", cite: "C.R.S. Title 24 Art. 51" },
  { q: "How many consecutive months define the AMS window for Tier 3?", options: ["36 months", "48 months", "60 months", "24 months"], correct: 2, rule: "RULE-AMS-WINDOW-T3", cite: "C.R.S. Title 24 Art. 51" },
  { q: "Does purchased service count toward Rule of 75 eligibility?", options: ["Yes, always", "No, never", "Only for Tier 1", "Only after 10 years"], correct: 1, rule: "RULE-SVC-PURCH-EXCL", cite: "C.R.S. Title 24 Art. 51" },
  { q: "What is the early retirement reduction rate per year for Tier 3?", options: ["3% per year", "5% per year", "6% per year", "4% per year"], correct: 2, rule: "RULE-EARLY-REDUCE-T3", cite: "C.R.S. Title 24 Art. 51" },
  { q: "What is the minimum age for Rule of 85 eligibility (Tier 3)?", options: ["55", "58", "60", "62"], correct: 2, rule: "RULE-R85", cite: "C.R.S. Title 24 Art. 51" },
];

const SCENARIO = {
  title: "Case Classification Challenge",
  intro: "Member: Sarah Chen · Hired: March 15, 2005 · DOB: July 22, 1968 · Retirement Date: August 1, 2026",
  steps: [
    { q: "Based on hire date (March 15, 2005), which tier is Sarah?", options: ["Tier 1 — Before Sept 1, 2004", "Tier 2 — Sept 2004 through June 2011", "Tier 3 — On or after July 1, 2011"], correct: 1, explain: "Hired March 15, 2005 falls between September 1, 2004 and June 30, 2011 → Tier 2. The multiplier is 1.5% and AMS uses 36 consecutive months." },
    { q: "Sarah is age 58 with 21 years 4 months of earned service. Does she meet Rule of 75?", options: ["Yes — 58 + 21.33 = 79.33 ≥ 75", "No — she doesn't meet the minimum age", "No — purchased service doesn't count"], correct: 0, explain: "Age 58 + 21.33 years earned service = 79.33, which exceeds 75. Minimum age 55 is also met. Sarah qualifies for Rule of 75 → unreduced benefit." },
    { q: "What is Sarah's early retirement reduction?", options: ["0% — Rule of 75 is met, no reduction applies", "21% — 3% × 7 years under 65", "42% — 6% × 7 years under 65"], correct: 0, explain: "Because Sarah meets Rule of 75, she receives her benefit with no reduction. Rule of 75 qualification eliminates the early retirement penalty entirely." },
  ]
};

const APPLY_SCENARIO = {
  title: "Member Conversation: Explaining the Benefit",
  context: "Sarah asks: \"My friend Janet retired last year from Tier 1 and gets $3,200/month. I've worked almost as long — why is my estimate only $2,450?\"",
  options: [
    { text: "\"That's because Tier 2 has a lower multiplier. Your benefit uses 1.5% per year versus Janet's 2.0%. This is set by C.R.S. Title 24 Article 51 based on hire date.\"", quality: "excellent", feedback: "Excellent — you accurately identified the multiplier difference, connected it to the governing authority, and explained without jargon." },
    { text: "\"Every member's benefit is different. I'd recommend you review your annual statement.\"", quality: "poor", feedback: "This is technically true but doesn't address Sarah's actual question. She's asking why the difference exists. Deflecting erodes trust." },
    { text: "\"Tier 2 members get a lower percentage. Janet was Tier 1 so she gets more.\"", quality: "okay", feedback: "You identified the right reason but didn't explain the specific multipliers or cite the source. Adding the concrete numbers (2.0% vs 1.5%) and mentioning C.R.S. Title 24 Article 51 builds credibility." },
    { text: "\"I'm not sure about Janet's situation — I can only discuss your account. Would you like me to walk through your calculation?\"", quality: "good", feedback: "Good instinct on privacy — you can't discuss Janet's details. But you can explain how tiers work generally. Redirecting to her own calculation is a strong recovery." },
  ]
};

const MASTERY_MAP = [
  { topic: "Tier Structure", ring: "foundation", pct: 92, icon: "🏛️" },
  { topic: "Eligibility Rules", ring: "foundation", pct: 85, icon: "✅" },
  { topic: "Basic Calculation", ring: "foundation", pct: 78, icon: "🧮" },
  { topic: "Payment Options", ring: "foundation", pct: 65, icon: "💰" },
  { topic: "Early Retirement", ring: "intermediate", pct: 70, icon: "⏰" },
  { topic: "Purchased Service", ring: "intermediate", pct: 55, icon: "🛒" },
  { topic: "Leave Payout", ring: "intermediate", pct: 40, icon: "📋" },
  { topic: "Spousal Consent", ring: "intermediate", pct: 30, icon: "💍" },
  { topic: "DRO Processing", ring: "advanced", pct: 15, icon: "⚖️" },
  { topic: "Data Quality", ring: "advanced", pct: 10, icon: "🔍" },
  { topic: "Exception Handling", ring: "advanced", pct: 5, icon: "⚡" },
];

// ─── Utility Components ─────────────────────────────────────────
const Pill = ({ children, bg = T.primarySf, color = T.primary, style = {} }) => (
  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", background: bg, color, fontFamily: font, ...style }}>{children}</span>
);

const XPBadge = ({ xp }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "linear-gradient(135deg, #fef3c7, #fde68a)", color: "#92400e", fontSize: 12, fontWeight: 700, fontFamily: mono, boxShadow: "0 1px 3px rgba(245,158,11,0.3)" }}>
    ✦ {xp} XP
  </span>
);

const StreakFire = ({ days }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 12px", borderRadius: 20, background: `linear-gradient(135deg, ${T.streak}22, ${T.accent}15)`, color: T.accent, fontSize: 13, fontWeight: 700, fontFamily: font }}>
    🔥 {days} day streak
  </span>
);

const ProgressBar = ({ pct, color = T.primary, bg = T.primaryLt, h = 8 }) => (
  <div style={{ width: "100%", height: h, borderRadius: h, background: bg, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.border}`, padding: 24, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, primary = false, disabled = false, small = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, border: primary ? "none" : `1px solid ${T.border}`,
    background: disabled ? "#ccc" : primary ? T.primary : T.white, color: disabled ? "#888" : primary ? T.white : T.text,
    fontSize: small ? 12 : 14, fontWeight: 600, fontFamily: font, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease", ...style
  }}>{children}</button>
);

// ─── Views ──────────────────────────────────────────────────────

// 1. Dashboard / Home
function DashboardView({ onStart, streak, totalXP }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Greeting */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 14, color: T.textSec, marginBottom: 4 }}>{today}</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: "4px 0 12px" }}>Good morning, Sarah</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <StreakFire days={streak} />
          <XPBadge xp={totalXP} />
        </div>
      </div>

      {/* Daily Session Card */}
      <Card style={{ border: `2px solid ${T.primary}`, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at 100% 0%, ${T.primarySf} 0%, transparent 70%)`, borderRadius: "0 12px 0 0" }} />
        <Pill bg={T.primarySf} color={T.primary}>TODAY'S SESSION</Pill>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: "12px 0 6px" }}>Tier 2 Eligibility & Member Communication</h3>
        <p style={{ fontSize: 13, color: T.textSec, margin: "0 0 6px", lineHeight: 1.5 }}>
          3 phases · ~15 minutes · Domains A + C
        </p>
        <div style={{ display: "flex", gap: 16, margin: "16px 0", flexWrap: "wrap" }}>
          {[
            { phase: "Warm-Up", time: "3 min", desc: "Recall & reinforce", icon: "🧠", color: T.info },
            { phase: "Core", time: "8 min", desc: "Scenario practice", icon: "🎯", color: T.primary },
            { phase: "Cool-Down", time: "4 min", desc: "Apply & reflect", icon: "💬", color: T.purple },
          ].map((ph, i) => (
            <div key={i} style={{ flex: 1, minWidth: 150, padding: 12, borderRadius: 8, background: `${ph.color}08`, border: `1px solid ${ph.color}20` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{ph.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ph.color }}>{ph.phase}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{ph.time} · {ph.desc}</div>
            </div>
          ))}
        </div>
        <Btn primary onClick={onStart} style={{ width: "100%", padding: "14px 20px", fontSize: 16, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDk})` }}>
          ▶ Start Today's Session
        </Btn>
      </Card>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "This Week", val: "4 / 5", sub: "sessions completed", color: T.success },
          { label: "Mastery", val: "68%", sub: "foundation ring", color: T.primary },
          { label: "Next Badge", val: "82%", sub: "Eligibility Expert", color: T.gold },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: "4px 0", fontFamily: mono }}>{s.val}</div>
            <div style={{ fontSize: 11, color: T.textTer }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tomorrow Preview */}
      <Card style={{ background: T.accentLt, border: `1px solid ${T.accent}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔮</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>TOMORROW'S PREVIEW</div>
            <div style={{ fontSize: 13, color: T.text }}>What happens when a member's purchased service pushes them near Rule of 75 — but not quite over?</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// 2. Warm-Up Phase
function WarmUpView({ onComplete }) {
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const qs = WARM_UP_QUESTIONS.slice(0, 4);
  const current = qs[qi];
  const isCorrect = selected === current?.correct;

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === current.correct) {
      setScore(s => s + 1);
      setXpEarned(x => x + 15);
    } else {
      setXpEarned(x => x + 5);
    }
  };

  const handleNext = () => {
    if (qi + 1 >= qs.length) {
      onComplete(xpEarned);
    } else {
      setQi(qi + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Phase Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <div>
            <Pill bg={T.infoLt} color={T.info}>WARM-UP · RECALL & REINFORCE</Pill>
          </div>
        </div>
        <XPBadge xp={xpEarned} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSec, marginBottom: 6 }}>
          <span>Question {qi + 1} of {qs.length}</span>
          <span>{score} correct</span>
        </div>
        <ProgressBar pct={((qi + (answered ? 1 : 0)) / qs.length) * 100} color={T.info} bg={`${T.info}20`} />
      </div>

      {/* Question */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textTer, marginBottom: 8, fontFamily: mono }}>{current.rule}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 20px", lineHeight: 1.4 }}>{current.q}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.options.map((opt, i) => {
            let bg = T.white;
            let border = T.border;
            let icon = "";
            if (answered && i === current.correct) { bg = T.successLt; border = T.success; icon = " ✓"; }
            else if (answered && i === selected && !isCorrect) { bg = T.errorLt; border = T.error; icon = " ✗"; }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{
                padding: "14px 16px", borderRadius: 10, border: `2px solid ${border}`, background: bg,
                textAlign: "left", cursor: answered ? "default" : "pointer", fontSize: 14, fontFamily: font,
                color: T.text, fontWeight: 500, transition: "all 0.15s ease",
                transform: answered && i === selected ? "scale(1.01)" : "scale(1)"
              }}>
                <span style={{ fontWeight: 700, color: T.textSec, marginRight: 8 }}>{String.fromCharCode(65 + i)}</span>
                {opt}{icon}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Feedback */}
      {answered && (
        <Card style={{
          background: isCorrect ? T.successLt : T.errorLt,
          border: `1px solid ${isCorrect ? T.success : T.error}30`,
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{isCorrect ? "🎉" : "📖"}</span>
            <div>
              <div style={{ fontWeight: 700, color: isCorrect ? T.success : T.error, marginBottom: 4, fontSize: 14 }}>
                {isCorrect ? `Correct! +15 XP` : "Not quite — here's why:"}
              </div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                The correct answer is <strong>{current.options[current.correct]}</strong>.
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 6, fontFamily: mono }}>
                Source: {current.cite}
              </div>
            </div>
          </div>
        </Card>
      )}

      {answered && (
        <Btn primary onClick={handleNext} style={{ width: "100%" }}>
          {qi + 1 >= qs.length ? "Continue to Core Lesson →" : "Next Question →"}
        </Btn>
      )}
    </div>
  );
}

// 3. Core Phase — Scenario Classification
function CoreView({ onComplete }) {
  const [si, setSi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const step = SCENARIO.steps[si];

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setXpEarned(x => x + (idx === step.correct ? 25 : 10));
  };

  const handleNext = () => {
    if (si + 1 >= SCENARIO.steps.length) {
      onComplete(xpEarned);
    } else {
      setSi(si + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🎯</span>
          <Pill bg={T.primarySf} color={T.primary}>CORE · SCENARIO PRACTICE</Pill>
        </div>
        <XPBadge xp={xpEarned} />
      </div>

      {/* Scenario Context */}
      <Card style={{ background: T.bg, marginBottom: 16, border: `1px solid ${T.primary}30` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.primary, marginBottom: 6 }}>{SCENARIO.title}</div>
        <div style={{ fontSize: 14, color: T.text, fontFamily: mono, lineHeight: 1.6, padding: "8px 12px", background: T.white, borderRadius: 8, border: `1px solid ${T.border}` }}>
          {SCENARIO.intro}
        </div>
      </Card>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        {SCENARIO.steps.map((_, i) => (
          <div key={i} style={{
            width: i === si ? 32 : 10, height: 10, borderRadius: 5,
            background: i < si ? T.success : i === si ? T.primary : T.border,
            transition: "all 0.3s ease"
          }} />
        ))}
      </div>

      {/* Step */}
      <Card>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Step {si + 1} of {SCENARIO.steps.length}</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 18px", lineHeight: 1.4 }}>{step.q}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {step.options.map((opt, i) => {
            let bg = T.white;
            let bdr = T.border;
            if (answered && i === step.correct) { bg = T.successLt; bdr = T.success; }
            else if (answered && i === selected && selected !== step.correct) { bg = T.errorLt; bdr = T.error; }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{
                padding: "14px 16px", borderRadius: 10, border: `2px solid ${bdr}`, background: bg,
                textAlign: "left", cursor: answered ? "default" : "pointer", fontSize: 14, fontFamily: font,
                color: T.text, fontWeight: 500, transition: "all 0.15s ease"
              }}>
                {opt}
              </button>
            );
          })}
        </div>
      </Card>

      {answered && (
        <Card style={{ background: T.successLt, border: `1px solid ${T.success}30`, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.success, marginBottom: 6 }}>
            {selected === step.correct ? "✓ Correct!" : "→ Let's review:"}
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{step.explain}</div>
        </Card>
      )}

      {answered && (
        <Btn primary onClick={handleNext} style={{ width: "100%", marginTop: 16 }}>
          {si + 1 >= SCENARIO.steps.length ? "Continue to Cool-Down →" : "Next Step →"}
        </Btn>
      )}
    </div>
  );
}

// 4. Cool-Down — Conversation
function CoolDownView({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const sc = APPLY_SCENARIO;
  const opt = selected !== null ? sc.options[selected] : null;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = sc.options[idx].quality;
    setXpEarned(q === "excellent" ? 30 : q === "good" ? 20 : q === "okay" ? 15 : 5);
  };

  const qualityColors = { excellent: T.success, good: T.info, okay: T.warn, poor: T.error };
  const qualityLabels = { excellent: "Excellent Response", good: "Good Response", okay: "Adequate Response", poor: "Needs Improvement" };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>💬</span>
          <Pill bg={T.purpleLt} color={T.purple}>COOL-DOWN · APPLY & REFLECT</Pill>
        </div>
        {xpEarned > 0 && <XPBadge xp={xpEarned} />}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 8 }}>{sc.title}</div>
        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6, padding: "12px 16px", background: T.purpleLt, borderRadius: 8, fontStyle: "italic" }}>
          {sc.context}
        </div>
      </Card>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>How would you respond?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sc.options.map((o, i) => {
          let bg = T.white;
          let bdr = T.border;
          if (selected === i) {
            const c = qualityColors[o.quality];
            bg = `${c}10`;
            bdr = c;
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null} style={{
              padding: "14px 16px", borderRadius: 10, border: `2px solid ${bdr}`, background: bg,
              textAlign: "left", cursor: selected !== null ? "default" : "pointer", fontSize: 13,
              fontFamily: font, color: T.text, lineHeight: 1.5, transition: "all 0.15s ease"
            }}>
              {o.text}
            </button>
          );
        })}
      </div>

      {opt && (
        <Card style={{ background: `${qualityColors[opt.quality]}10`, border: `1px solid ${qualityColors[opt.quality]}30`, marginTop: 16 }}>
          <Pill bg={`${qualityColors[opt.quality]}20`} color={qualityColors[opt.quality]} style={{ marginBottom: 8 }}>
            {qualityLabels[opt.quality]}
          </Pill>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginTop: 8 }}>{opt.feedback}</div>
          {opt.quality !== "excellent" && (
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 10, padding: "8px 12px", background: T.white, borderRadius: 6, border: `1px solid ${T.border}` }}>
              <strong>Best response approach:</strong> {sc.options[0].text.substring(0, 120)}...
            </div>
          )}
        </Card>
      )}

      {selected !== null && (
        <Btn primary onClick={() => onComplete(xpEarned)} style={{ width: "100%", marginTop: 16 }}>
          Complete Session →
        </Btn>
      )}
    </div>
  );
}

// 5. Completion Summary
function CompletionView({ totalXP, streak, onViewMap, onHome }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: T.primary, margin: "0 0 6px" }}>Session Complete!</h2>
      <p style={{ fontSize: 14, color: T.textSec, margin: "0 0 24px" }}>Great work on today's learning</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "XP Earned", val: `+${totalXP}`, icon: "✦", color: T.gold },
          { label: "Streak", val: `${streak} days`, icon: "🔥", color: T.streak },
          { label: "Accuracy", val: "85%", icon: "🎯", color: T.success },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: mono }}>{s.val}</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20, textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>📝 Today You Learned</div>
        {["Tier 2 members use a 1.5% multiplier with 36-month AMS window",
          "Rule of 75 uses earned service only — purchased service is excluded",
          "When a member qualifies for Rule of 75, early retirement reduction is eliminated",
          "Explaining tier differences to members: lead with specifics, cite the authority"
        ].map((item, i) => (
          <div key={i} style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5, padding: "4px 0 4px 16px", borderLeft: `2px solid ${T.primaryLt}`, marginBottom: 6 }}>
            {item}
          </div>
        ))}
      </Card>

      <Card style={{ background: T.accentLt, border: `1px solid ${T.accent}30`, marginBottom: 20, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔮</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>TOMORROW'S PREVIEW</div>
            <div style={{ fontSize: 13, color: T.text }}>What happens when a member's purchased service pushes them near Rule of 75 — but not quite over?</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn onClick={onHome} style={{ flex: 1 }}>← Home</Btn>
        <Btn primary onClick={onViewMap} style={{ flex: 1 }}>View Mastery Map</Btn>
      </div>
    </div>
  );
}

// 6. Mastery Map
function MasteryMapView({ onHome }) {
  const rings = { foundation: { label: "Foundation", color: T.success, bg: T.successBg }, intermediate: { label: "Intermediate", color: T.info, bg: `${T.info}20` }, advanced: { label: "Advanced", color: T.purple, bg: T.purpleLt } };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Your Mastery Map</h2>
          <p style={{ fontSize: 13, color: T.textSec, margin: "4px 0 0" }}>Benefits Analyst · Tier 2 Specialist Path</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.primary, fontFamily: mono }}>52%</div>
          <div style={{ fontSize: 11, color: T.textSec }}>overall mastery</div>
        </div>
      </div>

      {Object.entries(rings).map(([key, ring]) => {
        const topics = MASTERY_MAP.filter(t => t.ring === key);
        const avgPct = Math.round(topics.reduce((a, t) => a + t.pct, 0) / topics.length);
        return (
          <div key={key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Pill bg={ring.bg} color={ring.color}>{ring.label.toUpperCase()} RING</Pill>
              <span style={{ fontSize: 13, fontWeight: 700, color: ring.color, fontFamily: mono }}>{avgPct}%</span>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {topics.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < topics.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.white : T.bg }}>
                  <span style={{ fontSize: 20, width: 32, textAlign: "center" }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.topic}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.pct >= 80 ? T.success : t.pct >= 50 ? ring.color : T.textTer, fontFamily: mono }}>{t.pct}%</span>
                    </div>
                    <ProgressBar pct={t.pct} color={t.pct >= 80 ? T.success : ring.color} bg={`${ring.color}15`} h={6} />
                  </div>
                  {t.pct >= 80 && <span style={{ fontSize: 14 }}>⭐</span>}
                </div>
              ))}
            </Card>
          </div>
        );
      })}

      {/* Badges */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "24px 0 12px" }}>🏆 Earned Badges</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { name: "Tier Identifier", desc: "Classify all 3 tiers correctly", earned: true },
          { name: "Rule of 75 Scholar", desc: "10 consecutive correct eligibility checks", earned: true },
          { name: "AMS Calculator", desc: "Perfect score on AMS calculation", earned: false },
          { name: "Member Whisperer", desc: "5 excellent conversation ratings", earned: false },
        ].map((b, i) => (
          <Card key={i} style={{ flex: "1 1 calc(50% - 6px)", minWidth: 180, padding: 14, opacity: b.earned ? 1 : 0.45, border: b.earned ? `1px solid ${T.gold}50` : `1px solid ${T.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{b.earned ? "🥇" : "🔒"}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: b.earned ? T.text : T.textTer }}>{b.name}</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{b.desc}</div>
          </Card>
        ))}
      </div>

      <Btn onClick={onHome} style={{ width: "100%" }}>← Back to Dashboard</Btn>
    </div>
  );
}

// 7. Supervisor View
function SupervisorView({ onHome }) {
  const team = [
    { name: "Sarah Chen", role: "Benefits Analyst", streak: 23, sessions: 19, mastery: 52, trend: "+8%" },
    { name: "Marcus Rivera", role: "Benefits Analyst", streak: 15, sessions: 20, mastery: 68, trend: "+5%" },
    { name: "Lisa Park", role: "Sr. Benefits Analyst", streak: 31, sessions: 20, mastery: 89, trend: "+2%" },
    { name: "James Foster", role: "Benefits Analyst", streak: 4, sessions: 12, mastery: 31, trend: "+12%" },
    { name: "Wei Zhang", role: "CSR", streak: 18, sessions: 17, mastery: 45, trend: "+9%" },
  ];

  const gaps = [
    { area: "DRO Marital Fraction", team_pct: 32, severity: "high" },
    { area: "Spousal Consent Rules", team_pct: 45, severity: "medium" },
    { area: "Tier 3 Provisions", team_pct: 51, severity: "medium" },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Pill bg={T.primarySf} color={T.primary}>SUPERVISOR VIEW</Pill>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "8px 0 0" }}>Team Learning Dashboard</h2>
        </div>
        <Btn onClick={onHome} small>← Back</Btn>
      </div>

      {/* Team Engagement KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Compliance", val: "88%", sub: "completing daily", color: T.success },
          { label: "Avg Streak", val: "18.2d", sub: "team average", color: T.streak },
          { label: "Team Mastery", val: "57%", sub: "foundation avg", color: T.primary },
          { label: "This Month", val: "88", sub: "sessions completed", color: T.info },
        ].map((k, i) => (
          <Card key={i} style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: mono, margin: "2px 0" }}>{k.val}</div>
            <div style={{ fontSize: 10, color: T.textTer }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Team Members (no individual scores — aggregate engagement only) */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", background: T.bg, borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>Team Engagement (this month)</div>
        {team.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < team.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.white : T.bg }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.primary }}>
              {m.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{m.role}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ color: T.streak }}>🔥 {m.streak}d</span>
            </div>
            <div style={{ fontSize: 12, color: T.textSec }}>{m.sessions}/20 sessions</div>
            <Pill bg={T.successLt} color={T.success} style={{ fontSize: 10 }}>{m.trend}</Pill>
          </div>
        ))}
      </Card>

      {/* Knowledge Gaps */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>⚠️ Team Knowledge Gaps</div>
        <p style={{ fontSize: 12, color: T.textSec, margin: "0 0 12px", lineHeight: 1.5 }}>
          Areas where the team average falls below 60% mastery. Consider targeted group training.
        </p>
        {gaps.map((g, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: T.text }}>{g.area}</span>
              <span style={{ fontWeight: 700, color: g.severity === "high" ? T.error : T.warn, fontFamily: mono }}>{g.team_pct}%</span>
            </div>
            <ProgressBar pct={g.team_pct} color={g.severity === "high" ? T.error : T.warn} bg={g.severity === "high" ? T.errorLt : T.warnLt} h={6} />
          </div>
        ))}
        <div style={{ fontSize: 11, color: T.textSec, fontStyle: "italic", marginTop: 8 }}>
          Note: Gaps shown as team aggregates. Individual scores are not displayed per Skills Development Model policy.
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export function ALMELearningEngine() {
  const VIEWS = ["dashboard", "warmup", "core", "cooldown", "complete", "mastery", "supervisor"];
  const [view, setView] = useState("dashboard");
  const [streak] = useState(23);
  const [totalXP, setTotalXP] = useState(1847);
  const [sessionXP, setSessionXP] = useState(0);

  const addXP = (xp) => { setSessionXP(s => s + xp); setTotalXP(t => t + xp); };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "mastery", label: "Mastery Map", icon: "🗺️" },
    { id: "supervisor", label: "Supervisor", icon: "👥" },
  ];

  return (
    <div style={{ fontFamily: font, color: T.text, background: T.bg, minHeight: "100vh" }}>
      {/* Top Nav */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.primary, letterSpacing: "-0.02em" }}>NoUI</span>
            <span style={{ fontSize: 12, color: T.textSec, padding: "2px 8px", borderRadius: 4, background: T.primarySf }}>Learning</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => setView(n.id)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", background: view === n.id ? T.primarySf : "transparent",
                color: view === n.id ? T.primary : T.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: font, transition: "all 0.15s ease"
              }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StreakFire days={streak} />
            <XPBadge xp={totalXP} />
          </div>
        </div>
      </div>

      {/* Session Progress Bar (during session) */}
      {["warmup", "core", "cooldown"].includes(view) && (
        <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "8px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {["warmup", "core", "cooldown"].map((phase, i) => {
                const idx = ["warmup", "core", "cooldown"].indexOf(view);
                const done = i < idx;
                const active = i === idx;
                return (
                  <div key={phase} style={{ flex: phase === "core" ? 2 : 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: active ? T.primary : done ? T.success : T.textTer, marginBottom: 4, textTransform: "uppercase" }}>
                      {done ? "✓ " : ""}{["Warm-Up", "Core", "Cool-Down"][i]}
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: done ? T.success : active ? T.primary : T.border, transition: "all 0.3s ease" }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "32px 24px 64px" }}>
        {view === "dashboard" && (
          <DashboardView onStart={() => { setSessionXP(0); setView("warmup"); }} streak={streak} totalXP={totalXP} />
        )}
        {view === "warmup" && (
          <WarmUpView onComplete={(xp) => { addXP(xp); setView("core"); }} />
        )}
        {view === "core" && (
          <CoreView onComplete={(xp) => { addXP(xp); setView("cooldown"); }} />
        )}
        {view === "cooldown" && (
          <CoolDownView onComplete={(xp) => { addXP(xp); setView("complete"); }} />
        )}
        {view === "complete" && (
          <CompletionView totalXP={sessionXP} streak={streak + 1} onViewMap={() => setView("mastery")} onHome={() => setView("dashboard")} />
        )}
        {view === "mastery" && <MasteryMapView onHome={() => setView("dashboard")} />}
        {view === "supervisor" && <SupervisorView onHome={() => setView("dashboard")} />}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 24px", borderTop: `1px solid ${T.border}`, background: T.white, fontSize: 11, color: T.textTer }}>
        NoUI Adaptive Learning & Mastery Engine · COPERA POC Prototype · February 2026 · Content generated from Business Rules YAML & Training Documents 01–14
      </div>
    </div>
  );
}
