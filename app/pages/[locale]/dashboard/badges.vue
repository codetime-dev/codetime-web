<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})
const t = useI18N()
const styleOptions = computed(() => [
  { label: t.value.dashboard.badge.style.flat, id: 'flat' },
  { label: t.value.dashboard.badge.style.flatSquare, id: 'flat-square' },
  { label: t.value.dashboard.badge.style.plastic, id: 'plastic' },
  { label: t.value.dashboard.badge.style.forTheBadge, id: 'for-the-badge' },
  { label: t.value.dashboard.badge.style.social, id: 'social' },
])
const styleObj = ref(styleOptions.value[0])
const color = ref<string>('0284c7')
const colorPresets = [
  { hex: '0284c7', label: 'sky' },
  { hex: '6366f1', label: 'indigo' },
  { hex: '10b981', label: 'emerald' },
  { hex: 'f59e0b', label: 'amber' },
  { hex: 'ef4444', label: 'red' },
  { hex: 'a855f7', label: 'violet' },
  { hex: '222222', label: 'graphite' },
]
const user = useUser()
const project = ref<{
  label: string
  id: string
} | null>(null)
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
  project: project.value?.id,
  minutes: String(Number(days.value) * 24 * 60),
  color: color.value,
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
  return `https://shields.jannchie.com/endpoint?style=${params.style}&color=${params.color}&url=${safeUrl}`
})
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.badge"
    :description="t.dashboard.pageHeader.description.badge"
  />
  <DashboardPageContent>
    <BadgePreviewCard :link="link" />

    <PanelSection num="02" title="CONFIGURE" meta="STYLE · COLOR · FILTERS" flush>
      <template #icon>
        <i class="i-tabler-adjustments-horizontal text-surface-dimmed/70 text-[15px]" />
      </template>

      <div class="badge-form">
        <!-- STYLE -->
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

        <!-- COLOR -->
        <div v-if="styleObj?.id !== 'social'" class="badge-row">
          <div class="badge-row-label">
            <span class="badge-label-num">b</span>
            <span>color</span>
          </div>
          <div class="badge-row-control badge-color-row">
            <div class="badge-color-input">
              <span class="badge-color-swatch" :style="{ background: `#${color}` }" />
              <span class="badge-color-hash">#</span>
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
                :class="color.toLowerCase() === p.hex.toLowerCase() ? 'badge-color-preset-active' : ''"
                :style="{ background: `#${p.hex}` }"
                :aria-label="p.label"
                :title="p.label"
                @click="selectColor(p.hex)"
              />
            </div>
          </div>
        </div>

        <!-- FILTERS: language / project / days -->
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
                <input
                  v-model="language"
                  class="line-input"
                  type="text"
                  :placeholder="t.dashboard.badge.placeholder.language"
                  autocomplete="off"
                  spellcheck="false"
                >
              </div>
              <div class="badge-filter-cell">
                <div class="badge-filter-label">
                  project
                </div>
                <ProjectSelect v-model="project" />
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

    <BadgeCopyCard :link="link" class="z-1" />
  </DashboardPageContent>
</template>

<style scoped>
.badge-form {
  display: flex;
  flex-direction: column;
}

/* Hairline-separated rows; label fixed-width left, control fills right */
.badge-row {
  display: grid;
  grid-template-columns: 9rem 1fr;
  align-items: stretch;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.badge-row:first-child {
  border-top: 0;
}

.badge-row-label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 1rem 1.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  opacity: 0.85;
  border-right: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.badge-label-num {
  color: var(--color-primary-1);
  font-weight: 500;
}

.badge-row-control {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0.65rem 1rem;
}

.badge-row-control-flush {
  padding: 0;
}

/* STYLE segmented — full-width hover, no underline, no padding */
.badge-style-group {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;
}

.badge-style-btn {
  align-self: stretch;
  padding: 0;
  height: 100%;
  min-height: 3rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  background: transparent;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 25%, transparent);
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.badge-style-btn:first-child {
  border-left: 0;
}

.badge-style-btn:hover {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.22);
}

.badge-style-btn-active {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.badge-style-btn-active:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 22%, transparent);
}

/* COLOR row */
.badge-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.25rem;
  align-items: center;
  justify-content: space-between;
}

.badge-color-input {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-grow: 1;
  min-width: 0;
}

.badge-color-swatch {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 70%, transparent);
}

.badge-color-hash {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

.badge-color-textfield {
  width: 11rem;
  flex-shrink: 0;
  letter-spacing: 0.05em;
  text-transform: lowercase;
}

.badge-color-presets {
  display: inline-flex;
  gap: 0.45rem;
  margin-left: auto;
}

.badge-color-preset {
  width: 1.4rem;
  height: 1.4rem;
  border: 0;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-surface-border-color) 50%, transparent);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.badge-color-preset:hover {
  transform: translateY(-1px);
}

.badge-color-preset-active {
  box-shadow:
    inset 0 0 0 1px var(--r-surface-background-base-color),
    0 0 0 1px var(--color-primary-1);
}

/* FILTERS grid — three equal columns separated by hairlines */
.badge-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

@media (min-width: 768px) {
  .badge-filter-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .badge-filter-grid > .badge-filter-cell + .badge-filter-cell {
    border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
  }
}

@media (max-width: 767px) {
  .badge-filter-grid > .badge-filter-cell + .badge-filter-cell {
    border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
  }
}

.badge-filter-cell {
  padding: 0.85rem 1rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.badge-filter-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
}

/* Shared input style: borderless, slight bg, full width, h-9 */
.line-input {
  display: block;
  width: 100%;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  outline: 0;
  transition: background-color 180ms ease, box-shadow 180ms ease;
}

.line-input:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.26);
}

.line-input:focus {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
  box-shadow: inset 0 -1px 0 var(--color-primary-1);
}

.line-input::placeholder {
  color: color-mix(in srgb, var(--r-surface-text-color) 35%, transparent);
}

/* Number spinner removal */
.line-input[type="number"]::-webkit-outer-spin-button,
.line-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.line-input[type="number"] {
  -moz-appearance: textfield;
}

/* Make narrow screens stack label above control */
@media (max-width: 639px) {
  .badge-row {
    grid-template-columns: 1fr;
  }
  .badge-row-label {
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
    padding: 0.7rem 1rem;
  }
  .badge-style-group {
    grid-template-columns: repeat(2, 1fr);
  }
  .badge-style-btn:nth-child(odd) {
    border-left: 0;
  }
}
</style>
