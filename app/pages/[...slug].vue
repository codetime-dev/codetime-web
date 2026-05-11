<script setup lang="ts">
// Catchall for paths that do not resolve to a real page.
// Without this, soft-404s ship as HTTP 200 — agents trust status codes,
// so a 200 error page gets cited as real content. Fail loudly with 404
// (and serve a markdown alternate on Accept: text/markdown).
definePageMeta({
  middleware: ['i18n'],
})

const route = useRoute()
const url = `https://codetime.dev${route.fullPath}`

// Set HTTP 404 on the server so agents trust the negative signal. The
// agent-friendly server middleware (see server/middleware/agent-friendly.ts)
// short-circuits with a markdown body when Accept: text/markdown is sent.
if (import.meta.server) {
  const event = useRequestEvent()
  if (event) {
    setResponseStatus(event, 404)
  }
}

useSeoMeta({
  title: '404 — Page not found · Code Time',
  description: 'The page you requested does not exist on codetime.dev.',
  robots: 'noindex',
})

useHead({
  link: [{ rel: 'canonical', href: url }],
})
</script>

<template>
  <NuxtLayout>
    <section class="mx-auto px-6 py-24 text-center max-w-3xl">
      <p class="text-sm tracking-widest mb-4 opacity-60 uppercase">
        404
      </p>
      <h1 class="text-3xl font-mono font-semibold mb-3">
        Page not found
      </h1>
      <p class="mb-8 opacity-70">
        That path does not match anything on codetime.dev.
      </p>
      <p>
        <NuxtLink to="/" class="underline">
          Back to homepage
        </NuxtLink>
      </p>
    </section>
  </NuxtLayout>
</template>
