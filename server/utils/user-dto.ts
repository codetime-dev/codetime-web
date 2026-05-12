import type { users } from '../db/schema'

// Serialise a `users` row to the Python UserSelfPublic shape. The wire
// format must stay byte-equivalent to codetime-server-v3/src/dto.py so
// existing UI / SDK code reads either backend unchanged.

export type UserSelfPublic = {
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

export function toUserSelfPublic(row: typeof users.$inferSelect): UserSelfPublic {
  return {
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
    plan_expires_at: row.planExpiresAt ? row.planExpiresAt.toISOString() : null,
    plan_status: row.planStatus,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}
