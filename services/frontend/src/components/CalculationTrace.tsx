/**
 * Renders a full calculation audit trail with expandable steps.
 * Consumed by: BenefitCalculationPanel, EligibilityPanel, DROImpactPanel
 * Depends on: AuditEntry type from Member.ts, lucide-react icons
 *
 * Shows every rule evaluation: step number, rule name, source reference (RMC §),
 * description, and result. Collapsible per step. Lists assumptions with IDs.
 * Core value proposition: proves every calculation is traceable to governing documents.
 */
import { useState } from 'react'
import type { AuditEntry } from '@/types/Member'
import { FileCheck, ChevronDown, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react'

interface CalculationTraceProps {
  entries: AuditEntry[]
  title?: string
  assumptions?: string[]
  /** When true, starts with all steps expanded */
  defaultExpanded?: boolean
}

export function CalculationTrace({
  entries,
  title = 'Calculation Trace',
  assumptions,
  defaultExpanded = false,
}: CalculationTraceProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    defaultExpanded ? new Set(entries.map((_, i) => i)) : new Set()
  )
  const [showAll, setShowAll] = useState(defaultExpanded)

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (showAll) {
      setExpandedSteps(new Set())
    } else {
      setExpandedSteps(new Set(entries.map((_, i) => i)))
    }
    setShowAll(!showAll)
  }

  if (entries.length === 0) return null

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-muted bg-white border border-border rounded-full px-2 py-0.5">
            {entries.length} steps
          </span>
        </div>
        <button
          onClick={toggleAll}
          className="text-xs text-primary hover:underline"
        >
          {showAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {entries.map((entry, idx) => {
          const isExpanded = expandedSteps.has(idx)
          const isPass = entry.result.startsWith('PASS') || entry.result.startsWith('$') || entry.result.startsWith('ELIGIBLE')
          const isFail = entry.result.startsWith('FAIL')

          return (
            <div key={idx} className="bg-white">
              {/* Step summary row */}
              <button
                onClick={() => toggleStep(idx)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                }
                <span className="text-xs font-mono text-muted w-6 shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-sm font-medium text-gray-900 min-w-0">
                  {entry.rule_name}
                </span>
                {entry.source_reference && (
                  <span className="text-xs text-primary bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 shrink-0 font-mono">
                    {entry.source_reference}
                  </span>
                )}
                <span className="ml-auto text-xs font-mono shrink-0">
                  <span className={
                    isPass ? 'text-green-700' :
                    isFail ? 'text-red-600' :
                    'text-gray-700'
                  }>
                    {entry.result}
                  </span>
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-3 pl-14">
                  <div className="text-sm text-gray-600 mb-1">
                    {entry.description}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>
                      <span className="font-medium">Rule:</span>{' '}
                      <span className="font-mono">{entry.rule_id}</span>
                    </span>
                    {entry.source_reference && (
                      <span>
                        <span className="font-medium">Source:</span>{' '}
                        <span className="font-mono">{entry.source_reference}</span>
                      </span>
                    )}
                    <span>
                      <span className="font-medium">Result:</span>{' '}
                      <span className={`font-mono ${isPass ? 'text-green-700' : isFail ? 'text-red-600' : ''}`}>
                        {entry.result}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Assumptions */}
      {assumptions && assumptions.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Assumptions</span>
          </div>
          <ul className="space-y-0.5">
            {assumptions.map((a, i) => (
              <li key={i} className="text-xs text-amber-700 font-mono pl-5">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-border flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-muted" />
        <span className="text-xs text-muted">
          Every calculation is traceable to the Revised Municipal Code.
          The system shows its work — no calculation is made without human visibility.
        </span>
      </div>
    </div>
  )
}
