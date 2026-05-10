// RFC 9727 API Catalog — Linkset+JSON describing the Code Time API.
import { defineEventHandler, setHeader } from 'h3'

const CATALOG = {
  linkset: [
    {
      'anchor': 'https://api.codetime.dev/v3',
      'service-desc': [
        {
          href: 'https://api.codetime.dev/v3/docs/openapi.json',
          type: 'application/openapi+json;version=3.1',
        },
        {
          href: 'https://codetime.dev/openapi.json',
          type: 'application/openapi+json;version=3.1',
        },
      ],
      'service-doc': [
        {
          href: 'https://api.codetime.dev/v3/docs',
          type: 'text/html',
        },
        {
          href: 'https://codetime.dev/.well-known/llms.txt',
          type: 'text/plain',
        },
      ],
      'service-meta': [
        {
          href: 'https://codetime.dev/.well-known/oauth-protected-resource',
          type: 'application/json',
        },
      ],
    },
  ],
}

export default defineEventHandler((event) => {
  setHeader(
    event,
    'Content-Type',
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  )
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return CATALOG
})
