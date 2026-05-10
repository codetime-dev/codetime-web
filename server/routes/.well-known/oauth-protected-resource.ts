// RFC 9728 OAuth Protected Resource metadata.
import { defineEventHandler, setHeader } from 'h3'

const META = {
  resource: 'https://api.codetime.dev/v3',
  authorization_servers: [
    'https://github.com/login/oauth',
    'https://accounts.google.com',
  ],
  scopes_supported: [
    'codetime:read',
    'codetime:write',
    'codetime:tags',
    'codetime:export',
  ],
  bearer_methods_supported: ['header'],
  resource_documentation: 'https://codetime.dev/.well-known/llms.txt',
  resource_signing_alg_values_supported: ['RS256'],
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return META
})
