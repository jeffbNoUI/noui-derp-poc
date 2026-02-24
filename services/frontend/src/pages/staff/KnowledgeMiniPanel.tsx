/**
 * Compact knowledge search panel for the utility rail — dark theme.
 * Provides searchable DERP plan provisions with citations. In connected mode
 * (member loaded), provisions are sorted by stage relevance and each shows
 * member-specific analysis with status badges computed from real typed data.
 * Consumed by: UtilityRail.tsx
 * Depends on: knowledge-base.ts, knowledge-enhancements.ts, theme (C), Member types
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { C } from '@/theme'
import { KNOWLEDGE_BASE, searchKnowledge } from '@/lib/knowledge-base'
import { getMemberEnhancement, getStageRelevantIds } from '@/lib/knowledge-enhancements'
import type { KnowledgeEntry } from '@/lib/knowledge-base'
import type { MemberEnhancement } from '@/lib/knowledge-enhancements'
import type { Member, EligibilityResult, BenefitResult, ServiceCreditSummary } from '@/types/Member'

interface KnowledgeMiniPanelProps {
  member?: Member
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  serviceCredit?: ServiceCreditSummary
  currentStageId?: string
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
  member, eligibility, benefit, serviceCredit, currentStageId,
}: KnowledgeMiniPanelProps) {
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
      {/* Connected mode indicator */}
      {isConnected && (
        <div style={{
          padding: '5px 10px', fontSize: '9px', fontWeight: 600,
          color: C.accent, background: C.accentMuted,
          borderBottom: `1px solid ${C.borderSubtle}`,
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: C.accent, display: 'inline-block',
          }} />
          Showing for: {member.first_name} {member.last_name}
        </div>
      )}

      {/* Search input */}
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setExpandedId(null) }}
            placeholder="Search provisions..."
            style={{
              width: '100%', padding: '7px 28px 7px 10px', fontSize: '11px',
              border: `1px solid ${C.border}`, borderRadius: '6px',
              background: C.surface, color: C.text, outline: 'none',
              boxSizing: 'border-box' as const,
            }}
            onFocus={e => { e.target.style.borderColor = C.accent }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setExpandedId(null) }}
              style={{
                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.textMuted, fontSize: '10px', padding: '2px',
              }}
            >{'\u2715'}</button>
          )}
        </div>
      </div>

      {/* Results / suggestions */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px' }}>
        {results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={{ fontSize: '9px', color: C.textDim, fontWeight: 600, marginBottom: '2px' }}>
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
              />
            ))}
          </div>
        ) : query.length > 1 ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 8px', color: C.textMuted, fontSize: '11px' }}>
            No provisions match &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: '9px', color: C.textDim, fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px',
              marginBottom: '6px', marginTop: '4px',
            }}>Quick search</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)} style={{
                  fontSize: '9.5px', padding: '3px 8px', borderRadius: '4px',
                  background: C.surface, border: `1px solid ${C.borderSubtle}`,
                  color: C.textMuted, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            {/* Section header — "Relevant to this stage" or "All provisions" */}
            <div style={{
              marginTop: '12px', fontSize: '9px', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px',
              marginBottom: '6px',
              color: relevantCount > 0 ? C.accent : C.textDim,
            }}>{relevantCount > 0 ? 'Relevant to this stage' : 'All provisions'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
              {sorted.map((entry, i) => (
                <div key={entry.id}>
                  {/* Divider between relevant and remaining provisions */}
                  {relevantCount > 0 && i === relevantCount && (
                    <div style={{
                      marginTop: '8px', marginBottom: '6px', fontSize: '9px', color: C.textDim,
                      fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                    }}>All provisions</div>
                  )}
                  <ProvisionCard
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    enhancement={enhancements[entry.id]}
                    highlighted={relevantIdSet.has(entry.id)}
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

function ProvisionCard({ entry, expanded, onToggle, enhancement, highlighted }: {
  entry: KnowledgeEntry
  expanded: boolean
  onToggle: () => void
  enhancement?: MemberEnhancement
  highlighted?: boolean
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? C.elevated : C.surface,
        border: `1px solid ${expanded ? C.accent : (highlighted ? 'rgba(59,130,246,0.37)' : C.borderSubtle)}`,
        borderLeft: highlighted ? `3px solid ${C.accent}` : undefined,
        borderRadius: '6px', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
            {entry.title}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' as const }}>
            <span style={{
              fontSize: '8px', fontWeight: 700, fontFamily: "'SF Mono',monospace",
              padding: '1px 5px', borderRadius: '3px',
              background: C.accentMuted, color: C.accent,
            }}>{entry.citation}</span>
            <span style={{
              fontSize: '8px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
              background: C.borderSubtle, color: C.textMuted,
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
          fontSize: '8px', color: C.textDim, flexShrink: 0, marginLeft: '4px', marginTop: '2px',
          transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
        }}>{'\u25BC'}</span>
      </div>
      {expanded && (
        <div style={{
          padding: '6px 8px 8px', borderTop: `1px solid ${C.borderSubtle}`,
        }}>
          <p style={{
            fontSize: '10px', lineHeight: 1.55, color: C.textSecondary,
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
                fontSize: '9.5px', lineHeight: 1.5, color: C.text,
              }}>{enhancement.content}</div>
            </div>
          )}
          {entry.related.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', gap: '3px', flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: '8px', color: C.textDim }}>Related:</span>
              {entry.related.map(id => {
                const rel = KNOWLEDGE_BY_ID.get(id)
                return rel ? (
                  <span key={id} style={{
                    fontSize: '8px', color: C.accent, background: C.accentMuted,
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
