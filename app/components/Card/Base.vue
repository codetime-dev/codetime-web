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
    class="card-base bg-surface-variant-1/25 relative"
    :class="[
      noPadding ? '' : (sparse ? 'px-5 py-4' : 'px-4 py-3.5'),
      loading ? 'pointer-events-none' : '',
    ]"
  >
    <slot />
    <div
      v-if="loading"
      class="bg-surface-variant-1/40 inset-0 absolute animate-pulse"
    />
  </div>
</template>
