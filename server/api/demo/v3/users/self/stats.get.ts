// Fake `/v3/users/self/stats` for the public demo dashboard.
// Mirrors StatsResponse — { data: [{ duration, time, by }, ...] }.

import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateDailyByField } from '../../../../../utils/demo-data'

const ALLOWED = new Set(['language', 'workspace', 'platform', 'editor'])

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const by = String(query.by ?? 'language')
  const field = ALLOWED.has(by) ? (by as 'language' | 'workspace' | 'platform' | 'editor') : 'language'
  const rawLimit = Number(query.limit ?? 365)
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 365)) : 365

  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  return { data: generateDailyByField(field, limit) }
})
