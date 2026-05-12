// Fake `/v3/users/self/stats_time` for the public demo dashboard.
// Mirrors StatsTimeResponse — { data: [{ duration, time }, ...] }.

import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateDailyTotals } from '../../../../../utils/demo-data'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const rawLimit = Number(query.limit ?? 365)
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 365)) : 365

  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  return { data: generateDailyTotals(limit) }
})
