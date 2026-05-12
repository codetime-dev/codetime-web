import { and, count, eq, gte, lt, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { workspaceMinutesV2 } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/minutes. Returns the raw count of
// workspace-minute rows for the user in the requested window.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Total coding minutes in a window',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'minutes', in: 'query', schema: { type: 'integer', minimum: 1 } },
      { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
      { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' } },
    ],
    responses: {
      200: {
        description: 'Minutes count',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SimpleMinutes' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          SimpleMinutes: {
            type: 'object',
            required: ['minutes'],
            properties: { minutes: { type: 'integer' } },
          },
        },
      },
    },
  },
})

function dt(v: unknown): Date | null {
  if (typeof v !== 'string' || !v) {
 return null
}
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const start = dt(q.start_time)
  const end = dt(q.end_time)
  const mins = q.minutes ? Number(q.minutes) : null

  const where = [eq(workspaceMinutesV2.uid, session.id)]
  if (start && end) {
    where.push(gte(workspaceMinutesV2.recordedAt, start), lte(workspaceMinutesV2.recordedAt, end))
  }
  else if (start) {
    where.push(gte(workspaceMinutesV2.recordedAt, start), lt(workspaceMinutesV2.recordedAt, new Date()))
  }
  else if (end) {
    where.push(lte(workspaceMinutesV2.recordedAt, end))
  }
  else if (mins !== null && Number.isFinite(mins)) {
    if (mins <= 0) {
 return sendPyError(event, 400, 'Minutes must be greater than 0')
}
    where.push(
      gte(workspaceMinutesV2.recordedAt, new Date(Date.now() - mins * 60_000)),
      lt(workspaceMinutesV2.recordedAt, new Date()),
    )
  }
  else {
    return sendPyError(event, 400, 'Either minutes or start_time/end_time must be provided')
  }

  const db = useDb()
  const [row] = await db.select({ value: count() }).from(workspaceMinutesV2).where(and(...where))
  return { minutes: Number(row?.value ?? 0) }
})
