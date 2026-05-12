import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { tryUser } from '../../../utils/auth'
import { useDb } from '../../../utils/db'
import { sendPyError } from '../../../utils/py-error'

// Mirrors GET /v3/icalendar/feed.ics. Walks the user's minute rows in
// the requested window, groups CONSECUTIVE minutes that share the
// target field into a single iCal VEVENT. Gaps of >5 minutes break a
// session. Only events meeting `minimum_duration_minutes` are kept.

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

function parseDate(s: string | null | undefined): Date | null {
  if (!s) {
 return null
}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
 return null
}
  return new Date(`${s}T00:00:00Z`)
}

function icalDate(d: Date): string {
  return d.toISOString().replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function fold(line: string): string {
  // RFC 5545: 75-octet lines, split with CRLF + leading space.
  if (line.length <= 75) {
 return line
}
  const chunks: string[] = []
  for (let i = 0; i < line.length; i += 74) chunks.push(line.slice(i, i + 74))
  return chunks.join('\r\n ')
}

export default defineEventHandler(async (event) => {
  const session = await tryUser(event)
  if (!session) {
 return sendPyError(event, 401, 'Not authenticated')
}

  const q = getQuery(event)
  const target = String(q.target || 'workspace')
  if (!TARGET_COL[target]) {
 return sendPyError(event, 400, 'Invalid target')
}
  const start = parseDate(typeof q.start_date === 'string' ? q.start_date : null)
  const end = parseDate(typeof q.end_date === 'string' ? q.end_date : null)
  if ((q.start_date && !start) || (q.end_date && !end)) {
    return sendPyError(event, 400, 'Invalid date format. Expected YYYY-MM-DD')
  }
  const minDur = Math.max(1, Math.trunc(Number(q.minimum_duration_minutes) || 5))
  const tz = typeof q.timezone === 'string' && q.timezone ? q.timezone : 'UTC'

  const now = new Date()
  const startBound = start ?? new Date(now.getTime() - 30 * 86_400_000)
  const endBound = end ?? now

  const db = useDb()
  const rows = await db
    .select({
      recorded_at: workspaceMinutesV2.recordedAt,
      target: TARGET_COL[target],
    })
    .from(workspaceMinutesV2)
    .innerJoin(workspaceMetaV2, and(
      eq(workspaceMinutesV2.uid, workspaceMetaV2.uid),
      eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
    ))
    .where(and(
      eq(workspaceMinutesV2.uid, session.id),
      gte(workspaceMinutesV2.recordedAt, startBound),
      lte(workspaceMinutesV2.recordedAt, endBound),
    ))
    .orderBy(asc(workspaceMinutesV2.recordedAt))

  type Session = { target: string, start: Date, end: Date, count: number }
  const sessions: Session[] = []
  let current: Session | null = null
  const GAP_MS = 5 * 60_000
  for (const r of rows) {
    const value = String(r.target ?? '')
    const ts = r.recorded_at as Date
    if (current && current.target === value && ts.getTime() - current.end.getTime() <= GAP_MS) {
      current.end = new Date(ts.getTime() + 60_000)
      current.count++
    }
    else {
      if (current) {
 sessions.push(current)
}
      current = { target: value, start: ts, end: new Date(ts.getTime() + 60_000), count: 1 }
    }
  }
  if (current) {
 sessions.push(current)
}

  const filtered = sessions.filter(s => s.count >= minDur)
  const dtStamp = icalDate(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Code Time//Nuxt//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Coding Time (${target})`,
    `X-WR-TIMEZONE:${tz}`,
  ]
  for (const s of filtered) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.start.getTime()}-${s.target}@codetime.dev`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${icalDate(s.start)}`,
      `DTEND:${icalDate(s.end)}`,
      fold(`SUMMARY:Coding: ${s.target || 'unknown'}`),
      fold(`DESCRIPTION:${s.count} minute${s.count === 1 ? '' : 's'} of activity grouped by ${target}`),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="codetime-${session.id}.ics"`)
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  return lines.join('\r\n')
})
