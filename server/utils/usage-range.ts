// Range union shared between the public usage JSON endpoint and the
// SVG widget renderer that consumes it.

import { isValidTimezone, localPartsIn, todayStartUtc, wallClockToUtc } from './tz'

// Two families of window:
//   - Calendar-aligned: today / this week / this month / this year — anchored
//     to the user's IANA timezone (start-of-period in local wall-clock).
//   - Rolling lookbacks: 24h / 7d / 30d / 365d — `now - N days`, timezone
//     independent. These mirror the agent dashboard's rolling presets so a
//     widget set to `30d` prices the same span as the dashboard default.
// `all` covers full history. Ids are kept distinct on purpose: `month` is
// always the calendar month, never "last 30 days" (use `30d` for that).
export const USAGE_RANGES = [
  'today',
  'week',
  'month',
  'year',
  '24h',
  '7d',
  '30d',
  '365d',
  'all',
] as const
export type UsageRange = typeof USAGE_RANGES[number]

export function parseUsageRange(raw: unknown, fallback: UsageRange = '30d'): UsageRange {
  const v = String(raw ?? '').toLowerCase()
  return (USAGE_RANGES as readonly string[]).includes(v) ? (v as UsageRange) : fallback
}

const DAY_MS = 86_400_000

// Days of lookback for each rolling range id.
const ROLLING_DAYS: Partial<Record<UsageRange, number>> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '365d': 365,
}

// UTC start of the requested window, or null for `all`. Calendar ranges
// anchor to `tz`; rolling ranges subtract a fixed span from `now`.
export function usageRangeStart(tz: string, range: UsageRange, now: Date = new Date()): Date | null {
  if (range === 'all') {
    return null
  }
  const rollingDays = ROLLING_DAYS[range]
  if (rollingDays !== undefined) {
    return new Date(now.getTime() - rollingDays * DAY_MS)
  }
  // Calendar-aligned ranges.
  const safeTz = isValidTimezone(tz) ? tz : 'Etc/UTC'
  const parts = localPartsIn(safeTz, now)
  if (range === 'today') {
    return todayStartUtc(safeTz)
  }
  if (range === 'week') {
    const today = wallClockToUtc(safeTz, parts.y, parts.m, parts.d)
    return new Date(today.getTime() - (parts.dow - 1) * DAY_MS)
  }
  if (range === 'month') {
    return wallClockToUtc(safeTz, parts.y, parts.m, 1)
  }
  // year
  return wallClockToUtc(safeTz, parts.y, 1, 1)
}
