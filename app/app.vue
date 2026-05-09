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
  --font-mono: 'Berkeley Mono', 'Share Tech Mono', monospace;
}

.font-mono {
  font-family: var(--font-mono);
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
</style>
