/**
 * Markdown report generator — produces human-readable analysis with ASCII tables.
 * Consumed by: run-analysis.ts
 * Depends on: pattern-extractor.ts, composition-recommender.ts, telemetry-types.ts
 */
import type { ExtractedPatterns } from './pattern-extractor.ts'
import type { CompositionRecommendation, SessionSummary } from '../telemetry-types.ts'

// ─── ASCII Table Helpers ────────────────────────────────────────

function padRight(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length)
}

function asciiTable(headers: string[], rows: string[][], widths: number[]): string {
  const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+'
  const headerRow = '|' + headers.map((h, i) => ' ' + padRight(h, widths[i]) + ' ').join('|') + '|'
  const dataRows = rows.map(row =>
    '|' + row.map((cell, i) => ' ' + padRight(cell, widths[i]) + ' ').join('|') + '|'
  )
  return [sep, headerRow, sep, ...dataRows, sep].join('\n')
}

// ─── Report Sections ────────────────────────────────────────────

function overviewSection(summaries: SessionSummary[]): string {
  const total = summaries.length
  const completed = summaries.filter(s => s.completed).length
  const abandoned = total - completed

  const byPortal = new Map<string, number>()
  const byWorkflow = new Map<string, number>()
  const byExperience = new Map<string, number>()

  for (const s of summaries) {
    byPortal.set(s.portal, (byPortal.get(s.portal) ?? 0) + 1)
    byWorkflow.set(s.workflow, (byWorkflow.get(s.workflow) ?? 0) + 1)
    byExperience.set(s.experience_level, (byExperience.get(s.experience_level) ?? 0) + 1)
  }

  const durations = summaries.filter(s => s.completed).map(s => s.duration_ms)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0

  let out = '## Overview\n\n'
  out += `- **Total Sessions**: ${total}\n`
  out += `- **Completed**: ${completed} (${Math.round(completed / total * 100)}%)\n`
  out += `- **Abandoned**: ${abandoned} (${Math.round(abandoned / total * 100)}%)\n`
  out += `- **Avg Duration (completed)**: ${avgDuration}s\n\n`

  out += asciiTable(
    ['Portal', 'Count', '%'],
    [...byPortal.entries()].map(([k, v]) => [k, v.toString(), `${Math.round(v / total * 100)}%`]),
    [10, 6, 5],
  )
  out += '\n\n'

  out += asciiTable(
    ['Workflow', 'Count', '%'],
    [...byWorkflow.entries()].map(([k, v]) => [k, v.toString(), `${Math.round(v / total * 100)}%`]),
    [15, 6, 5],
  )
  out += '\n\n'

  out += asciiTable(
    ['Experience', 'Count', '%'],
    [...byExperience.entries()].map(([k, v]) => [k, v.toString(), `${Math.round(v / total * 100)}%`]),
    [14, 6, 5],
  )

  return out
}

function stageOrderingSection(patterns: ExtractedPatterns): string {
  let out = '## Stage Ordering Patterns\n\n'
  out += 'Top traversal orders for staff retirement sessions:\n\n'

  for (let i = 0; i < Math.min(5, patterns.stage_ordering.length); i++) {
    const p = patterns.stage_ordering[i]
    const expParts = Object.entries(p.experience_breakdown)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    out += `${i + 1}. **${p.percentage}%** (${p.count} sessions) — ${expParts}\n`
    out += `   \`${p.order.join(' → ')}\`\n\n`
  }

  return out
}

function bottleneckSection(patterns: ExtractedPatterns): string {
  let out = '## Bottleneck Analysis\n\n'
  out += 'Stages with dwell time > 1.5x overall median are bottlenecks.\n\n'

  out += asciiTable(
    ['Stage', 'Median', 'P75', 'P90', 'Ratio', 'Bottleneck?'],
    patterns.bottlenecks.map(b => [
      b.stage_id,
      `${Math.round(b.median_dwell_ms / 1000)}s`,
      `${Math.round(b.p75_dwell_ms / 1000)}s`,
      `${Math.round(b.p90_dwell_ms / 1000)}s`,
      `${b.bottleneck_ratio}x`,
      b.is_bottleneck ? 'YES' : 'no',
    ]),
    [22, 7, 7, 7, 7, 11],
  )

  return out
}

function errorRecoverySection(patterns: ExtractedPatterns): string {
  let out = '## Error Recovery Patterns\n\n'
  out += 'Stages that are unconfirmed (backtracked) most frequently:\n\n'

  if (patterns.error_recovery.length === 0) {
    out += '_No unconfirm events recorded._\n'
    return out
  }

  out += asciiTable(
    ['Stage', 'Unconfirms', 'Visits', 'Rate'],
    patterns.error_recovery.slice(0, 8).map(e => [
      e.stage_id,
      e.unconfirm_count.toString(),
      e.total_visits.toString(),
      `${(e.unconfirm_rate * 100).toFixed(1)}%`,
    ]),
    [22, 10, 7, 7],
  )

  return out
}

function expertModeSection(patterns: ExtractedPatterns): string {
  const em = patterns.expert_mode
  let out = '## Expert Mode Adoption\n\n'
  out += `- **Adoption Rate**: ${em.adoption_rate}% of staff sessions\n`
  out += `- **Time Savings**: ${em.time_savings_pct}% faster than guided mode\n`
  out += `- **By Experience**: ${Object.entries(em.by_experience).map(([k, v]) => `${k}: ${v}`).join(', ')}\n\n`

  if (Object.keys(em.switch_at_stage).length > 0) {
    out += 'Switch-to-expert occurs at:\n'
    for (const [stage, count] of Object.entries(em.switch_at_stage)) {
      out += `  - ${stage}: ${count} times\n`
    }
  }

  return out
}

function completionFunnelSection(patterns: ExtractedPatterns): string {
  let out = '## Member Wizard Completion Funnel\n\n'

  out += asciiTable(
    ['Step', 'Entered', 'Completed', 'Abandoned', 'Complete%', 'Abandon%'],
    patterns.completion_funnel.map(s => [
      s.step_id,
      s.entered.toString(),
      s.completed.toString(),
      s.abandoned.toString(),
      `${s.completion_rate}%`,
      `${s.abandonment_rate}%`,
    ]),
    [18, 8, 10, 10, 10, 9],
  )

  return out
}

function nudgeSection(patterns: ExtractedPatterns): string {
  let out = '## Nudge Effectiveness\n\n'

  if (patterns.nudge_effectiveness.length === 0) {
    out += '_No nudges fired during simulation._\n'
    return out
  }

  out += asciiTable(
    ['Nudge', 'Fired', 'Acted', 'Dismissed', 'Effectiveness'],
    patterns.nudge_effectiveness.map(n => [
      n.nudge_id,
      n.fire_count.toString(),
      n.act_count.toString(),
      n.dismiss_count.toString(),
      `${n.effectiveness}%`,
    ]),
    [35, 6, 6, 9, 13],
  )

  return out
}

function learningModuleSection(patterns: ExtractedPatterns): string {
  let out = '## Learning Module Usage\n\n'

  out += asciiTable(
    ['Layer', 'Toggles', 'Views', 'Avg Duration', 'Novice', 'Intermediate', 'Expert'],
    patterns.learning_module.map(l => [
      l.layer,
      l.toggle_count.toString(),
      l.view_count.toString(),
      l.avg_view_duration_ms > 0 ? `${Math.round(l.avg_view_duration_ms / 1000)}s` : '-',
      (l.by_experience['novice'] ?? 0).toString(),
      (l.by_experience['intermediate'] ?? 0).toString(),
      (l.by_experience['expert'] ?? 0).toString(),
    ]),
    [12, 8, 6, 13, 7, 13, 7],
  )

  return out
}

function recommendationsSection(recommendations: CompositionRecommendation[]): string {
  let out = '## Composition Recommendations\n\n'
  out += `**${recommendations.length} actionable recommendations** from pattern analysis:\n\n`

  for (let i = 0; i < recommendations.length; i++) {
    const r = recommendations[i]
    out += `### ${i + 1}. [${r.category}] Confidence: ${(r.evidence.confidence * 100).toFixed(0)}%\n\n`
    out += `**Current**: ${r.current_behavior}\n\n`
    out += `**Recommended**: ${r.recommended_change}\n\n`
    out += `**Evidence**: ${r.evidence.sessions_analyzed} sessions analyzed, pattern frequency ${(r.evidence.pattern_frequency * 100).toFixed(1)}%\n\n`
    out += `**Implementation**: \`${r.implementation.file}\` → \`${r.implementation.function_name}()\`\n`
    out += `> ${r.implementation.change_description}\n\n`
    out += '---\n\n'
  }

  return out
}

function caseComplexitySection(patterns: ExtractedPatterns): string {
  let out = '## Case Complexity Impact\n\n'

  out += asciiTable(
    ['Case', 'Sessions', 'Avg Duration', 'Avg Events'],
    patterns.case_complexity.map(c => [
      c.case_type,
      c.session_count.toString(),
      `${Math.round(c.avg_duration_ms / 1000)}s`,
      c.avg_events.toString(),
    ]),
    [10, 9, 13, 11],
  )

  return out
}

// ─── Main Report Generator ──────────────────────────────────────

export function generateReport(
  patterns: ExtractedPatterns,
  recommendations: CompositionRecommendation[],
  summaries: SessionSummary[],
): string {
  const sections = [
    '# NoUI DERP POC — Workflow Simulation Analysis Report\n',
    `_Generated: ${new Date().toISOString()}_\n`,
    `_Seed: 42 | Sessions: ${summaries.length} | Events: ~${Math.round(summaries.reduce((s, x) => s + x.event_count, 0) / 1000)}K_\n\n`,
    '---\n',
    overviewSection(summaries),
    '\n---\n',
    stageOrderingSection(patterns),
    '\n---\n',
    bottleneckSection(patterns),
    '\n---\n',
    errorRecoverySection(patterns),
    '\n---\n',
    expertModeSection(patterns),
    '\n---\n',
    completionFunnelSection(patterns),
    '\n---\n',
    nudgeSection(patterns),
    '\n---\n',
    learningModuleSection(patterns),
    '\n---\n',
    caseComplexitySection(patterns),
    '\n---\n',
    recommendationsSection(recommendations),
  ]

  return sections.join('\n')
}
