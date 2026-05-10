<script setup lang="ts">
type Level = 'base' | 'raised' | 'sunk'

withDefaults(defineProps<{
  level?: Level
  bordered?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
}>(), {
  level: 'base',
  bordered: false,
  rounded: 'none',
})
</script>

<template>
  <div
    class="u-surface"
    :class="[`u-surface-${level}`, `u-surface-r-${rounded}`, { 'u-surface-bordered': bordered }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.u-surface { color: var(--ct-fg); transition: background-color var(--ct-duration-base) var(--ct-ease); }
.u-surface-base   { background: var(--ct-surface); }
.u-surface-raised { background: var(--ct-surface-1); }
.u-surface-sunk   { background: var(--ct-surface-2); }
.u-surface-bordered { border: 1px solid var(--ct-border); }
.u-surface-r-none { border-radius: 0; }
.u-surface-r-sm { border-radius: var(--ct-radius-sm); }
.u-surface-r-md { border-radius: var(--ct-radius-md); }
.u-surface-r-lg { border-radius: var(--ct-radius-lg); }
.u-surface-r-xl { border-radius: var(--ct-radius-xl); }
</style>
