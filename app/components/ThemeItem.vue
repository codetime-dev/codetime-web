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
  padding: 0.7rem 1.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 60%, transparent);
  transition: background-color 180ms ease;
  position: relative;
}

.theme-item:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.14);
}

.theme-item-active {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 8%, transparent);
}

.theme-item-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary-1);
}

.theme-head-left {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.theme-head-active {
  color: var(--color-primary-1);
}
</style>
