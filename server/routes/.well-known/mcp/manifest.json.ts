// MCP discovery manifest. Streamable-HTTP transport endpoint.
import { defineEventHandler, setHeader } from 'h3'

const MANIFEST = {
  schema_version: 'v1',
  name: 'codetime',
  display_name: 'Code Time',
  description: 'Query a developer\'s coding-time analytics from Code Time.',
  publisher: {
    name: 'Code Time',
    url: 'https://codetime.dev',
  },
  servers: [
    {
      type: 'streamable-http',
      url: 'https://codetime.dev/mcp',
      transport: 'streamable-http',
      auth: {
        type: 'oauth2',
        metadata_url: 'https://codetime.dev/.well-known/oauth-protected-resource',
      },
    },
  ],
  contact: 'support@codetime.dev',
  documentation: 'https://codetime.dev/.well-known/llms.txt',
  tools_summary: [
    'get_total_minutes',
    'get_daily_aggregates',
    'list_workspaces',
    'list_languages',
  ],
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return MANIFEST
})
