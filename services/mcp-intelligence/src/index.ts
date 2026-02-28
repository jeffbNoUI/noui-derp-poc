/**
 * MCP server wrapping the DERP Intelligence Go service REST endpoints.
 * Exposes 8 tools (eligibility, benefit, payment options, scenario, DRO, refund,
 * death processing, retirement estimate) as MCP tool calls over stdio transport.
 * Consumed by: Any MCP client (Claude Desktop, Claude Code, etc.)
 * Depends on: Intelligence Go service at INTELLIGENCE_URL (default http://localhost:8082)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const INTELLIGENCE_URL = process.env.INTELLIGENCE_URL ?? 'http://localhost:8082'

// ---------------------------------------------------------------------------
// Helper: call intelligence REST endpoint and return parsed JSON
// ---------------------------------------------------------------------------

async function callIntelligence(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const url = `${INTELLIGENCE_URL}${path}`
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body && method === 'POST') {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const text = await res.text()

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    // Non-JSON response — return raw text wrapped in an object
    data = { raw: text }
  }

  if (!res.ok) {
    return { error: true, status: res.status, body: data }
  }
  return data
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'noui-intelligence',
  version: '0.1.0',
})

// 1. evaluate_eligibility — POST /api/v1/eligibility/evaluate
server.tool(
  'evaluate_eligibility',
  'Evaluate retirement eligibility for a DERP member. Returns eligibility type (normal, early, deferred, not_eligible), tier, Rule of 75/85 status, vesting, and reduction factors.',
  {
    member_id: z.string().describe('DERP member ID (e.g. "M-100001")'),
    retirement_date: z.string().describe('Target retirement date in YYYY-MM-DD format'),
  },
  async ({ member_id, retirement_date }) => {
    const data = await callIntelligence('POST', '/api/v1/eligibility/evaluate', {
      member_id,
      retirement_date,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 2. calculate_benefit — POST /api/v1/benefit/calculate
server.tool(
  'calculate_benefit',
  'Calculate the retirement benefit for a DERP member. Returns AMS, multiplier, service years, reduction factor, and maximum monthly benefit with full formula audit trail.',
  {
    member_id: z.string().describe('DERP member ID'),
    retirement_date: z.string().describe('Retirement date in YYYY-MM-DD format'),
  },
  async ({ member_id, retirement_date }) => {
    const data = await callIntelligence('POST', '/api/v1/benefit/calculate', {
      member_id,
      retirement_date,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 3. calculate_payment_options — POST /api/v1/benefit/options
server.tool(
  'calculate_payment_options',
  'Calculate payment options (Maximum, Joint & Survivor 100%/75%/50%) for a DERP member. Includes DRO adjustment if applicable.',
  {
    member_id: z.string().describe('DERP member ID'),
    retirement_date: z.string().describe('Retirement date in YYYY-MM-DD format'),
  },
  async ({ member_id, retirement_date }) => {
    const data = await callIntelligence('POST', '/api/v1/benefit/options', {
      member_id,
      retirement_date,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 4. calculate_scenario — POST /api/v1/benefit/scenario
server.tool(
  'calculate_scenario',
  'Run what-if scenario modeling for a DERP member across multiple potential retirement dates. Returns benefit comparison, salary growth projections, and threshold proximity analysis.',
  {
    member_id: z.string().describe('DERP member ID'),
    retirement_dates: z.array(z.string()).describe('Array of retirement dates in YYYY-MM-DD format. First date is the "current" scenario; subsequent dates are what-if alternatives.'),
  },
  async ({ member_id, retirement_dates }) => {
    const data = await callIntelligence('POST', '/api/v1/benefit/scenario', {
      member_id,
      retirement_dates,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 5. calculate_dro — POST /api/v1/dro/calculate
server.tool(
  'calculate_dro',
  'Calculate Domestic Relations Order (DRO) benefit split for a DERP member. Returns marital fraction, alternate payee share, and member remaining benefit.',
  {
    member_id: z.string().describe('DERP member ID'),
    retirement_date: z.string().optional().describe('Retirement date in YYYY-MM-DD format (optional — uses current date if omitted)'),
  },
  async ({ member_id, retirement_date }) => {
    const body: Record<string, unknown> = { member_id }
    if (retirement_date) {
      body.retirement_date = retirement_date
    }
    const data = await callIntelligence('POST', '/api/v1/dro/calculate', body)
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 6. calculate_refund — POST /api/v1/refund/calculate
server.tool(
  'calculate_refund',
  'Calculate contribution refund for a terminated DERP member. Returns refund amount, interest, and vesting status.',
  {
    member_id: z.string().describe('DERP member ID'),
    termination_date: z.string().describe('Termination date in YYYY-MM-DD format'),
    total_contributions: z.number().describe('Total employee contributions in dollars'),
    total_interest: z.number().describe('Total accrued interest in dollars'),
    service_years: z.number().describe('Total years of credited service'),
    vested: z.string().describe('Whether the member is vested ("true" or "false")'),
  },
  async ({ member_id, termination_date, total_contributions, total_interest, service_years, vested }) => {
    const data = await callIntelligence('POST', '/api/v1/refund/calculate', {
      member_id,
      termination_date,
      total_contributions,
      total_interest,
      service_years,
      vested,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 7. process_death — POST /api/v1/death/process
server.tool(
  'process_death',
  'Process a death notification for a DERP member. Returns death benefit amount, survivor benefit eligibility, and required actions.',
  {
    member_id: z.string().describe('DERP member ID'),
    death_date: z.string().optional().describe('Date of death in YYYY-MM-DD format (optional)'),
    notification_source: z.string().describe('Source of death notification (e.g. "beneficiary", "employer", "ssa_death_index")'),
  },
  async ({ member_id, death_date, notification_source }) => {
    const body: Record<string, unknown> = { member_id, notification_source }
    if (death_date) {
      body.death_date = death_date
    }
    const data = await callIntelligence('POST', '/api/v1/death/process', body)
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// 8. get_retirement_estimate — GET /api/v1/retirement-estimate/{member_id}?retirementDate={date}
server.tool(
  'get_retirement_estimate',
  'Get a complete retirement estimate for a DERP member. Runs the full pipeline: eligibility, benefit calculation, DRO (if applicable), payment options, and COLA eligibility — all in one call.',
  {
    member_id: z.string().describe('DERP member ID'),
    retirement_date: z.string().describe('Target retirement date in YYYY-MM-DD format'),
  },
  async ({ member_id, retirement_date }) => {
    const path = `/api/v1/retirement-estimate/${encodeURIComponent(member_id)}?retirementDate=${encodeURIComponent(retirement_date)}`
    const data = await callIntelligence('GET', path)
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
