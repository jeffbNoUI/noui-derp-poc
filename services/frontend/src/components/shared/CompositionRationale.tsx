/**
 * CompositionRationale — popover showing AI composition reasoning.
 * Displays composed_by source, per-component rationale, and alerts.
 * Implements Governing Principle 2: Trust Through Transparency.
 * Consumed by: GuidedWorkspace (banner badge), BenefitWorkspace (banner badge)
 * Depends on: theme (C), Badge, useWorkspace.ts (AgentWorkspaceSpec)
 */
import { useState } from 'react'
import { C } from '@/theme'
import { Badge } from './Badge'
import type { AgentWorkspaceSpec } from '@/hooks/useWorkspace'

export function CompositionRationale({ spec }: { spec: AgentWorkspaceSpec }) {
  const [open, setOpen] = useState(false)
  const isAgent = spec.composed_by === 'agent'
  const badgeColor = isAgent ? '#8B5CF6' : C.textMuted

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Clickable badge */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          padding: '2px 7px', borderRadius: '4px', background: C.surface,
          border: `1px solid ${C.borderSubtle}`, fontSize: '9.5px',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px',
        }}
      >
        <span style={{ color: C.textMuted }}>Composed </span>
        <span style={{ color: badgeColor, fontWeight: 600 }}>
          {isAgent ? 'AI' : 'Rules'}
        </span>
      </button>

      {/* Rationale popover */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '4px',
          width: '320px', maxHeight: '400px', overflow: 'auto',
          background: C.elevated, borderRadius: '8px',
          border: `1px solid ${isAgent ? '#8B5CF688' : C.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 100, padding: '12px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Badge
                text={isAgent ? 'Agent (Claude)' : 'Static Rules'}
                bg={isAgent ? '#8B5CF622' : C.accentMuted}
                color={isAgent ? '#8B5CF6' : C.accent}
              />
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.textMuted, fontSize: '12px',
              }}
            >{'\u2715'}</button>
          </div>

          {/* Alerts */}
          {spec.alerts.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                color: C.textSecondary, fontSize: '9px', textTransform: 'uppercase' as const,
                letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
              }}>Alerts</div>
              {spec.alerts.map((alert, i) => {
                const color = alert.severity === 'error' ? C.danger
                  : alert.severity === 'warning' ? C.warm : C.accent
                return (
                  <div key={i} style={{
                    padding: '4px 6px', marginBottom: '3px', borderRadius: '4px',
                    background: alert.severity === 'error' ? C.dangerMuted
                      : alert.severity === 'warning' ? C.warmMuted : C.accentMuted,
                    fontSize: '10.5px', color,
                  }}>
                    <span style={{ fontWeight: 600 }}>{alert.code}: </span>
                    {alert.message}
                  </div>
                )
              })}
            </div>
          )}

          {/* Component rationale */}
          {Object.keys(spec.rationale).length > 0 && (
            <div>
              <div style={{
                color: C.textSecondary, fontSize: '9px', textTransform: 'uppercase' as const,
                letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
              }}>Component Reasoning</div>
              {Object.entries(spec.rationale).map(([componentId, reason]) => (
                <div key={componentId} style={{
                  padding: '4px 0', borderBottom: `1px solid ${C.borderSubtle}`,
                }}>
                  <div style={{ color: C.text, fontSize: '10.5px', fontWeight: 600 }}>
                    {componentId}
                  </div>
                  <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '1px' }}>
                    {reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
