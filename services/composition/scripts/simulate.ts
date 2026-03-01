/**
 * Simulation runner — exercises the composition service against many members.
 * Consumed by: operator (CLI tool for generating composition log volume)
 * Depends on: PostgreSQL (MEMBER_MASTER table), composition service (POST /api/v1/compose)
 *
 * Usage:
 *   npx tsx scripts/simulate.ts --count 100 [--tier 1] [--concurrency 5]
 *   npx tsx scripts/simulate.ts --demo    # Just demo cases 10001-10003
 */

import pg from 'pg'

const { Pool } = pg

// ── CLI args ──────────────────────────────────────────────────────────────────

interface Args {
  demo: boolean
  count: number
  tier: number | null
  concurrency: number
  composeUrl: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const flags: Record<string, string> = {}
  const boolFlags = new Set<string>()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[++i]
      } else {
        boolFlags.add(key)
      }
    }
  }

  return {
    demo: boolFlags.has('demo'),
    count: parseInt(flags['count'] || '100', 10),
    tier: flags['tier'] ? parseInt(flags['tier'], 10) : null,
    concurrency: parseInt(flags['concurrency'] || '5', 10),
    composeUrl: flags['url'] || 'http://localhost:8084',
  }
}

// ── Member fetching ───────────────────────────────────────────────────────────

interface MemberRow {
  mbr_id: string
  tier_cd: number
  dob: string
  hire_dt: string
  status_cd: string
}

const DEMO_IDS = ['M-100001', 'M-100002', 'M-100003']

async function fetchMembers(pool: pg.Pool, args: Args): Promise<MemberRow[]> {
  if (args.demo) {
    const res = await pool.query<MemberRow>(
      `SELECT MBR_ID, TIER_CD, DOB, HIRE_DT, STATUS_CD
       FROM MEMBER_MASTER WHERE MBR_ID = ANY($1)
       ORDER BY MBR_ID`,
      [DEMO_IDS]
    )
    return res.rows
  }

  let query = `SELECT MBR_ID, TIER_CD, DOB, HIRE_DT, STATUS_CD FROM MEMBER_MASTER`
  const params: unknown[] = []

  if (args.tier) {
    query += ` WHERE TIER_CD = $1`
    params.push(args.tier)
  }

  query += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`
  params.push(args.count)

  const res = await pool.query<MemberRow>(query, params)
  return res.rows
}

// ── Retirement date generation ────────────────────────────────────────────────

/** Generate a plausible retirement date for a member based on age and hire date. */
function generateRetirementDate(member: MemberRow): string {
  const dob = new Date(member.dob)
  const ageNow = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)

  // Retirement date: earliest eligible age + 0-5 random years, or 1-3 years from now if already eligible
  let retYear: number
  if (ageNow >= 65) {
    // Already past normal retirement age — retire within next year
    retYear = new Date().getFullYear() + Math.floor(Math.random() * 2)
  } else if (ageNow >= 55) {
    // In early retirement window — retire within next 1-5 years
    retYear = new Date().getFullYear() + 1 + Math.floor(Math.random() * 5)
  } else {
    // Not yet eligible — project to age 60-65
    const retAge = 60 + Math.floor(Math.random() * 6)
    retYear = dob.getFullYear() + retAge
  }

  const retMonth = 1 + Math.floor(Math.random() * 12)
  // Always retire on the 1st of the month (common pension convention)
  return `${retYear}-${String(retMonth).padStart(2, '0')}-01`
}

// ── Composition caller ────────────────────────────────────────────────────────

interface ComposeResult {
  memberId: string
  status: 'OK' | 'ERROR'
  durationMs: number
  composedBy: string
  error?: string
}

async function callCompose(
  baseUrl: string,
  memberId: string,
  retirementDate: string
): Promise<ComposeResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}/api/v1/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberId,
        process_type: 'retirement',
        retirement_date: retirementDate,
      }),
    })

    const elapsed = Date.now() - start
    if (!res.ok) {
      const body = await res.text()
      return { memberId, status: 'ERROR', durationMs: elapsed, composedBy: '', error: `HTTP ${res.status}: ${body}` }
    }

    const body = (await res.json()) as { data?: { composed_by?: string } }
    return {
      memberId,
      status: 'OK',
      durationMs: elapsed,
      composedBy: body.data?.composed_by ?? 'unknown',
    }
  } catch (err) {
    return {
      memberId,
      status: 'ERROR',
      durationMs: Date.now() - start,
      composedBy: '',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onProgress: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = []
  let completed = 0
  let idx = 0

  async function worker(): Promise<void> {
    while (idx < tasks.length) {
      const taskIdx = idx++
      results[taskIdx] = await tasks[taskIdx]()
      completed++
      onProgress(completed, tasks.length)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  console.log('=== Composition Simulation Runner ===')
  console.log(`Mode: ${args.demo ? 'demo cases' : `${args.count} random members`}`)
  if (args.tier) console.log(`Tier filter: ${args.tier}`)
  console.log(`Concurrency: ${args.concurrency}`)
  console.log(`Compose URL: ${args.composeUrl}`)
  console.log('')

  // Connect to DB to fetch member IDs
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'derp_app',
    password: process.env.DB_PASS || 'derp_poc_2026',
    database: process.env.DB_NAME || 'derp_legacy',
  })

  try {
    const members = await fetchMembers(pool, args)
    console.log(`Fetched ${members.length} members from database`)

    if (members.length === 0) {
      console.log('No members found — check your filters')
      return
    }

    // Build tasks
    const tasks = members.map((m) => {
      const retDate = generateRetirementDate(m)
      return () => callCompose(args.composeUrl, m.mbr_id, retDate)
    })

    const startTime = Date.now()
    const results = await runWithConcurrency(tasks, args.concurrency, (done, total) => {
      if (done % 10 === 0 || done === total) {
        process.stdout.write(`\r  Progress: ${done}/${total}`)
      }
    })
    const totalTime = Date.now() - startTime
    console.log('\n')

    // Report
    const okResults = results.filter((r) => r.status === 'OK')
    const errResults = results.filter((r) => r.status === 'ERROR')
    const agentCount = okResults.filter((r) => r.composedBy === 'agent').length
    const fallbackCount = okResults.filter((r) => r.composedBy !== 'agent').length
    const durations = okResults.map((r) => r.durationMs).sort((a, b) => a - b)

    console.log('=== Results ===')
    console.log(`Total: ${results.length} compositions in ${(totalTime / 1000).toFixed(1)}s`)
    console.log(`  OK: ${okResults.length}  (agent: ${agentCount}, fallback: ${fallbackCount})`)
    console.log(`  Errors: ${errResults.length}`)

    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const p95 = durations[Math.floor(durations.length * 0.95)]
      const min = durations[0]
      const max = durations[durations.length - 1]
      console.log(`  Duration — avg: ${avg.toFixed(0)}ms, p95: ${p95}ms, min: ${min}ms, max: ${max}ms`)
    }

    if (errResults.length > 0) {
      console.log('\n=== Errors ===')
      for (const r of errResults.slice(0, 10)) {
        console.log(`  ${r.memberId}: ${r.error}`)
      }
      if (errResults.length > 10) {
        console.log(`  ... and ${errResults.length - 10} more`)
      }
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Simulation failed:', err)
  process.exit(1)
})
