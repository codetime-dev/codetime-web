import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { users, workspaceMetaV2, workspaceMinutesV2 } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Mirrors GET /v3/users/{user_id}/public/top-languages. Plan-gated
// clamping: free → 30 days / 5 langs, pro → 365 days / 12 langs.
// Aggregates minutes per language by joining workspace_minutes_v2 to
// workspace_meta_v2 on the xxh3_64 hash (V2 schema design).

const FREE_MAX_DAYS = 30
const FREE_MAX_LIMIT = 5
const PRO_MAX_DAYS = 365
const PRO_MAX_LIMIT = 12

defineRouteMeta({
  openAPI: {
    tags: ['users', 'widgets'],
    summary: 'Public top languages for embeddable widgets',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, default: 8 } },
    ],
    responses: {
      200: {
        description: 'Top languages by minutes',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetTopLanguagesResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          TopPublic: {
            type: 'object',
            required: ['field', 'minutes'],
            properties: {
              field: { type: 'string' },
              minutes: { type: 'integer' },
            },
          },
          WidgetTopLanguagesResponse: {
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

// Python's check_and_update_user_expiration drops the plan to 'free'
// once plan_expires_at has passed. We compute that effective plan
// without writing to the DB — the Python service still owns updates.
function effectivePlan(plan: string | null, planExpiresAt: Date | null): string {
  const p = (plan || 'free').toLowerCase()
  if (p === 'free') {
 return 'free'
}
  if (planExpiresAt && Date.now() >= planExpiresAt.getTime()) {
 return 'free'
}
  return p
}

export default defineEventHandler(async (event) => {
  const userIdStr = getRouterParam(event, 'user_id')
  const userId = Number(userIdStr)
  if (!Number.isFinite(userId) || userId <= 0) {
    return sendPyError(event, 404, 'User not found')
  }

  const db = useDb()
  const [userRow] = await db
    .select({ plan: users.plan, planExpiresAt: users.planExpiresAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!userRow) {
 return sendPyError(event, 404, 'User not found')
}

  const plan = effectivePlan(userRow.plan, userRow.planExpiresAt)
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
    .select({ field: workspaceMetaV2.language, minutes: count() })
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
    .groupBy(workspaceMetaV2.language)
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
