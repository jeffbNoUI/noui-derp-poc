/**
 * Pattern extractor — queries COMPOSITION_LOG and produces patterns.json.
 * Consumed by: operator (CLI tool), composition service (reads patterns.json via PATTERNS_FILE)
 * Depends on: PostgreSQL (COMPOSITION_LOG table populated by simulate.ts runs)
 *
 * Usage:
 *   npx tsx scripts/extract-patterns.ts [--output patterns.json] [--min-count 5]
 */

import pg from 'pg'
import { writeFileSync } from 'node:fs'

const { Pool } = pg

// ── CLI args ──────────────────────────────────────────────────────────────────

interface Args {
  output: string
  minCount: number
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const flags: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[++i]
    }
  }

  return {
    output: flags['output'] || 'patterns.json',
    minCount: parseInt(flags['min-count'] || '5', 10),
  }
}

// ── Pattern queries ───────────────────────────────────────────────────────────

interface ComponentFrequency {
  tier: number
  component: string
  count: number
  total: number
  pct: number
}

interface ConditionalDecision {
  component: string
  tier: number
  shown_count: number
  hidden_count: number
  total: number
  shown_pct: number
}

interface AlertFrequency {
  code: string
  severity: string
  count: number
  pct: number
}

interface PerformanceStats {
  composed_by: string
  count: number
  avg_ms: number
  p95_ms: number
  min_ms: number
  max_ms: number
}

async function queryComponentFrequency(pool: pg.Pool, minCount: number): Promise<ComponentFrequency[]> {
  const res = await pool.query<{ tier: number; component: string; cnt: string; total: string }>(`
    WITH expanded AS (
      SELECT MEMBER_TIER AS tier, UNNEST(COMPONENT_LIST) AS component
      FROM COMPOSITION_LOG
      WHERE STATUS IN ('OK', 'FALLBACK')
    ),
    tier_totals AS (
      SELECT MEMBER_TIER AS tier, COUNT(*) AS total
      FROM COMPOSITION_LOG
      WHERE STATUS IN ('OK', 'FALLBACK')
      GROUP BY MEMBER_TIER
    ),
    freq AS (
      SELECT e.tier, e.component, COUNT(*) AS cnt
      FROM expanded e
      GROUP BY e.tier, e.component
    )
    SELECT f.tier, f.component, f.cnt, t.total
    FROM freq f JOIN tier_totals t ON f.tier = t.tier
    WHERE f.cnt >= $1
    ORDER BY f.tier, f.cnt DESC
  `, [minCount])

  return res.rows.map((r) => ({
    tier: r.tier,
    component: r.component,
    count: parseInt(r.cnt, 10),
    total: parseInt(r.total, 10),
    pct: Math.round((parseInt(r.cnt, 10) / parseInt(r.total, 10)) * 100),
  }))
}

async function queryConditionalDecisions(pool: pg.Pool, minCount: number): Promise<ConditionalDecision[]> {
  const conditionalComponents = ['leave-payout', 'dro-impact', 'early-retirement-reduction']

  const res = await pool.query<{
    component: string; tier: number; shown: string; hidden: string; total: string
  }>(`
    WITH decisions AS (
      SELECT
        MEMBER_TIER AS tier,
        key AS component,
        (value::text)::boolean AS shown
      FROM COMPOSITION_LOG,
        LATERAL jsonb_each(COALESCE(CONDITIONALS, '{}'::jsonb))
      WHERE STATUS IN ('OK', 'FALLBACK')
        AND key = ANY($1)
    )
    SELECT
      component, tier,
      COUNT(*) FILTER (WHERE shown) AS shown,
      COUNT(*) FILTER (WHERE NOT shown) AS hidden,
      COUNT(*) AS total
    FROM decisions
    GROUP BY component, tier
    HAVING COUNT(*) >= $2
    ORDER BY component, tier
  `, [conditionalComponents, minCount])

  return res.rows.map((r) => ({
    component: r.component,
    tier: r.tier,
    shown_count: parseInt(r.shown, 10),
    hidden_count: parseInt(r.hidden, 10),
    total: parseInt(r.total, 10),
    shown_pct: Math.round((parseInt(r.shown, 10) / parseInt(r.total, 10)) * 100),
  }))
}

async function queryAlertFrequency(pool: pg.Pool, minCount: number): Promise<AlertFrequency[]> {
  const totalRes = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM COMPOSITION_LOG WHERE STATUS IN ('OK', 'FALLBACK')`
  )
  const totalCompositions = parseInt(totalRes.rows[0]?.cnt || '1', 10)

  const res = await pool.query<{ code: string; severity: string; cnt: string }>(`
    WITH alert_rows AS (
      SELECT
        elem->>'code' AS code,
        elem->>'severity' AS severity
      FROM COMPOSITION_LOG,
        LATERAL jsonb_array_elements(COALESCE(ALERTS, '[]'::jsonb)) AS elem
      WHERE STATUS IN ('OK', 'FALLBACK')
    )
    SELECT code, severity, COUNT(*) AS cnt
    FROM alert_rows
    GROUP BY code, severity
    HAVING COUNT(*) >= $1
    ORDER BY cnt DESC
  `, [minCount])

  return res.rows.map((r) => ({
    code: r.code,
    severity: r.severity,
    count: parseInt(r.cnt, 10),
    pct: Math.round((parseInt(r.cnt, 10) / totalCompositions) * 1000) / 10,
  }))
}

async function queryPerformanceStats(pool: pg.Pool): Promise<PerformanceStats[]> {
  const res = await pool.query<{
    composed_by: string; cnt: string; avg_ms: string; p95_ms: string; min_ms: string; max_ms: string
  }>(`
    SELECT
      COMPOSED_BY AS composed_by,
      COUNT(*) AS cnt,
      ROUND(AVG(DURATION_MS)) AS avg_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY DURATION_MS)::INTEGER AS p95_ms,
      MIN(DURATION_MS) AS min_ms,
      MAX(DURATION_MS) AS max_ms
    FROM COMPOSITION_LOG
    WHERE STATUS IN ('OK', 'FALLBACK')
    GROUP BY COMPOSED_BY
    ORDER BY COMPOSED_BY
  `)

  return res.rows.map((r) => ({
    composed_by: r.composed_by,
    count: parseInt(r.cnt, 10),
    avg_ms: parseInt(r.avg_ms, 10),
    p95_ms: parseInt(r.p95_ms, 10),
    min_ms: parseInt(r.min_ms, 10),
    max_ms: parseInt(r.max_ms, 10),
  }))
}

// ── Prompt supplement generation ──────────────────────────────────────────────

function buildPromptSupplement(
  totalCompositions: number,
  componentFreq: ComponentFrequency[],
  conditionals: ConditionalDecision[],
  alerts: AlertFrequency[],
  perf: PerformanceStats[]
): string {
  const lines: string[] = []
  lines.push(`## Learned Patterns (from ${totalCompositions} compositions)`)
  lines.push('')

  // Conditional component decisions
  if (conditionals.length > 0) {
    lines.push('### Conditional Component Decisions')
    for (const c of conditionals) {
      lines.push(`- Tier ${c.tier}: ${c.component} shown ${c.shown_pct}% of the time (${c.shown_count}/${c.total})`)
    }
    lines.push('')
  }

  // Top components by tier (only conditional/interesting ones — skip always-present)
  const alwaysPresent = new Set([
    'member-banner', 'alert-bar', 'employment-timeline', 'salary-table', 'service-credit-summary',
    'eligibility-panel', 'benefit-calculation', 'payment-options', 'scenario-modeler', 'ipr-panel',
  ])
  const interestingComponents = componentFreq.filter((c) => !alwaysPresent.has(c.component))
  if (interestingComponents.length > 0) {
    lines.push('### Notable Component Frequencies')
    for (const c of interestingComponents) {
      lines.push(`- Tier ${c.tier}: ${c.component} appears in ${c.pct}% of compositions`)
    }
    lines.push('')
  }

  // Common alerts
  if (alerts.length > 0) {
    lines.push('### Common Alerts')
    for (const a of alerts) {
      lines.push(`- ${a.code} (${a.severity}): ${a.pct}% of compositions`)
    }
    lines.push('')
  }

  // Performance
  if (perf.length > 0) {
    lines.push('### Performance Baselines')
    for (const p of perf) {
      lines.push(`- ${p.composed_by}: avg ${p.avg_ms}ms, p95 ${p.p95_ms}ms (n=${p.count})`)
    }
  }

  return lines.join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  console.log('=== Composition Pattern Extractor ===')
  console.log(`Output: ${args.output}`)
  console.log(`Min count threshold: ${args.minCount}`)
  console.log('')

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'derp_app',
    password: process.env.DB_PASS || 'derp_poc_2026',
    database: process.env.DB_NAME || 'derp_legacy',
  })

  try {
    // Get total composition count
    const totalRes = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM COMPOSITION_LOG WHERE STATUS IN ('OK', 'FALLBACK')`
    )
    const totalCompositions = parseInt(totalRes.rows[0]?.cnt || '0', 10)

    if (totalCompositions === 0) {
      console.log('No compositions found in COMPOSITION_LOG. Run simulate.ts first.')
      return
    }

    console.log(`Found ${totalCompositions} compositions`)

    // Run all pattern queries in parallel
    const [componentFreq, conditionals, alerts, perf] = await Promise.all([
      queryComponentFrequency(pool, args.minCount),
      queryConditionalDecisions(pool, args.minCount),
      queryAlertFrequency(pool, args.minCount),
      queryPerformanceStats(pool),
    ])

    console.log(`  Component frequencies: ${componentFreq.length} entries`)
    console.log(`  Conditional decisions: ${conditionals.length} entries`)
    console.log(`  Alert frequencies: ${alerts.length} entries`)
    console.log(`  Performance stats: ${perf.length} entries`)

    // Build output
    const promptSupplement = buildPromptSupplement(
      totalCompositions, componentFreq, conditionals, alerts, perf
    )

    const output = {
      generated_at: new Date().toISOString(),
      total_compositions: totalCompositions,
      min_count_threshold: args.minCount,
      component_frequency: componentFreq,
      conditional_decisions: conditionals,
      alert_frequency: alerts,
      performance_stats: perf,
      prompt_supplement: promptSupplement,
    }

    writeFileSync(args.output, JSON.stringify(output, null, 2))
    console.log(`\nWritten to ${args.output}`)
    console.log('\n--- Prompt Supplement Preview ---')
    console.log(promptSupplement)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Pattern extraction failed:', err)
  process.exit(1)
})
