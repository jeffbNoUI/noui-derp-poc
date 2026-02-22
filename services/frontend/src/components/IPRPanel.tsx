import type { IPRResult } from '@/types/Member'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface IPRPanelProps {
  ipr: IPRResult
}

export function IPRPanel({ ipr }: IPRPanelProps) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Increase in Pension for Retirees (IPR)</h2>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm">
        <p className="text-blue-800">
          IPR provides an annual cost-of-living increase based on{' '}
          <strong>earned</strong> service years only. Purchased service credit is excluded.
        </p>
        <p className="text-blue-700 mt-1 text-xs">Source: RMC §18-415</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Medicare eligible</span>
          <span className="font-semibold">{ipr.medicare_eligible ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Rate per year of service</span>
          <span className="font-mono font-semibold">
            {formatCurrency(ipr.rate_per_year)}/yr
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Eligible service years (earned only)</span>
          <span className="font-mono font-semibold">
            {ipr.eligible_service_years.toFixed(2)} years
          </span>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="text-muted">Annual IPR amount</span>
            <span className="font-mono font-semibold">{formatCurrency(ipr.annual_amount)}</span>
          </div>
          <div className="flex justify-between text-primary font-semibold mt-1">
            <span>Monthly IPR amount</span>
            <span className="font-mono">{formatCurrency(ipr.monthly_amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted">
        <p>
          Formula: {formatCurrency(ipr.rate_per_year)} x {ipr.eligible_service_years.toFixed(2)} years
          = {formatCurrency(ipr.annual_amount)}/year ({formatCurrency(ipr.monthly_amount)}/month)
        </p>
      </div>
    </div>
  )
}
