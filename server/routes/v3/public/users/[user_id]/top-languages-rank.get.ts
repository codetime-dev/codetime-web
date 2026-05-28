import { eq } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam, setHeader } from 'h3'
import { users } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { canExposePublicData, isWidgetCaller, resolveUserPrivacy } from '../../../../../utils/privacy'
import { sendPyError } from '../../../../../utils/py-error'
import { fetchUserTopLanguagesRank } from '../../../../../utils/ranking'

// Mirrors GET /v3/public/users/{user_id}/top-languages-rank.

defineRouteMeta({
  openAPI: {
    tags: ['public', 'ranking'],
    summary: 'User\'s rank in each of their top languages (public)',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'top_n', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 20, default: 5 } },
      { name: 'days', in: 'query', schema: { type: 'integer', minimum: 1, default: 30 } },
    ],
    responses: {
      200: {
        description: 'Top-language rankings',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserTopLanguagesRankResponse' } } },
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
  const [user] = await db.select({ username: users.username, leaderboardListed: users.leaderboardListed, privacy: users.privacy }).from(users).where(eq(users.id, uid)).limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const q = getQuery(event)

  // Two facets gate this endpoint independently:
  //   * history.languages → the language list itself (entries)
  //   * leaderboardListed → each entry's `percentile` rank field
  // Both share the caller's surface master (widgetsEnabled vs profilePublic).
  const privacy = resolveUserPrivacy(user.privacy)
  const widgetCaller = isWidgetCaller(q.widget)
  const showEntries = canExposePublicData(privacy, privacy.history.languages === 'public', widgetCaller)
  const showPercentile = canExposePublicData(privacy, user.leaderboardListed, widgetCaller)
  if (!showEntries) {
    return sendPyError(event, 403, 'Hidden by privacy settings')
  }
  const topN = Math.min(20, Math.max(1, Math.trunc(Number(q.top_n) || 5)))
  const days = q.days !== undefined && q.days !== null && q.days !== '' ? Math.max(1, Math.trunc(Number(q.days))) : 30
  const now = new Date()
  const from = days ? new Date(now.getTime() - days * 86_400_000) : new Date(0)

  const rows = await fetchUserTopLanguagesRank(uid, topN, from, now)
  return {
    userId: uid,
    username: user.username,
    entries: rows.map(r => ({
      language: r.language,
      totalMinutes: r.totalMinutes,
      percentile: showPercentile ? r.percentile : null,
    })),
    timeRangeDays: days,
    updatedAt: now.toISOString(),
  }
})
