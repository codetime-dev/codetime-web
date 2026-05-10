<script setup lang="ts">
type Slot = 'project' | 'language' | 'editor' | 'none'

const t = useI18N()
const user = useUser()
const theme = ref<'light' | 'dark'>('light')
const primary = ref<Slot>('project')
const secondary = ref<Slot>('language')

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

// Free plan: at most one of {project, language} across both slots.
function disableOption(target: 'primary' | 'secondary', value: Slot): boolean {
  if (isPro.value) {
    return false
  }
  if (value !== 'project' && value !== 'language') {
    return false
  }
  const other = target === 'primary' ? secondary.value : primary.value
  const otherSensitive = other === 'project' || other === 'language'
  // Only block the *opposite* sensitive field — picking the same field as the
  // other slot is handled by the dedup check below (and is harmless).
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

const slotOptions: Slot[] = ['project', 'language', 'editor', 'none']

const qs = computed(() => {
  if (!user.value?.id) {
    return ''
  }
  return new URLSearchParams({
    uid: String(user.value.id),
    theme: theme.value,
    primary: primary.value,
    secondary: secondary.value,
  }).toString()
})
const previewLink = computed(() => qs.value ? `/api/widgets/status.svg?${qs.value}` : '')
const embedLink = computed(() => qs.value ? `https://codetime.dev/api/widgets/status.svg?${qs.value}` : '')
</script>

<template>
  <WidgetPlanLimitNotice
    v-if="!isPro"
    :text="w?.limit.statusFree ?? 'Free plan: pick project name OR language. Pro shows both.'"
    :cta-text="w?.limit.upgrade ?? 'Upgrade'"
  />

  <WidgetPreviewCard :link="previewLink" :title="w?.status.title ?? 'Currently coding'" :height="116" />

  <PanelSection num="02" :title="t.dashboard.badge.configure" meta="theme · layout" flush>
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
    </div>
  </PanelSection>

  <WidgetCopyCard :link="embedLink" alt="CodeTime Status" class="z-1" />
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr; }
.form-cell { padding: 0.85rem 1rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
.form-label { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }
.seg { display: inline-flex; border: 1px solid var(--ct-border); border-radius: var(--ct-radius-lg); overflow: hidden; max-width: 26rem; }
.seg-btn { flex: 1; padding: 7px 12px; font-size: var(--ct-text-sm); color: var(--ct-fg-muted); background: transparent; border: 0; border-left: 1px solid var(--ct-border-subtle); cursor: pointer; transition: color 160ms ease, background-color 160ms ease; }
.seg-btn:first-child { border-left: 0; }
.seg-btn:hover:not(:disabled) { color: var(--ct-fg); background-color: var(--ct-surface-2); }
.seg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.seg-btn-active { color: var(--color-primary-1); background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent); }
</style>
