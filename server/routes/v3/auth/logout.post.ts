import { defineEventHandler, setResponseStatus } from 'h3'
import { clearAuthCookies } from '../../../utils/auth-cookie'

// Mirrors POST /v3/auth/logout. Clears the (user_id, auth_token) cookie
// pair. clearAuthCookies must echo the Domain used when minting, or the
// original cross-subdomain cookie survives.

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    summary: 'Log out the current user',
    responses: {
      200: {
        description: 'Logout successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  clearAuthCookies(event)
  setResponseStatus(event, 200)
  return { message: 'Logout successful' }
})
