import { and, desc, eq, gte, lt, or } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { agentSessions } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { agentVisibilityCutoff } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'

// List the caller's agent sessions, most recent first. Cursor pagination
// uses (last_event_at, rollup_key) so ties on the timestamp stay stable.
// Cursor format: `${iso}_${rollupKey}` — opaque to clients.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'List agent sessions for the authenticated user',
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
      { name: 'cursor', in: 'query', schema: { type: 'string' } },
      { name: 'source', in: 'query', schema: { type: 'string' } },
      { name: 'project_id', in: 'query', schema: { type: 'string' } },
      { name: 'machine_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
    ],
    responses: {
      200: {
        description: 'Session page',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sessions', 'nextCursor'],
              properties: {
                sessions: {
                  type: 'array',
                  items: {
                    // Spelled out inline rather than referenced via
                    // $global.components so the schema travels with the
                    // route. Keep these fields aligned with the
                    // mapping in this handler's `sessions.map(...)`
                    // block below.
                    type: 'object',
                    required: [
                      'rollupKey',
'sessionId',
'source',
'machineId',
                      'startedAt',
'lastEventAt',
'eventCount',
'turnCount',
                      'toolCallCount',
'inputTokens',
'outputTokens',
                      'totalTokens',
'linesAdded',
'linesRemoved',
'durationMs',
                    ],
                    properties: {
                      rollupKey: { type: 'string' },
                      sessionId: { type: 'string' },
                      source: { type: 'string' },
                      agent: { type: 'string', nullable: true },
                      project: { type: 'string', nullable: true },
                      projectId: { type: 'string', nullable: true },
                      machineId: { type: 'string' },
                      startedAt: { type: 'string', format: 'date-time' },
                      lastEventAt: { type: 'string', format: 'date-time' },
                      eventCount: { type: 'integer' },
                      turnCount: { type: 'integer' },
                      toolCallCount: { type: 'integer' },
                      inputTokens: { type: 'integer' },
                      outputTokens: { type: 'integer' },
                      totalTokens: { type: 'integer' },
                      linesAdded: { type: 'integer' },
                      linesRemoved: { type: 'integer' },
                      durationMs: { type: 'integer' },
                    },
                  },
                },
                nextCursor: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseCursor(raw: unknown): { ts: Date, key: string } | null {
  if (typeof raw !== 'string') {
    return null
  }
  const idx = raw.indexOf('_')
  if (idx === -1) {
    return null
  }
  const ts = new Date(raw.slice(0, idx))
  if (Number.isNaN(ts.getTime())) {
    return null
  }
  return { ts, key: raw.slice(idx + 1) }
}

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const q = getQuery(event)
  let limit = Number(q.limit ?? DEFAULT_LIMIT)
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT
  }

  const filters = [eq(agentSessions.userId, user.id)]
  // Free plan: cap visibility to the last 30 days of sessions.
  const cutoff = agentVisibilityCutoff(user.plan)
  if (cutoff) {
    filters.push(gte(agentSessions.lastEventAt, cutoff))
  }
  if (typeof q.source === 'string' && q.source) {
    filters.push(eq(agentSessions.source, q.source))
  }
  if (typeof q.project_id === 'string' && q.project_id) {
    filters.push(eq(agentSessions.projectId, q.project_id))
  }
  if (typeof q.machine_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.machine_id)) {
    filters.push(eq(agentSessions.machineId, q.machine_id))
  }
  const cursor = parseCursor(q.cursor)
  if (cursor) {
    // Lexicographic tie-break on rollup_key for sessions sharing the
    // same last_event_at timestamp.
    filters.push(or(
      lt(agentSessions.lastEventAt, cursor.ts),
      and(eq(agentSessions.lastEventAt, cursor.ts), lt(agentSessions.rollupKey, cursor.key)),
    )!)
  }

  const db = useDb()
  const rows = await db
    .select()
    .from(agentSessions)
    .where(and(...filters))
    .orderBy(desc(agentSessions.lastEventAt), desc(agentSessions.rollupKey))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page.at(-1)
  const nextCursor = hasMore && last
    ? `${last.lastEventAt.toISOString()}_${last.rollupKey}`
    : null

  return {
    sessions: page.map(r => ({
      rollupKey: r.rollupKey,
      sessionId: r.sessionId,
      source: r.source,
      agent: r.agent,
      project: r.project,
      projectId: r.projectId,
      machineId: r.machineId,
      startedAt: r.startedAt.toISOString(),
      lastEventAt: r.lastEventAt.toISOString(),
      eventCount: r.eventCount,
      turnCount: r.turnCount,
      toolCallCount: r.toolCallCount,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      totalTokens: r.totalTokens,
      linesAdded: r.linesAdded,
      linesRemoved: r.linesRemoved,
      durationMs: r.durationMs,
    })),
    nextCursor,
  }
})
