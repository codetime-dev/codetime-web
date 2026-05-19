import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { linkProviderIdentity, verifyGoogleIdToken } from '../../../../utils/oauth'
import { sendPyError } from '../../../../utils/py-error'

// POST /v3/auth/google/link — attach a Google identity to the currently
// signed-in user. The frontend obtains the same `credential` JWT it would
// post to /v3/auth/google for sign-in (via Google Identity Services) and
// sends it here instead.
//
// We deliberately do NOT mint/rotate auth cookies — the user is already
// signed in. Conflicts (sub belongs to someone else) return 409; trying
// to overwrite a previously-linked Google identity returns 400 with a
// hint to disconnect the existing one first.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Link a Google account to the signed-in user',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['credential'],
            properties: {
              credential: { type: 'string', description: 'Google ID token (same JWT as /v3/auth/google).' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Linked (or already linked to the same Google identity).',
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

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
    return sendPyError(event, 401, 'Not authenticated')
  }

  const body = await readBody<{ credential?: unknown }>(event).catch(() => null)
  const credential = typeof body?.credential === 'string' ? body.credential : ''
  if (!credential || credential.length < 32 || credential.length > 4096) {
    return sendPyError(event, 400, 'Missing or invalid credential')
  }

  let sub: string
  try {
    const claims = await verifyGoogleIdToken(credential)
    if (!claims.sub) {
      return sendPyError(event, 400, 'Google identity token missing sub')
    }
    sub = claims.sub
  }
  catch (error) {
    console.error('[auth.google.link]', (error as Error).message)
    return sendPyError(event, 401, 'Google identity verification failed')
  }

  const outcome = await linkProviderIdentity(session.id, 'googleId', sub)
  switch (outcome) {
    case 'linked':
    case 'already-yours': {
      setResponseStatus(event, 200)
      return { success: true, outcome }
    }
    case 'taken-by-self': {
      return sendPyError(event, 400, 'A different Google account is already linked; disconnect it first')
    }
    case 'conflict': {
      return sendPyError(event, 409, 'This Google account is already linked to another Code Time user')
    }
  }
})
