import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { getCookie, getHeader } from 'h3'
import { users } from '../db/schema'
import { useDb } from './db'

export type AuthUser = typeof users.$inferSelect

// Port of codetime-server-v3/src/services/users.py::user_guard.
// Resolution order:
//   1. Authorization: Bearer <upload_token>
//   2. user_id + auth_token cookies — auth_token must equal users.token_v1
//      (the legacy Python guard skips this check; we tighten it here).
//
// The legacy bare `token: <upload_token>` header that Python accepted is
// NOT honoured here. That header bypasses the access-log scrubbers most
// proxies / APM products apply to `Authorization`, so a captured request
// could leak the credential into logs. Clients still using the bare
// header against Nuxt-served endpoints must migrate to `Authorization:
// Bearer …`. The legacy Python service (event-log uploads only) keeps
// accepting it for backwards compatibility.
//
// Returns null when not authenticated. Callers must convert null into the
// Python-shaped { status_code, detail } body via sendPyError — DO NOT throw
// h3 errors here, they pollute the response with stack/url/statusMessage.
//
// Every lookup is gated on `deleted_at IS NULL`: DELETE /v3/users/self
// tombstones the row (and rotates tokenV1/uploadToken to random values),
// but a leaked old token or cookie must still be refused — the deletedAt
// gate is the defence-in-depth for that.

async function resolveUser(event: H3Event): Promise<AuthUser | null> {
  const db = useDb()

  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) {
      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.uploadToken, token), isNull(users.deletedAt)))
        .limit(1)
      if (rows[0]) {
        return rows[0]
      }
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
        .where(and(
          eq(users.id, uid),
          eq(users.tokenV1, authTokenCookie),
          isNull(users.deletedAt),
        ))
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
