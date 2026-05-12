import { and, desc, eq, gte, max } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMinutesV2 } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Mirrors GET /v3/users/self/languages/recent. Returns up to `limit`
// distinct languages, ordered by the most recent recorded_at within the
// past `days` window. Empty languages are dropped (matches Python).

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Recently used programming languages',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Language names ordered by recency',
        content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v)
  if (!Number.isFinite(n)) {
 return fallback
}
  return Math.min(Math.max(Math.trunc(n), min), max)
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const limit = clampInt(q.limit, 1, 100, 10)
  const days = clampInt(q.days, 1, 365, 30)
  const cutoff = new Date(Date.now() - days * 86_400_000)

  const db = useDb()
  const rows = await db
    .select({ language: workspaceMinutesV2.language, lastAt: max(workspaceMinutesV2.recordedAt) })
    .from(workspaceMinutesV2)
    .where(and(eq(workspaceMinutesV2.uid, session.id), gte(workspaceMinutesV2.recordedAt, cutoff)))
    .groupBy(workspaceMinutesV2.language)
    .orderBy(desc(max(workspaceMinutesV2.recordedAt)))
    .limit(limit)

  return rows.map(r => r.language).filter(Boolean)
})
