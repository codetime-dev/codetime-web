<script setup lang="ts">
import * as Plot from '@observablehq/plot'

const props = defineProps<{
  data: {
    date: Date
    duration: number
    by?: string
  }[]
  yLabel: string
}>()
const t = useI18N()
const differentLabel = computed(() => {
  const differentLanguages = new Set<string | undefined>()
  const differentDates = new Set<string>()
  for (const d of props.data) {
    differentLanguages.add(d.by)
    differentDates.add(d.date.toISOString().slice(0, 10))
  }
  return { differentDates, differentLanguages }
})

const completeData = computed(() => {
  const dataMap = new Map<string, number>()

  // Fill existing data
  for (const d of props.data) {
    const key = `${d.date.toISOString().slice(0, 10)}_${d.by}`
    dataMap.set(key, d.duration)
  }

  // Generate complete data with 0 values for missing combinations
  const result: { date: Date, duration: number, by?: string }[] = []
  for (const dateStr of differentLabel.value.differentDates) {
    for (const by of differentLabel.value.differentLanguages) {
      const key = `${dateStr}_${by}`
      const duration = dataMap.get(key) || 0
      result.push({
        date: new Date(dateStr),
        duration,
        by,
      })
    }
  }

  return result
})
const chart = ref()
const { width } = useElementBounding(chart)

const options = computed<Plot.PlotOptions>(() => {
  const o: Plot.PlotOptions = {
    className: 'y-dot-plot',
    opacity: {
      type: 'sqrt',
      range: [0.08, 1],
    },
    marginTop: 12,
    marginRight: 24,
    marginLeft: 8,
    marginBottom: 28,
    y: {
      ariaLabel: props.yLabel,
      label: null,
      axis: false,
      padding: 0.18,
    },
    x: {
      tickSize: 4,
      label: null,
      ticks: Math.max(3, Math.min(10, Math.floor(width.value / 120))),
      interval: 'day',
    },
    marks: [
      // Heatmap cells — equal-sized rectangles, color encodes duration.
      // Empty cells — flat surface tint so missing days remain visible.
      Plot.cell(completeData.value, {
        x: 'date',
        y: 'by',
        fill: 'var(--ct-surface-2)',
        inset: 1.5,
      }),
      Plot.cell(completeData.value.filter(d => d.duration > 0), {
        x: 'date',
        y: 'by',
        fill: 'var(--ct-primary)',
        fillOpacity: 'duration',
        inset: 1.5,
        tip: {
          fontSize: 12,
          channels: {
            by: {
              label: props.yLabel,
              value: d => getLanguageName(d.by),
            },
            duration: {
              label: t.value.plot.label.duration,
              value: d => getDurationString(d.duration * 60 * 1000),
            },
            date: {
              label: t.value.plot.label.date,
              value: d => d.date.toISOString().slice(0, 10),
            },
          },
          format: { fill: false, x: false, y: false },
        },
      }),
      // Right-anchored labels with surface-colored halo so they read
      // cleanly when overlapping cells.
      Plot.axisY({
        anchor: 'right',
        textAnchor: 'end',
        fill: 'var(--ct-fg)',
        textStroke: 'var(--ct-surface)',
        textStrokeWidth: 4,
        ariaLabel: props.yLabel,
        tickFormat: (d: string) => getLanguageName(d),
        tickPadding: -8,
        tickSize: 0,
      }),
    ],
  }
  return o
})
</script>

<template>
  <PoltChart
    ref="chart"
    :options="options"
  />
</template>

<style lang="css">
.y-dot-plot {
  font-size: 14px;
}
</style>
