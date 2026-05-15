import type { SQL } from 'drizzle-orm'
import { and, asc, count, eq, gte, lte, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/time-distribution. Returns coding-minute
// counts bucketed by wall-clock hour+minute in the user's timezone over
// the requested window (default last 30 days).

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Coding minutes distribution across the local clock',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1 } },
      { name: 'tz', in: 'query', schema: { type: 'string' } },
      { name: 'platform', in: 'query', schema: { type: 'string' } },
      { name: 'project', in: 'query', schema: { type: 'string' } },
      { name: 'language', in: 'query', schema: { type: 'string' } },
    ],
    responses: {
      200: {
        description: 'Time distribution',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeDistributionResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          TimeDistributionData: {
            type: 'object',
            required: ['hour', 'minute', 'count'],
            properties: {
              hour: { type: 'integer' },
              minute: { type: 'integer' },
              count: { type: 'integer' },
            },
          },
          TimeDistributionResponse: {
            type: 'object',
            required: ['data'],
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/TimeDistributionData' } },
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
function s(v: unknown): string | null {
 return typeof v === 'string' && v ? v : null
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  let startTime = dt(q.start_time)
  let endTime = dt(q.end_time)
  const days = q.days ? Math.max(1, Math.trunc(Number(q.days))) : null
  if (!startTime || !endTime) {
    const d = days ?? 30
    endTime = new Date()
    startTime = new Date(endTime.getTime() - d * 86_400_000)
  }

  const denial = denyIfOutsideFreeWindow(event, session.plan, startTime, endTime)
  if (denial) {
 return denial
}

  const tz = s(q.tz) || session.timezone || 'UTC'
  const platform = s(q.platform)
  const project = s(q.project)
  const language = s(q.language)
  const needsJoin = Boolean(platform || project || (language && (platform || project)))

  // tz is inlined as a SQL string literal so SELECT and GROUP BY produce
  // byte-identical expressions; see stats-time.ts for the same reason.
  const tzLit = `'${tz.replaceAll('\'', '\'\'')}'`
  const hour = sql<number>`${sql.raw(`extract(hour from timezone(${tzLit}, "workspace_minutes_v2"."recorded_at"))`)}`
  const minute = sql<number>`${sql.raw(`extract(minute from timezone(${tzLit}, "workspace_minutes_v2"."recorded_at"))`)}`

  const where: SQL[] = [
    eq(workspaceMinutesV2.uid, session.id),
    gte(workspaceMinutesV2.recordedAt, startTime),
    lte(workspaceMinutesV2.recordedAt, endTime),
  ]
  if (language && !needsJoin) {
 where.push(eq(workspaceMinutesV2.language, language))
}
  if (needsJoin) {
    if (platform) {
 where.push(eq(workspaceMetaV2.platform, platform))
}
    if (project) {
 where.push(eq(workspaceMetaV2.workspaceName, project))
}
    if (language) {
 where.push(eq(workspaceMetaV2.language, language))
}
  }

  const db = useDb()
  const base = db.select({ hour, minute, count: count() }).from(workspaceMinutesV2)
  const stmt = needsJoin
    ? base.innerJoin(workspaceMetaV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
    : base
  const rows = await stmt
    .where(and(...where))
    .groupBy(hour, minute)
    .orderBy(asc(hour), asc(minute))

  return {
    data: rows.map(r => ({ hour: Number(r.hour), minute: Number(r.minute), count: Number(r.count) })),
  }
})
