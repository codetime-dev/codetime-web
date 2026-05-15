import { and, count, eq } from 'drizzle-orm'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { tags } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'
import { uuid7 } from '../../../utils/uuid7'

// Mirrors POST /v3/tags. Plan-gated (free tier: 3 tags max) and rejects
// duplicate names per user. `rules_json` is always null at creation —
// rules are added later via PUT /v3/tags/{id}.

const FREE_PLAN_TAG_LIMIT = 3

defineRouteMeta({
  openAPI: {
    tags: ['tags'],
    summary: 'Create a tag',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/TagCreateRequest' } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

type CreateBody = { name?: string, color?: string, emoji?: string | null }

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const body = await readBody<CreateBody>(event).catch(() => null)
  if (!body?.name || !body.color) {
    return sendPyError(event, 400, 'name and color are required')
  }

  const db = useDb()

  if (session.plan === 'free') {
    const rows = await db
      .select({ value: count() })
      .from(tags)
      .where(eq(tags.uid, session.id))
    const existing = rows[0]?.value ?? 0
    if (existing >= FREE_PLAN_TAG_LIMIT) {
      return sendPyError(
        event,
        403,
        'Free plan users can only create up to 3 tags. Upgrade to Pro for unlimited tags.',
      )
    }
  }

  const [dup] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.uid, session.id), eq(tags.name, body.name)))
    .limit(1)
  if (dup) {
 return sendPyError(event, 400, 'Tag name already exists')
}

  const now = new Date()
  const [row] = await db
    .insert(tags)
    .values({
      id: uuid7(),
      uid: session.id,
      name: body.name,
      color: body.color,
      emoji: body.emoji ?? null,
      rulesJson: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  if (!row) {
 return sendPyError(event, 500, 'Failed to create tag')
}
  // Python's Litestar @post returns 201 by default; mirror it so SDK
  // success-status checks line up across backends.
  setResponseStatus(event, 201)
  return toTagResponse(row)
})
