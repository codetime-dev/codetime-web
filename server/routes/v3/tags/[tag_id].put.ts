import { and, eq, ne } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'

// Mirrors PUT /v3/tags/{tag_id}. Partial update — Python checks
// `model_fields_set` so a missing key means "leave alone" while an
// explicit `null` means "clear it". JSON has no such distinction, so we
// treat ANY key present in the body as a set (matching the SDK's
// model-based send) and only update non-undefined values.

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'Update a tag',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/TagUpdateRequest' } } },
    },
    responses: {
      200: {
        description: 'Updated tag',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

type UpdateBody = {
  name?: string | null
  color?: string | null
  emoji?: string | null
  rules?: unknown | null
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) return sendPyError(event, 401, 'Not authenticated')
  const tagId = getRouterParam(event, 'tag_id')
  if (!tagId) return sendPyError(event, 404, 'Tag not found')

  const body = await readBody<UpdateBody>(event).catch(() => null)
  if (!body) return sendPyError(event, 400, 'Invalid request body')

  const db = useDb()
  const [existing] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.uid, session.id)))
    .limit(1)
  if (!existing) return sendPyError(event, 404, 'Tag not found')

  const patch: Partial<typeof tags.$inferInsert> = { updatedAt: new Date() }

  if (typeof body.name === 'string' && body.name !== existing.name) {
    const [dup] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.uid, session.id), eq(tags.name, body.name), ne(tags.id, tagId)))
      .limit(1)
    if (dup) return sendPyError(event, 400, 'Tag name already exists')
    patch.name = body.name
  }
  if (typeof body.color === 'string') patch.color = body.color
  if ('emoji' in body) patch.emoji = body.emoji ?? null
  if ('rules' in body) {
    const r = body.rules
    if (r === null || (typeof r === 'string' && (r === 'null' || r === ''))) {
      patch.rulesJson = null
    }
    else if (typeof r === 'object') {
      patch.rulesJson = r as object
    }
  }

  const [row] = await db
    .update(tags)
    .set(patch)
    .where(eq(tags.id, tagId))
    .returning()
  return toTagResponse(row)
})
