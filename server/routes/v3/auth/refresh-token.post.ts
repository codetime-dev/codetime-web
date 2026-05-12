import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors POST /v3/auth/refresh-token. Issues new upload_token and
// token_v1, returns `{token, token_v1}` (Python `TokenRefreshResponse`).
// `token` is the upload_token — historical naming kept on the wire.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Refresh user authentication tokens',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'New tokens',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenRefreshResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          TokenRefreshResponse: {
            type: 'object',
            required: ['token', 'token_v1'],
            properties: {
              token: { type: 'string' },
              token_v1: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const uploadToken = randomBytes(24).toString('hex')
  const tokenV1 = randomBytes(24).toString('hex')

  const db = useDb()
  const [row] = await db
    .update(users)
    .set({ uploadToken, tokenV1 })
    .where(eq(users.id, session.id))
    .returning({ uploadToken: users.uploadToken, tokenV1: users.tokenV1 })
  if (!row) {
 return sendPyError(event, 404, 'User not found')
}

  return { token: row.uploadToken, token_v1: row.tokenV1 }
})
