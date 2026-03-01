/**
 * Salary history table — yearly pensionable pay with HAS window highlight and anti-spiking.
 * Consumed by: BenefitWorkspace, guided Stage2
 * Depends on: SalaryRecord, AMSResult types, formatCurrency/formatDate utils
 */
import type { SalaryRecord, AMSResult } from '@/types/Member'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface SalaryTableProps {
  records: SalaryRecord[]
  ams: AMSResult
  has_table: number
}

export function SalaryTable({ records, ams, has_table }: SalaryTableProps) {
  // HAS window: 36 months for tables 1-6/10-12, 60 months for tables 7-9/13
  const windowMonths = [7, 8, 9, 13].includes(has_table) ? 60 : 36
  const windowStart = new Date(ams.window_start)
  const windowEnd = new Date(ams.window_end)

  // Group records by year for summary view
  const byYear = new Map<number, { total: number; count: number; records: SalaryRecord[] }>()
  for (const rec of records) {
    const year = new Date(rec.pay_period_end).getFullYear()
    const entry = byYear.get(year) ?? { total: 0, count: 0, records: [] }
    entry.total += rec.pensionable_pay
    entry.count++
    entry.records.push(rec)
    byYear.set(year, entry)
  }
  const years = Array.from(byYear.entries()).sort((a, b) => b[0] - a[0])

  function isInAMSWindow(dateStr: string): boolean {
    const d = new Date(dateStr)
    return d >= windowStart && d <= windowEnd
  }

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn" data-print="calc-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Salary History</h2>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-medium">HAS ({windowMonths} months): {formatCurrency(ams.ams_amount)}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium text-blue-800">
          Highest Average Salary Calculation (HAS Table {has_table})
        </p>
        <p className="text-blue-700 mt-1">
          Highest {windowMonths} consecutive months of pensionable compensation.
          Window: {formatDate(ams.window_start)} to {formatDate(ams.window_end)}
        </p>
        <p className="text-blue-800 font-semibold mt-1">
          HAS = {formatCurrency(ams.ams_amount)}/month
        </p>
        {ams.anti_spiking_applied && (
          <p className="text-amber-700 mt-1 text-xs font-medium">
            Anti-spiking applied — salary capped at 108% of prior year (C.R.S. §24-51-101(25.5))
          </p>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          In HAS window
        </span>
        {ams.anti_spiking_applied && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            Anti-spiking capped
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Year</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Pay Periods</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Total Pensionable</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Avg Monthly</th>
            </tr>
          </thead>
          <tbody>
            {years.map(([year, data]) => {
              const hasAMSRecords = data.records.some((r) => isInAMSWindow(r.pay_period_end))
              const avgMonthly = data.total / 12

              return (
                <tr
                  key={year}
                  className={cn(
                    'border-b border-border/50 hover:bg-gray-50',
                    hasAMSRecords && 'bg-blue-50/50',
                  )}
                >
                  <td className="py-2 px-3 font-medium">
                    {year}
                    {hasAMSRecords && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">HAS</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">{data.count}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(data.total)}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(avgMonthly)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
