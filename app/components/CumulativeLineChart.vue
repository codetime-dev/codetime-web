<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'

const props = defineProps<{
  data: MaybeRef<{
    duration: number
    date: Date
  }[]>
  loading: boolean
}>()

const t = useI18N()
const data = computed(() => unref(props.data))
const chart = ref()
const { width, height } = useElementBounding(chart)

// Calculate averages for the two time periods
const quarterAverages = computed(() => {
  if (!data.value || data.value.length === 0) {
    return { recent: 0, earlier: 0, percentChange: 0, isIncrease: false }
  }

  // Sort data by date
  const sortedData = data.value.toSorted((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate split point - 3/4 of the way through the time range
  const splitIndex = Math.floor(sortedData.length * 0.75)

  // Split the data
  const earlierData = sortedData.slice(0, splitIndex)
  const recentData = sortedData.slice(splitIndex - 1)

  // Calculate averages
  const earlierAvg = earlierData.length > 0
    ? earlierData.reduce((sum, d) => sum + d.duration, 0) / earlierData.length
    : 0

  const recentAvg = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.duration, 0) / recentData.length
    : 0

  // Calculate percentage change
  const percentChange = earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100
  const isIncrease = recentAvg >= earlierAvg

  return {
    earlier: earlierAvg,
    recent: recentAvg,
    earlierData,
    recentData,
    percentChange,
    isIncrease,
  }
})

// Dynamic colors based on trend direction
const colors = computed(() => {
  const isIncrease = quarterAverages.value.isIncrease
  return {
    recentColor: isIncrease ? 'var(--color-success-1)' : 'var(--color-error-1)',
    earlierColor: isIncrease ? 'var(--color-error-1)' : 'var(--color-success-1)',
  }
})

// Format percentage for display
const formattedPercentChange = computed(() => {
  const value = Math.abs(quarterAverages.value.percentChange).toFixed(1)
  const prefix = quarterAverages.value.isIncrease ? '▲ ' : '▼ '
  return `${prefix}${value}%`
})

const options = computed<PlotOptions>(() => ({
  w: width.value,
  h: height.value,
  x: {
    interval: 'day',
  },
  padding: 0,
  marginLeft: 8,
  marginRight: 22,
  y: {
    grid: true,
    nice: true,
    axis: 'right',
    label: t.value.plot.label.timeHour,
    tickFormat: (d: number) => d3.format(',d')(d / 60),
  },
  marks: [
    Plot.dotY(data.value, { x: 'date', y: 'duration', fill: 'var(--color-fg-2)', fillOpacity: 0.25 }),
    Plot.lineY(data.value, Plot.windowY({ k: 7, x: 'date', y: 'duration', stroke: 'var(--color-primary-1)', curve: 'natural' })),

    // Earlier 3/4 period average (solid line)
    Plot.ruleY([quarterAverages.value.earlier], {
      stroke: colors.value.earlierColor,
      strokeWidth: 2,
      x1: quarterAverages.value.earlierData?.[0]?.date,
      x2: quarterAverages.value.earlierData?.at(-1)?.date,
    }),

    // Recent 1/4 period average (solid line)
    Plot.ruleY([quarterAverages.value.recent], {
      stroke: colors.value.recentColor,
      strokeWidth: 2,
      x1: quarterAverages.value.recentData?.[0]?.date,
      x2: quarterAverages.value.recentData?.at(-1)?.date,
    }),

    // Percentage change text
    Plot.text(
      [formattedPercentChange.value],
      {
        textAnchor: 'start',
        x: quarterAverages.value.recentData?.[0]?.date || new Date(),
        y: quarterAverages.value.recent + (quarterAverages.value.recent * 0.08),
        fill: colors.value.recentColor,
        fontWeight: 'bold',
        fontSize: 12,
      },
    ),
  ],
}))
</script>

<template>
  <div class="px-3 py-3 relative">
    <PoltChart
      ref="chart"
      :options="options"
    />
    <div
      v-if="loading"
      class="bg-ct-surface-2 inset-0 absolute animate-pulse"
    />
  </div>
</template>
