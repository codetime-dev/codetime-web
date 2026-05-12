import type { tags } from '../db/schema'

// Mirrors codetime-server-v3 dto.py::TagResponse. Python coerces a
// stored string `"null"`/`""` rules_json into null on the wire — replicate
// that so behaviour stays identical.

export type TagResponse = {
  id: string
  name: string
  color: string
  emoji: string | null
  created_at: string
  updated_at: string
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
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    rules: rules ?? null,
  }
}
