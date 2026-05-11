// Agent-friendly response middleware:
// 1. Adds RFC 8288 Link headers advertising sitemap, markdown alternate,
//    OpenAPI spec, and the API catalog on every response.
// 2. Adds `Vary: Accept` and `Vary: User-Agent` so caches don't conflate
//    HTML / Markdown clients or human / agent clients.
// 3. Implements text/markdown content negotiation on the homepage —
//    triggered by either `Accept: text/markdown` or a known AI agent UA.
// 4. Implements `?mode=agent` on the homepage: a structured JSON view
//    listing API endpoints, auth, and key capabilities.
// 5. Implements the `{url}.md` markdown-mirror convention by stripping
//    a trailing `.md` from locale-homepage paths (e.g. `/en.md`) and
//    returning the markdown body inline.
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

// Substrings (case-insensitive) found in User-Agent headers from AI clients
// fetching pages for retrieval / citation. Hitting any of these flips the
// response to markdown so agents don't waste tokens on HTML/JS scaffolding.
const AGENT_UA_TOKENS = [
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'claudebot',
  'claude-user',
  'claude-searchbot',
  'anthropic-ai',
  'perplexitybot',
  'perplexity-user',
  'ccbot',
  'google-extended',
  'googleother',
  'applebot-extended',
  'duckassistbot',
  'cohere-ai',
  'bytespider',
  'amazonbot',
  'meta-externalagent',
  'facebookbot',
  'deepseekbot',
  'ora-agent',
]

function isHomepagePath(path: string): boolean {
  // matches "/", "/en", "/en/", "/zh-CN", "/zh-CN/" etc.
  if (path === '/' || path === '') {
    return true
  }
  const stripped = path.replace(/\/$/, '')
  const parts = stripped.split('/').filter(Boolean)
  return parts.length === 1 && !parts[0]!.includes('.')
}

// Strip a trailing `.md` from locale-homepage style paths so `{url}.md`
// works as a markdown mirror without a custom Accept header. Returns the
// underlying path if it should be served as markdown, or null otherwise.
function stripMdSuffix(path: string): string | null {
  if (!path.endsWith('.md')) {
    return null
  }
  const base = path.slice(0, -3)
  // Allow `/index.md` (already handled by a dedicated route) and locale
  // homepages like `/en.md`, `/zh-CN.md`. Reject deep paths for now since
  // we don't have per-page markdown bodies for them.
  if (base === '' || base === '/') {
    return '/'
  }
  if (isHomepagePath(base)) {
    return base
  }
  return null
}

function wantsMarkdown(event: H3Event): boolean {
  const accept = getRequestHeader(event, 'accept') || ''
  // Treat text/markdown ahead of text/html as a markdown preference.
  return /text\/markdown/i.test(accept) && !/text\/html/i.test(accept.split(',')[0] || '')
}

function isAgentUA(event: H3Event): boolean {
  const ua = (getRequestHeader(event, 'user-agent') || '').toLowerCase()
  if (!ua) {
    return false
  }
  return AGENT_UA_TOKENS.some(t => ua.includes(t))
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
  const rawPath = event.path?.split('?')[0] || ''

  // 1. Always advertise discovery resources via Link header + Vary headers.
  setHeader(event, 'Link', LINK_HEADER)
  const existingVary = (event.node.res.getHeader('vary') as string | undefined) || ''
  const varyParts = new Set(
    existingVary.split(',').map(s => s.trim()).filter(Boolean),
  )
  varyParts.add('Accept')
  varyParts.add('User-Agent')
  setHeader(event, 'Vary', [...varyParts].join(', '))

  // 2. {url}.md — markdown mirror via path suffix. Works without any
  //    custom headers, so a user can paste the URL into a chat.
  const mdMirror = stripMdSuffix(rawPath)
  if (mdMirror) {
    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return INDEX_MD
  }

  if (!isHomepagePath(rawPath)) {
    return
  }

  // 3. ?mode=agent — structured JSON view.
  const q = getQuery(event)
  if (q.mode === 'agent') {
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return agentJsonView()
  }

  // 4. Markdown content negotiation by Accept header or agent UA.
  if (wantsMarkdown(event) || isAgentUA(event)) {
    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return INDEX_MD
  }
})
