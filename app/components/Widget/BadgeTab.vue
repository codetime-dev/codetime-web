<script setup lang="ts">
import { isValidHex, stripHash } from './Form/presets'

const t = useI18N()
const styleOptions = computed(() => [
  { id: 'flat', label: t.value.dashboard.badge.style.flat },
  { id: 'flat-square', label: t.value.dashboard.badge.style.flatSquare },
  { id: 'plastic', label: t.value.dashboard.badge.style.plastic },
  { id: 'for-the-badge', label: t.value.dashboard.badge.style.forTheBadge },
  { id: 'social', label: t.value.dashboard.badge.style.social },
])
const styleId = ref<string>('flat')
const color = ref<string>('0284c7')
const colorPresets = [
  { hex: '#0284c7', label: 'sky' },
  { hex: '#6366f1', label: 'indigo' },
  { hex: '#10b981', label: 'emerald' },
  { hex: '#f59e0b', label: 'amber' },
  { hex: '#ef4444', label: 'red' },
  { hex: '#a855f7', label: 'violet' },
  { hex: '#222222', label: 'graphite' },
]

const user = useUser()
type ScopeOption = { label: string, id: string, kind: 'tag' | 'workspace', color?: string | null, emoji?: string | null }
const scope = ref<ScopeOption | null>(null)
const language = ref<string>('')
const days = ref<number>(0)
// Badge URL is pasted into READMEs / status pages, so it has to be an
// absolute URL that survives without the app.
const apiHost = 'https://codetime.dev'

const rawParams = computed(() => ({
  uid: user.value?.id,
  project: scope.value?.kind === 'workspace' ? scope.value.label : '',
  tag: scope.value?.kind === 'tag' ? scope.value.label : '',
  minutes: String(Number(days.value) * 24 * 60),
  color: isValidHex(color.value) ? stripHash(color.value) : '',
  style: styleId.value,
  language: language.value,
}))

const debouncedParams = refDebounced(rawParams, 300)

const link = computed(() => {
  const params = debouncedParams.value
  const filteredParams = Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '' && key !== 'style' && key !== 'color' && value !== '0')
      .map(([key, value]) => [key, String(value)]),
  )
  const queryString = new URLSearchParams(filteredParams).toString()
  const url = `${apiHost}/v3/users/shield?${queryString}`
  const safeUrl = encodeURIComponent(url)
  return `https://shields.jannchie.com/endpoint?style=${params.style}&color=${encodeURIComponent(params.color)}&url=${safeUrl}`
})
</script>

<template>
  <WidgetPreviewCard :link="link" :height="32" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="style · color · filters" flush>
    <template #icon>
      <i class="i-tabler-adjustments-horizontal text-[15px] text-ct-fg-muted" />
    </template>
    <WidgetFormRow label="Style">
      <WidgetFormSeg v-model="styleId" :options="styleOptions" />
    </WidgetFormRow>
    <WidgetFormRow v-if="styleId !== 'social'" label="Color">
      <WidgetFormColor
        v-model="color"
        :presets="colorPresets"
        :placeholder="t.dashboard.badge.placeholder.color"
      />
    </WidgetFormRow>
    <WidgetFormRow label="Language">
      <EventLanguageSelect v-model="language" />
    </WidgetFormRow>
    <WidgetFormRow label="Scope">
      <WidgetScopeSelect v-model="scope" />
    </WidgetFormRow>
    <WidgetFormRow label="Window · days">
      <WidgetFormNumberInput
        v-model="days"
        :min="0"
        :placeholder="t.dashboard.badge.placeholder.days"
      />
    </WidgetFormRow>
  </PanelSection>

  <WidgetCopyCard :link="link" alt="CodeTime Badge" class="z-1" />
</template>
