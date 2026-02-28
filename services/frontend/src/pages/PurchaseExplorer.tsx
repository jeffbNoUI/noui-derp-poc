/**
 * Purchase Explorer workspace — models service credit purchases for active members.
 * Shows eligibility, actuarial cost, payment options, benefit impact, and the
 * CRITICAL exclusion of purchased service from Rule of 75/85 and IPR.
 *
 * Consumed by: App.tsx (rendered for Case 11 Lisa Chen)
 * Depends on: demo-data.ts (case11PurchaseQuote), purchase-calculator.ts,
 *   PurchaseCostSection.tsx, PurchaseImpactSection.tsx, PurchaseSidebar.tsx,
 *   theme.ts (C, tierMeta)
 */
import { useState, useEffect } from 'react'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility } from '@/hooks/useCalculations'
import type { ServicePurchaseQuote } from '@/types/Member'
import { api } from '@/api/client'
import { C, tierMeta } from '@/theme'
import { PurchaseCostSection } from './PurchaseCostSection'
import { PurchaseImpactSection } from './PurchaseImpactSection'
import { PurchaseSidebar } from './PurchaseSidebar'

// ─── Micro Components (same pattern as BenefitWorkspace) ─────────────────

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const,
      lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}

function Field({ label, value, highlight, badge, sub }: {
  label: string; value: string; highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null; sub?: string | null
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ color: C.textSecondary, fontSize: '12px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {badge && <Badge {...badge} />}
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '12px',
          textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
        }}>{value}</span>
      </span>
    </div>
  )
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 0', marginTop: '8px',
      borderBottom: `1px solid ${C.border}`, marginBottom: '8px',
    }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>{title}</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function PurchaseExplorer({ memberId }: { memberId: string }) {
  const member = useMember(memberId)
  const serviceCredit = useServiceCredit(memberId)
  const eligibility = useEligibility(memberId, '2026-02-15')
  const [quote, setQuote] = useState<ServicePurchaseQuote | null>(null)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    api.getPurchaseQuote(memberId)
      .then(setQuote)
      .catch((err: Error) => setQuoteError(err.message))
  }, [memberId])

  const m = member.data
  const sc = serviceCredit.data
  const elig = eligibility.data

  if (!m || !quote) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: '12px' }}>
          {quoteError || 'Loading purchase quote...'}
        </div>
      </div>
    )
  }

  const tc = tierMeta[m.tier] || tierMeta[1]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
      {/* Member Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: `linear-gradient(135deg,${C.surface},${C.elevated})`,
        borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' as const, gap: '6px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '7px', background: tc.muted,
            border: `2px solid ${tc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: tc.color, fontSize: '10px',
          }}>T{m.tier}</div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: '13.5px' }}>{m.first_name} {m.last_name}</div>
            <div style={{ color: C.textSecondary, fontSize: '10px' }}>
              {m.member_id} · Age {quote.member_age} · {sc?.earned_service_years ?? '—'}y earned · {m.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          <Badge text="Purchase Explorer" bg={C.warmMuted} color={C.warm} />
          <Badge text={`${tc.label}`} bg={tc.muted} color={tc.color} />
          <Badge text={`${quote.years_requested}y ${quote.service_type}`} bg={C.accentMuted} color={C.accent} />
        </div>
      </div>

      {/* Content: scrollable panels + sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* PANELS (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px 60px' }}>
          <SectionHeader title="Purchase Eligibility" icon="&#9989;" />
          <Field label="Member Status" value={m.status}
            badge={{ text: 'Active', bg: C.successMuted, color: C.success }} />
          <Field label="Vested" value={`Yes — ${sc?.earned_service_years ?? 0}y earned`}
            badge={{ text: 'Met', bg: C.successMuted, color: C.success }}
            sub="5+ years required — RMC §18-403" />
          <Field label="Service Type" value={quote.service_type}
            badge={{ text: 'Valid', bg: C.successMuted, color: C.success }}
            sub="RMC §18-415(b)(1)" />
          <Field label="Years Requested" value={`${quote.years_requested.toFixed(1)} of 5.0 max`} />
          <Field label="Purchase Eligible" value="Yes" highlight
            badge={{ text: 'Eligible', bg: C.successMuted, color: C.success }} />

          <SectionHeader title="Prior Employment" icon="&#128188;" />
          <Field label="Prior Employer" value={quote.prior_employer} />
          <Field label="Employment Period" value={`${quote.prior_employment_start} — ${quote.prior_employment_end}`} />
          <Field label="Years Being Purchased" value={`${quote.years_requested.toFixed(1)} years`} highlight />
          <Field label="Documentation" value="Employer Certification"
            sub="Dates of service verification required" />

          <SectionHeader title="Cost Calculation" icon="&#128178;" />
          <PurchaseCostSection quote={quote} />

          <SectionHeader title="Benefit Impact Analysis" icon="&#128200;" />
          <PurchaseImpactSection quote={quote} />

          <SectionHeader title="Quote Validity" icon="&#128197;" />
          <Field label="Quote Date" value={quote.quote_date} />
          <Field label="Expiration" value={quote.expiration_date}
            sub="90-day validity window"
            badge={{ text: 'Valid', bg: C.successMuted, color: C.success }} />
          <Field label="Irrevocable" value="Yes, once fully paid"
            sub="Cancellation during installments; payments non-refundable — RMC §18-415(e)" />

          <SectionHeader title="Audit Trail" icon="&#128196;" />
          <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
            {quote.audit_trail.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '5px 8px',
                borderTop: i > 0 ? `1px solid ${C.borderSubtle}` : 'none', fontSize: '10.5px',
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: C.accent, fontFamily: 'monospace', fontSize: '9px' }}>{entry.rule_id}</span>
                  <span style={{ color: C.textSecondary, marginLeft: '6px' }}>{entry.description}</span>
                </div>
                <span style={{ color: C.text, fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>{entry.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <PurchaseSidebar quote={quote} sc={sc} elig={elig} tier={m.tier} />
      </div>
    </div>
  )
}
