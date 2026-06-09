import { lt } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { cliLinkCodes } from '../../../../../db/schema'
import { CLI_LINK_POLL_INTERVAL_SECONDS, CLI_LINK_TTL_SECONDS, generateDeviceCode, generateUserCode } from '../../../../../utils/cli-link'
import { useDb } from '../../../../../utils/db'
import { frontendUrl } from '../../../../../utils/oauth'
import { sendPyError } from '../../../../../utils/py-error'

// Begin a browser login. Unauthenticated by design — the caller has no
// identity yet; that is exactly what this flow establishes. We mint a
// secret `device_code` (the CLI polls with it) and a public `user_code`
// (carried in the /cli/auth?code=… URL the browser opens), persist a
// short-lived pending row, and hand both back. The CLI then polls
// /v3/agent/cli/link/poll until the user approves it in the browser.

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Begin browser-based CLI login (device-code flow)',
    responses: {
      200: {
        description: 'A pending link code pair',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['deviceCode', 'userCode', 'verificationUri', 'verificationUriComplete', 'interval', 'expiresIn'],
              properties: {
                deviceCode: { type: 'string' },
                userCode: { type: 'string' },
                verificationUri: { type: 'string' },
                verificationUriComplete: { type: 'string' },
                interval: { type: 'integer' },
                expiresIn: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const db = useDb()

  // Opportunistic GC so abandoned codes don't accumulate. Cheap: the
  // table is tiny and short-lived by construction.
  await db.delete(cliLinkCodes).where(lt(cliLinkCodes.expiresAt, new Date()))

  const deviceCode = generateDeviceCode()
  const expiresAt = new Date(Date.now() + CLI_LINK_TTL_SECONDS * 1000)

  // user_code is unique; retry a few times on the astronomically
  // unlikely collision before giving up.
  let userCode = ''
  let inserted = false
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    userCode = generateUserCode()
    try {
      await db.insert(cliLinkCodes).values({ deviceCode, userCode, expiresAt })
      inserted = true
    }
    catch {
      // Unique violation on user_code — try a fresh one.
    }
  }
  if (!inserted) {
    return sendPyError(event, 503, 'Could not allocate a login code, please retry')
  }

  const fe = frontendUrl()
  return {
    deviceCode,
    userCode,
    verificationUri: `${fe}/cli/auth`,
    verificationUriComplete: `${fe}/cli/auth?code=${userCode}`,
    interval: CLI_LINK_POLL_INTERVAL_SECONDS,
    expiresIn: CLI_LINK_TTL_SECONDS,
  }
})
