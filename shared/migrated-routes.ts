// Single source of truth for routes served by the Nuxt backend instead of
// the legacy Python service. When a path matches here, the SDK's fetch
// wrapper rewrites the request to hit the Nuxt origin; otherwise it falls
// through to the upstream API host.
//
// Add a route ONLY after the Nuxt implementation is verified to be
// response-compatible with the Python endpoint (same status, body shape,
// error format). Removing or shadowing a route here flips traffic back.

export const MIGRATED_ROUTES: readonly RegExp[] = [
  /^\/v3\/users\/self$/,
  /^\/v3\/dev\/be$/,
]

export function isMigratedRoute(pathname: string): boolean {
  return MIGRATED_ROUTES.some(re => re.test(pathname))
}
