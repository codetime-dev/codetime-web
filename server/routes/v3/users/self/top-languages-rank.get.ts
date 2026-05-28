import { defineEventHandler, getQuery } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'
import { fetchUserTopLanguagesRank } from '../../../../utils/ranking'

// Mirrors GET /v3/users/self/top-languages-rank. Returns the
// authenticated user's rank + percentile for each of their top N
// languages within the requested window (default last 30 days).

defineRouteMeta({
  openAPI: {
    tags: ['users', 'ranking'],
    summary: 'User\'s rank in each of their top languages',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'top_n', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 5, default: 5 } },
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1 } },
    ],
    responses: {
      200: {
        description: 'Top-language rankings',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserTopLanguagesRankResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          UserTopLanguageRankEntry: {
            type: 'object',
            required: ['language', 'totalMinutes'],
            // `percentile` is nulled on the public path when the target user
            // is opted out of the leaderboard; always present for self.
            properties: {
              language: { type: 'string' },
              totalMinutes: { type: 'integer' },
              percentile: { type: 'number', nullable: true },
            },
          },
          UserTopLanguagesRankResponse: {
            type: 'object',
            required: ['userId', 'username', 'entries', 'updatedAt'],
            properties: {
              userId: { type: 'integer' },
              username: { type: 'string' },
              entries: { type: 'array', items: { $ref: '#/components/schemas/UserTopLanguageRankEntry' } },
              timeRangeDays: { type: 'integer', nullable: true },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

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
  const topN = Math.min(5, Math.max(1, Math.trunc(Number(q.top_n) || 5)))
  let startTime = dt(q.start_time)
  let endTime = dt(q.end_time)
  const days = q.days ? Math.max(1, Math.trunc(Number(q.days))) : null
  if (!startTime || !endTime) {
    const d = days ?? 30
    endTime = new Date()
    startTime = new Date(endTime.getTime() - d * 86_400_000)
  }
  const denial = denyIfOutsideFreeWindow(event, session.plan, startTime, endTime)
  if (denial) {
 return denial
}

  const rows = await fetchUserTopLanguagesRank(session.id, topN, startTime, endTime)
  const calculatedDays = q.start_time && q.end_time
    ? Math.floor((endTime.getTime() - startTime.getTime()) / 86_400_000)
    : (days ?? 30)

  return {
    userId: session.id,
    username: session.username,
    entries: rows.map(r => ({ language: r.language, totalMinutes: r.totalMinutes, percentile: r.percentile })),
    timeRangeDays: calculatedDays,
    updatedAt: endTime.toISOString(),
  }
})
