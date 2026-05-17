import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { agentSessions, machines } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Delete a machine the caller owns, plus all agent rollups that came
// from it. Done as a transaction so a partial failure leaves nothing
// stranded. agent_sessions cascades to its child tables via the FK in
// 0001_agent_merger.sql.

defineRouteMeta({
  openAPI: {
    tags: ['machines'],
    summary: 'Delete a machine and its agent rollups',
    parameters: [
      { name: 'machine_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    responses: {
      200: {
        description: 'Delete result',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['deletedMachine', 'deletedSessions'],
              properties: {
                deletedMachine: { type: 'boolean' },
                deletedSessions: { type: 'integer' },
              },
            },
          },
        },
      },
      400: { $ref: '#/components/responses/BadRequest' },
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
  const machineId = getRouterParam(event, 'machine_id')
  if (!machineId) {
    return sendPyError(event, 400, 'machine_id is required')
  }

  const db = useDb()
  const result = await db.transaction(async (tx) => {
    // Owned-or-bust: returning the machine row inside the same tx
    // guarantees we never delete sessions for a machine the user does
    // not own.
    const [owned] = await tx
      .select({ id: machines.id })
      .from(machines)
      .where(and(eq(machines.id, machineId), eq(machines.userId, user.id)))
      .limit(1)
    if (!owned) {
      return null
    }

    const droppedSessions = await tx
      .delete(agentSessions)
      .where(and(eq(agentSessions.userId, user.id), eq(agentSessions.machineId, machineId)))
      .returning({ rollupKey: agentSessions.rollupKey })

    await tx.delete(machines).where(eq(machines.id, machineId))

    return { deletedMachine: true, deletedSessions: droppedSessions.length }
  })

  if (!result) {
    return sendPyError(event, 404, 'Machine not found')
  }
  return result
})
