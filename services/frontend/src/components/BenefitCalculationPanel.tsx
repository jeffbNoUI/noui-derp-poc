import { useState } from 'react'
import type { BenefitResult } from '@/types/Member'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Calculator, ChevronDown, ChevronRight, Printer } from 'lucide-react'
import { CalculationTrace } from './CalculationTrace'

interface BenefitCalculationPanelProps {
  result: BenefitResult
}

export function BenefitCalculationPanel({ result }: BenefitCalculationPanelProps) {
  const isReduced = result.reduction_factor < 1.0
  const [showTrace, setShowTrace] = useState(false)

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 calculation-panel animate-fadeIn" data-print="calc-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Benefit Calculation</h2>
        </div>
        {/* Print worksheet button — hidden in print output */}
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/30 rounded-md transition-colors"
          title="Print calculation worksheet"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>

      {/* Formula Display */}
      <div className="p-4 bg-gray-50 border border-border rounded-lg font-mono text-sm mb-4 formula" data-print="formula">
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
                detail={`${result.retirement_type} \u2014 factor: ${result.reduction_factor.toFixed(4)}`}
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
            detail={`No reduction applied \u2014 ${result.retirement_type}`}
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
            <span className="font-mono" data-monetary>{formatCurrency(result.ipr.rate_per_year)}/yr</span>
            <span className="text-muted">Eligible service years</span>
            <span className="font-mono">{result.ipr.eligible_service_years.toFixed(2)}</span>
            <span className="text-muted">Medicare eligible</span>
            <span>{result.ipr.medicare_eligible ? 'Yes ($6.25/yr)' : 'No ($12.50/yr)'}</span>
            <span className="text-muted">Annual IPR</span>
            <span className="font-mono font-semibold" data-monetary>{formatCurrency(result.ipr.annual_amount)}</span>
            <span className="text-muted">Monthly IPR</span>
            <span className="font-mono font-semibold" data-monetary>{formatCurrency(result.ipr.monthly_amount)}</span>
          </div>
        </div>
      )}

      {/* Death Benefit */}
      {result.death_benefit && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Death Benefit</h3>
          <p className="text-sm">
            <span className="text-muted">Lump sum: </span>
            <span className="font-mono font-semibold" data-monetary>
              {formatCurrency(result.death_benefit.amount)}
            </span>
            <span className="text-xs text-muted ml-2">
              ({result.death_benefit.retirement_type})
            </span>
          </p>
        </div>
      )}

      {/* Calculation Trace — expandable */}
      {result.audit_trail && result.audit_trail.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border audit-trail" data-print="audit">
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-2 no-print"
          >
            {showTrace
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
            {showTrace ? 'Hide' : 'Show'} Calculation Trace
          </button>
          {showTrace && (
            <CalculationTrace
              entries={result.audit_trail}
              title="Benefit Calculation Trace"
              assumptions={[
                '[Q-CALC-01] Banker\'s rounding (round half to even) on final amounts only',
                '[Q-CALC-04] J&S factors are illustrative placeholders pending actuarial tables',
              ]}
            />
          )}
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
      <p className={`text-sm font-mono ${highlight ? 'text-primary font-bold text-lg' : warning ? 'text-warning font-semibold' : 'font-semibold'}`} data-monetary>
        {value}
      </p>
    </div>
  )
}
