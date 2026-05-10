// Mirror the upstream OpenAPI 3.1 spec on the web origin so agents can
// fetch a single canonical URL: https://codetime.dev/openapi.json
import { defineEventHandler, setHeader } from 'h3'

const UPSTREAM = 'https://api.codetime.dev/v3/docs/openapi.json'

let cache: { ts: number, body: unknown } | null = null
const TTL_MS = 5 * 60 * 1000

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/openapi+json; version=3.1')
  setHeader(event, 'Cache-Control', 'public, max-age=300')

  if (cache && Date.now() - cache.ts < TTL_MS) {
    return cache.body
  }

  try {
    const res = await fetch(UPSTREAM)
    if (!res.ok) {
      throw new Error(`upstream ${res.status}`)
    }
    const body = await res.json()
    cache = { ts: Date.now(), body }
    return body
  }
  catch {
    if (cache) {
      return cache.body
    }
    setHeader(event, 'Content-Type', 'application/json')
    event.node.res.statusCode = 502
    return {
      error: 'upstream_unavailable',
      upstream: UPSTREAM,
    }
  }
})
