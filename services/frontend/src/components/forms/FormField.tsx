/**
 * Field type dispatcher — renders the correct form field component based on field.type.
 * Consumed by: FormWizard
 * Depends on: all Form* field components, FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'
import { FormText } from './FormText'
import { FormDisplay } from './FormDisplay'
import { FormDate } from './FormDate'
import { FormPhone } from './FormPhone'
import { FormEmail } from './FormEmail'
import { FormAddress } from './FormAddress'
import { FormSSN } from './FormSSN'
import { FormRadio } from './FormRadio'
import { FormCheckbox } from './FormCheckbox'
import { FormSelect } from './FormSelect'
import { FormTextarea } from './FormTextarea'
import { FormFileUpload } from './FormFileUpload'
import { FormCurrency } from './FormCurrency'
import { FormESign } from './FormESign'
import { FormRepeatingGroup } from './FormRepeatingGroup'
import { FormSectionHeader } from './FormSectionHeader'
import { FormInfoBlock } from './FormInfoBlock'

interface Props {
  field: FormFieldDef
  value: unknown
  onChange: (key: string, val: unknown) => void
  T: PortalTheme
  readOnly?: boolean
}

export function FormField({ field, value, onChange, T, readOnly }: Props) {
  const p = { field, value, onChange, T, readOnly }
  switch (field.type) {
    case 'text': return <FormText {...p} />
    case 'display': return <FormDisplay field={field} value={value} onChange={onChange} T={T} />
    case 'date': return <FormDate {...p} />
    case 'phone': return <FormPhone {...p} />
    case 'email': return <FormEmail {...p} />
    case 'address': return <FormAddress {...p} />
    case 'ssn': return <FormSSN field={field} value={value} onChange={onChange} T={T} />
    case 'radio': return <FormRadio {...p} />
    case 'checkbox': return <FormCheckbox {...p} />
    case 'select': return <FormSelect {...p} />
    case 'textarea': return <FormTextarea {...p} />
    case 'file_upload': return <FormFileUpload {...p} />
    case 'currency': return <FormCurrency {...p} />
    case 'esign': return <FormESign {...p} />
    case 'repeating_group': return <FormRepeatingGroup {...p} />
    case 'section_header': return <FormSectionHeader field={field} T={T} />
    case 'info_block': return <FormInfoBlock field={field} T={T} />
    default: return <div style={{ fontSize: 11, color: T.text.muted }}>Unknown field type: {field.type}</div>
  }
}
