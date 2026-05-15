// Helpers for widget endpoints: fetch from the local Nuxt backend & set
// SVG response headers consistently.
//
// Historically these proxied to `api.codetime.dev` because the Python
// service owned `/v3/*`. The Nuxt backend now serves every widget
// dependency in-process (see server/routes/v3/users/...), so we resolve
// the API host from the inbound request's own origin and let Nitro
// route the fetch internally. `NUXT_PUBLIC_API_HOST` is still honoured
// as an escape hatch for staging environments that want to test against
// a remote backend without touching this file.

import type { H3Event } from 'h3'
import process from 'node:process'
import { createError, getRequestURL, setHeader, setResponseStatus } from 'h3'

function getApiHost(event: H3Event): string {
  const env = process.env.NUXT_PUBLIC_API_HOST
  if (env) {
    return env.replace(/\/$/, '')
  }
  const headerOverride = event.node.req.headers['x-codetime-api']
  if (typeof headerOverride === 'string' && headerOverride.length > 0) {
    return headerOverride.replace(/\/$/, '')
  }
  // Same-origin loopback. `getRequestURL(event)` reflects whatever host
  // Nginx / Cloudflare forwarded as, so prod hits codetime.dev and dev
  // hits localhost:3001 without any per-environment branching.
  const url = getRequestURL(event)
  return `${url.protocol}//${url.host}`
}

export async function fetchWidgetJson<T>(event: H3Event, path: string): Promise<T> {
  const host = getApiHost(event)
  const url = `${host}${path.startsWith('/') ? path : `/${path}`}`
  const resp = await fetch(url, { headers: { accept: 'application/json' } })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw createError({
      statusCode: resp.status,
      statusMessage: text || resp.statusText || 'upstream error',
    })
  }
  return resp.json() as Promise<T>
}

export function sendSvg(event: H3Event, svg: string, opts?: { cacheSeconds?: number }): string {
  const cacheSeconds = opts?.cacheSeconds ?? 300
  setHeader(event, 'content-type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'cache-control', `public, max-age=60, s-maxage=${cacheSeconds}`)
  setHeader(event, 'access-control-allow-origin', '*')
  setResponseStatus(event, 200)
  return svg
}
