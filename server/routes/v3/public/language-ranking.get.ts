import { and, countDistinct, eq, gte } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { workspaceMinutesV2 } from '../../../db/schema'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { fetchLanguageRanking } from '../../../utils/ranking'

// Mirrors GET /v3/public/language-ranking. Per-language leaderboard for
// the requested window (default last 30 days, or all-time when days
// is explicitly null).

defineRouteMeta({
  openAPI: {
    tags: ['public', 'statistics'],
    summary: 'Top users for a specific programming language',
    parameters: [
      { name: 'language', in: 'query', required: true, schema: { type: 'string' } },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Language ranking',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LanguageRankingResponse' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
    },
    $global: {
      components: {
        schemas: {
          LanguageRankingEntry: {
            type: 'object',
            required: ['user', 'totalMinutes', 'rank', 'percentile'],
            properties: {
              user: { $ref: '#/components/schemas/UserPublic' },
              totalMinutes: { type: 'integer' },
              rank: { type: 'integer' },
              percentile: { type: 'number' },
            },
          },
          LanguageRankingResponse: {
            type: 'object',
            required: ['entries', 'language', 'totalUsers', 'updatedAt'],
            properties: {
              entries: { type: 'array', items: { $ref: '#/components/schemas/LanguageRankingEntry' } },
              language: { type: 'string' },
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
  const q = getQuery(event)
  const language = typeof q.language === 'string' ? q.language : ''
  if (!language) {
 return sendPyError(event, 400, 'language is required')
}
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(q.limit) || 50)))
  const days = q.days !== undefined && q.days !== null && q.days !== '' ? Math.max(1, Math.trunc(Number(q.days))) : 30
  const now = new Date()
  const from = days ? new Date(now.getTime() - days * 86_400_000) : new Date(0)

  const entries = await fetchLanguageRanking(language, from, now, limit)

  const db = useDb()
  const [totalRow] = await db
    .select({ value: countDistinct(workspaceMinutesV2.uid) })
    .from(workspaceMinutesV2)
    .where(and(eq(workspaceMinutesV2.language, language), gte(workspaceMinutesV2.recordedAt, from)))

  return {
    entries: entries.map(r => ({
      user: {
        // Python forces email/googleId to null on the public ranking;
        // githubId is only exposed when the target user opts in.
        id: r.userId,
        email: null,
        username: r.username,
        avatar: r.avatar,
        githubId: r.showGithub ? r.githubId : null,
        bio: r.bio,
        googleId: null,
        plan: r.plan,
        timezone: r.timezone,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      totalMinutes: r.totalMinutes,
      rank: r.rank,
      percentile: r.percentile,
    })),
    language,
    totalUsers: Number(totalRow?.value ?? 0),
    timeRangeDays: days,
    updatedAt: now.toISOString(),
  }
})
