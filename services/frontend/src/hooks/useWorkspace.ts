/**
 * Hook for workspace composition — resolves to either static (demo/live) or agent-composed workspace.
 * Consumed by: workspace components (BenefitWorkspace, etc.)
 * Depends on: api/client.ts (resolveApiMode), composition/rules.ts (static compose),
 *             hooks/useMember.ts (member data for static compose)
 */

import { useQuery } from '@tanstack/react-query'
import { resolveApiMode } from '@/api/client'
import { composeWorkspace } from '@/composition/rules'
import { useMember, useDROs } from '@/hooks/useMember'
import type { CompositionResult } from '@/composition/rules'

interface AgentWorkspaceSpec {
  stages: { id: string; label: string; order: number; components: string[] }[]
  conditional_components: Record<string, boolean>
  rationale: Record<string, string>
  alerts: { severity: string; code: string; message: string }[]
  knowledge_context: { provision_id: string; title: string; citation: string; relevance: string }[]
  composed_by: 'agent' | 'static-fallback'
}

interface WorkspaceResult {
  composition: CompositionResult
  agent?: AgentWorkspaceSpec
  mode: 'demo' | 'live' | 'agent'
}

export function useWorkspace(
  memberId: string,
  processType: string,
  hasRetirementDate?: boolean,
  reductionFactor?: number,
  retirementDate?: string,
): WorkspaceResult {
  const mode = resolveApiMode()
  const member = useMember(memberId)
  const dros = useDROs(memberId)

  // Agent mode: fetch from composition service
  const agentQuery = useQuery({
    queryKey: ['workspace', memberId, processType, retirementDate, 'agent'],
    queryFn: async () => {
      const res = await fetch('/api/v1/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          process_type: processType,
          retirement_date: retirementDate,
        }),
      })
      if (!res.ok) throw new Error(`Composition failed: ${res.status}`)
      const body = await res.json()
      return body.data as AgentWorkspaceSpec
    },
    enabled: mode === 'agent' && !!memberId,
  })

  // Static composition for demo/live modes (or agent fallback)
  const staticComposition = member.data
    ? composeWorkspace(member.data, undefined, dros.data, hasRetirementDate, reductionFactor)
    : { components: [], reason: {} as Record<string, string> }

  return {
    composition: staticComposition,
    agent: agentQuery.data ?? undefined,
    mode,
  }
}
