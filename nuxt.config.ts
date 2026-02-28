// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

export default defineNuxtConfig({
  features: {
    inlineStyles: false,
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
  // ogImage: {
  //   fonts: [
  //     'Noto+Sans+SC:400', // Too big for workers
  //   ],
  // },
  gtag: {
    id: 'G-36N091FBKT',
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

  modules: ['@unocss/nuxt', '@vueuse/nuxt', '@nuxtjs/robots', '@nuxtjs/sitemap', '@nuxt/image', 'nuxt-gtag', [
    '@nuxtjs/google-fonts',
    {
      download: true,
      families: {
        'Share Tech Mono': true,
      },
    },
  ], '@sentry/nuxt'],

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
    integrations: {
      browserTracing: true,
      replay: {
        maskAllText: false,
        blockAllMedia: false,
      },
    },
  },

  compatibilityDate: '2024-10-13',
})
