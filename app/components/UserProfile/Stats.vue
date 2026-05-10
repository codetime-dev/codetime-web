<script setup lang="ts">
type StatsKpi = {
  index: string
  label: string
  value: string
  unit?: string
  caption?: string
  accent?: boolean
  icon?: string
}

defineProps<{
  kpis: StatsKpi[]
}>()
</script>

<template>
  <div class="kpi-grid">
    <div
      v-for="kpi in kpis"
      :key="kpi.index"
      class="kpi-cell"
    >
      <div class="flex gap-2 items-center">
        <span class="text-surface-dimmed/55 text-[12px] tracking-[0.14em] font-mono tabular-nums">{{ kpi.index }}</span>
        <i v-if="kpi.icon" :class="kpi.icon" class="text-surface-dimmed/55 text-sm shrink-0" />
        <span class="text-[13px] text-surface-dimmed tracking-[0.14em] font-mono uppercase">{{ kpi.label }}</span>
      </div>
      <div class="flex gap-1 items-baseline">
        <span
          class="text-[28px] leading-none font-mono tabular-nums"
          :class="kpi.accent ? 'text-primary' : 'text-surface'"
        >{{ kpi.value }}</span>
        <span v-if="kpi.unit" class="text-surface-dimmed/80 text-[13px] font-mono">{{ kpi.unit }}</span>
      </div>
      <div v-if="kpi.caption" class="text-surface-dimmed/65 text-[12px] font-mono truncate">
        {{ kpi.caption }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.kpi-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 18px 22px 16px;
  border-right: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  transition: background 160ms ease;
}

.kpi-cell:hover {
  background: var(--r-surface-background-variant-1-color);
}

.kpi-cell:nth-child(4n) {
  border-right: none;
}

.kpi-cell:nth-last-child(-n+4) {
  border-bottom: none;
}

@media (max-width: 880px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-cell {
    border-right: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  }
  .kpi-cell:nth-child(2n) {
    border-right: none;
  }
  .kpi-cell:nth-child(4n) {
    border-right: none;
  }
  .kpi-cell:nth-last-child(-n+2) {
    border-bottom: none;
  }
  .kpi-cell:nth-last-child(-n+4):not(:nth-last-child(-n+2)) {
    border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  }
}

@media (max-width: 520px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .kpi-cell {
    border-right: none !important;
    border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  }
  .kpi-cell:last-child {
    border-bottom: none;
  }
}
</style>
