import type { WorkspaceData } from '../../../../utils/tag-rules'
import { and, eq, gte, lt } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { tags, workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'
import { toTagResponse } from '../../../../utils/tag-dto'
import { evaluateRule } from '../../../../utils/tag-rules'

// Mirrors GET /v3/tags/{tag_id}/history. Walks workspace minutes in the
// window, evaluates the tag's rule per row, and groups matches by day /
// week / month (UTC). Free users limited to last 90 days. Default
// window is the last 90 days when omitted.

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

function parseDate(v: unknown): Date | null {
  if (typeof v !== 'string' || !v) {
 return null
}
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function groupKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  // Truncate in UTC for stability with Python's date_trunc on UTC fields.
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  if (groupBy === 'day') {
 return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
}
  if (groupBy === 'month') {
 return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
}
  // week: Monday-anchored ISO week start.
  const dow = (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7
  const monday = new Date(Date.UTC(y, m, d - dow))
  return monday.toISOString().slice(0, 10)
}

const NINETY_DAYS_MS = 90 * 86_400_000

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
  if (!['day', 'week', 'month'].includes(groupBy)) {
    return sendPyError(event, 400, 'group_by must be one of: day, week, month')
  }

  const endDt = parseDate(q.end_datetime) ?? new Date()
  const startDt = parseDate(q.start_datetime) ?? new Date(endDt.getTime() - 90 * 86_400_000)
  if (session.plan === 'free' && parseDate(q.start_datetime) && Date.now() - startDt.getTime() > NINETY_DAYS_MS) {
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

  if (!tag.rulesJson) {
    return {
      tag: toTagResponse(tag),
      data: [],
      totalMinutes: 0,
      periodStart: startDt.toISOString().slice(0, 10),
      periodEnd: endDt.toISOString().slice(0, 10),
    }
  }

  const minutes = await db
    .select({
      recorded_at: workspaceMinutesV2.recordedAt,
      workspace_name: workspaceMetaV2.workspaceName,
      language: workspaceMetaV2.language,
      git_origin: workspaceMetaV2.gitOrigin,
      git_branch: workspaceMetaV2.gitBranch,
      platform: workspaceMetaV2.platform,
      editor: workspaceMetaV2.editor,
      absolute_file: workspaceMetaV2.absoluteFile,
      relative_file: workspaceMetaV2.relativeFile,
    })
    .from(workspaceMinutesV2)
    .innerJoin(
      workspaceMetaV2,
      and(
        eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      ),
    )
    .where(and(
      eq(workspaceMinutesV2.uid, session.id),
      gte(workspaceMinutesV2.recordedAt, startDt),
      lt(workspaceMinutesV2.recordedAt, endDt),
    ))

  const buckets = new Map<string, number>()
  let total = 0
  for (const row of minutes) {
    if (!evaluateRule(tag.rulesJson, row as WorkspaceData)) {
 continue
}
    const key = groupKey(row.recorded_at, groupBy)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
    total++
  }
  const data = [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([time, duration]) => ({ duration, time }))

  return {
    tag: toTagResponse(tag),
    data,
    totalMinutes: total,
    periodStart: startDt.toISOString().slice(0, 10),
    periodEnd: endDt.toISOString().slice(0, 10),
  }
})
