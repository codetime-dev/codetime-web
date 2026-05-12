import { defineEventHandler, getRequestURL, setHeader } from 'h3'

// Filters Nitro's auto-generated OpenAPI down to the /v3/* surface
// actually served by this Nuxt backend — i.e. the migration target.
// Decoupled from shared/migrated-routes.ts on purpose: during the
// build-out phase, endpoints exist here without yet receiving SDK
// traffic, but should still appear in the docs so we can test them.
//
// Schemas and per-route metadata come from each handler's
// defineRouteMeta() block — see server/CLAUDE.md.

type OpenApiDoc = {
  paths?: Record<string, unknown>
  [k: string]: unknown
}

export default defineEventHandler(async (event) => {
  const full = await $fetch<OpenApiDoc>('/_openapi.json')
  const paths: Record<string, unknown> = {}
  for (const [route, methods] of Object.entries(full.paths ?? {})) {
    if (route.startsWith('/v3/') && !route.startsWith('/v3/docs/')) {
      paths[route] = methods
    }
  }
  // Nitro derives `servers[].url` from getRequestURL on the internal
  // $fetch above, which loses the port in dev. Override with the real
  // origin from the inbound browser request so Scalar's "Try it" calls
  // resolve against e.g. http://localhost:3002 instead of http://localhost.
  const origin = getRequestURL(event).origin
  setHeader(event, 'Content-Type', 'application/openapi+json; version=3.1')
  setHeader(event, 'Cache-Control', 'public, max-age=60')
  return {
    ...full,
    paths,
    servers: [{ url: origin, description: 'Current backend' }],
  }
})
