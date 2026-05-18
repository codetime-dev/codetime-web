<script setup lang="ts">
// Public demo of the authenticated dashboard. Reuses UnifiedUserDashboard
// verbatim and points its data fetches at the local /api/demo/v3/*
// endpoints (see server/api/demo). This way the visual layout stays in
// lockstep with the real dashboard without requiring login or real data.

import type { UserSelfPublic } from '~/api/v3/types.gen'
import { client } from '~/api/v3/client.gen'

definePageMeta({
  layout: 'dashboard',
  // The dashboard layout gates its slot on `user || pending`. For
  // anonymous visitors that gate would never open (user stays null,
  // pending flips to false after the user-self fetch errors), so the
  // page's setup — which injects the synthetic FAKE_USER below — would
  // never run. Opt out of the gate explicitly here.
  skipAuthGate: true,
})

const t = useI18N()

// The dashboard layout gates rendering on `useUser()`. Inject a synthetic
// "demo" user so the page body renders even when the visitor isn't signed
// in. We restore whatever value was there when leaving the page.
const user = useUser()
// SDK DTOs (auto-generated from the Nuxt backend) no longer mark
// optional fields as nullable — they're plain `T | undefined`. Use
// undefined for absent attributes; null would no longer typecheck.
const FAKE_USER: UserSelfPublic = {
  id: 0,
  username: 'demo',
  email: undefined,
  avatar: undefined,
  plan: 'pro',
  timezone: 'UTC',
  uploadToken: '',
  bio: undefined,
  githubId: undefined,
  googleId: undefined,
  planExpiresAt: undefined,
  planStatus: undefined,
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

const locale = useLocale()
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.overview"
    :description="t.dashboard.pageHeader.description.overview"
  />
  <DashboardPageContent>
    <div class="demo-banner">
      <i class="i-tabler-info-circle" />
      <span>
        {{ t.demoBanner.overviewPrefix }}
        <NuxtLink :to="`/${locale}/dashboard`" class="demo-banner-link">
          /dashboard
        </NuxtLink>
        {{ t.demoBanner.overviewSuffix }}
      </span>
    </div>
    <UnifiedUserDashboard
      :show-user-info="false"
      :show-controls="true"
      layout="dashboard"
    />
  </DashboardPageContent>
</template>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  background: var(--ct-surface-1);
  border-bottom: 1px solid var(--ct-border);
}
.demo-banner-link {
  color: var(--ct-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.demo-banner-link:hover {
  color: var(--ct-primary-hover);
}
</style>
