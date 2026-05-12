import { defineEventHandler, setHeader } from 'h3'
import { isMigratedRoute } from '~~/shared/migrated-routes'

// Filters Nitro's auto-generated OpenAPI document (built from each
// route's defineRouteMeta) down to the routes listed in
// shared/migrated-routes.ts. No per-route metadata is duplicated here:
// schemas and summaries live next to the handlers themselves.

type OpenApiDoc = {
  paths?: Record<string, unknown>
  [k: string]: unknown
}

export default defineEventHandler(async (event) => {
  const full = await $fetch<OpenApiDoc>('/_openapi.json')
  const paths: Record<string, unknown> = {}
  for (const [route, methods] of Object.entries(full.paths ?? {})) {
    // Nitro normalises `:uid` → `{uid}` in spec paths — strip braces back
    // to slashes for the migration-list test, which uses the live URL.
    const live = route.replace(/\{(\w+)\}/g, ':$1')
    if (isMigratedRoute(live)) paths[route] = methods
  }
  setHeader(event, 'Content-Type', 'application/openapi+json; version=3.1')
  setHeader(event, 'Cache-Control', 'public, max-age=60')
  return { ...full, paths }
})
