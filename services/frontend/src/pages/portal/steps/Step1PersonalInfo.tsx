/**
 * Wizard Step 1 — Personal Information confirmation.
 * Pre-populated member data in a 2-column grid with an "I confirm" checkbox.
 * Consumed by: ApplicationWizard
 * Depends on: StepProps (member, service data)
 */
import type { StepProps } from './StepProps'
import { formatDate } from '@/lib/utils'

export function Step1PersonalInfo({ T, draft, onUpdate, member: m, service: svc }: StepProps) {
  if (!m) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
        {[
          ['Name', `${m.first_name} ${m.last_name}`],
          ['Date of Birth', formatDate(m.date_of_birth)],
          ['Member ID', m.member_id],
          ['Department', m.department],
          ['Hire Date', formatDate(m.hire_date)],
          ['Benefit Tier', `Tier ${m.tier}`],
          ['Years of Service', svc ? `${svc.total_service_years} years` : '--'],
          ['Position', m.position],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{
              fontSize: 11, color: T.text.muted, marginBottom: 2,
              textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600,
            }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Confirmation checkbox — gates progression to step 2 */}
      <div style={{
        gridColumn: '1/-1', padding: '12px 16px', marginTop: 16,
        background: T.accent.surface, borderRadius: 8, border: `1px solid ${T.accent.light}`,
      }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.personal_confirmed}
            onChange={e => onUpdate({ personal_confirmed: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <div>
            <div style={{ fontSize: 12, color: T.accent.primary, fontWeight: 600 }}>
              I confirm this information is correct
            </div>
            <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
              If anything needs updating, contact DERP at (303) 839-5419 before submitting your application.
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}
