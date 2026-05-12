import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { users } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'
import { toUserSelfPublic } from '../../../../utils/user-dto'

// Mirrors POST /v3/users/self/bio in codetime-server-v3. Trims the bio,
// treats empty string as null, rejects oversize, and returns the full
// UserSelfPublic of the updated row (Python does the same — see
// controllers/users.py::update_bio).

const BIO_MAX_LENGTH = 512

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Update the authenticated user\'s bio',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { bio: { type: 'string', nullable: true } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated user',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSelfPublic' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) return sendPyError(event, 401, 'Not authenticated')

  const body = await readBody<{ bio?: string | null }>(event).catch(() => null)
  let nextBio: string | null = body?.bio?.trim() ?? null
  if (nextBio === '') nextBio = null
  if (nextBio && nextBio.length > BIO_MAX_LENGTH) {
    return sendPyError(event, 400, `Bio must be ${BIO_MAX_LENGTH} characters or fewer`)
  }

  const db = useDb()
  const [row] = await db
    .update(users)
    .set({ bio: nextBio })
    .where(eq(users.id, session.id))
    .returning()
  if (!row) return sendPyError(event, 404, 'User not found')
  return toUserSelfPublic(row)
})
