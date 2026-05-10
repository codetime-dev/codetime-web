<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'

const props = defineProps<{
  history: { duration: number, time: string }[]
  pending?: boolean
}>()

const t = useI18N()

const processed = computed(() => props.history.map(d => ({
  date: new Date(d.time),
  duration: d.duration,
})))

const hasHistory = computed(() => processed.value.some(d => d.duration > 0))

const trendOptions = computed<PlotOptions>(() => ({
  marginLeft: 8,
  marginRight: 36,
  marginTop: 18,
  marginBottom: 36,
  x: { interval: 'day', label: null },
  y: {
    grid: true,
    nice: true,
    axis: 'right',
    label: t.value.plot.label.timeHour,
    tickFormat: (d: number) => d3.format(',d')(d / 60),
  },
  marks: [
    Plot.dotY(processed.value, {
      x: 'date',
      y: 'duration',
      fill: 'var(--r-surface-text-dimmed-color)',
      fillOpacity: 0.25,
      r: 1.6,
    }),
    Plot.lineY(processed.value, Plot.windowY({
      k: 7,
      x: 'date',
      y: 'duration',
      stroke: 'var(--color-primary-1)',
      strokeWidth: 1.6,
      curve: 'monotone-x',
    })),
  ],
}))
</script>

<template>
  <div>
    <div v-if="hasHistory">
      <div class="mb-2.5 flex gap-2 items-baseline">
        <span class="text-[12px] text-ct-fg-muted tracking-[0.12em] font-mono uppercase">DAILY · TREND · 7D-AVG</span>
      </div>
      <div class="h-65 w-full">
        <PoltChart :options="trendOptions" />
      </div>
    </div>
    <div v-if="pending" class="bg-ct-surface-2 h-32 w-full animate-pulse" />
  </div>
</template>

<style scoped>
:deep(.plot) {
  background: transparent !important;
}
</style>
