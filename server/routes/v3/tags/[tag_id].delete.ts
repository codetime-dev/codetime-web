import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors DELETE /v3/tags/{tag_id}. Python returns 204 No Content on
// success (litestar @delete default). On missing/non-owned → 404 from
// the underlying get_tag call.

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'Delete a tag',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    responses: {
      204: { description: 'Deleted' },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) return sendPyError(event, 401, 'Not authenticated')
  const tagId = getRouterParam(event, 'tag_id')
  if (!tagId) return sendPyError(event, 404, 'Tag not found')

  const db = useDb()
  const deleted = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.uid, session.id)))
    .returning({ id: tags.id })
  if (!deleted.length) return sendPyError(event, 404, 'Tag not found')

  setResponseStatus(event, 204)
  return null
})
