import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'
import { toUserSelfPublic } from '../../../utils/user-dto'

// Nitro parses defineRouteMeta() statically (via oxc-parser), so the
// argument must be a literal object — imported spreads are ignored. The
// `$global` block below carries the shared components (security schemes,
// PyError / UserSelfPublic schemas, reusable responses) used by every
// route in this folder. It only needs to appear on one route.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Get current authenticated user',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: {
      200: {
        description: 'Current user',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSelfPublic' } } },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
    $global: {
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', description: 'upload_token' },
          cookieAuth: { type: 'apiKey', in: 'cookie', name: 'auth_token' },
        },
        schemas: {
          PyError: {
            type: 'object',
            required: ['status_code', 'detail'],
            properties: {
              status_code: { type: 'integer' },
              detail: { type: 'string' },
            },
          },
          UserSelfPublic: {
            type: 'object',
            required: ['id', 'username', 'plan', 'uploadToken', 'createdAt', 'updatedAt'],
            properties: {
              id: { type: 'integer' },
              email: { type: 'string', nullable: true },
              username: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              githubId: { type: 'integer', nullable: true },
              githubLogin: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              googleId: { type: 'string', nullable: true },
              appleId: { type: 'string', nullable: true },
              plan: { type: 'string' },
              timezone: { type: 'string', nullable: true },
              uploadToken: { type: 'string' },
              planExpiresAt: { type: 'string', format: 'date-time', nullable: true },
              planStatus: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: 'Not authenticated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
          },
          BadRequest: {
            description: 'Invalid request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
          },
          NotFound: {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
          },
          // Forbidden + Conflict are referenced by /v3/agent/* routes.
          // The shared $global components block is the only one merged
          // into the curated spec, so new error responses MUST be
          // declared here or openapi-ts will fail with "Reference not
          // found" on the next regen.
          Forbidden: {
            description: 'Insufficient permissions',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
          },
          Conflict: {
            description: 'Request conflicts with current state',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PyError' } } },
          },
        },
      },
    },
  },
})

// Mirrors codetime-server-v3 GET /v3/users/self -> UserSelfPublic.
// Wire format is owned by toUserSelfPublic() in utils/user-dto.ts so every
// /users endpoint that returns the same DTO produces identical bytes.

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const db = useDb()
  const [row] = await db.select().from(users).where(eq(users.id, session.id)).limit(1)
  if (!row) {
 return sendPyError(event, 404, 'User not found')
}
  return toUserSelfPublic(row)
})
