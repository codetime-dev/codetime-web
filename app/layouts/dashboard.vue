<script setup lang="ts">
const t = useI18N()
const locale = useLocale()
const headerTabs = computed(() => [
  { label: t.value.dashboard.pageHeader.title.overview, id: 'overview', path: `/dashboard` },
  // Vibe sits right after Overview — vibe coding telemetry is the
  // headline feature alongside the IDE-side overview. The `agent` i18n
  // key isn't declared on every locale yet, so fall back to the English
  // literal during the translation rollout.
  { label: t.value.dashboard.pageHeader.title.agent ?? 'Vibe', id: 'agent', path: `/dashboard/agent` },
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

// Drive the skeleton off of the real user-fetch lifecycle instead of a
// fixed 1s timer. The previous autoResetRef would always hold the
// skeleton for a full second — long after `user` had already resolved —
// producing the "skeleton → blank → content" flash users reported.
const userPending = inject<ComputedRef<boolean>>(
  'user-pending',
  computed(() => false),
)
const pending = computed(() => userPending.value && !user.value)

// Pages can opt out of the auth gate (e.g. the public /demo page injects
// a synthetic user inside its own setup — but that setup only runs when
// the layout actually renders the slot, so we must let it through here).
const route = useRoute()
const skipAuthGate = computed(() => Boolean(route.meta.skipAuthGate))

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
      <main class="layout-main relative">
        <!-- Render the page slot as soon as we have a user OR while the
             user fetch is still in flight. Letting the slot mount during
             the fetch lets the page's own skeletons (e.g. the panel-level
             skeletons inside UnifiedUserDashboard) take over immediately,
             so there is no intermediate blank frame between the layout
             skeleton and the page content. -->
        <slot v-if="user || pending || skipAuthGate" />
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
