import process from 'node:process'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { linkProviderIdentity, verifyAppleIdentityToken } from '../../../../utils/oauth'
import { sendPyError } from '../../../../utils/py-error'

// POST /v3/auth/apple/link — attach a Sign in with Apple identity to the
// currently signed-in user. Frontend passes the same payload it would
// post to /v3/auth/apple for sign-in (identity_token + raw nonce from
// the AppleID JS SDK popup).
//
// No cookie minting; the user is already signed in. Audience matches the
// web Service ID (NUXT_PUBLIC_APPLE_SERVICE_ID via APPLE_WEB_SERVICE_ID).

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Link a Sign in with Apple identity to the signed-in user',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['identity_token', 'nonce'],
            properties: {
              identity_token: { type: 'string' },
              nonce: { type: 'string', description: 'Raw nonce passed to AppleID.auth.init.' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Linked (or already linked to the same Apple identity).',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['success', 'outcome'],
              properties: {
                success: { type: 'boolean' },
                outcome: { type: 'string', enum: ['linked', 'already-yours'] },
              },
            },
          },
        },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      409: { $ref: '#/components/responses/Conflict' },
    },
  },
})

type Body = { identity_token?: unknown, nonce?: unknown }

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const body = await readBody<Body>(event).catch(() => ({} as Body))
  const identityToken = typeof body.identity_token === 'string' ? body.identity_token : ''
  const rawNonce = typeof body.nonce === 'string' ? body.nonce : ''
  if (!identityToken || !rawNonce) {
    return sendPyError(event, 400, 'identity_token and nonce are required')
  }

  const webServiceId = process.env.APPLE_WEB_SERVICE_ID
  if (!webServiceId) {
    console.error('[auth.apple.link] APPLE_WEB_SERVICE_ID is not configured')
    return sendPyError(event, 500, 'Apple Sign In is not configured')
  }

  let sub: string
  try {
    const claims = await verifyAppleIdentityToken(identityToken, webServiceId, rawNonce)
    sub = claims.sub
  }
  catch (error) {
    console.error('[auth.apple.link]', (error as Error).message)
    return sendPyError(event, 401, 'Apple identity verification failed')
  }

  const outcome = await linkProviderIdentity(session.id, 'appleId', sub)
  switch (outcome) {
    case 'linked':
    case 'already-yours': {
      setResponseStatus(event, 200)
      return { success: true, outcome }
    }
    case 'taken-by-self': {
      return sendPyError(event, 400, 'A different Apple account is already linked; disconnect it first')
    }
    case 'conflict': {
      return sendPyError(event, 409, 'This Apple account is already linked to another Code Time user')
    }
  }
})
