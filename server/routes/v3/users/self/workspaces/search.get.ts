import { and, eq, ilike } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRequestPath } from 'h3'
import { workspaceMetaV2 } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { useDb } from '../../../../../utils/db'
import { sendPyError, sendPyValidationError } from '../../../../../utils/py-error'

// Mirrors GET /v3/users/self/workspaces/search. Distinct workspace
// names matching `q` (ilike, case-insensitive), ordered alphabetically,
// capped at `limit`.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Search user workspace names',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      // Nuxt's openapi-types reject `minLength` on a string schema —
      // the handler enforces non-empty via its own validation.
      { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    ],
    responses: {
      200: {
        description: 'Workspace search response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkspaceSearchResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
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

  // Mirror Python's `Parameter(min_length=1)` validation on `q`. Litestar
  // raises ValidationException with this exact body shape for missing or
  // empty `q`; we emit the same envelope so the SDK error path is unified.
  if (q.length === 0) {
    return sendPyValidationError(event, 'GET', getRequestPath(event), [
      { key: 'q', message: 'Expected `str` of length >= 1', source: 'query' },
    ])
  }

  const db = useDb()
  const where = and(
    eq(workspaceMetaV2.uid, session.id),
    ilike(workspaceMetaV2.workspaceName, `%${q}%`),
  )

  const rows = await db
    .selectDistinct({ workspaceName: workspaceMetaV2.workspaceName })
    .from(workspaceMetaV2)
    .where(where)
    .orderBy(workspaceMetaV2.workspaceName)
    .limit(limit)

  const results = rows.map(r => ({ workspaceName: r.workspaceName }))
  return { results, totalResults: results.length }
})
