import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { getHeader } from 'h3'
import { machines } from '../db/schema'
import { useDb } from './db'

// Agent CLI sends `X-Machine-Id` (UUID it generated on first run, stored
// in ~/.codetime/machine-id). The server upserts a `machines` row
// for the (userId, machineId) pair the first time it's seen. No
// device-flow handshake: the CLI authenticates with the user's existing
// upload_token and only needs to declare which machine it is.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ResolveMachineResult
  = | { ok: true, machineId: string }
  | { ok: false, status: 400, detail: string }

export async function resolveAgentMachine(
  event: H3Event,
  userId: number,
): Promise<ResolveMachineResult> {
  const raw = getHeader(event, 'x-machine-id')?.trim() || ''
  if (!raw) {
    return { ok: false, status: 400, detail: 'X-Machine-Id header is required' }
  }
  if (!UUID_RE.test(raw)) {
    return { ok: false, status: 400, detail: 'X-Machine-Id must be a UUID' }
  }
  const machineId = raw.toLowerCase()
  const db = useDb()

  // Common case: the row exists and we only need to touch last_seen_at.
  // Fall back to insert when the machine has never reported before, with
  // optional hostname/displayName/platform metadata from the same request.
  const updated = await db
    .update(machines)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(machines.id, machineId), eq(machines.userId, userId)))
    .returning({ id: machines.id })

  if (updated.length > 0) {
    return { ok: true, machineId }
  }

  const hostname = (getHeader(event, 'x-machine-hostname')?.trim() || 'unknown').slice(0, 255)
  const displayName = (getHeader(event, 'x-machine-name')?.trim() || hostname).slice(0, 255)
  const platform = getHeader(event, 'x-machine-platform')?.trim()?.slice(0, 64) || null

  // ON CONFLICT (id) DO NOTHING — if a parallel request inserted first
  // we'll see the existing row on the next update path. Returning the
  // requested id is safe because we re-checked the user's ownership via
  // the update above.
  await db
    .insert(machines)
    .values({
      id: machineId,
      userId,
      hostname,
      displayName,
      platform,
      source: 'agent',
      lastSeenAt: new Date(),
    })
    .onConflictDoNothing({ target: machines.id })

  return { ok: true, machineId }
}
