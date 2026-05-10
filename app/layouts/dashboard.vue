<script setup lang="ts">
const t = useI18N()
const locale = useLocale()
const headerTabs = computed(() => [
  { label: t.value.dashboard.pageHeader.title.overview, id: 'overview', path: `/dashboard` },
  { label: t.value.dashboard.pageHeader.title.widget ?? 'Widgets', id: 'widgets', path: `/dashboard/widgets` },
  { label: t.value.dashboard.pageHeader.title.workspace, id: 'workspace', path: `/dashboard/workspace` },
  { label: t.value.dashboard.pageHeader.title.tags, id: 'tags', path: `/dashboard/tags` },
  { label: t.value.dashboard.pageHeader.title.leaderboard, id: 'leaderboard', path: `/dashboard/leaderboard` },
  { label: t.value.dashboard.pageHeader.title.settings, id: 'settings', path: `/dashboard/settings` },
])

const tabItems = computed(() =>
  headerTabs.value.map(tab => ({
    id: tab.id,
    label: tab.label,
    to: `/${locale.value}${tab.path}`,
  })),
)
const currentTab = useCurrentTab(headerTabs)
const activeTabId = computed(() => currentTab.value?.id)
const user = useUser()

const pending = autoResetRef(false, 1000)
pending.value = true

useHead({
  htmlAttrs: { lang: locale.value },
  link: [{ rel: 'icon', type: 'image/png', href: '/icon.png' }],
})
</script>

<template>
  <NuxtLayout name="default">
    <div class="layout-frame mx-auto max-w-7xl w-full">
      <DashboardTopbar>
        <template #nav>
          <UTabs :items="tabItems" :active-id="activeTabId" variant="underline" />
        </template>
      </DashboardTopbar>
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
      <DashboardFooter />
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
</style>
