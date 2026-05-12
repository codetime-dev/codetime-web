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
            required: ['event_time', 'language', 'project', 'relative_file', 'editor', 'platform', 'absolute_file', 'git_origin', 'git_branch'],
            properties: {
              event_time: { type: 'integer' },
              language: { type: 'string' },
              project: { type: 'string' },
              relative_file: { type: 'string' },
              editor: { type: 'string' },
              platform: { type: 'string' },
              absolute_file: { type: 'string' },
              git_origin: { type: 'string' },
              git_branch: { type: 'string' },
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
    event_time: r.eventTime,
    language: r.language,
    project: r.project,
    relative_file: r.relativeFile,
    editor: r.editor,
    platform: r.platform,
    absolute_file: r.absoluteFile ?? '',
    git_origin: r.gitOrigin ?? '',
    git_branch: r.gitBranch ?? '',
  }))
})
