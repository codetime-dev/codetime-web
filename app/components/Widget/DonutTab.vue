<script setup lang="ts">
type DonutMode = 'languages' | 'projects'

const t = useI18N()
const user = useUser()

const mode = ref<DonutMode>('languages')
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
const modeOptions = computed(() => [
  { id: 'languages' as const, label: w.value?.donut.modeLanguages ?? 'Languages' },
  { id: 'projects' as const, label: w.value?.donut.modeProjects ?? 'Projects' },
])

const rawParams = computed(() => ({
  uid: user.value?.id,
  mode: mode.value,
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
  const params: Record<string, string> = {
    uid: String(p.uid),
    days: String(p.days),
    limit: String(p.limit),
    theme: p.theme,
  }
  // Keep the default URL clean for the languages mode — appending `mode=`
  // only when needed avoids invalidating already-embedded share links.
  if (p.mode === 'projects') {
    params.mode = 'projects'
  }
  return new URLSearchParams(params).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/donut.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/donut.svg?${qs.value}` : '')
const previewTitle = computed(() => mode.value === 'projects'
  ? (w.value?.donut.titleProjects ?? 'Top projects')
  : (w.value?.donut.title ?? 'Top languages'))
const limitLabel = computed(() => mode.value === 'projects'
  ? (w.value?.donut.limitProjects ?? 'Projects')
  : (w.value?.donut.limit ?? 'Languages'))
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

  <WidgetPreviewCard :link="previewLink" :title="previewTitle" :height="180" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="mode · window · count · theme" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.donut.mode ?? 'Mode'">
      <WidgetFormSeg v-model="mode" :options="modeOptions" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.donut.days ?? 'Days'">
      <WidgetFormNumberInput v-model="days" :min="1" :max="365" />
    </WidgetFormRow>
    <WidgetFormRow :label="limitLabel">
      <WidgetFormNumberInput v-model="limit" :min="2" :max="12" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Languages" class="z-1" />
</template>
