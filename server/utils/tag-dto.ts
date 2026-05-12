import type { tags } from '../db/schema'

// Mirrors codetime-server-v3 dto.py::TagResponse. Python coerces a
// stored string `"null"`/`""` rules_json into null on the wire — replicate
// that so behaviour stays identical. Wire keys are camelCase to match
// pydantic's `alias_generator=to_camel`.

export type TagResponse = {
  id: string
  name: string
  color: string
  emoji: string | null
  createdAt: string
  updatedAt: string
  rules: unknown | null
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
    rules: rules ?? null,
  }
}
