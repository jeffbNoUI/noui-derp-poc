/**
 * Guided mode Stage 0 — Application Intake.
 * Document completeness gate: confirms notarized application, required documents,
 * and application timeline before proceeding to member verification.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps (applicationIntake field), theme (C), Badge
 */
import type { StageProps } from './StageProps'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { formatDate } from '@/lib/utils'

function TimelineRow({ label, value, detail, ok }: {
  label: string; value: string; detail?: string; ok?: boolean
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <span style={{ color: C.textSecondary, fontSize: '12px' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {detail && (
          <span style={{ color: C.textMuted, fontSize: '10px' }}>{detail}</span>
        )}
        <span style={{ color: C.text, fontWeight: 600, fontFamily: "'SF Mono',monospace", fontSize: '12px' }}>
          {value}
        </span>
        {ok !== undefined && (
          <span style={{ color: ok ? C.success : C.danger, fontSize: '12px' }}>
            {ok ? '\u2713' : '\u2717'}
          </span>
        )}
      </span>
    </div>
  )
}

export function Stage0ApplicationIntake({ applicationIntake: intake }: StageProps) {
  if (!intake) {
    return (
      <div style={{ color: C.textMuted, fontSize: '12px', padding: '20px 0' }}>
        Loading intake data...
      </div>
    )
  }

  const requiredDocs = intake.documents.filter(d => d.required)
  const receivedDocs = requiredDocs.filter(d => d.status === 'RECEIVED')

  return (
    <div>
      {/* Timeline card */}
      <div style={{
        padding: '12px', background: C.elevated, borderRadius: '8px',
        border: `1px solid ${C.border}`, marginBottom: '12px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1px', fontWeight: 600, marginBottom: '6px',
        }}>Application Timeline</div>

        <TimelineRow
          label="Application Received"
          value={formatDate(intake.application_received_date)}
          detail={`${intake.days_before_last_day} days before last day`}
          ok={intake.deadline_met}
        />
        <TimelineRow
          label="Last Day Worked"
          value={formatDate(intake.last_day_worked)}
        />
        <TimelineRow
          label="Retirement Effective"
          value={formatDate(intake.retirement_effective_date)}
        />
        <TimelineRow
          label="Notarization"
          value={intake.notarization_date ? formatDate(intake.notarization_date) : 'Pending'}
          detail={intake.notarization_confirmed ? 'Confirmed' : 'Not confirmed'}
          ok={intake.notarization_confirmed}
        />
        <TimelineRow
          label="Payment Cutoff"
          value={formatDate(intake.cutoff_date)}
          detail={`First payment ${formatDate(intake.first_payment_date)}`}
          ok={intake.payment_cutoff_met}
        />
      </div>

      {/* Document checklist */}
      <div style={{
        padding: '12px', background: C.elevated, borderRadius: '8px',
        border: `1px solid ${C.border}`, marginBottom: '12px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1px', fontWeight: 600, marginBottom: '6px',
        }}>Document Checklist</div>

        <div style={{ fontSize: '11px' }}>
          {intake.documents.map((doc) => (
            <div key={doc.doc_type} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ color: C.text, fontSize: '12px' }}>{doc.doc_name}</span>
                {doc.conditional_on && (
                  <div style={{ marginTop: '1px' }}>
                    <Badge text={doc.conditional_on} bg={C.accentMuted} color={C.accent} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Badge
                  text={doc.required ? 'Required' : 'Optional'}
                  bg={doc.required ? C.dangerMuted : C.surface}
                  color={doc.required ? C.danger : C.textMuted}
                />
                <Badge
                  text={doc.status === 'RECEIVED' ? 'Received' : doc.status}
                  bg={doc.status === 'RECEIVED' ? C.successMuted : C.dangerMuted}
                  color={doc.status === 'RECEIVED' ? C.success : C.danger}
                />
                {doc.received_date && (
                  <span style={{
                    color: C.textMuted, fontFamily: "'SF Mono',monospace", fontSize: '10px',
                  }}>{formatDate(doc.received_date)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package status callout */}
      <div style={{
        padding: '8px 10px', borderRadius: '6px',
        background: intake.package_complete ? C.successMuted : C.dangerMuted,
        border: `1px solid ${intake.package_complete ? C.successBorder : C.dangerBorder}`,
      }}>
        <div style={{
          color: intake.package_complete ? C.success : C.danger,
          fontSize: '10.5px', fontWeight: 600, marginBottom: '2px',
        }}>
          {intake.package_complete ? 'Package Complete' : 'Package Incomplete'}
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          {intake.package_complete
            ? `All ${receivedDocs.length} required documents received${intake.complete_package_date ? ` as of ${formatDate(intake.complete_package_date)}` : ''}.`
            : `${receivedDocs.length} of ${requiredDocs.length} required documents received. Outstanding items must be collected before proceeding.`}
        </div>
      </div>
    </div>
  )
}
