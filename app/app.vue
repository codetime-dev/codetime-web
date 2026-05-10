<script setup lang="ts">
import { client } from '@/api/v3/client.gen'

// Configure the API client BEFORE any data fetching.
// Must run first so that all subsequent API calls (including the
// initial user fetch) use the correct base URL, credentials, and
// error handling.
const config = useRuntimeConfig()
client.setConfig({
  baseUrl: config.public.apiHost,
  credentials: 'include',
  throwOnError: true,
})

const { data: user, status } = await fetchUser()
provide('user', user)
provide('user-pending', status.value === 'pending')
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@font-face {
  font-family: 'Berkeley Mono';
  src: url('https://cdn.jannchie.com/fonts/BerkeleyMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Berkeley Mono';
  src: url('https://cdn.jannchie.com/fonts/BerkeleyMono-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  /* CJK glyphs fall through Berkeley Mono (no CJK coverage) and land on
     a UI-friendly sans-serif display font — CJK ideographs are naturally
     equal-width so we don't need a monospace font for them. */
  --font-mono: 'Berkeley Mono', 'Share Tech Mono', monospace;
  --font-mono-cjk-sc: 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei UI', 'Noto Sans SC', sans-serif;
  --font-mono-cjk-tc: 'PingFang TC', 'Microsoft JhengHei UI', 'Noto Sans TC', sans-serif;
  --font-mono-cjk-ja: 'HarmonyOS Sans JP', 'Yu Gothic UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
}

.font-mono {
  font-family: var(--font-mono);
}

[lang="ja"] .font-mono {
  font-family: 'Berkeley Mono', 'Share Tech Mono', var(--font-mono-cjk-ja), monospace;
}
[lang="zh-CN"] .font-mono {
  font-family: 'Berkeley Mono', 'Share Tech Mono', var(--font-mono-cjk-sc), monospace;
}
[lang="zh-TW"] .font-mono {
  font-family: 'Berkeley Mono', 'Share Tech Mono', var(--font-mono-cjk-tc), monospace;
}

[lang="ja"] *:not(.font-mono) {
  font-family: 'HarmonyOS Sans JP', 'Yu Gothic UI', 'Segoe UI', 'Inter', system-ui, sans-serif;
}
[lang="zh-CN"] *:not(.font-mono) {
  font-family: 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'Segoe UI', 'Inter', system-ui, sans-serif;
}

*:not(.font-mono) {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* Light-mode surface tint overrides.
   The shared recipe `rgb(var(--r-color-surface-7) / X)` reads muddy on white.
   We swap it for an ink-tinted overlay derived from the text color, which
   stays clean across schemes. The `html[...]` prefix wins over Vue scoped
   selectors (`.cls[data-v-...]`). */
html[data-scheme="light"] .line-btn,
html[data-scheme="light"] .line-input,
html[data-scheme="light"] .token-bar,
html[data-scheme="light"] .lang-trigger,
html[data-scheme="light"] .acc-avatar,
html[data-scheme="light"] .layout-foot,
html[data-scheme="light"] .badge-style-btn:hover {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 5%, transparent);
}

html[data-scheme="light"] .line-btn:hover,
html[data-scheme="light"] .line-input:hover,
html[data-scheme="light"] .token-bar:hover,
html[data-scheme="light"] .lang-trigger:hover,
html[data-scheme="light"] .lang-trigger-open {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 9%, transparent);
}

html[data-scheme="light"] .line-input:focus {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 11%, transparent);
}

/* Pill markers (e.g. FREE / PRO badge in account settings). */
html[data-scheme="light"] .acc-pill {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 8%, transparent);
  color: color-mix(in srgb, var(--r-surface-text-color) 85%, transparent);
}

html[data-scheme="light"] .acc-pill-primary {
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
  color: var(--color-primary-1);
}
</style>
