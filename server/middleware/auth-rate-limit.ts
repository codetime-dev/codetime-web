// Per-IP rate limiter for auth-adjacent endpoints. Each one of these
// either runs JWT verification, fetches third-party JWKS, or writes
// session tokens — none of them should be reachable at unbounded RPS
// from a single client.
//
// We key by (client IP, path). The bucket sizes below are roomy enough
// that a human flipping between providers will never trip them, but
// tight enough that a scripted abuse loop hits 429 quickly.

import type { H3Event } from 'h3'
import { defineEventHandler, getRequestHeader, getRequestIP, setResponseHeader } from 'h3'
import { sendPyError } from '../utils/py-error'
import { takeToken } from '../utils/rate-limit'

type Limit = { capacity: number, refillPerSec: number }

// Tight per-IP caps. Capacity is the burst; refillPerSec sets the long
// run. e.g. {capacity: 20, refillPerSec: 20/60} ≈ 20 burst then 20/min.
const LIMITS: Record<string, Limit> = {
  '/v3/auth/google': { capacity: 20, refillPerSec: 20 / 60 },
  '/v3/auth/apple': { capacity: 20, refillPerSec: 20 / 60 },
  '/v3/auth/apple/native': { capacity: 20, refillPerSec: 20 / 60 },
  '/v3/auth/google/native': { capacity: 20, refillPerSec: 20 / 60 },
  '/v3/auth/github': { capacity: 30, refillPerSec: 30 / 60 },
  '/v3/auth/github/start': { capacity: 30, refillPerSec: 30 / 60 },
  '/v3/auth/github/native-callback': { capacity: 30, refillPerSec: 30 / 60 },
  '/v3/auth/refresh-token': { capacity: 10, refillPerSec: 10 / 60 },
  '/v3/users/self/delete-challenge': { capacity: 10, refillPerSec: 10 / 60 },
  // Device-code login. `poll` is hit repeatedly (every few seconds for up
  // to 10 min) so it gets a roomier sustained rate; start/approve are
  // one-shot per login.
  '/v3/agent/cli/link/start': { capacity: 20, refillPerSec: 20 / 60 },
  '/v3/agent/cli/link/poll': { capacity: 60, refillPerSec: 1 },
  '/v3/agent/cli/link/approve': { capacity: 20, refillPerSec: 20 / 60 },
}

function clientIp(event: H3Event): string {
  // Order matches how Nginx is configured: it sets X-Real-IP and
  // X-Forwarded-For. Cloudflare's header takes precedence if/when we
  // proxy through it later.
  const cf = getRequestHeader(event, 'cf-connecting-ip')
  if (cf) {
 return cf
}
  const real = getRequestHeader(event, 'x-real-ip')
  if (real) {
 return real
}
  const fwd = getRequestHeader(event, 'x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) {
 return first
}
  }
  return getRequestIP(event) || 'unknown'
}

export default defineEventHandler((event) => {
  const path = (event.path || '').split('?')[0] || ''
  const limit = LIMITS[path]
  if (!limit) {
    return
  }
  const ip = clientIp(event)
  if (!takeToken(`${ip}:${path}`, limit.capacity, limit.refillPerSec)) {
    setResponseHeader(event, 'Retry-After', '60')
    return sendPyError(event, 429, 'Too many requests')
  }
})
