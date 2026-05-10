<script setup lang="ts">
import { v3ListSelfLatestLogs } from '~/api/v3'
import VSCodeIcon from '~/components/VSCodeIcon.vue'

const t = useI18N()
const headerTabs = computed(() => [
  { label: t.value.dashboard.pageHeader.title.overview, id: 'overview', path: `/dashboard` },
  { label: t.value.dashboard.pageHeader.title.widget ?? 'Widgets', id: 'widgets', path: `/dashboard/widgets` },
  { label: t.value.dashboard.pageHeader.title.workspace, id: 'workspace', path: `/dashboard/workspace` },
  { label: t.value.dashboard.pageHeader.title.tags, id: 'tags', path: `/dashboard/tags` },
  { label: t.value.dashboard.pageHeader.title.leaderboard, id: 'leaderboard', path: `/dashboard/leaderboard` },
  { label: t.value.dashboard.pageHeader.title.settings, id: 'settings', path: `/dashboard/settings` },
])

const locale = useLocale()
const currentTab = useCurrentTab(headerTabs)
const user = useUser()

const pending = autoResetRef(false, 1000)
pending.value = true

useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/icon.png',
    },
  ],
})

const resp = useAsyncData('user-latest-logs', async () => {
  const resp = await v3ListSelfLatestLogs({
    query: {
      limit: 1,
    },
  })
  return resp.data?.[0]
}, {
  server: false,
})

// 12月 20日到 1月 15 日为年度报告展示周期
const showAnnualReport = computed(() => {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  return (month === 11 && day >= 20) || (month === 0 && day <= 15)
})
</script>

<template>
  <NuxtLayout name="default">
    <div class="layout-frame mx-auto max-w-7xl w-full">
      <header class="layout-topbar relative">
        <div class="px-6 py-4 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
          <ClientOnly>
            <div class="flex flex-wrap gap-4 items-center">
              <NuxtLink :to="`/${locale}`" class="flex gap-2.5 items-center">
                <img
                  alt="Code Time"
                  src="/icon.svg"
                  width="22"
                  height="22"
                  class="block"
                  loading="lazy"
                  decoding="async"
                >
                <span class="text-[15px] tracking-tight font-semibold" style="color: var(--ct-fg)">Code Time</span>
              </NuxtLink>

              <NuxtLink
                v-if="user"
                class="dash-user-chip"
                :to="`/${locale}/dashboard`"
              >
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  alt=""
                  class="rounded-full h-5 w-5 object-cover"
                  style="border:1px solid var(--ct-border)"
                >
                <span class="text-[14px] hidden sm:inline">{{ user.username }}</span>
                <UTag
                  :tone="String(user.plan).toLowerCase() === 'pro' ? 'primary' : 'neutral'"
                  variant="soft"
                  size="sm"
                >
                  {{ String(user.plan ?? 'free').toUpperCase() }}
                </UTag>
              </NuxtLink>
              <div
                v-else-if="pending"
                class="flex gap-2 items-center"
              >
                <div class="rounded-full h-5 w-5 animate-pulse" style="background: var(--ct-surface-2)" />
                <div class="rounded h-3 w-16 hidden animate-pulse sm:block" style="background: var(--ct-surface-2)" />
              </div>

              <NuxtLink
                v-if="user && showAnnualReport"
                :to="`/${locale}/user/${user.id}/annual-report`"
                target="_blank"
                class="dash-annual"
              >
                <i class="i-tabler-sparkles" />
                <span class="hidden sm:inline">{{ t.annualReport.reviewAnnualReport }}</span>
              </NuxtLink>

              <div v-if="resp.status.value === 'pending'">
                <div class="rounded h-3 w-24 animate-pulse" style="background: var(--ct-surface-2)" />
              </div>
              <div
                v-else-if="resp.data.value"
                class="dash-latest"
              >
                <div class="shrink-0 relative">
                  <div class="rounded-full h-2 w-2 animate-ping" style="background: var(--ct-primary)" />
                  <div class="rounded-full h-2 w-2 left-0 top-0 absolute" style="background: var(--ct-primary)" />
                </div>
                <VSCodeIcon
                  :language="resp.data.value.language"
                  class="h-3.5 w-3.5"
                />
                <span class="max-w-40 truncate">
                  {{ t.dashboard.pageHeader.userLatestEvent(resp.data.value.project) }}
                </span>
              </div>
            </div>
          </ClientOnly>

          <div class="flex gap-3 items-center">
            <LanguageSelect />
          </div>
        </div>

        <nav class="dash-tabs px-6 pb-0 flex flex-wrap gap-1">
          <NuxtLink
            v-for="tab in headerTabs"
            :key="tab.id"
            :to="`/${locale}${tab.path}`"
            class="dash-tab"
            :class="{ 'dash-tab-active': tab === currentTab }"
          >
            {{ tab.label }}
          </NuxtLink>
        </nav>
      </header>
      <div v-if="pending" class="layout-main">
        <DashboardPageTitle loading />
        <DashboardPageContent>
          <div class="px-6 py-6">
            <div class="rounded-ct-lg h-32 w-full animate-pulse" style="background: var(--ct-surface-2)" />
          </div>
        </DashboardPageContent>
      </div>
      <main v-else class="layout-main relative">
        <slot v-if="user" />
        <div
          v-else
          class="py-16 op75 flex flex-col h-full items-center justify-center"
        >
          <div class="mb-8">
            <img
              alt="Code Time"
              src="/icon.svg"
              width="64"
              loading="lazy"
              decoding="async"
            >
          </div>
          <span class="px-4 pb-6 text-center max-w-2xl" style="font-size: var(--ct-text-sm); color: var(--ct-fg-muted)">
            {{ t.dashboard.loginRequired }}
          </span>
          <LoginButton />
        </div>
      </main>
      <footer class="layout-foot relative">
        <div class="dash-foot">
          <span>Datreks · {{ new Date().getFullYear() }}</span>
          <span class="dash-foot-sep">·</span>
          <NuxtLink
            to="https://github.com/Jannchie/codetime-web-v3"
            target="_blank"
            class="dash-foot-link"
          >
            <i class="i-tabler-brand-github" />
            <span class="hidden sm:inline">GitHub</span>
          </NuxtLink>
          <span class="dash-foot-sep">·</span>
          <NuxtLink
            to="https://discord.gg/WWEQrWCkkP"
            target="_blank"
            class="dash-foot-link"
          >
            <i class="i-tabler-brand-discord" />
            <span class="hidden sm:inline">Discord</span>
          </NuxtLink>
        </div>
      </footer>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.layout-frame {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main { flex: 1 0 auto; }
.layout-foot {
  margin-top: auto;
  background: var(--ct-surface-1);
}

.layout-frame::before,
.layout-frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ct-border-subtle);
  pointer-events: none;
  z-index: 2;
}
.layout-frame::before { left: 0; }
.layout-frame::after  { right: 0; }

.layout-topbar::after,
.layout-foot::before {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--ct-border-subtle);
  transform: translateX(-50%);
  pointer-events: none;
}
.layout-topbar::after { bottom: 0; }
.layout-foot::before  { top: 0; }

/* Tabs — pill-style, modern */
.dash-tabs { padding-bottom: 0; }
.dash-tab {
  position: relative;
  padding: 10px 14px;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  border-radius: 0;
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.dash-tab:hover { color: var(--ct-fg); background: var(--ct-surface-1); }
.dash-tab-active {
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
}
.dash-tab-active:hover {
  color: var(--ct-primary);
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.dash-tab-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--ct-primary);
}

/* Top-bar chips */
.dash-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  padding: 4px 10px 4px 4px;
  border-radius: var(--ct-radius-full);
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.dash-user-chip:hover { color: var(--ct-fg); background: var(--ct-surface-1); }

.dash-annual {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: var(--ct-text-xs);
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border-radius: var(--ct-radius-full);
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.dash-annual:hover { background: color-mix(in srgb, var(--ct-primary) 22%, transparent); }

.dash-latest {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}

/* Footer */
.dash-foot {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.dash-foot-sep { color: var(--ct-fg-disabled); }
.dash-foot-link {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.dash-foot-link:hover { color: var(--ct-primary); }
</style>
