// Fake `/v3/users/self/time-distribution` for the public demo dashboard.
// Mirrors TimeDistributionResponse — { data: [{ hour, minute, count }, ...] }.

import { defineEventHandler, getQuery, setHeader } from 'h3'
import { generateDistribution, pickSegmentIndex } from '../../../../../utils/demo-data'

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const start = parseDate(query.start_time)
  const end = parseDate(query.end_time)
  const segment = pickSegmentIndex(start, end)

  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=300')
  return { data: generateDistribution(segment) }
})
