<script setup lang="ts">
const t = useI18N()
const user = useUser()

const days = ref<number>(90)
const theme = ref<'light' | 'dark'>('light')

const isPro = computed(() => String(user.value?.plan ?? 'free').toLowerCase() === 'pro')
const exceedsFreeLimit = computed(() => !isPro.value && days.value > 90)

const w = computed(() => t.value.dashboard.widget)
const themeOptions = computed(() => [
  { id: 'light' as const, label: w.value?.theme.light ?? 'Light' },
  { id: 'dark' as const, label: w.value?.theme.dark ?? 'Dark' },
])

const rawParams = computed(() => ({
  uid: user.value?.id,
  days: days.value,
  theme: theme.value,
}))
const debouncedParams = refDebounced(rawParams, 250)

const qs = computed(() => {
  const p = debouncedParams.value
  if (!p.uid) {
    return ''
  }
  return new URLSearchParams({
    uid: String(p.uid),
    days: String(p.days),
    theme: p.theme,
  }).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/trend.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/trend.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="exceedsFreeLimit"
    variant="warning"
    :text="w?.limit.trendExceeds ?? 'Free plan caps the trend at 90 days — values will be clamped.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />
  <WidgetPlanLimitNotice
    v-else-if="!isPro"
    :text="w?.limit.trendFree ?? 'Free plan: up to 90 days of trend. Pro extends the window to 365 days.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.trend?.title ?? 'Daily trend'" :height="220" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="window · theme" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.trend?.days ?? 'Days'">
      <WidgetFormNumberInput v-model="days" :min="7" :max="365" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Trend" class="z-1" />
</template>
