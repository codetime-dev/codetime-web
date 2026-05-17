import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { agentSessions } from '../../../../db/schema'
import { resolveAgentMachine } from '../../../../utils/agent-machine'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Delete all agent session rollups belonging to the caller for a given
// `source` AND `machineId`. Used by the CLI's `backfill import --force`
// path so it can purge old rollups from this host before reimporting.
//
// Scope is intentionally narrow: only rollups for the caller's current
// machine are touched. Without that constraint, running --force on a
// laptop would wipe rollups submitted from a desktop too.
//
// Child rows (turns/tools/files/models/time_buckets) cascade via the FK
// declared in 0001_agent_merger.sql.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Delete agent session rollups by source for the current machine',
    parameters: [
      {
        name: 'X-Machine-Id',
        in: 'header',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      {
        name: 'source',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Agent source id (e.g. claude, codex, opencode, pi).',
      },
    ],
    responses: {
      200: {
        description: 'Delete result',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['deleted'],
              properties: { deleted: { type: 'integer' } },
            },
          },
        },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const machine = await resolveAgentMachine(event, user.id)
  if (!machine.ok) {
    return sendPyError(event, machine.status, machine.detail)
  }

  const q = getQuery(event)
  const source = typeof q.source === 'string' ? q.source.trim() : ''
  if (!source) {
    return sendPyError(event, 400, 'source query parameter is required')
  }

  const db = useDb()
  const deleted = await db
    .delete(agentSessions)
    .where(and(
      eq(agentSessions.userId, user.id),
      eq(agentSessions.machineId, machine.machineId),
      eq(agentSessions.source, source),
    ))
    .returning({ rollupKey: agentSessions.rollupKey })

  return { deleted: deleted.length }
})
