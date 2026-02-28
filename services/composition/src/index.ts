/**
 * Composition service entry point — Express server on configurable port.
 * AI workspace composition via Claude Messages API with structured outputs.
 * Falls back to static composition when ANTHROPIC_API_KEY is unset or API fails.
 *
 * Consumed by: frontend (?agent mode), docker-compose
 * Depends on: compose.ts (composition logic), health.ts, config.ts
 */

import express from 'express'
import { config } from './config.js'
import { compose } from './compose.js'
import { healthHandler } from './health.js'
import type { ComposeRequest } from './types.js'

const app = express()
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/healthz', healthHandler)

// Composition endpoint
app.post('/api/v1/compose', async (req, res) => {
  const body = req.body as ComposeRequest

  if (!body.member_id) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'member_id is required' } })
    return
  }
  if (!body.process_type) {
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'process_type is required' } })
    return
  }

  try {
    const spec = await compose(body)
    res.json({ data: spec, meta: { service: 'composition', version: '0.1.0' } })
  } catch (err) {
    console.error('Composition failed:', err)
    res.status(500).json({
      error: { code: 'COMPOSITION_FAILED', message: 'Failed to compose workspace' },
    })
  }
})

app.listen(config.port, () => {
  console.log(`Composition service listening on port ${config.port}`)
  console.log(`Connector URL: ${config.connectorUrl}`)
  console.log(`Intelligence URL: ${config.intelligenceUrl}`)
  console.log(`API key configured: ${config.anthropicApiKey ? 'yes' : 'NO (static fallback mode)'}`)
  console.log(`Model: ${config.model}`)
})

export default app
