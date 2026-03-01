/**
 * Annual Increase panel — displays COPERA compound annual increase per C.R.S. §24-51-1001.
 * COPERA annual increase: 1.5% compound (pre-2011) or 1.0% compound (post-SB 18-200).
 * Consumed by: BenefitWorkspace, guided Stage4
 * Depends on: AnnualIncreaseInfo type
 *
 * Note: File retains IPRPanel name for backward compatibility with existing imports.
 * The component now renders annual increase information per C.R.S. §24-51-1001.
 */
import type { AnnualIncreaseInfo } from '@/types/Member'
import { TrendingUp } from 'lucide-react'

interface IPRPanelProps {
  ipr: AnnualIncreaseInfo
}

export function IPRPanel({ ipr }: IPRPanelProps) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Annual Increase</h2>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm">
        <p className="text-blue-800">
          COPERA provides a <strong>compound annual increase</strong> to retirement benefits,
          effective March 1 of the second calendar year after retirement.
        </p>
        <p className="text-blue-700 mt-1 text-xs">Source: C.R.S. §24-51-1001 through §24-51-1009</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Annual increase rate</span>
          <span className="font-mono font-semibold">
            {(ipr.rate * 100).toFixed(1)}% compound
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">First eligible date</span>
          <span className="font-mono font-semibold">
            {ipr.first_eligible_date}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Method</span>
          <span className="font-semibold">
            {ipr.compound_method}
          </span>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted italic">
        <p>{ipr.note}</p>
      </div>
    </div>
  )
}
