// Range union shared between the public usage JSON endpoint and the
// SVG widget renderer that consumes it.

import { isValidTimezone, localPartsIn, todayStartUtc, wallClockToUtc } from './tz'

export const USAGE_RANGES = ['today', 'week', 'month', 'year', 'all'] as const
export type UsageRange = typeof USAGE_RANGES[number]

export function parseUsageRange(raw: unknown, fallback: UsageRange = 'month'): UsageRange {
  const v = String(raw ?? '').toLowerCase()
  return (USAGE_RANGES as readonly string[]).includes(v) ? (v as UsageRange) : fallback
}

// UTC start of the requested calendar window in `tz`, or null for `all`.
export function usageRangeStart(tz: string, range: UsageRange, now: Date = new Date()): Date | null {
  if (range === 'all') {
    return null
  }
  const safeTz = isValidTimezone(tz) ? tz : 'Etc/UTC'
  const parts = localPartsIn(safeTz, now)
  if (range === 'today') {
    return todayStartUtc(safeTz)
  }
  if (range === 'week') {
    const today = wallClockToUtc(safeTz, parts.y, parts.m, parts.d)
    return new Date(today.getTime() - (parts.dow - 1) * 86_400_000)
  }
  if (range === 'month') {
    return wallClockToUtc(safeTz, parts.y, parts.m, 1)
  }
  return wallClockToUtc(safeTz, parts.y, 1, 1)
}
