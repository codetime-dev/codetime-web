import type { SQL } from 'drizzle-orm'
import type { Unit } from '../../../../utils/stats-time'
import { and, count, desc, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'
import {
  computeWindow,
  META_BY,
  needsMetaJoin,
  statsBaseWhere,
  timeTruncExpr,

} from '../../../../utils/stats-time'

// Mirrors GET /v3/users/self/stats. Two-axis aggregation: bucketed time
// (by day/hour/minute in the user's tz) crossed with one of
// language|workspace|editor|platform. Free users limited to 90 days.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Coding minutes bucketed by time and a categorical axis',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'by', in: 'query', required: true, schema: { type: 'string', enum: ['language', 'workspace', 'editor', 'platform'] } },
      { name: 'unit', in: 'query', schema: { type: 'string', enum: ['days', 'hours', 'minutes'], default: 'days' } },
      { name: 'tz', in: 'query', schema: { type: 'string' } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'platform', in: 'query', schema: { type: 'string' } },
      { name: 'project', in: 'query', schema: { type: 'string' } },
      { name: 'language', in: 'query', schema: { type: 'string' } },
    ],
    responses: {
      200: {
        description: 'Stats data points',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/StatsResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          StatsData: {
            type: 'object',
            required: ['duration', 'time', 'by'],
            properties: {
              duration: { type: 'integer' },
              time: { type: 'string' },
              by: { type: 'string' },
            },
          },
          StatsResponse: {
            type: 'object',
            required: ['data'],
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/StatsData' } },
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
  const by = String(q.by || '')
  if (!META_BY[by]) {
 return sendPyError(event, 400, 'Invalid by field')
}
  const unit = (typeof q.unit === 'string' ? q.unit : 'days') as Unit
  if (!['days', 'hours', 'minutes'].includes(unit)) {
 return sendPyError(event, 400, 'Invalid unit')
}
  const tz = s(q.tz) || session.timezone || 'etc/UTC'
  const limit = Math.max(1, Math.trunc(Number(q.limit) || 30))
  const startTime = dt(q.start_time)
  const endTime = dt(q.end_time)
  const platform = s(q.platform)
  const project = s(q.project)
  const language = s(q.language)

  if (startTime && endTime && session.plan !== 'pro') {
    const denial = denyIfOutsideFreeWindow(event, session.plan, startTime, endTime)
    if (denial) {
 return denial
}
  }

  const { queryStart, queryEnd, limit: finalLimit } = computeWindow({
    startTime,
endTime,
unit,
limit,
isPro: session.plan === 'pro',
  })

  const join = needsMetaJoin({ platform, project, by })
  const byField = join ? META_BY[by] : workspaceMinutesV2.language

  const where: SQL[] = statsBaseWhere(session.id, queryStart, queryEnd)
  if (platform) {
 where.push(eq(workspaceMetaV2.platform, platform))
}
  if (project) {
 where.push(eq(workspaceMetaV2.workspaceName, project))
}
  if (language) {
 where.push(eq(workspaceMinutesV2.language, language))
}

  const time = timeTruncExpr(unit, tz)
  const db = useDb()
  const base = db.select({ by: byField, time, duration: count() }).from(workspaceMinutesV2)
  const stmt = join
    ? base.innerJoin(workspaceMetaV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
    : base
  const rows = await stmt
    .where(and(...where))
    .groupBy(byField, time)
    .orderBy(desc(time), desc(count()))
    .limit(finalLimit)

  return {
    data: rows.map(r => ({
      duration: Number(r.duration),
      time: new Date(r.time as any).toISOString().slice(0, 10),
      by: String(r.by ?? 'Unknown'),
    })),
  }
})
