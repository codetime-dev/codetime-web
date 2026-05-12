import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { users } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

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
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'upload_token' },
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
            required: ['id', 'username', 'plan', 'upload_token', 'created_at', 'updated_at'],
            properties: {
              id: { type: 'integer' },
              email: { type: 'string', nullable: true },
              username: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              github_id: { type: 'integer', nullable: true },
              bio: { type: 'string', nullable: true },
              google_id: { type: 'string', nullable: true },
              plan: { type: 'string' },
              timezone: { type: 'string', nullable: true },
              upload_token: { type: 'string' },
              plan_expires_at: { type: 'string', format: 'date-time', nullable: true },
              plan_status: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
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
        },
      },
    },
  },
})

// Mirrors codetime-server-v3 GET /v3/users/self -> UserSelfPublic.
// Response shape must stay byte-equivalent to dto.py::UserSelfPublic.

type UserSelfPublic = {
  id: number
  email: string | null
  username: string
  avatar: string | null
  github_id: number | null
  bio: string | null
  google_id: string | null
  plan: string
  timezone: string | null
  upload_token: string
  plan_expires_at: string | null
  plan_status: string | null
  created_at: string
  updated_at: string
}

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) return sendPyError(event, 401, 'Not authenticated')

  const db = useDb()
  const [row] = await db.select().from(users).where(eq(users.id, session.id)).limit(1)
  if (!row) return sendPyError(event, 404, 'User not found')

  const body: UserSelfPublic = {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar: row.avatar,
    github_id: row.githubId,
    bio: row.bio,
    google_id: row.googleId,
    plan: row.plan,
    timezone: row.timezone,
    upload_token: row.uploadToken,
    plan_expires_at: toIso(row.planExpiresAt),
    plan_status: row.planStatus,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
  return body
})
