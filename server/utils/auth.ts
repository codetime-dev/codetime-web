import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { getCookie, getHeader } from 'h3'
import { users } from '../db/schema'
import { useDb } from './db'

export type AuthUser = typeof users.$inferSelect

// Port of codetime-server-v3/src/services/users.py::user_guard.
// Resolution order (matches Python for parity during migration):
//   1. Authorization: Bearer <upload_token>
//   2. token: <upload_token> header
//   3. user_id + auth_token cookies — auth_token must equal users.token_v1
//      (the legacy Python guard skips this check; we tighten it here).
//
// Returns null when not authenticated. Callers must convert null into the
// Python-shaped { status_code, detail } body via sendPyError — DO NOT throw
// h3 errors here, they pollute the response with stack/url/statusMessage.

async function resolveUser(event: H3Event): Promise<AuthUser | null> {
  const db = useDb()

  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) {
      const rows = await db.select().from(users).where(eq(users.uploadToken, token)).limit(1)
      if (rows[0]) {
        return rows[0]
      }
    }
  }

  const tokenHeader = getHeader(event, 'token')
  if (tokenHeader) {
    const rows = await db.select().from(users).where(eq(users.uploadToken, tokenHeader)).limit(1)
    if (rows[0]) {
      return rows[0]
    }
  }

  const userIdCookie = getCookie(event, 'user_id')
  const authTokenCookie = getCookie(event, 'auth_token')
  if (userIdCookie && authTokenCookie) {
    const uid = Number(userIdCookie)
    if (Number.isFinite(uid)) {
      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.id, uid), eq(users.tokenV1, authTokenCookie)))
        .limit(1)
      if (rows[0]) {
        return rows[0]
      }
    }
  }

  return null
}

// Demote a non-free user whose paid window has lapsed. Mirrors
// services/users.py::check_and_update_user_expiration so a single missed
// webhook can't leave a user on the Pro tier indefinitely.
async function demoteIfExpired(user: AuthUser): Promise<AuthUser> {
  if (user.plan === 'free' || !user.planExpiresAt || user.planExpiresAt.getTime() > Date.now()) {
    return user
  }
  const db = useDb()
  const [updated] = await db
    .update(users)
    .set({ plan: 'free', planStatus: 'expired', planExpiresAt: null })
    .where(eq(users.id, user.id))
    .returning()
  return updated ?? { ...user, plan: 'free', planStatus: 'expired', planExpiresAt: null }
}

export async function tryUser(event: H3Event): Promise<AuthUser | null> {
  const user = await resolveUser(event)
  return user ? demoteIfExpired(user) : null
}
