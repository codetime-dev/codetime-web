// Single source of truth for "are we running the production deploy?".
//
// Historically several modules checked `NUXT_PUBLIC_MODE === 'production'`
// in isolation, which silently fell through to dev-mode behaviour
// whenever an operator forgot to add that line to `.env`. The symptoms
// were nasty: OAuth callbacks redirecting to localhost:3001, auth
// cookies issued without `Domain=.codetime.dev` (so the cross-subdomain
// flow broke), and LemonSqueezy switching to test mode.
//
// Resolution order — first match wins:
//   1. `NUXT_PUBLIC_MODE === 'production'`  (explicit legacy flag)
//   2. `NODE_ENV === 'production'`           (set by PM2 / build tooling)
// Use `isProduction()` everywhere instead of reaching for either env
// var directly.

import process from 'node:process'

export function isProduction(): boolean {
  return process.env.NUXT_PUBLIC_MODE === 'production'
    || process.env.NODE_ENV === 'production'
}
