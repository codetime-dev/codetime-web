import type { tags } from '../db/schema'

// Mirrors codetime-server-v3 dto.py::TagResponse. Python coerces a
// stored string `"null"`/`""` rules_json into null on the wire — replicate
// that so behaviour stays identical. Wire keys are camelCase to match
// pydantic's `alias_generator=to_camel`, including keys inside the nested
// `rules` JSON (Python's RuleCondition/RuleGroup models also alias).

export type TagResponse = {
  id: string
  name: string
  color: string
  emoji: string | null
  createdAt: string
  updatedAt: string
  rules: unknown | null
}

function snakeToCamelKey(k: string): string {
  return k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

// Deep-camelCase only the *keys* of a plain object/array tree. Pydantic
// emits `conditionType` for RuleCondition; the column stores legacy
// `condition_type`. Strings/numbers/booleans pass through unchanged.
export function camelizeKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(v => camelizeKeys(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeToCamelKey(k)] = camelizeKeys(v)
    }
    return out as unknown as T
  }
  return value
}

export function toTagResponse(row: typeof tags.$inferSelect): TagResponse {
  let rules: unknown | null = row.rulesJson
  if (typeof rules === 'string' && (rules === 'null' || rules === '')) {
    rules = null
  }
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    rules: rules == null ? null : camelizeKeys(rules),
  }
}
