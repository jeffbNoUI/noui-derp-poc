import type { EligibilityResult, BenefitResult } from '@/types/Member'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingDown, Info } from 'lucide-react'

interface EarlyRetirementReductionProps {
  eligibility: EligibilityResult
  benefit: BenefitResult
}

export function EarlyRetirementReduction({ eligibility, benefit }: EarlyRetirementReductionProps) {
  if (benefit.reduction_factor >= 1.0) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-success" />
          <h2 className="text-lg font-semibold text-gray-900">Early Retirement Reduction</h2>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <strong>No reduction applied.</strong> Member qualifies for unreduced benefit
          ({eligibility.retirement_type}).
          {eligibility.rule_of_n_value !== undefined && (
            <span className="ml-1">
              Rule of {eligibility.rule_of_n_threshold}: {eligibility.rule_of_n_value.toFixed(2)} (meets threshold).
            </span>
          )}
        </div>
      </div>
    )
  }

  const tier = benefit.tier
  const reductionRate = tier === 3 ? '6%' : '3%'
  const yearsUnder65 = 65 - eligibility.age_at_retirement
  const reductionPct = (1 - benefit.reduction_factor) * 100
  const reductionAmount = benefit.gross_monthly_benefit - benefit.net_monthly_benefit

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-gray-900">Early Retirement Reduction</h2>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
        <p>
          <strong>Tier {tier} early retirement reduction applies.</strong>{' '}
          {reductionRate} per year under age 65.
        </p>
        <p className="text-xs mt-1">
          {tier <= 2
            ? 'Tiers 1 & 2: 3% per year under 65 (RMC §18-410)'
            : 'Tier 3: 6% per year under 65 (RMC §18-410)'}
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Age at retirement</span>
          <span className="font-semibold">{eligibility.age_at_retirement}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Years under 65</span>
          <span className="font-semibold">{yearsUnder65}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Reduction rate</span>
          <span className="font-semibold">{reductionRate}/year</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total reduction</span>
          <span className="font-mono font-semibold text-warning">{reductionPct.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Reduction factor</span>
          <span className="font-mono font-semibold">{formatPercent(benefit.reduction_factor)}</span>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="text-muted">Gross monthly benefit</span>
            <span className="font-mono">{formatCurrency(benefit.gross_monthly_benefit)}</span>
          </div>
          <div className="flex justify-between text-warning">
            <span>Reduction amount</span>
            <span className="font-mono font-semibold">-{formatCurrency(reductionAmount)}</span>
          </div>
          <div className="flex justify-between text-primary font-semibold mt-1">
            <span>Net monthly benefit</span>
            <span className="font-mono">{formatCurrency(benefit.net_monthly_benefit)}</span>
          </div>
        </div>
      </div>

      {/* Statutory Reduction Table — member's age highlighted */}
      <div className="mt-4 border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b border-border">
          <p className="text-xs font-semibold text-gray-700">
            Statutory Reduction Table — Tier {tier <= 2 ? '1 & 2' : '3'} (RMC §18-409(b))
          </p>
        </div>
        <div className="grid grid-cols-6 gap-0 text-xs text-center">
          {(tier <= 2
            ? [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65]
            : [60, 61, 62, 63, 64, 65]
          ).map(age => {
            const ratePerYear = tier === 3 ? 6 : 3
            const yrsUnder = 65 - age
            const factor = (100 - ratePerYear * yrsUnder) / 100
            const isActive = Math.floor(eligibility.age_at_retirement) === age
            return (
              <div
                key={age}
                className={`py-2 border-b border-r border-border last:border-r-0 ${
                  isActive
                    ? 'bg-amber-100 ring-2 ring-amber-400 ring-inset font-bold'
                    : age === 65
                    ? 'bg-green-50'
                    : ''
                }`}
              >
                <div className="text-muted">Age {age}</div>
                <div className="font-mono mt-0.5">
                  {yrsUnder > 0 ? `${(yrsUnder * ratePerYear)}%` : '0%'}
                </div>
                <div className="font-mono text-gray-500 mt-0.5">
                  ×{factor.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
