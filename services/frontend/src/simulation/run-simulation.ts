/**
 * CLI entry point — generates 1000 synthetic telemetry sessions to output/.
 * Run: npx tsx src/simulation/run-simulation.ts
 * Consumed by: CLI user
 * Depends on: session-generator.ts, node:fs, node:path
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { generateAllSessions } from './session-generator.ts'

const OUTPUT_DIR = path.resolve(import.meta.dirname ?? '.', 'output')

function main() {
  console.log('Generating 1000 synthetic workflow sessions...')
  const startTime = Date.now()

  const result = generateAllSessions(42)

  const elapsed = Date.now() - startTime
  console.log(`Generated ${result.totalSessions} sessions, ${result.totalEvents} events in ${elapsed}ms`)

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Write JSONL (one event per line)
  const jsonlPath = path.join(OUTPUT_DIR, 'sessions.jsonl')
  const jsonlStream = fs.createWriteStream(jsonlPath)
  for (const event of result.events) {
    jsonlStream.write(JSON.stringify(event) + '\n')
  }
  jsonlStream.end()
  console.log(`Wrote ${result.totalEvents} events to ${jsonlPath}`)

  // Write session summaries
  const summaryPath = path.join(OUTPUT_DIR, 'session-summaries.json')
  fs.writeFileSync(summaryPath, JSON.stringify(result.summaries, null, 2))
  console.log(`Wrote ${result.summaries.length} summaries to ${summaryPath}`)

  // Print distribution stats
  console.log('\n--- Session Distribution ---')
  const byWorkflow = new Map<string, number>()
  const byPortal = new Map<string, number>()
  const byExperience = new Map<string, number>()
  let completedCount = 0

  for (const s of result.summaries) {
    byWorkflow.set(s.workflow, (byWorkflow.get(s.workflow) ?? 0) + 1)
    byPortal.set(s.portal, (byPortal.get(s.portal) ?? 0) + 1)
    byExperience.set(s.experience_level, (byExperience.get(s.experience_level) ?? 0) + 1)
    if (s.completed) completedCount++
  }

  console.log('\nBy Workflow:')
  for (const [k, v] of byWorkflow) console.log(`  ${k}: ${v}`)

  console.log('\nBy Portal:')
  for (const [k, v] of byPortal) console.log(`  ${k}: ${v}`)

  console.log('\nBy Experience:')
  for (const [k, v] of byExperience) console.log(`  ${k}: ${v}`)

  console.log(`\nCompletion: ${completedCount}/${result.summaries.length} (${Math.round(completedCount / result.summaries.length * 100)}%)`)
  console.log('\nDone.')
}

main()
