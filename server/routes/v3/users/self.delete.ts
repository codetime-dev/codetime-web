import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { clearAuthCookies } from '../../../utils/auth-cookie'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { deleteUserActivityData, denyIfDeleteChallengeInvalid } from '../../../utils/user-data-delete'

// DELETE /v3/users/self — full account erasure for compliance (Apple
// App Store §5.1.1(v), GDPR Art. 17).
//
// Wipes all editor activity, agent telemetry, and platform metadata via
// deleteUserActivityData(), then scrubs the users row in place: tombstone
// (deleted_at) so tryUser refuses it, PII / provider IDs nulled, username
// rewritten to `deleted_<id>` (NOT NULL column), and upload_token /
// token_v1 rotated so any stale plugin or cookie holding the old values
// can't keep uploading after Delete. All in one transaction so a partial
// failure rolls back cleanly.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Delete the authenticated user account',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['challenge', 'confirmUsername'],
            properties: {
              challenge: { type: 'string', description: 'Token issued by POST /v3/users/self/delete-challenge' },
              confirmUsername: { type: 'string', description: 'Must match the caller\'s current username' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Delete result',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDeleteResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const denied = await denyIfDeleteChallengeInvalid(event, session, 'account')
  if (denied) {
    return denied
  }

  const db = useDb()
  const uid = session.id

  try {
    await db.transaction(async (tx) => {
      await deleteUserActivityData(tx, uid)

      await tx.update(users).set({
        deletedAt: new Date(),
        email: null,
        avatar: null,
        bio: null,
        timezone: null,
        paypalSubscriptionId: null,
        googleId: null,
        githubId: null,
        appleId: null,
        username: `deleted_${uid}`,
        uploadToken: randomBytes(24).toString('hex'),
        tokenV1: randomBytes(24).toString('hex'),
        updatedAt: new Date(),
      }).where(eq(users.id, uid))
    })

    clearAuthCookies(event)
    return { success: true, message: 'User account deleted successfully' }
  }
  catch (error) {
    return { success: false, message: `Failed to delete account: ${(error as Error).message}` }
  }
})
