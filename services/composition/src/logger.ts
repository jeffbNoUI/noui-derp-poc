/**
 * Async composition logger — fire-and-forget persistence to COMPOSITION_LOG.
 * Consumed by: compose.ts (after each composition)
 * Depends on: db.ts (pool), types.ts (WorkspaceSpec)
 *
 * Never blocks the response — errors are logged to console and swallowed.
 */

import type pg from 'pg'
import type { WorkspaceSpec, WorkspaceAlert, KnowledgeContext } from './types.js'

/** Denormalized member profile extracted from fetched context. */
export interface MemberProfile {
  memberId: string
  tier: number | null
  status: string | null
  hireDate: string | null
  hasDro: boolean
  hasPurchasedService: boolean
  yearsOfService: number | null
}

/** Everything needed to log a composition. */
export interface CompositionLogEntry {
  requestId: string
  memberId: string
  processType: string
  retirementDate: string | null
  profile: MemberProfile
  composedBy: 'agent' | 'static-fallback'
  spec: WorkspaceSpec | null
  durationMs: number
  model: string | null
  status: 'OK' | 'ERROR' | 'FALLBACK'
  errorMessage: string | null
}

/** Extract a flat component list from all stages in a WorkspaceSpec. */
export function extractComponents(spec: WorkspaceSpec): string[] {
  return spec.stages.flatMap((s) => s.components)
}

/** Extract a denormalized member profile from the fetched context objects. */
export function extractMemberProfile(
  memberId: string,
  context: { member: unknown; dros: unknown; serviceCredit: unknown }
): MemberProfile {
  const m = context.member as Record<string, unknown> | null
  const dros = context.dros as unknown[] | null
  const svcCredits = context.serviceCredit as Array<Record<string, unknown>> | null

  const hasPurchasedService = Array.isArray(svcCredits) &&
    svcCredits.some((sc) => {
      const svcType = (sc.svc_type ?? sc.svcType ?? '') as string
      return svcType.toUpperCase() === 'PURCHASED'
    })

  // Sum years of service from all credit records
  let yearsOfService: number | null = null
  if (Array.isArray(svcCredits) && svcCredits.length > 0) {
    yearsOfService = svcCredits.reduce((sum, sc) => {
      const yrs = Number(sc.years_credit ?? sc.yearsCredit ?? 0)
      return sum + (isNaN(yrs) ? 0 : yrs)
    }, 0)
  }

  return {
    memberId,
    tier: m ? Number(m.tier ?? m.tier_cd ?? null) || null : null,
    status: m ? String(m.status ?? m.status_cd ?? '') || null : null,
    hireDate: m ? String(m.hire_date ?? m.hireDate ?? m.hire_dt ?? '') || null : null,
    hasDro: Array.isArray(dros) && dros.length > 0,
    hasPurchasedService,
    yearsOfService,
  }
}

const INSERT_SQL = `
  INSERT INTO COMPOSITION_LOG (
    REQUEST_ID, MEMBER_ID, PROCESS_TYPE, RETIREMENT_DATE,
    MEMBER_TIER, MEMBER_STATUS, HIRE_DATE, HAS_DRO, HAS_PURCHASED_SVC, YEARS_OF_SERVICE,
    COMPOSED_BY, COMPONENT_LIST, CONDITIONALS, RATIONALE, ALERTS, KNOWLEDGE_CONTEXT, FULL_SPEC,
    DURATION_MS, MODEL_USED, STATUS, ERROR_MESSAGE
  ) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17,
    $18, $19, $20, $21
  )
`

/** Write a composition log entry. Called without await — errors are swallowed. */
function writeLog(pool: pg.Pool, entry: CompositionLogEntry): void {
  const components = entry.spec ? extractComponents(entry.spec) : []
  const conditionals = entry.spec ? entry.spec.conditional_components : null
  const rationale = entry.spec ? entry.spec.rationale : null
  const alerts = entry.spec ? entry.spec.alerts : null
  const knowledge = entry.spec ? entry.spec.knowledge_context : null

  const values = [
    entry.requestId,
    entry.memberId,
    entry.processType,
    entry.retirementDate,
    entry.profile.tier,
    entry.profile.status,
    entry.profile.hireDate,
    entry.profile.hasDro,
    entry.profile.hasPurchasedService,
    entry.profile.yearsOfService,
    entry.composedBy,
    components,
    conditionals ? JSON.stringify(conditionals) : null,
    rationale ? JSON.stringify(rationale) : null,
    alerts ? JSON.stringify(alerts) : null,
    knowledge ? JSON.stringify(knowledge) : null,
    entry.spec ? JSON.stringify(entry.spec) : null,
    entry.durationMs,
    entry.model,
    entry.status,
    entry.errorMessage,
  ]

  pool.query(INSERT_SQL, values).catch((err) => {
    console.error('Failed to write composition log:', err.message)
  })
}

/** Fire-and-forget composition logging. Does nothing if pool is null. */
export function logComposition(pool: pg.Pool | null, entry: CompositionLogEntry): void {
  if (!pool) return
  writeLog(pool, entry)
}
