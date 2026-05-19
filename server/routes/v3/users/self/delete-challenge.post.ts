import type { DeletePurpose } from '../../../../utils/delete-challenge'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { CHALLENGE_TTL_MS, signDeleteChallenge } from '../../../../utils/delete-challenge'
import { sendPyError } from '../../../../utils/py-error'

// Issues a short-lived challenge token that the destructive
// /v3/users/self DELETE routes require alongside the auth cookie/Bearer.
// Sign / verify lives in server/utils/delete-challenge.ts.

const VALID_PURPOSES: ReadonlySet<DeletePurpose> = new Set(['account', 'data'])

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Issue a single-use destructive-action challenge token',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'purpose',
        in: 'query',
        required: true,
        schema: { type: 'string', enum: ['account', 'data'] },
        description: 'Which DELETE route the token authorises.',
      },
    ],
    responses: {
      201: {
        description: 'Challenge token issued',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['challenge', 'expiresAt', 'purpose'],
              properties: {
                challenge: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' },
                purpose: { type: 'string', enum: ['account', 'data'] },
              },
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
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const raw = getQuery(event).purpose
  const purpose = typeof raw === 'string' ? raw : ''
  if (!VALID_PURPOSES.has(purpose as DeletePurpose)) {
    return sendPyError(event, 400, 'purpose must be one of: account, data')
  }
  const expMs = Date.now() + CHALLENGE_TTL_MS
  const challenge = signDeleteChallenge(session.id, session.tokenV1, expMs, purpose as DeletePurpose)
  setResponseStatus(event, 201)
  return { challenge, expiresAt: new Date(expMs).toISOString(), purpose }
})
