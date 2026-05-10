<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
}>()
</script>

<template>
  <div class="db">
    <div class="db-title">
      {{ title }}
    </div>
    <div v-if="value !== ''" class="db-value tabular-nums">
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
</style>
