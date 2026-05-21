import { sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { ensurePricingLoaded, estimateCostUsd } from '../../../../../utils/agent-pricing'
import { useDb } from '../../../../../utils/db'
import { sendPyError } from '../../../../../utils/py-error'
import { parseUsageRange, USAGE_RANGES, usageRangeStart } from '../../../../../utils/usage-range'

// Public token / cost summary backing the embeddable usage widget.
// Caller picks the window via `?range=today|week|month|year|all`; all
// calendar-aligned ranges anchor to the user's stored IANA timezone.
// Cost is recomputed via the live OpenRouter catalogue so the figure
// matches the Vibe dashboard, not the CLI-stamped estimated_cost_micros
// (which is 0 for codex / claude-code sessions).

defineRouteMeta({
  openAPI: {
    tags: ['users', 'widgets'],
    summary: 'Public token / cost usage snapshot for embeddable widgets',
    parameters: [
      { name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } },
      {
        name: 'range',
        in: 'query',
        schema: { type: 'string', enum: [...USAGE_RANGES], default: 'month' },
        description: 'Calendar-aligned window in the user\'s timezone; `all` covers full history.',
      },
    ],
    responses: {
      200: {
        description: 'Usage snapshot payload',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetUsageResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          WidgetUsageResponse: {
            type: 'object',
            required: ['plan', 'range', 'until', 'tokens', 'inputTokens', 'cachedInputTokens', 'outputTokens', 'reasoningOutputTokens', 'estimatedCostUsd'],
            properties: {
              plan: { type: 'string' },
              range: { type: 'string', enum: [...USAGE_RANGES] },
              since: { type: 'string', format: 'date-time', nullable: true, description: 'Inclusive lower bound; null when `range=all`.' },
              until: { type: 'string', format: 'date-time' },
              tokens: { type: 'integer' },
              inputTokens: { type: 'integer' },
              cachedInputTokens: { type: 'integer' },
              outputTokens: { type: 'integer' },
              reasoningOutputTokens: { type: 'integer' },
              estimatedCostUsd: { type: 'number' },
            },
          },
        },
      },
    },
  },
})

type ModelRow = {
  model: string
  input_tokens: number | string | null
  cached_input_tokens: number | string | null
  cache_creation_input_tokens: number | string | null
  cache_read_input_tokens: number | string | null
  output_tokens: number | string | null
  reasoning_output_tokens: number | string | null
  total_tokens: number | string | null
}

function toN(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function summarize(rows: ModelRow[]) {
  let tokens = 0
  let inputTokens = 0
  let cachedInputTokens = 0
  let outputTokens = 0
  let reasoningOutputTokens = 0
  let estimatedCostUsd = 0
  for (const r of rows) {
    const inT = toN(r.input_tokens)
    const cachedT = toN(r.cached_input_tokens)
    const cacheCreationT = toN(r.cache_creation_input_tokens)
    const cacheReadT = toN(r.cache_read_input_tokens)
    const outT = toN(r.output_tokens)
    const reasoningT = toN(r.reasoning_output_tokens)
    const totalT = toN(r.total_tokens)
    const { cost } = estimateCostUsd({
      model: String(r.model || 'unknown'),
      inputTokens: inT,
      cachedInputTokens: cachedT,
      cacheCreationInputTokens: cacheCreationT,
      cacheReadInputTokens: cacheReadT,
      outputTokens: outT,
      reasoningOutputTokens: reasoningT,
    })
    tokens += totalT
    inputTokens += inT
    cachedInputTokens += cachedT
    outputTokens += outT
    reasoningOutputTokens += reasoningT
    estimatedCostUsd += cost
  }
  return { tokens, inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens, estimatedCostUsd }
}

export default defineEventHandler(async (event) => {
  const userIdStr = getRouterParam(event, 'user_id')
  const userId = Number(userIdStr)
  if (!Number.isFinite(userId) || userId <= 0) {
    return sendPyError(event, 404, 'User not found')
  }

  const db = useDb()
  // The user row and the (cached) pricing fetch are independent — overlap
  // them so the cold-start path doesn't serialize the OpenRouter load
  // behind a tiny indexed lookup.
  const [userRows] = await Promise.all([
    db.execute(sql`
      select plan, timezone
      from users
      where id = ${userId}
      limit 1
    `) as unknown as Promise<{ plan: string | null, timezone: string | null }[]>,
    ensurePricingLoaded(),
  ])
  const user = userRows[0]
  if (!user) {
    return sendPyError(event, 404, 'User not found')
  }

  const plan = (user.plan || 'free').toLowerCase()
  const range = parseUsageRange(getQuery(event).range)
  const tz = user.timezone || 'Etc/UTC'

  const now = new Date()
  const since = usageRangeStart(tz, range, now)
  const sinceClause = since
    ? sql`and s.last_event_at >= ${since.toISOString()}::timestamptz`
    : sql``

  const rows = await db.execute(sql`
    select
      coalesce(m.model, 'unknown') as model,
      coalesce(sum(m.input_tokens), 0)::bigint as input_tokens,
      coalesce(sum(m.cached_input_tokens), 0)::bigint as cached_input_tokens,
      coalesce(sum(m.cache_creation_input_tokens), 0)::bigint as cache_creation_input_tokens,
      coalesce(sum(m.cache_read_input_tokens), 0)::bigint as cache_read_input_tokens,
      coalesce(sum(m.output_tokens), 0)::bigint as output_tokens,
      coalesce(sum(m.reasoning_output_tokens), 0)::bigint as reasoning_output_tokens,
      coalesce(sum(m.total_tokens), 0)::bigint as total_tokens
    from agent_session_models m
    join agent_sessions s on s.rollup_key = m.rollup_key
    where m.user_id = ${userId}
    ${sinceClause}
    group by 1
  `) as unknown as ModelRow[]

  return {
    plan,
    range,
    since: since ? since.toISOString() : null,
    until: now.toISOString(),
    ...summarize(rows),
  }
})
