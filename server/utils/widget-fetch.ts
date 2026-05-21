// Helpers for widget endpoints: fetch JSON from the local Nuxt backend
// and set SVG response headers consistently.
//
// `$fetch` is Nitro's internal dispatcher — when the path is local it
// short-circuits straight to the matching handler, skipping the
// TCP/TLS/HTTP roundtrip that a `fetch()` of the same origin would
// incur. `NUXT_PUBLIC_API_HOST` is still honoured as an escape hatch
// for staging environments that want to proxy widget JSON through a
// remote backend.

import type { H3Event } from 'h3'
import process from 'node:process'
import { createError, setHeader, setResponseStatus } from 'h3'

type FetchError = { statusCode?: number, response?: { status?: number }, data?: unknown }

export async function fetchWidgetJson<T>(_event: H3Event, path: string): Promise<T> {
  const remoteHost = (process.env.NUXT_PUBLIC_API_HOST || '').replace(/\/$/, '')
  const url = remoteHost
    ? `${remoteHost}${path.startsWith('/') ? path : `/${path}`}`
    : (path.startsWith('/') ? path : `/${path}`)
  try {
    return await $fetch<T>(url, { headers: { accept: 'application/json' } })
  }
  catch (error) {
    const err = error as FetchError
    const status = err.statusCode ?? err.response?.status ?? 500
    throw createError({ statusCode: status, statusMessage: typeof err.data === 'string' ? err.data : 'upstream error' })
  }
}

export function sendSvg(event: H3Event, svg: string, opts?: { cacheSeconds?: number }): string {
  const cacheSeconds = opts?.cacheSeconds ?? 300
  setHeader(event, 'content-type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'cache-control', `public, max-age=60, s-maxage=${cacheSeconds}`)
  setHeader(event, 'access-control-allow-origin', '*')
  setResponseStatus(event, 200)
  return svg
}
