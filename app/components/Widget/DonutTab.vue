<script setup lang="ts">
const t = useI18N()
const user = useUser()

const days = ref<number>(30)
const limit = ref<number>(6)
const theme = ref<'light' | 'dark'>('light')

const isPro = computed(() => String(user.value?.plan ?? 'free').toLowerCase() === 'pro')
const exceedsFreeLimit = computed(() => !isPro.value && (days.value > 30 || limit.value > 5))

const w = computed(() => t.value.dashboard.widget)
const themeOptions = computed(() => [
  { id: 'light' as const, label: w.value?.theme.light ?? 'Light' },
  { id: 'dark' as const, label: w.value?.theme.dark ?? 'Dark' },
])

const rawParams = computed(() => ({
  uid: user.value?.id,
  days: days.value,
  limit: limit.value,
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
    limit: String(p.limit),
    theme: p.theme,
  }).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/donut.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/donut.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="exceedsFreeLimit"
    variant="warning"
    :text="w?.limit.donutExceeds ?? 'Free plan caps the chart at 30 days and 5 languages — values will be clamped.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />
  <WidgetPlanLimitNotice
    v-else-if="!isPro"
    :text="w?.limit.donutFree ?? 'Free plan: up to 30 days and 5 languages. Pro removes the cap.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.donut.title ?? 'Top languages'" :height="180" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="window · count · theme" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.donut.days ?? 'Days'">
      <WidgetFormNumberInput v-model="days" :min="1" :max="365" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.donut.limit ?? 'Languages'">
      <WidgetFormNumberInput v-model="limit" :min="2" :max="12" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Languages" class="z-1" />
</template>
