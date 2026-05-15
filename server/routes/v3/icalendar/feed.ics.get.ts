import { createHash } from 'node:crypto'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors GET /v3/icalendar/feed.ics in codetime-server-v3
// (services/icalendar.py). Grouping rule, summary / description /
// categories shape, UID format and PRODID are kept byte-identical so a
// calendar app sees the same feed regardless of which backend serves it.
//
// Algorithm:
//   1. Fetch every minute row in the window (joined to meta for the
//      target field). No row LIMIT — Python streams everything.
//   2. Bucket rows by (local date, target value). Then within each
//      bucket sort by recorded_at and split into "continuous blocks"
//      separated by gaps > 5 minutes.
//   3. Emit one VEVENT per block whose minute count ≥
//      minimum_duration_minutes.

defineRouteMeta({
  openAPI: {
    tags: ['calendar', 'export'],
    summary: 'Coding-time iCalendar feed',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      { name: 'target', in: 'query', schema: { type: 'string', enum: ['language', 'workspace', 'editor', 'platform'], default: 'workspace' } },
      { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' } },
      { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' } },
      { name: 'minimum_duration_minutes', in: 'query', schema: { type: 'integer', minimum: 1, default: 5 } },
      { name: 'timezone', in: 'query', schema: { type: 'string', default: 'UTC' } },
    ],
    responses: {
      200: {
        description: 'iCalendar feed',
        content: { 'text/calendar': { schema: { type: 'string' } } },
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
    },
  },
})

const TARGET_COL: Record<string, any> = {
  language: workspaceMetaV2.language,
  workspace: workspaceMetaV2.workspaceName,
  editor: workspaceMetaV2.editor,
  platform: workspaceMetaV2.platform,
}

const TITLE_PREFIX: Record<string, string> = {
  language: 'Coding',
  workspace: 'Project',
  editor: 'Editor',
  platform: 'Platform',
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) {
 return null
}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
 return null
}
  return new Date(`${s}T00:00:00Z`)
}

// `YYYYMMDDTHHMMSSZ` — RFC 5545 UTC form.
function icalDateZ(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, '0')
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const da = d.getUTCDate().toString().padStart(2, '0')
  const h = d.getUTCHours().toString().padStart(2, '0')
  const mi = d.getUTCMinutes().toString().padStart(2, '0')
  const s = d.getUTCSeconds().toString().padStart(2, '0')
  return `${y}${mo}${da}T${h}${mi}${s}Z`
}

// Python `datetime.isoformat()` for a tz-aware datetime produces
// `2024-01-31T08:34:00+00:00`. Reproduce that exact form so the UID
// field stays byte-identical.
function pyIsoTzAware(d: Date, offsetMinutes: number): string {
  // Compute components in the target offset
  const shifted = new Date(d.getTime() + offsetMinutes * 60_000)
  const y = shifted.getUTCFullYear().toString().padStart(4, '0')
  const mo = (shifted.getUTCMonth() + 1).toString().padStart(2, '0')
  const da = shifted.getUTCDate().toString().padStart(2, '0')
  const h = shifted.getUTCHours().toString().padStart(2, '0')
  const mi = shifted.getUTCMinutes().toString().padStart(2, '0')
  const s = shifted.getUTCSeconds().toString().padStart(2, '0')
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const oh = Math.floor(abs / 60).toString().padStart(2, '0')
  const om = (abs % 60).toString().padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}:${s}${sign}${oh}:${om}`
}

// CPython `hash(str)` is PYTHONHASHSEED-randomised at process start and
// has nothing reproducible we can mimic from Node. Instead of trying to
// match the Python UID literal, emit a deterministic 64-bit signed-int
// surrogate hash derived from the event payload — same magnitude/shape,
// stable across runs. Documented divergence; callers should not rely on
// UID equality across backends.
function deterministicHash(payload: string): string {
  const h = createHash('sha256').update(payload).digest()
  // Take 8 bytes, interpret as signed BigInt, mirror Python's signed int
  // hash range (negative half supported).
  let n = h.readBigInt64BE(0)
  if (n >= 1n << 63n) {
 n = n - (1n << 64n)
}
  return n.toString()
}

function pyDateKey(d: Date): string {
  // Use the UTC clock to mirror Python's `recorded_at.date()` on the
  // naive UTC datetime returned by the DB driver.
  const y = d.getUTCFullYear().toString().padStart(4, '0')
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, '0')
  const da = d.getUTCDate().toString().padStart(2, '0')
  return `${y}-${mo}-${da}`
}

function titleCase(s: string): string {
  return s.replace(/(?:^|\s)\S/g, c => c.toUpperCase())
}

// pytz timezone offset lookup at a given instant. We rely on Intl to
// avoid bundling a tz database.
function tzOffsetMinutes(tz: string, instant: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = fmt.formatToParts(instant)
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'
    const wall = Date.UTC(
      Number(get('year')),
      Number(get('month')) - 1,
      Number(get('day')),
      Number(get('hour') === '24' ? '0' : get('hour')),
      Number(get('minute')),
      Number(get('second')),
    )
    return Math.round((wall - instant.getTime()) / 60_000)
  }
  catch {
    return 0
  }
}

// Fold long lines per RFC 5545 §3.1. Python's `icalendar` library
// measures the line in *octets* (UTF-8 byte length), so multi-byte
// characters consume more budget per row. Replicate that here so the
// fold boundaries land on the same code points.
function fold(line: string): string {
  const buf = Buffer.from(line, 'utf8')
  if (buf.length <= 75) {
 return line
}
  const chunks: string[] = []
  let i = 0
  let chunkStart = 0
  // Iterate over code points so we never cut mid-UTF-8.
  const decoder = new TextDecoder('utf8')
  const arr = [...line]
  let cursor = 0
  let acc = ''
  let accBytes = 0
  for (const ch of arr) {
    const chBytes = Buffer.byteLength(ch, 'utf8')
    // Mirror Python `icalendar.parser.string.foldline`: it folds *before*
    // the character that would push the cumulative byte count to ≥ 75,
    // so each line ends at most at 74 content octets (with the inclusive
    // >=75 trigger). Using `>= max` here matches that behaviour.
    const max = 75
    if (accBytes + chBytes >= max) {
      chunks.push(acc)
      acc = ch
      accBytes = chBytes
    }
    else {
      acc += ch
      accBytes += chBytes
    }
    cursor += 1
  }
  if (acc) chunks.push(acc)
  // Silence unused locals; the encoded form is only needed for the size
  // check above.
  void buf
  void decoder
  void i
  void chunkStart
  void cursor
  return chunks.join('\r\n ')
}

// Escape CR/LF/comma/semicolon/backslash per RFC 5545.
function esc(s: string): string {
  return s
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n')
}

type Row = {
  recorded_at: Date
  language: string
  workspace_name: string
  editor: string
  platform: string
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const target = String(q.target || 'workspace')
  if (!TARGET_COL[target]) {
    return sendPyError(event, 400, `Invalid parameter: Invalid target '${target}'. Must be one of: language, workspace, editor, platform`)
  }
  const startBound = parseDate(typeof q.start_date === 'string' ? q.start_date : null)
  const endBoundRaw = parseDate(typeof q.end_date === 'string' ? q.end_date : null)
  // Python uses datetime.time.max for end_date — push to 23:59:59.999.
  // JS Date is millisecond-precision so we cap at one ms before the next
  // day, which matches Python's behaviour modulo sub-millisecond rows
  // (none in this dataset).
  const endBound = endBoundRaw ? new Date(endBoundRaw.getTime() + 86_399_999) : null
  if ((q.start_date && !startBound) || (q.end_date && !endBoundRaw)) {
    return sendPyError(event, 400, 'Invalid parameter: Invalid date format. Expected YYYY-MM-DD')
  }
  const minDur = Math.max(1, Math.trunc(Number(q.minimum_duration_minutes) || 5))
  const tz = typeof q.timezone === 'string' && q.timezone ? q.timezone : 'UTC'

  const db = useDb()
  const whereClauses = [eq(workspaceMinutesV2.uid, session.id)]
  if (startBound) {
 whereClauses.push(gte(workspaceMinutesV2.recordedAt, startBound))
}
  if (endBound) {
 whereClauses.push(lte(workspaceMinutesV2.recordedAt, endBound))
}
  const rowsRaw = await db
    .select({
      recorded_at: workspaceMinutesV2.recordedAt,
      language: workspaceMinutesV2.language,
      workspace_name: workspaceMetaV2.workspaceName,
      editor: workspaceMetaV2.editor,
      platform: workspaceMetaV2.platform,
    })
    .from(workspaceMinutesV2)
    .innerJoin(workspaceMetaV2, and(
      eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
      eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
    ))
    .where(and(...whereClauses))
    .orderBy(asc(workspaceMinutesV2.recordedAt))

  const rows = rowsRaw as Row[]
  const targetFieldKey: keyof Row = (
    target === 'workspace' ? 'workspace_name' : (target as keyof Row)
  )

  // Group by (date, target_value)
  const byDay = new Map<string, Map<string, Row[]>>()
  for (const r of rows) {
    const dk = pyDateKey(r.recorded_at)
    const tv = String(r[targetFieldKey] ?? '')
    let dayBucket = byDay.get(dk)
    if (!dayBucket) {
 dayBucket = new Map(); byDay.set(dk, dayBucket)
}
    let arr = dayBucket.get(tv)
    if (!arr) {
 arr = []; dayBucket.set(tv, arr)
}
    arr.push(r)
  }

  // Within each (date, value) bucket split into continuous blocks
  type Block = { targetValue: string, rows: Row[] }
  const blocks: Block[] = []
  for (const dayBucket of byDay.values()) {
    for (const [tv, arr] of dayBucket) {
      arr.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())
      let current: Row[] = []
      for (const r of arr) {
        if (current.length === 0) {
 current = [r]
}
        else {
          const last = current[current.length - 1]
          const diffMin = (r.recorded_at.getTime() - last.recorded_at.getTime()) / 60_000
          if (diffMin <= 5) {
 current.push(r)
}
          else {
            if (current.length >= minDur) {
 blocks.push({ targetValue: tv, rows: current })
}
            current = [r]
          }
        }
      }
      if (current.length >= minDur) {
        blocks.push({ targetValue: tv, rows: current })
      }
    }
  }

  // Emit the calendar. Header property order follows Python icalendar
  // verbatim (VERSION before PRODID — the library's own ordering, not
  // RFC-required but the SDK test diffs against it).
  const cal: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CodeTime//CodeTime Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    fold(`X-WR-CALNAME:Coding Time - ${titleCase(target)}`),
    fold(`X-WR-TIMEZONE:${tz}`),
  ]

  const now = new Date()
  const nowOffset = tzOffsetMinutes(tz, now)
  const createdIso = pyIsoTzAware(now, nowOffset)
  // Python's icalendar lib writes CREATED in basic UTC form
  // (YYYYMMDDTHHMMSSZ) — match that. Drop the offset string above.
  const createdStamp = icalDateZ(now)

  for (const b of blocks) {
    const duration = b.rows.length
    const first = b.rows[0]
    const last = b.rows[b.rows.length - 1]
    const startTime = first.recorded_at
    const endTime = new Date(last.recorded_at.getTime() + 60_000)
    const startOffset = tzOffsetMinutes(tz, startTime)
    const endOffset = tzOffsetMinutes(tz, endTime)

    const summary = `${TITLE_PREFIX[target]}: ${b.targetValue} (${duration}min)`

    const descLines: string[] = [
      `Coding time: ${duration} minutes`,
      `${titleCase(target)}: ${b.targetValue}`,
    ]
    if (target !== 'language') {
 descLines.push(`Language: ${first.language}`)
}
    if (target !== 'workspace') {
 descLines.push(`Workspace: ${first.workspace_name}`)
}
    if (target !== 'editor') {
 descLines.push(`Editor: ${first.editor}`)
}
    if (target !== 'platform') {
 descLines.push(`Platform: ${first.platform}`)
}

    // UID: codetime-<iso>-<value>-<hash>. The hash component cannot be
    // matched byte-for-byte against Python (`hash(str)` is salted per
    // process), so we synthesise a stable surrogate from the event
    // payload. Documented divergence — see deterministicHash().
    const uidPayload = JSON.stringify({
      target: b.targetValue,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      count: duration,
    })
    const uid = `codetime-${pyIsoTzAware(startTime, startOffset)}-${b.targetValue}-${deterministicHash(uidPayload)}`

    // DTSTART/DTEND emitted in UTC basic form (Z). Python feeds the
    // naive UTC `recorded_at` through icalendar with the user's tz
    // attached; the library converts to UTC for serialisation, which is
    // a no-op when the underlying instant is already UTC (the case for
    // our timestamptz column when tz=UTC). Nuxt observes the same UTC
    // instant directly, so no offset arithmetic is needed.
    void startOffset
    void endOffset
    void createdIso
    cal.push(
      'BEGIN:VEVENT',
      fold(`SUMMARY:${esc(summary)}`),
      `DTSTART:${icalDateZ(startTime)}`,
      `DTEND:${icalDateZ(endTime)}`,
      fold(`UID:${esc(uid)}`),
      // CATEGORIES is a single text value; `esc()` escapes embedded
      // commas to keep parity with Python icalendar's serialiser
      // (which also escapes them inside a single value).
      fold(`CATEGORIES:${esc(`Programming,${titleCase(target)},${b.targetValue}`)}`),
      `CREATED:${createdStamp}`,
      fold(`DESCRIPTION:${esc(descLines.join('\n'))}`),
      'END:VEVENT',
    )
  }
  cal.push('END:VCALENDAR')

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="codetime-${session.id}.ics"`)
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  return cal.join('\r\n')
})
