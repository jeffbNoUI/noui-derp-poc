import type { BenefitResult } from '@/types/Member'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Calculator, FileCheck } from 'lucide-react'

interface BenefitCalculationPanelProps {
  result: BenefitResult
}

export function BenefitCalculationPanel({ result }: BenefitCalculationPanelProps) {
  const isReduced = result.reduction_factor < 1.0

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Benefit Calculation</h2>
      </div>

      {/* Formula Display */}
      <div className="p-4 bg-gray-50 border border-border rounded-lg font-mono text-sm mb-4">
        <p className="text-muted text-xs mb-2 font-sans">Formula (Tier {result.tier}):</p>
        <p>{result.formula_display}</p>
      </div>

      {/* Step-by-step calculation */}
      <div className="space-y-3">
        <CalcStep
          label="Average Monthly Salary (AMS)"
          detail={`Highest ${result.ams_window_months} consecutive months`}
          value={formatCurrency(result.ams)}
        />
        <CalcStep
          label="Multiplier"
          detail={`Tier ${result.tier} rate`}
          value={formatPercent(result.multiplier)}
        />
        <CalcStep
          label="Service Years (for benefit)"
          detail="Earned + purchased service"
          value={`${result.service_years_for_benefit.toFixed(2)} years`}
        />
        <CalcStep
          label="Gross Monthly Benefit"
          detail={`AMS x ${formatPercent(result.multiplier)} x ${result.service_years_for_benefit.toFixed(2)}`}
          value={formatCurrency(result.gross_monthly_benefit)}
          highlight
        />

        {isReduced && (
          <>
            <div className="border-t border-border pt-3">
              <CalcStep
                label="Early Retirement Reduction"
                detail={`${result.retirement_type} — factor: ${result.reduction_factor.toFixed(4)}`}
                value={formatPercent(result.reduction_factor)}
                warning
              />
            </div>
            <CalcStep
              label="Net Monthly Benefit (after reduction)"
              detail={`${formatCurrency(result.gross_monthly_benefit)} x ${result.reduction_factor.toFixed(4)}`}
              value={formatCurrency(result.net_monthly_benefit)}
              highlight
            />
          </>
        )}

        {!isReduced && (
          <CalcStep
            label="Net Monthly Benefit"
            detail={`No reduction applied — ${result.retirement_type}`}
            value={formatCurrency(result.net_monthly_benefit)}
            highlight
          />
        )}
      </div>

      {/* IPR */}
      {result.ipr && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Increase in Pension for Retirees (IPR)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted">Rate per year</span>
            <span className="font-mono">{formatCurrency(result.ipr.rate_per_year)}/yr</span>
            <span className="text-muted">Eligible service years</span>
            <span className="font-mono">{result.ipr.eligible_service_years.toFixed(2)}</span>
            <span className="text-muted">Medicare eligible</span>
            <span>{result.ipr.medicare_eligible ? 'Yes ($6.25/yr)' : 'No ($12.50/yr)'}</span>
            <span className="text-muted">Annual IPR</span>
            <span className="font-mono font-semibold">{formatCurrency(result.ipr.annual_amount)}</span>
            <span className="text-muted">Monthly IPR</span>
            <span className="font-mono font-semibold">{formatCurrency(result.ipr.monthly_amount)}</span>
          </div>
        </div>
      )}

      {/* Death Benefit */}
      {result.death_benefit && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Death Benefit</h3>
          <p className="text-sm">
            <span className="text-muted">Lump sum: </span>
            <span className="font-mono font-semibold">
              {formatCurrency(result.death_benefit.amount)}
            </span>
            <span className="text-xs text-muted ml-2">
              ({result.death_benefit.retirement_type})
            </span>
          </p>
        </div>
      )}

      {/* Audit Trail */}
      {result.audit_trail && result.audit_trail.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-gray-900">Calculation Audit Trail</h3>
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

function CalcStep({
  label,
  detail,
  value,
  highlight,
  warning,
}: {
  label: string
  detail: string
  value: string
  highlight?: boolean
  warning?: boolean
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-sm font-medium ${highlight ? 'text-primary font-semibold' : warning ? 'text-warning' : 'text-gray-900'}`}>
          {label}
        </p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      <p className={`text-sm font-mono ${highlight ? 'text-primary font-bold text-lg' : warning ? 'text-warning font-semibold' : 'font-semibold'}`}>
        {value}
      </p>
    </div>
  )
}
