import type { users } from '../db/schema'

// Serialise a `users` row to the Python UserSelfPublic shape. The wire
// format must stay byte-equivalent to codetime-server-v3/src/dto.py so
// existing UI / SDK code reads either backend unchanged. Python emits
// camelCase keys via pydantic's `alias_generator=to_camel`.

export type UserSelfPublic = {
  id: number
  email: string | null
  username: string
  avatar: string | null
  githubId: number | null
  bio: string | null
  googleId: string | null
  plan: string
  timezone: string | null
  uploadToken: string
  planExpiresAt: string | null
  planStatus: string | null
  createdAt: string
  updatedAt: string
}

export function toUserSelfPublic(row: typeof users.$inferSelect): UserSelfPublic {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar: row.avatar,
    githubId: row.githubId,
    bio: row.bio,
    googleId: row.googleId,
    plan: row.plan,
    timezone: row.timezone,
    uploadToken: row.uploadToken,
    planExpiresAt: row.planExpiresAt ? row.planExpiresAt.toISOString() : null,
    planStatus: row.planStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
