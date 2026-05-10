<script setup lang="ts">
type Variant = 'surface' | 'subtle' | 'outline' | 'flat'

withDefaults(defineProps<{
  variant?: Variant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}>(), {
  variant: 'surface',
  padding: 'md',
})
</script>

<template>
  <div
    class="u-card"
    :class="[`u-card-${variant}`, `u-card-pad-${padding}`, { 'u-card-hover': hoverable }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.u-card {
  border-radius: 0;
  background: var(--ct-surface);
  color: var(--ct-fg);
  border: 1px solid var(--ct-border);
  transition: border-color var(--ct-duration-base) var(--ct-ease),
              box-shadow var(--ct-duration-base) var(--ct-ease),
              background-color var(--ct-duration-base) var(--ct-ease);
}
.u-card-subtle  { background: var(--ct-surface-1); border-color: var(--ct-border-subtle); }
.u-card-outline { background: transparent; border-color: var(--ct-border); }
.u-card-flat    { background: var(--ct-surface-1); border-color: transparent; }

.u-card-pad-none { padding: 0; }
.u-card-pad-sm   { padding: var(--ct-space-3); }
.u-card-pad-md   { padding: var(--ct-space-5); }
.u-card-pad-lg   { padding: var(--ct-space-6); }

.u-card-hover:hover {
  border-color: var(--ct-border-strong);
  box-shadow: var(--ct-shadow-md);
}
</style>
