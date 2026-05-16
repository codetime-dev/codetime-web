import { and, count, eq, gte, inArray, isNotNull, lt } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { tags, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { parseDateParam } from '../../../utils/stats-time'
import { toTagResponse } from '../../../utils/tag-dto'
import { findMetaHashesForRulesBatch } from '../../../utils/tag-meta-hash'

// Mirrors GET /v3/tags/stats. Returns per-tag minute totals for the
// requested window. Free users limited to the last 90 days. Tags with
// no rules contribute zero. Rules are evaluated per-meta (small set);
// minute aggregation is a single GROUP BY query that we partition into
// per-tag sums in memory.

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
            required: ['tag', 'totalMinutes'],
            properties: {
              tag: { $ref: '#/components/schemas/TagResponse' },
              totalMinutes: { type: 'integer' },
            },
          },
          TagTimeStatsResponse: {
            type: 'object',
            required: ['data', 'totalMinutes', 'periodStart', 'periodEnd'],
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/TagTimeData' } },
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

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const q = getQuery(event)
  const endDt = parseDateParam(q.end_datetime) ?? new Date()
  const startDt = parseDateParam(q.start_datetime) ?? new Date(endDt.getTime() - 30 * 86_400_000)

  if (session.plan === 'free' && Date.now() - startDt.getTime() > NINETY_DAYS_MS) {
    return sendPyError(event, 403, 'Free plan users can only access the last 90 days of tag statistics.')
  }

  const requestedIds = typeof q.tag_ids === 'string' && q.tag_ids
    ? q.tag_ids.split(',').map(s => s.trim()).filter(Boolean)
    : null

  const db = useDb()
  const tagWhere = [eq(tags.uid, session.id), isNotNull(tags.rulesJson)]
  if (requestedIds && requestedIds.length > 0) {
    tagWhere.push(inArray(tags.id, requestedIds))
  }
  const tagRows = await db.select().from(tags).where(and(...tagWhere))
  if (tagRows.length === 0) {
    return {
      data: [],
      totalMinutes: 0,
      periodStart: startDt.toISOString().slice(0, 10),
      periodEnd: endDt.toISOString().slice(0, 10),
    }
  }

  const hashesByTag = await findMetaHashesForRulesBatch(
    session.id,
    tagRows.filter(t => t.rulesJson).map(t => ({ key: t.id, rulesJson: t.rulesJson })),
  )
  const allHashes = new Set<bigint>()
  for (const hashes of hashesByTag.values()) {
    for (const h of hashes) {
      allHashes.add(h)
    }
  }

  const countsByHash = new Map<bigint, number>()
  if (allHashes.size > 0) {
    const grouped = await db
      .select({ hash: workspaceMinutesV2.metaXxh3_64, value: count() })
      .from(workspaceMinutesV2)
      .where(and(
        eq(workspaceMinutesV2.uid, session.id),
        gte(workspaceMinutesV2.recordedAt, startDt),
        lt(workspaceMinutesV2.recordedAt, endDt),
        inArray(workspaceMinutesV2.metaXxh3_64, [...allHashes]),
      ))
      .groupBy(workspaceMinutesV2.metaXxh3_64)
    for (const row of grouped) {
      countsByHash.set(row.hash, Number(row.value))
    }
  }

  // Rules payload is dropped from the response by design (matches Python).
  const data = tagRows.map((tag) => {
    let total = 0
    for (const h of hashesByTag.get(tag.id) ?? []) {
      total += countsByHash.get(h) ?? 0
    }
    return { tag: { ...toTagResponse(tag), rules: null }, totalMinutes: total }
  })

  return {
    data,
    totalMinutes: data.reduce((s, d) => s + d.totalMinutes, 0),
    periodStart: startDt.toISOString().slice(0, 10),
    periodEnd: endDt.toISOString().slice(0, 10),
  }
})
