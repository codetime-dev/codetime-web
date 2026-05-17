import { and, eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { machines } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Rename a machine the caller owns. Only `display_name` is mutable;
// hostname/platform are populated server-side from the ingest headers.

defineRouteMeta({
  openAPI: {
    tags: ['machines'],
    summary: 'Rename a machine',
    parameters: [
      { name: 'machine_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['displayName'],
            // minLength is rejected by Nuxt's openapi-types here too;
            // the handler enforces non-empty via its own validation.
            properties: { displayName: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated machine',
        content: { 'application/json': { schema: { type: 'object' } } },
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

  let body: { displayName?: unknown } | null = null
  try {
    body = (await readBody(event)) as { displayName?: unknown }
  }
  catch {
    return sendPyError(event, 400, 'Invalid JSON body')
  }
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
  if (!displayName) {
    return sendPyError(event, 400, 'displayName must be a non-empty string')
  }
  if (displayName.length > 255) {
    return sendPyError(event, 400, 'displayName must be 255 characters or fewer')
  }

  const db = useDb()
  // Update + ownership check in one round trip — RETURNING surfaces the
  // row only when (id, user_id) match.
  const [updated] = await db
    .update(machines)
    .set({ displayName })
    .where(and(eq(machines.id, machineId), eq(machines.userId, user.id)))
    .returning()

  if (!updated) {
    return sendPyError(event, 404, 'Machine not found')
  }

  return {
    id: updated.id,
    hostname: updated.hostname,
    displayName: updated.displayName,
    platform: updated.platform,
    source: updated.source,
    lastSeenAt: updated.lastSeenAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  }
})
