import { and, count, desc, eq, gte, max } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { eventLogs, users, workspaceMinutesV2 } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

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
            required: ['username', 'plan', 'today_minutes'],
            properties: {
              username: { type: 'string' },
              plan: { type: 'string' },
              project: { type: 'string', nullable: true },
              language: { type: 'string', nullable: true },
              editor: { type: 'string', nullable: true },
              last_active_at: { type: 'integer', nullable: true, description: 'Unix seconds.' },
              today_minutes: { type: 'integer' },
            },
          },
        },
      },
    },
  },
})

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

// Compute the UTC instant at the start of today in the given IANA tz.
// Mirrors Python `datetime.now(tz).replace(hour=0...).astimezone(UTC)`.
function todayStartUtc(tzName: string): Date {
  const tz = isValidTimezone(tzName) ? tzName : 'Etc/UTC'
  const now = new Date()
  // Read the local Y/M/D in the target tz, then reconstruct midnight UTC
  // for that calendar date and shift by the tz offset at that moment.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
  const y = Number(get('year'))
  const m = Number(get('month'))
  const d = Number(get('day'))
  // Approximate offset from "local clock minus UTC clock" at this instant.
  const localMidnightUTC = Date.UTC(y, m - 1, d, 0, 0, 0)
  // What instant does that wall-clock midnight in tz correspond to in UTC?
  // Calculate offset minutes by formatting `now` and diffing wall-clock to UTC.
  const wallNowUtc = Date.UTC(y, m - 1, d, Number(get('hour')), Number(get('minute')), Number(get('second')))
  const offsetMs = wallNowUtc - now.getTime()
  return new Date(localMidnightUTC - offsetMs)
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  }
  catch {
    return false
  }
}

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
      planExpiresAt: users.planExpiresAt,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const plan = effectivePlan(user.plan, user.planExpiresAt)
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
    last_active_at: lastActiveAt,
    today_minutes: todayMinutes,
  }
})
