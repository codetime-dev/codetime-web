import { eq } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { cliLinkCodes, users } from '../../../../../db/schema'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Poll a pending login. Unauthenticated — the secret `deviceCode` (issued
// by /start, never shown to the user) is the bearer here. Returns one of:
//   { status: 'pending' }                       — not approved yet
//   { status: 'approved', token, userId }       — done; row is consumed
//   { status: 'expired' }                        — unknown/expired code
// The upload token is resolved live from the users row at approval time,
// so it is never duplicated into the link table.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Poll a browser-based CLI login',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['deviceCode'],
            properties: { deviceCode: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Current status of the login',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['pending', 'approved', 'expired'] },
                token: { type: 'string' },
                userId: { type: 'integer' },
              },
            },
          },
        },
      },
      400: { $ref: '#/components/responses/BadRequest' },
    },
  },
})

export default defineEventHandler(async (event) => {
  let body: { deviceCode?: unknown }
  try {
    body = (await readBody(event)) as { deviceCode?: unknown }
  }
  catch {
    return sendPyError(event, 400, 'Invalid JSON body')
  }
  const deviceCode = typeof body?.deviceCode === 'string' ? body.deviceCode : ''
  if (!deviceCode) {
    return sendPyError(event, 400, 'deviceCode is required')
  }

  const db = useDb()
  const rows = await db.select().from(cliLinkCodes).where(eq(cliLinkCodes.deviceCode, deviceCode)).limit(1)
  const row = rows[0]

  // Unknown code, or expired: treat both as terminal "expired" so the CLI
  // stops polling and tells the user to restart. Sweep the stale row.
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await db.delete(cliLinkCodes).where(eq(cliLinkCodes.deviceCode, deviceCode))
    }
    return { status: 'expired' as const }
  }

  if (!row.approvedAt || row.userId == null) {
    return { status: 'pending' as const }
  }

  // Approved — resolve the live upload token and consume the row so the
  // device code can't be replayed. If the user vanished (deleted between
  // approve and poll), fail closed as expired.
  const userRows = await db.select({ uploadToken: users.uploadToken }).from(users).where(eq(users.id, row.userId)).limit(1)
  await db.delete(cliLinkCodes).where(eq(cliLinkCodes.deviceCode, deviceCode))
  const token = userRows[0]?.uploadToken
  if (!token) {
    return { status: 'expired' as const }
  }
  return { status: 'approved' as const, token, userId: row.userId }
})
