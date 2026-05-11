<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  value?: string | number
  loading?: boolean
  /**
   * Width hint for the loading skeleton bar. Matched to the expected
   * value width so the skeleton → value swap doesn't shift neighbours.
   */
  skeletonWidth?: string
}>(), {
  value: '',
  loading: false,
  skeletonWidth: '4.5rem',
})
</script>

<template>
  <div class="db">
    <div class="db-title">
      {{ title }}
    </div>
    <div
      v-if="loading"
      class="db-value db-skeleton"
      :style="{ width: skeletonWidth }"
    />
    <div v-else-if="value !== ''" class="db-value tabular-nums">
      {{ value }}
    </div>
    <div v-else class="db-empty">
      —
    </div>
  </div>
</template>

<style scoped>
.db {
  padding: 12px 14px;
}
.db-title {
  font-size: var(--ct-text-xs);
  color: var(--ct-primary);
  font-weight: var(--ct-weight-medium);
  letter-spacing: var(--ct-tracking-wide);
}
.db-value {
  margin-top: 4px;
  font-size: var(--ct-text-lg);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  white-space: nowrap;
  letter-spacing: var(--ct-tracking-normal);
  font-feature-settings: "tnum" 1;
}
.db-empty {
  margin-top: 4px;
  font-size: var(--ct-text-lg);
  color: var(--ct-fg-subtle);
}
/* Match the rendered .db-value height (font-size 18px ≈ 1.125rem with
   line-height ~1.4) so the skeleton occupies the same vertical space
   as the final number. */
.db-skeleton {
  background: var(--ct-surface-2);
  border-radius: 4px;
  height: 1.25rem;
  animation: db-pulse 1.4s ease-in-out infinite;
}
@keyframes db-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
