<script setup lang="ts">
// Compact preset list shown when the user opens the data-range dropdown.
// Emits the selected preset id and a marker for "custom" so the parent
// can swap in the calendar instead.

export type PresetId
  = | 'today'
  | 'last24h'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'ytd'
  | 'all'
  | 'custom'

type Item = {
  id: PresetId
  label: string
  proLocked: boolean
  active: boolean
}

defineProps<{ items: Item[] }>()
const emit = defineEmits<{
  (e: 'pick', id: PresetId): void
}>()
</script>

<template>
  <div class="pm-root" role="menu">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="menuitem"
      class="pm-item"
      :class="{ active: item.active, pro: item.proLocked }"
      @click="emit('pick', item.id)"
    >
      <span class="pm-label">{{ item.label }}</span>
      <span v-if="item.proLocked" class="pm-pro">
        <i class="i-tabler-crown" />
      </span>
      <span v-else-if="item.active" class="pm-check">
        <i class="i-tabler-check" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.pm-root {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: 6px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-lg);
  box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.25);
}

.pm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--ct-radius-sm);
  cursor: pointer;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg);
  text-align: left;
  transition: background-color 100ms var(--ct-ease), color 100ms var(--ct-ease);
}
.pm-item:hover { background: var(--ct-surface-2); }
.pm-item.active {
  background: color-mix(in srgb, var(--ct-primary) 12%, transparent);
  color: var(--ct-primary);
}
.pm-item.pro .pm-label { color: var(--ct-fg-muted); }

.pm-label { flex: 1; min-width: 0; }

.pm-pro,
.pm-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--ct-fg-subtle);
}
.pm-item.active .pm-check { color: var(--ct-primary); }
.pm-pro i { font-size: 13px; }
</style>
