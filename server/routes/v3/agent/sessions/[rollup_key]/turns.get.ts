import { and, asc, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { agentSessions, agentTurns } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { useDb } from '../../../../../utils/db'
import { agentVisibilityCutoff } from '../../../../../utils/plan-limits'
import { sendPyError } from '../../../../../utils/py-error'

// Per-turn breakdown for a session. Ordered oldest-first so timelines
// render naturally without a client-side sort.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'List turns within an agent session',
    parameters: [
      { name: 'rollup_key', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: {
      200: { description: 'Turn list' },
      401: { $ref: '#/components/responses/Unauthorized' },
      404: { $ref: '#/components/responses/NotFound' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const rollupKey = getRouterParam(event, 'rollup_key')
  if (!rollupKey) {
    return sendPyError(event, 400, 'rollup_key is required')
  }
  const db = useDb()
  // Ownership check — agent_turns rows carry user_id too, but going
  // through the session enforces that we don't leak orphaned children
  // from a dropped session belonging to someone else.
  const [session] = await db
    .select({ rollupKey: agentSessions.rollupKey, lastEventAt: agentSessions.lastEventAt })
    .from(agentSessions)
    .where(and(eq(agentSessions.rollupKey, rollupKey), eq(agentSessions.userId, user.id)))
    .limit(1)
  if (!session) {
    return sendPyError(event, 404, 'Session not found')
  }
  // Free plan: cap visibility to last 30 days.
  const cutoff = agentVisibilityCutoff(user.plan)
  if (cutoff && session.lastEventAt < cutoff) {
    return sendPyError(event, 404, 'Session not found')
  }
  const turns = await db
    .select()
    .from(agentTurns)
    .where(eq(agentTurns.rollupKey, rollupKey))
    .orderBy(asc(agentTurns.startedAt), asc(agentTurns.turnKey))

  return {
    turns: turns.map(t => ({
      turnKey: t.turnKey,
      turnId: t.turnId,
      sessionId: t.sessionId,
      source: t.source,
      project: t.project,
      startedAt: t.startedAt.toISOString(),
      lastEventAt: t.lastEventAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      promptSubmittedAt: t.promptSubmittedAt?.toISOString() ?? null,
      promptChars: t.promptChars,
      eventCount: t.eventCount,
      toolCallCount: t.toolCallCount,
      inputTokens: t.inputTokens,
      outputTokens: t.outputTokens,
      totalTokens: t.totalTokens,
      durationMs: t.durationMs,
    })),
  }
})
