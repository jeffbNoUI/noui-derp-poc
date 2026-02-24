/**
 * Side-by-side case comparison — two-column layout comparing demo cases.
 * Default: Case 1 (Tier 1) vs Case 3 (Tier 3) to highlight tier differences.
 * Consumed by: router.tsx (at /staff/compare)
 * Depends on: useMember, useEligibility, useBenefitCalculation, useServiceCredit,
 *   DEMO_CASES, DEFAULT_RETIREMENT_DATES, ComparisonField, theme (C, tierMeta, fmt)
 */
import { useState } from 'react'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEMO_CASES, DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation } from '@/hooks/useCalculations'
import { ComparisonField } from './ComparisonField'

function useCaseData(memberId: string) {
  const retDate = DEFAULT_RETIREMENT_DATES[memberId] || ''
  const member = useMember(memberId)
  const sc = useServiceCredit(memberId)
  const elig = useEligibility(memberId, retDate)
  const ben = useBenefitCalculation(memberId, retDate)
  return { member: member.data, sc: sc.data, elig: elig.data, ben: ben.data }
}

function deltaOf(a: number | undefined, b: number | undefined): 'higher' | 'lower' | 'same' {
  if (a == null || b == null) return 'same'
  if (a > b) return 'higher'
  if (a < b) return 'lower'
  return 'same'
}

export function ComparisonView() {
  const [leftId, setLeftId] = useState('10001')
  const [rightId, setRightId] = useState('10003')

  const left = useCaseData(leftId)
  const right = useCaseData(rightId)

  const CaseSelector = ({ value, onChange, side }: {
    value: string; onChange: (id: string) => void; side: string
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        color: C.textDim, fontSize: '9px', fontWeight: 600,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
        marginBottom: '4px',
      }}>{side}</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
        {DEMO_CASES.map(c => {
          const t = tierMeta[c.tier]
          const active = c.id === value
          return (
            <button key={c.id} onClick={() => onChange(c.id)} style={{
              padding: '4px 10px', borderRadius: '5px', fontSize: '10px',
              border: `1px solid ${active ? t.color : C.border}`,
              background: active ? t.muted : 'transparent',
              color: active ? t.color : C.textMuted,
              cursor: 'pointer', fontWeight: active ? 600 : 400,
            }}>
              {c.name.split(' ')[0]}{'suffix' in c ? c.suffix : ''}
            </button>
          )
        })}
      </div>
    </div>
  )

  const lm = left.member; const rm = right.member
  const le = left.elig; const re = right.elig
  const lb = left.ben; const rb = right.ben
  const ls = left.sc; const rs = right.sc

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: '16px 20px',
      maxWidth: '900px', margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '16px' }}>{'\u2194\uFE0F'}</span>
        <span style={{ color: C.text, fontWeight: 700, fontSize: '15px' }}>Case Comparison</span>
        <span style={{ color: C.textMuted, fontSize: '11px' }}>
          Side-by-side tier and benefit differences
        </span>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <CaseSelector value={leftId} onChange={setLeftId} side="Left Case" />
        <CaseSelector value={rightId} onChange={setRightId} side="Right Case" />
      </div>

      {/* Headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '35% 1fr 24px 1fr',
        gap: '6px', padding: '6px 0', marginBottom: '4px',
        borderBottom: `2px solid ${C.border}`,
      }}>
        <span />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '12px' }}>
            {lm ? `${lm.first_name} ${lm.last_name}` : 'Loading...'}
          </span>
          {lm && <Badge text={`T${lm.tier}`} bg={tierMeta[lm.tier].muted} color={tierMeta[lm.tier].color} />}
        </div>
        <span />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '12px' }}>
            {rm ? `${rm.first_name} ${rm.last_name}` : 'Loading...'}
          </span>
          {rm && <Badge text={`T${rm.tier}`} bg={tierMeta[rm.tier].muted} color={tierMeta[rm.tier].color} />}
        </div>
      </div>

      {/* Fields */}
      <ComparisonField
        label="Tier"
        left={lm ? `Tier ${lm.tier}` : '\u2014'}
        right={rm ? `Tier ${rm.tier}` : '\u2014'}
        deltaType="text"
      />
      <ComparisonField
        label="Service Years"
        left={ls ? `${ls.total_service_years}y` : '\u2014'}
        right={rs ? `${rs.total_service_years}y` : '\u2014'}
        deltaType={deltaOf(ls?.total_service_years, rs?.total_service_years)}
      />
      <ComparisonField
        label="Age at Retirement"
        left={le ? String(le.age_at_retirement) : '\u2014'}
        right={re ? String(re.age_at_retirement) : '\u2014'}
        deltaType={deltaOf(le?.age_at_retirement, re?.age_at_retirement)}
      />
      <ComparisonField
        label="Retirement Type"
        left={le?.retirement_type?.replace(/_/g, ' ') ?? '\u2014'}
        right={re?.retirement_type?.replace(/_/g, ' ') ?? '\u2014'}
        deltaType="text"
      />
      <ComparisonField
        label="Reduction Factor"
        left={le ? `${Math.round((1 - le.reduction_factor) * 100)}%` : '\u2014'}
        right={re ? `${Math.round((1 - re.reduction_factor) * 100)}%` : '\u2014'}
        deltaType={deltaOf(re?.reduction_factor, le?.reduction_factor)}
      />
      <ComparisonField
        label="AMS"
        left={fmt(lb?.ams)}
        right={fmt(rb?.ams)}
        deltaType={deltaOf(lb?.ams, rb?.ams)}
      />
      <ComparisonField
        label="Multiplier"
        left={lb ? `${lb.multiplier}%` : '\u2014'}
        right={rb ? `${rb.multiplier}%` : '\u2014'}
        deltaType={deltaOf(lb?.multiplier, rb?.multiplier)}
      />
      <ComparisonField
        label="Gross Benefit"
        left={fmt(lb?.gross_monthly_benefit)}
        right={fmt(rb?.gross_monthly_benefit)}
        deltaType={deltaOf(lb?.gross_monthly_benefit, rb?.gross_monthly_benefit)}
      />
      <ComparisonField
        label="Net Monthly Benefit"
        left={fmt(lb?.net_monthly_benefit)}
        right={fmt(rb?.net_monthly_benefit)}
        deltaType={deltaOf(lb?.net_monthly_benefit, rb?.net_monthly_benefit)}
      />
      <ComparisonField
        label="Death Benefit"
        left={fmt(lb?.death_benefit?.amount)}
        right={fmt(rb?.death_benefit?.amount)}
        deltaType={deltaOf(lb?.death_benefit?.amount, rb?.death_benefit?.amount)}
      />

      <div style={{
        marginTop: '16px', padding: '10px', borderRadius: '8px',
        background: C.elevated, fontSize: '10.5px', color: C.textSecondary,
        lineHeight: '1.5',
      }}>
        The rules engine calculated these values using certified plan provisions.
        Differences reflect tier-specific multipliers, AMS windows, and reduction rates
        as defined in the Revised Municipal Code.
      </div>
    </div>
  )
}
