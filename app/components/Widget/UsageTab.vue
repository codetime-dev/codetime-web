<script setup lang="ts">
import { ACCENT_PRESETS, BG_PRESETS, isValidHex } from './Form/presets'

type WidgetStyle = 'minimal' | 'detailed'
type RangeId = 'today' | 'week' | 'month' | 'year' | 'all'

const t = useI18N()
const user = useUser()

const theme = ref<'light' | 'dark'>('light')
const styleMode = ref<WidgetStyle>('detailed')
const range = ref<RangeId>('month')
const accentColor = ref<string>('')
const bgColor = ref<string>('')

const isPro = computed(() => String(user.value?.plan ?? 'free').toLowerCase() === 'pro')
const w = computed(() => t.value.dashboard.widget)

const themeOptions = computed(() => [
  { id: 'light' as const, label: w.value?.theme.light ?? 'Light' },
  { id: 'dark' as const, label: w.value?.theme.dark ?? 'Dark' },
])

const styleOptions = computed(() => [
  { id: 'minimal' as const, label: w.value?.usage?.styles?.minimal ?? w.value?.status?.styles?.minimal ?? 'Minimal' },
  { id: 'detailed' as const, label: w.value?.usage?.styles?.detailed ?? w.value?.status?.styles?.detailed ?? 'Detailed', proOnly: true },
])

const rangeOptions = computed(() => {
  const r = w.value?.usage?.ranges
  return [
    { id: 'today' as const, label: r?.today ?? 'Today' },
    { id: 'week' as const, label: r?.week ?? 'This week' },
    { id: 'month' as const, label: r?.month ?? 'This month' },
    { id: 'year' as const, label: r?.year ?? 'This year' },
    { id: 'all' as const, label: r?.all ?? 'All time' },
  ]
})

// On downgrade to free, snap back to the layout / colors the free SVG
// endpoint actually renders so the preview can't diverge from reality.
watch(isPro, (v) => {
  if (!v) {
    styleMode.value = 'minimal'
    accentColor.value = ''
    bgColor.value = ''
  }
}, { immediate: true })

const previewHeight = computed(() => styleMode.value === 'minimal' ? 36 : 132)

const qs = computed(() => {
  if (!user.value?.id) {
    return ''
  }
  const params: Record<string, string> = {
    uid: String(user.value.id),
    theme: theme.value,
    style: styleMode.value,
    range: range.value,
  }
  if (isPro.value && isValidHex(accentColor.value)) {
    params.color = accentColor.value
  }
  if (isPro.value && isValidHex(bgColor.value)) {
    params.bg = bgColor.value
  }
  return new URLSearchParams(params).toString()
})

const previewLink = computed(() => qs.value ? `/api/widgets/usage.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/usage.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="!isPro"
    :text="w?.limit.usageFree ?? w?.limit.statusFreeStyle ?? 'Free plan: minimal style and last-30-day window. Pro unlocks the detailed card, all-time totals, and custom colors.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.usage?.title ?? 'Token & cost usage'" :height="previewHeight" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="range · style · theme · color" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.usage?.range ?? 'Range'">
      <WidgetFormSeg v-model="range" :options="rangeOptions" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.usage?.style ?? w?.status?.style ?? 'Style'">
      <WidgetFormSeg v-model="styleMode" :options="styleOptions" :is-pro="isPro" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.usage?.color ?? w?.status?.color ?? 'Accent color'" :pro-locked="!isPro">
      <WidgetFormColor
        v-model="accentColor"
        :presets="ACCENT_PRESETS"
        :enabled="isPro"
        :reset-title="w?.status?.colorDefault ?? 'Default'"
        placeholder="10b981"
      />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.usage?.background ?? w?.status?.background ?? 'Background'" :pro-locked="!isPro">
      <WidgetFormColor
        v-model="bgColor"
        :presets="BG_PRESETS"
        :enabled="isPro"
        :reset-title="w?.status?.colorDefault ?? 'Default'"
        placeholder="ffffff"
      />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Usage" class="z-1" />
</template>
