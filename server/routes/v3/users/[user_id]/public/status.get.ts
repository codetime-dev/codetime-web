import { and, count, desc, eq, gte, max } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { eventLogs, users, workspaceMinutesV2 } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'
import { todayStartUtc } from '../../../../../utils/tz'

// Mirrors GET /v3/users/{user_id}/public/status. Returns a snapshot for
// the embeddable status widget: latest event log + today's coding
// minutes computed in the user's own timezone. Free users may surface
// AT MOST ONE of {project, language}; editor is always free.

defineRouteMeta({
  openAPI: {
    tags: ['users', 'widgets'],
    summary: 'Public coding status snapshot',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      {
        name: 'show',
        in: 'query',
        schema: { type: 'string', default: 'project,language,editor' },
        description: 'CSV of fields to expose; only project/language/editor honored.',
      },
    ],
    responses: {
      200: {
        description: 'Widget status payload',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetStatusResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          WidgetStatusResponse: {
            type: 'object',
            required: ['username', 'plan', 'todayMinutes'],
            properties: {
              username: { type: 'string' },
              plan: { type: 'string' },
              project: { type: 'string', nullable: true },
              language: { type: 'string', nullable: true },
              editor: { type: 'string', nullable: true },
              lastActiveAt: { type: 'integer', nullable: true, description: 'Unix seconds.' },
              todayMinutes: { type: 'integer' },
            },
          },
        },
      },
    },
  },
})

const ALLOWED_FIELDS = new Set(['project', 'language', 'editor'])

export default defineEventHandler(async (event) => {
  const userIdStr = getRouterParam(event, 'user_id')
  const userId = Number(userIdStr)
  if (!Number.isFinite(userId) || userId <= 0) {
    return sendPyError(event, 404, 'User not found')
  }

  const db = useDb()
  const [user] = await db
    .select({
      username: users.username,
      plan: users.plan,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  // Python's expiration check is a no-op in practice (see top-languages.get.ts).
  const plan = (user.plan || 'free').toLowerCase()
  const isPro = plan === 'pro'

  // Parallel queries: most recent event log + max(recorded_at) + today's minutes.
  const startUtc = todayStartUtc(user.timezone || 'Etc/UTC')

  const [[latest], [lastRecord], [todayCount]] = await Promise.all([
    db
      .select({ project: eventLogs.project, language: eventLogs.language, editor: eventLogs.editor })
      .from(eventLogs)
      .where(eq(eventLogs.uid, userId))
      .orderBy(desc(eventLogs.eventTime))
      .limit(1),
    db
      .select({ lastAt: max(workspaceMinutesV2.recordedAt) })
      .from(workspaceMinutesV2)
      .where(eq(workspaceMinutesV2.uid, userId))
      .limit(1),
    db
      .select({ value: count() })
      .from(workspaceMinutesV2)
      .where(and(eq(workspaceMinutesV2.uid, userId), gte(workspaceMinutesV2.recordedAt, startUtc)))
      .limit(1),
  ])

  // Parse show CSV; free users may pick AT MOST ONE of {project, language}.
  const showQ = getQuery(event).show
  const showRaw = typeof showQ === 'string' ? showQ : 'project,language,editor'
  const requested = new Set(
    showRaw.split(',').map(s => s.trim().toLowerCase()).filter(s => ALLOWED_FIELDS.has(s)),
  )
  if (!isPro && requested.has('project') && requested.has('language')) {
    // Match Python: drop project, keep language.
    requested.delete('project')
  }

  const lastActiveAt = lastRecord?.lastAt ? Math.floor(lastRecord.lastAt.getTime() / 1000) : null
  const todayMinutes = Number(todayCount?.value ?? 0)

  return {
    username: user.username,
    plan,
    project: requested.has('project') ? (latest?.project ?? null) : null,
    language: requested.has('language') ? (latest?.language ?? null) : null,
    editor: requested.has('editor') ? (latest?.editor ?? null) : null,
    lastActiveAt,
    todayMinutes,
  }
})
