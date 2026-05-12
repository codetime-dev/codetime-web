import type { H3Event } from 'h3'
import process from 'node:process'
import { setCookie } from 'h3'

// Mirrors codetime-server-v3/src/controllers/auth.py::create_auth_cookie.
// Sets the (user_id, auth_token) cookie pair the cross-backend user_guard
// reads. Attributes (httpOnly/samesite/maxAge/secure) match Python so the
// cookies are byte-equivalent regardless of which backend issued them.

const MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export function setAuthCookies(event: H3Event, userId: number, authToken: string) {
  const isProd = process.env.NUXT_PUBLIC_MODE === 'production'
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  }
  setCookie(event, 'user_id', String(userId), common)
  setCookie(event, 'auth_token', authToken, common)
}
