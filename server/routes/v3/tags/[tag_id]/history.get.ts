import { and, count, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { tags, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'
import { parseDateParam } from '../../../../utils/stats-time'
import { toTagResponse } from '../../../../utils/tag-dto'
import { findMetaHashesMatchingRules } from '../../../../utils/tag-meta-hash'

// Mirrors GET /v3/tags/{tag_id}/history. Returns minute counts bucketed
// by day / week / month for a single tag. Free users limited to the
// last 90 days; default window is 90 days.

defineRouteMeta({
  openAPI: {
    tags: ['tags', 'statistics', 'history'],
    summary: 'Time history for a tag grouped by day/week/month',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'tag_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      { name: 'start_datetime', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_datetime', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'group_by', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' } },
    ],
    responses: {
      200: {
        description: 'Tag history',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagHistoryResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          StatsTimeData: {
            type: 'object',
            required: ['duration', 'time'],
            properties: {
              duration: { type: 'integer' },
              time: { type: 'string' },
            },
          },
          TagHistoryResponse: {
            type: 'object',
            required: ['tag', 'data', 'totalMinutes', 'periodStart', 'periodEnd'],
            properties: {
              tag: { $ref: '#/components/schemas/TagResponse' },
              data: { type: 'array', items: { $ref: '#/components/schemas/StatsTimeData' } },
              totalMinutes: { type: 'integer' },
              periodStart: { type: 'string', format: 'date' },
              periodEnd: { type: 'string', format: 'date' },
            },
          },
        },
      },
    },
  },
})

const NINETY_DAYS_MS = 90 * 86_400_000
const ALLOWED_GROUPS = new Set(['day', 'week', 'month'])

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const tagId = getRouterParam(event, 'tag_id')
  if (!tagId) {
    return sendPyError(event, 404, 'Tag not found')
  }

  const q = getQuery(event)
  const groupBy = (typeof q.group_by === 'string' ? q.group_by : 'day') as 'day' | 'week' | 'month'
  if (!ALLOWED_GROUPS.has(groupBy)) {
    return sendPyError(event, 400, 'group_by must be one of: day, week, month')
  }

  const endDt = parseDateParam(q.end_datetime) ?? new Date()
  const startDt = parseDateParam(q.start_datetime) ?? new Date(endDt.getTime() - 90 * 86_400_000)
  // Only enforce the 90-day cap when start_datetime was given explicitly;
  // the default window is exactly 90 days back and would otherwise self-trip.
  if (session.plan === 'free' && parseDateParam(q.start_datetime) && Date.now() - startDt.getTime() > NINETY_DAYS_MS) {
    return sendPyError(event, 403, 'Free plan users can only access the last 90 days of tag history.')
  }

  const db = useDb()
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.uid, session.id)))
    .limit(1)
  if (!tag) {
    return sendPyError(event, 404, 'Tag not found')
  }

  const emptyResponse = {
    tag: { ...toTagResponse(tag), rules: null },
    data: [],
    totalMinutes: 0,
    periodStart: startDt.toISOString().slice(0, 10),
    periodEnd: endDt.toISOString().slice(0, 10),
  }

  if (!tag.rulesJson) {
    return emptyResponse
  }

  const matchedHashes = await findMetaHashesMatchingRules(session.id, tag.rulesJson)
  if (matchedHashes.length === 0) {
    return emptyResponse
  }

  // date_trunc('week', ...) anchors on Monday; recorded_at is UTC, so
  // buckets are UTC dates.
  const bucket = sql<Date>`date_trunc(${groupBy}, ${workspaceMinutesV2.recordedAt})`.as('bucket')
  const rows = await db
    .select({ bucket, duration: count() })
    .from(workspaceMinutesV2)
    .where(and(
      eq(workspaceMinutesV2.uid, session.id),
      gte(workspaceMinutesV2.recordedAt, startDt),
      lt(workspaceMinutesV2.recordedAt, endDt),
      inArray(workspaceMinutesV2.metaXxh3_64, matchedHashes),
    ))
    .groupBy(bucket)
    .orderBy(bucket)

  const data = rows.map(r => ({
    duration: Number(r.duration),
    time: (r.bucket instanceof Date ? r.bucket : new Date(r.bucket as unknown as string)).toISOString().slice(0, 10),
  }))
  const totalMinutes = data.reduce((s, d) => s + d.duration, 0)

  return {
    tag: { ...toTagResponse(tag), rules: null },
    data,
    totalMinutes,
    periodStart: startDt.toISOString().slice(0, 10),
    periodEnd: endDt.toISOString().slice(0, 10),
  }
})
