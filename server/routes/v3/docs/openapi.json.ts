import { defineEventHandler, getRequestURL, setHeader } from 'h3'
// @ts-expect-error Nitro virtual module; types are generated at build time.
import { handlersMeta } from '#nitro-internal-virtual/server-handlers-meta'

// Builds the OpenAPI document directly from Nitro's per-route
// defineRouteMeta blocks (the same virtual module Nitro's own
// /_openapi.json handler uses). We don't $fetch /_openapi.json because:
//   - on stale prod builds it isn't enabled and returns the SPA 404 page,
//     which makes the filter return garbage character-indexed objects;
//   - we want to control which paths and base URL are exposed.
//
// Only routes under /v3/* (excluding /v3/docs/*) are included, so the
// public surface stays scoped to migrated endpoints.

type HandlerMeta = {
  route?: string
  method?: string
  meta?: { openAPI?: Record<string, unknown> & { $global?: unknown } }
}

function normaliseRoute(route: string): { route: string, parameters: Array<{ name: string, in: 'path', required: true, schema: { type: 'string' } }> } {
  const parameters: Array<{ name: string, in: 'path', required: true, schema: { type: 'string' } }> = []
  const normalised = route.replaceAll(/:(\w+)/g, (_, name) => `{${name}}`)
  for (const m of normalised.matchAll(/\{(\w+)\}/g)) {
    parameters.push({ name: m[1] ?? '', in: 'path', required: true, schema: { type: 'string' } })
  }
  return { route: normalised, parameters }
}

function deepMerge<T extends Record<string, any>>(a: T, b: T): T {
  const out: Record<string, any> = { ...a }
  for (const [k, v] of Object.entries(b ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' ? deepMerge(out[k], v) : v
  }
  return out as T
}

function buildSpec(origin: string) {
  const paths: Record<string, Record<string, unknown>> = {}
  let globals: Record<string, any> = {}

  for (const h of handlersMeta as HandlerMeta[]) {
    const route = h.route || ''
    if (!route.startsWith('/v3/') || route.startsWith('/v3/docs/')) {
 continue
}
    // Hide dev-only impersonation routes from the published spec in
    // production — the runtime gate in the handler still 404s them, but
    // there is no reason to advertise their existence.
    if (!import.meta.dev && route.startsWith('/v3/dev/')) {
 continue
}

    const { route: openapiRoute, parameters } = normaliseRoute(route)
    const method = (h.method || 'get').toLowerCase()
    const meta = (h.meta?.openAPI ?? {}) as Record<string, unknown> & { $global?: any }
    const { $global, ...openapi } = meta
    if ($global) {
 globals = deepMerge(globals, $global)
}

    paths[openapiRoute] ??= {}
    paths[openapiRoute][method] = {
      parameters,
      responses: { 200: { description: 'OK' } },
      ...openapi,
    }
  }

  return {
    openapi: '3.1.0',
    info: { title: 'Code Time', version: '0.1.0' },
    servers: [{ url: origin, description: 'Current backend' }],
    paths,
    components: globals.components ?? {},
  }
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/openapi+json; version=3.1')
  setHeader(event, 'Cache-Control', 'public, max-age=60')
  return buildSpec(getRequestURL(event).origin)
})
