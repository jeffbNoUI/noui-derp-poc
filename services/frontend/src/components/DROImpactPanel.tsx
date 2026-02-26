import type { DROResult } from '@/types/Member'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { FileCheck, Scale } from 'lucide-react'

interface DROImpactPanelProps {
  result: DROResult
}

export function DROImpactPanel({ result }: DROImpactPanelProps) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Domestic Relations Order (DRO) Impact</h2>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <p className="text-sm text-amber-800">
          This member has an active DRO. The benefit is divided per court order using the{' '}
          <strong>{result.division_method}</strong> method.
        </p>
        <p className="text-xs text-amber-700 mt-1">
          Alternate Payee: {result.alternate_payee_name}
        </p>
      </div>

      <div className="space-y-3">
        <DROStep
          label="Total Service Years"
          value={`${result.total_service_years.toFixed(2)} years`}
        />
        <DROStep
          label="Service During Marriage"
          value={`${result.marital_service_years.toFixed(2)} years`}
        />
        <DROStep
          label="Marital Fraction"
          detail={`${result.marital_service_years.toFixed(2)} / ${result.total_service_years.toFixed(2)}`}
          value={formatPercent(result.marital_fraction)}
        />

        <div className="border-t border-border pt-3">
          <DROStep
            label="Member Gross Benefit"
            value={formatCurrency(result.member_gross_benefit)}
          />
          <DROStep
            label="Marital Share"
            detail={`Gross x Marital Fraction`}
            value={formatCurrency(result.marital_share)}
          />
          <DROStep
            label="Alternate Payee Amount"
            detail={
              result.division_method === 'percentage'
                ? `Marital Share x Division %`
                : 'Fixed amount per court order'
            }
            value={formatCurrency(result.alternate_payee_amount)}
            warning
          />
        </div>

        <div className="border-t border-border pt-3">
          <DROStep
            label="Member Net After DRO"
            value={formatCurrency(result.member_net_after_dro)}
            highlight
          />
        </div>
      </div>

      {/* Audit Trail */}
      {result.audit_trail && result.audit_trail.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-gray-900">DRO Calculation Audit Trail</h3>
          </div>
          <div className="space-y-1 text-xs">
            {result.audit_trail.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted font-mono shrink-0">{entry.rule_id}</span>
                <span className="text-gray-600">{entry.description}</span>
                <span className="font-semibold ml-auto shrink-0">{entry.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DROStep({
  label,
  detail,
  value,
  highlight,
  warning,
}: {
  label: string
  detail?: string
  value: string
  highlight?: boolean
  warning?: boolean
}) {
  return (
    <div className="flex items-start justify-between py-1">
      <div>
        <p className={`text-sm ${highlight ? 'text-primary font-semibold' : warning ? 'text-warning font-medium' : 'text-gray-900'}`}>
          {label}
        </p>
        {detail && <p className="text-xs text-muted">{detail}</p>}
      </div>
      <p className={`text-sm font-mono ${highlight ? 'text-primary font-bold text-lg' : warning ? 'text-warning font-semibold' : 'font-semibold'}`}>
        {value}
      </p>
    </div>
  )
}
