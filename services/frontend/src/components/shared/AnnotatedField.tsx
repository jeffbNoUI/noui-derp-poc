/**
 * AnnotatedField — wraps Field component with FieldNote for per-field annotations.
 * Stages opt in by importing AnnotatedField instead of Field.
 * Consumed by: Stage components (opt-in)
 * Depends on: Field.tsx, FieldNote.tsx
 */
import { Field } from './Field'
import { FieldNote } from './FieldNote'

export function AnnotatedField({
  memberId, stageId, label, value, sub, highlight, badge,
}: {
  memberId: string
  stageId: string
  label: string
  value: string
  sub?: string | null
  highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <Field label={label} value={value} sub={sub} highlight={highlight} badge={badge} />
      </div>
      <FieldNote memberId={memberId} stageId={stageId} fieldLabel={label} />
    </div>
  )
}
