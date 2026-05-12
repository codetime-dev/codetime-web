import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam, setHeader } from 'h3'
import { users } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'
import { fetchUserCodingHistory } from '../../../../../utils/ranking'

// Mirrors GET /v3/public/users/{user_id}/coding-history. Per-day
// coding-minute counts in the target user's timezone. Free users
// limited to 90 days back; pro/premium up to 365.

defineRouteMeta({
  openAPI: {
    tags: ['public', 'history'],
    summary: 'User\'s daily coding-minute history',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 365, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Coding history',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCodingHistoryResponse' } } },
      },
      403: { $ref: '#/components/responses/Forbidden' },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          UserCodingHistoryResponse: {
            type: 'object',
            required: ['user_id', 'username', 'total_minutes', 'data', 'period_start', 'period_end', 'time_range_days', 'updated_at'],
            properties: {
              user_id: { type: 'integer' },
              username: { type: 'string' },
              total_minutes: { type: 'integer' },
              data: { type: 'array', items: { $ref: '#/components/schemas/StatsTimeData' } },
              period_start: { type: 'string', format: 'date' },
              period_end: { type: 'string', format: 'date' },
              time_range_days: { type: 'integer' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300')
  const uid = Number(getRouterParam(event, 'user_id'))
  if (!Number.isFinite(uid) || uid <= 0) {
 return sendPyError(event, 404, 'User not found')
}

  const db = useDb()
  const [user] = await db
    .select({ username: users.username, plan: users.plan, timezone: users.timezone })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const q = getQuery(event)
  const days = Math.max(1, Math.trunc(Number(q.days) || 30))
  const maxDays = user.plan === 'pro' || user.plan === 'premium' ? 365 : 90
  if (days > maxDays) {
    return sendPyError(event, 403, `Non-pro users are limited to ${maxDays} days of history. Current plan: ${user.plan}`)
  }

  const now = new Date()
  const from = new Date(now.getTime() - days * 86_400_000)
  const tz = user.timezone || 'UTC'

  const rows = await fetchUserCodingHistory(uid, from, now, tz)
  return {
    user_id: uid,
    username: user.username,
    total_minutes: rows.reduce((s, r) => s + r.minutes, 0),
    data: rows.map(r => ({ duration: r.minutes, time: r.date })),
    period_start: from.toISOString().slice(0, 10),
    period_end: now.toISOString().slice(0, 10),
    time_range_days: days,
    updated_at: now.toISOString(),
  }
})
