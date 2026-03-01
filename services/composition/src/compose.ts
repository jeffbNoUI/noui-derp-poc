/**
 * Core composition logic — fetches member data, calls Claude Messages API, returns WorkspaceSpec.
 * Consumed by: index.ts (POST /api/v1/compose handler)
 * Depends on: config.ts (URLs, API key), schema.ts (structured output), system-prompt.ts, fallback.ts, types.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'
import { buildSystemPrompt } from './system-prompt.js'
import { workspaceSpecSchema } from './schema.js'
import { staticCompose } from './fallback.js'
import { getPool } from './db.js'
import { logComposition, extractMemberProfile } from './logger.js'
import type { ComposeRequest, WorkspaceSpec } from './types.js'

/** Fetch JSON from a service, returning parsed data. */
async function fetchService(baseUrl: string, path: string): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`${baseUrl}${path} returned ${res.status}`)
  }
  const body = (await res.json()) as { data?: unknown }
  return body.data ?? body
}

/** POST to a service and return parsed data. */
async function postService(baseUrl: string, path: string, reqBody: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  })
  if (!res.ok) {
    throw new Error(`POST ${baseUrl}${path} returned ${res.status}`)
  }
  const respBody = (await res.json()) as { data?: unknown }
  return respBody.data ?? respBody
}

/** Convert frontend short ID (COPERA-001) to backend format (M-100001). Pass through if already prefixed. */
const DEMO_CASE_MAP: Record<string, string> = {
  'COPERA-001': 'M-100001', 'COPERA-002': 'M-100002', 'COPERA-003': 'M-100003',
}
function toBackendId(id: string): string {
  if (DEMO_CASE_MAP[id]) return DEMO_CASE_MAP[id]
  if (/^\d+$/.test(id)) return `M-${id.padStart(6, '0')}`
  return id
}

/** Fetch all member context from the connector service. */
async function fetchMemberContext(memberId: string) {
  const [member, employment, salary, serviceCredit, beneficiaries, dros] = await Promise.all([
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}`),
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}/employment`),
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}/salary`),
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}/service-credit`),
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}/beneficiaries`),
    fetchService(config.connectorUrl, `/api/v1/members/${memberId}/dro`),
  ])
  return { member, employment, salary, serviceCredit, beneficiaries, dros }
}

/** Fetch calculation results from the intelligence service. */
async function fetchCalculations(memberId: string, retirementDate: string) {
  const body = { member_id: memberId, retirement_date: retirementDate }
  const [eligibility, benefit, paymentOptions] = await Promise.all([
    postService(config.intelligenceUrl, '/api/v1/eligibility/evaluate', body),
    postService(config.intelligenceUrl, '/api/v1/benefit/calculate', body),
    postService(config.intelligenceUrl, '/api/v1/benefit/options', body),
  ])
  return { eligibility, benefit, paymentOptions }
}

/** Compose a workspace using Claude Messages API with structured outputs. */
export async function compose(req: ComposeRequest): Promise<WorkspaceSpec> {
  const startTime = Date.now()
  const requestId = randomUUID()

  // Step 1: Fetch member data from connector (map frontend short IDs to backend format)
  const backendId = toBackendId(req.member_id)
  const context = await fetchMemberContext(backendId)

  // Step 2: Optionally fetch calculations from intelligence
  let calculations = null
  if (req.retirement_date && req.process_type === 'retirement') {
    try {
      calculations = await fetchCalculations(backendId, req.retirement_date)
    } catch (err) {
      console.warn('Failed to fetch calculations (proceeding without):', err)
    }
  }

  // Step 3: Build user message with all context
  const userMessage = JSON.stringify({
    request: req,
    member: context.member,
    employment: context.employment,
    salary: context.salary,
    service_credit: context.serviceCredit,
    beneficiaries: context.beneficiaries,
    dros: context.dros,
    calculations,
  })

  // Step 4: Call Claude Messages API with structured output
  if (!config.anthropicApiKey) {
    console.warn('ANTHROPIC_API_KEY not set — using static fallback composition')
    const fallbackSpec = staticFallback(req, context)
    const elapsed = Date.now() - startTime
    const profile = extractMemberProfile(backendId, context)
    logComposition(getPool(), {
      requestId,
      memberId: backendId,
      processType: req.process_type,
      retirementDate: req.retirement_date ?? null,
      profile,
      composedBy: 'static-fallback',
      spec: fallbackSpec,
      durationMs: elapsed,
      model: null,
      status: 'FALLBACK',
      errorMessage: 'ANTHROPIC_API_KEY not set',
    })
    return fallbackSpec
  }

  try {
    const client = new Anthropic({ apiKey: config.anthropicApiKey })
    const systemPrompt = buildSystemPrompt()

    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
      // @ts-expect-error — structured output support may not be in current SDK types
      output_config: {
        format: {
          type: 'json_schema',
          schema: workspaceSpecSchema.schema,
        },
      },
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in response')
    }

    const raw = JSON.parse(textBlock.text)

    // Convert array-format maps (required by strict JSON schema) back to Record format
    const spec: WorkspaceSpec = {
      ...raw,
      conditional_components: Object.fromEntries(
        (raw.conditional_components ?? []).map((e: { component_id: string; shown: boolean }) => [e.component_id, e.shown])
      ),
      rationale: Object.fromEntries(
        (raw.rationale ?? []).map((e: { component_id: string; reason: string }) => [e.component_id, e.reason])
      ),
      composed_by: 'agent',
    }

    const elapsed = Date.now() - startTime
    console.log(`Composition completed in ${elapsed}ms (agent) for ${req.member_id}`)

    // Fire-and-forget composition log
    const profile = extractMemberProfile(backendId, context)
    logComposition(getPool(), {
      requestId,
      memberId: backendId,
      processType: req.process_type,
      retirementDate: req.retirement_date ?? null,
      profile,
      composedBy: 'agent',
      spec,
      durationMs: elapsed,
      model: config.model,
      status: 'OK',
      errorMessage: null,
    })

    return spec
  } catch (err) {
    const elapsed = Date.now() - startTime
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('Claude API call failed, falling back to static composition:', err)

    const fallbackSpec = staticFallback(req, context)

    // Log the fallback
    const profile = extractMemberProfile(backendId, context)
    logComposition(getPool(), {
      requestId,
      memberId: backendId,
      processType: req.process_type,
      retirementDate: req.retirement_date ?? null,
      profile,
      composedBy: 'static-fallback',
      spec: fallbackSpec,
      durationMs: elapsed,
      model: config.model,
      status: 'FALLBACK',
      errorMessage: errorMsg,
    })

    return fallbackSpec
  }
}

/** Build a static fallback from member context. */
function staticFallback(req: ComposeRequest, context: { member: unknown; dros: unknown }): WorkspaceSpec {
  const m = context.member as { division?: string; has_table?: number; hire_date?: string; hireDate?: string }
  const dros = context.dros as unknown[]

  return staticCompose(req, {
    division: m.division ?? 'State',
    has_table: m.has_table ?? 1,
    has_dros: Array.isArray(dros) && dros.length > 0,
  })
}
