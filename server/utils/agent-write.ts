import type { SessionRollup } from './agent-types'
import { and, eq, inArray, sql } from 'drizzle-orm'
import {
  agentSessionFiles,
  agentSessionModels,
  agentSessions,
  agentTimeBuckets,
  agentToolCalls,
  agentTurns,
  machines,
  projects,
} from '../db/schema'
import { usdToMicros } from './agent-types'
import { useDb } from './db'

// Resolve (or create) the project_id for a (userId, project-string).
// Returns null when no project string is given. We dedupe on
// (user_id, git_origin=null, workspace_name=raw); the raw display
// string is stored as workspace_name for v1 — splitting into git/name
// happens once the CLI starts shipping a structured project object.
async function resolveProjectId(userId: number, project: string | undefined): Promise<string | null> {
  if (!project) {
    return null
  }
  const db = useDb()
  // Try fetch first; INSERT … ON CONFLICT cannot match on NULL git_origin.
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(
      eq(projects.userId, userId),
      sql`${projects.gitOrigin} IS NULL`,
      eq(projects.workspaceName, project),
    ))
    .limit(1)
  if (existing[0]) {
    return existing[0].id
  }
  const [inserted] = await db
    .insert(projects)
    .values({
      userId,
      gitOrigin: null,
      workspaceName: project,
      displayName: project,
    })
    .returning({ id: projects.id })
  return inserted!.id
}

// Refresh the machine's last_seen_at on every ingest call so the
// dashboard can show "active in last N hours" without scanning sessions.
export async function touchMachine(machineId: string): Promise<void> {
  const db = useDb()
  await db
    .update(machines)
    .set({ lastSeenAt: new Date() })
    .where(eq(machines.id, machineId))
}

export type IngestResult = {
  inserted: number
  skipped: number
  conflicts: number
  conflictIds: string[]
}

// Upsert a batch of rollups inside a single transaction. Idempotency is
// keyed on (rollup_key, payload_hash): identical payloads no-op, divergent
// payloads conflict unless `replace=true`.
export async function ingestRollups(
  rollups: SessionRollup[],
  ctx: { userId: number, machineId: string },
  options: { replace?: boolean } = {},
): Promise<IngestResult> {
  if (rollups.length === 0) {
    return { inserted: 0, skipped: 0, conflicts: 0, conflictIds: [] }
  }

  const db = useDb()
  const keys = [...new Set(rollups.map(r => r.rollupKey))]

  // Existing rows for conflict detection. We fetch only what we need.
  const existing = await db
    .select({ key: agentSessions.rollupKey, payloadHash: agentSessions.payloadHash })
    .from(agentSessions)
    .where(inArray(agentSessions.rollupKey, keys))
  const existingByKey = new Map(existing.map(r => [r.key, r.payloadHash]))

  const toWrite: SessionRollup[] = []
  const conflictIds: string[] = []
  let skipped = 0

  for (const rollup of rollups) {
    const prevHash = existingByKey.get(rollup.rollupKey)
    if (!prevHash) {
      toWrite.push(rollup)
      continue
    }
    if (prevHash === rollup.payloadHash) {
      skipped++
      continue
    }
    if (options.replace) {
      toWrite.push(rollup)
    }
    else {
      conflictIds.push(rollup.rollupKey)
    }
  }

  if (toWrite.length === 0) {
    return { inserted: 0, skipped, conflicts: conflictIds.length, conflictIds }
  }

  // Resolve all project FKs up front so the transaction stays write-only.
  const projectIdByRollup = new Map<string, string | null>()
  for (const r of toWrite) {
    projectIdByRollup.set(r.rollupKey, await resolveProjectId(ctx.userId, r.project))
  }

  await db.transaction(async (tx) => {
    const writeKeys = toWrite.map(r => r.rollupKey)
    // Clear any existing children for the keys we're (re)writing. The
    // FK cascade on agent_sessions handles the chain; explicit delete
    // here gives a stable plan independent of cascade ordering.
    await tx.delete(agentTurns).where(inArray(agentTurns.rollupKey, writeKeys))
    await tx.delete(agentToolCalls).where(inArray(agentToolCalls.rollupKey, writeKeys))
    await tx.delete(agentSessionModels).where(inArray(agentSessionModels.rollupKey, writeKeys))
    await tx.delete(agentSessionFiles).where(inArray(agentSessionFiles.rollupKey, writeKeys))
    await tx.delete(agentTimeBuckets).where(inArray(agentTimeBuckets.rollupKey, writeKeys))
    await tx.delete(agentSessions).where(inArray(agentSessions.rollupKey, writeKeys))

    for (const r of toWrite) {
      const projectId = projectIdByRollup.get(r.rollupKey) ?? null
      const baseFk = {
        userId: ctx.userId,
        machineId: ctx.machineId,
        projectId,
        sessionId: r.sessionId,
        source: r.source,
        project: r.project ?? null,
      }

      await tx.insert(agentSessions).values({
        rollupKey: r.rollupKey,
        ...baseFk,
        payloadHash: r.payloadHash,
        agent: r.agent ?? null,
        startedAt: new Date(r.startedAt),
        lastEventAt: new Date(r.lastEventAt),
        eventCount: r.eventCount,
        promptCount: r.promptCount,
        turnCount: r.turnCount,
        toolCallCount: r.toolCallCount,
        commandCallCount: r.commandCallCount,
        inputTokens: r.inputTokens,
        cachedInputTokens: r.cachedInputTokens,
        cacheCreationInputTokens: r.cacheCreationInputTokens,
        cacheReadInputTokens: r.cacheReadInputTokens,
        outputTokens: r.outputTokens,
        reasoningOutputTokens: r.reasoningOutputTokens,
        totalTokens: r.totalTokens,
        linesAdded: r.linesAdded,
        linesRemoved: r.linesRemoved,
        durationMs: r.durationMs,
      })

      if (r.timeBuckets.length > 0) {
        await tx.insert(agentTimeBuckets).values(r.timeBuckets.map((b, i) => ({
          bucketKey: `${r.rollupKey}:b:${i}`,
          rollupKey: r.rollupKey,
          ...baseFk,
          ts: new Date(b.ts),
          activityCount: b.activityCount,
          sessionStarts: b.sessionStarts,
          modelCalls: b.modelCalls,
          toolCalls: b.toolCalls,
          commandCalls: b.commandCalls,
          fileReads: b.fileReads,
          fileWrites: b.fileWrites,
          linesAdded: b.linesAdded,
          linesRemoved: b.linesRemoved,
          inputTokens: b.inputTokens,
          cachedInputTokens: b.cachedInputTokens,
          cacheCreationInputTokens: b.cacheCreationInputTokens,
          cacheReadInputTokens: b.cacheReadInputTokens,
          outputTokens: b.outputTokens,
          reasoningOutputTokens: b.reasoningOutputTokens,
          totalTokens: b.totalTokens,
          estimatedCostMicros: usdToMicros(b.estimatedCostUsd),
        })))
      }

      if (r.modelRollups.length > 0) {
        await tx.insert(agentSessionModels).values(r.modelRollups.map(m => ({
          modelKey: `${r.rollupKey}:m:${m.model}`,
          rollupKey: r.rollupKey,
          ...baseFk,
          model: m.model,
          callCount: m.callCount,
          inputTokens: m.inputTokens,
          cachedInputTokens: m.cachedInputTokens,
          cacheCreationInputTokens: m.cacheCreationInputTokens,
          cacheReadInputTokens: m.cacheReadInputTokens,
          outputTokens: m.outputTokens,
          reasoningOutputTokens: m.reasoningOutputTokens,
          totalTokens: m.totalTokens,
          estimatedCostMicros: usdToMicros(m.estimatedCostUsd),
        })))
      }

      if (r.toolRollups.length > 0) {
        await tx.insert(agentToolCalls).values(r.toolRollups.map(t => ({
          toolKey: `${r.rollupKey}:t:${t.tool}`,
          rollupKey: r.rollupKey,
          ...baseFk,
          tool: t.tool,
          callCount: t.callCount,
          failureCount: t.failureCount,
          totalDurationMs: t.totalDurationMs,
        })))
      }

      if (r.fileRollups.length > 0) {
        await tx.insert(agentSessionFiles).values(r.fileRollups.map(f => ({
          fileKey: `${r.rollupKey}:f:${f.pathHash}`,
          rollupKey: r.rollupKey,
          ...baseFk,
          pathHash: f.pathHash,
          displayPath: f.displayPath,
          reads: f.reads,
          writes: f.writes,
          linesAdded: f.linesAdded,
          linesRemoved: f.linesRemoved,
          lastTouchedAt: new Date(f.lastTouchedAt),
        })))
      }

      if (r.turnRollups && r.turnRollups.length > 0) {
        await tx.insert(agentTurns).values(r.turnRollups.map(tn => ({
          turnKey: `${r.rollupKey}:tn:${tn.turnId}`,
          rollupKey: r.rollupKey,
          ...baseFk,
          turnId: tn.turnId,
          startedAt: new Date(tn.startedAt),
          lastEventAt: new Date(tn.lastEventAt),
          completedAt: tn.completedAt ? new Date(tn.completedAt) : null,
          promptSubmittedAt: tn.promptSubmittedAt ? new Date(tn.promptSubmittedAt) : null,
          promptChars: tn.promptChars,
          eventCount: tn.eventCount,
          toolCallCount: tn.toolCallCount,
          inputTokens: tn.inputTokens,
          outputTokens: tn.outputTokens,
          totalTokens: tn.totalTokens,
          durationMs: tn.durationMs,
        })))
      }
    }
  })

  return {
    inserted: toWrite.length,
    skipped,
    conflicts: conflictIds.length,
    conflictIds,
  }
}
