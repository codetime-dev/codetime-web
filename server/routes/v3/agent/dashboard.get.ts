import { sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
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
'tools',
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
                tools: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

type RangeKey = '24h' | '7d' | '30d' | 'all'
type BucketGrain = 'hour' | 'day' | 'week'

const DAY_MS = 86_400_000

type RangeSpec = {
  key: RangeKey
  since: Date | null
  until: Date
  bucket: BucketGrain
}

function resolveRange(raw: unknown, cutoff: Date | null): RangeSpec {
  const key: RangeKey = raw === '24h' || raw === '7d' || raw === 'all' ? raw : raw === '30d' ? '30d' : '30d'
  const until = new Date()
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
    bucket = 'week'
  }
  }
  // Free plan cap: never query past the cutoff.
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

// Convert micro-USD (integer) to USD float.
function microsToUsd(value: unknown): number {
  return toN(value) / 1_000_000
}

export default defineEventHandler(async (event) => {
  const user = await tryUser(event)
  if (!user) {
    return sendPyError(event, 401, 'Not authenticated')
  }
  const q = getQuery(event)
  const cutoff = agentVisibilityCutoff(user.plan)
  const range = resolveRange(q.range, cutoff)
  const db = useDb()

  const userId = user.id
  // postgres-js sends Date objects via JS's default toString(), which
  // Postgres can't parse — explicitly cast an ISO string to
  // timestamptz so the driver hands over a value Postgres understands.
  const sinceIso = range.since ? range.since.toISOString() : null
  const bucketTrunc = range.bucket // postgres date_trunc accepts 'hour'/'day'/'week'

  // Build a reusable WHERE-fragment for buckets/models/tools. We use
  // last_event_at as the join column on agent_sessions; for buckets we
  // use bucket.ts; for tool/model tables we filter via the parent
  // session's last_event_at via subquery on agent_sessions when we
  // need a window. To keep queries simple, model/tool/file leaderboards
  // use the parent agent_sessions row's last_event_at via JOIN.

  const sinceClause = sinceIso ? sql`and b.ts >= ${sinceIso}::timestamptz` : sql``
  const sessSinceClause = sinceIso ? sql`and s.last_event_at >= ${sinceIso}::timestamptz` : sql``

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
  `)
  const summaryRow = (summaryRows as unknown as Record<string, unknown>[])[0] ?? {}

  // --- overview buckets ----------------------------------------------
  // One row per bucket (date_trunc). activity = activity_count;
  // sessions = session_starts; tokens = total_tokens; lines = added+removed;
  // estimated cost in USD.
  const overviewRows = await db.execute(sql`
    select
      date_trunc(${bucketTrunc}, b.ts) as ts,
      coalesce(sum(b.activity_count), 0)::bigint as activity,
      coalesce(sum(b.session_starts), 0)::bigint as sessions,
      coalesce(sum(b.total_tokens), 0)::bigint as tokens,
      coalesce(sum(b.lines_added + b.lines_removed), 0)::bigint as lines_changed,
      coalesce(sum(b.estimated_cost_micros), 0)::bigint as cost_micros
    from agent_time_buckets b
    where b.user_id = ${userId}
    ${sinceClause}
    group by 1
    order by 1
  `) as unknown as Record<string, unknown>[]

  // --- token buckets (timeline) --------------------------------------
  const tokenRows = await db.execute(sql`
    select
      date_trunc(${bucketTrunc}, b.ts) as ts,
      coalesce(sum(b.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(b.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(b.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(b.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(b.model_calls), 0)::bigint as model_calls,
      coalesce(sum(b.estimated_cost_micros), 0)::bigint as cost_micros
    from agent_time_buckets b
    where b.user_id = ${userId}
    ${sinceClause}
    group by 1
    order by 1
  `) as unknown as Record<string, unknown>[]

  // --- heatmap (hour × weekday) --------------------------------------
  // Postgres: extract(dow) returns 0=Sun..6=Sat. We want Mon=0..Sun=6
  // to match agent-time's HourWeekdayCell shape.
  const heatmapRows = await db.execute(sql`
    select
      ((extract(dow from b.ts)::int + 6) % 7) as weekday,
      extract(hour from b.ts)::int as hour,
      coalesce(sum(b.model_calls), 0)::bigint as count,
      coalesce(sum(b.estimated_cost_micros), 0)::bigint as cost_micros
    from agent_time_buckets b
    where b.user_id = ${userId}
    ${sinceClause}
    group by 1, 2
    order by 1, 2
  `) as unknown as Record<string, unknown>[]

  // --- project tokens ------------------------------------------------
  const projectRows = await db.execute(sql`
    select
      coalesce(nullif(m.project, ''), 'unknown') as project,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(m.total_tokens), 0)::bigint as total_tokens,
      coalesce(sum(m.call_count), 0)::bigint as model_calls,
      count(distinct m.session_id)::bigint as sessions,
      coalesce(sum(s.duration_ms), 0)::bigint as duration_ms,
      coalesce(sum(m.estimated_cost_micros), 0)::bigint as cost_micros
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sessSinceClause}
    group by 1
    order by cost_micros desc, sum(m.total_tokens) desc
    limit 50
  `) as unknown as Record<string, unknown>[]

  // --- model costs ---------------------------------------------------
  const modelRows = await db.execute(sql`
    select
      m.model as model,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(m.call_count), 0)::bigint as model_calls,
      coalesce(sum(s.duration_ms), 0)::bigint as duration_ms,
      coalesce(sum(m.estimated_cost_micros), 0)::bigint as cost_micros
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sessSinceClause}
    group by 1
    order by cost_micros desc, sum(m.input_tokens) + sum(m.output_tokens) desc
    limit 30
  `) as unknown as Record<string, unknown>[]

  // --- tools ---------------------------------------------------------
  const toolRows = await db.execute(sql`
    select
      t.tool as tool,
      coalesce(sum(t.call_count), 0)::bigint as calls,
      coalesce(sum(t.failure_count), 0)::bigint as failures,
      coalesce(sum(t.total_duration_ms), 0)::bigint as total_duration_ms
    from agent_tool_calls t
    join agent_sessions s on s.rollup_key = t.rollup_key
    where t.user_id = ${userId}
    ${sessSinceClause}
    group by 1
    order by calls desc
    limit 30
  `) as unknown as Record<string, unknown>[]

  return {
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
    overviewBuckets: overviewRows.map(r => ({
      ts: r.ts instanceof Date ? r.ts.toISOString() : String(r.ts),
      activity: toN(r.activity),
      sessions: toN(r.sessions),
      tokens: toN(r.tokens),
      linesChanged: toN(r.lines_changed),
      estimatedCostUsd: microsToUsd(r.cost_micros),
    })),
    tokenBuckets: tokenRows.map(r => ({
      ts: r.ts instanceof Date ? r.ts.toISOString() : String(r.ts),
      inputTokens: toN(r.input_tokens),
      cachedInputTokens: toN(r.cached_input_tokens),
      outputTokens: toN(r.output_tokens),
      reasoningOutputTokens: toN(r.reasoning_output_tokens),
      modelCalls: toN(r.model_calls),
      estimatedCostUsd: microsToUsd(r.cost_micros),
    })),
    heatmap: heatmapRows.map(r => ({
      weekday: toN(r.weekday),
      hour: toN(r.hour),
      count: toN(r.count),
      estimatedCostUsd: microsToUsd(r.cost_micros),
    })),
    projectTokens: projectRows.map(r => ({
      project: String(r.project ?? 'unknown'),
      inputTokens: toN(r.input_tokens),
      cachedInputTokens: toN(r.cached_input_tokens),
      outputTokens: toN(r.output_tokens),
      reasoningOutputTokens: toN(r.reasoning_output_tokens),
      totalTokens: toN(r.total_tokens),
      modelCalls: toN(r.model_calls),
      sessions: toN(r.sessions),
      agentDurationMs: toN(r.duration_ms),
      estimatedCostUsd: microsToUsd(r.cost_micros),
    })),
    modelCosts: modelRows.map(r => ({
      model: String(r.model ?? 'unknown'),
      inputTokens: toN(r.input_tokens),
      cachedInputTokens: toN(r.cached_input_tokens),
      outputTokens: toN(r.output_tokens),
      reasoningOutputTokens: toN(r.reasoning_output_tokens),
      modelCalls: toN(r.model_calls),
      durationMs: toN(r.duration_ms),
      estimatedCostUsd: microsToUsd(r.cost_micros),
    })),
    tools: toolRows.map(r => ({
      tool: String(r.tool ?? 'unknown'),
      calls: toN(r.calls),
      failures: toN(r.failures),
      totalDurationMs: toN(r.total_duration_ms),
      avgDurationMs: toN(r.calls) > 0 ? toN(r.total_duration_ms) / toN(r.calls) : 0,
    })),
  }
})
