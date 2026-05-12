import { bigint, boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Drizzle schema — must match codetime-server-v3/src/db.py exactly.
// Alembic owns migrations; this file is read-only against the live schema.
// When the Python model adds a column, add it here too (and regenerate
// API types via `pnpm openapi`).

export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  email: text('email'),
  username: text('username').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  uploadToken: text('upload_token').notNull(),
  tokenV1: text('token_v1').notNull(),
  googleId: text('google_id'),
  plan: text('plan').notNull(),
  paypalSubscriptionId: text('paypal_subscription_id'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  planStatus: text('plan_status'),
  timezone: text('timezone'),
  shareCurrent: boolean('share_current').notNull().default(false),
  hideCurrentWorkspace: boolean('hide_current_workspace').notNull().default(false),
  hideCurrentLanguage: boolean('hide_current_language').notNull().default(false),
  githubId: bigint('github_id', { mode: 'number' }),
  showEmail: boolean('show_email').notNull().default(false),
  showGithub: boolean('show_github').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type UserRow = typeof users.$inferSelect

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  uid: bigint('uid', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  emoji: text('emoji'),
  // Tree-shaped condition object — see codetime-server-v3
  // src/services/tags.py for the schema. Stored as JSONB.
  rulesJson: jsonb('rules_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export type TagRow = typeof tags.$inferSelect
