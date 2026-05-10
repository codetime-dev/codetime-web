// /.well-known/mcp — short discovery doc pointing to the manifest.
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return {
    name: 'codetime',
    server: 'https://codetime.dev/mcp',
    transport: 'streamable-http',
    manifest: 'https://codetime.dev/.well-known/mcp/manifest.json',
    serverCard: 'https://codetime.dev/.well-known/mcp/server-card.json',
    documentation: 'https://codetime.dev/.well-known/llms.txt',
  }
})
