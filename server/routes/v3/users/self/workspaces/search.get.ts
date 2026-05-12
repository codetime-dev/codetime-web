import { and, eq, ilike } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMetaV2 } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Mirrors GET /v3/users/self/workspaces/search. Distinct workspace
// names matching `q` (ilike, case-insensitive), ordered alphabetically,
// capped at `limit`.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Search user workspace names',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'q', in: 'query', schema: { type: 'string', default: '' } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    ],
    responses: {
      200: {
        description: 'Workspace search response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkspaceSearchResponse' } } },
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

  const params = getQuery(event)
  const q = typeof params.q === 'string' ? params.q : ''
  const limit = clampInt(params.limit, 1, 100, 20)

  const db = useDb()
  const where = q
    ? and(eq(workspaceMetaV2.uid, session.id), ilike(workspaceMetaV2.workspaceName, `%${q}%`))
    : eq(workspaceMetaV2.uid, session.id)

  const rows = await db
    .selectDistinct({ workspaceName: workspaceMetaV2.workspaceName })
    .from(workspaceMetaV2)
    .where(where)
    .orderBy(workspaceMetaV2.workspaceName)
    .limit(limit)

  const results = rows.map(r => ({ workspaceName: r.workspaceName }))
  return { results, totalResults: results.length }
})
