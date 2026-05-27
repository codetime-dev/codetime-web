import type { estimateCostUsd } from '../../../utils/agent-pricing'
import { sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { ensurePricingLoaded, estimateCostFromRow, pricingState } from '../../../utils/agent-pricing'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { agentVisibilityCutoff } from '../../../utils/plan-limits'
import { sendPyError } from '../../../utils/py-error'

// Vibe dashboard aggregator — one round-trip that backs the entire
// Vibe page (KPIs, cost timeline, rhythm heatmap, project/model/tool
// leaderboards). Pulls from agent_time_buckets for the time-series
// pieces, and joins agent_session_models / agent_tool_calls /
// agent_sessions for the leaderboards & totals.
//
// Range presets pin the bucket size so the timeline always lands on a
// human-readable cadence:
//
//   key   window      bucket
//   24h   now-24h     hour
//   7d    now-7d      day
//   30d   now-30d     day   (default)
//   all   sole user   week  (free users still capped at 30 days)

defineRouteMeta({
  openAPI: {
    tags: ['agent'],
    summary: 'Vibe dashboard aggregates for the authenticated user',
    parameters: [
      {
        name: 'range',
        in: 'query',
        schema: { type: 'string', enum: ['24h', '7d', '30d', 'all'], default: '30d' },
      },
      {
        name: 'machine_id',
        in: 'query',
        schema: { type: 'string', format: 'uuid' },
        description: 'Restrict every aggregate to a single machine UUID.',
      },
      {
        name: 'source',
        in: 'query',
        schema: { type: 'string' },
        description: 'Restrict every aggregate to a single agent source (e.g. claude-code, codex, opencode, pi).',
      },
      {
        name: 'since',
        in: 'query',
        schema: { type: 'string', format: 'date-time' },
        description: 'Custom window start (ISO 8601). Takes precedence over `days` and `range`; pair with `until` to scope aggregates to an exact span (e.g. start-of-today for a calendar-day view).',
      },
      {
        name: 'until',
        in: 'query',
        schema: { type: 'string', format: 'date-time' },
        description: 'Custom window end (ISO 8601). Defaults to the request time. Only meaningful alongside `since`.',
      },
      {
        name: 'days',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
        description: 'Rolling window of the last N days. Overrides `range`; ignored when `since` is given.',
      },
      {
        name: 'tz',
        in: 'query',
        schema: { type: 'string' },
        description: 'IANA timezone (e.g. Asia/Shanghai) used to align day/hour/week buckets to the user\'s local schedule. Defaults to UTC.',
      },
    ],
    responses: {
      200: {
        description: 'Dashboard aggregates',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'range',
'bucket',
'summary',
'overviewBuckets',
'tokenBuckets',
                'heatmap',
'projectTokens',
'modelCosts',
'agentCosts',
'tools',
'availableSources',
              ],
              properties: {
                range: {
                  type: 'object',
                  required: ['key', 'until'],
                  properties: {
                    key: { type: 'string' },
                    since: { type: 'string', format: 'date-time', nullable: true },
                    until: { type: 'string', format: 'date-time' },
                  },
                },
                bucket: { type: 'string', enum: ['hour', 'day', 'week'] },
                summary: {
                  type: 'object',
                  required: [
                    'totalSessions',
'totalEvents',
'totalProjects',
'totalToolCalls',
                    'totalCommandCalls',
'totalInputTokens',
'totalCachedInputTokens',
                    'totalOutputTokens',
'totalReasoningOutputTokens',
'totalTokens',
                    'totalDurationMs',
'totalLinesAdded',
'totalLinesRemoved',
                  ],
                  properties: {
                    totalSessions: { type: 'integer' },
                    totalEvents: { type: 'integer' },
                    totalProjects: { type: 'integer' },
                    totalToolCalls: { type: 'integer' },
                    totalCommandCalls: { type: 'integer' },
                    totalInputTokens: { type: 'integer' },
                    totalCachedInputTokens: { type: 'integer' },
                    totalOutputTokens: { type: 'integer' },
                    totalReasoningOutputTokens: { type: 'integer' },
                    totalTokens: { type: 'integer' },
                    totalDurationMs: { type: 'integer' },
                    totalLinesAdded: { type: 'integer' },
                    totalLinesRemoved: { type: 'integer' },
                  },
                },
                overviewBuckets: { type: 'array', items: { type: 'object' } },
                tokenBuckets: { type: 'array', items: { type: 'object' } },
                heatmap: { type: 'array', items: { type: 'object' } },
                projectTokens: { type: 'array', items: { type: 'object' } },
                modelCosts: { type: 'array', items: { type: 'object' } },
                agentCosts: { type: 'array', items: { type: 'object' } },
                tools: { type: 'array', items: { type: 'object' } },
                availableSources: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

type RangeKey = '24h' | '7d' | '30d' | 'all' | 'custom'
type BucketGrain = 'hour' | 'day' | 'week'

const DAY_MS = 86_400_000

type RangeSpec = {
  key: RangeKey
  since: Date | null
  until: Date
  bucket: BucketGrain
}

// Pick a bucket grain from a span in days. Matches the DataRange
// component's cycle thresholds so a 7-day window always reads as
// daily, a 24-hour window as hourly, multi-month as weekly.
function bucketForSpan(days: number): BucketGrain {
  if (days <= 1.1) {
    return 'hour'
  }
  // 90 daily bars still render comfortably with the new insetted bars,
  // so keep day-grain through a full quarter before falling back to
  // weekly aggregation.
  if (days <= 92) {
    return 'day'
  }
  return 'week'
}

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolveRange(q: Record<string, unknown>, cutoff: Date | null): RangeSpec {
  const until = new Date()
  // Custom window via explicit since/until — takes precedence over
  // legacy `range` / `days` query forms.
  const sinceParam = parseIsoDate(q.since)
  const untilParam = parseIsoDate(q.until) ?? until
  if (sinceParam) {
    const spanDays = Math.max(1, (untilParam.getTime() - sinceParam.getTime()) / DAY_MS)
    let since: Date | null = sinceParam
    if (cutoff && since < cutoff) {
      since = cutoff
    }
    return { key: 'custom', since, until: untilParam, bucket: bucketForSpan(spanDays) }
  }
  // `days=N` form — used by the DataRange picker's preset cycle.
  const daysRaw = Number(q.days)
  if (Number.isFinite(daysRaw) && daysRaw > 0) {
    const days = Math.min(36_500, daysRaw)
    let since: Date | null = days >= 36_500 ? null : new Date(until.getTime() - days * DAY_MS)
    if (cutoff && (!since || since < cutoff)) {
      since = cutoff
    }
    return { key: 'custom', since, until, bucket: bucketForSpan(days) }
  }
  // Legacy `range=24h|7d|30d|all` form — kept for callers that haven't
  // migrated to the DataRange picker yet.
  const raw = q.range
  const key: RangeKey = raw === '24h' || raw === '7d' || raw === 'all' ? raw : '30d'
  let since: Date | null = null
  let bucket: BucketGrain = 'day'
  switch (key) {
  case '24h': {
    since = new Date(until.getTime() - DAY_MS)
    bucket = 'hour'

  break
  }
  case '7d': {
    since = new Date(until.getTime() - 7 * DAY_MS)
    bucket = 'day'

  break
  }
  case '30d': {
    since = new Date(until.getTime() - 30 * DAY_MS)
    bucket = 'day'

  break
  }
  default: {
    since = null
    bucket = 'day'
  }
  }
  if (cutoff && (!since || since < cutoff)) {
    since = cutoff
  }
  return { key, since, until, bucket }
}

function toN(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Postgres serialises timestamptz as "2026-05-05 00:00:00+00" when
// returned through `db.execute(sql\`...\`)` raw queries — not the ISO
// form `new Date()` accepts everywhere. Normalise to ISO so the
// frontend can `new Date(ts)` without browser-by-browser surprises.
function tsToIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    // postgres-js sometimes hands back the literal text. Two fixups:
    //   1. Replace the space separator with 'T' (ISO requires it).
    //   2. Pad bare 2-digit offsets (`+00`) to `+00:00` — JS Date
    //      rejects the bare form even though Postgres emits it.
    const normalised = value
      .replace(' ', 'T')
      .replace(/([+-])(\d{2})$/, '$1$2:00')
    const parsed = new Date(normalised)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
    return normalised
  }
  return String(value)
}

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const q = getQuery(event) as Record<string, unknown>
  const cutoff = agentVisibilityCutoff(user.plan)
  const range = resolveRange(q, cutoff)
  // Optional client-provided IANA timezone (e.g. "Asia/Shanghai") so
  // weekday/hour buckets in the rhythm heatmap reflect the user's
  // local schedule instead of the server's UTC. Validated against a
  // strict IANA-ish character set before being interpolated, so it
  // can safely go inside `AT TIME ZONE`.
  const rawTz = typeof q.tz === 'string' ? q.tz : ''
  const tz = /^[A-Z][\w+\-/]{0,63}$/i.test(rawTz) ? rawTz : 'UTC'
  // Optional machine filter. Validated as a strict UUID before being
  // interpolated into SQL via ::uuid so a bad value is dropped early
  // rather than producing a Postgres parse error mid-query.
  const rawMachineId = typeof q.machine_id === 'string' ? q.machine_id : ''
  const machineId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawMachineId)
    ? rawMachineId
    : null
  // Optional agent-source filter — pins the dashboard to a single CLI
  // / agent (claude-code, codex, opencode, pi, …). Kept permissive on
  // the allowed character set so new agents work without a server
  // redeploy, but capped to a sane shape to keep the parameterised
  // value harmless if anything slipped past Postgres' type binding.
  const rawSource = typeof q.source === 'string' ? q.source.trim() : ''
  const source = /^[\w.-]{1,64}$/.test(rawSource) ? rawSource : null
  const db = useDb()

  // Refresh the OpenRouter price catalogue before doing any cost math.
  // The promise is cached — first call hits the network, subsequent
  // calls within REFRESH_MS resolve immediately. Failures fall back
  // to the built-in price table.
  await ensurePricingLoaded()

  const userId = user.id
  // postgres-js sends Date objects via JS's default toString(), which
  // Postgres can't parse — explicitly cast an ISO string to
  // timestamptz so the driver hands over a value Postgres understands.
  const sinceIso = range.since ? range.since.toISOString() : null
  // Anchored ranges (this month / last month / custom) have an upper
  // bound strictly earlier than `now`, so both ends need filtering —
  // otherwise the timeline x-axis (pinned to [since, until] on the
  // client) cuts off, but rows past `until` still come back and render
  // outside the axis. Rolling ranges (days=N) pin `until` to the
  // request time; applying the clause is a no-op there.
  const untilIso = range.until.toISOString()
  const bucketTrunc = range.bucket // postgres date_trunc accepts 'hour'/'day'/'week'

  // Build a reusable WHERE-fragment for buckets/models/tools. We use
  // last_event_at as the join column on agent_sessions; for buckets we
  // use bucket.ts; for tool/model tables we filter via the parent
  // session's last_event_at via subquery on agent_sessions when we
  // need a window. To keep queries simple, model/tool/file leaderboards
  // use the parent agent_sessions row's last_event_at via JOIN.

  const sinceClause = sinceIso
    ? sql`and b.ts >= ${sinceIso}::timestamptz and b.ts < ${untilIso}::timestamptz`
    : sql`and b.ts < ${untilIso}::timestamptz`
  const sessSinceClause = sinceIso
    ? sql`and s.last_event_at >= ${sinceIso}::timestamptz and s.last_event_at < ${untilIso}::timestamptz`
    : sql`and s.last_event_at < ${untilIso}::timestamptz`
  // Machine clauses live alongside the time clauses so every query
  // composing both fragments naturally honours the dropdown. b.* lives
  // on agent_time_buckets, s.* on agent_sessions, m.* on
  // agent_session_models — pick the alias each query already uses.
  const bMachineClause = machineId ? sql`and b.machine_id = ${machineId}::uuid` : sql``
  const sessMachineClause = machineId ? sql`and s.machine_id = ${machineId}::uuid` : sql``
  const mMachineClause = machineId ? sql`and m.machine_id = ${machineId}::uuid` : sql``
  // Source clauses mirror the machine ones: every query already has a
  // `source` column on the relevant table, so we filter wherever the
  // join naturally exposes it.
  const bSourceClause = source ? sql`and b.source = ${source}` : sql``
  const sessSourceClause = source ? sql`and s.source = ${source}` : sql``
  const mSourceClause = source ? sql`and m.source = ${source}` : sql``

  // --- summary --------------------------------------------------------
  const summaryRows = await db.execute(sql`
    select
      coalesce(sum(s.event_count), 0)::bigint        as total_events,
      coalesce(sum(s.tool_call_count), 0)::bigint    as total_tool_calls,
      coalesce(sum(s.command_call_count), 0)::bigint as total_command_calls,
      coalesce(sum(s.input_tokens), 0)::bigint       as total_input_tokens,
      coalesce(sum(s.cached_input_tokens), 0)::bigint as total_cached_input_tokens,
      coalesce(sum(s.output_tokens), 0)::bigint      as total_output_tokens,
      coalesce(sum(s.reasoning_output_tokens), 0)::bigint as total_reasoning_output_tokens,
      coalesce(sum(s.total_tokens), 0)::bigint       as total_tokens,
      coalesce(sum(s.duration_ms), 0)::bigint        as total_duration_ms,
      coalesce(sum(s.lines_added), 0)::bigint        as total_lines_added,
      coalesce(sum(s.lines_removed), 0)::bigint      as total_lines_removed,
      count(*)::bigint                               as total_sessions,
      count(distinct nullif(s.project, ''))::bigint  as total_projects
    from agent_sessions s
    where s.user_id = ${userId}
    ${sessSinceClause}
    ${sessMachineClause}
    ${sessSourceClause}
  `)
  const summaryRow = (summaryRows as unknown as Record<string, unknown>[])[0] ?? {}

  // --- overview buckets ----------------------------------------------
  // One row per bucket (date_trunc). activity = activity_count;
  // sessions = session_starts; tokens = total_tokens; lines = added+removed;
  // estimated cost in USD.
  // Bucket boundaries are aligned to the user's local timezone so the
  // timeline's "day"/"hour"/"week" cells match the wall-clock schedule
  // the user actually experiences (matches `stats-time.ts` and the
  // rhythm heatmap below). The double `timezone()` round-trip yields a
  // timestamptz whose instant is the local-bucket boundary:
  //   timezone(tz, ts::timestamptz) -> naive local timestamp
  //   date_trunc(..., naive)        -> floored naive local timestamp
  //   timezone(tz, naive::timestamp)-> timestamptz at local boundary
  const overviewRows = await db.execute(sql`
    select
      timezone(${tz}, date_trunc(${bucketTrunc}, timezone(${tz}, b.ts))) as ts,
      coalesce(sum(b.activity_count), 0)::bigint as activity,
      coalesce(sum(b.session_starts), 0)::bigint as sessions,
      coalesce(sum(b.total_tokens), 0)::bigint as tokens,
      coalesce(sum(b.lines_added + b.lines_removed), 0)::bigint as lines_changed
    from agent_time_buckets b
    where b.user_id = ${userId}
    ${sinceClause}
    ${bMachineClause}
    ${bSourceClause}
    group by 1
    order by 1
  `) as unknown as Record<string, unknown>[]

  // --- token buckets (timeline) --------------------------------------
  // Group by (bucket, source, model) so the frontend can stack the cost
  // timeline by agent source (codex / claude-code / opencode / pi) and
  // we can recompute cost via the live OpenRouter pricing catalogue —
  // matches agent-time's stacked bar chart. We pull from
  // agent_session_models (not agent_time_buckets) because the bucket
  // table's estimated_cost_micros is CLI-stamped and often 0 for codex
  // / claude-code sessions, which would otherwise hide entire stacks.
  // The bucket axis is derived from agent_sessions.last_event_at, which
  // is the closest proxy to "when this model usage happened" available
  // at the per-model granularity.
  const tokenRows = await db.execute(sql`
    select
      timezone(${tz}, date_trunc(${bucketTrunc}, timezone(${tz}, s.last_event_at))) as ts,
      coalesce(nullif(s.source, ''), 'unknown') as source,
      coalesce(m.model, 'unknown') as model,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.cache_creation_input_tokens), 0)::bigint as cache_creation_input_tokens,
      coalesce(sum(m.cache_read_input_tokens), 0)::bigint as cache_read_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(m.call_count), 0)::bigint as model_calls
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sessSinceClause}
    ${mMachineClause}
    ${mSourceClause}
    group by 1, 2, 3
    order by 1, 2, 3
  `) as unknown as Record<string, unknown>[]

  // --- heatmap (hour × weekday) --------------------------------------
  // Postgres: extract(dow) returns 0=Sun..6=Sat. We want Mon=0..Sun=6
  // to match agent-time's HourWeekdayCell shape.
  // `AT TIME ZONE ${tz}` converts the stored timestamptz to a naive
  // timestamp at the user's local zone, then extract(dow/hour) reads
  // weekday/hour as the user perceives them.
  const heatmapRows = await db.execute(sql`
    select
      ((extract(dow from (b.ts at time zone ${tz}))::int + 6) % 7) as weekday,
      extract(hour from (b.ts at time zone ${tz}))::int as hour,
      coalesce(sum(b.model_calls), 0)::bigint as count
    from agent_time_buckets b
    where b.user_id = ${userId}
    ${sinceClause}
    ${bMachineClause}
    ${bSourceClause}
    group by 1, 2
    order by 1, 2
  `) as unknown as Record<string, unknown>[]

  // Heatmap cost overlay. Same agent_session_models source as tokenRows
  // above (see that comment) but grouped on (weekday, hour) so the
  // rhythm tiles can read per-cell cost from the live pricing catalogue.
  const heatmapCostRows = await db.execute(sql`
    select
      ((extract(dow from (s.last_event_at at time zone ${tz}))::int + 6) % 7) as weekday,
      extract(hour from (s.last_event_at at time zone ${tz}))::int as hour,
      coalesce(m.model, 'unknown') as model,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.cache_creation_input_tokens), 0)::bigint as cache_creation_input_tokens,
      coalesce(sum(m.cache_read_input_tokens), 0)::bigint as cache_read_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sessSinceClause}
    ${mMachineClause}
    ${mSourceClause}
    group by 1, 2, 3
  `) as unknown as Record<string, unknown>[]
  const heatmapCostByCell = new Map<number, number>()
  for (const r of heatmapCostRows) {
    const key = toN(r.weekday) * 24 + toN(r.hour)
    const { cost } = estimateCostFromRow(r)
    heatmapCostByCell.set(key, (heatmapCostByCell.get(key) ?? 0) + cost)
  }

  // --- per-(project, model) breakdown ---------------------------------
  // Pulled once at the (project, model) grain so we can recompute cost
  // via the live pricing catalogue (estimateCostUsd) instead of trusting
  // the CLI's stored estimated_cost_micros, which uses a frozen fallback
  // table. We then fold this matrix two ways: by model (for the model
  // leaderboard) and by project (for the project leaderboard) below.
  const breakdownRows = await db.execute(sql`
    select
      coalesce(nullif(m.project, ''), 'unknown') as project,
      coalesce(nullif(m.source, ''), 'unknown') as source,
      coalesce(m.model, 'unknown') as model,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.cache_creation_input_tokens), 0)::bigint as cache_creation_input_tokens,
      coalesce(sum(m.cache_read_input_tokens), 0)::bigint as cache_read_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(m.total_tokens), 0)::bigint as total_tokens,
      coalesce(sum(m.call_count), 0)::bigint as model_calls,
      count(distinct m.session_id)::bigint as sessions
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sessSinceClause}
    ${mMachineClause}
    ${mSourceClause}
    group by 1, 2, 3
  `) as unknown as Record<string, unknown>[]

  // Per-project agent wall-clock duration — joined separately because
  // agent_session_models has no duration column and JOIN-then-SUM on
  // s.duration_ms would multiply-count when a session has more than
  // one model.
  const durationRows = await db.execute(sql`
    select
      coalesce(nullif(s.project, ''), 'unknown') as project,
      coalesce(sum(s.duration_ms), 0)::bigint as duration_ms
    from agent_sessions s
    where s.user_id = ${userId}
    ${sessSinceClause}
    ${sessMachineClause}
    ${sessSourceClause}
    group by 1
  `) as unknown as Record<string, unknown>[]
  const durationByProject = new Map<string, number>()
  for (const r of durationRows) {
    durationByProject.set(String(r.project ?? 'unknown'), toN(r.duration_ms))
  }

  // Per-source agent wall-clock duration, mirroring durationByProject.
  // Same caveat about joining session_models vs sessions for duration.
  const sourceDurationRows = await db.execute(sql`
    select
      coalesce(nullif(s.source, ''), 'unknown') as source,
      coalesce(sum(s.duration_ms), 0)::bigint as duration_ms,
      count(*)::bigint as sessions
    from agent_sessions s
    where s.user_id = ${userId}
    ${sessSinceClause}
    ${sessMachineClause}
    ${sessSourceClause}
    group by 1
  `) as unknown as Record<string, unknown>[]
  const durationBySource = new Map<string, number>()
  const sessionsBySource = new Map<string, number>()
  for (const r of sourceDurationRows) {
    const key = String(r.source ?? 'unknown')
    durationBySource.set(key, toN(r.duration_ms))
    sessionsBySource.set(key, toN(r.sessions))
  }

  // --- fold breakdown → model leaderboard -----------------------------
  type ModelAgg = {
    model: string
    inputTokens: number
    cachedInputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
    outputTokens: number
    reasoningOutputTokens: number
    totalTokens: number
    modelCalls: number
    cost: number
    pricing: ReturnType<typeof estimateCostUsd>['pricing']
  }
  const modelAggs = new Map<string, ModelAgg>()
  for (const r of breakdownRows) {
    const model = String(r.model ?? 'unknown')
    const inputTokens = toN(r.input_tokens)
    const cachedInputTokens = toN(r.cached_input_tokens)
    const cacheCreationInputTokens = toN(r.cache_creation_input_tokens)
    const cacheReadInputTokens = toN(r.cache_read_input_tokens)
    const outputTokens = toN(r.output_tokens)
    const reasoningOutputTokens = toN(r.reasoning_output_tokens)
    const totalTokens = toN(r.total_tokens)
    const modelCalls = toN(r.model_calls)
    const { cost, pricing } = estimateCostFromRow(r)
    const existing = modelAggs.get(model) ?? {
      model,
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      modelCalls: 0,
      cost: 0,
      pricing,
    }
    existing.inputTokens += inputTokens
    existing.cachedInputTokens += cachedInputTokens
    existing.cacheCreationInputTokens += cacheCreationInputTokens
    existing.cacheReadInputTokens += cacheReadInputTokens
    existing.outputTokens += outputTokens
    existing.reasoningOutputTokens += reasoningOutputTokens
    existing.totalTokens += totalTokens
    existing.modelCalls += modelCalls
    existing.cost += cost
    // Latest non-null pricing wins; identical across same-model rows.
    if (pricing) {
      existing.pricing = pricing
    }
    modelAggs.set(model, existing)
  }
  const modelRows = [...modelAggs.values()]
    .sort((a, b) => b.cost - a.cost || b.modelCalls - a.modelCalls)
    .slice(0, 30)

  // --- fold breakdown → project leaderboard ---------------------------
  // Track each project's agent-source-level cost map so the bar in
  // PROJECTS · COSTS can be segmented by agent (codex / claude-code /
  // opencode / pi / …) — the dimension users care about when deciding
  // which agent to keep on a project.
  type ProjectAgg = {
    project: string
    inputTokens: number
    cachedInputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
    outputTokens: number
    reasoningOutputTokens: number
    totalTokens: number
    modelCalls: number
    sessions: number
    cost: number
    bySource: Map<string, number>
  }
  const projectAggs = new Map<string, ProjectAgg>()
  for (const r of breakdownRows) {
    const project = String(r.project ?? 'unknown')
    const source = String(r.source ?? 'unknown')
    const inputTokens = toN(r.input_tokens)
    const cachedInputTokens = toN(r.cached_input_tokens)
    const cacheCreationInputTokens = toN(r.cache_creation_input_tokens)
    const cacheReadInputTokens = toN(r.cache_read_input_tokens)
    const outputTokens = toN(r.output_tokens)
    const reasoningOutputTokens = toN(r.reasoning_output_tokens)
    const totalTokens = toN(r.total_tokens)
    const modelCalls = toN(r.model_calls)
    const sessions = toN(r.sessions)
    const { cost } = estimateCostFromRow(r)
    const existing = projectAggs.get(project) ?? {
      project,
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      modelCalls: 0,
      sessions: 0,
      cost: 0,
      bySource: new Map<string, number>(),
    }
    existing.inputTokens += inputTokens
    existing.cachedInputTokens += cachedInputTokens
    existing.cacheCreationInputTokens += cacheCreationInputTokens
    existing.cacheReadInputTokens += cacheReadInputTokens
    existing.outputTokens += outputTokens
    existing.reasoningOutputTokens += reasoningOutputTokens
    existing.totalTokens += totalTokens
    existing.modelCalls += modelCalls
    existing.sessions += sessions
    existing.cost += cost
    existing.bySource.set(source, (existing.bySource.get(source) ?? 0) + cost)
    projectAggs.set(project, existing)
  }
  const projectAggList = [...projectAggs.values()]
    .sort((a, b) => b.cost - a.cost || b.totalTokens - a.totalTokens)
    .slice(0, 50)

  // --- fold breakdown → agent-source leaderboard ----------------------
  // Sibling to the project leaderboard. Re-aggregates breakdownRows by
  // source (claude-code / codex / opencode / pi / …) and tracks the
  // model mix inside each source so the stacked bar reads as "Opus
  // dominates claude-code, GPT-5 dominates codex" at a glance.
  type AgentAgg = {
    source: string
    inputTokens: number
    cachedInputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
    outputTokens: number
    reasoningOutputTokens: number
    totalTokens: number
    modelCalls: number
    cost: number
    byModel: Map<string, number>
  }
  const agentAggs = new Map<string, AgentAgg>()
  for (const r of breakdownRows) {
    const sourceKey = String(r.source ?? 'unknown')
    const model = String(r.model ?? 'unknown')
    const inputTokens = toN(r.input_tokens)
    const cachedInputTokens = toN(r.cached_input_tokens)
    const cacheCreationInputTokens = toN(r.cache_creation_input_tokens)
    const cacheReadInputTokens = toN(r.cache_read_input_tokens)
    const outputTokens = toN(r.output_tokens)
    const reasoningOutputTokens = toN(r.reasoning_output_tokens)
    const totalTokens = toN(r.total_tokens)
    const modelCalls = toN(r.model_calls)
    const { cost } = estimateCostFromRow(r)
    const existing = agentAggs.get(sourceKey) ?? {
      source: sourceKey,
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      modelCalls: 0,
      cost: 0,
      byModel: new Map<string, number>(),
    }
    existing.inputTokens += inputTokens
    existing.cachedInputTokens += cachedInputTokens
    existing.cacheCreationInputTokens += cacheCreationInputTokens
    existing.cacheReadInputTokens += cacheReadInputTokens
    existing.outputTokens += outputTokens
    existing.reasoningOutputTokens += reasoningOutputTokens
    existing.totalTokens += totalTokens
    existing.modelCalls += modelCalls
    existing.cost += cost
    existing.byModel.set(model, (existing.byModel.get(model) ?? 0) + cost)
    agentAggs.set(sourceKey, existing)
  }
  const agentAggList = [...agentAggs.values()]
    .sort((a, b) => b.cost - a.cost || b.totalTokens - a.totalTokens)

  // --- tools (normalized into categories) -----------------------------
  // Buckets raw tool names into the same eight categories agent-time
  // uses (Shell / File read / File search / File edit / File write /
  // Web / Planning / Agent / Integration / Other) via SQL CASE. Mirror
  // of normalizedToolSql() in agent-time/apps/api/src/storage/helpers.ts.
  const toolRows = await db.execute(sql`
    with norm as (
      select
        case lower(coalesce(t.tool, ''))
          when 'bash' then 'Shell'
          when 'command' then 'Shell'
          when 'exec_command' then 'Shell'
          when 'functions.exec_command' then 'Shell'
          when 'shell_command' then 'Shell'
          when 'shell' then 'Shell'
          when 'write_stdin' then 'Shell'
          when 'js_repl' then 'Shell'
          when 'js_repl_reset' then 'Shell'
          when 'wait' then 'Shell'
          when 'monitor' then 'Shell'
          when 'read' then 'File read'
          when 'notebookread' then 'File read'
          when 'view_image' then 'File read'
          when 'functions.view_image' then 'File read'
          when 'grep' then 'File search'
          when 'glob' then 'File search'
          when 'ls' then 'File search'
          when 'search' then 'File search'
          when 'rg' then 'File search'
          when 'ag' then 'File search'
          when 'find' then 'File search'
          when 'edit' then 'File edit'
          when 'multiedit' then 'File edit'
          when 'notebookedit' then 'File edit'
          when 'apply_patch' then 'File edit'
          when 'applypatch' then 'File edit'
          when 'functions.apply_patch' then 'File edit'
          when 'write' then 'File write'
          when 'webfetch' then 'Web'
          when 'web_fetch' then 'Web'
          when 'websearch' then 'Web'
          when 'web_search' then 'Web'
          when 'web_search_preview' then 'Web'
          when 'update_plan' then 'Planning'
          when 'request_user_input' then 'Planning'
          when 'askuserquestion' then 'Planning'
          when 'schedulewakeup' then 'Planning'
          when 'taskcreate' then 'Planning'
          when 'taskupdate' then 'Planning'
          when 'taskstop' then 'Planning'
          when 'tasklist' then 'Planning'
          when 'enterplanmode' then 'Planning'
          when 'exitplanmode' then 'Planning'
          when 'agent' then 'Agent'
          when 'task' then 'Agent'
          when 'spawn_agent' then 'Agent'
          when 'functions.spawn_agent' then 'Agent'
          when 'wait_agent' then 'Agent'
          when 'close_agent' then 'Agent'
          when 'send_input' then 'Agent'
          when 'taskoutput' then 'Agent'
          when 'toolsearch' then 'Integration'
          when 'skill' then 'Integration'
          when 'search_icons' then 'Integration'
          when 'list_mcp_resources' then 'Integration'
          when 'list_mcp_resource_templates' then 'Integration'
          else (
            case
              when lower(coalesce(t.tool, '')) like '%exec_command%' then 'Shell'
              when lower(coalesce(t.tool, '')) like '%apply_patch%' then 'File edit'
              when lower(coalesce(t.tool, '')) like '%web_search%' then 'Web'
              when lower(coalesce(t.tool, '')) like '%todo%' then 'Planning'
              when lower(coalesce(t.tool, '')) like '%spawn_agent%' then 'Agent'
              when lower(coalesce(t.tool, '')) like 'mcp__%' then 'Integration'
              when lower(coalesce(t.tool, '')) like 'mcp.%' then 'Integration'
              when substr(lower(coalesce(t.tool, '')), 1, 1) = '_' then 'Integration'
              else 'Other'
            end
          )
        end as tool,
        t.call_count,
        t.failure_count,
        t.total_duration_ms
      from agent_tool_calls t
      join agent_sessions s on s.rollup_key = t.rollup_key
      where t.user_id = ${userId}
      ${sessSinceClause}
      ${sessMachineClause}
      ${sessSourceClause}
    )
    select
      tool,
      coalesce(sum(call_count), 0)::bigint as calls,
      coalesce(sum(failure_count), 0)::bigint as failures,
      coalesce(sum(total_duration_ms), 0)::bigint as total_duration_ms
    from norm
    group by 1
    order by calls desc
    limit 30
  `) as unknown as Record<string, unknown>[]

  // --- available sources (for the agent picker) ----------------------
  // List every source the user has ever ingested, ignoring the current
  // source filter (otherwise the dropdown would shrink to just the
  // already-selected value). Machine + time scope are kept so the list
  // reflects what's actually reachable from the picker's perspective.
  const sourceRows = await db.execute(sql`
    select distinct coalesce(nullif(s.source, ''), 'unknown') as source
    from agent_sessions s
    where s.user_id = ${userId}
    ${sessSinceClause}
    ${sessMachineClause}
    order by 1
  `) as unknown as Record<string, unknown>[]

  // Fold tokenRows into one entry per bucket with a bySource breakdown.
  // The resulting per-bucket cost also feeds overviewBuckets below — its
  // own estimated_cost_micros source is unreliable (see tokenRows above).
  type SourceTotals = { inputTokens: number, cachedInputTokens: number, outputTokens: number, reasoningOutputTokens: number, modelCalls: number, estimatedCostUsd: number }
  type Bucket = { ts: string, bySource: Record<string, SourceTotals> } & SourceTotals
  const emptyCell = (): SourceTotals => ({
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    modelCalls: 0,
    estimatedCostUsd: 0,
  })
  const bucketMap = new Map<string, Bucket>()
  for (const r of tokenRows) {
    const ts = tsToIso(r.ts)
    const source = String(r.source ?? 'unknown')
    const inputTokens = toN(r.input_tokens)
    const cachedInputTokens = toN(r.cached_input_tokens)
    const outputTokens = toN(r.output_tokens)
    const reasoningOutputTokens = toN(r.reasoning_output_tokens)
    const modelCalls = toN(r.model_calls)
    const { cost } = estimateCostFromRow(r)
    const existing = bucketMap.get(ts) ?? {
      ts,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      modelCalls: 0,
      estimatedCostUsd: 0,
      bySource: {},
    }
    const cell = existing.bySource[source] ?? emptyCell()
    cell.inputTokens += inputTokens
    cell.cachedInputTokens += cachedInputTokens
    cell.outputTokens += outputTokens
    cell.reasoningOutputTokens += reasoningOutputTokens
    cell.modelCalls += modelCalls
    cell.estimatedCostUsd += cost
    existing.bySource[source] = cell
    existing.inputTokens += inputTokens
    existing.cachedInputTokens += cachedInputTokens
    existing.outputTokens += outputTokens
    existing.reasoningOutputTokens += reasoningOutputTokens
    existing.modelCalls += modelCalls
    existing.estimatedCostUsd += cost
    bucketMap.set(ts, existing)
  }
  const tokenBucketList = [...bucketMap.values()].sort((a, b) => a.ts.localeCompare(b.ts))
  const overviewCostByTs = new Map(tokenBucketList.map(b => [b.ts, b.estimatedCostUsd]))

  // Dense bucket spine for [since, until]. Without it, KPI sparklines &
  // the cost timeline collapse to a single bar when the user only has
  // activity in one bucket — Postgres only returns rows where data
  // exists. The spine forces the full window's width regardless.
  // For the open-ended 'all' range we fall back to the earliest ts we
  // saw across overview / token rows; if nothing's there we skip.
  const spineStartIso = sinceIso ?? (() => {
    const candidates: string[] = []
    if (overviewRows[0]) {
      candidates.push(tsToIso((overviewRows[0] as Record<string, unknown>).ts))
    }
    if (tokenBucketList[0]) {
      candidates.push(tokenBucketList[0].ts)
    }
    return candidates.length > 0 ? candidates.sort()[0]! : null
  })()
  let spine: string[] = []
  if (spineStartIso) {
    const spineRows = await db.execute(sql`
      select timezone(${tz}, gs)::timestamptz as ts
      from generate_series(
        date_trunc(${bucketTrunc}, timezone(${tz}, ${spineStartIso}::timestamptz)),
        date_trunc(${bucketTrunc}, timezone(${tz}, ${untilIso}::timestamptz)),
        ('1 ' || ${bucketTrunc})::interval
      ) as gs
    `) as unknown as Record<string, unknown>[]
    spine = spineRows.map(r => tsToIso(r.ts))
  }

  function fillSpine<T extends { ts: string }>(rows: T[], blank: (ts: string) => T): T[] {
    if (spine.length === 0) {
      return rows
    }
    const byTs = new Map(rows.map(r => [r.ts, r] as const))
    return spine.map(ts => byTs.get(ts) ?? blank(ts))
  }

  return {
    availableSources: sourceRows.map(r => String(r.source ?? 'unknown')),
    range: {
      key: range.key,
      since: range.since ? range.since.toISOString() : null,
      until: range.until.toISOString(),
    },
    bucket: range.bucket,
    summary: {
      totalSessions: toN(summaryRow.total_sessions),
      totalEvents: toN(summaryRow.total_events),
      totalProjects: toN(summaryRow.total_projects),
      totalToolCalls: toN(summaryRow.total_tool_calls),
      totalCommandCalls: toN(summaryRow.total_command_calls),
      totalInputTokens: toN(summaryRow.total_input_tokens),
      totalCachedInputTokens: toN(summaryRow.total_cached_input_tokens),
      totalOutputTokens: toN(summaryRow.total_output_tokens),
      totalReasoningOutputTokens: toN(summaryRow.total_reasoning_output_tokens),
      totalTokens: toN(summaryRow.total_tokens),
      totalDurationMs: toN(summaryRow.total_duration_ms),
      totalLinesAdded: toN(summaryRow.total_lines_added),
      totalLinesRemoved: toN(summaryRow.total_lines_removed),
    },
    overviewBuckets: fillSpine(
      overviewRows.map((r) => {
        const ts = tsToIso(r.ts)
        return {
          ts,
          activity: toN(r.activity),
          sessions: toN(r.sessions),
          tokens: toN(r.tokens),
          linesChanged: toN(r.lines_changed),
          estimatedCostUsd: overviewCostByTs.get(ts) ?? 0,
        }
      }),
      ts => ({ ts, activity: 0, sessions: 0, tokens: 0, linesChanged: 0, estimatedCostUsd: 0 }),
    ),
    tokenBuckets: fillSpine(
      tokenBucketList,
      ts => ({
        ts,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        modelCalls: 0,
        estimatedCostUsd: 0,
        bySource: {},
      }),
    ),
    heatmap: heatmapRows.map((r) => {
      const weekday = toN(r.weekday)
      const hour = toN(r.hour)
      return {
        weekday,
        hour,
        count: toN(r.count),
        estimatedCostUsd: heatmapCostByCell.get(weekday * 24 + hour) ?? 0,
      }
    }),
    projectTokens: projectAggList.map(p => ({
      project: p.project,
      inputTokens: p.inputTokens,
      cachedInputTokens: p.cachedInputTokens,
      outputTokens: p.outputTokens,
      reasoningOutputTokens: p.reasoningOutputTokens,
      totalTokens: p.totalTokens,
      modelCalls: p.modelCalls,
      sessions: p.sessions,
      agentDurationMs: durationByProject.get(p.project) ?? 0,
      estimatedCostUsd: p.cost,
      // Sorted descending by cost; the frontend renders this as a
      // stacked horizontal bar so reading per-agent share is one glance.
      sourceSegments: [...p.bySource.entries()]
        .filter(([, cost]) => cost > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([source, cost]) => ({ source, estimatedCostUsd: cost })),
    })),
    modelCosts: modelRows.map(m => ({
      model: m.model,
      inputTokens: m.inputTokens,
      cachedInputTokens: m.cachedInputTokens,
      outputTokens: m.outputTokens,
      reasoningOutputTokens: m.reasoningOutputTokens,
      modelCalls: m.modelCalls,
      // duration_ms is not meaningful per model (one session can use
      // multiple models); we leave it at zero so the table doesn't
      // imply otherwise. Agent-time approximates this via token-weighted
      // share — punt until we need it.
      durationMs: 0,
      estimatedCostUsd: m.cost,
      pricing: m.pricing
        ? {
            displayName: m.pricing.displayName,
            source: m.pricing.source,
            inputPerMillion: m.pricing.inputCostPerToken * 1_000_000,
            cacheCreationInputPerMillion: m.pricing.cacheCreationInputCostPerToken * 1_000_000,
            cacheReadInputPerMillion: m.pricing.cacheReadInputCostPerToken * 1_000_000,
            cachedInputPerMillion: m.pricing.cachedInputCostPerToken * 1_000_000,
            outputPerMillion: m.pricing.outputCostPerToken * 1_000_000,
          }
        : {
            displayName: undefined,
            source: 'missing' as const,
            inputPerMillion: 0,
            cacheCreationInputPerMillion: 0,
            cacheReadInputPerMillion: 0,
            cachedInputPerMillion: 0,
            outputPerMillion: 0,
          },
    })),
    agentCosts: agentAggList.map(a => ({
      source: a.source,
      sessions: sessionsBySource.get(a.source) ?? 0,
      modelCalls: a.modelCalls,
      inputTokens: a.inputTokens,
      cachedInputTokens: a.cachedInputTokens,
      outputTokens: a.outputTokens,
      reasoningOutputTokens: a.reasoningOutputTokens,
      totalTokens: a.totalTokens,
      agentDurationMs: durationBySource.get(a.source) ?? 0,
      estimatedCostUsd: a.cost,
      modelSegments: [...a.byModel.entries()]
        .filter(([, cost]) => cost > 0)
        .sort((x, y) => y[1] - x[1])
        .map(([model, cost]) => ({ model, estimatedCostUsd: cost })),
    })),
    tools: toolRows.map(r => ({
      tool: String(r.tool ?? 'Other'),
      calls: toN(r.calls),
      failures: toN(r.failures),
      totalDurationMs: toN(r.total_duration_ms),
      avgDurationMs: toN(r.calls) > 0 ? toN(r.total_duration_ms) / toN(r.calls) : 0,
    })),
    pricing: pricingState(),
  }
})
