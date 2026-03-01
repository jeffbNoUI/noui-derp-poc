/**
 * Service configuration from environment variables.
 * Consumed by: index.ts (server setup), compose.ts (API calls)
 * Depends on: nothing (reads process.env)
 */

export const config = {
  port: parseInt(process.env.PORT || '8084', 10),
  connectorUrl: process.env.CONNECTOR_URL || 'http://localhost:8081',
  intelligenceUrl: process.env.INTELLIGENCE_URL || 'http://localhost:8082',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.COMPOSITION_MODEL || 'claude-sonnet-4-6',
  maxTokens: parseInt(process.env.MAX_TOKENS || '4096', 10),
  /** Path to extracted patterns JSON for system prompt injection. Empty = disabled. */
  patternsFile: process.env.PATTERNS_FILE || '',
}
