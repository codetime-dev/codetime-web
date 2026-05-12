import { defineEventHandler, setHeader } from 'h3'

// Standalone Scalar shell embedded as an <iframe> by app/pages/docs/api.vue.
// Lives outside Nuxt's Vue/UnoCSS pipeline so Scalar gets a pristine
// document and its own dark theme is not overridden by the host page's
// tokens.css / __uno.css.

const SPEC_URL = '/v3/docs/openapi.json'

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Code Time API Reference</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #1c1e21; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="${SPEC_URL}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return html
})
