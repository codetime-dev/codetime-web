import { defineEventHandler, deleteCookie, setResponseStatus } from 'h3'

// Mirrors POST /v3/auth/logout. Python also calls request.clear_session()
// to wipe Litestar's server-side session cookie — that cookie isn't
// produced by the Nuxt backend, so there's nothing to clear here. The
// shared (user_id, auth_token) cookie pair is what we own and erase.

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
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'user_id', { path: '/' })
  // Litestar's @post default status is 201 — keep parity.
  setResponseStatus(event, 201)
  return { message: 'Logout successful' }
})
