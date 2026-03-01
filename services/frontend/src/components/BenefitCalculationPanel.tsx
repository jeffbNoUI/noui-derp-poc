/**
 * Benefit calculation panel — shows formula, step-by-step calc, annual increase, death benefit.
 * Consumed by: BenefitWorkspace, guided Stage4
 * Depends on: BenefitResult type, formatCurrency/formatPercent utils, CalculationTrace
 */
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
        <p className="text-muted text-xs mb-2 font-sans">
          Formula ({result.has_table_name} · {result.division} Division):
        </p>
        <p>{result.formula_display}</p>
      </div>

      {/* Anti-spiking notice */}
      {result.anti_spiking_applied && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
          <strong>Anti-spiking applied.</strong> Salary capped at 108% of prior year per C.R.S. §24-51-101(25.5).
          {result.anti_spiking_detail && result.anti_spiking_detail.length > 0 && (
            <div className="mt-2 text-xs">
              {result.anti_spiking_detail.filter(d => d.cap_applied).map((d, i) => (
                <div key={i}>
                  Year {d.year}: actual ${d.actual_pay.toLocaleString()} → capped ${d.used_pay.toLocaleString()} (108% cap: ${d.cap_amount.toLocaleString()})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step-by-step calculation */}
      <div className="space-y-3">
        <CalcStep
          label="Highest Average Salary (HAS)"
          detail={`Highest ${result.ams_window_months} consecutive months`}
          value={formatCurrency(result.ams)}
        />
        <CalcStep
          label="Multiplier"
          detail="2.5% — all COPERA divisions (C.R.S. §24-51-603)"
          value={formatPercent(result.multiplier)}
        />
        <CalcStep
          label="Service Years (for benefit)"
          detail="Earned + purchased service"
          value={`${result.service_years_for_benefit.toFixed(2)} years`}
        />
        <CalcStep
          label="Gross Monthly Benefit"
          detail={`HAS x ${formatPercent(result.multiplier)} x ${result.service_years_for_benefit.toFixed(2)}`}
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

      {/* Annual Increase (C.R.S. §24-51-1001) */}
      {result.annual_increase && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Annual Increase (C.R.S. §24-51-1001)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted">Rate</span>
            <span className="font-mono">{(result.annual_increase.rate * 100).toFixed(1)}% compound</span>
            <span className="text-muted">First eligible</span>
            <span className="font-mono">{result.annual_increase.first_eligible_date}</span>
            <span className="text-muted">Method</span>
            <span>{result.annual_increase.compound_method}</span>
          </div>
          <p className="text-xs text-muted mt-2 italic">{result.annual_increase.note}</p>
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
