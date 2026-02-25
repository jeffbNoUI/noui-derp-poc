/**
 * Death processing Stage 2 — Survivor Determination.
 * Displays survivor/beneficiary identification, relationship, claim type,
 * and eligibility for benefits. For retired members with J&S elections,
 * shows the J&S percentage. For active members, shows vesting status.
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C), Field
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'
// Badge colors are passed as props to Field component's badge parameter

export function SurvivorDetermination({ member: m, survivorClaims, activeMemberDeath }: DeathStageProps) {
  if (!survivorClaims || survivorClaims.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>No survivor claims filed.</div>
  }

  return (
    <div>
      {survivorClaims.map((claim, i) => (
        <div key={claim.claim_id}>
          {/* Survivor identity */}
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            {survivorClaims.length > 1 ? `Survivor ${i + 1}` : 'Survivor / Beneficiary'}
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Name" value={`${claim.survivor_first_name} ${claim.survivor_last_name}`} />
            <Field label="Relationship" value={claim.survivor_relationship}
              badge={{ text: claim.survivor_relationship, bg: C.accentMuted, color: C.accent }} />
            {claim.survivor_date_of_birth && (
              <Field label="Date of Birth" value={claim.survivor_date_of_birth} />
            )}
            <Field label="Claim Type" value={claimTypeLabel(claim.claim_type)}
              badge={claimTypeBadge(claim.claim_type)} />
            <Field label="Status" value={claim.status}
              badge={statusBadge(claim.status)} />
            {claim.approved_date && (
              <Field label="Approved" value={claim.approved_date}
                sub={claim.approved_by ? `By: ${claim.approved_by}` : undefined} />
            )}
          </div>

          {/* Claim-type specific details */}
          {claim.claim_type === 'JS_SURVIVOR' && claim.js_percentage && (
            <div style={{
              padding: '8px 10px', marginBottom: '10px', borderRadius: '6px',
              background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
            }}>
              <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                Joint & Survivor Election
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.5' }}>
                {m.first_name} {m.last_name} elected {claim.js_percentage}% J&S at retirement.
                {' '}{claim.survivor_first_name} {claim.survivor_last_name} is entitled to
                {' '}{claim.js_percentage}% of the member's monthly benefit for the survivor's lifetime.
              </div>
            </div>
          )}

          {claim.claim_type === 'CONTRIB_REFUND' && activeMemberDeath && (
            <div style={{
              padding: '8px 10px', marginBottom: '10px', borderRadius: '6px',
              background: C.warmMuted, border: `1px solid ${C.warmBorder}`,
            }}>
              <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                Non-Vested Active Member
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.5' }}>
                {m.first_name} {m.last_name} had not met the 5-year vesting requirement.
                {' '}{claim.survivor_first_name} {claim.survivor_last_name} is entitled to a
                refund of accumulated contributions plus interest. RMC {'\u00A7'}18-411.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────

function claimTypeLabel(t: string): string {
  switch (t) {
    case 'JS_SURVIVOR': return 'J&S Survivor Benefit'
    case 'CONTRIB_REFUND': return 'Contribution Refund'
    case 'SURVIVOR_ANNUITY': return 'Survivor Annuity'
    default: return t
  }
}

function claimTypeBadge(t: string): { text: string; bg: string; color: string } {
  switch (t) {
    case 'JS_SURVIVOR': return { text: 'J&S', bg: 'rgba(34,211,238,0.10)', color: '#22D3EE' }
    case 'CONTRIB_REFUND': return { text: 'Refund', bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' }
    case 'SURVIVOR_ANNUITY': return { text: 'Annuity', bg: 'rgba(16,185,129,0.10)', color: '#10B981' }
    default: return { text: t, bg: 'rgba(100,116,139,0.10)', color: '#64748B' }
  }
}

function statusBadge(s: string): { text: string; bg: string; color: string } {
  switch (s) {
    case 'APPROVED':
    case 'ACTIVE': return { text: s, bg: 'rgba(16,185,129,0.10)', color: '#10B981' }
    case 'PENDING':
    case 'IN_REVIEW': return { text: s, bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' }
    case 'DENIED':
    case 'CLOSED': return { text: s, bg: 'rgba(239,68,68,0.10)', color: '#EF4444' }
    default: return { text: s, bg: 'rgba(100,116,139,0.10)', color: '#64748B' }
  }
}
