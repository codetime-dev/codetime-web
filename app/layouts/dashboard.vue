<script setup lang="ts">
import { v3ListSelfLatestLogs } from '~/api/v3'
import VSCodeIcon from '~/components/VSCodeIcon.vue'

const t = useI18N()
const headerTabs = computed(() => [
  { label: t.value.dashboard.pageHeader.title.overview, id: 'overview', path: `/dashboard` },
  { label: t.value.dashboard.pageHeader.title.badge, id: 'badges', path: `/dashboard/badges` },
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
        <div class="px-5.5 py-3.5 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
          <ClientOnly>
            <div class="flex flex-wrap gap-3 items-center">
              <NuxtLink :to="`/${locale}`" class="flex gap-3 items-center">
                <img
                  alt="Code Time"
                  src="/icon.svg"
                  width="20"
                  height="20"
                  class="block"
                  loading="lazy"
                  decoding="async"
                >
                <span class="text-[14px] text-surface tracking-[0.3em] font-mono font-semibold">CODE·TIME</span>
              </NuxtLink>

              <NuxtLink
                v-if="user"
                class="text-[13px] text-surface-dimmed tracking-[0.08em] font-mono inline-flex gap-2 transition-colors items-center hover:text-primary"
                :to="`/${locale}/dashboard`"
              >
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  alt=""
                  class="border-surface-dimmed/30 border rounded-full h-5 w-5 object-cover"
                >
                <span class="hidden sm:inline">{{ user.username }}</span>
                <span
                  class="text-[11px] tracking-[0.14em] font-mono px-2 py-0.5 border rounded-full"
                  :class="String(user.plan).toLowerCase() === 'pro'
                    ? 'border-primary/30 text-primary bg-primary/12'
                    : 'border-surface-dimmed/25 text-surface-dimmed/60'"
                >
                  {{ String(user.plan ?? 'free').toUpperCase() }}
                </span>
              </NuxtLink>
              <div
                v-else-if="pending"
                class="flex gap-2 items-center"
              >
                <div class="bg-surface-variant-1/50 h-5 w-5 animate-pulse" />
                <div class="bg-surface-variant-1/50 h-3 w-16 hidden animate-pulse sm:block" />
              </div>

              <NuxtLink
                v-if="user && showAnnualReport"
                :to="`/${locale}/user/${user.id}/annual-report`"
                target="_blank"
                class="bg-primary/10 hover:bg-primary/20 text-[12px] text-primary tracking-[0.14em] font-mono px-2 py-1 inline-flex gap-1 uppercase transition-colors items-center"
              >
                <i class="i-tabler-sparkles text-sm" />
                <span class="hidden sm:inline">{{ t.annualReport.reviewAnnualReport }}</span>
              </NuxtLink>

              <div v-if="resp.status.value === 'pending'">
                <div class="bg-surface-variant-1/50 h-3 w-24 animate-pulse" />
              </div>
              <div
                v-else-if="resp.data.value"
                class="text-[12px] text-surface-dimmed tracking-[0.04em] font-mono inline-flex gap-2 items-center"
              >
                <div class="shrink-0 relative">
                  <div class="rounded-full bg-primary h-2 w-2 animate-ping" />
                  <div class="rounded-full bg-primary h-2 w-2 left-0 top-0 absolute" />
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

        <nav class="dash-tabs px-5.5 pb-0 flex flex-wrap gap-0">
          <NuxtLink
            v-for="tab in headerTabs"
            :key="tab.id"
            :to="`/${locale}${tab.path}`"
            class="dash-tab text-[13px] tracking-[0.12em] font-mono px-3.5 py-2.5 transition-colors"
            :class="tab === currentTab
              ? 'dash-tab-active text-primary bg-surface-variant-1/35'
              : 'text-surface-dimmed hover:text-surface hover:bg-surface-variant-1/20'"
          >
            {{ tab.label }}
          </NuxtLink>
        </nav>
      </header>
      <div v-if="pending" class="layout-main">
        <DashboardPageTitle loading />
        <DashboardPageContent>
          <div class="px-5.5 py-6">
            <div class="bg-surface-variant-1/40 h-32 w-full animate-pulse" />
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
          <span class="text-[12.5px] tracking-[0.04em] font-mono px-4 pb-6 text-center max-w-2xl">
            {{ t.dashboard.loginRequired }}
          </span>
          <LoginButton />
        </div>
      </main>
      <footer class="layout-foot relative">
        <div class="text-surface-dimmed/55 text-[12px] tracking-[0.12em] font-mono px-5.5 py-3.5 flex gap-3 uppercase items-center justify-center">
          <span>datreks · {{ new Date().getFullYear() }}</span>
          <span class="text-surface-dimmed/25">·</span>
          <NuxtLink
            to="https://github.com/Jannchie/codetime-web-v3"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-github text-sm" />
            <span class="hidden sm:inline">github</span>
          </NuxtLink>
          <span class="text-surface-dimmed/25">·</span>
          <NuxtLink
            to="https://discord.gg/WWEQrWCkkP"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-discord text-sm" />
            <span class="hidden sm:inline">discord</span>
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

.layout-main {
  flex: 1 0 auto;
}

.layout-foot {
  margin-top: auto;
}

.layout-frame::before,
.layout-frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.35;
  pointer-events: none;
  z-index: 2;
}

.layout-frame::before {
  left: 0;
}

.layout-frame::after {
  right: 0;
}

.layout-topbar::after,
.layout-foot::before {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.4;
  transform: translateX(-50%);
  pointer-events: none;
}

.layout-topbar::after {
  bottom: 0;
}

.layout-foot::before {
  top: 0;
}

.layout-foot {
  background-color: rgb(var(--r-color-surface-7) / 0.18);
}

[data-scheme="light"] .layout-foot {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 4%, transparent);
}

.dash-tab-active {
  position: relative;
}

.dash-tab-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: var(--color-primary-1);
  opacity: 0.85;
}
</style>
