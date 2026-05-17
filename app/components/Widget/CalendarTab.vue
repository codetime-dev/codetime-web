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

    <div class="form-grid">
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

  <WidgetCopyCard :link="embedLink" alt="CodeTime Activity Calendar" class="z-1" />
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr; }
.form-cell { padding: 0.85rem 1rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.form-label { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }

.seg { display: inline-flex; border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); overflow: hidden; }
.seg-btn { flex: 1; padding: 7px 12px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); background: transparent; border: 0; border-left: 1px solid var(--ct-border-subtle); cursor: pointer; transition: color 160ms ease, background-color 160ms ease; }
.seg-btn:first-child { border-left: 0; }
.seg-btn:hover { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.seg-btn-active { color: var(--color-primary-1); background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent); }
</style>
