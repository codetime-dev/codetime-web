import type { WorkspaceData } from '../../../utils/tag-rules'
import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { tags, workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toTagResponse } from '../../../utils/tag-dto'
import { evaluateRule } from '../../../utils/tag-rules'

// Mirrors GET /v3/tags/stats. For each user tag that has JSON rules,
// counts the workspace_minutes_v2 rows in [start_datetime, end_datetime)
// whose joined meta satisfies the rule. Free users limited to the last
// 90 days. Returns a per-tag minutes breakdown.

defineRouteMeta({
  openAPI: {
    tags: ['tags', 'statistics'],
    summary: 'Time statistics per tag within a window',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'start_datetime', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_datetime', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'tag_ids', in: 'query', schema: { type: 'string', description: 'Comma-separated tag UUIDs' } },
    ],
    responses: {
      200: {
        description: 'Tag time stats',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TagTimeStatsResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          TagTimeData: {
            type: 'object',
            required: ['tag', 'total_minutes'],
            properties: {
              tag: { $ref: '#/components/schemas/TagResponse' },
              total_minutes: { type: 'integer' },
            },
          },
          TagTimeStatsResponse: {
            type: 'object',
            required: ['data', 'total_minutes', 'period_start', 'period_end'],
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/TagTimeData' } },
              total_minutes: { type: 'integer' },
              period_start: { type: 'string', format: 'date' },
              period_end: { type: 'string', format: 'date' },
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

const NINETY_DAYS_MS = 90 * 86_400_000

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const endDt = parseDate(q.end_datetime) ?? new Date()
  const startDt = parseDate(q.start_datetime) ?? new Date(endDt.getTime() - 30 * 86_400_000)

  if (session.plan === 'free' && Date.now() - startDt.getTime() > NINETY_DAYS_MS) {
    return sendPyError(event, 403, 'Free plan users can only access the last 90 days of tag statistics.')
  }

  const requestedIds = typeof q.tag_ids === 'string' && q.tag_ids
    ? q.tag_ids.split(',').map(s => s.trim()).filter(Boolean)
    : null

  const db = useDb()
  const tagWhere = [eq(tags.uid, session.id), isNotNull(tags.rulesJson)]
  if (requestedIds) {
 tagWhere.push(sql`${tags.id} IN ${requestedIds}`)
}
  const tagRows = await db.select().from(tags).where(and(...tagWhere))
  if (tagRows.length === 0) {
    return {
      data: [],
      total_minutes: 0,
      period_start: startDt.toISOString().slice(0, 10),
      period_end: endDt.toISOString().slice(0, 10),
    }
  }

  // Fetch each minute's meta in the window. Heavy for wide ranges; the
  // Python code does the same scan.
  const minutes = await db
    .select({
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

  const data = tagRows.map((tag) => {
    let total = 0
    for (const m of minutes) {
      if (evaluateRule(tag.rulesJson, m as WorkspaceData)) {
 total++
}
    }
    return { tag: toTagResponse(tag), total_minutes: total }
  })

  return {
    data,
    total_minutes: data.reduce((s, d) => s + d.total_minutes, 0),
    period_start: startDt.toISOString().slice(0, 10),
    period_end: endDt.toISOString().slice(0, 10),
  }
})
