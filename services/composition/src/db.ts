/**
 * Database connection pool for composition logging.
 * Consumed by: index.ts (lifecycle), logger.ts (writes), simulate.ts/extract-patterns.ts (scripts)
 * Depends on: pg, config.ts (env vars: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)
 *
 * Logging is optional — if DB_HOST is unset, the pool is null and logging is silently disabled.
 */

import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

/** Create a connection pool from environment variables. Returns null if DB_HOST is unset. */
export function initPool(): pg.Pool | null {
  const host = process.env.DB_HOST
  if (!host) {
    console.log('DB_HOST not set — composition logging disabled')
    return null
  }

  pool = new Pool({
    host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'copera_app',
    password: process.env.DB_PASS || 'copera_poc_2026',
    database: process.env.DB_NAME || 'copera_legacy',
    max: 5,
    idleTimeoutMillis: 30_000,
  })

  pool.on('error', (err) => {
    console.error('Unexpected pool error:', err.message)
  })

  console.log(`Composition logging enabled (${host}:${process.env.DB_PORT || '5432'})`)
  return pool
}

/** Get the current pool (null if logging is disabled). */
export function getPool(): pg.Pool | null {
  return pool
}

/** Gracefully close the pool. */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
