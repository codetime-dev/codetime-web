import { createHash } from 'node:crypto'

export const SKILL_MD = `---
name: codetime
description: Query a developer's coding-time analytics from Code Time
license: MIT
homepage: https://codetime.dev
---

# Code Time skill

Use this skill to ask Code Time about a developer's editor activity:
total minutes, per-language breakdown, per-workspace aggregates, and
calendar heatmaps.

## Auth
Bearer token from https://codetime.dev/en/user/profile.

## Calling the API
- Base URL: https://api.codetime.dev/v3
- OpenAPI spec: https://api.codetime.dev/v3/docs/openapi.json
- Common entry points:
  - GET /v3/users/me
  - GET /v3/total-minutes
  - GET /v3/aggregates/daily

## NLWeb
For natural-language queries: POST https://codetime.dev/ask
{ "query": "how many minutes did I code last week?" }
`

export function sha256(s: string): string {
  return `sha256:${createHash('sha256').update(s).digest('hex')}`
}
