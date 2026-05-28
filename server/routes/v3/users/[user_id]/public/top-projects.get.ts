import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { users, workspaceMetaV2, workspaceMinutesV2 } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { canExposePublicData, isWidgetCaller, resolveUserPrivacy } from '../../../../../utils/privacy'
import { sendPyError } from '../../../../../utils/py-error'

// GET /v3/users/{user_id}/public/top-projects. Symmetric to
// top-languages but grouped by workspace name, gated by the
// `history.projects` facet. Plan caps mirror top-languages:
// free → 30 days / 5 items, pro → 365 days / 12 items.

const FREE_MAX_DAYS = 30
const FREE_MAX_LIMIT = 5
const PRO_MAX_DAYS = 365
const PRO_MAX_LIMIT = 12

defineRouteMeta({
  openAPI: {
    tags: ['users', 'widgets'],
    summary: 'Public top projects for embeddable widgets',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 8 } },
    ],
    responses: {
      200: {
        description: 'Top projects by minutes',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetTopProjectsResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          WidgetTopProjectsResponse: {
            type: 'object',
            required: ['plan', 'days', 'limit', 'capped', 'items'],
            properties: {
              plan: { type: 'string' },
              days: { type: 'integer' },
              limit: { type: 'integer' },
              capped: { type: 'boolean' },
              items: { type: 'array', items: { $ref: '#/components/schemas/TopPublic' } },
            },
          },
        },
      },
    },
  },
})

function intOr(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

export default defineEventHandler(async (event) => {
  const userIdStr = getRouterParam(event, 'user_id')
  const userId = Number(userIdStr)
  if (!Number.isFinite(userId) || userId <= 0) {
    return sendPyError(event, 404, 'User not found')
  }

  const db = useDb()
  const [userRow] = await db
    .select({ plan: users.plan, privacy: users.privacy })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!userRow) {
    return sendPyError(event, 404, 'User not found')
  }

  // Privacy ceiling: project breakdown is the `history.projects` facet.
  // Widget callers (?widget=1) are gated by widgetsEnabled, the profile/
  // direct path by profilePublic.
  const privacy = resolveUserPrivacy(userRow.privacy)
  if (!canExposePublicData(privacy, privacy.history.projects === 'public', isWidgetCaller(getQuery(event).widget))) {
    return sendPyError(event, 403, 'Hidden by privacy settings')
  }

  const plan = (userRow.plan || 'free').toLowerCase()
  const isPro = plan === 'pro'
  const maxDays = isPro ? PRO_MAX_DAYS : FREE_MAX_DAYS
  const maxLimit = isPro ? PRO_MAX_LIMIT : FREE_MAX_LIMIT

  const q = getQuery(event)
  const requestedDays = Math.max(1, intOr(q.days, 30))
  const requestedLimit = Math.max(1, intOr(q.limit, 8))
  const clampedDays = Math.min(requestedDays, maxDays)
  const clampedLimit = Math.min(requestedLimit, maxLimit)
  const capped = requestedDays > clampedDays || requestedLimit > clampedLimit

  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - clampedDays * 86_400_000)

  const rows = await db
    .select({ field: workspaceMetaV2.workspaceName, minutes: count() })
    .from(workspaceMinutesV2)
    .innerJoin(
      workspaceMetaV2,
      eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
    )
    .where(and(
      eq(workspaceMinutesV2.uid, userId),
      gte(workspaceMinutesV2.recordedAt, startTime),
      lte(workspaceMinutesV2.recordedAt, endTime),
    ))
    .groupBy(workspaceMetaV2.workspaceName)
    .orderBy(desc(count()))
    .limit(clampedLimit)

  return {
    plan,
    days: clampedDays,
    limit: clampedLimit,
    capped,
    items: rows.map(r => ({ field: String(r.field || 'unknown'), minutes: Number(r.minutes) })),
  }
})
