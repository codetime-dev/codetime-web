export const INDEX_MD = `# Code Time — Programming Time Analytics & Insights

> Code Time is a privacy-respecting coding-time analytics platform.
> Track how long you spend in your editor, see per-language and
> per-workspace breakdowns, and own your raw data forever.

- Site: https://codetime.dev
- API: https://api.codetime.dev/v3
- OpenAPI: https://codetime.dev/openapi.json
- MCP manifest: https://codetime.dev/.well-known/mcp/manifest.json

## What it does

Code Time records per-minute coding activity reported by editor plugins
for **VS Code** and **JetBrains IDEs**. Activity is aggregated into
dashboards covering daily distribution, language breakdown, workspace
totals, and a calendar heatmap. Raw events can be exported at any time
through the JSON API.

## Why developers use it

- **Personal productivity** — see when, where, and in what language you
  spend your coding hours.
- **Project accounting** — attribute time to workspaces, repos, or
  tags for invoicing or reporting.
- **Habit tracking** — calendar heatmap and weekly trend charts make
  consistency visible.
- **Data ownership** — your events stay yours. Export to CSV/JSON
  whenever you want.

## How it compares

| Feature                          | Code Time | WakaTime | software.com |
|----------------------------------|-----------|----------|--------------|
| Free tier with full history      | Yes       | Limited  | Yes          |
| Per-minute partitioned aggregates| Yes       | Yes      | Partial      |
| Open OpenAPI spec                | Yes       | Yes      | No           |
| MCP server for AI agents         | Yes       | No       | No           |
| Raw event export                 | Yes       | Paid     | No           |
| Self-host friendly               | Roadmap   | No       | No           |

## Get started

1. Install the editor plugin
   - VS Code: \`code --install-extension jannchie.codetime\`
   - JetBrains: search "Code Time" in the plugin marketplace
2. Sign in at https://codetime.dev with GitHub or Google
3. Copy your upload token from https://codetime.dev/en/user/profile
4. Paste the token into the plugin's settings
5. Open https://codetime.dev/en/dashboard after one minute of editing

## API overview

The API is a REST/JSON service documented by an OpenAPI 3.1 spec.

- Base URL: \`https://api.codetime.dev/v3\`
- Auth: \`Authorization: Bearer <upload_token>\` or session cookie
- Spec: https://codetime.dev/openapi.json
- Interactive docs: https://api.codetime.dev/v3/docs

Common endpoints:

- \`GET /v3/users/me\` — current user
- \`GET /v3/total-minutes\` — global counter
- \`GET /v3/aggregates/daily?start=...&end=...\` — daily totals
- \`GET /v3/workspaces\` — workspaces ordered by recent activity
- \`POST /v3/events\` — upload editor events (used by IDE plugins)

Errors are JSON: \`{ "status_code": int, "detail": str, "extra": object|null }\`.

## For AI agents

- llms.txt: https://codetime.dev/.well-known/llms.txt
- MCP server: https://codetime.dev/mcp
- NLWeb /ask: \`POST https://codetime.dev/ask\` with \`{"query":"…"}\`
- Agent skills: https://codetime.dev/.well-known/agent-skills/index.json
- OpenAI plugin manifest: https://codetime.dev/.well-known/ai-plugin.json

## Pricing

Free tier supports unlimited personal use. Paid tiers add team
features and longer history retention. See https://codetime.dev/#pricing.

## Contact

- Email: support@codetime.dev
- Source: https://github.com/jannchie

## License & legal

- Privacy: https://codetime.dev/en/privacy
- Terms: https://codetime.dev/en/terms
`
