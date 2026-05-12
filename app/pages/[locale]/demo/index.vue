<script setup lang="ts">
// Public demo of the authenticated dashboard. Reuses UnifiedUserDashboard
// verbatim and points its data fetches at the local /api/demo/v3/*
// endpoints (see server/api/demo). This way the visual layout stays in
// lockstep with the real dashboard without requiring login or real data.

import type { UserSelfPublic } from '~/api/v3/types.gen'
import { client } from '~/api/v3/client.gen'

definePageMeta({
  layout: 'dashboard',
})

const t = useI18N()

// The dashboard layout gates rendering on `useUser()`. Inject a synthetic
// "demo" user so the page body renders even when the visitor isn't signed
// in. We restore whatever value was there when leaving the page.
const user = useUser()
const FAKE_USER: UserSelfPublic = {
  id: 0,
  username: 'demo',
  email: null,
  avatar: null,
  plan: 'pro',
  timezone: 'UTC',
  uploadToken: '',
  bio: null,
  githubId: null,
  googleId: null,
  planExpiresAt: null,
  planStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const originalUser = user.value
user.value = FAKE_USER

// If the real `user-self` fetch resolves after our override (it's
// `server: false`, so it lands a tick after hydration), make sure we
// stay on the demo user — but only when the visitor is anonymous. A
// logged-in visitor keeps their real topbar identity; the dashboard
// body still pulls fake data because the API base URL is rewritten.
const stopWatch = watch(user, (v) => {
  if (!v) {
    user.value = FAKE_USER
  }
}, { flush: 'sync' })

// Cache keys used by fetchStats / fetchTop / Polt/DailyDistribution. These
// must be cleared when entering and leaving the demo so the real
// dashboard and the demo never share useAsyncData state.
function isDashboardCacheKey(key: string): boolean {
  return key.startsWith('stats-')
    || key.startsWith('top-')
    || key.startsWith('time-distribution-')
}

if (import.meta.client) {
  const originalBaseUrl = client.getConfig().baseUrl
  clearNuxtData(isDashboardCacheKey)
  client.setConfig({ baseUrl: '/api/demo' })

  onBeforeUnmount(() => {
    stopWatch()
    user.value = originalUser
    client.setConfig({ baseUrl: originalBaseUrl })
    clearNuxtData(isDashboardCacheKey)
  })
}
else {
  onBeforeUnmount(() => {
    stopWatch()
    user.value = originalUser
  })
}

useSeoMeta({
  title: 'CodeTime Dashboard Demo',
  description: 'A preview of the CodeTime dashboard rendered against synthetic data — no login required.',
  robots: 'noindex',
})
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.overview"
    :description="t.dashboard.pageHeader.description.overview"
  />
  <DashboardPageContent>
    <UnifiedUserDashboard
      :show-user-info="false"
      :show-controls="true"
      layout="dashboard"
    />
  </DashboardPageContent>
</template>
