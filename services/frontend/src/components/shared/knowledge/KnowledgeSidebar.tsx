/**
 * Collapsible right-side Knowledge panel wrapper — theme-neutral.
 * Renders a thin collapsed strip or an expanded panel with KnowledgeMiniPanel inside.
 * Consumed by: DeathWorkspace, RefundWorkspace, MemberDashboard, ApplicationWizard,
 *              ApplicationStatus, MemberProfile, VendorMemberDetail
 * Depends on: KnowledgeMiniPanel, KnowledgeColors
 */
import { KnowledgeMiniPanel } from '@/pages/staff/KnowledgeMiniPanel'
import type { KnowledgeColors } from './KnowledgeColors'
import type { Member, EligibilityResult, BenefitResult, ServiceCreditSummary } from '@/types/Member'

interface KnowledgeSidebarProps {
  collapsed: boolean
  onToggle: () => void
  colors: KnowledgeColors
  member?: Member
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  serviceCredit?: ServiceCreditSummary
  currentStageId?: string
  /** AI composition rationale per component — from useWorkspace agent mode */
  agentRationale?: Record<string, string>
  /** AI composition knowledge context — DERP provision citations from agent */
  agentKnowledge?: { provision_id: string; title: string; citation: string; relevance: string }[]
  /** Hide member identity section (name/tier/ID) — set true in portal where header already shows it */
  hideIdentity?: boolean
}

export function KnowledgeSidebar({
  collapsed, onToggle, colors,
  member, eligibility, benefit, serviceCredit, currentStageId,
  agentRationale, agentKnowledge, hideIdentity,
}: KnowledgeSidebarProps) {
  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        style={{
          width: 32, flexShrink: 0, cursor: 'pointer',
          borderLeft: `1px solid ${colors.borderSubtle}`,
          background: colors.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          writingMode: 'vertical-rl',
          userSelect: 'none',
        }}
        title="Expand Knowledge panel"
      >
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 1,
          color: colors.accent, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {'\u25C0'} Knowledge
        </span>
      </div>
    )
  }

  return (
    <div style={{
      width: 'clamp(260px, 22%, 340px)', flexShrink: 0,
      borderLeft: `1px solid ${colors.borderSubtle}`,
      background: colors.surface,
      display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden',
    }}>
      {/* Header with collapse button */}
      <div style={{
        padding: '6px 10px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          color: colors.accent, textTransform: 'uppercase',
        }}>Knowledge</span>
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: colors.textMuted, padding: '2px 4px',
          }}
          title="Collapse panel"
        >{'\u25B6'}</button>
      </div>
      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <KnowledgeMiniPanel
          member={member}
          eligibility={eligibility}
          benefit={benefit}
          serviceCredit={serviceCredit}
          currentStageId={currentStageId}
          colors={colors}
          agentRationale={agentRationale}
          agentKnowledge={agentKnowledge}
          hideIdentity={hideIdentity}
        />
      </div>
    </div>
  )
}
