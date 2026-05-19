import { defineEventHandler } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'
import { deleteUserActivityData, denyIfDeleteChallengeInvalid } from '../../../../utils/user-data-delete'

// DELETE /v3/users/self/data — wipe the user's activity history but
// keep the account / login intact. Mirrors what self.delete.ts removes,
// minus the user-row scrub. Wrapped in a transaction so a partial
// failure rolls back cleanly.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Delete all data for the authenticated user (keep account)',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['challenge', 'confirmUsername'],
            properties: {
              challenge: { type: 'string', description: 'Token issued by POST /v3/users/self/delete-challenge?purpose=data' },
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
    $global: {
      components: {
        schemas: {
          UserDeleteResponse: {
            type: 'object',
            required: ['success', 'message'],
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
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

  const denied = await denyIfDeleteChallengeInvalid(event, session, 'data')
  if (denied) {
    return denied
  }

  const db = useDb()
  try {
    await db.transaction(async (tx) => {
      await deleteUserActivityData(tx, session.id)
    })
    return { success: true, message: 'User data deleted successfully' }
  }
  catch (error) {
    return { success: false, message: `Failed to delete user data: ${(error as Error).message}` }
  }
})
