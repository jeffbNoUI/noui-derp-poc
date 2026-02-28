/**
 * MCP server that wraps the DERP connector Go service REST endpoints as MCP tools.
 * Provides 9 tools for member data retrieval and retirement election submission.
 * Consumed by: Claude Desktop, Claude Code, or any MCP-compatible client.
 * Depends on: DERP connector Go service (default http://localhost:8081).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const CONNECTOR_URL = process.env.CONNECTOR_URL ?? 'http://localhost:8081'

/**
 * Fetches JSON from the connector service. Returns the parsed response body
 * on success, or an error object on failure.
 */
async function connectorFetch(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${CONNECTOR_URL}${path}`
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      `Connector returned ${response.status}: ${JSON.stringify(data)}`
    )
  }

  return data
}

// ---------- Server setup ----------

const server = new McpServer({
  name: 'noui-connector',
  version: '0.1.0',
})

// ---------- Tool registrations ----------

server.tool(
  'get_member',
  'Retrieve a DERP member profile by member ID',
  { member_id: z.string().describe('The member ID to look up') },
  async ({ member_id }) => {
    const data = await connectorFetch('GET', `/api/v1/members/${member_id}`)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'search_members',
  'Search for DERP members by name or other criteria',
  { query: z.string().describe('Search query string') },
  async ({ query }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/search?q=${encodeURIComponent(query)}`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_employment',
  'Retrieve employment history for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/employment`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_salary',
  'Retrieve salary history for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/salary`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_service_credit',
  'Retrieve service credit records for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/service-credit`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_beneficiaries',
  'Retrieve beneficiary designations for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/beneficiaries`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_dros',
  'Retrieve domestic relations orders (DROs) for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/dro`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'get_contributions',
  'Retrieve contribution history for a DERP member',
  { member_id: z.string().describe('The member ID') },
  async ({ member_id }) => {
    const data = await connectorFetch(
      'GET',
      `/api/v1/members/${member_id}/contributions`
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

server.tool(
  'save_retirement_election',
  'Save a retirement election for a DERP member. This records the member\'s chosen retirement date, payment option, and calculated benefit amounts.',
  {
    member_id: z.string().describe('The member ID'),
    retirement_date: z.string().describe('Elected retirement date (YYYY-MM-DD)'),
    payment_option: z.string().describe('Selected payment option code'),
    monthly_benefit: z.number().describe('Final monthly benefit amount after all adjustments'),
    gross_benefit: z.number().describe('Gross benefit amount before reductions'),
    reduction_factor: z.number().describe('Early retirement reduction factor applied'),
  },
  async ({ member_id, retirement_date, payment_option, monthly_benefit, gross_benefit, reduction_factor }) => {
    const data = await connectorFetch(
      'POST',
      `/api/v1/members/${member_id}/retirement-election`,
      {
        retirement_date,
        payment_option,
        monthly_benefit,
        gross_benefit,
        reduction_factor,
      }
    )
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    }
  }
)

// ---------- Start ----------

const transport = new StdioServerTransport()
await server.connect(transport)
