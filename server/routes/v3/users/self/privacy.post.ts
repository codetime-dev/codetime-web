import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { users } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors POST /v3/users/self/privacy. Only `show_github` is writable —
// `show_email` is always false on the wire (Python enforces this; we do
// too).

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Update the authenticated user\'s privacy settings',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { show_github: { type: 'boolean' } },
            required: ['show_github'],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated privacy settings',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PrivacySettings' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const body = await readBody<{ show_github?: boolean }>(event).catch(() => null)
  const showGithub = Boolean(body?.show_github)

  const db = useDb()
  const [row] = await db
    .update(users)
    .set({ showGithub })
    .where(eq(users.id, session.id))
    .returning({ showGithub: users.showGithub })
  if (!row) {
 return sendPyError(event, 401, 'Not authenticated')
}
  return { show_email: false, show_github: row.showGithub }
})
