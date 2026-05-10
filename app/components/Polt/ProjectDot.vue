<script setup lang="ts">
import * as Plot from '@observablehq/plot'

const props = defineProps<{
  data: {
    date: Date
    duration: number
    by: string
  }[]
}>()
const t = useI18N()
const differentLanguages = new Set<string>()
const differentDates = new Set<string>()
for (const d of props.data) {
  differentLanguages.add(d.by)
  differentDates.add(d.date.toISOString().slice(0, 10))
}
const chart = ref()
const { width, height } = useElementBounding(chart)

const maxR = computed(() => {
  const v = (Math.min((width.value - 100) / differentDates.size * 1.25, height.value / differentLanguages.size) * 0.6)
  return v === 0 ? 20 : v
})
const options = computed<Plot.PlotOptions>(() => ({
  marginTop: 12,
  marginRight: 96,
  marginLeft: 16,
  marginBottom: 28,
  color: {
    type: 'sqrt',
    range: ['#bae6fd', '#0284c7'],
  },
  y: {
    label: null,
    grid: true,
    axis: 'right',
    ariaLabel: t.value.plot.label.language,
    tickFormat: (d: string) => getLanguageName(d),
    paddingOuter: 0.4,
  },
  x: {
    insetRight: maxR.value,
    insetLeft: maxR.value / 2,
    label: null,
    paddingOuter: 0.2,
    ticks: 6,
  },
  r: { range: [0, maxR.value] },
  marks: [
    Plot.dot(props.data, {
      x: 'date',
      y: 'by',
      r: 'duration',
      fill: 'duration',
      fillOpacity: 0.85,
      stroke: 'var(--ct-surface)',
      strokeWidth: 1,
    }),
    Plot.dot(props.data, Plot.pointer({
      x: 'date',
      y: 'by',
      r: 'duration',
      fill: 'transparent',
      stroke: 'var(--ct-fg)',
      strokeWidth: 1.25,
      tip: {
        fontSize: 12,
        channels: {
          by: {
            label: t.value.plot.label.language,
            value: d => getLanguageName(d.by),
          },
          duration: {
            label: t.value.plot.label.duration,
            value: d => getDurationString(d.duration),
          },
          date: {
            label: t.value.plot.label.date,
            value: d => d.date.toISOString().slice(0, 10),
          },
        },
        format: { fill: false, r: false, x: false, y: false },
      },
    })),
  ],
}))
</script>

<template>
  <PoltChart
    ref="chart"
    :options="options"
  />
</template>
