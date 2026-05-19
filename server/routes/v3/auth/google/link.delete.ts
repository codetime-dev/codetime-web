import { defineEventHandler, setResponseStatus } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { unlinkProviderIdentity } from '../../../../utils/oauth'
import { sendPyError } from '../../../../utils/py-error'

// DELETE /v3/auth/google/link — detach the Google identity from the
// currently signed-in user.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Disconnect Google from the signed-in user',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Disconnected (or wasn\'t linked).',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['success', 'outcome'],
              properties: {
                success: { type: 'boolean' },
                outcome: { type: 'string', enum: ['unlinked', 'not-linked'] },
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
  const outcome = await unlinkProviderIdentity(session.id, 'googleId')
  if (outcome === 'last-one') {
    return sendPyError(event, 400, 'Cannot disconnect the last sign-in provider')
  }
  setResponseStatus(event, 200)
  return { success: true, outcome }
})
