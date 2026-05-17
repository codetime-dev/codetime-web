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
  cacheReadInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  estimatedCostUsd: number
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

// Convert a float USD value to integer micro-USD. Rounds to nearest.
// Anything beyond 6 decimal places is below billable precision.
export function usdToMicros(usd: number): number {
  if (!Number.isFinite(usd)) {
    return 0
  }
  return Math.round(usd * 1_000_000)
}
