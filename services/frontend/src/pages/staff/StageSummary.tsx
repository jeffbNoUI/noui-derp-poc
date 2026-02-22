/**
 * Generic summary card renderer for adaptive card depth (F-1).
 * Renders 2-3 key values from summaryFields metadata + signal reason.
 * Shows a "Show Details" link to expand to the full stage component.
 * Consumed by: GuidedWorkspace (guided mode), ExpertMode (collapsed cards)
 * Depends on: guided-help.ts (SummaryField), guided-depth.ts (resolveSummaryValues),
 *   guided-signals.ts (StageSignal), stages/StageProps, theme (C, fmt)
 */
import { C, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import type { SummaryField } from './guided-help'
import type { StageSignal } from './guided-signals'
import { resolveSummaryValues } from './guided-depth'
import type { StageProps } from './stages/StageProps'

export interface StageSummaryProps {
  summaryFields: SummaryField[]
  signal?: StageSignal
  stageProps: StageProps
  onExpand: () => void
  /** If true, suppress the expand link (used in expert mode collapsed preview) */
  compact?: boolean
}

/** Format a raw value string based on the SummaryField format type */
function formatValue(
  raw: string,
  format: SummaryField['format'],
  badgeColor?: SummaryField['badgeColor'],
): React.ReactNode {
  if (raw === '—') return <span style={{ color: C.textDim }}>—</span>

  switch (format) {
    case 'fmt': {
      const num = parseFloat(raw)
      return isNaN(num)
        ? raw
        : <span style={{ fontFamily: "'SF Mono',monospace", fontWeight: 600, color: C.accent }}>{fmt(num)}</span>
    }
    case 'years': {
      const num = parseFloat(raw)
      if (isNaN(num)) return raw === '0' ? 'None' : raw
      return num === 0
        ? <span style={{ color: C.textMuted }}>None</span>
        : <span style={{ fontFamily: "'SF Mono',monospace", fontWeight: 600 }}>{num.toFixed(2)}y</span>
    }
    case 'badge': {
      // Boolean-ish values → descriptive badge
      const boolStr = String(raw).toLowerCase()
      if (boolStr === 'true') {
        const colors = badgeColor === 'success'
          ? { bg: C.successMuted, color: C.success }
          : badgeColor === 'warn'
            ? { bg: '#FEF3C7', color: '#D97706' }
            : { bg: C.accentMuted, color: C.accent }
        return <Badge text="Met" bg={colors.bg} color={colors.color} />
      }
      if (boolStr === 'false') {
        return <Badge text="Missed" bg="#FEE2E2" color={C.danger} />
      }
      // Non-boolean badge — show raw value with color
      const colors = badgeColor === 'success'
        ? { bg: C.successMuted, color: C.success }
        : badgeColor === 'warn'
          ? { bg: '#FEF3C7', color: '#D97706' }
          : { bg: C.accentMuted, color: C.accent }
      return <Badge text={raw} bg={colors.bg} color={colors.color} />
    }
    case 'text':
    default: {
      // reduction_factor: show as percentage or "None"
      const num = parseFloat(raw)
      if (!isNaN(num) && num > 0 && num < 1) {
        const pct = ((1 - num) * 100).toFixed(0)
        return <span style={{ color: '#F59E0B', fontWeight: 600 }}>{pct}%</span>
      }
      if (!isNaN(num) && num === 1) {
        return <span style={{ color: C.success, fontWeight: 600 }}>None</span>
      }
      // Prettify retirement_type values
      if (raw === 'rule_of_75' || raw === 'rule_of_85') {
        return raw.replace('rule_of_', 'Rule of ').replace('_', ' ')
      }
      if (raw === 'normal') return 'Normal'
      if (raw === 'early') return 'Early'
      // Prettify payment option types
      if (raw === 'maximum') return 'Maximum'
      if (raw.startsWith('j&s_')) return `J&S ${raw.slice(4)}%`
      return raw
    }
  }
}

export function StageSummary({
  summaryFields, signal, stageProps, onExpand, compact,
}: StageSummaryProps) {
  const resolved = resolveSummaryValues(summaryFields, stageProps)

  return (
    <div style={{ padding: compact ? '6px 12px' : '12px 16px' }}>
      {/* Key values grid */}
      <div style={{
        display: 'flex', gap: compact ? '12px' : '16px', flexWrap: 'wrap' as const,
        alignItems: 'center',
      }}>
        {resolved.map((field, i) => (
          <div key={i} style={{ minWidth: compact ? '60px' : '80px' }}>
            <div style={{
              color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
              letterSpacing: '0.8px', fontWeight: 600, marginBottom: '2px',
            }}>{field.label}</div>
            <div style={{ fontSize: compact ? '11px' : '12.5px', color: C.text }}>
              {formatValue(field.value, field.format, field.badgeColor)}
            </div>
          </div>
        ))}
      </div>

      {/* Signal reason + expand link */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${C.borderSubtle}`,
        }}>
          {signal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: signal.level === 'green' ? C.success : '#F59E0B',
              }} />
              <span style={{ color: C.textMuted, fontSize: '10px' }}>{signal.reason}</span>
            </div>
          )}
          <button
            onClick={onExpand}
            style={{
              background: 'none', border: 'none', color: C.accent,
              fontSize: '10.5px', cursor: 'pointer', fontWeight: 500,
              padding: '2px 6px', borderRadius: '3px',
            }}
          >
            Show Details →
          </button>
        </div>
      )}
    </div>
  )
}
