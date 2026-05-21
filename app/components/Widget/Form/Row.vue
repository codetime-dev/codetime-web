<script setup lang="ts">
defineProps<{
  label: string
  proLocked?: boolean
}>()
</script>

<template>
  <div class="widget-row">
    <div class="widget-row-label">
      <span>{{ label }}</span>
      <span v-if="proLocked" class="widget-row-pro">PRO</span>
    </div>
    <div class="widget-row-control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.widget-row {
  display: grid;
  grid-template-columns: 9rem 1fr;
  align-items: stretch;
  border-top: 1px solid var(--ct-border-subtle);
}
.widget-row:first-child { border-top: 0; }

.widget-row-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  border-right: 1px solid var(--ct-border-subtle);
}
.widget-row-pro {
  font-size: 9px;
  letter-spacing: 0.1em;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ct-primary) 18%, transparent);
  color: var(--ct-primary);
  font-weight: var(--ct-weight-semibold);
}

.widget-row-control {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 10px 14px;
}

@media (max-width: 639px) {
  .widget-row {
    grid-template-columns: 1fr;
  }
  .widget-row-label {
    border-right: 0;
    border-bottom: 1px solid var(--ct-border-subtle);
    padding: 10px 14px;
  }
}
</style>
