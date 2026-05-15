import type { H3Event } from 'h3'
import { deleteCookie, setCookie } from 'h3'
import { isProduction } from './env'

// Mirrors codetime-server-v3/src/controllers/auth.py::create_auth_cookie.
// Sets the (user_id, auth_token) cookie pair the cross-backend user_guard
// reads. Attributes (httpOnly/samesite/maxAge/secure/domain) match Python
// so cookies issued by either backend are interchangeable.
//
// `domain=.codetime.dev` in production lets the cookie traverse every
// subdomain — the legacy api.codetime.dev host and the new
// codetime.dev origin share the same session. Existing host-only cookies
// minted before this change become invisible across hosts; users must
// log in again to re-mint with the wider domain.

const MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export function setAuthCookies(event: H3Event, userId: number, authToken: string) {
  const isProd = isProduction()
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
    ...(isProd ? { domain: '.codetime.dev' } : {}),
  }
  setCookie(event, 'user_id', String(userId), common)
  setCookie(event, 'auth_token', authToken, common)
}

// Clearing must mirror the attributes the cookie was minted with —
// browsers key cookies by (name, domain, path). A `deleteCookie` call
// without `domain=.codetime.dev` in production leaves the original
// cross-subdomain cookie untouched and silently writes a phantom
// host-only deletion, so the user stays logged in after POST /v3/auth/logout.
export function clearAuthCookies(event: H3Event) {
  const isProd = isProduction()
  const opts = {
    path: '/',
    ...(isProd ? { domain: '.codetime.dev' } : {}),
  }
  deleteCookie(event, 'user_id', opts)
  deleteCookie(event, 'auth_token', opts)
}
