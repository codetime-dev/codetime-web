import { and, eq, gt, isNull } from 'drizzle-orm'
import { defineEventHandler, readBody } from 'h3'
import { cliLinkCodes } from '../../../../../db/schema'
import { tryUser } from '../../../../../utils/auth'
import { normalizeUserCode } from '../../../../../utils/cli-link'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'

// Approve a pending login from a signed-in browser tab. Authenticated
// with the user's session cookie — the `user_id` stamped onto the row is
// whoever clicked "Authorize" on /cli/auth, and the CLI's next poll
// inherits THAT user's upload token.
//
// CSRF: the session cookie is SameSite=Lax, so a cross-site POST from a
// malicious page won't carry it and this returns 401. Combined with the
// explicit Authorize click (no auto-approval on page load), that blocks
// the drive-by where an attacker binds a victim's account to the
// attacker's CLI session.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Approve a browser-based CLI login',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userCode'],
            properties: { userCode: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Approved',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ok'],
              properties: { ok: { type: 'boolean' } },
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

  let body: { userCode?: unknown }
  try {
    body = (await readBody(event)) as { userCode?: unknown }
  }
  catch {
    return sendPyError(event, 400, 'Invalid JSON body')
  }
  const userCode = normalizeUserCode(body?.userCode)
  if (!userCode) {
    return sendPyError(event, 400, 'A valid userCode is required')
  }

  const db = useDb()
  // Only bind a pending, unexpired row. `approvedAt IS NULL` keeps this
  // idempotent-ish: a double click on a row already approved by THIS user
  // still 404s, which the page treats as "already done".
  const updated = await db
    .update(cliLinkCodes)
    .set({ userId: user.id, approvedAt: new Date() })
    .where(and(
      eq(cliLinkCodes.userCode, userCode),
      isNull(cliLinkCodes.approvedAt),
      gt(cliLinkCodes.expiresAt, new Date()),
    ))
    .returning({ deviceCode: cliLinkCodes.deviceCode })

  if (updated.length === 0) {
    return sendPyError(event, 404, 'That login code is invalid or has expired')
  }
  return { ok: true }
})
