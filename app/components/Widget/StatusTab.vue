<script setup lang="ts">
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

const styleOptions = computed<{ id: WidgetStyle, label: string, proOnly: boolean }[]>(() => [
  { id: 'minimal', label: w.value?.status.styles?.minimal ?? 'Minimal', proOnly: false },
  { id: 'detailed', label: w.value?.status.styles?.detailed ?? 'Detailed', proOnly: true },
])

const accentPresets = [
  { hex: '#10b981', label: 'emerald' },
  { hex: '#0ea5e9', label: 'sky' },
  { hex: '#6366f1', label: 'indigo' },
  { hex: '#f59e0b', label: 'amber' },
  { hex: '#ef4444', label: 'red' },
  { hex: '#a855f7', label: 'violet' },
]

const bgPresets = [
  { hex: '#ffffff', label: 'white' },
  { hex: '#f7f7f8', label: 'paper' },
  { hex: '#0b0d10', label: 'ink' },
  { hex: '#14171c', label: 'graphite' },
  { hex: '#1e293b', label: 'slate' },
  { hex: '#0f172a', label: 'midnight' },
]

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function isValidHex(v: string): boolean {
  return HEX_RE.test(v.trim())
}

function withHash(v: string): string {
  const trimmed = v.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

function stripHash(v: string): string {
  return v.trim().replace(/^#/, '')
}

const accentPreview = computed(() => isValidHex(accentColor.value) ? withHash(accentColor.value) : '')
const bgPreview = computed(() => isValidHex(bgColor.value) ? withHash(bgColor.value) : '')

// Free users: lock to minimal style and reset any custom colors so the preview
// reflects exactly what the upstream SVG endpoint will render.
watch(isPro, (v) => {
  if (!v) {
    styleMode.value = 'minimal'
    accentColor.value = ''
    bgColor.value = ''
  }
}, { immediate: true })

function disableOption(target: 'primary' | 'secondary', value: Slot): boolean {
  if (isPro.value) {
    return false
  }
  if (value !== 'project' && value !== 'language') {
    return false
  }
  const other = target === 'primary' ? secondary.value : primary.value
  const otherSensitive = other === 'project' || other === 'language'
  return otherSensitive && other !== value
}

function setPrimary(v: Slot) {
  if (disableOption('primary', v)) {
    return
  }
  primary.value = v
  if (secondary.value === v && v !== 'none') {
    secondary.value = 'none'
  }
}
function setSecondary(v: Slot) {
  if (disableOption('secondary', v)) {
    return
  }
  secondary.value = v
  if (primary.value === v && v !== 'none') {
    primary.value = 'none'
  }
}

function setStyle(id: WidgetStyle) {
  if (id === 'detailed' && !isPro.value) {
    return
  }
  styleMode.value = id
}

function setAccent(hex: string) {
  if (!isPro.value) {
    return
  }
  accentColor.value = withHash(accentColor.value).toLowerCase() === hex.toLowerCase() ? '' : hex
}

function setBg(hex: string) {
  if (!isPro.value) {
    return
  }
  bgColor.value = withHash(bgColor.value).toLowerCase() === hex.toLowerCase() ? '' : hex
}

const slotOptions: Slot[] = ['project', 'language', 'editor', 'none']

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
    params.color = stripHash(accentColor.value)
  }
  if (isPro.value && isValidHex(bgColor.value)) {
    params.bg = stripHash(bgColor.value)
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
    <div class="form-grid">
      <div class="form-cell">
        <div class="form-label">
          {{ w?.status.style ?? 'Style' }}
        </div>
        <div class="seg">
          <button
            v-for="opt in styleOptions"
            :key="opt.id"
            type="button"
            class="seg-btn"
            :class="styleMode === opt.id ? 'seg-btn-active' : ''"
            :disabled="opt.proOnly && !isPro"
            @click="setStyle(opt.id)"
          >
            {{ opt.label }}
            <span v-if="opt.proOnly && !isPro" class="seg-pro-tag">PRO</span>
          </button>
        </div>
      </div>

      <div class="form-cell">
        <div class="form-label">
          {{ w?.theme.label ?? 'Theme' }}
        </div>
        <div class="seg">
          <button
            v-for="opt in themeOptions"
            :key="opt.id"
            type="button"
            class="seg-btn"
            :class="theme === opt.id ? 'seg-btn-active' : ''"
            @click="theme = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="form-cell">
        <div class="form-label">
          {{ w?.status.color ?? 'Accent color' }}
          <span v-if="!isPro" class="form-pro-tag">PRO</span>
        </div>
        <div class="color-control" :class="!isPro ? 'color-control-disabled' : ''">
          <div class="color-input-wrap">
            <span
              class="color-swatch-preview"
              :style="{ background: accentPreview || 'var(--ct-surface-2)' }"
            />
            <span class="color-hash">#</span>
            <input
              v-model="accentColor"
              class="line-input color-textfield"
              type="text"
              placeholder="10b981"
              autocomplete="off"
              spellcheck="false"
              :disabled="!isPro"
              @input="accentColor = stripHash(accentColor)"
            >
          </div>
          <div class="color-presets">
            <button
              v-for="p in accentPresets"
              :key="p.hex"
              type="button"
              class="color-swatch"
              :class="withHash(accentColor).toLowerCase() === p.hex.toLowerCase() ? 'color-swatch-active' : ''"
              :style="{ background: p.hex }"
              :aria-label="p.label"
              :title="p.label"
              :disabled="!isPro"
              @click="setAccent(p.hex)"
            />
            <button
              type="button"
              class="color-swatch color-swatch-reset"
              :class="!accentColor ? 'color-swatch-active' : ''"
              :title="w?.status.colorDefault ?? 'Default'"
              :disabled="!isPro"
              @click="accentColor = ''"
            >
              <i class="i-tabler-circle-off" />
            </button>
          </div>
        </div>
      </div>

      <div class="form-cell">
        <div class="form-label">
          {{ w?.status.background ?? 'Background' }}
          <span v-if="!isPro" class="form-pro-tag">PRO</span>
        </div>
        <div class="color-control" :class="!isPro ? 'color-control-disabled' : ''">
          <div class="color-input-wrap">
            <span
              class="color-swatch-preview"
              :style="{ background: bgPreview || 'var(--ct-surface-2)' }"
            />
            <span class="color-hash">#</span>
            <input
              v-model="bgColor"
              class="line-input color-textfield"
              type="text"
              placeholder="ffffff"
              autocomplete="off"
              spellcheck="false"
              :disabled="!isPro"
              @input="bgColor = stripHash(bgColor)"
            >
          </div>
          <div class="color-presets">
            <button
              v-for="p in bgPresets"
              :key="p.hex"
              type="button"
              class="color-swatch"
              :class="withHash(bgColor).toLowerCase() === p.hex.toLowerCase() ? 'color-swatch-active' : ''"
              :style="{ background: p.hex }"
              :aria-label="p.label"
              :title="p.label"
              :disabled="!isPro"
              @click="setBg(p.hex)"
            />
            <button
              type="button"
              class="color-swatch color-swatch-reset"
              :class="!bgColor ? 'color-swatch-active' : ''"
              :title="w?.status.colorDefault ?? 'Default'"
              :disabled="!isPro"
              @click="bgColor = ''"
            >
              <i class="i-tabler-circle-off" />
            </button>
          </div>
        </div>
      </div>

      <template v-if="styleMode === 'detailed'">
        <div class="form-cell">
          <div class="form-label">
            {{ w?.status.primary ?? 'Primary slot' }}
          </div>
          <div class="seg">
            <button
              v-for="opt in slotOptions"
              :key="`p-${opt}`"
              type="button"
              class="seg-btn"
              :class="primary === opt ? 'seg-btn-active' : ''"
              :disabled="disableOption('primary', opt)"
              @click="setPrimary(opt)"
            >
              {{ slotLabels[opt] }}
            </button>
          </div>
        </div>

        <div class="form-cell">
          <div class="form-label">
            {{ w?.status.secondary ?? 'Secondary slot' }}
          </div>
          <div class="seg">
            <button
              v-for="opt in slotOptions"
              :key="`s-${opt}`"
              type="button"
              class="seg-btn"
              :class="secondary === opt ? 'seg-btn-active' : ''"
              :disabled="disableOption('secondary', opt)"
              @click="setSecondary(opt)"
            >
              {{ slotLabels[opt] }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Status" class="z-1" />
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr; }
.form-cell { padding: 0.85rem 1rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.form-label { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); display: inline-flex; align-items: center; gap: 0.5rem; }
.form-pro-tag { font-size: 9px; letter-spacing: 0.1em; padding: 1px 6px; border-radius: 999px; background: color-mix(in srgb, var(--ct-primary) 18%, transparent); color: var(--ct-primary); font-weight: var(--ct-weight-semibold); }

.seg { display: inline-flex; border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); overflow: hidden; max-width: 26rem; }
.seg-btn { position: relative; flex: 1; padding: 7px 12px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); background: transparent; border: 0; border-left: 1px solid var(--ct-border-subtle); cursor: pointer; transition: color 160ms ease, background-color 160ms ease; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; }
.seg-btn:first-child { border-left: 0; }
.seg-btn:hover:not(:disabled) { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.seg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.seg-btn-active { color: var(--color-primary-1); background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent); }
.seg-pro-tag { font-size: 9px; letter-spacing: 0.08em; padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, var(--ct-primary) 22%, transparent); color: var(--ct-primary); font-weight: var(--ct-weight-semibold); }

.color-control { display: flex; flex-wrap: wrap; gap: 0.85rem 1.25rem; align-items: center; justify-content: space-between; }
.color-control-disabled { opacity: 0.5; }
.color-input-wrap { display: inline-flex; align-items: center; gap: 0.55rem; flex: 1 1 auto; min-width: 0; }
.color-swatch-preview { display: inline-block; width: 1.5rem; height: 1.5rem; flex-shrink: 0; box-shadow: inset 0 0 0 1px var(--ct-border-strong); border-radius: var(--ct-radius-sm); }
.color-hash { font-family: var(--ct-font-mono); font-size: 13px; color: var(--ct-fg-subtle); flex-shrink: 0; }
.color-textfield { width: 11rem; min-width: 6rem; flex: 1 1 11rem; letter-spacing: 0.05em; font-family: var(--ct-font-mono); }

.color-presets { display: inline-flex; gap: 0.45rem; align-items: center; flex-wrap: wrap; flex-shrink: 0; margin-left: auto; }
.color-swatch { width: 1.4rem; height: 1.4rem; border-radius: 999px; border: 0; cursor: pointer; box-shadow: inset 0 0 0 1px var(--ct-border); transition: transform 160ms ease, box-shadow 160ms ease; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
.color-swatch:hover:not(:disabled) { transform: translateY(-1px); }
.color-swatch:disabled { cursor: not-allowed; transform: none; }
.color-swatch-active { box-shadow: inset 0 0 0 2px var(--ct-bg), 0 0 0 1.5px var(--color-primary-1); }
.color-swatch-reset { background: transparent; color: var(--ct-fg-subtle); font-size: 14px; }

.line-input { display: block; width: 100%; height: 36px; padding: 0 12px; font-size: var(--ct-text-base); color: var(--ct-fg); background: var(--ct-surface); border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); outline: 0; transition: border-color var(--ct-duration-fast) var(--ct-ease), box-shadow var(--ct-duration-fast) var(--ct-ease); }
.line-input:hover:not(:disabled) { border-color: var(--ct-border-strong); }
.line-input:focus { border-color: var(--ct-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent); }
.line-input::placeholder { color: var(--ct-fg-subtle); }
.line-input:disabled { cursor: not-allowed; background: var(--ct-surface-2); }
</style>
