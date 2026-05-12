import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/workspace. Per-file activity within a
// workspace, grouped by (language, relative_file, git_branch) and
// ordered by minutes desc.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'File activity within a workspace',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'project', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1 } },
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
    ],
    responses: {
      200: {
        description: 'Workspace file activity',
        content: {
          'application/json': {
            schema: { type: 'array', items: { $ref: '#/components/schemas/WorkspaceFileActivity' } },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          WorkspaceFileActivity: {
            type: 'object',
            required: ['language', 'relativeFile', 'gitBranch', 'minutes'],
            properties: {
              language: { type: 'string' },
              relativeFile: { type: 'string' },
              gitBranch: { type: 'string' },
              minutes: { type: 'integer' },
            },
          },
        },
      },
    },
  },
})

function dt(v: unknown): Date | null {
  if (typeof v !== 'string' || !v) {
 return null
}
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const project = typeof q.project === 'string' ? q.project : ''
  if (!project) {
 return sendPyError(event, 400, 'project is required')
}
  const days = q.days ? Math.max(1, Math.trunc(Number(q.days))) : null
  const startTime = dt(q.start_time)
  const endTime = dt(q.end_time)

  const now = new Date()
  let startBound: Date | null = null
  let endBound: Date = now
  const minDate = (a: Date, b: Date) => (a.getTime() < b.getTime() ? a : b)
  if (startTime && endTime) {
    startBound = startTime
    endBound = minDate(endTime, now)
  }
  else if (startTime) {
    startBound = startTime
  }
  else if (endTime) {
    endBound = minDate(endTime, now)
  }
  else if (days) {
    startBound = new Date(now.getTime() - days * 86_400_000)
  }

  const where: SQL[] = [
    eq(workspaceMinutesV2.uid, session.id),
    eq(workspaceMetaV2.workspaceName, project),
    lte(workspaceMinutesV2.recordedAt, endBound),
  ]
  if (startBound) {
 where.push(gte(workspaceMinutesV2.recordedAt, startBound))
}

  const db = useDb()
  const rows = await db
    .select({
      language: workspaceMetaV2.language,
      relativeFile: workspaceMetaV2.relativeFile,
      gitBranch: workspaceMetaV2.gitBranch,
      minutes: count(),
    })
    .from(workspaceMetaV2)
    .innerJoin(workspaceMinutesV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
    .where(and(...where))
    .groupBy(workspaceMetaV2.language, workspaceMetaV2.relativeFile, workspaceMetaV2.gitBranch)
    .orderBy(desc(count()))

  return rows.map(r => ({
    language: r.language ?? '',
    relativeFile: r.relativeFile ?? '',
    gitBranch: r.gitBranch ?? '',
    minutes: Number(r.minutes),
  }))
})
