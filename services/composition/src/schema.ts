/**
 * JSON schema for structured output from Claude Messages API.
 * Passed via output_config.format.type = "json_schema" to guarantee valid JSON.
 * Strict mode requires additionalProperties: false on all objects, so maps
 * are represented as arrays of {key, value} pairs.
 * Consumed by: compose.ts (Messages API call)
 * Depends on: types.ts (WorkspaceSpec matches this schema after post-processing)
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
        type: 'array' as const,
        description: 'Conditional component decisions — each entry is a component ID and whether to show it',
        items: {
          type: 'object' as const,
          properties: {
            component_id: { type: 'string' as const },
            shown: { type: 'boolean' as const },
          },
          required: ['component_id', 'shown'] as const,
          additionalProperties: false,
        },
      },
      rationale: {
        type: 'array' as const,
        description: 'Per-component reasoning — each entry is a component ID and the reason for inclusion or exclusion',
        items: {
          type: 'object' as const,
          properties: {
            component_id: { type: 'string' as const },
            reason: { type: 'string' as const },
          },
          required: ['component_id', 'reason'] as const,
          additionalProperties: false,
        },
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
