#!/usr/bin/env node
// Backfill `users.github_login` for accounts linked to GitHub before the
// 2026-05-28 column was added (i.e. github_id populated, github_login NULL).
//
// Reverse-resolves each numeric github_id → login via GitHub's REST API
// (`GET /user/:id`). Authenticated with the existing OAuth app's
// client_id:secret to lift the rate limit from 60/h (anon) → 5000/h
// (Basic auth). We pace below that anyway because the script is idempotent
// and there is no rush.
//
// SAFE TO RE-RUN. Each iteration only selects rows where github_login IS
// NULL, so resuming a halted run picks up where it left off. Soft-deleted
// users (deleted_at IS NOT NULL) are excluded — we'd just write to a
// tombstone otherwise.
//
// Usage:
//   node --env-file=.env scripts/backfill-github-login.mjs              # run
//   RPS=2 node --env-file=.env scripts/backfill-github-login.mjs        # faster
//   LIMIT=200 node --env-file=.env scripts/backfill-github-login.mjs    # smoke
//   DRY_RUN=1 node --env-file=.env scripts/backfill-github-login.mjs    # plan
//
// Env:
//   RPS                  requests-per-second cap (default 1, max 4)
//   LIMIT                stop after this many rows (default unlimited)
//   DRY_RUN              do not write to DB; print actions
//   GITHUB_CLIENT_*      auth (from .env)
//   POSTGRES_*           DB connection (from .env)

import process from 'node:process'
import postgres from 'postgres'

const CLIENT_ID = process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('NUXT_PUBLIC_GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set. Aborting.')
  process.exit(1)
}

const DRY_RUN = process.env.DRY_RUN === '1'
const RPS = Math.max(0.1, Math.min(4, Number(process.env.RPS ?? 1)))
const LIMIT = Number(process.env.LIMIT) > 0 ? Number(process.env.LIMIT) : null
const INTERVAL_MS = Math.round(1000 / RPS)

const sql = postgres({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'postgres',
  ssl: false,
  max: 2,
})

const AUTH = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
const HEADERS = {
  'authorization': AUTH,
  'accept': 'application/vnd.github+json',
  'user-agent': 'codetime-backfill/1.0',
  'x-github-api-version': '2022-11-28',
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchLogin(githubId) {
  const res = await fetch(`https://api.github.com/user/${githubId}`, { headers: HEADERS })
  if (res.status === 404) {
    return { kind: 'gone' }
  }
  if (res.status === 403 || res.status === 429) {
    // Rate-limited or abuse-detection. The Retry-After header is
    // sometimes a positive integer (seconds) when 429; otherwise we back
    // off until x-ratelimit-reset (epoch seconds).
    const retryAfter = Number(res.headers.get('retry-after'))
    const reset = Number(res.headers.get('x-ratelimit-reset'))
    let waitMs = 60_000
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      waitMs = retryAfter * 1000
    }
    else if (Number.isFinite(reset) && reset > 0) {
      waitMs = Math.max(1000, reset * 1000 - Date.now())
    }
    return { kind: 'ratelimit', waitMs }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { kind: 'error', status: res.status, body: body.slice(0, 200) }
  }
  const body = await res.json()
  const login = typeof body?.login === 'string' ? body.login : null
  if (!login) {
    return { kind: 'error', status: 200, body: 'no login in body' }
  }
  return { kind: 'ok', login, remaining: Number(res.headers.get('x-ratelimit-remaining') || 0) }
}

async function main() {
  const targetClause = sql`
    FROM users
    WHERE github_id IS NOT NULL
      AND github_id <> 0
      AND github_login IS NULL
      AND deleted_at IS NULL
  `
  const [{ count: total }] = await sql`SELECT COUNT(*)::int AS count ${targetClause}`
  if (total === 0) {
    console.log('No users need backfill. Nothing to do.')
    await sql.end()
    return
  }
  const planLimit = LIMIT ?? total
  console.log(`[backfill] target rows: ${total}; processing up to ${planLimit} at ${RPS} req/s (${INTERVAL_MS} ms interval)`)
  if (DRY_RUN) {
    console.log('[backfill] DRY_RUN=1 — no DB writes will be performed')
  }

  let processed = 0
  let ok = 0
  let gone = 0
  let errors = 0
  let lastRemaining = null

  // Cursor pagination by id keeps us stable even if rows shift between
  // batches (e.g. a concurrent login populates github_login mid-run).
  const PAGE = 100
  let cursor = 0
  while (processed < planLimit) {
    const remaining = planLimit - processed
    const fetchLimit = Math.min(PAGE, remaining)
    const rows = await sql`
      SELECT id, github_id
      ${targetClause}
        AND id > ${cursor}
      ORDER BY id ASC
      LIMIT ${fetchLimit}
    `
    if (rows.length === 0) {
      break
    }

    for (const row of rows) {
      const result = await fetchLogin(row.github_id)
      processed++
      if (result.kind === 'ok') {
        if (!DRY_RUN) {
          await sql`
            UPDATE users
            SET github_login = ${result.login}, updated_at = now()
            WHERE id = ${row.id}
              AND github_login IS NULL
          `
        }
        ok++
        lastRemaining = result.remaining
      }
      else if (result.kind === 'gone') {
        // GitHub account deleted / suspended. Leave github_login NULL —
        // we have no login to write, and any future re-link would
        // populate it then.
        gone++
      }
      else if (result.kind === 'ratelimit') {
        console.warn(`[backfill] rate-limited; sleeping ${Math.round(result.waitMs / 1000)}s`)
        await sleep(result.waitMs + 500)
        // Re-try the same row immediately after waking, so a 429 hit
        // never silently skips a user.
        const retry = await fetchLogin(row.github_id)
        if (retry.kind === 'ok') {
          if (!DRY_RUN) {
            await sql`
              UPDATE users
              SET github_login = ${retry.login}, updated_at = now()
              WHERE id = ${row.id}
                AND github_login IS NULL
            `
          }
          ok++
          lastRemaining = retry.remaining
        }
        else if (retry.kind === 'gone') {
          gone++
        }
        else {
          errors++
          console.warn(`[backfill] retry failed for uid=${row.id} gh=${row.github_id}: ${JSON.stringify(retry)}`)
        }
      }
      else {
        errors++
        console.warn(`[backfill] failed uid=${row.id} gh=${row.github_id}: ${JSON.stringify(result)}`)
      }

      cursor = row.id

      if (processed % 50 === 0) {
        const pct = ((processed / planLimit) * 100).toFixed(1)
        console.log(`[backfill] ${processed}/${planLimit} (${pct}%) ok=${ok} gone=${gone} err=${errors} remaining_quota=${lastRemaining ?? '?'}`)
      }

      if (processed >= planLimit) {
        break
      }

      await sleep(INTERVAL_MS)
    }
  }

  console.log(`[backfill] done. processed=${processed} ok=${ok} gone=${gone} err=${errors}`)
  await sql.end()
}

main().catch(async (e) => {
  console.error('[backfill] fatal:', e)
  try {
    await sql.end()
  }
  catch {}
  process.exit(1)
})
