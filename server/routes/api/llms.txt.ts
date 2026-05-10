import { defineEventHandler, setHeader } from 'h3'

const BODY = `# Code Time — API context

> Scoped llms.txt for the Code Time HTTP API surface. Use this when an
> agent needs to call the API directly without loading the full product
> manual.

Base URL: https://api.codetime.dev/v3
OpenAPI 3.1 spec: https://api.codetime.dev/v3/docs/openapi.json
Mirror on web origin: https://codetime.dev/openapi.json
Interactive docs (Scalar): https://api.codetime.dev/v3/docs

## Authentication
- Bearer token (preferred for agents): Authorization: Bearer <upload_token>
- Session cookie (for browsers logged in via OAuth)
- Tokens are issued from https://codetime.dev/en/user/profile
- OAuth metadata: https://codetime.dev/.well-known/oauth-protected-resource

## Common endpoints
- GET /v3 — root health/identity
- GET /v3/total-minutes — global aggregate counter
- GET /v3/users/me — current user
- GET /v3/workspaces — list workspaces for current user
- GET /v3/aggregates/* — pre-computed time aggregates
- POST /v3/events — upload editor events (used by IDE plugins)

## Errors
All error responses are JSON with: { "status_code": int, "detail": str, "extra": object|null }.

## Rate limits
Soft per-token limit; agents that hit 429 should respect Retry-After.
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
