<script setup lang="ts">
const t = useI18N()
const styleOptions = computed(() => [
  { label: t.value.dashboard.badge.style.flat, id: 'flat' },
  { label: t.value.dashboard.badge.style.flatSquare, id: 'flat-square' },
  { label: t.value.dashboard.badge.style.plastic, id: 'plastic' },
  { label: t.value.dashboard.badge.style.forTheBadge, id: 'for-the-badge' },
  { label: t.value.dashboard.badge.style.social, id: 'social' },
])
const styleObj = ref(styleOptions.value[0])
const color = ref<string>('#0284c7')
const colorPresets = [
  { hex: '#0284c7', label: 'sky' },
  { hex: '#6366f1', label: 'indigo' },
  { hex: '#10b981', label: 'emerald' },
  { hex: '#f59e0b', label: 'amber' },
  { hex: '#ef4444', label: 'red' },
  { hex: '#a855f7', label: 'violet' },
  { hex: '#222222', label: 'graphite' },
]
function normalizedColor(value: string) {
  const v = (value ?? '').trim()
  if (!v) {
    return ''
  }
  return /^[0-9a-f]{3,8}$/i.test(v) ? `#${v}` : v
}
const user = useUser()
type ScopeOption = { label: string, id: string, kind: 'tag' | 'workspace', color?: string | null, emoji?: string | null }
const scope = ref<ScopeOption | null>(null)
const language = ref<string>('')
const days = ref<string>('')
const apiHost = 'https://api.codetime.dev'

function selectStyle(id: string) {
  const found = styleOptions.value.find(s => s.id === id)
  if (found) {
    styleObj.value = found
  }
}
function selectColor(hex: string) {
  color.value = hex
}

const rawParams = computed(() => ({
  uid: user.value?.id,
  project: scope.value?.kind === 'workspace' ? scope.value.label : '',
  tag: scope.value?.kind === 'tag' ? scope.value.label : '',
  minutes: String(Number(days.value) * 24 * 60),
  color: normalizedColor(color.value).replace(/^#/, ''),
  style: styleObj.value?.id ?? '',
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

    <div class="badge-form">
      <div class="badge-row">
        <div class="badge-row-label">
          <span class="badge-label-num">a</span>
          <span>style</span>
        </div>
        <div class="badge-row-control badge-row-control-flush">
          <div class="badge-style-group">
            <button
              v-for="opt in styleOptions"
              :key="opt.id"
              type="button"
              class="badge-style-btn"
              :class="styleObj?.id === opt.id ? 'badge-style-btn-active' : ''"
              @click="selectStyle(opt.id)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="styleObj?.id !== 'social'" class="badge-row">
        <div class="badge-row-label">
          <span class="badge-label-num">b</span>
          <span>color</span>
        </div>
        <div class="badge-row-control badge-color-row">
          <div class="badge-color-input">
            <span class="badge-color-swatch" :style="{ background: normalizedColor(color) }" />
            <input
              v-model="color"
              class="line-input badge-color-textfield"
              type="text"
              :placeholder="t.dashboard.badge.placeholder.color"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <div class="badge-color-presets">
            <button
              v-for="p in colorPresets"
              :key="p.hex"
              type="button"
              class="badge-color-preset"
              :class="normalizedColor(color).toLowerCase() === p.hex.toLowerCase() ? 'badge-color-preset-active' : ''"
              :style="{ background: p.hex }"
              :aria-label="p.label"
              :title="p.label"
              @click="selectColor(p.hex)"
            />
          </div>
        </div>
      </div>

      <div class="badge-row badge-row-filters">
        <div class="badge-row-label">
          <span class="badge-label-num">c</span>
          <span>filters</span>
        </div>
        <div class="badge-row-control badge-row-control-flush">
          <div class="badge-filter-grid">
            <div class="badge-filter-cell">
              <div class="badge-filter-label">
                language
              </div>
              <EventLanguageSelect v-model="language" />
            </div>
            <div class="badge-filter-cell">
              <div class="badge-filter-label">
                scope
              </div>
              <WidgetScopeSelect v-model="scope" />
            </div>
            <div class="badge-filter-cell">
              <div class="badge-filter-label">
                days · window
              </div>
              <input
                v-model="days"
                class="line-input"
                type="number"
                min="0"
                :placeholder="t.dashboard.badge.placeholder.days"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </PanelSection>

  <WidgetCopyCard :link="link" alt="CodeTime Badge" class="z-1" />
</template>

<style scoped>
.badge-form { display: flex; flex-direction: column; }
.badge-row { display: grid; grid-template-columns: 9rem 1fr; align-items: stretch; border-top: 1px solid var(--ct-border-subtle); }
.badge-row:first-child { border-top: 0; }
.badge-row-label { display: inline-flex; align-items: center; gap: 8px; padding: 16px 18px; font-size: var(--ct-text-sm); font-weight: var(--ct-weight-medium); color: var(--ct-fg-muted); border-right: 1px solid var(--ct-border-subtle); }
.badge-label-num { color: var(--ct-primary); font-weight: var(--ct-weight-semibold); font-family: var(--ct-font-mono); }
.badge-row-control { display: flex; align-items: center; min-width: 0; padding: 0.65rem 1rem; }
.badge-row-control-flush { padding: 0; }

.badge-style-group { display: grid; grid-template-columns: repeat(5, 1fr); width: 100%; }
.badge-style-btn { align-self: stretch; padding: 0; height: 100%; min-height: 3rem; font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); background: transparent; border: 0; border-left: 1px solid var(--ct-border-subtle); cursor: pointer; transition: color 180ms ease, background-color 180ms ease; }
.badge-style-btn:first-child { border-left: 0; }
.badge-style-btn:hover { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.badge-style-btn-active { color: var(--color-primary-1); background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent); }
.badge-style-btn-active:hover { background-color: color-mix(in srgb, var(--color-primary-1) 22%, transparent); }

.badge-color-row { display: flex; flex-wrap: wrap; gap: 0.85rem 1.25rem; align-items: center; justify-content: space-between; }
.badge-color-input { display: inline-flex; align-items: center; gap: 0.55rem; flex: 1 1 auto; min-width: 0; }
.badge-color-swatch { display: inline-block; width: 1.5rem; height: 1.5rem; flex-shrink: 0; box-shadow: inset 0 0 0 1px var(--ct-border-strong); }
.badge-color-textfield { width: 11rem; min-width: 6rem; flex: 1 1 11rem; letter-spacing: 0.05em; }
.badge-color-presets { display: inline-flex; flex-wrap: wrap; gap: 0.45rem; flex-shrink: 0; margin-left: auto; }
.badge-color-preset { width: 1.4rem; height: 1.4rem; border: 0; cursor: pointer; position: relative; box-shadow: inset 0 0 0 1px var(--ct-border); transition: transform 160ms ease, box-shadow 160ms ease; }
.badge-color-preset:hover { transform: translateY(-1px); }
.badge-color-preset-active { box-shadow: inset 0 0 0 1px var(--ct-bg), 0 0 0 1px var(--color-primary-1); }

.badge-filter-grid { display: grid; grid-template-columns: 1fr; width: 100%; }
@media (min-width: 768px) {
  .badge-filter-grid { grid-template-columns: 1fr 1fr 1fr; }
  .badge-filter-grid > .badge-filter-cell + .badge-filter-cell { border-left: 1px solid var(--ct-border-subtle); }
}
@media (max-width: 767px) {
  .badge-filter-grid > .badge-filter-cell + .badge-filter-cell { border-top: 1px solid var(--ct-border-subtle); }
}
.badge-filter-cell { padding: 0.85rem 1rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.badge-filter-label { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }

.line-input { display: block; width: 100%; height: 36px; padding: 0 12px; font-family: var(--ct-font-sans); font-size: var(--ct-text-base); color: var(--ct-fg); background: var(--ct-surface); border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); outline: 0; transition: border-color var(--ct-duration-fast) var(--ct-ease), box-shadow var(--ct-duration-fast) var(--ct-ease); }
.line-input:hover { border-color: var(--ct-border-strong); }
.line-input:focus { border-color: var(--ct-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent); }
.line-input::placeholder { color: var(--ct-fg-subtle); }
.line-input[type="number"]::-webkit-outer-spin-button,
.line-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.line-input[type="number"] { -moz-appearance: textfield; }

@media (max-width: 639px) {
  .badge-row { grid-template-columns: 1fr; }
  .badge-row-label { border-right: 0; border-bottom: 1px solid var(--ct-border-subtle); padding: 0.7rem 1rem; }
  .badge-style-group { grid-template-columns: repeat(2, 1fr); }
  .badge-style-btn:nth-child(odd) { border-left: 0; }
}
</style>
