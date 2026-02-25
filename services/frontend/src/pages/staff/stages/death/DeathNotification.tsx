/**
 * Death processing Stage 1 — Death Notification.
 * Displays the initial death notification, contact information,
 * benefit suspension status, and death certificate verification.
 * Language is compassionate and professional throughout.
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C), Field
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'

export function DeathNotification({ member: m, deathRecord: dr, processingSummary: ps }: DeathStageProps) {
  if (!dr) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>No death record available.</div>
  }

  const notif = ps?.notification

  return (
    <div>
      {/* Compassionate header */}
      <div style={{
        padding: '10px 12px', marginBottom: '10px', borderRadius: '6px',
        background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
          Processing Guidance
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.5' }}>
          Handle all communications with sensitivity and compassion.
          Verify information carefully before proceeding with benefit changes.
        </div>
      </div>

      {/* Notification Details */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Death Notification
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <Field label="Member" value={`${m.first_name} ${m.last_name}`}
          sub={`ID: ${m.member_id}`} />
        <Field label="Date of Death" value={dr.death_date}
          badge={{ text: dr.status, bg: dr.status === 'VERIFIED' ? C.successMuted : C.warmMuted, color: dr.status === 'VERIFIED' ? C.success : C.warm }} />
        <Field label="Notification Date" value={dr.notification_date} />
        <Field label="Notification Source" value={dr.notification_source}
          sub={dr.notification_contact ? `Contact: ${dr.notification_contact}` : undefined} />
        <Field label="Previous Status" value={dr.previous_member_status === 'R' ? 'Retired' : dr.previous_member_status === 'A' ? 'Active' : dr.previous_member_status}
          badge={{ text: notif?.status_transition ?? '', bg: C.warmMuted, color: C.warm }} />
      </div>

      {/* Benefit Suspension */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Benefit Suspension
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <Field label="Suspended" value={notif?.benefit_suspended ? 'Yes' : 'No'}
          badge={notif?.benefit_suspended
            ? { text: 'Immediate', bg: C.dangerMuted, color: C.danger }
            : undefined} />
        {dr.suspend_date && <Field label="Suspend Date" value={dr.suspend_date} />}
        {dr.final_payment_date && <Field label="Final Payment Date" value={dr.final_payment_date}
          sub="Last benefit payment deposited before suspension" />}
      </div>

      {/* Death Certificate */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Death Certificate Verification
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`,
      }}>
        <Field label="Certificate Required" value={notif?.certificate_required ? 'Yes' : 'No'} />
        {dr.certificate_received_date
          ? (
            <>
              <Field label="Received" value={dr.certificate_received_date}
                badge={{ text: 'Received', bg: C.successMuted, color: C.success }} />
              {dr.certificate_verified_date && (
                <Field label="Verified" value={dr.certificate_verified_date}
                  sub={dr.certificate_verified_by ? `By: ${dr.certificate_verified_by}` : undefined}
                  badge={{ text: 'Verified', bg: C.successMuted, color: C.success }} />
              )}
            </>
          )
          : (
            <div style={{
              marginTop: '6px', padding: '8px 10px', background: C.warmMuted,
              borderRadius: '6px', border: `1px solid ${C.warmBorder}`,
            }}>
              <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                Awaiting Death Certificate
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
                Processing cannot be completed until a certified death certificate is received and verified.
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
