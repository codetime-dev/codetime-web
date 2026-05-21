<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})

const t = useI18N()
const route = useRoute()
const router = useRouter()

type TabId = 'badge' | 'donut' | 'status' | 'calendar' | 'trend' | 'usage'

const tabs = computed<{ id: TabId, label: string, icon: string }[]>(() => {
  const w = t.value.dashboard.widget
  return [
    { id: 'badge', label: w?.tab.badge ?? 'Badge', icon: 'i-tabler-rosette-discount' },
    { id: 'donut', label: w?.tab.donut ?? 'Languages', icon: 'i-tabler-chart-donut-3' },
    { id: 'status', label: w?.tab.status ?? 'Status', icon: 'i-tabler-activity-heartbeat' },
    { id: 'calendar', label: w?.tab.calendar ?? 'Calendar', icon: 'i-tabler-calendar-stats' },
    { id: 'trend', label: w?.tab.trend ?? 'Trend', icon: 'i-tabler-chart-line' },
    { id: 'usage', label: w?.tab.usage ?? 'Usage', icon: 'i-tabler-coin' },
  ]
})

const VALID_TABS = new Set<TabId>(['badge', 'donut', 'status', 'calendar', 'trend', 'usage'])

const active = computed<TabId>({
  get() {
    const q = route.query.tab
    if (typeof q === 'string' && VALID_TABS.has(q as TabId)) {
      return q as TabId
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
    <UTabs v-model="active" :items="tabs" variant="underline" />

    <WidgetBadgeTab v-if="active === 'badge'" />
    <WidgetDonutTab v-else-if="active === 'donut'" />
    <WidgetStatusTab v-else-if="active === 'status'" />
    <WidgetCalendarTab v-else-if="active === 'calendar'" />
    <WidgetTrendTab v-else-if="active === 'trend'" />
    <WidgetUsageTab v-else-if="active === 'usage'" />
  </DashboardPageContent>
</template>
