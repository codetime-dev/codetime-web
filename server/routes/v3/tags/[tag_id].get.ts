import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'

// Mirrors GET /v3/tags/{tag_id}. 404 if missing OR not owned — Python
// services/tags.py returns 404 in both cases to avoid leaking existence.

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'Get a tag by id',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    responses: {
      200: {
        description: 'Tag',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagResponse' } } },
      },
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
  const tagId = getRouterParam(event, 'tag_id')
  if (!tagId) {
 return sendPyError(event, 404, 'Tag not found')
}

  const db = useDb()
  const [row] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.uid, session.id)))
    .limit(1)
  if (!row) {
 return sendPyError(event, 404, 'Tag not found')
}
  return toTagResponse(row)
})
