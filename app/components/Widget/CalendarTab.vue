<script setup lang="ts">
const t = useI18N()
const user = useUser()

const theme = ref<'light' | 'dark'>('light')

const isPro = computed(() => String(user.value?.plan ?? 'free').toLowerCase() === 'pro')

const w = computed(() => t.value.dashboard.widget)
const themeOptions = computed(() => [
  { id: 'light' as const, label: w.value?.theme.light ?? 'Light' },
  { id: 'dark' as const, label: w.value?.theme.dark ?? 'Dark' },
])

const rawParams = computed(() => ({
  uid: user.value?.id,
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
    theme: p.theme,
  }).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/calendar.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/calendar.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="!isPro"
    :text="w?.limit.calendarFree ?? 'Free plan shows the last 90 days. Pro unlocks the full 365-day calendar.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.calendar?.title ?? 'Activity calendar'" :height="138" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="theme" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Activity Calendar" class="z-1" />
</template>
