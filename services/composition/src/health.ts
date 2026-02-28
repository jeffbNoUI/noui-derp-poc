/**
 * Health check endpoint for the composition service.
 * Consumed by: index.ts (GET /healthz route)
 * Depends on: nothing
 */

import type { Request, Response } from 'express'

export function healthHandler(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'composition',
    version: '0.1.0',
  })
}
