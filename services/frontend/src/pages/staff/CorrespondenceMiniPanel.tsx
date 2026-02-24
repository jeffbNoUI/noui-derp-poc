/**
 * Compact correspondence composer panel for the utility rail — dark theme.
 * Template selector with member-specific variable interpolation and preview.
 * Consumed by: UtilityRail.tsx
 * Depends on: correspondence-templates.ts, theme (C, fmt), Member/BenefitResult types
 */
import { useState, useMemo } from 'react'
import { C, fmt } from '@/theme'
import {
  CORRESPONDENCE_TEMPLATES, interpolateTemplate,
} from '@/lib/correspondence-templates'
import type { CorrespondenceTemplate } from '@/lib/correspondence-templates'
import type { Member, EligibilityResult, BenefitResult } from '@/types/Member'

interface CorrespondenceMiniPanelProps {
  memberId: string
  member?: Member
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  retirementDate?: string
  electedOption?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  approval: 'Approval',
  request: 'Request',
  notice: 'Notice',
  acknowledgment: 'Acknowledgment',
}

const CATEGORY_COLORS: Record<string, string> = {
  approval: C.success,
  request: C.warm,
  notice: C.accent,
  acknowledgment: C.textMuted,
}

export function CorrespondenceMiniPanel({
  member, eligibility, benefit, retirementDate, electedOption,
}: CorrespondenceMiniPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = CORRESPONDENCE_TEMPLATES.find(t => t.id === selectedId)

  // Auto-build variable values from member data
  const variables: Record<string, string> = useMemo(() => {
    if (!member) return {} as Record<string, string>
    const retType = eligibility?.retirement_type ?? ''
    const typeLabel = retType === 'rule_of_75' ? 'Rule of 75'
      : retType === 'rule_of_85' ? 'Rule of 85'
      : retType === 'early' ? 'Early Retirement'
      : retType === 'normal' ? 'Normal' : retType
    const reductionPct = eligibility ? Math.round((1 - eligibility.reduction_factor) * 100) : 0
    const yearsUnder = eligibility ? 65 - eligibility.age_at_retirement : 0

    return {
      member_name: `${member.first_name} ${member.last_name}`,
      retirement_type: typeLabel,
      retirement_date: retirementDate ?? '',
      last_day_worked: retirementDate ?? '',
      benefit_amount: benefit ? fmt(benefit.net_monthly_benefit) : 'TBD',
      payment_option: electedOption ?? 'TBD',
      reduction_percent: `${reductionPct}%`,
      years_under_65: `${yearsUnder}`,
      unreduced_amount: benefit ? fmt(benefit.gross_monthly_benefit) : 'TBD',
      reduced_amount: benefit ? fmt(benefit.net_monthly_benefit) : 'TBD',
      received_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      missing_items: '- [Document list to be specified]',
      alternate_payee: '[Alternate payee name]',
      marital_fraction: '[Fraction]',
      award_percentage: '[Percentage]',
      member_net_benefit: benefit ? fmt(benefit.net_monthly_benefit) : 'TBD',
      alternate_benefit: '[Amount]',
    }
  }, [member, eligibility, benefit, retirementDate, electedOption])

  const preview = selected ? interpolateTemplate(selected, variables) : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      {/* Template list or preview */}
      {!selected ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
          <div style={{
            fontSize: '9px', color: C.textDim, fontWeight: 600,
            textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px',
          }}>Letter Templates</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {CORRESPONDENCE_TEMPLATES.map(t => (
              <TemplateCard key={t.id} template={t} onSelect={() => setSelectedId(t.id)} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Back + template title */}
          <div style={{
            padding: '8px 10px', borderBottom: `1px solid ${C.borderSubtle}`,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <button onClick={() => setSelectedId(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.accent, fontSize: '11px', padding: '2px 4px',
            }}>{'\u2190'} Back</button>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: C.text }}>
              {selected.title}
            </span>
          </div>

          {/* Variable status */}
          <div style={{ padding: '6px 10px', borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{
              fontSize: '8px', color: C.textDim, fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '4px',
            }}>Variables ({selected.variables.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '3px' }}>
              {selected.variables.map(v => {
                const filled = variables[v] && !variables[v].startsWith('[') && variables[v] !== 'TBD'
                return (
                  <span key={v} style={{
                    fontSize: '8px', padding: '1px 5px', borderRadius: '3px',
                    background: filled ? C.successMuted : C.warmMuted,
                    color: filled ? C.success : C.warm,
                    border: `1px solid ${filled ? C.successBorder : C.warmBorder}`,
                    fontWeight: 600,
                  }}>{v.replace(/_/g, ' ')}</span>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            <div style={{
              background: C.surface, borderRadius: '6px', border: `1px solid ${C.borderSubtle}`,
              padding: '12px', fontSize: '10px', lineHeight: 1.6, color: C.text,
              whiteSpace: 'pre-wrap' as const, fontFamily: "'SF Mono',monospace",
            }}>
              {preview}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            padding: '8px 10px', borderTop: `1px solid ${C.borderSubtle}`,
            display: 'flex', gap: '6px',
          }}>
            <button style={{
              flex: 1, padding: '6px', borderRadius: '5px',
              background: C.accent, border: 'none', color: '#fff',
              fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            }}>Copy to Clipboard</button>
            <button style={{
              padding: '6px 10px', borderRadius: '5px',
              background: 'none', border: `1px solid ${C.border}`,
              color: C.textMuted, fontSize: '10px', cursor: 'pointer',
            }}>Print</button>
          </div>
        </>
      )}
    </div>
  )
}

function TemplateCard({ template, onSelect }: { template: CorrespondenceTemplate; onSelect: () => void }) {
  const catColor = CATEGORY_COLORS[template.category] ?? C.textMuted
  return (
    <div
      onClick={onSelect}
      style={{
        background: C.surface, border: `1px solid ${C.borderSubtle}`, borderRadius: '6px',
        padding: '8px 10px', cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.accent }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderSubtle }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <span style={{
          fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
          color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30`,
          textTransform: 'uppercase' as const, letterSpacing: '0.3px',
        }}>{CATEGORY_LABELS[template.category]}</span>
        <span style={{ fontSize: '10.5px', fontWeight: 600, color: C.text }}>
          {template.title}
        </span>
      </div>
      <div style={{ fontSize: '9px', color: C.textMuted, lineHeight: 1.3 }}>
        {template.description}
      </div>
      <div style={{ fontSize: '8px', color: C.textDim, marginTop: '3px' }}>
        {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''} {'\u00B7'} Auto-filled from case data
      </div>
    </div>
  )
}
