import type { SQL } from 'drizzle-orm'
import { eq, gte, lte, sql } from 'drizzle-orm'
import { workspaceMetaV2, workspaceMinutesV2 } from '../db/schema'

// Shared helpers for the /v3/users/self/stats_time and /stats endpoints.
// Python uses date_trunc(unit, timezone(tz, recorded_at)) — we mirror that.
// Postgres' timezone() converts a timestamptz to a naive timestamp in the
// given zone, exactly what date_trunc expects for local-day buckets.
//
// Important: `unit` and `tz` are inlined as SQL string literals (not
// prepared parameters). Drizzle assigns a fresh $N placeholder to every
// `sql` interpolation, so the same logical expression in SELECT vs
// GROUP BY ends up as `date_trunc($1, …, $2)` vs `date_trunc($6, …, $7)`.
// Postgres' optimiser treats those as *different* expressions and rejects
// the column as not-aggregated. Inlining the literals lets it match them.

export type Unit = 'days' | 'hours' | 'minutes'

// Escape single quotes for inlining as a Postgres string literal.
function pgLiteral(value: string): string {
  return `'${value.replaceAll('\'', '\'\'')}'`
}

export function timeTruncExpr(unit: Unit, tz: string): SQL {
  const unitName = unit === 'days' ? 'day' : unit === 'hours' ? 'hour' : 'minute'
  return sql.raw(`date_trunc(${pgLiteral(unitName)}, timezone(${pgLiteral(tz)}, "workspace_minutes_v2"."recorded_at"))`)
}

export function computeWindow(opts: {
  startTime: Date | null
  endTime: Date | null
  unit: Unit
  limit: number
  isPro: boolean
}): { queryStart: Date, queryEnd: Date, limit: number } {
  if (opts.startTime && opts.endTime) {
    return { queryStart: opts.startTime, queryEnd: opts.endTime, limit: opts.limit }
  }
  const perUnit = opts.unit === 'days' ? 24 * 60 : opts.unit === 'hours' ? 60 : 1
  let total = opts.limit * perUnit
  let limit = opts.limit
  const max = 90 * 24 * 60
  if (total > max && !opts.isPro) {
    total = max
    limit = Math.floor(max / perUnit)
  }
  const end = new Date()
  const start = new Date(end.getTime() - total * 60_000)
  return { queryStart: start, queryEnd: end, limit }
}

export function statsBaseWhere(uid: number, start: Date, end: Date): SQL[] {
  return [
    eq(workspaceMinutesV2.uid, uid),
    gte(workspaceMinutesV2.recordedAt, start),
    lte(workspaceMinutesV2.recordedAt, end),
  ]
}

// True when any non-language filter is in play; only then do we need
// to join workspace_meta_v2 (language has a denormalised column).
export function needsMetaJoin(opts: { platform: string | null, project: string | null, by?: string }): boolean {
  if (opts.platform || opts.project) {
 return true
}
  return Boolean(opts.by && opts.by !== 'language')
}

export const META_BY: Record<string, any> = {
  language: workspaceMetaV2.language,
  workspace: workspaceMetaV2.workspaceName,
  editor: workspaceMetaV2.editor,
  platform: workspaceMetaV2.platform,
}

export { workspaceMetaV2, workspaceMinutesV2 } from '../db/schema'

export { and, count, eq, sql } from 'drizzle-orm'
