/**
 * Type definitions for the composition service.
 * Consumed by: compose.ts, schema.ts, fallback.ts
 * Depends on: nothing (standalone type definitions)
 */

/** Request to compose a workspace. */
export interface ComposeRequest {
  member_id: string
  process_type: 'retirement' | 'refund' | 'death'
  retirement_date?: string
}

/** A stage in the workspace. */
export interface WorkspaceStage {
  id: string
  label: string
  order: number
  components: string[]
}

/** An alert to display in the workspace. */
export interface WorkspaceAlert {
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
}

/** Knowledge context for a provision. */
export interface KnowledgeContext {
  provision_id: string
  title: string
  citation: string
  relevance: string
}

/** The structured output from the composition agent. */
export interface WorkspaceSpec {
  stages: WorkspaceStage[]
  conditional_components: Record<string, boolean>
  rationale: Record<string, string>
  alerts: WorkspaceAlert[]
  knowledge_context: KnowledgeContext[]
  composed_by: 'agent' | 'static-fallback'
}
