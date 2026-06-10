import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { agentSessionFiles, agentSessionModels, agentSessions, agentTimeBuckets, agentToolCalls } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { agentVisibilityCutoff } from '../../../../utils/plan-limits'
import { sendPyError } from '../../../../utils/py-error'

// Full session detail: the agent_sessions row plus its time-buckets,
// per-model breakdown, per-tool stats, and touched files. Turns live on
// a separate route (sessions/:key/turns) because clients usually want
// pagination there.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Get a single agent session with rolled-up children',
    parameters: [
      { name: 'rollup_key', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: {
      200: { description: 'Session detail' },
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
  const [session] = await db
    .select()
    .from(agentSessions)
    .where(and(eq(agentSessions.rollupKey, rollupKey), eq(agentSessions.userId, user.id)))
    .limit(1)
  if (!session) {
    return sendPyError(event, 404, 'Session not found')
  }
  // Free plan: hide sessions older than the 30-day window. Return 404
  // (not 403) to avoid leaking the existence of older rollup keys.
  const cutoff = agentVisibilityCutoff(user.plan)
  if (cutoff && session.lastEventAt < cutoff) {
    return sendPyError(event, 404, 'Session not found')
  }

  // Children are bounded by the session's lifetime — for ordinary
  // interactive sessions these stay well under a thousand rows total, so
  // we hydrate everything in one trip. Add server-side pagination if
  // long unattended sessions push these into the multi-thousand range.
  const [models, tools, files, buckets] = await Promise.all([
    db.select().from(agentSessionModels).where(eq(agentSessionModels.rollupKey, rollupKey)),
    db.select().from(agentToolCalls).where(eq(agentToolCalls.rollupKey, rollupKey)),
    db.select().from(agentSessionFiles).where(eq(agentSessionFiles.rollupKey, rollupKey)),
    db.select().from(agentTimeBuckets).where(eq(agentTimeBuckets.rollupKey, rollupKey)),
  ])

  return {
    session: {
      rollupKey: session.rollupKey,
      sessionId: session.sessionId,
      source: session.source,
      agent: session.agent,
      project: session.project,
      projectId: session.projectId,
      machineId: session.machineId,
      startedAt: session.startedAt.toISOString(),
      lastEventAt: session.lastEventAt.toISOString(),
      eventCount: session.eventCount,
      promptCount: session.promptCount,
      turnCount: session.turnCount,
      toolCallCount: session.toolCallCount,
      commandCallCount: session.commandCallCount,
      inputTokens: session.inputTokens,
      cachedInputTokens: session.cachedInputTokens,
      cacheCreationInputTokens: session.cacheCreationInputTokens,
      cacheReadInputTokens: session.cacheReadInputTokens,
      outputTokens: session.outputTokens,
      reasoningOutputTokens: session.reasoningOutputTokens,
      totalTokens: session.totalTokens,
      linesAdded: session.linesAdded,
      linesRemoved: session.linesRemoved,
      // Wall-clock session span (first event → last event), not the
      // dashboard's per-turn active-time metric.
      durationMs: session.durationMs,
    },
    models,
    tools,
    files: files.map(f => ({ ...f, lastTouchedAt: f.lastTouchedAt.toISOString() })),
    timeBuckets: buckets.map(b => ({ ...b, ts: b.ts.toISOString() })),
  }
})
