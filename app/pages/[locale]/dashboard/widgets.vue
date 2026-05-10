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
    <UTabs v-model="active" :items="tabs" variant="underline" />

    <WidgetBadgeTab v-if="active === 'badge'" />
    <WidgetDonutTab v-else-if="active === 'donut'" />
    <WidgetStatusTab v-else-if="active === 'status'" />
  </DashboardPageContent>
</template>
