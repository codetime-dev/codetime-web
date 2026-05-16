// Fake `/v3/users/self/time-distribution` for the public demo dashboard.
// Mirrors TimeDistributionResponse — { data: [{ hour, minute, count }, ...] }.

import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateDistribution, pickSegmentIndex } from '../../../../../utils/demo-data'
import { parseDateParam } from '../../../../../utils/stats-time'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const start = parseDateParam(query.start_time)
  const end = parseDateParam(query.end_time)
  const segment = pickSegmentIndex(start, end)

  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  return { data: generateDistribution(segment) }
})
