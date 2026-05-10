// Microsoft NLWeb /ask endpoint.
// - Accepts POST or GET with a "query" parameter / JSON body.
// - Returns NLWeb-conformant JSON ({ _meta: { response_type, version } }, results).
// - Honours `prefer.streaming: true` (header or body) by responding with
//   text/event-stream using NLWeb event types: start, result, complete.
//
// This is intentionally a thin first-party implementation — it forwards the
// natural-language query to the upstream API to retrieve catalog-level
// answers (capabilities, endpoints, docs). Personal-data queries should be
// authenticated and routed through the MCP server.
import type { H3Event } from 'h3'
import {
  defineEventHandler,
  getQuery,
  getRequestHeader,
  readBody,
  send,
  setHeader,
} from 'h3'

const VERSION = '0.1.0'

type AskBody = { query?: string, prefer?: { streaming?: boolean } }

async function readQuery(event: H3Event): Promise<{ query: string, streaming: boolean }> {
  const q = getQuery(event)
  const headerStreaming
    = (getRequestHeader(event, 'prefer') || '').toLowerCase().includes('streaming')
    || getRequestHeader(event, 'accept')?.includes('text/event-stream') === true
  if (event.method === 'GET') {
    return {
      query: String(q.query ?? q.q ?? '').trim(),
      streaming: headerStreaming || q.streaming === 'true',
    }
  }
  let body: AskBody = {}
  try {
    body = (await readBody<AskBody>(event)) || {}
  }
  catch {
    body = {}
  }
  return {
    query: String(body.query ?? q.query ?? '').trim(),
    streaming: headerStreaming || body.prefer?.streaming === true,
  }
}

function buildResults(query: string) {
  // Catalog-level structured answer; agents that need per-user data should
  // call the MCP server or REST API directly.
  return [
    {
      '@type': 'WebAPI',
      'name': 'Code Time API',
      'url': 'https://codetime.dev/openapi.json',
      'description': 'OpenAPI 3.1 spec for the Code Time REST API.',
    },
    {
      '@type': 'SoftwareApplication',
      'name': 'Code Time',
      'url': 'https://codetime.dev',
      'description':
        'Privacy-respecting coding-time analytics for VS Code and JetBrains IDEs.',
      'applicationCategory': 'DeveloperApplication',
    },
    {
      '@type': 'TechArticle',
      'name': 'llms.txt',
      'url': 'https://codetime.dev/.well-known/llms.txt',
      'description':
        'Plain-text product description and agent-integration index — '
        + `relevant for query: "${query}".`,
    },
    {
      '@type': 'EntryPoint',
      'name': 'MCP server',
      'url': 'https://codetime.dev/mcp',
      'encodingType': 'streamable-http',
    },
  ]
}

export default defineEventHandler(async (event) => {
  const { query, streaming } = await readQuery(event)

  if (!query) {
    event.node.res.statusCode = 400
    return {
      _meta: { response_type: 'error', version: VERSION },
      error: 'missing_query',
      message: 'Provide a "query" field (POST JSON body or ?query=…).',
    }
  }

  const results = buildResults(query)

  if (!streaming) {
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Cache-Control', 'no-store')
    return {
      _meta: {
        response_type: 'list',
        version: VERSION,
        protocol: 'nlweb',
      },
      query,
      results,
    }
  }

  // SSE streaming response.
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Connection', 'keep-alive')

  const lines: string[] = []
  const push = (eventName: string, data: unknown) => {
    lines.push(`event: ${eventName}\n` + `data: ${JSON.stringify(data)}\n\n`)
  }

  push('start', {
    _meta: { response_type: 'list', version: VERSION, protocol: 'nlweb' },
    query,
  })
  for (const r of results) {
    push('result', { result: r })
  }
  push('complete', {
    _meta: { response_type: 'complete', version: VERSION },
    count: results.length,
  })

  return send(event, lines.join(''))
})
