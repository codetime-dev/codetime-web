import type { WorkspaceData } from '../../../utils/tag-rules'
import { createHash } from 'node:crypto'
import { and, count, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import languageColors from '../../../assets/LanguageColor.json'
import languageIdentifiers from '../../../assets/LanguageIdentifiers.json'
import { tags, users, workspaceMetaV2, workspaceMinutesV2 } from '../../../db/schema'
import { TTLCache } from '../../../utils/cache'
import { useDb } from '../../../utils/db'
import { getShieldMessage } from '../../../utils/duration'
import { sendPyError } from '../../../utils/py-error'
import { evaluateRule } from '../../../utils/tag-rules'

// Process-wide cache of matching meta xxh3_64 hashes per
// (uid, rule fingerprint, project, language). Tag rule evaluation is
// the only meaningful CPU cost on the badge hot path; with this cache
// repeat hits skip the meta scan + per-meta predicate entirely and run
// just one COUNT(*) by hash. See utils/cache.ts for semantics.
const META_HASH_CACHE = new TTLCache<string, number[]>(4096, 60)

function fingerprintRule(rule: unknown): string {
  return createHash('blake2b512').update(JSON.stringify(rule)).digest('hex').slice(0, 32)
}

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
      { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Tag name (per-user unique). Rules evaluated in-memory.' },
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
  // Public badge endpoint — hit on every README view that embeds the
  // shield. 60-second freshness is good enough for minute-resolution
  // data and lets shields.io / GitHub camo absorb the bulk of the load.
  setHeader(event, 'Cache-Control', 'public, max-age=60')

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
  const tagName = strOr(q.tag)
  const onlyHours = asBool(q.only_hours)

  const now = new Date()
  const cutoff = minutes > 0
    ? new Date(new Date(now).setSeconds(0, 0) - minutes * 60_000)
    : null

  // Resolve tag (per-user unique by name). When the user passes ?tag=... we
  // load its rules_json and evaluate per-row in memory, mirroring Python's
  // services/tags.py.
  let tagRow: typeof tags.$inferSelect | null = null
  if (tagName) {
    const found = await db
      .select()
      .from(tags)
      .where(and(eq(tags.uid, uid), eq(tags.name, tagName)))
      .limit(1)
    tagRow = found[0] ?? null
  }

  let resultMinutes = 0
  if (!tagName && !project && !language) {
    // Fast path: no filter, count from workspace_minutes_v2 directly.
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
  else if (tagName) {
    // Tag path: evaluate the rule once per *meta* (small set per user)
    // to collect matching xxh3_64 hashes, then let SQL count the minutes
    // by hash. project/language are pushed into the meta scan so we eval
    // even fewer rows.
    if (!tagRow || !tagRow.rulesJson) {
      resultMinutes = 0
    }
    else {
      // Window is deliberately NOT part of the cache key — the meta scan
      // is window-independent and the subsequent COUNT(*) re-applies the
      // window, so the cache works for any badge URL on this tag.
      const cacheKey = `${uid}|${fingerprintRule(tagRow.rulesJson)}|${project ?? ''}|${language ?? ''}`
      let matchedHashes = META_HASH_CACHE.get(cacheKey)
      if (matchedHashes === undefined) {
        const metaWhere = [eq(workspaceMetaV2.uid, uid)]
        if (project) {
          metaWhere.push(eq(workspaceMetaV2.workspaceName, project))
        }
        if (language) {
          metaWhere.push(eq(workspaceMetaV2.language, language))
        }
        const metaRows = await db
          .select({
            xxh3_64: workspaceMetaV2.xxh3_64,
            workspace_name: workspaceMetaV2.workspaceName,
            language: workspaceMetaV2.language,
            git_origin: workspaceMetaV2.gitOrigin,
            git_branch: workspaceMetaV2.gitBranch,
            platform: workspaceMetaV2.platform,
            editor: workspaceMetaV2.editor,
            absolute_file: workspaceMetaV2.absoluteFile,
            relative_file: workspaceMetaV2.relativeFile,
          })
          .from(workspaceMetaV2)
          .where(and(...metaWhere))

        const rules = tagRow.rulesJson
        const hashes: number[] = []
        for (const r of metaRows) {
          if (evaluateRule(rules, r as WorkspaceData)) {
            hashes.push(r.xxh3_64)
          }
        }
        matchedHashes = hashes
        META_HASH_CACHE.set(cacheKey, matchedHashes)
      }
      if (matchedHashes.length === 0) {
        resultMinutes = 0
      }
      else {
        const countWhere = [
          eq(workspaceMinutesV2.uid, uid),
          lte(workspaceMinutesV2.recordedAt, sql`now()`),
          inArray(workspaceMinutesV2.metaXxh3_64, matchedHashes),
        ]
        if (cutoff) {
          countWhere.push(gte(workspaceMinutesV2.recordedAt, cutoff))
        }
        const countRows = await db
          .select({ value: count() })
          .from(workspaceMinutesV2)
          .where(and(...countWhere))
        resultMinutes = Number(countRows[0]?.value ?? 0)
      }
    }
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

  let label: string
  if (tagRow) {
    label = tagRow.emoji ? `${tagRow.emoji} ${tagRow.name}` : tagRow.name
  }
  else if (tagName) {
    // Tag requested but unknown: keep the user's input so the label still
    // makes sense to the badge viewer.
    label = tagName
  }
  else if (language) {
    label = LANGUAGE_IDENTIFIERS[language] ?? titleCase(language)
  }
  else {
    label = 'CodeTime'
  }
  if (project) {
    label += `@${project}`
  }

  const message = onlyHours ? `${Math.floor(resultMinutes / 60)}h` : getShieldMessage(resultMinutes, minutes)

  // Color resolution:
  //   - tag set: use the tag's own color (always; tag identity dominates).
  //   - no project/language/tag: blue only if a time window was requested.
  //   - otherwise: blue when minutes > 0, with the language palette taking
  //     precedence if a language filter was applied.
  let color: string
  if (tagRow && tagRow.color) {
    color = tagRow.color
  }
  else if (!project && !language && !tagName) {
    color = minutes > 0 ? 'blue' : 'lightgrey'
  }
  else {
    color = resultMinutes > 0 ? 'blue' : 'lightgrey'
    if (!tagName && language && LANGUAGE_COLORS[language]) {
      color = LANGUAGE_COLORS[language]
    }
  }

  return {
    schemaVersion: 1,
    logoSvg: LOGO_SVG,
    label,
    message,
    color,
  }
})
