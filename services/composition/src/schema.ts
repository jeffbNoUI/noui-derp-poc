/**
 * JSON schema for structured output from Claude Messages API.
 * Passed via output_config.format.type = "json_schema" to guarantee valid JSON.
 * Consumed by: compose.ts (Messages API call)
 * Depends on: types.ts (WorkspaceSpec matches this schema)
 */

export const workspaceSpecSchema = {
  name: 'workspace_spec',
  description: 'Workspace composition specification for a pension administration workspace',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      stages: {
        type: 'array' as const,
        description: 'Ordered workspace stages with their components',
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const, description: 'Stage identifier (e.g., "member-review", "eligibility")' },
            label: { type: 'string' as const, description: 'Human-readable stage label' },
            order: { type: 'number' as const, description: 'Display order (1-based)' },
            components: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Component IDs to render in this stage',
            },
          },
          required: ['id', 'label', 'order', 'components'] as const,
          additionalProperties: false,
        },
      },
      conditional_components: {
        type: 'object' as const,
        description: 'Map of conditional component ID to whether it should be shown',
        additionalProperties: { type: 'boolean' as const },
      },
      rationale: {
        type: 'object' as const,
        description: 'Map of component ID to reason for inclusion or exclusion',
        additionalProperties: { type: 'string' as const },
      },
      alerts: {
        type: 'array' as const,
        description: 'Workspace-level alerts',
        items: {
          type: 'object' as const,
          properties: {
            severity: { type: 'string' as const, enum: ['info', 'warning', 'error'] },
            code: { type: 'string' as const },
            message: { type: 'string' as const },
          },
          required: ['severity', 'code', 'message'] as const,
          additionalProperties: false,
        },
      },
      knowledge_context: {
        type: 'array' as const,
        description: 'Relevant DERP provisions for this workspace',
        items: {
          type: 'object' as const,
          properties: {
            provision_id: { type: 'string' as const },
            title: { type: 'string' as const },
            citation: { type: 'string' as const },
            relevance: { type: 'string' as const },
          },
          required: ['provision_id', 'title', 'citation', 'relevance'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['stages', 'conditional_components', 'rationale', 'alerts', 'knowledge_context'] as const,
    additionalProperties: false,
  },
}
