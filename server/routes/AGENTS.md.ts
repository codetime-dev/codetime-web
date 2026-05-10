// Public AGENTS.md served on the production origin so AI coding agents
// (Cursor, Claude Code, etc.) can discover how to work with this product.
import { defineEventHandler, setHeader } from 'h3'

const BODY = `# AGENTS.md — Code Time

This file tells AI agents how to interact with the Code Time product.

## What this product is

Code Time is a coding-time analytics platform. Users install an editor
plugin (VS Code or JetBrains), sign in with GitHub or Google, and view
dashboards of their coding activity at https://codetime.dev.

## When to use Code Time from an agent

Use Code Time when the user asks about:

- "How long did I code last week / today / this month?"
- "What languages have I been writing in?"
- "Which workspace took the most of my time?"
- "Export my coding history."

## How to authenticate

The user obtains a bearer token from
https://codetime.dev/en/user/profile (Tokens tab) and pastes it
into the agent. The agent then sends:

\`\`\`
Authorization: Bearer <upload_token>
\`\`\`

The same token works on both the REST API and the MCP server.

## Preferred surfaces, in order

1. **MCP server** — \`https://codetime.dev/mcp\` (streamable HTTP).
   Manifest: https://codetime.dev/.well-known/mcp/manifest.json
2. **NLWeb /ask** — \`POST https://codetime.dev/ask\` with
   \`{"query":"…"}\`. Supports SSE streaming via
   \`prefer.streaming: true\`.
3. **REST API** — base \`https://api.codetime.dev/v3\`,
   spec at https://codetime.dev/openapi.json.

## Error handling

All API errors are JSON shaped as:

\`\`\`json
{ "status_code": 401, "detail": "Unauthorized", "extra": null }
\`\`\`

Retry 429s respecting \`Retry-After\`. Treat 5xx as transient.

## Docs the agent should fetch

- https://codetime.dev/.well-known/llms.txt
- https://codetime.dev/index.md
- https://codetime.dev/openapi.json

## Do not

- Do not scrape user dashboards via the HTML site — use the API.
- Do not upload events on behalf of a user; that's the editor plugin's job.
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
