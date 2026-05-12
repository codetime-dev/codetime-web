import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { eventLogs, workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors DELETE /v3/users/self/data. Wipes the authenticated user's
// minutes/events/meta rows but leaves the user row itself intact.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Delete all data for the authenticated user (keep account)',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Delete result',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDeleteResponse' } } },
      },
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

  const db = useDb()
  try {
    await db.delete(workspaceMinutesV2).where(eq(workspaceMinutesV2.uid, session.id))
    await db.delete(eventLogs).where(eq(eventLogs.uid, session.id))
    await db.delete(workspaceMetaV2).where(eq(workspaceMetaV2.uid, session.id))
    return { success: true, message: 'User data deleted successfully' }
  }
  catch (error) {
    return { success: false, message: `Failed to delete user data: ${(error as Error).message}` }
  }
})
