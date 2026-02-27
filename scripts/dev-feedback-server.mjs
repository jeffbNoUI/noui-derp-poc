/**
 * Dev feedback bridge — zero-dependency Node HTTP server that receives feedback
 * entries from the DevFeedbackOverlay and writes them to dev-feedback.json on disk.
 * POST /feedback/batch signals Claude Code to pick up and implement the batch.
 * Consumed by: Claude Code (reads dev-feedback.json and dev-feedback-ready signal)
 * Depends on: Nothing (standalone script, built-in http + fs only)
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PORT = 3001
const FILE = resolve(import.meta.dirname, '..', 'dev-feedback.json')
const SIGNAL = resolve(import.meta.dirname, '..', 'dev-feedback-ready')

function readFile() {
  try { return JSON.parse(readFileSync(FILE, 'utf8')) }
  catch { return [] }
}

function writeFile(data) {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n')
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  cors(res)

  // CORS preflight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Batch signal — overlay says "ready for Claude to pick up"
  if (req.url === '/feedback/batch' && req.method === 'POST') {
    const entries = readFile()
    writeFileSync(SIGNAL, new Date().toISOString())
    console.log(`\n[dev] ★ BATCH READY — ${entries.length} entries queued for Claude`)
    json(res, 200, { ok: true, count: entries.length })
    return
  }

  if (req.url !== '/feedback') { json(res, 404, { error: 'not found' }); return }

  if (req.method === 'GET') {
    json(res, 200, readFile())
    return
  }

  if (req.method === 'DELETE') {
    writeFile([])
    console.log('[dev] cleared feedback file')
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const entry = JSON.parse(body)
        const entries = readFile()
        entries.unshift(entry)
        writeFile(entries)
        const preview = (entry.comment || '').slice(0, 60)
        console.log(`[dev] ${entry.route} — ${preview}`)
        json(res, 200, { ok: true })
      } catch (err) {
        json(res, 400, { error: 'invalid JSON' })
      }
    })
    return
  }

  json(res, 405, { error: 'method not allowed' })
})

server.listen(PORT, () => {
  console.log(`[dev-feedback] listening on http://localhost:${PORT}/feedback`)
  console.log(`[dev-feedback] writing to ${FILE}`)
})
