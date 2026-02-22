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
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
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
    </div>
  )
}
