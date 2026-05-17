import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  // Source: local Nuxt dev server. The curated /v3/docs/openapi.json is
  // built from each route's defineRouteMeta. Operation names are
  // auto-derived by openapi-ts when operationId is absent — keep route
  // paths stable to keep SDK call sites stable.
  input: 'http://localhost:3002/v3/docs/openapi.json',
  output: {
    path: 'app/api/v3',
  },
  plugins: [
    '@hey-api/schemas',
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
  ],
})
