import type { H3Event } from 'h3'
import { defineEventHandler } from 'h3'
import { metrics } from '../utils/metrics'

// Feed Prometheus counters/histograms for every /v3 request. We can't
// hook the response without `event.node.res.on('finish')` because h3
// middleware runs only *before* the handler. Path is recorded in raw
// form — we collapse common dynamic segments (UUIDs, numeric ids) to
// `{id}` so the cardinality stays bounded. Anything outside /v3 is left
// alone to avoid noise from static / docs / health endpoints.

const ID_PAT = /\/\d+(?=\/|$)/g
const UUID_PAT = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/g

function normalisePath(rawUrl: string): string {
  // Drop query string and collapse high-cardinality segments.
  const noQuery = rawUrl.split('?', 1)[0]
  return noQuery.replaceAll(UUID_PAT, '/{id}').replaceAll(ID_PAT, '/{id}')
}

export default defineEventHandler((event: H3Event) => {
  const rawUrl = event.node.req.url || ''
  if (!rawUrl.startsWith('/v3')) {
    return
  }
  // Don't count the scrape endpoint itself — would inflate the counter
  // every time Prometheus pulls.
  if (rawUrl.startsWith('/v3/metrics')) {
    return
  }
  const method = (event.node.req.method || 'GET').toUpperCase()
  const path = normalisePath(rawUrl)
  const start = process.hrtime.bigint()
  event.node.res.on('finish', () => {
    const status = String(event.node.res.statusCode || 0)
    metrics.httpRequestsTotal.inc({ method, path, status })
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9
    metrics.httpRequestDuration.observe(durationSeconds, { method, path })
  })
})
