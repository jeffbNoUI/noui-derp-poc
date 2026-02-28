/**
 * CLI entry point — reads JSONL telemetry, extracts patterns, generates analysis report.
 * Run: npx tsx src/simulation/run-analysis.ts
 * Consumed by: CLI user
 * Depends on: pattern-extractor.ts, composition-recommender.ts, report-generator.ts
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { TelemetryEvent, SessionSummary } from './telemetry-types.ts'
import { extractAllPatterns } from './analysis/pattern-extractor.ts'
import { generateRecommendations } from './analysis/composition-recommender.ts'
import { generateReport } from './analysis/report-generator.ts'

const OUTPUT_DIR = path.resolve(import.meta.dirname ?? '.', 'output')
const ANALYSIS_DIR = path.join(OUTPUT_DIR, 'analysis')

function main() {
  console.log('Loading telemetry data...')

  // Read JSONL events
  const jsonlPath = path.join(OUTPUT_DIR, 'sessions.jsonl')
  if (!fs.existsSync(jsonlPath)) {
    console.error(`No sessions.jsonl found at ${jsonlPath}. Run simulation first.`)
    process.exit(1)
  }

  const lines = fs.readFileSync(jsonlPath, 'utf-8').trim().split('\n')
  const events: TelemetryEvent[] = lines.map(line => JSON.parse(line))
  console.log(`Loaded ${events.length} events`)

  // Read summaries
  const summaryPath = path.join(OUTPUT_DIR, 'session-summaries.json')
  const summaries: SessionSummary[] = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
  console.log(`Loaded ${summaries.length} session summaries`)

  // Extract patterns
  console.log('Extracting patterns...')
  const startTime = Date.now()
  const patterns = extractAllPatterns(events, summaries)
  const extractTime = Date.now() - startTime
  console.log(`Pattern extraction completed in ${extractTime}ms`)

  // Generate recommendations
  console.log('Generating recommendations...')
  const recommendations = generateRecommendations(patterns)
  console.log(`Generated ${recommendations.length} recommendations`)

  // Write outputs
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true })

  const patternsPath = path.join(ANALYSIS_DIR, 'patterns.json')
  fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2))
  console.log(`Wrote patterns to ${patternsPath}`)

  const recsPath = path.join(ANALYSIS_DIR, 'recommendations.json')
  fs.writeFileSync(recsPath, JSON.stringify(recommendations, null, 2))
  console.log(`Wrote recommendations to ${recsPath}`)

  // Generate markdown report
  const report = generateReport(patterns, recommendations, summaries)
  const reportPath = path.join(ANALYSIS_DIR, 'report.md')
  fs.writeFileSync(reportPath, report)
  console.log(`Wrote report to ${reportPath}`)

  // Print summary
  console.log('\n--- Analysis Summary ---')
  console.log(`Stage ordering patterns: ${patterns.stage_ordering.length}`)
  console.log(`Bottleneck stages: ${patterns.bottlenecks.filter(b => b.is_bottleneck).length}`)
  console.log(`Error recovery patterns: ${patterns.error_recovery.length}`)
  console.log(`Expert mode adoption: ${patterns.expert_mode.adoption_rate}%`)
  console.log(`Nudge rules analyzed: ${patterns.nudge_effectiveness.length}`)
  console.log(`Completion funnel steps: ${patterns.completion_funnel.length}`)
  console.log(`Recommendations: ${recommendations.length}`)
  console.log('\nDone.')
}

main()
