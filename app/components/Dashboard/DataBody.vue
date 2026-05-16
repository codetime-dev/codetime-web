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
    >
      <span class="db-skeleton-bar" :style="{ width: skeletonWidth }" />
    </div>
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
  line-height: var(--ct-leading-normal);
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
/* The skeleton wrapper keeps the same line-box as .db-value (font-size
   × line-height), so toggling loading doesn't shift the surrounding
   layout. The visible bar inside is intentionally shorter than the line
   box, centered vertically, matching how the glyph ink-box sits within
   its line. */
.db-skeleton {
  display: flex;
  align-items: center;
  /* Flex containers ignore line-height for sizing, so force the wrapper
     to match the rendered line box (font-size × line-height). Without
     this the wrapper collapses to the bar's height and the card looks
     shorter while loading. */
  min-height: calc(var(--ct-text-lg) * var(--ct-leading-normal));
}
.db-skeleton-bar {
  display: block;
  background: var(--ct-surface-2);
  border-radius: 4px;
  height: 1.1em;
  animation: db-pulse 1.4s ease-in-out infinite;
}
@keyframes db-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
