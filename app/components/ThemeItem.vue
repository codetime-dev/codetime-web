<script setup lang="ts">
import type { SchemeString } from '~/composables/useScheme'

const SCHEME_OPTIONS = [
  { value: 'system', icon: 'i-tabler-device-desktop' },
  { value: 'light', icon: 'i-tabler-sun' },
  { value: 'dark', icon: 'i-tabler-moon-stars' },
] as const satisfies ReadonlyArray<{ value: SchemeString, icon: string }>

const t = useI18N()
const scheme = useSchemeString()

const activeIndex = computed(() =>
  SCHEME_OPTIONS.findIndex(o => o.value === scheme.value),
)
</script>

<template>
  <div
    class="theme-switch"
    role="radiogroup"
    :aria-label="t.dashboard.settings.theme.title"
  >
    <span
      class="theme-switch-thumb"
      aria-hidden="true"
      :style="{ '--idx': activeIndex }"
    />
    <button
      v-for="opt in SCHEME_OPTIONS"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="scheme === opt.value"
      class="theme-switch-item"
      :class="{ 'is-active': scheme === opt.value }"
      @click="scheme = opt.value"
    >
      <i :class="opt.icon" class="theme-switch-icon" />
      <span class="theme-switch-label">{{ t.dashboard.settings.theme[opt.value] }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-switch {
  --count: 3;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--count), 1fr);
  gap: 2px;
  padding: 4px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 10px;
  isolation: isolate;
}

.theme-switch-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / var(--count));
  border-radius: 7px;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border-subtle);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  transform: translateX(calc(var(--idx) * 100%));
  transition: transform var(--ct-duration-base, 200ms) var(--ct-ease, cubic-bezier(0.4, 0, 0.2, 1));
  z-index: 0;
}

.theme-switch-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  letter-spacing: 0.01em;
  transition: color var(--ct-duration-fast, 150ms) var(--ct-ease, ease);
}

.theme-switch-item:hover {
  color: var(--ct-fg);
}

.theme-switch-item.is-active {
  color: var(--ct-primary);
}

.theme-switch-item:focus-visible {
  outline: 2px solid var(--ct-primary);
  outline-offset: 2px;
}

.theme-switch-icon {
  font-size: 16px;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .theme-switch-label {
    display: none;
  }
  .theme-switch-item {
    padding: 0 8px;
  }
}
</style>
