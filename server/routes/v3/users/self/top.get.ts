import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRequestPath } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError, sendPyValidationError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/top. Returns the top N field values
// (language|workspace|editor|platform) for the authenticated user,
// optionally filtered by an arbitrary combination of language /
// workspace / platform / editor sets, within a time window.
//
// Free users:
//   - max 10 results
//   - max window: last 90 days
// Default window when none provided: last 90 days for free, unbounded
// for pro (Python uses now-90d only when window absent).

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Top N by language/workspace/editor/platform',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'field', in: 'query', required: true, schema: { type: 'string', enum: ['language', 'workspace', 'editor', 'platform'] } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
      { name: 'minutes', in: 'query', schema: { type: 'integer', minimum: 1 } },
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'languages', in: 'query', style: 'form', explode: true, schema: { type: 'array', items: { type: 'string' } } },
      { name: 'workspaces', in: 'query', style: 'form', explode: true, schema: { type: 'array', items: { type: 'string' } } },
      { name: 'platforms', in: 'query', style: 'form', explode: true, schema: { type: 'array', items: { type: 'string' } } },
      { name: 'editors', in: 'query', style: 'form', explode: true, schema: { type: 'array', items: { type: 'string' } } },
    ],
    responses: {
      200: {
        description: 'Top N items',
        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TopPublic' } } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
  },
})

const META_FIELD: Record<string, any> = {
  language: workspaceMetaV2.language,
  workspace: workspaceMetaV2.workspaceName,
  editor: workspaceMetaV2.editor,
  platform: workspaceMetaV2.platform,
}

function parseList(v: unknown): string[] | null {
  if (Array.isArray(v)) {
 return v.map(String).filter(Boolean)
}
  if (typeof v === 'string' && v) {
 return v.split(',').map(s => s.trim()).filter(Boolean)
}
  return null
}

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
  // Mirror Python's `field: Literal[...]` required parameter (see
  // controllers/users.py::list_self_top). Litestar emits a "Missing
  // required query parameter" error when absent and a validation
  // envelope when present-but-invalid.
  const path = getRequestPath(event)
  if (q.field === undefined) {
    return sendPyError(event, 400, `Missing required query parameter 'field' for path ${path}`)
  }
  const field = String(q.field)
  if (!META_FIELD[field]) {
    return sendPyValidationError(event, 'GET', path, [
      { key: 'field', message: "Input should be 'language', 'workspace', 'editor' or 'platform'", source: 'query' },
    ])
  }

  const startTime = dt(q.start_time)
  const endTime = dt(q.end_time)
  let minutes = q.minutes ? Math.max(1, Math.trunc(Number(q.minutes))) : null
  const isFree = session.plan === 'free'

  if (startTime && endTime) {
    const denial = denyIfOutsideFreeWindow(event, session.plan, startTime, endTime)
    if (denial) {
 return denial
}
  }
  else if (minutes && isFree && minutes > 90 * 60 * 24) {
    return sendPyError(event, 403, 'Free plan can only fetch logs for 90 days')
  }
  else if (!minutes && !startTime && !endTime && isFree) {
    minutes = 90 * 60 * 24
  }

  const limit = q.limit ? Math.max(1, Math.trunc(Number(q.limit))) : 10
  if (isFree && limit > 10) {
 return sendPyError(event, 403, 'Free plan can only fetch top 10 items')
}

  const languages = parseList(q.languages)
  const workspaces = parseList(q.workspaces)
  const platforms = parseList(q.platforms)
  const editors = parseList(q.editors)

  const db = useDb()
  const needsMetaJoin = field !== 'language' || workspaces || platforms || editors
  const groupExpr: any = needsMetaJoin ? META_FIELD[field] : workspaceMinutesV2.language

  const where: SQL[] = [
    eq(workspaceMinutesV2.uid, session.id),
    lte(workspaceMinutesV2.recordedAt, sql`now()`),
  ]
  if (startTime && endTime) {
 where.push(gte(workspaceMinutesV2.recordedAt, startTime), lte(workspaceMinutesV2.recordedAt, endTime))
}
  else if (startTime) {
 where.push(gte(workspaceMinutesV2.recordedAt, startTime))
}
  else if (endTime) {
 where.push(lte(workspaceMinutesV2.recordedAt, endTime))
}
  else if (minutes) {
 where.push(gte(workspaceMinutesV2.recordedAt, new Date(Date.now() - minutes * 60_000)))
}
  if (languages) {
 where.push(inArray(needsMetaJoin ? workspaceMetaV2.language : workspaceMinutesV2.language, languages))
}
  if (workspaces) {
 where.push(inArray(workspaceMetaV2.workspaceName, workspaces))
}
  if (platforms) {
 where.push(inArray(workspaceMetaV2.platform, platforms))
}
  if (editors) {
 where.push(inArray(workspaceMetaV2.editor, editors))
}

  const base = db.select({ field: groupExpr, value: count() }).from(workspaceMinutesV2)
  const stmt = needsMetaJoin
    ? base.innerJoin(workspaceMetaV2, eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64))
    : base
  const rows = await stmt.where(and(...where)).groupBy(groupExpr).orderBy(desc(count())).limit(limit)
  return rows.map(r => ({ field: String(r.field ?? ''), minutes: Number(r.value) }))
})
