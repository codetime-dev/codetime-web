<script setup lang="ts">
const t = useI18N()

const route = useRoute()

watchEffect(() => {
  if (!route.path.includes('annual-report')) {
    useSeoMeta({
      title: t.value.meta.title,
      description: t.value.meta.description,
      ogTitle: t.value.meta.ogTitle,
      ogDescription: t.value.meta.ogDescription,
      twitterTitle: t.value.meta.twitterTitle,
      twitterDescription: t.value.meta.twitterDescription,
      ogUrl: 'https://codetime.dev',
      twitterCard: 'summary',
    })
  }
})
</script>

<template>
  <NuxtLoadingIndicator
    color="var(--color-primary-1)"
    :height="1"
  />
  <div class="flex flex-col min-h-100vh">
    <slot />
  </div>
</template>

<style>
:root {
  color-scheme: light dark;
  background-color: var(--ct-bg);
}

html {
  scrollbar-gutter: stable;
  overflow-y: scroll;
}

body {
  margin-right: 0 !important;
}

input[type="password"] {
  font-family: "system-ui", "Segoe UI", sans-serif;
}

.plot {
  --plot-background: var(--ct-bg);
  background: var(--plot-background) !important;
}
.y-dot-plot {
  --plot-background: var(--ct-bg);
  background: var(--plot-background) !important;
}

.y-grid {
  stroke-dasharray: 2 2;
}

[aria-label="tip"] {
  color: var(--ct-fg);
  --plot-background: var(--ct-bg);
  background: var(--plot-background) !important;
  border: 1px solid var(--plot-background) !important;
  fill: var(--plot-background) !important;
}

marker {
  stroke: var(--plot-background)!important;
}
.y-dot-plot [aria-label="y-axis tick label"] > text {
  --plot-background: var(--ct-bg);
  stroke: var(--plot-background);
  -webkit-font-smoothing: antialiased;
  font-family: 'Inter', sans-serif;
  text-anchor: end !important;
  text-transform: capitalize;
  stroke-linecap: round;
  stroke-linejoin: round;
  paint-order: stroke;
  stroke-width: 6px;
}

/* Color tokens are defined in app/assets/tokens.css and switched via
   html[data-scheme]. Roku-prefixed surface vars below are kept aligned
   with the active scheme through the same stylesheet. */
</style>
