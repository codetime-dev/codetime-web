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
// Preview hits the current origin so dev / preview deploys also work.
const previewLink = computed(() => qs.value ? `/api/widgets/donut.svg?${qs.value}` : '')
// Embed link is always the canonical production URL.
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

    <div class="form-grid">
      <div class="form-cell">
        <div class="form-label">
          {{ w?.donut.days ?? 'Days' }}
        </div>
        <input v-model.number="days" class="line-input" type="number" min="1" max="365">
      </div>
      <div class="form-cell">
        <div class="form-label">
          {{ w?.donut.limit ?? 'Languages' }}
        </div>
        <input v-model.number="limit" class="line-input" type="number" min="2" max="12">
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
    </div>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Languages" class="z-1" />
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr; }
@media (min-width: 768px) {
  .form-grid { grid-template-columns: 1fr 1fr 1fr; }
  .form-grid > .form-cell + .form-cell { border-left: 1px solid var(--ct-border-subtle); }
}
@media (max-width: 767px) {
  .form-grid > .form-cell + .form-cell { border-top: 1px solid var(--ct-border-subtle); }
}
.form-cell { padding: 0.85rem 1rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.form-label { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }

.seg { display: inline-flex; border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); overflow: hidden; }
.seg-btn { flex: 1; padding: 7px 12px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); background: transparent; border: 0; border-left: 1px solid var(--ct-border-subtle); cursor: pointer; transition: color 160ms ease, background-color 160ms ease; }
.seg-btn:first-child { border-left: 0; }
.seg-btn:hover { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.seg-btn-active { color: var(--color-primary-1); background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent); }

.line-input { display: block; width: 100%; height: 36px; padding: 0 12px; font-family: var(--ct-font-sans); font-size: var(--ct-text-base); color: var(--ct-fg); background: var(--ct-surface); border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); outline: 0; transition: border-color var(--ct-duration-fast) var(--ct-ease), box-shadow var(--ct-duration-fast) var(--ct-ease); }
.line-input:focus { border-color: var(--ct-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-primary) 18%, transparent); }
</style>
