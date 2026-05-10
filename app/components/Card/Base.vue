<script setup lang="ts">
defineProps<{
  loading?: boolean
  withBorder?: boolean
  sparse?: boolean
  noPadding?: boolean
  color?: 'primary' | 'secondary' | 'surface' | 'error' | 'success' | 'warning'
}>()
</script>

<template>
  <div
    class="card-base"
    :class="[
      noPadding ? '' : (sparse ? 'card-pad-lg' : 'card-pad-md'),
      { 'card-bordered': withBorder, 'card-loading': loading },
    ]"
  >
    <slot />
    <div v-if="loading" class="card-skeleton" />
  </div>
</template>

<style scoped>
.card-base {
  position: relative;
  background: transparent;
  color: var(--ct-fg);
  border: 1px solid var(--ct-border);
  border-radius: 0;
  transition: background-color var(--ct-duration-base) var(--ct-ease),
              border-color var(--ct-duration-base) var(--ct-ease);
}
.card-bordered { border-color: var(--ct-border-strong); }
.card-loading  { pointer-events: none; }
.card-pad-md { padding: 14px 16px; }
.card-pad-lg { padding: 16px 20px; }
.card-skeleton {
  position: absolute;
  inset: 0;
  background: var(--ct-surface-2);
  border-radius: inherit;
  animation: card-pulse 1.4s ease-in-out infinite;
}
@keyframes card-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}
</style>
