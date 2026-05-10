// MCP server-card preview document.
import { defineEventHandler, setHeader } from 'h3'

const CARD = {
  name: 'codetime',
  description: 'Query a developer\'s coding-time analytics: total minutes, '
    + 'daily distribution, languages, workspaces.',
  version: '1.0.0',
  serverUrl: 'https://codetime.dev/mcp',
  transport: 'streamable-http',
  auth: {
    type: 'oauth2',
    metadataUrl: 'https://codetime.dev/.well-known/oauth-protected-resource',
  },
  publisher: {
    name: 'Code Time',
    url: 'https://codetime.dev',
  },
  tools: [
    {
      name: 'get_total_minutes',
      description: 'Return the total minutes the authenticated user has '
        + 'been coding, optionally bounded by a time range.',
      inputSchema: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
        },
      },
    },
    {
      name: 'get_daily_aggregates',
      description: 'Return per-day minute aggregates for the authenticated user.',
      inputSchema: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date' },
          end: { type: 'string', format: 'date' },
          tz: { type: 'string', description: 'IANA timezone, e.g. UTC' },
        },
        required: ['start', 'end'],
      },
    },
    {
      name: 'list_workspaces',
      description: 'List the authenticated user\'s workspaces ordered by '
        + 'recent activity.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_languages',
      description: 'List the languages the authenticated user has spent the '
        + 'most time in over the past N days.',
      inputSchema: {
        type: 'object',
        properties: { days: { type: 'integer', minimum: 1, maximum: 365 } },
      },
    },
  ],
  documentation: 'https://codetime.dev/.well-known/llms.txt',
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return CARD
})
