import { defineEventHandler } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/self/privacy. Python forces show_email=false at
// the controller level (email is always hidden), so we mirror that here.
// Reads from the session row — no extra DB hit.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Get the authenticated user\'s privacy settings',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Privacy settings',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PrivacySettings' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        schemas: {
          PrivacySettings: {
            type: 'object',
            required: ['showEmail', 'showGithub'],
            properties: {
              showEmail: { type: 'boolean' },
              showGithub: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}
  return { showEmail: false, showGithub: session.showGithub }
})
