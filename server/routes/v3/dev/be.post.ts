import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { users } from '../../../db/schema'
import { setAuthCookies } from '../../../utils/auth-cookie'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors codetime-server-v3 POST /v3/dev/be?uid=<int>. Test-only
// impersonation — hands the caller the (user_id, auth_token) cookie
// pair so subsequent requests authenticate as the given uid.
//
// PRODUCTION GATE: this endpoint is dangerous (lets anyone log in as
// anyone) and is NOT exposed in production. We short-circuit to a
// Python-shaped 404 so its existence is not advertised. Gating uses
// import.meta.dev which the Nitro build statically resolves to true in
// dev and false in production — independent of any *_MODE env var
// (NUXT_PUBLIC_MODE is set to 'production' even in .env.dev because the
// upstream Python API is the prod one). The OpenAPI metadata below is
// statically parsed regardless of import.meta.dev, so this endpoint
// still appears in `/v3/docs/openapi.json` for dev visibility but is
// filtered out at runtime in prod by the openapi handler itself.

defineRouteMeta({
  openAPI: {
    tags: ['dev'],
    summary: 'Impersonate a user (test only)',
    description: 'Sets the (user_id, auth_token) cookie pair so the caller authenticates as the given uid. Disabled in production.',
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

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
 return sendPyError(event, 404, 'Not Found')
}

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
  if (!row) {
 return sendPyError(event, 404, 'User not found')
}

  setAuthCookies(event, row.id, row.tokenV1)
  setResponseStatus(event, 201)
  return null
})
