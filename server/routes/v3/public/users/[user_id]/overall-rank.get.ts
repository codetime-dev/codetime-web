import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam, setHeader } from 'h3'
import { users } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'
import { fetchUserOverallRank } from '../../../../../utils/ranking'

// Mirrors GET /v3/public/users/{user_id}/overall-rank.

defineRouteMeta({
  openAPI: {
    tags: ['public', 'ranking'],
    summary: 'User\'s overall coding-time rank (public)',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Overall rank',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserOverallRankResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
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
  const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, uid)).limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const q = getQuery(event)
  const days = q.days !== undefined && q.days !== null && q.days !== '' ? Math.max(1, Math.trunc(Number(q.days))) : 30
  const now = new Date()
  const from = days ? new Date(now.getTime() - days * 86_400_000) : new Date(0)

  const rank = await fetchUserOverallRank(uid, from, now)
  if (!rank) {
    return {
      userId: uid,
      username: user.username,
      totalMinutes: 0,
      percentile: 100,
      timeRangeDays: days,
      updatedAt: now.toISOString(),
    }
  }
  return {
    userId: uid,
    username: user.username,
    totalMinutes: rank.totalMinutes,
    percentile: rank.percentile,
    timeRangeDays: days,
    updatedAt: now.toISOString(),
  }
})
