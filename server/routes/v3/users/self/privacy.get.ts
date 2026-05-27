import { defineEventHandler } from 'h3'
import { tryUser } from '../../../../utils/auth'
import { resolveUserPrivacy } from '../../../../utils/privacy'
import { sendPyError } from '../../../../utils/py-error'

// GET /v3/users/self/privacy — the authenticated user's full fine-grained
// privacy settings. The session row already carries `privacy` +
// `leaderboardListed`, so there is no extra DB hit; resolveUserPrivacy fills
// defaults for users whose JSONB blob is null (new signups) or partial.

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
          Facet: { type: 'string', enum: ['public', 'private'] },
          PrivacySettings: {
            type: 'object',
            required: ['v', 'profilePublic', 'widgetsEnabled', 'leaderboardListed', 'identity', 'status', 'history'],
            properties: {
              v: { type: 'integer' },
              profilePublic: { type: 'boolean' },
              widgetsEnabled: { type: 'boolean' },
              leaderboardListed: { type: 'boolean' },
              identity: {
                type: 'object',
                required: ['email', 'github'],
                properties: {
                  email: { $ref: '#/components/schemas/Facet' },
                  github: { $ref: '#/components/schemas/Facet' },
                },
              },
              status: {
                type: 'object',
                required: ['coding', 'project', 'language', 'editor'],
                properties: {
                  coding: { $ref: '#/components/schemas/Facet' },
                  project: { $ref: '#/components/schemas/Facet' },
                  language: { $ref: '#/components/schemas/Facet' },
                  editor: { $ref: '#/components/schemas/Facet' },
                },
              },
              history: {
                type: 'object',
                required: ['totalTime', 'languages', 'projects', 'calendar'],
                properties: {
                  totalTime: { $ref: '#/components/schemas/Facet' },
                  languages: { $ref: '#/components/schemas/Facet' },
                  projects: { $ref: '#/components/schemas/Facet' },
                  calendar: { $ref: '#/components/schemas/Facet' },
                },
              },
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
  return { ...resolveUserPrivacy(session.privacy), leaderboardListed: session.leaderboardListed }
})
