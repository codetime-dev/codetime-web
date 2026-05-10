// Helpers for widget endpoints: fetch from upstream codetime API & set
// SVG response headers consistently.

import type { H3Event } from 'h3'
import { createError, getRequestURL, setHeader, setResponseStatus } from 'h3'

const FALLBACK_API = 'https://api.codetime.dev'

function getApiHost(event: H3Event): string {
  // Mirror nuxt runtime config without importing #imports here
  const env = process.env.NUXT_PUBLIC_API_HOST
  if (env) {
    return env.replace(/\/$/, '')
  }
  // Allow tests to call against the same origin if explicitly proxied
  try {
    const url = getRequestURL(event)
    const headerOverride = event.node.req.headers['x-codetime-api']
    if (typeof headerOverride === 'string' && headerOverride.length > 0) {
      return headerOverride.replace(/\/$/, '')
    }
    if (url.hostname === 'localhost') {
      return FALLBACK_API
    }
  }
  catch {
    // ignore
  }
  return FALLBACK_API
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
