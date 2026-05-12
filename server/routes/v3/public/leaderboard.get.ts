import { count } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { users } from '../../../db/schema'
import { useDb } from '../../../utils/db'
import { fetchLeaderboard } from '../../../utils/ranking'

// Mirrors GET /v3/public/leaderboard. Public top N by coding-time, with
// optional days window. Python caches at 5 minutes — we use s-maxage so
// any CDN in front of Nuxt does the same.

defineRouteMeta({
  openAPI: {
    tags: ['public', 'statistics'],
    summary: 'Top users by coding time',
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Leaderboard',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaderboardResponse' } } },
      },
    },
    $global: {
      components: {
        schemas: {
          LeaderboardEntry: {
            type: 'object',
            required: ['user', 'totalMinutes', 'rank'],
            properties: {
              user: { $ref: '#/components/schemas/UserPublic' },
              totalMinutes: { type: 'integer' },
              rank: { type: 'integer' },
            },
          },
          LeaderboardResponse: {
            type: 'object',
            required: ['entries', 'totalUsers', 'updatedAt'],
            properties: {
              entries: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
              totalUsers: { type: 'integer' },
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
  const q = getQuery(event)
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(q.limit) || 20)))
  const days = q.days !== undefined && q.days !== null && q.days !== '' ? Math.max(1, Math.trunc(Number(q.days))) : 30
  const now = new Date()
  const from = days ? new Date(now.getTime() - days * 86_400_000) : new Date(0)

  const rows = await fetchLeaderboard(from, now, limit)
  const db = useDb()
  const [totalRow] = await db.select({ value: count() }).from(users)

  return {
    entries: rows.map(r => ({
      user: {
        id: r.userId,
        email: null, // Python forces null on the public leaderboard
        username: r.username,
        avatar: r.avatar,
        githubId: r.githubId,
        bio: r.bio,
        googleId: null,
        plan: r.plan,
        timezone: r.timezone,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      },
      totalMinutes: r.totalMinutes,
      rank: r.rank,
    })),
    totalUsers: Number(totalRow?.value ?? 0),
    updatedAt: now.toISOString(),
  }
})
