import { bigint, bigserial, boolean, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

// Drizzle schema for the Nuxt backend's Postgres database.
//
// Two layers coexist here:
//   1. Legacy editor tables (users, tags, event_logs, workspace_minutes_v2,
//      workspace_meta_v2, lemonsqueezy_raw_webhooks) — these mirror the
//      original SQLAlchemy models from the retired Python service. They are
//      retained as-is so existing data and the VSCode plugin keep working.
//   2. New platform tables (machines, projects) and agent telemetry
//      (agent_*) — owned by Drizzle going forward. Generate migrations with
//      drizzle-kit; do not edit by hand once they ship.

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
  // Apple's stable per-team user identifier (`sub` claim from the Apple
  // identity token). Opaque string, distinct from githubId/googleId.
  appleId: text('apple_id'),
  showEmail: boolean('show_email').notNull().default(false),
  showGithub: boolean('show_github').notNull().default(false),
  // Fine-grained privacy (see server/utils/privacy.ts). `leaderboardListed`
  // is a real column because the leaderboard/ranking queries filter MANY
  // users by it before LIMIT; everything else lives in the `privacy` JSONB
  // blob (read per-user alongside the row, so a column buys nothing).
  // `privacy` is null for users created before the privacy migration
  // backfilled them, and for brand-new signups — resolveUserPrivacy()
  // treats null as the privacy-first new-user default.
  leaderboardListed: boolean('leaderboard_listed').notNull().default(true),
  privacy: jsonb('privacy'),
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

export const eventLogs = pgTable('event_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  uid: bigint('uid', { mode: 'number' }).notNull(),
  eventTime: bigint('event_time', { mode: 'number' }).notNull(),
  language: text('language').notNull(),
  project: text('project').notNull(),
  relativeFile: text('relative_file').notNull(),
  editor: text('editor').notNull(),
  platform: text('platform').notNull(),
  absoluteFile: text('absolute_file'),
  gitOrigin: text('git_origin'),
  gitBranch: text('git_branch'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export type EventLogRow = typeof eventLogs.$inferSelect

// Partitioned by recorded_at on the Python side — Drizzle does not need
// to know about the partitioning, queries hit the parent table normally.
export const workspaceMinutesV2 = pgTable('workspace_minutes_v2', {
  uid: bigint('uid', { mode: 'number' }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  // mode: 'bigint' — xxh3_64 is a full 64-bit hash whose magnitude
  // routinely exceeds 2^53, so Number truncates the low digits and any
  // round-trip through JS (e.g. select → push → inArray) silently loses
  // matches. Keep as native bigint.
  metaXxh3_64: bigint('meta_xxh3_64', { mode: 'bigint' }).notNull(),
  language: text('language').notNull(),
})

export type WorkspaceMinuteV2Row = typeof workspaceMinutesV2.$inferSelect

export const workspaceMetaV2 = pgTable('workspace_meta_v2', {
  uid: bigint('uid', { mode: 'number' }).notNull(),
  language: text('language').notNull(),
  workspaceName: text('workspace_name').notNull(),
  absoluteFile: text('absolute_file').notNull(),
  relativeFile: text('relative_file').notNull(),
  editor: text('editor').notNull(),
  platform: text('platform').notNull(),
  gitOrigin: text('git_origin').notNull(),
  gitBranch: text('git_branch').notNull(),
  // See note on workspace_minutes_v2.meta_xxh3_64 — kept as bigint to
  // preserve the full 64-bit hash through JS land.
  xxh3_64: bigint('xxh3_64', { mode: 'bigint' }).notNull(),
})

export type WorkspaceMetaV2Row = typeof workspaceMetaV2.$inferSelect

export const lemonsqueezyRawWebhooks = pgTable('lemonsqueezy_raw_webhooks', {
  // Python migration creates this as `BIGSERIAL` via SQLAlchemy's auto-PK
  // behaviour; Drizzle's `bigserial` matches so inserts can omit `id`.
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type LemonsqueezyRawWebhookRow = typeof lemonsqueezyRawWebhooks.$inferSelect

// ============================================================================
// Shared platform tables — used by both editor and agent activity.
// ============================================================================

// A machine is a physical or virtual host that submits activity. Editor
// activity reaches us via `event_logs` (no machine_id today) and is
// upserted into this table by hostname+platform when seen; agent activity
// always carries a `machine_id` minted at CLI install time.
//
// `source` reflects how the machine was registered:
//   'editor' — only the VSCode plugin has ever reported from here.
//   'agent'  — only the agent CLI has reported.
//   'both'   — promoted automatically when both sources have been seen.
export const machines = pgTable('machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  hostname: text('hostname').notNull(),
  displayName: text('display_name').notNull(),
  platform: text('platform'),
  source: text('source').notNull().default('agent'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => ({
  userIdx: index('machines_user_idx').on(t.userId, t.lastSeenAt),
  // Editor `event_logs` rows have NULL platform sometimes; the partial
  // unique here is enforced only when both keys are present. Agent
  // registrations always pass platform.
  hostUk: unique('machines_user_host_uk').on(t.userId, t.hostname, t.platform),
}))

export type MachineRow = typeof machines.$inferSelect

// Project = (git_origin, workspace_name) under a user. Editor and agent
// rows reference the same project_id so cross-source queries (e.g. "all
// activity on project X this week") work without re-stitching strings.
// `git_origin` may be NULL for ad-hoc workspaces; Postgres unique
// constraints treat NULLs as distinct, so duplicate ad-hoc projects are
// possible — dedup happens in the upsert helper.
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  gitOrigin: text('git_origin'),
  workspaceName: text('workspace_name').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => ({
  uniq: unique('projects_uk').on(t.userId, t.gitOrigin, t.workspaceName),
  userIdx: index('projects_user_idx').on(t.userId),
}))

export type ProjectRow = typeof projects.$inferSelect

// ============================================================================
// Agent telemetry.
//
// CLI clients submit pre-aggregated rollups per session. Raw events are
// intentionally NOT persisted server-side — the canonical truth lives on
// the originating machine. `rollup_key` / `turn_key` / etc. are stable
// content-addressed primary keys so retries from the CLI are idempotent.
//
// Auth note: agent endpoints reuse the per-user `upload_token` (same one
// VSCode uses). The CLI declares which host it is via `X-Machine-Id` and
// the `machines` row is upserted on first sight. There is no separate
// agent-only token table.
// ============================================================================

// Session rollup — one row per (user, machine, source, session_id).
// `project` is the raw display string; `project_id` is the resolved FK.
export const agentSessions = pgTable('agent_sessions', {
  rollupKey: text('rollup_key').primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  payloadHash: text('payload_hash').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  sessionId: text('session_id').notNull(),
  agent: text('agent'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }).notNull(),
  eventCount: integer('event_count').notNull().default(0),
  promptCount: integer('prompt_count').notNull().default(0),
  turnCount: integer('turn_count').notNull().default(0),
  toolCallCount: integer('tool_call_count').notNull().default(0),
  commandCallCount: integer('command_call_count').notNull().default(0),
  // Token columns are bigint to outlast any single user's heaviest year.
  // Cost is stored as a numeric microdollar count would be ideal, but
  // double matches what the CLI ships today — keep precision in mind.
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  cachedInputTokens: bigint('cached_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheCreationInputTokens: bigint('cache_creation_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheReadInputTokens: bigint('cache_read_input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  reasoningOutputTokens: bigint('reasoning_output_tokens', { mode: 'number' }).notNull().default(0),
  totalTokens: bigint('total_tokens', { mode: 'number' }).notNull().default(0),
  linesAdded: integer('lines_added').notNull().default(0),
  linesRemoved: integer('lines_removed').notNull().default(0),
  durationMs: bigint('duration_ms', { mode: 'number' }).notNull().default(0),
}, t => ({
  tenantIdx: index('agent_sessions_tenant_idx').on(t.userId, t.machineId, t.lastEventAt),
  projectIdx: index('agent_sessions_project_idx').on(t.userId, t.projectId, t.lastEventAt),
  sessionIdx: index('agent_sessions_session_idx').on(t.userId, t.source, t.sessionId),
}))

export type AgentSessionRow = typeof agentSessions.$inferSelect

// Per-turn detail for an agent session. A turn is one user prompt + the
// model's response (including its tool calls).
export const agentTurns = pgTable('agent_turns', {
  turnKey: text('turn_key').primaryKey(),
  rollupKey: text('rollup_key').notNull().references(() => agentSessions.rollupKey, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  sessionId: text('session_id').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  turnId: text('turn_id').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  promptSubmittedAt: timestamp('prompt_submitted_at', { withTimezone: true }),
  promptChars: integer('prompt_chars').notNull().default(0),
  eventCount: integer('event_count').notNull().default(0),
  toolCallCount: integer('tool_call_count').notNull().default(0),
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  totalTokens: bigint('total_tokens', { mode: 'number' }).notNull().default(0),
  durationMs: bigint('duration_ms', { mode: 'number' }).notNull().default(0),
}, t => ({
  rollupIdx: index('agent_turns_rollup_idx').on(t.rollupKey, t.startedAt),
  tenantIdx: index('agent_turns_tenant_idx').on(t.userId, t.machineId, t.startedAt),
}))

export type AgentTurnRow = typeof agentTurns.$inferSelect

// Per-tool aggregation within a session (e.g. "Read was called 41x").
export const agentToolCalls = pgTable('agent_tool_calls', {
  toolKey: text('tool_key').primaryKey(),
  rollupKey: text('rollup_key').notNull().references(() => agentSessions.rollupKey, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  sessionId: text('session_id').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  tool: text('tool').notNull(),
  callCount: integer('call_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  totalDurationMs: bigint('total_duration_ms', { mode: 'number' }).notNull().default(0),
}, t => ({
  rollupIdx: index('agent_tool_calls_rollup_idx').on(t.rollupKey),
  tenantIdx: index('agent_tool_calls_tenant_idx').on(t.userId, t.tool),
}))

export type AgentToolCallRow = typeof agentToolCalls.$inferSelect

// Per-model aggregation within a session.
export const agentSessionModels = pgTable('agent_session_models', {
  modelKey: text('model_key').primaryKey(),
  rollupKey: text('rollup_key').notNull().references(() => agentSessions.rollupKey, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  sessionId: text('session_id').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  model: text('model').notNull(),
  callCount: integer('call_count').notNull().default(0),
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  cachedInputTokens: bigint('cached_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheCreationInputTokens: bigint('cache_creation_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheReadInputTokens: bigint('cache_read_input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  reasoningOutputTokens: bigint('reasoning_output_tokens', { mode: 'number' }).notNull().default(0),
  totalTokens: bigint('total_tokens', { mode: 'number' }).notNull().default(0),
  // Cost in integer micro-USD (1_000_000 = $1) to avoid float drift.
  estimatedCostMicros: bigint('estimated_cost_micros', { mode: 'number' }).notNull().default(0),
}, t => ({
  rollupIdx: index('agent_session_models_rollup_idx').on(t.rollupKey),
  tenantIdx: index('agent_session_models_tenant_idx').on(t.userId, t.model),
}))

export type AgentSessionModelRow = typeof agentSessionModels.$inferSelect

// Per-file touch aggregation within a session. `path_hash` is the stable
// key; `display_path` is what we render in the UI (relative when known).
export const agentSessionFiles = pgTable('agent_session_files', {
  fileKey: text('file_key').primaryKey(),
  rollupKey: text('rollup_key').notNull().references(() => agentSessions.rollupKey, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  sessionId: text('session_id').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  pathHash: text('path_hash').notNull(),
  displayPath: text('display_path').notNull(),
  reads: integer('reads').notNull().default(0),
  writes: integer('writes').notNull().default(0),
  linesAdded: integer('lines_added').notNull().default(0),
  linesRemoved: integer('lines_removed').notNull().default(0),
  lastTouchedAt: timestamp('last_touched_at', { withTimezone: true }).notNull(),
}, t => ({
  rollupIdx: index('agent_session_files_rollup_idx').on(t.rollupKey),
  tenantIdx: index('agent_session_files_tenant_idx').on(t.userId, t.lastTouchedAt),
}))

export type AgentSessionFileRow = typeof agentSessionFiles.$inferSelect

// Time-bucketed rollups (5-minute granularity) for the dashboard
// timeline. Computed CLI-side and submitted alongside the session
// payload so the server stays read-mostly.
export const agentTimeBuckets = pgTable('agent_time_buckets', {
  bucketKey: text('bucket_key').primaryKey(),
  rollupKey: text('rollup_key').notNull().references(() => agentSessions.rollupKey, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  machineId: uuid('machine_id').notNull(),
  projectId: uuid('project_id'),
  sessionId: text('session_id').notNull(),
  source: text('source').notNull(),
  project: text('project'),
  ts: timestamp('ts', { withTimezone: true }).notNull(),
  activityCount: integer('activity_count').notNull().default(0),
  sessionStarts: integer('session_starts').notNull().default(0),
  modelCalls: integer('model_calls').notNull().default(0),
  toolCalls: integer('tool_calls').notNull().default(0),
  commandCalls: integer('command_calls').notNull().default(0),
  fileReads: integer('file_reads').notNull().default(0),
  fileWrites: integer('file_writes').notNull().default(0),
  linesAdded: integer('lines_added').notNull().default(0),
  linesRemoved: integer('lines_removed').notNull().default(0),
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  cachedInputTokens: bigint('cached_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheCreationInputTokens: bigint('cache_creation_input_tokens', { mode: 'number' }).notNull().default(0),
  cacheReadInputTokens: bigint('cache_read_input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  reasoningOutputTokens: bigint('reasoning_output_tokens', { mode: 'number' }).notNull().default(0),
  totalTokens: bigint('total_tokens', { mode: 'number' }).notNull().default(0),
  // Cost in integer micro-USD (1_000_000 = $1) to avoid float drift when
  // aggregating across thousands of buckets.
  estimatedCostMicros: bigint('estimated_cost_micros', { mode: 'number' }).notNull().default(0),
}, t => ({
  tenantIdx: index('agent_time_buckets_tenant_idx').on(t.userId, t.machineId, t.ts),
  projectIdx: index('agent_time_buckets_project_idx').on(t.userId, t.projectId, t.ts),
}))

export type AgentTimeBucketRow = typeof agentTimeBuckets.$inferSelect
