import { useState } from 'react'
import type { ScenarioResult } from '@/types/Member'
import { useScenarios } from '@/hooks/useCalculations'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CalendarDays, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

interface ScenarioModelerProps {
  memberId: string
  currentRetirementDate?: string
}

export function ScenarioModeler({ memberId, currentRetirementDate }: ScenarioModelerProps) {
  const [dates, setDates] = useState<string[]>(() => {
    if (!currentRetirementDate) return []
    // Generate comparison dates: 1 year before, current, 1 year after, 2 years after
    const base = new Date(currentRetirementDate)
    return [
      offsetDate(base, -1),
      currentRetirementDate,
      offsetDate(base, 1),
      offsetDate(base, 2),
    ]
  })

  const [newDate, setNewDate] = useState('')
  const scenarios = useScenarios(memberId, dates)

  function addDate() {
    if (newDate && !dates.includes(newDate)) {
      setDates((prev) => [...prev, newDate].sort())
      setNewDate('')
    }
  }

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Scenario Comparison</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={addDate}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Add Date
        </button>
      </div>

      {scenarios.isLoading && <LoadingSpinner message="Calculating scenarios..." />}

      {scenarios.data && scenarios.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted font-medium">Retirement Date</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Age</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Type</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Reduction</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Monthly Benefit</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Annual Benefit</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.data.map((s: ScenarioResult) => {
                const isCurrent = s.retirement_date === currentRetirementDate
                return (
                  <tr
                    key={s.retirement_date}
                    className={cn(
                      'border-b border-border/50',
                      isCurrent && 'bg-primary/5 font-semibold',
                      !s.eligible && 'opacity-50'
                    )}
                  >
                    <td className="py-2 px-3">
                      {formatDate(s.retirement_date)}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-primary">(selected)</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{s.age_at_retirement}</td>
                    <td className="py-2 px-3">
                      {s.eligible ? s.retirement_type : 'Not eligible'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {s.eligible ? formatPercent(s.reduction_factor) : '--'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {s.eligible ? formatCurrency(s.net_monthly_benefit) : '--'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {s.eligible ? formatCurrency(s.annual_benefit) : '--'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {scenarios.data && scenarios.data.length > 1 && (
        <BenefitTrend scenarios={scenarios.data.filter((s: ScenarioResult) => s.eligible)} />
      )}
    </div>
  )
}

function BenefitTrend({ scenarios }: { scenarios: ScenarioResult[] }) {
  if (scenarios.length < 2) return null

  const maxBenefit = Math.max(...scenarios.map((s) => s.net_monthly_benefit))

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">Benefit Comparison</h3>
      </div>
      <div className="space-y-2">
        {scenarios.map((s) => {
          const pct = (s.net_monthly_benefit / maxBenefit) * 100
          return (
            <div key={s.retirement_date} className="flex items-center gap-3">
              <span className="text-xs text-muted w-24 shrink-0">
                {new Date(s.retirement_date).getFullYear()}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold w-24 text-right">
                {formatCurrency(s.net_monthly_benefit)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function offsetDate(base: Date, years: number): string {
  const d = new Date(base)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().split('T')[0]
}
