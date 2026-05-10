<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

const t = useI18N()
const route = useRoute()
const router = useRouter()

type TabId = 'badge' | 'donut' | 'status'

const tabs = computed<{ id: TabId, label: string, icon: string }[]>(() => {
  const w = t.value.dashboard.widget
  return [
    { id: 'badge', label: w?.tab.badge ?? 'Badge', icon: 'i-tabler-rosette-discount' },
    { id: 'donut', label: w?.tab.donut ?? 'Languages', icon: 'i-tabler-chart-donut-3' },
    { id: 'status', label: w?.tab.status ?? 'Status', icon: 'i-tabler-activity-heartbeat' },
  ]
})

const active = computed<TabId>({
  get() {
    const q = route.query.tab
    if (q === 'donut' || q === 'status' || q === 'badge') {
      return q
    }
    return 'badge'
  },
  set(value) {
    router.replace({ query: { ...route.query, tab: value } })
  },
})
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.widget ?? 'Widgets'"
    :description="t.dashboard.pageHeader.description.widget ?? ''"
  />
  <DashboardPageContent>
    <nav class="widget-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="active === tab.id"
        class="widget-tab"
        :class="active === tab.id ? 'widget-tab-active' : ''"
        @click="active = tab.id"
      >
        <i :class="tab.icon" class="text-[15px]" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <WidgetBadgeTab v-if="active === 'badge'" />
    <WidgetDonutTab v-else-if="active === 'donut'" />
    <WidgetStatusTab v-else-if="active === 'status'" />
  </DashboardPageContent>
</template>

<style scoped>
.widget-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.widget-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease;
}
.widget-tab:hover {
  color: var(--ct-fg);
  background-color: var(--ct-surface-1);
}
.widget-tab-active {
  color: var(--ct-primary);
  border-bottom-color: var(--ct-primary);
}
</style>
