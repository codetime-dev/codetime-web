<script setup lang="ts">
// Scalar API Reference for the Nuxt-served endpoints. The spec at
// /v3/docs/openapi.json is built directly from each route's
// defineRouteMeta block in server/routes/v3/...
//
// Rendered in an <iframe> so Scalar runs in a clean document and is not
// affected by the host page's UnoCSS reset, tokens.css, or layout
// scopes. Bypasses i18n redirect (see app/middleware/i18n.ts).

definePageMeta({
  layout: false,
})

useHead({
  title: 'Code Time API Reference',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <iframe
    src="/docs/api/scalar.html"
    title="API reference"
    class="scalar-frame"
  />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #1c1e21;
}
.scalar-frame {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
