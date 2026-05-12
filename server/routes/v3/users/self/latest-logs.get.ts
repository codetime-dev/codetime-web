import { desc, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { eventLogs } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/latest-logs. Returns the most recent event
// logs for the authenticated user, newest first.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Most recent editor events',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 10 } },
    ],
    responses: {
      200: {
        description: 'Event logs newest first',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/EventLogPublic' } },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          EventLogPublic: {
            type: 'object',
            required: ['eventTime', 'language', 'project', 'relativeFile', 'editor', 'platform', 'absoluteFile', 'gitOrigin', 'gitBranch'],
            properties: {
              eventTime: { type: 'integer' },
              language: { type: 'string' },
              project: { type: 'string' },
              relativeFile: { type: 'string' },
              editor: { type: 'string' },
              platform: { type: 'string' },
              absoluteFile: { type: 'string' },
              gitOrigin: { type: 'string' },
              gitBranch: { type: 'string' },
            },
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

  const limitRaw = Number(getQuery(event).limit)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 1000) : 10

  const db = useDb()
  const rows = await db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.uid, session.id))
    .orderBy(desc(eventLogs.eventTime))
    .limit(limit)
  return rows.map(r => ({
    eventTime: r.eventTime,
    language: r.language,
    project: r.project,
    relativeFile: r.relativeFile,
    editor: r.editor,
    platform: r.platform,
    absoluteFile: r.absoluteFile ?? '',
    gitOrigin: r.gitOrigin ?? '',
    gitBranch: r.gitBranch ?? '',
  }))
})
