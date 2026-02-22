import type { OperationalSummary, ProcessingTimeAnalysis, ExceptionFrequency, WorkflowPattern } from '@/types/OperationalAnalysis'
import { BarChart3, Clock, AlertTriangle, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OperationalDashboardProps {
  summary: OperationalSummary
}

export function OperationalDashboard({ summary }: OperationalDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Operational Analysis</h2>
        </div>

        <p className="text-sm text-muted mb-2">
          Operational patterns inform orchestration and workspace composition only — not business rules.
          All insights are observations presented for human review.
        </p>

        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xl font-bold text-gray-900">{summary.total_cases_analyzed.toLocaleString()}</p>
            <p className="text-xs text-muted">Cases Analyzed</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-muted">Date Range</p>
            <p className="text-sm font-medium">{summary.date_range_start} to {summary.date_range_end}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xl font-bold text-gray-900">{summary.workflow_patterns.length}</p>
            <p className="text-xs text-muted">Workflow Patterns</p>
          </div>
        </div>
      </div>

      {/* Processing Times */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Processing Time by Case Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted font-medium">Case Type</th>
                <th className="text-center py-2 px-3 text-muted font-medium">Tier</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Avg Days</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Median</th>
                <th className="text-right py-2 px-3 text-muted font-medium">P95</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Sample</th>
              </tr>
            </thead>
            <tbody>
              {summary.processing_times.map((pt: ProcessingTimeAnalysis, i: number) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-3">{pt.case_type}</td>
                  <td className="py-2 px-3 text-center">{pt.tier}</td>
                  <td className="py-2 px-3 text-right font-mono">{pt.avg_processing_days.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right font-mono">{pt.median_processing_days.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right font-mono">{pt.p95_processing_days.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">{pt.sample_size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Frequencies */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-sm font-semibold text-gray-900">Exception Frequencies</h3>
        </div>
        <div className="space-y-2">
          {summary.exceptions.map((ex: ExceptionFrequency, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm w-48 shrink-0">{ex.exception_type}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(ex.pct_of_total, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono w-16 text-right">{ex.count}</span>
              <TrendBadge trend={ex.trend} />
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Patterns */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Detected Workflow Patterns</h3>
        </div>
        <div className="space-y-4">
          {summary.workflow_patterns.map((wp: WorkflowPattern, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{wp.pattern_name}</span>
                <span className="text-xs text-muted">
                  {wp.frequency} occurrences | avg {wp.avg_duration_days.toFixed(1)} days
                </span>
              </div>
              <p className="text-xs text-muted mb-2">{wp.description}</p>
              <div className="flex items-center gap-1">
                {wp.steps.map((step: string, j: number) => (
                  <div key={j} className="flex items-center gap-1">
                    <span className="text-xs bg-white px-2 py-0.5 rounded border border-border">
                      {step}
                    </span>
                    {j < wp.steps.length - 1 && (
                      <span className="text-muted text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ trend }: { trend: string }) {
  const config = {
    increasing: { label: '↑', color: 'text-red-600 bg-red-50' },
    stable: { label: '→', color: 'text-gray-600 bg-gray-50' },
    decreasing: { label: '↓', color: 'text-green-600 bg-green-50' },
  }
  const c = config[trend as keyof typeof config] ?? config.stable
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded font-mono', c.color)}>
      {c.label}
    </span>
  )
}
