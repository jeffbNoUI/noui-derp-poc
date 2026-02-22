import type { DataQualitySummary, DataQualityFinding, FindingSeverity } from '@/types/DataQuality'
import { cn } from '@/lib/utils'
import { AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

interface DataQualityDashboardProps {
  summary: DataQualitySummary
}

const severityConfig: Record<FindingSeverity, { icon: typeof Info; label: string; color: string; bg: string }> = {
  critical: { icon: XCircle, label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  warning: { icon: AlertTriangle, label: 'Warning', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  info: { icon: Info, label: 'Info', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
}

export function DataQualityDashboard({ summary }: DataQualityDashboardProps) {
  const [filter, setFilter] = useState<FindingSeverity | 'all'>('all')

  const filtered = filter === 'all'
    ? summary.findings
    : summary.findings.filter((f) => f.severity === filter)

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Data Quality Dashboard</h2>
        </div>

        <p className="text-sm text-muted mb-4">
          All findings are presented for human review. Proposed corrections require verification
          before any changes are made.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="Total"
            count={summary.total_findings}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <SummaryCard
            label="Critical"
            count={summary.by_severity.critical ?? 0}
            color="text-red-600"
            active={filter === 'critical'}
            onClick={() => setFilter('critical')}
          />
          <SummaryCard
            label="Warning"
            count={summary.by_severity.warning ?? 0}
            color="text-amber-600"
            active={filter === 'warning'}
            onClick={() => setFilter('warning')}
          />
          <SummaryCard
            label="Info"
            count={summary.by_severity.info ?? 0}
            color="text-blue-600"
            active={filter === 'info'}
            onClick={() => setFilter('info')}
          />
        </div>

        {/* Category breakdown */}
        <div className="flex gap-4 text-xs text-muted mb-4">
          <span>Structural: {summary.by_category.structural ?? 0}</span>
          <span>Calculation: {summary.by_category.calculation ?? 0}</span>
          <span>Balance: {summary.by_category.balance ?? 0}</span>
        </div>
      </div>

      {/* Findings list */}
      <div className="space-y-3">
        {filtered.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted py-8">
          No findings match the selected filter.
        </p>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string
  count: number
  color?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border text-center transition-colors',
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
      )}
    >
      <p className={cn('text-2xl font-bold', color ?? 'text-gray-900')}>{count}</p>
      <p className="text-xs text-muted">{label}</p>
    </button>
  )
}

function FindingCard({ finding }: { finding: DataQualityFinding }) {
  const config = severityConfig[finding.severity]
  const Icon = config.icon

  return (
    <div className={cn('p-4 rounded-lg border', config.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', config.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-sm font-semibold', config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-muted">
              {finding.category} | Member: {finding.member_id}
            </span>
          </div>
          <p className="text-sm text-gray-800">{finding.description}</p>

          {Object.keys(finding.details).length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {Object.entries(finding.details).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted">{key}: </span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}

          {finding.proposed_resolution && (
            <div className="mt-2 p-2 bg-white/50 rounded text-xs">
              <span className="font-semibold">Proposed correction (awaiting review): </span>
              {finding.proposed_resolution}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
