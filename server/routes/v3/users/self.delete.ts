import { eq } from 'drizzle-orm'
import { defineEventHandler, deleteCookie } from 'h3'
import { eventLogs, users, workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors DELETE /v3/users/self. Soft-deletes the user (sets
// deleted_at) and removes all related data rows; clears the auth
// cookies so the request that performed the deletion is logged out.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Delete the authenticated user account',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Delete result',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDeleteResponse' } } },
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

  const db = useDb()
  try {
    await db.delete(workspaceMinutesV2).where(eq(workspaceMinutesV2.uid, session.id))
    await db.delete(eventLogs).where(eq(eventLogs.uid, session.id))
    await db.delete(workspaceMetaV2).where(eq(workspaceMetaV2.uid, session.id))
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, session.id))
    deleteCookie(event, 'auth_token', { path: '/' })
    deleteCookie(event, 'user_id', { path: '/' })
    return { success: true, message: 'User account deleted successfully' }
  }
  catch (error) {
    return { success: false, message: `Failed to delete account: ${(error as Error).message}` }
  }
})
