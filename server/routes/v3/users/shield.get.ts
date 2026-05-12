import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import languageColors from '../../../assets/LanguageColor.json'
import languageIdentifiers from '../../../assets/LanguageIdentifiers.json'
import { users, workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { useDb } from '../../../utils/db'
import { getShieldMessage } from '../../../utils/duration'
import { sendPyError } from '../../../utils/py-error'

// Mirrors GET /v3/users/shield. Returns the data block for a
// shields.io-style badge — coding minutes within an optional time
// window, optionally filtered by project/language. Logo SVG and the
// human-readable message format are byte-identical to the Python output.

const LOGO_SVG = `<svg width="377" height="377" viewBox="0 0 377 377" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="188.5" cy="188.5" r="172.5" fill="#D9D9D9" stroke="#1874A8" stroke-width="32"/><circle cx="188.5" cy="188.5" r="172.5" fill="#D9D9D9" stroke="#1874A8" stroke-width="32"/><path d="M289.352 113L307.016 140.904L223.944 189.416L307.016 237.032L288.712 265.832L189 203.88V175.208L289.352 113Z" fill="#2E2E2E"/></svg>`

defineRouteMeta({
  openAPI: {
    tags: ['users', 'widgets'],
    summary: 'Shields.io-compatible badge payload',
    parameters: [
      { name: 'uid', in: 'query', required: true, schema: { type: 'integer' } },
      { name: 'minutes', in: 'query', schema: { type: 'integer', default: 0 } },
      { name: 'project', in: 'query', schema: { type: 'string' } },
      { name: 'language', in: 'query', schema: { type: 'string' } },
      { name: 'only_hours', in: 'query', schema: { type: 'boolean', default: false } },
    ],
    responses: {
      200: {
        description: 'Shield JSON',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ShieldResponse' } } },
      },
      404: { $ref: '#/components/responses/NotFound' },
    },
    $global: {
      components: {
        schemas: {
          ShieldResponse: {
            type: 'object',
            required: ['schemaVersion', 'label', 'message', 'color'],
            properties: {
              schemaVersion: { type: 'integer' },
              logoSvg: { type: 'string', nullable: true },
              label: { type: 'string' },
              message: { type: 'string' },
              color: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

const LANGUAGE_COLORS = languageColors as Record<string, string>
const LANGUAGE_IDENTIFIERS = languageIdentifiers as Record<string, string>

function intOr(v: unknown, fallback: number): number {
  if (v === '' || v === undefined || v === null) {
 return fallback
}
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function strOr(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') {
 return v
}
  if (typeof v === 'string') {
 return /^(?:1|true|yes)$/i.test(v)
}
  return false
}

function titleCase(s: string): string {
  return s.replaceAll(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  // Match Litestar: missing required query param → 400 with a specific
  // message; bad-shaped value → 404 User not found (preserve old
  // Nuxt-side behaviour for non-numeric uid).
  if (q.uid === undefined || q.uid === null || q.uid === '') {
    const path = event.path || '/v3/users/shield'
    return sendPyError(event, 400, `Missing required query parameter 'uid' for path ${path}`)
  }
  const uid = Number(q.uid)
  if (!Number.isFinite(uid) || uid <= 0) {
    return sendPyError(event, 404, 'User not found')
  }

  const db = useDb()
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1)
  if (!user) {
 return sendPyError(event, 404, 'User not found')
}

  const minutes = Math.max(0, intOr(q.minutes, 0))
  const project = strOr(q.project)
  const language = strOr(q.language)
  const onlyHours = asBool(q.only_hours)

  const now = new Date()
  const cutoff = minutes > 0
    ? new Date(new Date(now).setSeconds(0, 0) - minutes * 60_000)
    : null

  // No project/language filter: count minutes directly from
  // workspace_minutes_v2 (no join needed). Matches Python's first branch.
  let resultMinutes = 0
  if (!project && !language) {
    const where = [
      eq(workspaceMinutesV2.uid, uid),
      lte(workspaceMinutesV2.recordedAt, sql`now()`),
    ]
    if (cutoff) {
 where.push(gte(workspaceMinutesV2.recordedAt, cutoff))
}
    const rows = await db
      .select({ value: count() })
      .from(workspaceMinutesV2)
      .where(and(...where))
    resultMinutes = Number(rows[0]?.value ?? 0)
  }
  else {
    const where = [
      eq(workspaceMinutesV2.uid, uid),
      lte(workspaceMinutesV2.recordedAt, sql`now()`),
    ]
    if (cutoff) {
 where.push(gte(workspaceMinutesV2.recordedAt, cutoff))
}
    if (project) {
 where.push(eq(workspaceMetaV2.workspaceName, project))
}
    if (language) {
 where.push(eq(workspaceMetaV2.language, language))
}
    const rows = await db
      .select({ value: count() })
      .from(workspaceMetaV2)
      .innerJoin(
        workspaceMinutesV2,
        eq(workspaceMinutesV2.metaXxh3_64, workspaceMetaV2.xxh3_64),
      )
      .where(and(...where))
    resultMinutes = Number(rows[0]?.value ?? 0)
  }

  let label = 'CodeTime'
  if (language) {
 label = LANGUAGE_IDENTIFIERS[language] ?? titleCase(language)
}
  if (project) {
 label += `@${project}`
}

  const message = onlyHours ? `${Math.floor(resultMinutes / 60)}h` : getShieldMessage(resultMinutes, minutes)

  // Python branches on which inputs are present:
  //   - no project/language: color = blue if the requested window
  //     `minutes` is > 0, else lightgrey (does NOT consider the count)
  //   - otherwise: color = blue if any minutes were found, then
  //     overridden by the language palette entry if applicable
  let color: string
  if (!project && !language) {
    color = minutes > 0 ? 'blue' : 'lightgrey'
  }
  else {
    color = resultMinutes > 0 ? 'blue' : 'lightgrey'
    if (language && LANGUAGE_COLORS[language]) color = LANGUAGE_COLORS[language]
  }

  return {
    schemaVersion: 1,
    logoSvg: LOGO_SVG,
    label,
    message,
    color,
  }
})
