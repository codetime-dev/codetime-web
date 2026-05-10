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
      githubClientId: process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || '978fe1a6f0c5d12f5beb',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '1020029657488-f66ubcmj6qqg4h4ptjk505ljmkv55jkv.apps.googleusercontent.com',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || 'https://3682972d2ab3f65b115e618182c7fa35@o4509038403911680.ingest.us.sentry.io/4509768911486976',
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

  imports: {
    dirs: [
      'composables/**',
      'utils/**',
      'i18n/**',
    ],
  },

  modules: ['@unocss/nuxt', '@vueuse/nuxt', '@nuxtjs/sitemap', 'nuxt-og-image', '@nuxt/image', 'nuxt-gtag', [
    '@nuxtjs/google-fonts',
    {
      download: true,
      families: {},
    },
  ], '@sentry/nuxt', '@nuxt/fonts'],

  // Preload Inter (body copy). The mono LCP font (Berkeley Mono) is
  // self-hosted via @font-face in app.vue and preloaded explicitly in
  // app/app.vue's <Head> so @nuxt/fonts doesn't need to manage it.
  fonts: {
    families: [
      { name: 'Inter', preload: true, weights: [400, 500, 600, 700] },
    ],
  },

  routeRules: {
    // Widget SVG endpoints set their own cache headers in the handler. Override
    // any CDN page-cache defaults so an occasional SPA-fallback HTML response
    // (e.g. during a deploy) is not pinned at the edge for hours.
    '/api/widgets/**': {
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=600',
        'cdn-cache-control': 'public, max-age=600',
      },
    },
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
    autoLastmod: false,
    urls: async () => {
      // Generate URLs only for main pages; user pages are handled by dynamic routes.
      return []
    },
  },

  sentry: {
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || 'https://3682972d2ab3f65b115e618182c7fa35@o4509038403911680.ingest.us.sentry.io/4509768911486976',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    // Replay SDK adds ~50KB of client JS and noticeably hurts LCP on the
    // landing page. Disable it for now; re-enable per-route if needed.
    integrations: {
      browserTracing: true,
      replay: false,
    },
  },

  compatibilityDate: '2024-10-13',
})