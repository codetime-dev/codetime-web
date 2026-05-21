<script setup lang="ts">
import { ACCENT_PRESETS, BG_PRESETS, isValidHex } from './Form/presets'

type Slot = 'project' | 'language' | 'editor' | 'none'
type WidgetStyle = 'minimal' | 'detailed'

const t = useI18N()
const user = useUser()
const theme = ref<'light' | 'dark'>('light')
const primary = ref<Slot>('project')
const secondary = ref<Slot>('language')
const styleMode = ref<WidgetStyle>('detailed')
const accentColor = ref<string>('')
const bgColor = ref<string>('')

const isPro = computed(() => String(user.value?.plan ?? 'free').toLowerCase() === 'pro')
const w = computed(() => t.value.dashboard.widget)

const themeOptions = computed(() => [
  { id: 'light' as const, label: w.value?.theme.light ?? 'Light' },
  { id: 'dark' as const, label: w.value?.theme.dark ?? 'Dark' },
])

const slotLabels = computed(() => ({
  project: w.value?.status.fields?.project ?? 'Project',
  language: w.value?.status.fields?.language ?? 'Language',
  editor: w.value?.status.fields?.editor ?? 'Editor',
  none: w.value?.status.fields?.none ?? 'None',
}))

const styleOptions = computed(() => [
  { id: 'minimal' as const, label: w.value?.status.styles?.minimal ?? 'Minimal' },
  { id: 'detailed' as const, label: w.value?.status.styles?.detailed ?? 'Detailed', proOnly: true },
])

const slotOptions: Slot[] = ['project', 'language', 'editor', 'none']

// Free users may surface AT MOST ONE of {project, language} per card,
// so disable whichever sensitive value is already taken by the other
// slot — matches the gating in /v3/users/{uid}/public/status.
function isSlotDisabled(target: 'primary' | 'secondary', value: Slot): boolean {
  if (isPro.value || (value !== 'project' && value !== 'language')) {
    return false
  }
  const other = target === 'primary' ? secondary.value : primary.value
  return (other === 'project' || other === 'language') && other !== value
}

const primaryOptions = computed(() => slotOptions.map(s => ({
  id: s,
  label: slotLabels.value[s],
  disabled: isSlotDisabled('primary', s),
})))
const secondaryOptions = computed(() => slotOptions.map(s => ({
  id: s,
  label: slotLabels.value[s],
  disabled: isSlotDisabled('secondary', s),
})))

watch(isPro, (v) => {
  if (!v) {
    styleMode.value = 'minimal'
    accentColor.value = ''
    bgColor.value = ''
  }
}, { immediate: true })

// Mirror what the SVG renderer does when both slots collide: push the
// conflicting slot to `none` so the preview never shows duplicates.
watch(primary, (v) => {
  if (v !== 'none' && v === secondary.value) {
    secondary.value = 'none'
  }
})
watch(secondary, (v) => {
  if (v !== 'none' && v === primary.value) {
    primary.value = 'none'
  }
})

const previewHeight = computed(() => styleMode.value === 'minimal' ? 36 : 116)

const qs = computed(() => {
  if (!user.value?.id) {
    return ''
  }
  const params: Record<string, string> = {
    uid: String(user.value.id),
    theme: theme.value,
    style: styleMode.value,
  }
  if (styleMode.value === 'detailed') {
    params.primary = primary.value
    params.secondary = secondary.value
  }
  if (isPro.value && isValidHex(accentColor.value)) {
    params.color = accentColor.value
  }
  if (isPro.value && isValidHex(bgColor.value)) {
    params.bg = bgColor.value
  }
  return new URLSearchParams(params).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/status.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/status.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="!isPro"
    :text="w?.limit.statusFreeStyle ?? w?.limit.statusFree ?? 'Free plan: minimal style only. Pro unlocks the detailed card and custom colors.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.status.title ?? 'Currently coding'" :height="previewHeight" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" :meta="styleMode === 'minimal' ? 'style · theme · color' : 'style · theme · color · layout'" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow :label="w?.status.style ?? 'Style'">
      <WidgetFormSeg v-model="styleMode" :options="styleOptions" :is-pro="isPro" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.theme.label ?? 'Theme'">
      <WidgetFormSeg v-model="theme" :options="themeOptions" />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.status.color ?? 'Accent color'" :pro-locked="!isPro">
      <WidgetFormColor
        v-model="accentColor"
        :presets="ACCENT_PRESETS"
        :enabled="isPro"
        :reset-title="w?.status?.colorDefault ?? 'Default'"
        placeholder="10b981"
      />
    </WidgetFormRow>
    <WidgetFormRow :label="w?.status.background ?? 'Background'" :pro-locked="!isPro">
      <WidgetFormColor
        v-model="bgColor"
        :presets="BG_PRESETS"
        :enabled="isPro"
        :reset-title="w?.status?.colorDefault ?? 'Default'"
        placeholder="ffffff"
      />
    </WidgetFormRow>
    <template v-if="styleMode === 'detailed'">
      <WidgetFormRow :label="w?.status.primary ?? 'Primary slot'">
        <WidgetFormSeg v-model="primary" :options="primaryOptions" />
      </WidgetFormRow>
      <WidgetFormRow :label="w?.status.secondary ?? 'Secondary slot'">
        <WidgetFormSeg v-model="secondary" :options="secondaryOptions" />
      </WidgetFormRow>
    </template>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Status" class="z-1" />
</template>
