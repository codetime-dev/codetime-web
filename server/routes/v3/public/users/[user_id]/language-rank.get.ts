import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam, setHeader } from 'h3'
import { users } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'
import { fetchUserLanguageRank } from '../../../../../utils/ranking'

// Mirrors GET /v3/public/users/{user_id}/language-rank.

defineRouteMeta({
  openAPI: {
    tags: ['public', 'ranking'],
    summary: 'User\'s rank in a specific language',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'language', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
    ],
    responses: {
      200: {
        description: 'User language rank',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserLanguageRankResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          UserLanguageRankResponse: {
            type: 'object',
            required: ['userId', 'username', 'language', 'totalMinutes', 'rank', 'percentile', 'totalUsers', 'updatedAt'],
            properties: {
              userId: { type: 'integer' },
              username: { type: 'string' },
              language: { type: 'string' },
              totalMinutes: { type: 'integer' },
              rank: { type: 'integer' },
              percentile: { type: 'number' },
              totalUsers: { type: 'integer' },
              timeRangeDays: { type: 'integer', nullable: true },
              updatedAt: { type: 'string', format: 'date-time' },
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
  const q = getQuery(event)
  const language = typeof q.language === 'string' ? q.language : ''
  if (!language) {
 return sendPyError(event, 400, 'language is required')
}

  const db = useDb()
  const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, uid)).limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const days = q.days !== undefined && q.days !== null && q.days !== '' ? Math.max(1, Math.trunc(Number(q.days))) : 30
  const now = new Date()
  const from = days ? new Date(now.getTime() - days * 86_400_000) : new Date(0)

  const rank = await fetchUserLanguageRank(uid, language, from, now)
  if (!rank) {
    return {
      userId: uid,
      username: user.username,
      language,
      totalMinutes: 0,
      rank: 0,
      percentile: 100,
      totalUsers: 0,
      timeRangeDays: days,
      updatedAt: now.toISOString(),
    }
  }
  return {
    userId: uid,
    username: user.username,
    language,
    totalMinutes: rank.totalMinutes,
    rank: rank.rank,
    percentile: rank.percentile,
    totalUsers: rank.totalUsers,
    timeRangeDays: days,
    updatedAt: now.toISOString(),
  }
})
