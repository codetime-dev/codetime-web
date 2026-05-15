import { defineEventHandler } from 'h3'

// Mirrors codetime-server-v3 routes.py::get_root.
// Returns a tiny banner pointing at the Scalar docs so unauthenticated
// pokes at the API root give a useful response.

defineRouteMeta({
  openAPI: {
    tags: ['root'],
    summary: 'API root banner',
    responses: {
      200: {
        description: 'Welcome payload',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message', 'documentUrl'],
              properties: {
                message: { type: 'string' },
                documentUrl: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(() => {
  return {
    message: 'Welcome to the API',
    documentUrl: '/v3/docs',
  }
})
