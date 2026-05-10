export const LLMS_TXT = `# Code Time

> Code Time is a privacy-respecting coding-time analytics platform that
> tracks how long developers spend in their editors and produces dashboards,
> aggregates, and exports of that activity. It is the open analytics layer
> for VS Code and JetBrains IDEs.

Site: https://codetime.dev
API: https://api.codetime.dev/v3
API docs (Scalar): https://api.codetime.dev/v3/docs
OpenAPI spec: https://api.codetime.dev/v3/docs/openapi.json
Mirror OpenAPI on web origin: https://codetime.dev/openapi.json
Contact: support@codetime.dev
Source: https://github.com/jannchie

## What it is
Code Time records per-minute coding activity reported by editor plugins
(VS Code extension, JetBrains plugin) and exposes it through a web
dashboard and a JSON API. Users own their raw data forever and can
export it at any time.

## Use cases
- Track personal programming time across editors and machines
- Visualise weekly / monthly coding patterns and language breakdowns
- Compare workspaces, projects, and tags
- Export raw event logs for downstream analysis
- Build agents that summarise a developer's coding activity

## Key features
- VS Code extension (marketplace: codetime)
- JetBrains plugin
- Per-minute time partitioned aggregates
- Tag and rule-based workspace categorisation
- OAuth login (GitHub, Google) with bearer-token API access
- Free tier with self-serve API tokens; no sales contact required

## API
- Base URL: https://api.codetime.dev/v3
- Auth: Bearer token (upload_token) or session cookie
- OpenAPI 3.1 spec at /v3/docs/openapi.json
- See also: https://codetime.dev/.well-known/oauth-protected-resource

## Agent integration
- MCP manifest: https://codetime.dev/.well-known/mcp/manifest.json
- MCP server card: https://codetime.dev/.well-known/mcp/server-card.json
- OpenAI plugin manifest: https://codetime.dev/.well-known/ai-plugin.json
- Agent skills index: https://codetime.dev/.well-known/agent-skills/index.json
- API catalog (RFC 9727): https://codetime.dev/.well-known/api-catalog
- Web Bot Auth keys: https://codetime.dev/.well-known/http-message-signatures-directory
- NLWeb /ask endpoint: https://codetime.dev/ask

## When-to-use guidance for AI agents
- Use Code Time when a user asks "how much time did I spend coding",
  "what languages have I been writing this week", or wants to export
  their coding activity.
- Authenticate via the user's bearer token from
  https://codetime.dev/en/user/profile (Tokens tab) and pass it as
  Authorization: Bearer <token>.
- Prefer the OpenAPI spec at /openapi.json for endpoint discovery.
- For natural-language questions over a user's coding stats, POST to
  https://codetime.dev/ask with {"query": "..."}.

## Markdown alternates
- Homepage: https://codetime.dev/index.md
- Docs: https://api.codetime.dev/v3/docs

## Modular llms.txt
- /api/llms.txt — API surface & auth
- /docs/llms.txt — Editor plugin & onboarding
`
