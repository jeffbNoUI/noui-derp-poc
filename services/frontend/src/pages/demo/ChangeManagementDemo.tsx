/**
 * Change Management Demo — interactive walkthrough of AI-accelerated rule change lifecycle.
 * Demonstrates how the system handles a statutory change to contribution rates,
 * following the full SDLC: AI reads source → drafts config → human reviews → regression tests → certification.
 * Consumed by: router.tsx (/demos/change-management route), DemoLanding.tsx (link card)
 * Depends on: React state for step progression, no external data
 */
import { useState } from 'react'

/** Each step in the change management lifecycle */
interface LifecycleStep {
  id: number
  phase: string
  title: string
  description: string
  detail: string
  artifact: string
  aiRole: string
  humanRole: string
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    id: 1,
    phase: 'Detection',
    title: 'Source Document Change Detected',
    description: 'Denver City Council passes Ordinance 2026-042 amending RMC §18-407, increasing the employer contribution rate from 17.95% to 19.00% effective July 1, 2026.',
    detail: 'The AI monitors governing document feeds and flags the amendment as affecting 3 configured rules in the rules engine.',
    artifact: 'Ordinance 2026-042\nSection: RMC §18-407(a)\nChange: Employer contribution rate\nFrom: 17.95%\nTo: 19.00%\nEffective: July 1, 2026',
    aiRole: 'Scans source documents, identifies affected rules, creates change request',
    humanRole: 'Verifies AI correctly identified the source and scope',
  },
  {
    id: 2,
    phase: 'Analysis',
    title: 'Impact Analysis Generated',
    description: 'AI analyzes the downstream impact: employer portal contribution calculations, monthly reporting totals, and actuarial valuation inputs.',
    detail: 'The system traces all code paths that reference the employer contribution rate constant and generates an impact report.',
    artifact: 'Impact Analysis — CR-2026-042\n\nAffected Rules:\n  1. CONTRIBUTION_RATE_EMPLOYER (rules/tables.go:47)\n  2. Employer overview aggregation (employer_handlers.go:39)\n  3. Contribution report validation (connector fixtures)\n\nAffected Outputs:\n  - Employer Portal → Dashboard → contribution_rate_employer\n  - Employer Portal → Contribution Reporting → rate validation\n  - Monthly payroll deduction calculations\n\nRegression Risk: MEDIUM\n  - 12 tests reference 17.95%\n  - 3 demo fixtures use hardcoded rate\n  - 1 API response includes rate constant',
    aiRole: 'Traces all references, generates impact report, identifies test coverage',
    humanRole: 'Reviews impact scope, confirms no missed dependencies',
  },
  {
    id: 3,
    phase: 'Configuration',
    title: 'Rule Configuration Drafted',
    description: 'AI drafts the configuration change: new rate value, effective date, and version metadata. The prior rate is preserved for historical calculations.',
    detail: 'The rules engine supports date-effective versioning — both the old and new rates coexist, with the effective date determining which applies.',
    artifact: `Rule Change Draft — CR-2026-042

// rules/contribution_rates.yaml
contribution_rates:
  - version: "2024-01-01"
    employer_rate: 0.1795
    employee_rate: 0.0845
    source: "RMC §18-407(a), DERP Handbook Jan 2024"
    status: active

  - version: "2026-07-01"    # NEW
    employer_rate: 0.1900     # Changed from 0.1795
    employee_rate: 0.0845     # Unchanged
    source: "RMC §18-407(a), Ord. 2026-042"
    status: pending_certification

Note: Prior version preserved for retroactive calculations.
AI drafted this change. Human certification required before activation.`,
    aiRole: 'Reads ordinance text, drafts YAML configuration, preserves version history',
    humanRole: 'Reviews draft against actual ordinance language, certifies accuracy',
  },
  {
    id: 4,
    phase: 'Testing',
    title: 'Regression Tests Generated',
    description: 'System generates regression tests from the reviewed rule definition. Tests verify both the old rate (for pre-effective-date calculations) and new rate.',
    detail: 'The test suite is generated automatically from the certified rule definition, ensuring every changed value has boundary coverage.',
    artifact: `Generated Regression Tests — CR-2026-042

TestContributionRate_PreEffective (6 tests):
  ✓ employer_rate = 17.95% for dates before July 1, 2026
  ✓ employee_rate = 8.45% for dates before July 1, 2026
  ✓ monthly_employer_contribution matches at 17.95%
  ✓ boundary: June 30, 2026 uses old rate
  ✓ demo Case 1 (Robert Martinez) unchanged at 17.95%
  ✓ employer overview returns 17.95% for current period

TestContributionRate_PostEffective (6 tests):
  ✓ employer_rate = 19.00% for dates on/after July 1, 2026
  ✓ employee_rate = 8.45% for dates on/after July 1, 2026
  ✓ monthly_employer_contribution matches at 19.00%
  ✓ boundary: July 1, 2026 uses new rate
  ✓ employer portal shows 19.00% for July+ reports
  ✓ contribution discrepancy detected if old rate submitted after July 1

Result: 12 tests generated, 12 passed`,
    aiRole: 'Generates test cases from rule definition, executes regression suite',
    humanRole: 'Reviews test coverage, adds edge cases if needed, approves results',
  },
  {
    id: 5,
    phase: 'Certification',
    title: 'Human Certification & Approval',
    description: 'A plan administrator reviews the complete change package: source document, impact analysis, configuration draft, and test results. Certification is the human gate.',
    detail: 'No rule change reaches production without explicit human approval. The certification captures who approved, when, and their verification notes.',
    artifact: `Certification Record — CR-2026-042

Certifier: Sarah Chen, Benefits Director
Date: March 15, 2026
Decision: APPROVED

Verification Notes:
  ✓ Confirmed Ordinance 2026-042 text matches AI-extracted rate (19.00%)
  ✓ Confirmed effective date July 1, 2026
  ✓ Confirmed employee rate unchanged at 8.45%
  ✓ Reviewed impact analysis — 3 affected rules identified, all covered
  ✓ Reviewed 12 regression tests — all passing
  ✓ Confirmed prior rate preserved for retroactive calculations
  ✓ Confirmed no effect on benefit calculations (separate provisions)

Certification Hash: sha256:a1b2c3d4e5...
Change scheduled for activation: July 1, 2026 00:00:00 MDT`,
    aiRole: 'Prepares certification package, generates verification hash',
    humanRole: 'Reviews everything, makes the approve/reject decision, signs off',
  },
  {
    id: 6,
    phase: 'Deployment',
    title: 'Scheduled Activation',
    description: 'The certified rule change is deployed to production but remains dormant until the effective date. On July 1, 2026, the new rate activates automatically.',
    detail: 'The rules engine switches to the new version at the configured effective date. All calculations before that date continue using the prior rate. An audit trail records the transition.',
    artifact: `Deployment Log — CR-2026-042

Status: DEPLOYED (dormant until effective date)
Environment: production
Deployed: March 16, 2026 09:00:00 MDT
Effective: July 1, 2026 00:00:00 MDT

Pre-activation validation:
  ✓ Current calculations unaffected (using 2024-01-01 version)
  ✓ Future-dated calculations use 2026-07-01 version
  ✓ Rollback available: revert to prior version in < 60 seconds

Audit Trail:
  Mar 15 — CR-2026-042 certified by Sarah Chen
  Mar 16 — Deployed to production (dormant)
  Jul 01 — [SCHEDULED] Automatic activation
  Jul 01 — [SCHEDULED] Post-activation regression run`,
    aiRole: 'Manages deployment pipeline, schedules activation, monitors health',
    humanRole: 'Approves deployment window, available for rollback decision if needed',
  },
]

const PHASE_COLORS: Record<string, string> = {
  Detection: '#0ea5e9',
  Analysis: '#8b5cf6',
  Configuration: '#f59e0b',
  Testing: '#10b981',
  Certification: '#ef4444',
  Deployment: '#06b6d4',
}

export function ChangeManagementDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [expandedArtifact, setExpandedArtifact] = useState(true)

  const step = LIFECYCLE_STEPS[activeStep]
  const phaseColor = PHASE_COLORS[step.phase]

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#0f172a', color: '#fff', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
            Governance Demo
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            AI-Accelerated Change Management
          </div>
        </div>
        <div style={{
          fontSize: 11, color: '#94a3b8', background: '#1e293b',
          padding: '6px 14px', borderRadius: 6, border: '1px solid #334155',
        }}>
          Scenario: Employer Contribution Rate Change (RMC §18-407)
        </div>
      </div>

      {/* Phase timeline */}
      <div style={{
        display: 'flex', gap: 0, padding: '20px 32px 0',
        borderBottom: '1px solid #e2e8f0',
      }}>
        {LIFECYCLE_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveStep(i)}
            style={{
              flex: 1, padding: '12px 8px 14px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              borderBottom: i === activeStep ? `3px solid ${PHASE_COLORS[s.phase]}` : '3px solid transparent',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 1, color: PHASE_COLORS[s.phase],
              marginBottom: 2,
            }}>
              {s.phase}
            </div>
            <div style={{
              fontSize: 11, fontWeight: i === activeStep ? 700 : 500,
              color: i === activeStep ? '#0f172a' : '#64748b',
            }}>
              Step {s.id}
            </div>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
        {/* Step header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            color: '#fff', background: phaseColor,
            padding: '3px 10px', borderRadius: 4, marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {step.phase}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '8px 0 6px' }}>
            {step.title}
          </h2>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {step.description}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginTop: 8 }}>
            {step.detail}
          </p>
        </div>

        {/* AI / Human roles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, padding: 16,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#3b82f6',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
            }}>
              AI Role
            </div>
            <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
              {step.aiRole}
            </div>
          </div>
          <div style={{
            background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 8, padding: 16,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#d97706',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
            }}>
              Human Role
            </div>
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
              {step.humanRole}
            </div>
          </div>
        </div>

        {/* Artifact */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 8, overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpandedArtifact(!expandedArtifact)}
            style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: 'none', background: '#f8fafc', cursor: 'pointer',
              fontFamily: 'inherit', borderBottom: expandedArtifact ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              Artifact: {step.phase} Output
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {expandedArtifact ? '▾ Collapse' : '▸ Expand'}
            </span>
          </button>
          {expandedArtifact && (
            <pre style={{
              margin: 0, padding: 16,
              fontSize: 12, lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              color: '#334155', whiteSpace: 'pre-wrap',
              background: '#fff',
            }}>
              {step.artifact}
            </pre>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0',
        }}>
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            style={{
              padding: '10px 20px', borderRadius: 6, border: '1px solid #cbd5e1',
              background: activeStep === 0 ? '#f1f5f9' : '#fff',
              color: activeStep === 0 ? '#94a3b8' : '#475569',
              cursor: activeStep === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}
          >
            Previous
          </button>
          <div style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>
            Step {activeStep + 1} of {LIFECYCLE_STEPS.length}
          </div>
          <button
            onClick={() => setActiveStep(Math.min(LIFECYCLE_STEPS.length - 1, activeStep + 1))}
            disabled={activeStep === LIFECYCLE_STEPS.length - 1}
            style={{
              padding: '10px 20px', borderRadius: 6, border: 'none',
              background: activeStep === LIFECYCLE_STEPS.length - 1 ? '#94a3b8' : phaseColor,
              color: '#fff',
              cursor: activeStep === LIFECYCLE_STEPS.length - 1 ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}
          >
            {activeStep === LIFECYCLE_STEPS.length - 1 ? 'Complete' : 'Next Step'}
          </button>
        </div>

        {/* Governing principles callout */}
        <div style={{
          marginTop: 32, padding: 16,
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#16a34a',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Governing Principles in Action
          </div>
          <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
            <strong>Principle 1:</strong> AI does not execute business rules — it accelerates configuration and humans certify.
            <br />
            <strong>Principle 3:</strong> Rules changes follow full SDLC — no rule reaches production without human approval.
            <br />
            <strong>Principle 4:</strong> Source of truth is the governing document (Ordinance 2026-042), not the legacy database.
          </div>
        </div>
      </div>
    </div>
  )
}
