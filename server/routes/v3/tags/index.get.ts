import { asc, eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'

// Mirrors GET /v3/tags. Returns tags for the authenticated user,
// ordered by created_at ascending (same as Python services/tags.py).
// Carries the shared Tag-domain schemas via $global (registered here as
// this is the first /v3/tags route loaded).

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'List the authenticated user\'s tags',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Tag list',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/TagResponse' } },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          TagResponse: {
            type: 'object',
            required: ['id', 'name', 'color', 'created_at', 'updated_at'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              color: { type: 'string' },
              emoji: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              rules: { type: 'object', nullable: true, additionalProperties: true },
            },
          },
          TagCreateRequest: {
            type: 'object',
            required: ['name', 'color'],
            properties: {
              name: { type: 'string' },
              color: { type: 'string' },
              emoji: { type: 'string', nullable: true },
            },
          },
          TagUpdateRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', nullable: true },
              color: { type: 'string', nullable: true },
              emoji: { type: 'string', nullable: true },
              rules: { type: 'object', nullable: true, additionalProperties: true },
            },
          },
        },
        responses: {
          Forbidden: {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
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
  const rows = await db
    .select()
    .from(tags)
    .where(eq(tags.uid, session.id))
    .orderBy(asc(tags.createdAt))
  return rows.map(toTagResponse)
})
