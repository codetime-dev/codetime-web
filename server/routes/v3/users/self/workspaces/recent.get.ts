import { and, desc, eq, gte, max } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { eventLogs } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Mirrors GET /v3/users/self/workspaces/recent. Returns the user's most
// recently active workspaces (= EventLog.project) within `days`.
// EventLog.event_time is stored as milliseconds since epoch (BIGINT)
// — see codetime-server-v3/src/db.py::EventLog.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Recently active workspaces',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 5 } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Workspace search response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkspaceSearchResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          WorkspaceSearchResult: {
            type: 'object',
            required: ['workspaceName'],
            properties: { workspaceName: { type: 'string' } },
          },
          WorkspaceSearchResponse: {
            type: 'object',
            required: ['results', 'totalResults'],
            properties: {
              results: { type: 'array', items: { $ref: '#/components/schemas/WorkspaceSearchResult' } },
              totalResults: { type: 'integer' },
            },
          },
        },
      },
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
  const limit = clampInt(q.limit, 1, 50, 5)
  const days = clampInt(q.days, 1, 365, 30)
  const cutoffMs = Date.now() - days * 86_400_000

  const db = useDb()
  const rows = await db
    .select({ project: eventLogs.project, lastTime: max(eventLogs.eventTime) })
    .from(eventLogs)
    .where(and(eq(eventLogs.uid, session.id), gte(eventLogs.eventTime, cutoffMs)))
    .groupBy(eventLogs.project)
    .orderBy(desc(max(eventLogs.eventTime)))
    .limit(limit)

  const results = rows
    .filter(r => Boolean(r.project))
    .map(r => ({ workspaceName: r.project }))
  return { results, totalResults: results.length }
})
