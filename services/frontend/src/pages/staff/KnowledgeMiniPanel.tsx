/**
 * Compact knowledge search panel — theme-neutral via optional colors prop.
 * Provides searchable DERP plan provisions with citations. In connected mode
 * (member loaded), provisions are sorted by stage relevance and each shows
 * member-specific analysis with status badges computed from real typed data.
 * Consumed by: UtilityRail.tsx, KnowledgeSidebar.tsx
 * Depends on: knowledge-base.ts, knowledge-enhancements.ts, theme (C), Member types, KnowledgeColors
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { C } from '@/theme'
import { KNOWLEDGE_BASE, searchKnowledge } from '@/lib/knowledge-base'
import { getMemberEnhancement, getStageRelevantIds } from '@/lib/knowledge-enhancements'
import type { KnowledgeEntry } from '@/lib/knowledge-base'
import type { MemberEnhancement } from '@/lib/knowledge-enhancements'
import type { Member, EligibilityResult, BenefitResult, ServiceCreditSummary } from '@/types/Member'
import type { KnowledgeColors } from '@/components/shared/knowledge/KnowledgeColors'

interface KnowledgeMiniPanelProps {
  member?: Member
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  serviceCredit?: ServiceCreditSummary
  currentStageId?: string
  /** Optional theme colors — falls back to legacy C when not provided */
  colors?: KnowledgeColors
  /** AI composition rationale per component — rendered in "AI Insights" section */
  agentRationale?: Record<string, string>
  /** AI composition knowledge context — DERP provision citations from agent */
  agentKnowledge?: { provision_id: string; title: string; citation: string; relevance: string }[]
  /** Hide member identity indicator — portal header already shows member name/tier */
  hideIdentity?: boolean
}

const SUGGESTIONS = [
  'rule of 75', 'early retirement', 'purchased service',
  'leave payout', 'payment options', 'DRO',
]

// Status badge colors — rgba for transparency without hex-append fragility
const STATUS_COLORS: Record<MemberEnhancement['status'], { bg: string; fg: string }> = {
  'met':      { bg: 'rgba(34,197,94,0.15)', fg: '#22C55E' },
  'not-met':  { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' },
  'caution':  { bg: 'rgba(245,158,11,0.15)', fg: '#F59E0B' },
  'info':     { bg: 'rgba(59,130,246,0.15)', fg: '#3B82F6' },
}

// Status badge labels — avoids nested ternary in JSX
const STATUS_LABELS: Record<MemberEnhancement['status'], string> = {
  'met': 'MET', 'not-met': 'NOT MET', 'caution': 'NOTE', 'info': 'INFO',
}

// Pre-built lookup map for O(1) related-entry resolution
const KNOWLEDGE_BY_ID = new Map(KNOWLEDGE_BASE.map(e => [e.id, e]))

export function KnowledgeMiniPanel({
  member, eligibility, benefit, serviceCredit, currentStageId, colors,
  agentRationale, agentKnowledge, hideIdentity,
}: KnowledgeMiniPanelProps) {
  // Use provided colors or fall back to legacy C — zero impact on existing UtilityRail usage
  const k = colors ?? C
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isConnected = !!member
  const results = query.trim().length > 1 ? searchKnowledge(query) : []

  // Compute enhancements for all provisions when member is loaded
  const enhancements = useMemo(() => {
    if (!member) return {}
    const map: Record<string, MemberEnhancement> = {}
    for (const entry of KNOWLEDGE_BASE) {
      const enh = getMemberEnhancement(entry.id, member, eligibility, benefit, serviceCredit)
      if (enh) map[entry.id] = enh
    }
    return map
  }, [member, eligibility, benefit, serviceCredit])

  // Stage-relevant provision IDs (single computation, shared by sort + highlight)
  const relevantIdSet = useMemo(() => {
    if (!currentStageId) return new Set<string>()
    return new Set(getStageRelevantIds(currentStageId))
  }, [currentStageId])

  // Sort provisions: stage-relevant first, then remaining. Track the split index
  // for the section divider based on actual matched entries (not raw relevantIdSet.size)
  const { sorted, relevantCount } = useMemo(() => {
    if (!isConnected || !currentStageId || relevantIdSet.size === 0) {
      return { sorted: KNOWLEDGE_BASE, relevantCount: 0 }
    }
    const relevant = KNOWLEDGE_BASE.filter(e => relevantIdSet.has(e.id))
    const rest = KNOWLEDGE_BASE.filter(e => !relevantIdSet.has(e.id))
    return { sorted: [...relevant, ...rest], relevantCount: relevant.length }
  }, [isConnected, currentStageId, relevantIdSet])

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      {/* Connected mode indicator — hidden in portal where header already shows member identity */}
      {isConnected && !hideIdentity && (
        <div style={{
          padding: '5px 10px', fontSize: '9px', fontWeight: 600,
          color: k.accent, background: k.accentMuted,
          borderBottom: `1px solid ${k.borderSubtle}`,
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: k.accent, display: 'inline-block',
          }} />
          Showing for: {member.first_name} {member.last_name}
        </div>
      )}

      {/* AI Insights — rationale and knowledge context from composition service */}
      {agentRationale && Object.keys(agentRationale).length > 0 && (
        <div style={{ padding: '8px 10px', borderBottom: `1px solid ${k.borderSubtle}` }}>
          <div style={{
            fontSize: '9px', fontWeight: 700, color: '#8B5CF6',
            textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px',
          }}>AI Insights</div>
          {Object.entries(agentRationale)
            .filter(([id]) => !currentStageId || id.includes(currentStageId.replace('wizard-', '').replace(/-/g, '_')) || !currentStageId.startsWith('wizard'))
            .slice(0, 5)
            .map(([componentId, reason]) => (
            <div key={componentId} style={{
              padding: '4px 0', borderBottom: `1px solid ${k.borderSubtle}`,
            }}>
              <div style={{ fontSize: '9.5px', fontWeight: 600, color: k.text }}>{componentId.replace(/-/g, ' ')}</div>
              <div style={{ fontSize: '9px', color: k.textSecondary, marginTop: '1px', lineHeight: 1.4 }}>{reason}</div>
            </div>
          ))}
        </div>
      )}
      {agentKnowledge && agentKnowledge.length > 0 && (
        <div style={{ padding: '8px 10px', borderBottom: `1px solid ${k.borderSubtle}` }}>
          <div style={{
            fontSize: '9px', fontWeight: 700, color: '#8B5CF6',
            textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px',
          }}>Relevant Provisions</div>
          {agentKnowledge.map((kc) => (
            <div key={kc.provision_id} style={{
              padding: '4px 0', borderBottom: `1px solid ${k.borderSubtle}`,
            }}>
              <div style={{ fontSize: '9.5px', fontWeight: 600, color: k.text }}>{kc.title}</div>
              <div style={{
                fontSize: '8px', fontFamily: "'SF Mono',monospace", color: k.accent,
                background: k.accentMuted, padding: '1px 5px', borderRadius: '3px',
                display: 'inline-block', marginTop: '2px',
              }}>{kc.citation}</div>
              <div style={{ fontSize: '9px', color: k.textSecondary, marginTop: '2px', lineHeight: 1.4 }}>{kc.relevance}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${k.borderSubtle}` }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setExpandedId(null) }}
            placeholder="Search provisions..."
            style={{
              width: '100%', padding: '7px 28px 7px 10px', fontSize: '11px',
              border: `1px solid ${k.border}`, borderRadius: '6px',
              background: k.surface, color: k.text, outline: 'none',
              boxSizing: 'border-box' as const,
            }}
            onFocus={e => { e.target.style.borderColor = k.accent }}
            onBlur={e => { e.target.style.borderColor = k.border }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setExpandedId(null) }}
              style={{
                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: k.textMuted, fontSize: '10px', padding: '2px',
              }}
            >{'\u2715'}</button>
          )}
        </div>
      </div>

      {/* Results / suggestions */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px' }}>
        {results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={{ fontSize: '9px', color: k.textDim, fontWeight: 600, marginBottom: '2px' }}>
              {results.length} provision{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map(entry => (
              <ProvisionCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                enhancement={enhancements[entry.id]}
                highlighted={relevantIdSet.has(entry.id)}
                k={k}
              />
            ))}
          </div>
        ) : query.length > 1 ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 8px', color: k.textMuted, fontSize: '11px' }}>
            No provisions match &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: '9px', color: k.textDim, fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px',
              marginBottom: '6px', marginTop: '4px',
            }}>Quick search</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)} style={{
                  fontSize: '9.5px', padding: '3px 8px', borderRadius: '4px',
                  background: k.surface, border: `1px solid ${k.borderSubtle}`,
                  color: k.textMuted, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            {/* Section header — "Relevant to this stage" or "All provisions" */}
            <div style={{
              marginTop: '12px', fontSize: '9px', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px',
              marginBottom: '6px',
              color: relevantCount > 0 ? k.accent : k.textDim,
            }}>{relevantCount > 0 ? 'Relevant to this stage' : 'All provisions'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
              {sorted.map((entry, i) => (
                <div key={entry.id}>
                  {/* Divider between relevant and remaining provisions */}
                  {relevantCount > 0 && i === relevantCount && (
                    <div style={{
                      marginTop: '8px', marginBottom: '6px', fontSize: '9px', color: k.textDim,
                      fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                    }}>All provisions</div>
                  )}
                  <ProvisionCard
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    enhancement={enhancements[entry.id]}
                    highlighted={relevantIdSet.has(entry.id)}
                    k={k}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProvisionCard({ entry, expanded, onToggle, enhancement, highlighted, k }: {
  entry: KnowledgeEntry
  expanded: boolean
  onToggle: () => void
  enhancement?: MemberEnhancement
  highlighted?: boolean
  k: KnowledgeColors
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? k.elevated : k.surface,
        border: `1px solid ${expanded ? k.accent : (highlighted ? 'rgba(59,130,246,0.37)' : k.borderSubtle)}`,
        borderLeft: highlighted ? `3px solid ${k.accent}` : undefined,
        borderRadius: '6px', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: k.text, lineHeight: 1.3 }}>
            {entry.title}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' as const }}>
            <span style={{
              fontSize: '8px', fontWeight: 700, fontFamily: "'SF Mono',monospace",
              padding: '1px 5px', borderRadius: '3px',
              background: k.accentMuted, color: k.accent,
            }}>{entry.citation}</span>
            <span style={{
              fontSize: '8px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
              background: k.borderSubtle, color: k.textMuted,
            }}>{entry.tier}</span>
            {/* Inline status badge when collapsed */}
            {!expanded && enhancement && (
              <span style={{
                fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
                background: STATUS_COLORS[enhancement.status].bg,
                color: STATUS_COLORS[enhancement.status].fg,
              }}>
                {STATUS_LABELS[enhancement.status]}
              </span>
            )}
          </div>
        </div>
        <span style={{
          fontSize: '8px', color: k.textDim, flexShrink: 0, marginLeft: '4px', marginTop: '2px',
          transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
        }}>{'\u25BC'}</span>
      </div>
      {expanded && (
        <div style={{
          padding: '6px 8px 8px', borderTop: `1px solid ${k.borderSubtle}`,
        }}>
          <p style={{
            fontSize: '10px', lineHeight: 1.55, color: k.textSecondary,
            margin: 0,
          }}>{entry.provision}</p>
          {/* Member-specific enhancement */}
          {enhancement && (
            <div style={{
              marginTop: '8px', padding: '6px 8px', borderRadius: '5px',
              background: STATUS_COLORS[enhancement.status].bg,
              borderLeft: `3px solid ${STATUS_COLORS[enhancement.status].fg}`,
            }}>
              <div style={{
                fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px',
                color: STATUS_COLORS[enhancement.status].fg, marginBottom: '3px',
                textTransform: 'uppercase' as const,
              }}>{enhancement.label}</div>
              <div style={{
                fontSize: '9.5px', lineHeight: 1.5, color: k.text,
              }}>{enhancement.content}</div>
            </div>
          )}
          {entry.related.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', gap: '3px', flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: '8px', color: k.textDim }}>Related:</span>
              {entry.related.map(id => {
                const rel = KNOWLEDGE_BY_ID.get(id)
                return rel ? (
                  <span key={id} style={{
                    fontSize: '8px', color: k.accent, background: k.accentMuted,
                    padding: '1px 5px', borderRadius: '3px',
                  }}>{rel.title}</span>
                ) : null
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
