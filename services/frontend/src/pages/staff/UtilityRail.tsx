/**
 * Utility rail — right panel with Knowledge and Correspondence tools inline.
 * Auto-selects default tab based on current stage; collapsible.
 * Consumed by: GuidedWorkspace (ultra tier layout)
 * Depends on: KnowledgeMiniPanel, CorrespondenceMiniPanel, theme (C), Member types
 */
import { useState, useEffect } from 'react'
import { C } from '@/theme'
import { KnowledgeMiniPanel } from './KnowledgeMiniPanel'
import { CorrespondenceMiniPanel } from './CorrespondenceMiniPanel'
import type { Member, EligibilityResult, BenefitResult, ServiceCreditSummary } from '@/types/Member'

type Tab = 'knowledge' | 'compose'

interface UtilityRailProps {
  currentStageId: string
  memberId: string
  member?: Member
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  serviceCredit?: ServiceCreditSummary
  retirementDate?: string
  electedOption?: string
  defaultCollapsed?: boolean
}

// Stages that default to Correspondence tab
const COMPOSE_STAGES = new Set(['review-certify', 'supplemental'])

function getDefaultTab(stageId: string): Tab {
  return COMPOSE_STAGES.has(stageId) ? 'compose' : 'knowledge'
}

export function UtilityRail({
  currentStageId, memberId, member, eligibility, benefit, serviceCredit, retirementDate, electedOption,
  defaultCollapsed = false,
}: UtilityRailProps) {
  const [tab, setTab] = useState<Tab>(getDefaultTab(currentStageId))
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  // Auto-switch default when stage changes
  useEffect(() => {
    setTab(getDefaultTab(currentStageId))
  }, [currentStageId])

  if (collapsed) {
    return (
      <div style={{
        width: '28px', minWidth: '28px', flexShrink: 0,
        borderLeft: `1px solid ${C.borderSubtle}`,
        background: C.elevated, display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', paddingTop: '8px',
      }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Expand utility rail"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.textMuted, fontSize: '12px', padding: '4px',
            transform: 'rotate(180deg)',
          }}
        >{'\u276F'}</button>
        <div style={{
          writingMode: 'vertical-rl' as const, fontSize: '8px', color: C.textDim,
          letterSpacing: '1px', textTransform: 'uppercase' as const, marginTop: '12px',
        }}>Utility</div>
      </div>
    )
  }

  return (
    <div style={{
      width: 'clamp(280px, 22%, 400px)', flexShrink: 0,
      borderLeft: `1px solid ${C.borderSubtle}`,
      background: C.elevated, display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden',
    }}>
      {/* Tab header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
      }}>
        {(['knowledge', 'compose'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px 8px', border: 'none', cursor: 'pointer',
              fontSize: '9.5px', fontWeight: tab === t ? 700 : 500,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px',
              color: tab === t ? C.accent : C.textMuted,
              background: tab === t ? C.accentMuted : 'transparent',
              borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t === 'knowledge' ? 'Knowledge' : 'Compose'}
          </button>
        ))}
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse utility rail"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.textDim, fontSize: '10px', padding: '6px 8px',
          }}
        >{'\u276F'}</button>
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        {tab === 'knowledge' ? (
          <KnowledgeMiniPanel
            member={member}
            eligibility={eligibility}
            benefit={benefit}
            serviceCredit={serviceCredit}
            currentStageId={currentStageId}
          />
        ) : (
          <CorrespondenceMiniPanel
            memberId={memberId}
            member={member}
            eligibility={eligibility}
            benefit={benefit}
            retirementDate={retirementDate}
            electedOption={electedOption}
          />
        )}
      </div>
    </div>
  )
}
