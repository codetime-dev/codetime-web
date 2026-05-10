// NLWeb Schema Feeds — schemamap pointed to from robots.txt
import { defineEventHandler, setHeader } from 'h3'

const BODY = `<?xml version="1.0" encoding="UTF-8"?>
<schemamap xmlns="https://nlweb.org/schemas/schemamap/v1">
  <feed>
    <loc>https://codetime.dev/openapi.json</loc>
    <type>application/openapi+json</type>
    <description>OpenAPI 3.1 specification for the Code Time API.</description>
  </feed>
  <feed>
    <loc>https://codetime.dev/.well-known/llms.txt</loc>
    <type>text/plain</type>
    <description>Plain-text product description and agent-integration index.</description>
  </feed>
  <feed>
    <loc>https://codetime.dev/.well-known/mcp/manifest.json</loc>
    <type>application/json</type>
    <description>MCP server manifest.</description>
  </feed>
  <feed>
    <loc>https://codetime.dev/index.md</loc>
    <type>text/markdown</type>
    <description>Markdown alternate of the homepage.</description>
  </feed>
</schemamap>
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return BODY
})
