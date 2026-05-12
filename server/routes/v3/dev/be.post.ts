import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { users } from '../../../db/schema'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

defineRouteMeta({
  openAPI: {
    tags: ['dev'],
    summary: 'Impersonate a user (test only)',
    description: 'Sets the (user_id, auth_token) cookie pair so the caller authenticates as the given uid on both Nuxt and the Python backend.',
    parameters: [
      { name: 'uid', in: 'query', required: true, schema: { type: 'integer', minimum: 1 } },
    ],
    responses: {
      201: { description: 'Cookies set; no body.' },
      400: { $ref: '#/components/responses/BadRequest' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

// Mirrors codetime-server-v3 POST /v3/dev/be?uid=<int>.
// Test-only impersonation: hands the caller (user_id, auth_token) cookies
// that BOTH backends accept via their cookie-based user_guard path. Python
// uses Litestar's session cookie instead; we match behaviour by writing
// the cookie pair, which user_guard checks (priority: header > session >
// cookies — cookies are sufficient when no session exists).

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uidRaw = q.uid
  const uid = Number(Array.isArray(uidRaw) ? uidRaw[0] : uidRaw)
  if (!Number.isFinite(uid) || uid <= 0) {
    return sendPyError(event, 400, 'Invalid uid')
  }

  const db = useDb()
  const [row] = await db
    .select({ id: users.id, tokenV1: users.tokenV1 })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1)

  if (!row) return sendPyError(event, 404, 'User not found')

  setAuthCookies(event, row.id, row.tokenV1)
  // Python returns None -> serialises as null (status 201 default for @post).
  event.node.res.statusCode = 201
  return null
})
