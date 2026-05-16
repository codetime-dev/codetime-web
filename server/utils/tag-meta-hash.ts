import type { WorkspaceData } from './tag-rules'
import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { workspaceMetaV2 } from '../db/schema'
import { TTLCache } from './cache'
import { useDb } from './db'
import { evaluateRule } from './tag-rules'

// Process-local cache of meta xxh3_64 hashes that satisfy a tag rule.
// Tag rules depend only on meta fields, so callers evaluate once per
// distinct meta (small) and let SQL aggregate the minute rows.
// Key: `${uid}|${ruleFingerprint}|${project}|${language}` — window is
// applied by the caller, not baked into the cache.
const META_HASH_CACHE = new TTLCache<string, number[]>(4096, 60)
const INFLIGHT = new Map<string, Promise<number[]>>()

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(',')}}`
}

export function fingerprintRule(rule: unknown): string {
  return createHash('blake2b512').update(stableStringify(rule)).digest('hex').slice(0, 32)
}

export function invalidateMetaHashCacheForUser(uid: number): void {
  const prefix = `${uid}|`
  META_HASH_CACHE.invalidateWhere(k => k.startsWith(prefix))
}

// Batch variant: evaluates many rules against a single meta scan. Used
// by /v3/tags/stats where every rule shares the same (uid, no
// project/language) scope, so the meta read can be amortised across
// tags. Per-rule results are still memoised under the same key shape
// as findMetaHashesMatchingRules so single-rule callers see the hits.
export async function findMetaHashesForRulesBatch(
  uid: number,
  rules: Array<{ key: string, rulesJson: unknown }>,
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>()
  const misses: Array<{ key: string, rulesJson: unknown, cacheKey: string }> = []
  for (const r of rules) {
    const cacheKey = `${uid}|${fingerprintRule(r.rulesJson)}||`
    const cached = META_HASH_CACHE.get(cacheKey)
    if (cached !== undefined) {
      result.set(r.key, cached)
      continue
    }
    misses.push({ key: r.key, rulesJson: r.rulesJson, cacheKey })
  }
  if (misses.length === 0) {
    return result
  }
  const db = useDb()
  const rows = await db
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
    .where(eq(workspaceMetaV2.uid, uid))
  for (const miss of misses) {
    const hashes: number[] = []
    for (const r of rows) {
      if (evaluateRule(miss.rulesJson, r as WorkspaceData)) {
        hashes.push(r.xxh3_64)
      }
    }
    META_HASH_CACHE.set(miss.cacheKey, hashes)
    result.set(miss.key, hashes)
  }
  return result
}

export async function findMetaHashesMatchingRules(
  uid: number,
  rulesJson: unknown,
  opts: { project?: string | null, language?: string | null } = {},
): Promise<number[]> {
  const project = opts.project ?? null
  const language = opts.language ?? null
  const cacheKey = `${uid}|${fingerprintRule(rulesJson)}|${project ?? ''}|${language ?? ''}`
  const cached = META_HASH_CACHE.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }
  // Coalesce concurrent first-misses so N parallel stats requests don't
  // each scan the meta table.
  const inflight = INFLIGHT.get(cacheKey)
  if (inflight) {
    return inflight
  }
  const promise = (async () => {
    const db = useDb()
    const where = [eq(workspaceMetaV2.uid, uid)]
    if (project) {
      where.push(eq(workspaceMetaV2.workspaceName, project))
    }
    if (language) {
      where.push(eq(workspaceMetaV2.language, language))
    }
    const rows = await db
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
      .where(and(...where))
    const hashes: number[] = []
    for (const r of rows) {
      if (evaluateRule(rulesJson, r as WorkspaceData)) {
        hashes.push(r.xxh3_64)
      }
    }
    META_HASH_CACHE.set(cacheKey, hashes)
    return hashes
  })()
  INFLIGHT.set(cacheKey, promise)
  try {
    return await promise
  }
  finally {
    INFLIGHT.delete(cacheKey)
  }
}
