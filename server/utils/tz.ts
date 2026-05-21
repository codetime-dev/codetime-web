// Timezone helpers used by the public widget endpoints. The DST-safe
// wall-clock → UTC round-trip is non-trivial enough to be worth sharing.

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  }
  catch {
    return false
  }
}

export function localPartsIn(tz: string, now: Date): { y: number, m: number, d: number, h: number, mi: number, s: number, dow: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
  const wd = String(get('weekday')).slice(0, 3).toLowerCase()
  // Mon=1 … Sun=7, so "week" can subtract `dow - 1` days to land on Monday.
  const dowMap: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 }
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    h: Number(get('hour')),
    mi: Number(get('minute')),
    s: Number(get('second')),
    dow: dowMap[wd] ?? 1,
  }
}

// Resolve a wall-clock (y,m,d,h,mi,s) in `tz` to its UTC instant. The
// two-step round-trip survives DST cleanly because the offset is
// recomputed at the *target* instant, not "now".
export function wallClockToUtc(tz: string, y: number, m: number, d: number, h = 0, mi = 0, s = 0): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi, s)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(guess))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
  const local = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')),
    Number(get('minute')),
    Number(get('second')),
  )
  return new Date(guess - (local - guess))
}

// UTC instant at the start of today in `tz`.
export function todayStartUtc(tz: string): Date {
  const safeTz = isValidTimezone(tz) ? tz : 'Etc/UTC'
  const p = localPartsIn(safeTz, new Date())
  return wallClockToUtc(safeTz, p.y, p.m, p.d)
}
