// Wire types for /v3/agent/* payloads. Mirrors the SessionRollup family
// defined in the original `@agent-time/shared` package — kept inline so
// the standalone agent-time monorepo can be deleted without breaking
// the CLI's binary contract.
//
// Keep field names in sync with the CLI in packages/cli/. Any rename
// requires a coordinated CLI release.

export type AgentSource = string

export type SessionTimeBucketRollup = {
  ts: string
  activityCount: number
  sessionStarts: number
  modelCalls: number
  toolCalls: number
  commandCalls: number
  fileReads: number
  fileWrites: number
  linesAdded: number
  linesRemoved: number
  inputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

export type SessionModelRollup = {
  model: string
  callCount: number
  inputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens: number
  // TTL split subsets of cacheCreationInputTokens. Optional; absent on
  // legacy CLIs (schema < 3) that don't break creation down by ephemeral TTL.
  cacheCreation5mInputTokens?: number
  cacheCreation1hInputTokens?: number
  cacheReadInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

// Per-(model, 15-min bucket) token rollup. `ts` is aligned to a 15-min
// boundary. Carried only by schema v3+ CLIs so the dashboard can place
// model cost on the real activity time instead of the session's
// last_event_at. Optional on SessionRollup — older CLIs never send it.
export type SessionModelBucketRollup = {
  ts: string
  model: string
  callCount: number
  inputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens: number
  cacheCreation5mInputTokens: number
  cacheCreation1hInputTokens: number
  cacheReadInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
}

export type SessionToolRollup = {
  tool: string
  callCount: number
  failureCount: number
  totalDurationMs: number
}

export type SessionFileRollup = {
  pathHash: string
  displayPath: string
  reads: number
  writes: number
  linesAdded: number
  linesRemoved: number
  lastTouchedAt: string
}

export type SessionTurnRollup = {
  turnId: string
  startedAt: string
  lastEventAt: string
  completedAt?: string
  promptSubmittedAt?: string
  promptChars: number
  eventCount: number
  toolCallCount: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  durationMs: number
}

export type SessionRollup = {
  rollupKey: string
  payloadHash: string
  // Rollup wire-format version. Absent on legacy CLIs (treated as 1).
  // v2 semantics: turn durationMs is gap-clamped active time (trusted,
  // no read-time cap) and outputTokens already includes reasoning tokens.
  schemaVersion?: number
  source: AgentSource
  project?: string
  sessionId: string
  agent?: string
  startedAt: string
  lastEventAt: string
  eventCount: number
  promptCount: number
  turnCount: number
  toolCallCount: number
  commandCallCount: number
  inputTokens: number
  cachedInputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  linesAdded: number
  linesRemoved: number
  durationMs: number
  timeBuckets: SessionTimeBucketRollup[]
  modelRollups: SessionModelRollup[]
  toolRollups: SessionToolRollup[]
  fileRollups: SessionFileRollup[]
  turnRollups?: SessionTurnRollup[]
  // Per-(model, 15-min bucket) token rollups. Absent on schema < 3 CLIs.
  modelBuckets?: SessionModelBucketRollup[]
}

export type IngestRequestBody = {
  rollups: SessionRollup[]
  /** When true, conflicting payload_hash overwrites the prior rollup. */
  replace?: boolean
}

export type IngestResponseBody = {
  inserted: number
  skipped: number
  conflicts: number
  conflictIds: string[]
}

// Normalize a rollup's wire schemaVersion to a stored integer. Missing,
// non-numeric, or below-1 values fall back to 1 (legacy CLI). Fractional
// values are floored. This is the lower-bound protection the ingest path
// relies on so a malformed `schemaVersion` can never disable the v1 cap.
export function normalizeSchemaVersion(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 1) {
    return 1
  }
  return Math.floor(n)
}

// Convert a float USD value to integer micro-USD. Rounds to nearest.
// Anything beyond 6 decimal places is below billable precision.
export function usdToMicros(usd: number): number {
  if (!Number.isFinite(usd)) {
    return 0
  }
  return Math.round(usd * 1_000_000)
}
