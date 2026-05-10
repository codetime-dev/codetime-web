<script setup lang="ts">
import { useSchemeString } from '@roku-ui/vue'

const props = defineProps<{
  theme?: string
}>()

const t = useI18N()
const currentScheme = computed({
  get() {
    if (globalThis.window !== undefined) {
      return document.documentElement.dataset.scheme ?? 'light'
    }
    return 'light'
  },
  set(value: string) {
    if (globalThis.window !== undefined) {
      document.documentElement.dataset.scheme = value
    }
  },
})
const scheme = useSchemeString()
const isCurrent = computed(() => props.theme === scheme.value)
const title = computed(() => {
  switch (props.theme) {
    case 'dark': { return t.value.dashboard.settings.theme.dark
    }
    case 'light': { return t.value.dashboard.settings.theme.light
    }
    case 'system': { return t.value.dashboard.settings.theme.system
    }
  }
  return ''
})
const themeIcon = computed(() => {
  switch (props.theme) {
    case 'dark': { return 'i-tabler-moon-stars'
    }
    case 'light': { return 'i-tabler-sun'
    }
    default: { return 'i-tabler-device-desktop'
    }
  }
})
</script>

<template>
  <button
    type="button"
    class="theme-item"
    :class="isCurrent ? 'theme-item-active' : ''"
    @click="() => currentScheme = props.theme ?? 'system'"
  >
    <span class="theme-head-left">
      <i :class="themeIcon" class="text-sm" />
      <span>{{ title }}</span>
    </span>
    <span v-if="isCurrent" class="theme-head-active">
      <i class="i-tabler-circle-check-filled text-sm" />
    </span>
  </button>
</template>

<style scoped>
.theme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 12px 18px;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
  position: relative;
}
.theme-item:hover { background: var(--ct-surface-1); color: var(--ct-fg); }
.theme-item-active {
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
}
.theme-item-active:hover {
  color: var(--ct-primary);
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
}
.theme-item-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--ct-primary);
}
.theme-head-left { display: inline-flex; align-items: center; gap: 8px; }
.theme-head-active { color: var(--ct-primary); }
</style>
