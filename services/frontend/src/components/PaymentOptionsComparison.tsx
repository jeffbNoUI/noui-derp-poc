import type { PaymentOptionsResult } from '@/types/Member'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CreditCard, Users, Heart } from 'lucide-react'

interface PaymentOptionsComparisonProps {
  result: PaymentOptionsResult
}

const optionIcons: Record<string, typeof CreditCard> = {
  maximum: CreditCard,
  'j&s_100': Users,
  'j&s_75': Users,
  'j&s_50': Heart,
}

export function PaymentOptionsComparison({ result }: PaymentOptionsComparisonProps) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Options</h2>
      <p className="text-sm text-muted mb-4">
        Base monthly benefit: <span data-monetary>{formatCurrency(result.base_monthly_benefit)}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-print="payment-options">
        {result.options.map((option) => {
          const Icon = optionIcons[option.option_type] ?? CreditCard
          const isMax = option.option_type === 'maximum'
          const reductionPct = (1 - option.reduction_factor) * 100

          return (
            <div
              key={option.option_type}
              className={cn(
                'p-4 rounded-lg border-2 transition-colors',
                isMax
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
              data-print="payment-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-5 h-5', isMax ? 'text-primary' : 'text-muted')} />
                <h3 className="text-sm font-semibold text-gray-900">
                  {option.option_name}
                </h3>
              </div>

              <p className="text-2xl font-bold font-mono text-gray-900 mb-1" data-monetary>
                {formatCurrency(option.monthly_amount)}
              </p>
              <p className="text-xs text-muted">per month</p>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Reduction factor</span>
                  <span className="font-mono">{formatPercent(option.reduction_factor)}</span>
                </div>
                {!isMax && (
                  <div className="flex justify-between">
                    <span className="text-muted">Reduction from max</span>
                    <span className="font-mono text-warning">-{reductionPct.toFixed(2)}%</span>
                  </div>
                )}
                {option.survivor_pct !== undefined && option.survivor_pct > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Survivor benefit</span>
                    <span className="font-mono">{option.survivor_pct}%</span>
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-muted italic">{option.description}</p>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-muted">
        Joint &amp; Survivor options require spousal consent for married members.
        Reduction factors are actuarial estimates based on member and beneficiary ages.
      </p>
    </div>
  )
}
