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
        <span class="text-[12px] text-ct-fg-muted tracking-[0.14em] font-mono tabular-nums">{{ kpi.index }}</span>
        <i v-if="kpi.icon" :class="kpi.icon" class="text-sm text-ct-fg-muted shrink-0" />
        <span class="text-[13px] text-ct-fg-muted tracking-[0.14em] font-mono uppercase">{{ kpi.label }}</span>
      </div>
      <div class="flex gap-1 items-baseline">
        <span
          class="text-[28px] leading-none font-mono tabular-nums"
          :class="kpi.accent ? 'text-primary' : 'text-ct-fg'"
        >{{ kpi.value }}</span>
        <span v-if="kpi.unit" class="text-[13px] text-ct-fg-muted font-mono">{{ kpi.unit }}</span>
      </div>
      <div v-if="kpi.caption" class="text-[12px] text-ct-fg-muted font-mono truncate">
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
  border-right: 1px solid var(--ct-border);
  border-bottom: 1px solid var(--ct-border);
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
    border-right: 1px solid var(--ct-border);
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
    border-bottom: 1px solid var(--ct-border);
  }
}

@media (max-width: 520px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .kpi-cell {
    border-right: none !important;
    border-bottom: 1px solid var(--ct-border);
  }
  .kpi-cell:last-child {
    border-bottom: none;
  }
}
</style>
