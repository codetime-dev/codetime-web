// Fake `/v3/users/self/top` for the public demo dashboard.
// Mirrors V3ListSelfTopResponses — Array<TopPublic>.

import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateTop } from '../../../../../utils/demo-data'

const ALLOWED = new Set(['language', 'workspace', 'platform', 'editor'])

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const field = String(query.field ?? 'language')
  if (!ALLOWED.has(field)) {
    return []
  }
  const minutes = Number(query.minutes ?? 28 * 24 * 60)
  const limit = Math.max(1, Math.min(Number(query.limit ?? 5), 20))

  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  return generateTop(
    field as 'language' | 'workspace' | 'platform' | 'editor',
    Number.isFinite(minutes) ? minutes : 28 * 24 * 60,
    limit,
  )
})
