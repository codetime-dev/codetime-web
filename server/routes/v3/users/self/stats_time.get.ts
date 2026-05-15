import type { SQL } from 'drizzle-orm'
import type { Unit } from '../../../../utils/stats-time'
import { and, count, desc, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRequestPath } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError, sendPyValidationError } from '../../../../utils/py-error'
import {
  computeWindow,
  needsMetaJoin,
  statsBaseWhere,
  timeTruncExpr,

} from '../../../../utils/stats-time'

// Mirrors GET /v3/users/self/stats_time. Group minute counts by
// day/hour/minute in the user's timezone. Free users limited to 90 days
// of total span and a user-supplied custom window must fall inside it.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Coding minutes bucketed by day/hour/minute',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
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
        description: 'Stats grouped by time',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/StatsTimeResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          StatsTimeResponse: {
            type: 'object',
            required: ['data'],
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/StatsTimeData' } },
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
  const unit = (typeof q.unit === 'string' ? q.unit : 'days') as Unit
  if (!['days', 'hours', 'minutes'].includes(unit)) {
    return sendPyValidationError(event, 'GET', getRequestPath(event), [
      { key: 'unit', message: 'Input should be \'days\', \'hours\' or \'minutes\'', source: 'query' },
    ])
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

  const where: SQL[] = statsBaseWhere(session.id, queryStart, queryEnd)
  const join = needsMetaJoin({ platform, project })
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
  const base = db.select({ time, duration: count() }).from(workspaceMinutesV2)
  const stmt = join
    ? base.innerJoin(workspaceMetaV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
    : base
  const rows = await stmt
    .where(and(...where))
    .groupBy(time)
    .orderBy(desc(time))
    .limit(finalLimit)

  // Postgres returns the truncated value as a timestamp-without-tz. If we
  // wrap it in `new Date(...)` here, Node parses it in the *process* time
  // zone, which then shifts the day label by ±1 once `toISOString()`
  // converts back to UTC. Format the value as a YYYY-MM-DD string in
  // memory using the raw row payload to keep the bucket label aligned
  // with Python's `date_trunc(..., timezone(tz, recorded_at))` output.
  return {
    data: rows.map((r) => {
      const raw = r.time as unknown
      let label: string
      if (raw instanceof Date) {
        // postgres-js returned a Date — reconstruct the original
        // wall-clock components in UTC (which matches the naive bucket
        // value Postgres produced).
        label = `${raw.getUTCFullYear().toString().padStart(4, '0')}-${(raw.getUTCMonth() + 1).toString().padStart(2, '0')}-${raw.getUTCDate().toString().padStart(2, '0')}`
      }
      else {
        label = String(raw).slice(0, 10)
      }
      return { duration: Number(r.duration), time: label }
    }),
  }
})
