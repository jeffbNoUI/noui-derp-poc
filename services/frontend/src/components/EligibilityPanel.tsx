import type { EligibilityResult } from '@/types/Member'
import { formatPercent, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, FileCheck, Shield } from 'lucide-react'

interface EligibilityPanelProps {
  result: EligibilityResult
}

export function EligibilityPanel({ result }: EligibilityPanelProps) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Eligibility Evaluation</h2>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mb-4',
          result.eligible
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        )}
      >
        {result.eligible ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        {result.eligible ? `Eligible — ${result.retirement_type}` : 'Not Eligible'}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-muted">Retirement Date</span>
          <p className="font-semibold">{formatDate(result.retirement_date)}</p>
        </div>
        <div>
          <span className="text-muted">Age at Retirement</span>
          <p className="font-semibold">{result.age_at_retirement}</p>
        </div>
        <div>
          <span className="text-muted">Tier</span>
          <p className="font-semibold">Tier {result.tier}</p>
        </div>
        <div>
          <span className="text-muted">Reduction Factor</span>
          <p className="font-semibold font-mono">{formatPercent(result.reduction_factor)}</p>
        </div>
        {result.rule_of_n_value !== undefined && (
          <>
            <div>
              <span className="text-muted">Rule of {result.rule_of_n_threshold}</span>
              <p className="font-semibold font-mono">
                {result.rule_of_n_value.toFixed(2)}
                <span className="text-xs text-muted ml-1">
                  (need {result.rule_of_n_threshold})
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Conditions */}
      {result.conditions_met.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Conditions Met
          </h3>
          <div className="space-y-1">
            {result.conditions_met.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.conditions_unmet.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Conditions Not Met
          </h3>
          <div className="space-y-1">
            {result.conditions_unmet.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {result.audit_trail && result.audit_trail.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-gray-900">Eligibility Audit Trail</h3>
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
