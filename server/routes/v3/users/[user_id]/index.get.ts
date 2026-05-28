import { eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { users } from '../../../../db/schema'
import { tryUser } from '../../../../utils/auth'
import { useDb } from '../../../../utils/db'
import { canShowProfileIdentity, resolveUserPrivacy } from '../../../../utils/privacy'
import { sendPyError } from '../../../../utils/py-error'

// Mirrors GET /v3/users/{user_id}. Returns a UserPublic projection with
// privacy applied:
//   - email is always null (Python forces this)
//   - google_id is always null externally
//   - github_id is exposed only when the target user has show_github=true
// When the requesting user IS the target, the full row is returned.

defineRouteMeta({
  openAPI: {
    tags: ['users'],
    summary: 'Get public profile for a user',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      200: {
        description: 'User profile',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          UserPublic: {
            type: 'object',
            required: ['id', 'username', 'plan', 'createdAt', 'updatedAt'],
            properties: {
              id: { type: 'integer' },
              email: { type: 'string', nullable: true },
              username: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              githubId: { type: 'integer', nullable: true },
              githubLogin: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              googleId: { type: 'string', nullable: true },
              plan: { type: 'string' },
              timezone: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const userIdStr = getRouterParam(event, 'user_id')
  const userId = Number(userIdStr)
  if (!Number.isFinite(userId) || userId <= 0) {
 return sendPyError(event, 404, 'User not found')
}

  const db = useDb()
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) {
 return sendPyError(event, 404, 'User not found')
}

  const session = await tryUser(event)
  const isSelf = !!session && session.id === userId

  // Privacy ceiling. A private profile is invisible to everyone but its
  // owner — return 404 so we don't even confirm the account exists.
  const privacy = resolveUserPrivacy(row.privacy)
  if (!isSelf && !privacy.profilePublic) {
    return sendPyError(event, 404, 'User not found')
  }

  return {
    id: row.id,
    email: isSelf ? row.email : (canShowProfileIdentity(privacy, 'email') ? row.email : null),
    username: row.username,
    avatar: row.avatar,
    githubId: isSelf ? row.githubId : (canShowProfileIdentity(privacy, 'github') ? row.githubId : null),
    githubLogin: isSelf ? row.githubLogin : (canShowProfileIdentity(privacy, 'github') ? row.githubLogin : null),
    bio: row.bio,
    googleId: isSelf ? row.googleId : null,
    plan: row.plan,
    timezone: row.timezone,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
})
