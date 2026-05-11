// llmstxt.org-compliant llms.txt — H1 title, blockquote summary, then
// sections of [name](url) markdown links so parsers can extract a graph
// of canonical resources instead of free-form prose URLs.
export const LLMS_TXT = `# Code Time

> Code Time is a privacy-respecting coding-time analytics platform for
> developers using VS Code and JetBrains IDEs. It records per-minute
> editor activity, produces dashboards (daily distribution, language
> breakdown, workspace totals, calendar heatmap), and lets users export
> raw events forever through a JSON API. The free tier supports
> unlimited personal use with full history retention.

## Docs

- [Homepage (markdown)](https://codetime.dev/index.md)
- [Homepage (HTML)](https://codetime.dev/)
- [llms.txt](https://codetime.dev/.well-known/llms.txt)
- [Interactive API docs](https://api.codetime.dev/v3/docs)
- [AGENTS.md](https://codetime.dev/AGENTS.md)

## API

- [OpenAPI 3.1 spec](https://codetime.dev/openapi.json)
- [API base URL](https://api.codetime.dev/v3)
- [OAuth protected resource metadata](https://codetime.dev/.well-known/oauth-protected-resource)
- [User profile / token issuance](https://codetime.dev/en/user/profile)
- [API catalog (RFC 9727)](https://codetime.dev/.well-known/api-catalog)

## Agent integration

- [MCP manifest](https://codetime.dev/.well-known/mcp/manifest.json)
- [MCP server card](https://codetime.dev/.well-known/mcp/server-card.json)
- [MCP server endpoint](https://codetime.dev/mcp)
- [OpenAI plugin manifest](https://codetime.dev/.well-known/ai-plugin.json)
- [Agent skills index](https://codetime.dev/.well-known/agent-skills/index.json)
- [Web Bot Auth keys](https://codetime.dev/.well-known/http-message-signatures-directory)
- [NLWeb /ask endpoint](https://codetime.dev/ask)

## Discovery

- [Sitemap](https://codetime.dev/sitemap.xml)
- [Schema map (NLWeb)](https://codetime.dev/schema-map.xml)
- [robots.txt](https://codetime.dev/robots.txt)

## Optional

- [VS Code extension](https://marketplace.visualstudio.com/items?itemName=jannchie.codetime)
- [JetBrains plugin](https://plugins.jetbrains.com/plugin/codetime)
- [Source / author](https://github.com/jannchie)
- [Support email](mailto:support@codetime.dev)
`
