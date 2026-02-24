/**
 * WhyPopover — inline "?" micro-explanation for key values.
 * Wraps children (typically a Field) with a small teal circle icon. Click expands
 * an inline panel showing rule citation, description, computed result, and optional
 * worked example. Implements Governing Principle 2: Trust Through Transparency.
 * Consumed by: Stage3Eligibility, Stage4BenefitCalc, Stage6Supplemental
 * Depends on: theme (C), Badge, Member.ts (AuditEntry)
 */
import { useState, type ReactNode } from 'react'
import { C } from '@/theme'
import { Badge } from './Badge'
import type { AuditEntry } from '@/types/Member'

export function WhyPopover({
  children, entry, workedExample,
}: {
  children: ReactNode
  entry: AuditEntry
  workedExample?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* Wrapped child with ? icon overlay */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={`Why: ${entry.rule_name}`}
          style={{
            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
            background: open ? C.accent : C.accentMuted,
            border: `1px solid ${open ? C.accent : C.accentSolid}`,
            color: open ? '#ffffff' : C.accent,
            fontSize: '9px', fontWeight: 700, lineHeight: '1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginTop: '4px', marginLeft: '4px',
            transition: 'all 0.15s',
          }}
        >?</button>
      </div>

      {/* Expandable explanation panel */}
      {open && (
        <div style={{
          marginTop: '4px', padding: '8px 10px',
          background: C.elevated, borderRadius: '6px',
          border: `1px solid ${C.accentSolid}`,
          animation: 'why-popover-in 0.15s ease-out',
        }}>
          <style>{`
            @keyframes why-popover-in {
              from { opacity: 0; max-height: 0; }
              to { opacity: 1; max-height: 200px; }
            }
          `}</style>
          {/* Citation badge + rule name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {entry.source_reference && (
              <Badge text={entry.source_reference} bg={C.accentMuted} color={C.accent} />
            )}
            <span style={{ color: C.text, fontSize: '11px', fontWeight: 600 }}>
              {entry.rule_name}
            </span>
          </div>

          {/* Description */}
          <div style={{ color: C.textSecondary, fontSize: '10.5px', lineHeight: '1.45', marginBottom: '4px' }}>
            {entry.description}
          </div>

          {/* Computed result */}
          <div style={{
            color: C.accent, fontSize: '11px', fontWeight: 600,
            fontFamily: "'SF Mono',monospace",
          }}>
            {entry.result}
          </div>

          {/* Optional worked example */}
          {workedExample && (
            <div style={{
              marginTop: '6px', padding: '6px 8px',
              background: C.accentMuted, borderRadius: '4px',
              color: C.text, fontSize: '10px', lineHeight: '1.5',
              fontFamily: "'SF Mono',monospace",
            }}>
              {workedExample}
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: '6px', padding: '3px 10px', borderRadius: '4px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.textMuted, fontSize: '9px', cursor: 'pointer',
            }}
          >Got it</button>
        </div>
      )}
    </div>
  )
}
