import type { H3Event } from 'h3'
import type { AuthUser } from './auth'
import type { useDb } from './db'
import type { DeletePurpose } from './delete-challenge'
import { eq } from 'drizzle-orm'
import { readBody } from 'h3'
import {
  agentSessionFiles,
  agentSessionModels,
  agentSessions,
  agentTimeBuckets,
  agentToolCalls,
  agentTurns,
  eventLogs,
  machines,
  projects,
  tags,
  workspaceMetaV2,
  workspaceMinutesV2,
} from '../db/schema'
import { verifyDeleteChallenge } from './delete-challenge'
import { sendPyError } from './py-error'

// Shared bits between DELETE /v3/users/self and DELETE /v3/users/self/data.
// Both flows wipe the same activity / telemetry / metadata tables; only the
// full-account flow also scrubs the users row, so it lives in self.delete.ts.

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Children before parent. agent_sessions.* children have ON DELETE CASCADE,
// but explicit by-user deletes also catch rows whose parent session is
// already gone.
export async function deleteUserActivityData(tx: Tx, uid: number): Promise<void> {
  await tx.delete(agentTurns).where(eq(agentTurns.userId, uid))
  await tx.delete(agentToolCalls).where(eq(agentToolCalls.userId, uid))
  await tx.delete(agentSessionModels).where(eq(agentSessionModels.userId, uid))
  await tx.delete(agentSessionFiles).where(eq(agentSessionFiles.userId, uid))
  await tx.delete(agentTimeBuckets).where(eq(agentTimeBuckets.userId, uid))
  await tx.delete(agentSessions).where(eq(agentSessions.userId, uid))

  await tx.delete(workspaceMinutesV2).where(eq(workspaceMinutesV2.uid, uid))
  await tx.delete(workspaceMetaV2).where(eq(workspaceMetaV2.uid, uid))
  await tx.delete(eventLogs).where(eq(eventLogs.uid, uid))
  await tx.delete(tags).where(eq(tags.uid, uid))

  await tx.delete(projects).where(eq(projects.userId, uid))
  await tx.delete(machines).where(eq(machines.userId, uid))
}

// Step-up: require a fresh purpose-bound challenge token plus the user
// typing their own username. Defeats blind XSS / click-jacking firing a
// working DELETE from a stolen session — the attacker would also need to
// read the user's profile.
// Returns a sent response when validation fails (caller must `return` it),
// or null when the request is good to proceed.
export async function denyIfDeleteChallengeInvalid(
  event: H3Event,
  session: AuthUser,
  purpose: DeletePurpose,
): Promise<ReturnType<typeof sendPyError> | null> {
  const body = await readBody<{ challenge?: unknown, confirmUsername?: unknown }>(event).catch(() => null)
  const challenge = typeof body?.challenge === 'string' ? body.challenge : ''
  const confirmUsername = typeof body?.confirmUsername === 'string' ? body.confirmUsername : ''
  if (!challenge || !verifyDeleteChallenge(challenge, session.id, session.tokenV1, purpose)) {
    return sendPyError(event, 401, 'Delete challenge missing or expired; request a new one')
  }
  if (confirmUsername !== session.username) {
    return sendPyError(event, 400, 'Username confirmation does not match')
  }
  return null
}
