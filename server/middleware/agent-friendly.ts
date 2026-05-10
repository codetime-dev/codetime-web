// Agent-friendly response middleware:
// 1. Adds RFC 8288 Link headers advertising sitemap, markdown alternate,
//    OpenAPI spec, and the API catalog on every response.
// 2. Adds `Vary: Accept` so caches don't conflate HTML / Markdown clients.
// 3. Implements text/markdown content negotiation on the homepage:
//    when an agent sends `Accept: text/markdown`, return /index.md inline.
// 4. Implements `?mode=agent` on the homepage: a structured JSON view
//    listing API endpoints, auth, and key capabilities.
import type { H3Event } from 'h3'
import { defineEventHandler, getQuery, getRequestHeader, setHeader } from 'h3'
import { INDEX_MD } from '../utils/index-md'

const SITE = 'https://codetime.dev'

const LINK_HEADER = [
  `<${SITE}/sitemap.xml>; rel="sitemap"`,
  `<${SITE}/index.md>; rel="alternate"; type="text/markdown"`,
  `<${SITE}/openapi.json>; rel="service-desc"; type="application/openapi+json"`,
  `<${SITE}/.well-known/api-catalog>; rel="api-catalog"`,
  `<${SITE}/.well-known/llms.txt>; rel="describedby"; type="text/plain"`,
  `<${SITE}/.well-known/mcp/manifest.json>; rel="https://modelcontextprotocol.io/rel/manifest"`,
].join(', ')

function isHomepagePath(path: string): boolean {
  // matches "/", "/en", "/en/", "/zh-CN", "/zh-CN/" etc.
  if (path === '/' || path === '') {
    return true
  }
  const stripped = path.replace(/\/$/, '')
  const parts = stripped.split('/').filter(Boolean)
  return parts.length === 1 && !parts[0]!.includes('.')
}

function wantsMarkdown(event: H3Event): boolean {
  const accept = getRequestHeader(event, 'accept') || ''
  // Treat text/markdown ahead of text/html as a markdown preference.
  return /text\/markdown/i.test(accept) && !/text\/html/i.test(accept.split(',')[0] || '')
}

function agentJsonView() {
  return {
    name: 'Code Time',
    description:
      'Privacy-respecting coding-time analytics for VS Code and JetBrains IDEs.',
    homepage: SITE,
    documentation: `${SITE}/.well-known/llms.txt`,
    markdown: `${SITE}/index.md`,
    api: {
      base_url: 'https://api.codetime.dev/v3',
      openapi: `${SITE}/openapi.json`,
      docs: 'https://api.codetime.dev/v3/docs',
      auth: {
        type: 'bearer',
        token_source: `${SITE}/en/user/profile`,
        oauth_metadata: `${SITE}/.well-known/oauth-protected-resource`,
        scopes: [
          'codetime:read',
          'codetime:write',
          'codetime:tags',
          'codetime:export',
        ],
      },
      example_endpoints: [
        { method: 'GET', path: '/v3/users/me', description: 'Current user' },
        { method: 'GET', path: '/v3/total-minutes', description: 'Global counter' },
        { method: 'GET', path: '/v3/aggregates/daily', description: 'Daily totals' },
        { method: 'GET', path: '/v3/workspaces', description: 'List workspaces' },
        { method: 'POST', path: '/v3/events', description: 'Upload editor events' },
      ],
      error_shape: {
        status_code: 'integer',
        detail: 'string',
        extra: 'object|null',
      },
    },
    mcp: {
      manifest: `${SITE}/.well-known/mcp/manifest.json`,
      server_card: `${SITE}/.well-known/mcp/server-card.json`,
      server_url: `${SITE}/mcp`,
      transport: 'streamable-http',
    },
    nlweb: {
      ask: `${SITE}/ask`,
      streaming: 'sse',
    },
    skills: `${SITE}/.well-known/agent-skills/index.json`,
    capabilities: [
      'query-total-coding-minutes',
      'query-daily-aggregates',
      'list-workspaces',
      'list-languages',
      'export-raw-events',
    ],
    install: {
      vscode: 'code --install-extension jannchie.codetime',
      jetbrains: 'Search "Code Time" in JetBrains plugin marketplace',
    },
    contact: 'support@codetime.dev',
  }
}

export default defineEventHandler(async (event) => {
  const path = event.path?.split('?')[0] || ''

  // 1. Always advertise discovery resources via Link header + Vary: Accept.
  setHeader(event, 'Link', LINK_HEADER)
  // Append "Accept" to Vary without clobbering any upstream value.
  const existingVary = (event.node.res.getHeader('vary') as string | undefined) || ''
  const varyParts = new Set(
    existingVary.split(',').map(s => s.trim()).filter(Boolean),
  )
  varyParts.add('Accept')
  setHeader(event, 'Vary', [...varyParts].join(', '))

  if (!isHomepagePath(path)) {
    return
  }

  // 2. ?mode=agent — structured JSON view.
  const q = getQuery(event)
  if (q.mode === 'agent') {
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return agentJsonView()
  }

  // 3. Markdown content negotiation.
  if (wantsMarkdown(event)) {
    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return INDEX_MD
  }
})
