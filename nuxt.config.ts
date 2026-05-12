// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

export default defineNuxtConfig({
  // Inline critical CSS into the SSR HTML so the first paint does not block on
  // an external stylesheet. Major FCP/LCP win on the landing page.
  features: {
    inlineStyles: true,
  },
  runtimeConfig: {
    public: {
      apiHost: 'https://api.codetime.dev',
      // Origin serving Nuxt-backed routes listed in shared/migrated-routes.ts.
      // Empty string => same origin as the page (browser) / same Nitro
      // process (server). Override with NUXT_PUBLIC_NUXT_API_HOST when the
      // Nuxt backend lives on a different host than the page.
      nuxtApiHost: process.env.NUXT_PUBLIC_NUXT_API_HOST || '',
      githubClientId: process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || '978fe1a6f0c5d12f5beb',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '1020029657488-f66ubcmj6qqg4h4ptjk505ljmkv55jkv.apps.googleusercontent.com',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
    },
  },
  site: {
    url: 'https://codetime.dev',
    name: 'Code Time',
  },
  css: ['~/assets/tokens.css'],
  ogImage: {
    // Fonts are resolved by @nuxt/fonts (scans font-family in OG components
    // and subsets per request). CJK fallbacks are declared in each OG
    // template's font-family stack — only glyphs actually used are shipped.
    defaults: {
      cacheMaxAgeSeconds: 60 * 60 * 24 * 7,
    },
  },
  gtag: {
    id: 'G-36N091FBKT',
    // Defer gtag.js until first user interaction (see plugins/gtag-defer.client.ts).
    // Removes ~70KB of blocking third-party JS from the critical path.
    initMode: 'manual',
  },
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  // Silences "Unresolvable optimizeDeps.include entries" warnings for the
  // devtools packages — Vite tries to pre-bundle them but the resolved files
  // are virtual modules. Empty array tells Vite not to attempt prebundle.
  vite: {
    optimizeDeps: {
      exclude: ['@vue/devtools-kit', '@vue/devtools-core'],
    },
  },

  imports: {
    dirs: [
      'composables/**',
      'utils/**',
      'i18n/**',
    ],
  },

  // @sentry/nuxt removed: no sentry.client.config.ts existed and no app code
  // referenced it, but the module still bundled ~50KB of browser SDK
  // (browserTracing + replay scaffolding) into the landing entry. If
  // server-side error tracking is needed, re-add with `client: { enabled:
  // false }` and a sentry.server.config.ts so the public bundle stays clean.
  modules: ['@unocss/nuxt', '@vueuse/nuxt', '@nuxtjs/sitemap', 'nuxt-og-image', '@nuxt/image', 'nuxt-gtag', [
    '@nuxtjs/google-fonts',
    {
      download: true,
      families: {},
    },
  ], '@nuxt/fonts'],

  // Nitro auto-generates the OpenAPI spec at /_nitro/openapi.json from
  // each route's defineRouteMeta({ openAPI: ... }). Our handler at
  // /v3/docs/openapi.json filters that to only the migrated /v3 routes.
  nitro: {
    experimental: { openAPI: true },
    openAPI: {
      meta: {
        title: 'Code Time',
        version: '0.1.0',
      },
      ui: { swagger: false, scalar: false },
    },
  },

  // Preload Inter (body copy). The mono LCP font (Berkeley Mono) is
  // self-hosted via @font-face in app.vue and preloaded explicitly in
  // app/app.vue's <Head> so @nuxt/fonts doesn't need to manage it.
  fonts: {
    families: [
      { name: 'Inter', preload: true, weights: [400, 500, 600, 700] },
    ],
  },

  routeRules: {
    // Scalar runs in an iframe — neither host page nor shell need SSR.
    '/docs/api': { ssr: false },
    '/docs/api/**': { ssr: false },
    // Widget SVG endpoints set their own cache headers in the handler. Override
    // any CDN page-cache defaults so an occasional SPA-fallback HTML response
    // (e.g. during a deploy) is not pinned at the edge for hours.
    '/api/widgets/**': {
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=600',
        'cdn-cache-control': 'public, max-age=600',
      },
    },
    // Landing pages are pure marketing content — no per-user data is rendered
    // server-side (fetchUser runs client-only). Stale-while-revalidate keeps
    // TTFB at edge-cache speed (was 2s on cold SSR) while still picking up
    // copy/i18n changes within the SWR window.
    '/': { swr: 600 },
    '/en': { swr: 600 },
    '/zh-CN': { swr: 600 },
    '/zh-TW': { swr: 600 },
    '/ja': { swr: 600 },
    '/de': { swr: 600 },
    '/es': { swr: 600 },
    '/fr': { swr: 600 },
    '/it': { swr: 600 },
    '/ru': { swr: 600 },
    '/ua': { swr: 600 },
    '/ms': { swr: 600 },
    '/pt-BR': { swr: 600 },
  },

  sitemap: {
    exclude: [
      '/[...slug]',
      '/**/dashboard/**',
      '/**/demo/**',
    ],
    defaults: {
      changefreq: 'weekly',
      priority: 0.6,
    },
    // autoLastmod must be true for agent-readability — agents use <lastmod>
    // to decide whether to re-crawl. The build-time stamp is good enough for
    // marketing copy; the per-URL handler in server/api/__sitemap__/urls.ts
    // overrides it on entries that have a real change date.
    autoLastmod: true,
    urls: async () => {
      // Generate URLs only for main pages; user pages are handled by dynamic routes.
      return []
    },
  },

  // sentry block intentionally removed alongside the @sentry/nuxt module.
  // To bring it back server-only, add a sentry.server.config.ts with init().

  compatibilityDate: '2024-10-13',
})
