import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { users } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'
import { toUserSelfPublic } from '../../../../utils/user-dto'

const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 32
// Letters / digits / underscore / hyphen. Mirrors the GitHub username
// character set so OAuth-provisioned names round-trip cleanly.
const USERNAME_PATTERN = /^[\w-]+$/

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Update the authenticated user\'s username',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username'],
            properties: { username: { type: 'string' } },
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
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const body = await readBody<{ username?: string }>(event).catch(() => null)
  const next = body?.username?.trim() ?? ''
  if (next.length < USERNAME_MIN_LENGTH || next.length > USERNAME_MAX_LENGTH) {
    return sendPyError(
      event,
      400,
      `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`,
    )
  }
  if (!USERNAME_PATTERN.test(next)) {
    return sendPyError(
      event,
      400,
      'Username may only contain letters, digits, underscore, and hyphen',
    )
  }

  const db = useDb()
  const [row] = await db
    .update(users)
    .set({ username: next })
    .where(eq(users.id, session.id))
    .returning()
  if (!row) {
    return sendPyError(event, 404, 'User not found')
  }
  setResponseStatus(event, 201)
  return toUserSelfPublic(row)
})
