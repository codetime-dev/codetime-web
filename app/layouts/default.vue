<script setup lang="ts">
import { RokuProvider } from '@roku-ui/vue'

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

// defineOgImageComponent('NuxtSeo', {
//   title: t.value.meta.title,
//   description: t.value.meta.description,
//   colorMode: 'dark',
//   theme: '#0067cc',
//   siteLogo: 'https://codetime.dev/icon.png',
// })
</script>

<template>
  <NuxtLoadingIndicator
    color="var(--color-primary-1)"
    :height="1"
  />
  <RokuProvider class="flex flex-col min-h-100vh">
    <slot />
  </RokuProvider>
</template>

<style>
:root {
  color-scheme: light dark;
  background-color: var(--r-surface-background-base-color);
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
  --plot-background: var(--r-surface-background-base-color);
  background: var(--plot-background) !important;
}
.y-dot-plot {
  --plot-background: var(--r-surface-background-base-color);
  background: var(--plot-background) !important;
}

.y-grid {
  stroke-dasharray: 2 2;
}

[aria-label="tip"] {
  color: var(--r-surface-text-color);
  --plot-background: var(--r-surface-background-base-color);
  background: var(--plot-background) !important;
  border: 1px solid var(--plot-background) !important;
  fill: var(--plot-background) !important;
}

marker {
  stroke: var(--plot-background)!important;
}
.y-dot-plot [aria-label="y-axis tick label"] > text {
  --plot-background: rgb(var(--r-color-surface-low));
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

@media (prefers-color-scheme: dark) {
  :root {
    --color-frontground: #eee; --color-background: #111; --color-primary-1: #0284c7; --color-primary-2: #075985; --color-primary-3: #0c4a6e; --color-bg-1: #404040; --color-bg-2: #262626; --color-bg-3: #171717; --color-border-1: #404040; --color-border-2: #262626; --color-border-3: #171717; --color-error-1: #ef4444; --color-error-2: #b91c1c; --color-error-container: #7f1d1d; --color-success-1: #10b981; --color-success-2: #047857; --color-secondary-container: #064e3b; --color-warning-1: #f59e0b; --color-warning-2: #b45309; --color-warning-3: #78350f; color-scheme: dark; background-color: rgb(17, 17, 17); color: rgb(238, 238, 238);
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --color-frontground: #111; --color-background: #fff; --color-primary-1: #0284c7; --color-primary-2: #0284c7; --color-primary-3: #0284c7; --color-bg-1: #ffffff; --color-bg-2: #fefefe; --color-bg-3: #fcfcfc; --color-border-1: #d4d4d4; --color-border-2: #a3a3a3; --color-border-3: #a3a3a3; --color-error-1: #dc2626; --color-error-2: #dc2626; --color-error-container: #dc2626; --color-success-1: #059669; --color-success-2: #059669; --color-secondary-container: #059669; --color-warning-1: #d97706; --color-warning-2: #d97706; --color-warning-3: #d97706; color-scheme: light; background-color: rgb(255, 255, 255); color: rgb(17, 17, 17);
  }
}
</style>
