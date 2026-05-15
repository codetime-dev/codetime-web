import { sql } from 'drizzle-orm'
import { defineEventHandler, setHeader } from 'h3'
import { useDb } from '../../utils/db'

// Mirrors codetime-server-v3 routes.py::get_total_minutes. Returns the
// global minute count and the rolling-24-hour delta. Python wraps the
// handler with Litestar `cache=60*60` (1-hour response cache); the
// browser-facing `Cache-Control: max-age=3600, public` header here gives
// CDN / Nuxt's nitro cache the same hint. The expensive scans run at
// worst once per hour per cache key.

defineRouteMeta({
  openAPI: {
    tags: ['root'],
    summary: 'Global coding-minute totals',
    responses: {
      200: {
        description: 'Total minutes payload',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['totalMinutes', 'last24HMinutes', 'cacheTimestamp'],
              properties: {
                totalMinutes: { type: 'integer' },
                last24HMinutes: { type: 'integer' },
                cacheTimestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const db = useDb()
  // Two separate scans matches the Python implementation. A combined
  // query with `FILTER` would save one pass but Postgres' query plan for
  // a partitioned table is already cheap and we want byte-equivalent
  // output, not a microbenchmark win.
  const [totalRow] = await db.execute(
    sql`select count(*)::bigint as n from workspace_minutes_v2`,
  ) as unknown as Array<{ n: string | number }>
  const [last24Row] = await db.execute(
    sql`select count(*)::bigint as n from workspace_minutes_v2 where recorded_at >= now() - interval '24 hours'`,
  ) as unknown as Array<{ n: string | number }>

  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    totalMinutes: Number(totalRow?.n ?? 0),
    last24HMinutes: Number(last24Row?.n ?? 0),
    cacheTimestamp: new Date().toISOString(),
  }
})
