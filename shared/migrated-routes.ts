// Single source of truth for routes served by the Nuxt backend instead of
// the legacy Python service. When a path matches here, the SDK's fetch
// wrapper rewrites the request to hit the Nuxt origin; otherwise it falls
// through to the upstream API host.
//
// Add a route ONLY after the Nuxt implementation is verified to be
// response-compatible with the Python endpoint (same status, body shape,
// error format). Removing or shadowing a route here flips traffic back.

// First cutover wave: endpoints that neither read nor write the shared
// auth cookies, so flipping which backend serves them is safe.
//
// Auth-touching routes (/v3/auth/*, /v3/discounts/active, /v3/users/self/*,
// /v3/tags/*, /v3/auth/refresh-token, …) are intentionally NOT listed:
// the cookie pair user_id+auth_token is minted by the Python service and
// silently split-brain failures appear if Nuxt sets a cookie with even
// slightly different attributes than Python's `create_auth_cookie`. We
// treat anything that touches the cookie as auth-coupled and keep it on
// Python until the full cutover. External-only routes (LemonSqueezy
// webhook, GitHub OAuth browser redirect) wouldn't be affected by this
// list anyway — they don't flow through the SDK dispatch shim.
export const MIGRATED_ROUTES: readonly RegExp[] = [
  // Public statistics & rankings
  /^\/v3\/public\/leaderboard$/,
  /^\/v3\/public\/language-ranking$/,
  /^\/v3\/public\/users\/\d+\/language-rank$/,
  /^\/v3\/public\/users\/\d+\/top-languages-rank$/,
  /^\/v3\/public\/users\/\d+\/overall-rank$/,
  /^\/v3\/public\/users\/\d+\/coding-history$/,
  // Yearly report (no auth, takes user_id query param)
  /^\/v3\/logs\/yearly-report-data$/,
  // Dev impersonation helper
  /^\/v3\/dev\/be$/,
  // Public user profile + embeddable widget endpoints
  /^\/v3\/users\/shield$/,
  /^\/v3\/users\/\d+$/,
  /^\/v3\/users\/\d+\/public\/status$/,
  /^\/v3\/users\/\d+\/public\/top-languages$/,
]

export function isMigratedRoute(pathname: string): boolean {
  return MIGRATED_ROUTES.some(re => re.test(pathname))
}
