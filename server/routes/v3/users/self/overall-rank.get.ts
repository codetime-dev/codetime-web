import { defineEventHandler, getQuery } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { denyIfOutsideFreeWindow } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'
import { fetchUserOverallRank } from '../../../../utils/ranking'

// Mirrors GET /v3/users/self/overall-rank. Returns the authenticated
// user's rank and percentile across all languages within the requested
// window (default last 30 days).

defineRouteMeta({
  openAPI: {
    tags: ['users', 'ranking'],
    summary: 'Authenticated user\'s overall coding-time rank',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1 } },
    ],
    responses: {
      200: {
        description: 'Overall rank',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserOverallRankResponse' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
    },
    $global: {
      components: {
        schemas: {
          UserOverallRankResponse: {
            type: 'object',
            required: ['userId', 'username', 'totalMinutes', 'percentile', 'updatedAt'],
            properties: {
              userId: { type: 'integer' },
              username: { type: 'string' },
              totalMinutes: { type: 'integer' },
              percentile: { type: 'number' },
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

  const calculatedDays = q.start_time && q.end_time
    ? Math.round((endTime.getTime() - startTime.getTime()) / 86_400_000)
    : (days ?? 30)
  const rank = await fetchUserOverallRank(session.id, startTime, endTime)
  if (!rank) {
    return {
      userId: session.id,
      username: session.username,
      totalMinutes: 0,
      percentile: 100,
      timeRangeDays: calculatedDays,
      updatedAt: endTime.toISOString(),
    }
  }
  return {
    userId: session.id,
    username: session.username,
    totalMinutes: rank.totalMinutes,
    percentile: rank.percentile,
    timeRangeDays: calculatedDays,
    updatedAt: endTime.toISOString(),
  }
})
