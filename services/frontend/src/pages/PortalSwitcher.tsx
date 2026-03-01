/**
 * Platform showcase landing page — navigate to all NoUI capabilities.
 * Three sections: Core Workspaces, Productivity Services, Platform Intelligence.
 * Consumed by: router.tsx (root "/" route)
 * Depends on: react-router-dom (useNavigate)
 */
import { useNavigate } from 'react-router-dom'

interface Card {
  id: string
  name: string
  subtitle: string
  description: string
  icon: string
  iconBg: string
  path: string
  loginPath?: string
}

interface Section {
  title: string
  subtitle: string
  cards: Card[]
}

const SECTIONS: Section[] = [
  {
    title: 'Core Workspaces',
    subtitle: 'The retirement application workflow from both perspectives',
    cards: [
      {
        id: 'staff', name: 'Staff Portal', subtitle: 'Benefits Analyst Workspace',
        description: 'Process retirement applications, verify eligibility, calculate benefits.',
        icon: 'N', iconBg: '#00363a', path: '/staff', loginPath: '/staff/login',
      },
      {
        id: 'member', name: 'Member Portal', subtitle: 'MyCOPERA · Your Retirement Journey',
        description: 'Start your retirement application, track progress, manage documents.',
        icon: 'D', iconBg: '#00796b', path: '/portal', loginPath: '/portal/login',
      },
      {
        id: 'employer', name: 'Employer Portal', subtitle: 'Department Reporting',
        description: 'Employee rosters, contribution reporting, retirement coordination.',
        icon: 'E', iconBg: '#1e293b', path: '/employer', loginPath: '/employer/login',
      },
      {
        id: 'vendor', name: 'Vendor Portal', subtitle: 'Insurance Enrollment',
        description: 'Enrollment queue, IPR verification, coverage management.',
        icon: 'V', iconBg: '#059669', path: '/vendor', loginPath: '/vendor/login',
      },
    ],
  },
  {
    title: 'Productivity Services',
    subtitle: 'AI-accelerated tools that augment analyst capabilities',
    cards: [
      {
        id: 'knowledge', name: 'Knowledge Assistant', subtitle: 'Plan Provision Search',
        description: 'Search COPERA provisions with statutory citations. Standalone or member-connected modes.',
        icon: '\u00A7', iconBg: '#0369a1', path: '/demos/knowledge-assistant',
      },
      {
        id: 'correspondence', name: 'Correspondence Composer', subtitle: 'Context-Aware Letters',
        description: 'Assemble retirement letters from structured content blocks with full provenance.',
        icon: '\u2709', iconBg: '#6a1b9a', path: '/demos/correspondence',
      },
      {
        id: 'validator', name: 'Data Entry Validator', subtitle: 'Real-Time Field Checks',
        description: 'Validate entries against business rules with inline citations and corrections.',
        icon: '\u2713', iconBg: '#e65100', path: '/demos/data-validator',
      },
    ],
  },
  {
    title: 'Platform Intelligence',
    subtitle: 'Learning, operations, and data quality — the system observes and informs',
    cards: [
      {
        id: 'learning', name: 'Learning Engine', subtitle: 'Adaptive Training',
        description: 'Duolingo-style learning for pension administration. Quizzes, scenarios, mastery tracking.',
        icon: '\u{1F393}', iconBg: '#2e7d32', path: '/demos/learning-engine',
      },
      {
        id: 'workflow', name: 'Workflow Dashboard', subtitle: 'Supervisor View',
        description: 'Processing pipeline, caseload heatmap, case reassignment, deadline risk.',
        icon: '\u{1F4CA}', iconBg: '#00363a', path: '/demos/workflow',
      },
      {
        id: 'operational', name: 'Operational Dashboard', subtitle: 'Processing Analytics',
        description: 'Processing times, exception frequencies, and detected workflow patterns.',
        icon: '\u{1F4C8}', iconBg: '#1565c0', path: '/demos/operational',
      },
      {
        id: 'data-quality', name: 'Data Quality', subtitle: 'Migration Insights',
        description: 'Severity-classified findings with proposed corrections awaiting human review.',
        icon: '\u{1F50D}', iconBg: '#c62828', path: '/demos/data-quality',
      },
    ],
  },
]

export function PortalSwitcher() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', background: '#f6f9f9',
      fontFamily: "'Source Sans 3', sans-serif", padding: '48px 20px',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, color: '#00796b', textTransform: 'uppercase' as const,
        letterSpacing: 2, fontWeight: 600, marginBottom: 8,
      }}>NoUI Platform</div>
      <div style={{
        fontSize: 26, fontWeight: 700, color: '#1a2e2e',
        fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8,
      }}>Colorado Public Employees' Retirement Association</div>
      <div style={{
        fontSize: 13, color: '#4a6363', marginBottom: 40, maxWidth: 520, textAlign: 'center' as const,
        lineHeight: 1.6,
      }}>
        A proof of concept demonstrating how AI composes context-sensitive workspaces
        while a deterministic rules engine handles all calculations and decisions.
      </div>

      {/* Sections */}
      <div style={{ width: '100%', maxWidth: 900 }}>
        {SECTIONS.map((section, si) => (
          <div key={section.title} style={{ marginBottom: si < SECTIONS.length - 1 ? 36 : 0 }}>
            {/* Section header */}
            <div style={{ marginBottom: 14, paddingLeft: 4 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#00796b',
                textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 2,
              }}>{section.title}</div>
              <div style={{ fontSize: 12, color: '#5a7878' }}>{section.subtitle}</div>
            </div>

            {/* Cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(section.cards.length, 4)}, 1fr)`,
              gap: 12,
            }}>
              {section.cards.map(card => (
                <button key={card.id} onClick={() => navigate(card.path)} style={{
                  padding: 20, background: '#ffffff',
                  border: '1px solid #d4e0e0', borderRadius: 12,
                  cursor: 'pointer', textAlign: 'left' as const,
                  boxShadow: '0 2px 8px rgba(0,54,58,0.06)',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = card.iconBg
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,54,58,0.10)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#d4e0e0'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,54,58,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: card.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12,
                  }}>{card.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e2e', marginBottom: 3 }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: '#5a7878', marginBottom: 8 }}>{card.subtitle}</div>
                  <div style={{ fontSize: 12, color: '#4a6363', lineHeight: 1.5 }}>{card.description}</div>
                  {card.loginPath && (
                    <div
                      onClick={e => { e.stopPropagation(); navigate(card.loginPath!) }}
                      style={{
                        fontSize: 10, color: card.iconBg, marginTop: 8,
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >Sign In {'\u2192'}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 10, color: '#9bb0b0', marginTop: 40, textAlign: 'center' as const, maxWidth: 500,
        lineHeight: 1.6,
      }}>
        The rules engine is configured with certified plan provisions.
        AI composes the workspace; the rules engine determines the numbers.
        Every calculation is transparent and verifiable.
      </div>
    </div>
  )
}
