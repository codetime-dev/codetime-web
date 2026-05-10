<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'

const props = defineProps<{
  history: { duration: number, time: string }[]
  pending?: boolean
}>()

const t = useI18N()

const processed = computed(() => {
  return props.history.map(d => ({
    date: new Date(d.time),
    duration: d.duration,
  }))
})

const yearStartDate = computed(() => d3.utcDay.offset(new Date(), -365))
const yearDays = computed(() => d3.utcDay.range(yearStartDate.value, new Date()))

const yearData = computed(() => {
  const map = new Map<string, number>()
  for (const d of processed.value) {
    const key = d.date.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + d.duration)
  }
  return yearDays.value.map((date) => {
    const key = date.toISOString().slice(0, 10)
    return { date, duration: map.get(key) ?? 0 }
  })
})

const latestWeekDate = computed(() => yearData.value.at(-1)?.date || new Date())

const calendarOptions = computed<PlotOptions>(() => ({
  width: 880,
  height: 130,
  marginTop: 6,
  marginBottom: 6,
  marginLeft: 24,
  x: { axis: null, tickSize: 0 },
  y: {
    tickSize: 0,
    tickFormat: Plot.formatWeekday('en'),
    label: null,
  },
  color: {
    interpolate: (d: number) => {
      if (d === 0) {
        return 'var(--r-surface-background-variant-1-color)'
      }
      return d3.scaleQuantile([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.2, 0.4, 0.6, 0.8, 1].map(d3.interpolateRgb('#5AF2', '#2AF')))(d)
    },
  },
  marks: [
    Plot.cell(yearData.value, {
      fill: 'duration',
      x: d => getWeekDifference(d.date as Date, latestWeekDate.value),
      y: d => (d.date as Date).getUTCDay(),
      tip: {
        channels: {
          date: {
            label: t.value.plot.label.date,
            value: d => (d.date as Date).toISOString().slice(0, 10),
          },
          duration: {
            label: t.value.plot.label.duration,
            value: d => getDurationString(d.duration * 60 * 1000),
          },
        },
        format: { fill: false, x: false, y: false },
      },
      stroke: 'var(--ct-border)',
      strokeOpacity: 0,
      inset: 1.2,
    }),
  ],
}))

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

const hasHistory = computed(() => processed.value.some(d => d.duration > 0))
</script>

<template>
  <div class="space-y-6">
    <!-- Calendar -->
    <div>
      <div class="mb-2.5 flex gap-2 items-baseline justify-between">
        <span class="text-[12px] text-ct-fg-muted tracking-[0.12em] font-mono uppercase">365D · CALENDAR</span>
        <div class="text-[12px] text-ct-fg-muted tracking-[0.08em] font-mono flex gap-1.5 uppercase items-center">
          <span>less</span>
          <span class="bg-ct-surface-1 h-2.5 w-2.5 inline-block" />
          <span class="bg-ct-primary-soft h-2.5 w-2.5 inline-block" />
          <span class="bg-primary/55 h-2.5 w-2.5 inline-block" />
          <span class="bg-primary/80 h-2.5 w-2.5 inline-block" />
          <span class="bg-primary h-2.5 w-2.5 inline-block" />
          <span>more</span>
        </div>
      </div>
      <div class="flex justify-center overflow-x-auto">
        <PoltCalendar :options="calendarOptions" />
      </div>
    </div>

    <!-- Trend -->
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
