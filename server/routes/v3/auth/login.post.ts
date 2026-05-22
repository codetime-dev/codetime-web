import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import process from 'node:process'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getRequestIP, readBody } from 'h3'
import { users } from '../../../db/schema'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Email + password sign-in for a single pre-provisioned account, used
// by the iOS app's App Store review flow. The credentials and the
// target user_id live in env vars — there is no registration, no
// password reset, and no DB-stored password hash. The matching `users`
// row is created once by hand (see the SQL in this file's commit msg).
//
// Behaviour:
//   - When any of APP_REVIEWER_EMAIL / APP_REVIEWER_PASSWORD /
//     APP_REVIEWER_USER_ID is unset, the endpoint returns 404. That
//     keeps it dormant in dev / local and means the only deploy that
//     exposes it is one with all three vars set deliberately.
//   - Both inputs are compared in constant time so failed attempts
//     don't leak which field is wrong.
//   - Failed attempts increment an in-memory per-IP counter; 5 failures
//     inside 15 minutes lock that IP out with 429. Counter is per
//     PM2 worker (no shared state); good enough for a single-account
//     endpoint that should see virtually no traffic.
//
// Response mirrors auth/apple/native.post.ts — returns `{ token, user_id }`
// where `token` is the user's uploadToken (suitable for `Authorization:
// Bearer ...`) and also sets the (user_id, auth_token) cookie pair so
// a browser-based client would work too.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Email/password sign-in (App Store review account only)',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string' },
              password: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session token issued',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'user_id'],
              properties: {
                token: { type: 'string' },
                user_id: { type: 'integer' },
              },
            },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { description: 'Endpoint not configured' },
      429: { description: 'Too many attempts' },
    },
  },
})

type Body = { email?: unknown, password?: unknown }

const WINDOW_MS = 15 * 60_000
const MAX_FAILURES = 5
const failuresByIp = new Map<string, { count: number, resetAt: number }>()

// Prevent unbounded growth when a botnet probes from many IPs. Called
// lazily before each insert; cheap because the map stays tiny in normal
// operation (one valid credential, almost no failed traffic expected).
function pruneExpired(now: number) {
  if (failuresByIp.size < 1000) {
    return
  }
  for (const [ip, entry] of failuresByIp) {
    if (entry.resetAt < now) {
      failuresByIp.delete(ip)
    }
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = failuresByIp.get(ip)
  if (!entry || entry.resetAt < now) {
    return false
  }
  return entry.count >= MAX_FAILURES
}

function recordFailure(ip: string) {
  const now = Date.now()
  pruneExpired(now)
  const entry = failuresByIp.get(ip)
  if (!entry || entry.resetAt < now) {
    failuresByIp.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count += 1
}

// timingSafeEqual requires same-length buffers; pad-and-compare so the
// length-mismatch branch still costs roughly the same as the equal-length
// one (caller learns the boolean, not the relative lengths).
function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba)
    return false
  }
  return crypto.timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const expectedEmail = process.env.APP_REVIEWER_EMAIL
  const expectedPassword = process.env.APP_REVIEWER_PASSWORD
  const expectedUserIdRaw = process.env.APP_REVIEWER_USER_ID
  const expectedUserId = expectedUserIdRaw ? Number(expectedUserIdRaw) : Number.NaN
  if (!expectedEmail || !expectedPassword || !Number.isFinite(expectedUserId)) {
    return sendPyError(event, 404, 'Not found')
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (isRateLimited(ip)) {
    return sendPyError(event, 429, 'Too many attempts')
  }

  const body = await readBody<Body>(event).catch(() => ({} as Body))
  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const okEmail = safeEqualStr(email, expectedEmail)
  const okPassword = safeEqualStr(password, expectedPassword)
  if (!(okEmail && okPassword)) {
    recordFailure(ip)
    return sendPyError(event, 401, 'Invalid credentials')
  }

  const db = useDb()
  const [user] = await db
    .select({ id: users.id, uploadToken: users.uploadToken, tokenV1: users.tokenV1 })
    .from(users)
    .where(eq(users.id, expectedUserId))
    .limit(1)
  if (!user) {
    // env points at a user that was deleted (or never seeded). Surface
    // a 500 so the operator notices in logs — to a probing attacker it
    // is indistinguishable from any other server-side error.
    console.error('[auth.login] APP_REVIEWER_USER_ID does not match any users row')
    return sendPyError(event, 500, 'Account not provisioned')
  }

  setAuthCookies(event, user.id, user.tokenV1)
  return { token: user.uploadToken, user_id: user.id }
})
