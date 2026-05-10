<script setup lang="ts">
defineProps<{
  title: string
  value: string
  unit: string
}>()
</script>

<template>
  <CardBase>
    <div class="cv-title">
      {{ title }}
    </div>
    <div class="cv-value">
      {{ value }}
      <span class="cv-unit">{{ unit }}</span>
    </div>
  </CardBase>
</template>

<style scoped>
.cv-title {
  font-size: var(--ct-text-sm);
  color: var(--ct-primary);
  font-weight: var(--ct-weight-medium);
  letter-spacing: var(--ct-tracking-wide);
}
.cv-value {
  font-size: var(--ct-text-2xl);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
  margin-top: 2px;
}
.cv-unit {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-subtle);
  font-weight: var(--ct-weight-regular);
  margin-left: 4px;
}
</style>
