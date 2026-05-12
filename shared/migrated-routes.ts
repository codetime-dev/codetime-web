// Single source of truth for routes served by the Nuxt backend instead of
// the legacy Python service. When a path matches here, the SDK's fetch
// wrapper rewrites the request to hit the Nuxt origin; otherwise it falls
// through to the upstream API host.
//
// Add a route ONLY after the Nuxt implementation is verified to be
// response-compatible with the Python endpoint (same status, body shape,
// error format). Removing or shadowing a route here flips traffic back.

// Build-out phase: the Nuxt backend hosts implementations but the
// frontend still talks to the Python service for ALL routes. The cutover
// will happen in one switch once every needed endpoint is on Nuxt and
// has been verified. Until then this list stays empty so the SDK keeps
// dispatching everything to apiHost.
export const MIGRATED_ROUTES: readonly RegExp[] = []

export function isMigratedRoute(pathname: string): boolean {
  return MIGRATED_ROUTES.some(re => re.test(pathname))
}
